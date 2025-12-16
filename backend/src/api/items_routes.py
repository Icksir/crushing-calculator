
from typing import List
from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from src.db.database import get_db
from src.models.schemas import ItemDetailsResponse, ItemSearchResponse, ItemCoefficientRequest
from src.models.sql_models import ItemCoefficientHistoryModel, PredictionDataset, IngredientPriceModel, RunePriceModel
from src.services.equipment import get_item_details, search_equipment, get_ingredients_by_filter
from src.services.profit import calculate_profitability
from src.services.calculator import get_stat_density, get_rune_info
from src.models.schemas import Ingredient, ProfitItem, PaginatedProfitResponse
from datetime import datetime
import math

router = APIRouter(tags=['items'])

@router.get("/items/profit/best", response_model=PaginatedProfitResponse)
async def get_best_profit_items(
    types: str = Query(..., description="Comma separated types"),
    min_level: int = 1,
    max_level: int = 200,
    min_profit: int = 0,
    min_craft_cost: int = 0,
    page: int = 1,
    limit: int = 10,
    sort_by: str = "profit",
    sort_order: str = "desc",
    db: AsyncSession = Depends(get_db)
):
    type_list = types.split(",")
    return await calculate_profitability(type_list, min_level, max_level, min_profit, min_craft_cost, page, limit, sort_by, sort_order, db)

@router.get("/items/search", response_model=List[ItemSearchResponse])
async def search_items_endpoint(query: str = Query(..., min_length=2)):
    return await search_equipment(query)

@router.get("/items/ingredients/filter", response_model=List[Ingredient])
async def get_ingredients_filter(
    types: str = Query(..., description="Comma separated types"),
    min_level: int = 1,
    max_level: int = 200
):
    type_list = types.split(",")
    return await get_ingredients_by_filter(type_list, min_level, max_level)

@router.get("/items/{ankama_id}", response_model=ItemDetailsResponse)
async def get_item_details_endpoint(ankama_id: int, db: AsyncSession = Depends(get_db)):
    item = await get_item_details(ankama_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    # Fetch latest coefficient
    query = select(ItemCoefficientHistoryModel).where(
        ItemCoefficientHistoryModel.item_id == ankama_id
    ).order_by(desc(ItemCoefficientHistoryModel.created_at)).limit(1)
    
    result = await db.execute(query)
    latest_entry = result.scalar_one_or_none()
    
    if latest_entry is not None:
        # Use model_dump() as dict() is deprecated in Pydantic v2
        item_dict = item.model_dump()
        item_dict['last_coefficient'] = latest_entry.coefficient
        item_dict['last_coefficient_date'] = latest_entry.created_at
        item = ItemDetailsResponse(**item_dict)
        
    return item

@router.post("/items/{ankama_id}/coefficient")
async def save_item_coefficient(
    ankama_id: int, 
    request: ItemCoefficientRequest, 
    db: AsyncSession = Depends(get_db)
):
    # 1. Save History
    new_entry = ItemCoefficientHistoryModel(
        item_id=ankama_id,
        coefficient=request.coefficient
    )
    db.add(new_entry)
    
    # 2. Gather Data for PredictionDataset
    try:
        # A. Get Item Details
        item = await get_item_details(ankama_id)
        if not item:
            await db.commit()
            return {"status": "success", "warning": "Item details not found for prediction"}

        # B. Get Prices
        ing_prices_res = await db.execute(select(IngredientPriceModel))
        ing_prices = {row.IngredientPriceModel.item_id: row.IngredientPriceModel.price for row in ing_prices_res}
        
        rune_prices_res = await db.execute(select(RunePriceModel))
        rune_prices = {row.RunePriceModel.rune_name: row.RunePriceModel.price for row in rune_prices_res}

        # C. Calculate Craft Cost
        craft_cost = 0
        if item.recipe:
            for ing in item.recipe:
                price = ing_prices.get(ing.id, 0)
                if price > 0:
                    craft_cost += price * ing.quantity
        
        # D. Calculate Rune Value at 100%
        rune_value_100 = 0
        if item.stats:
            stat_vrs = {}
            total_vr_sum = 0
            item_level = item.level
            
            for stat in item.stats:
                density = get_stat_density(stat.name)
                value = stat.value
                
                if stat.name in {"PA", "PM", "Alcance", "Invocaciones"} and 0 <= value <= 1:
                    value = 1
                if stat.name == "Pods":
                    value = value / 2.5
                
                if value > 0:
                    vr = ((value * density * item_level * 0.0150) + 1)
                else:
                    vr = 0
                
                stat_vrs[stat.name] = vr
                total_vr_sum += vr
            
            max_focus_val = 0
            normal_val = 0
            
            for stat in item.stats:
                rune_info = get_rune_info(stat.name)
                if not rune_info: continue
                
                rune_weight = rune_info["weight"]
                rune_name = rune_info["name"]
                price = rune_prices.get(rune_name, 0)
                
                vr_propio = stat_vrs.get(stat.name, 0)
                
                # Normal (at 100%)
                count_normal = vr_propio / rune_weight
                normal_val += count_normal * price
                
                # Focus (at 100%)
                vr_resto = total_vr_sum - vr_propio
                vr_focus = vr_propio + (0.5 * vr_resto)
                if stat.name == "Pods": vr_focus /= 2.5
                
                count_focus = vr_focus / rune_weight
                focus_val = count_focus * price
                
                if focus_val > max_focus_val:
                    max_focus_val = focus_val
            
            rune_value_100 = max(normal_val, max_focus_val)

        # E. Calculate Features
        ratio_profit = (rune_value_100 / craft_cost) if craft_cost > 0 else 0
        
        # F. Get Previous Update Time
        prev_entry_query = select(ItemCoefficientHistoryModel).where(
            ItemCoefficientHistoryModel.item_id == ankama_id
        ).order_by(desc(ItemCoefficientHistoryModel.created_at)).limit(1)
        
        prev_entry_res = await db.execute(prev_entry_query)
        prev_entry = prev_entry_res.scalar_one_or_none()
        
        days_since = 0.0
        if prev_entry:
            last_time = prev_entry.created_at
            if last_time.tzinfo:
                now = datetime.now(last_time.tzinfo)
            else:
                now = datetime.now()
            diff = now - last_time
            days_since = diff.total_seconds() / 86400.0
        else:
            days_since = -1

        # G. Create Prediction Entry
        now_dt = datetime.now()
        
        pred_entry = PredictionDataset(
            item_id=ankama_id,
            real_coefficient=request.coefficient,
            craft_cost=craft_cost,
            rune_value_100=rune_value_100,
            ratio_profit=ratio_profit,
            item_level=item.level,
            item_type=item.type or "Unknown",
            recipe_difficulty=len(item.recipe) if item.recipe else 0,
            day_of_week=now_dt.weekday(),
            hour_of_day=now_dt.hour,
            days_since_last_update=days_since
        )
        db.add(pred_entry)

    except Exception as e:
        print(f"Error creating prediction dataset entry: {e}")
        pass

    await db.commit()
    return {"status": "success"}
