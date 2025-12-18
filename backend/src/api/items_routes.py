from typing import List
from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from src.db.database import get_db
from src.models.schemas import ItemDetailsResponse, ItemSearchResponse, ItemCoefficientRequest
from src.models.sql_models import ItemCoefficientHistoryModel, PredictionDataset, IngredientPriceModel, RunePriceModel
from src.services.equipment import get_item_details, search_equipment, get_ingredients_by_filter
from src.services.profit import calculate_profitability
from src.services.calculator import calculate_profit, get_canonical_stat_name
from src.models.schemas import Ingredient, PaginatedProfitResponse, CalculateRequest
from datetime import datetime

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
    lang: str = "es",
    server: str = "Dakal",
    db: AsyncSession = Depends(get_db)
):
    type_list = types.split(",")
    return await calculate_profitability(type_list, min_level, max_level, min_profit, min_craft_cost, page, limit, sort_by, sort_order, db, lang, server)

@router.get("/items/search", response_model=List[ItemSearchResponse])
async def search_items_endpoint(query: str = Query(..., min_length=2), lang: str = "es"):
    return await search_equipment(query, lang)

@router.get("/items/ingredients/filter", response_model=List[Ingredient])
async def get_ingredients_filter(
    types: str = Query(..., description="Comma separated types"),
    min_level: int = 1,
    max_level: int = 200,
    lang: str = "es"
):
    type_list = types.split(",")
    return await get_ingredients_by_filter(type_list, min_level, max_level, lang)

@router.get("/items/{ankama_id}", response_model=ItemDetailsResponse)
async def get_item_details_endpoint(ankama_id: int, lang: str = "es", server: str = "Dakal", db: AsyncSession = Depends(get_db)):
    item = await get_item_details(ankama_id, lang)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    # Fetch latest coefficient
    query = select(ItemCoefficientHistoryModel).where(
        ItemCoefficientHistoryModel.item_id == ankama_id,
        ItemCoefficientHistoryModel.server == server
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
    lang: str = "es",
    server: str = "Dakal",
    db: AsyncSession = Depends(get_db)
):
    # 0. Get Previous Coefficient (Trend) - BEFORE adding new entry
    # Buscamos el último coeficiente registrado para este ítem y servidor
    prev_entry_query = select(ItemCoefficientHistoryModel).where(
        ItemCoefficientHistoryModel.item_id == ankama_id,
        ItemCoefficientHistoryModel.server == server
    ).order_by(desc(ItemCoefficientHistoryModel.created_at)).limit(1)
    
    prev_entry_res = await db.execute(prev_entry_query)
    prev_entry = prev_entry_res.scalar_one_or_none()
    
    previous_coefficient_24h = prev_entry.coefficient if prev_entry else None
    
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

    # 1. Save History
    new_entry = ItemCoefficientHistoryModel(
        item_id=ankama_id,
        coefficient=request.coefficient,
        server=server
    )
    db.add(new_entry)
    
    # 2. Gather Data for PredictionDataset
    try:
        # A. Get Item Details
        item = await get_item_details(ankama_id, lang)
        if not item:
            await db.commit()
            return {"status": "success", "warning": "Item details not found for prediction"}

        # B. Get Prices
        ing_prices_res = await db.execute(select(IngredientPriceModel).where(IngredientPriceModel.server == server))
        ing_prices = {row.IngredientPriceModel.item_id: row.IngredientPriceModel.price for row in ing_prices_res}
        
        rune_prices_res = await db.execute(select(RunePriceModel).where(RunePriceModel.server == server))
        rune_prices = {row.RunePriceModel.rune_name: row.RunePriceModel.price for row in rune_prices_res}

        # C. Calculate Craft Cost
        craft_cost = 0
        if item.recipe:
            for ing in item.recipe:
                price = ing_prices.get(ing.id, 0)
                if price > 0:
                    craft_cost += price * ing.quantity
        
        # D. Calculate Rune Value at Real Coefficient
        rune_value_real = 0
        profit_amount = 0
        has_high_value_rune = False
        dominant_rune_type = "Generic"
        
        if item.stats:
            # 1. Detect High Value Runes (Flag only)
            for stat in item.stats:
                canonical = get_canonical_stat_name(stat.name, lang)
                if stat.value > 0 and canonical in {"PA", "PM", "Alcance", "Crítico"}:
                    has_high_value_rune = True

            # 2. Use Calculator Service to determine dominant rune and value
            # We use the REAL coefficient entered by the user
            calc_req = CalculateRequest(
                item_level=item.level,
                stats=item.stats,
                coefficient=request.coefficient, 
                item_cost=craft_cost,
                rune_prices=rune_prices,
                lang=lang,
                server=server
            )
            
            calc_res = await calculate_profit(calc_req)
            
            # total_estimated_value is the Revenue of the best strategy (Normal or Focus)
            rune_value_real = calc_res.total_estimated_value
            profit_amount = calc_res.net_profit
            
            # Determine dominant rune type based on which strategy yielded more profit
            # If net_profit matches max_focus_profit, it means Focus was selected
            if calc_res.net_profit == calc_res.max_focus_profit and calc_res.best_focus_stat:
                dominant_rune_type = get_canonical_stat_name(calc_res.best_focus_stat, lang)
            else:
                dominant_rune_type = "Mixed"

        # E. Calculate Features
        ratio_profit = (rune_value_real / craft_cost) if craft_cost > 0 else 0
        
        # G. Create Prediction Entry
        now_dt = datetime.now()
        
        pred_entry = PredictionDataset(
            item_id=ankama_id,
            server=server, # CRÍTICO: Contexto macroeconómico
            real_coefficient=request.coefficient,
            craft_cost=craft_cost,
            rune_value_real=rune_value_real, # NOTE: Storing value at REAL coefficient here
            ratio_profit=ratio_profit,
            profit_amount=profit_amount,    # Nuevo: Profit plano
            item_level=item.level,
            item_type=item.type or "Unknown",
            recipe_difficulty=len(item.recipe) if item.recipe else 0,
            
            # Nuevos Features
            has_high_value_rune=has_high_value_rune,
            dominant_rune_type=dominant_rune_type,
            previous_coefficient_24h=previous_coefficient_24h,
            
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
