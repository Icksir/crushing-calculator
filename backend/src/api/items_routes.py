
from typing import List
from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from src.db.database import get_db
from src.models.schemas import ItemDetailsResponse, ItemSearchResponse, ItemCoefficientRequest
from src.models.sql_models import ItemCoefficientHistoryModel
from src.services.equipment import get_item_details, search_equipment, get_ingredients_by_filter
from src.services.profit import calculate_profitability
from src.models.schemas import Ingredient, ProfitItem

router = APIRouter()

@router.get("/items/profit/best", response_model=List[ProfitItem])
async def get_best_profit_items(
    types: str = Query(..., description="Comma separated types"),
    min_level: int = 1,
    max_level: int = 200,
    min_profit: int = 0,
    db: AsyncSession = Depends(get_db)
):
    type_list = types.split(",")
    return await calculate_profitability(type_list, min_level, max_level, min_profit, db)

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
    query = select(ItemCoefficientHistoryModel.coefficient).where(
        ItemCoefficientHistoryModel.item_id == ankama_id
    ).order_by(desc(ItemCoefficientHistoryModel.created_at)).limit(1)
    
    result = await db.execute(query)
    latest_coeff = result.scalar_one_or_none()
    
    if latest_coeff is not None:
        item.last_coefficient = latest_coeff
        
    return item

@router.post("/items/{ankama_id}/coefficient")
async def save_item_coefficient(
    ankama_id: int, 
    request: ItemCoefficientRequest, 
    db: AsyncSession = Depends(get_db)
):
    new_entry = ItemCoefficientHistoryModel(
        item_id=ankama_id,
        coefficient=request.coefficient
    )
    db.add(new_entry)
    await db.commit()
    return {"status": "success"}
