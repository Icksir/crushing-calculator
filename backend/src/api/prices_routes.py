from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import Dict, List, Optional
from pydantic import BaseModel

from src.db.database import get_db
from src.models.sql_models import RunePriceModel, IngredientPriceModel
from src.services.calculator import RUNE_DB, buscar_y_obtener_imagen, get_rune_name_translation, get_canonical_rune_name

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
async def get_rune_prices(lang: str = "es", server: str = "Dakal", db: AsyncSession = Depends(get_db)):
    # Ensure all valid runes exist for this server, initializing to 0 if not
    valid_rune_names_es = {
        data["name"]["es"]
        for stat_data in RUNE_DB.values()
        for data in stat_data
    }
    
    added_any = False
    for rune_name in valid_rune_names_es:
        result = await db.execute(select(RunePriceModel).where(RunePriceModel.rune_name == rune_name, RunePriceModel.server == server))
        rune = result.scalar_one_or_none()
        if not rune:
            rune = RunePriceModel(rune_name=rune_name, price=0, server=server)
            db.add(rune)
            added_any = True
    
    if added_any:
        await db.commit()
    
    # Now fetch all runes for this server
    result = await db.execute(select(RunePriceModel).where(RunePriceModel.server == server))
    runes = result.scalars().all()
    
    # Build image dict from current server
    image_dict = {rune.rune_name: rune.image_url for rune in runes if rune.image_url}
    
    # For runes without images, get images from other servers
    missing_runes = [rune.rune_name for rune in runes if not rune.image_url]
    if missing_runes:
        result_all = await db.execute(
            select(RunePriceModel).where(
                RunePriceModel.rune_name.in_(missing_runes),
                RunePriceModel.image_url.isnot(None)
            )
        )
        all_runes = result_all.scalars().all()
        for rune in all_runes:
            if rune.rune_name not in image_dict:
                image_dict[rune.rune_name] = rune.image_url
    
    return {
        get_rune_name_translation(rune.rune_name, lang): RunePriceResponse(
            price=rune.price, 
            image_url=rune.image_url or image_dict.get(rune.rune_name),
            updated_at=rune.updated_at
        ) 
        for rune in runes
    }

async def fetch_rune_images_task(db: AsyncSession):
    # This needs a new session if running in background, but for now let's try to use the one provided or create new one
    # Actually background tasks run after response, so dependency injection might be tricky if session is closed.
    # Better to just run it in the endpoint for now or use a proper background task setup with session factory.
    pass


@router.post("/prices/runes/sync-images")
async def sync_rune_images(background_tasks: BackgroundTasks, server: str = "Dakal", db: AsyncSession = Depends(get_db)):
    # --- NEW: Get all valid Spanish rune names from RUNE_DB ---
    valid_rune_names_es = {
        data["name"]["es"]
        for stat_data in RUNE_DB.values()
        for data in stat_data
    }

    # --- 1. Delete invalid entries from the database ---
    result = await db.execute(select(RunePriceModel).where(RunePriceModel.server == server))
    all_runes_in_db = result.scalars().all()
    deleted_count = 0
    for rune in all_runes_in_db:
        if rune.rune_name not in valid_rune_names_es:
            await db.delete(rune)
            deleted_count += 1
            print(f"🗑️ Eliminando entrada inválida: {rune.rune_name}")
    
    if deleted_count > 0:
        await db.commit() # Commit deletions

    # --- 2. Ensure all valid runes exist and sync images ---
    updated_count = 0
    for rune_name in valid_rune_names_es:
        result = await db.execute(select(RunePriceModel).where(RunePriceModel.rune_name == rune_name, RunePriceModel.server == server))
        rune = result.scalar_one_or_none()
        
        if not rune:
            rune = RunePriceModel(rune_name=rune_name, price=0, server=server)
            db.add(rune)
        
        # We will now always re-fetch the image to ensure it is correct
        url = await buscar_y_obtener_imagen(rune_name, lang="es") # Search in Spanish for consistency
        if url and rune.image_url != url:
            rune.image_url = url
            updated_count += 1
                
    await db.commit()
        
    return {"status": "ok", "updated": updated_count, "deleted": deleted_count}


@router.post("/prices/runes")
async def update_rune_prices(update: RunePriceUpdate, lang: str = "es", server: str = "Dakal", db: AsyncSession = Depends(get_db)):
    for name, price in update.prices.items():
        canonical_name = get_canonical_rune_name(name, lang)
        
        # --- NEW: Validate that it is a real rune ---
        is_real_rune = any(
            data.get("name", {}).get("es") == canonical_name
            for stat_data in RUNE_DB.values()
            for data in stat_data
        )
        
        if not is_real_rune:
            print(f"⚠️ Ignorando '{name}' (canónico: '{canonical_name}') porque no es una runa válida.")
            continue # Skip if it's not a real rune

        result = await db.execute(select(RunePriceModel).where(RunePriceModel.rune_name == canonical_name, RunePriceModel.server == server))
        rune = result.scalar_one_or_none()
        if rune:
            rune.price = price
        else:
            rune = RunePriceModel(rune_name=canonical_name, price=price, server=server)
            db.add(rune)
            
    await db.commit()
    return {"status": "ok"}

@router.get("/prices/ingredients", response_model=Dict[int, IngredientPriceResponse])
async def get_ingredient_prices(server: str = "Dakal", db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(IngredientPriceModel).where(IngredientPriceModel.server == server))
    ingredients = result.scalars().all()
    return {ing.item_id: IngredientPriceResponse(price=ing.price, updated_at=ing.updated_at) for ing in ingredients}

@router.post("/prices/ingredients")
async def update_ingredient_prices(updates: List[IngredientPriceUpdate], server: str = "Dakal", db: AsyncSession = Depends(get_db)):
    for update in updates:
        result = await db.execute(select(IngredientPriceModel).where(IngredientPriceModel.item_id == update.item_id, IngredientPriceModel.server == server))
        ing = result.scalar_one_or_none()
        if ing:
            ing.price = update.price
            if update.name:
                ing.name = update.name
        else:
            ing = IngredientPriceModel(item_id=update.item_id, price=update.price, name=update.name, server=server)
            db.add(ing)
    await db.commit()
    return {"status": "ok"}
