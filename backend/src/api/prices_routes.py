from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import Dict, List, Optional
from pydantic import BaseModel

from src.db.database import get_db
from src.models.sql_models import RunePriceModel, IngredientPriceModel
from src.services.calculator import buscar_y_obtener_imagen

router = APIRouter(tags=['prices'])

class RunePriceUpdate(BaseModel):
    prices: Dict[str, int]

from datetime import datetime

class RunePriceResponse(BaseModel):
    price: int
    image_url: Optional[str] = None
    updated_at: Optional[datetime] = None

class IngredientPriceResponse(BaseModel):
    price: int
    updated_at: Optional[datetime] = None

class IngredientPriceUpdate(BaseModel):
    item_id: int
    price: int
    name: str = None

@router.get("/prices/runes", response_model=Dict[str, RunePriceResponse])
async def get_rune_prices(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(RunePriceModel))
    runes = result.scalars().all()
    return {rune.rune_name: RunePriceResponse(price=rune.price, image_url=rune.image_url, updated_at=rune.updated_at) for rune in runes}

async def fetch_rune_images_task(db: AsyncSession):
    # This needs a new session if running in background, but for now let's try to use the one provided or create new one
    # Actually background tasks run after response, so dependency injection might be tricky if session is closed.
    # Better to just run it in the endpoint for now or use a proper background task setup with session factory.
    pass


COMMON_RUNES = [
  "Runa Fu", "Runa Inte", "Runa Sue", "Runa Agi",
  "Runa Vi", "Runa Sa", "Runa Ini", "Runa Pod", "Runa Pot",
  "Runa Ga PA", "Runa Ga PM", "Runa Al", "Runa Invo",
  "Runa Cri", "Runa Cu", "Runa Prospe", "Runa Pla", "Runa Hui",
  "Runa Da Neutral", "Runa Da Tierra", "Runa Da Fuego", "Runa Da Agua", "Runa Da Aire",
  "Runa Da", "Runa Da Tram", "Runa Da Cri", "Runa Da Emp", "Runa Da Reen", "Runa Por Tram",
  "Runa Ret PA", "Runa Ret PM", "Runa Re PA", "Runa Re PM",
  "Runa Re Fuego", "Runa Re Aire", "Runa Re Tierra", "Runa Re Agua", "Runa Re Neutral",
  "Runa Re Emp", "Runa Re Cri",
  "Runa Re Fuego Por", "Runa Re Aire Por", "Runa Re Tierra Por", "Runa Re Agua Por", "Runa Re Neutral Por",
  "Runa Da Por He", "Runa Da Por Ar", "Runa Da Por Di", "Runa Da Por CC",
  "Runa Re Por CC", "Runa Re Por Di", "Runa de caza"
]

@router.post("/prices/runes/sync-images")
async def sync_rune_images(background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    # Ensure all common runes exist in DB
    updated_count = 0
    
    for rune_name in COMMON_RUNES:
        # Check if exists
        result = await db.execute(select(RunePriceModel).where(RunePriceModel.rune_name == rune_name))
        rune = result.scalar_one_or_none()
        
        if not rune:
            # Create if missing
            rune = RunePriceModel(rune_name=rune_name, price=0)
            db.add(rune)
            # We need to flush to get the object attached, but we can just keep going
        
        # Fetch image if missing
        if not rune.image_url:
            url = await buscar_y_obtener_imagen(rune_name)
            if url:
                rune.image_url = url
                updated_count += 1
                
    await db.commit()
        
    return {"status": "ok", "updated": updated_count}


@router.post("/prices/runes")
async def update_rune_prices(update: RunePriceUpdate, db: AsyncSession = Depends(get_db)):
    for name, price in update.prices.items():
        # Check if exists
        result = await db.execute(select(RunePriceModel).where(RunePriceModel.rune_name == name))
        rune = result.scalar_one_or_none()
        if rune:
            rune.price = price
        else:
            rune = RunePriceModel(rune_name=name, price=price)
            db.add(rune)
    await db.commit()
    return {"status": "ok"}

@router.get("/prices/ingredients", response_model=Dict[int, IngredientPriceResponse])
async def get_ingredient_prices(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(IngredientPriceModel))
    ingredients = result.scalars().all()
    return {ing.item_id: IngredientPriceResponse(price=ing.price, updated_at=ing.updated_at) for ing in ingredients}

@router.post("/prices/ingredients")
async def update_ingredient_prices(updates: List[IngredientPriceUpdate], db: AsyncSession = Depends(get_db)):
    for update in updates:
        result = await db.execute(select(IngredientPriceModel).where(IngredientPriceModel.item_id == update.item_id))
        ing = result.scalar_one_or_none()
        if ing:
            ing.price = update.price
            if update.name:
                ing.name = update.name
        else:
            ing = IngredientPriceModel(item_id=update.item_id, price=update.price, name=update.name)
            db.add(ing)
    await db.commit()
    return {"status": "ok"}
