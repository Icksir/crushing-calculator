from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from src.ocr.ocr import get_ocr_data
from src.services.equipment import search_resource
from src.db.database import get_db
from src.models.sql_models import IngredientPriceModel

router = APIRouter(tags=['ocr'])

@router.post("/scan")
async def scan_market(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    """
    Triggers the OCR process on the uploaded image.
    Returns the detected item name and prices.
    Calculates average unit price and updates the database if item is found.
    """
    try:
        contents = await file.read()
        data = get_ocr_data(image_bytes=contents, verbose=False)
        if "error" in data:
            raise HTTPException(status_code=500, detail=data["error"])
            
        # Process prices
        prices = data.get("precios_mercado", {})
        if prices:
            unit_prices = []
            for lot, price in prices.items():
                try:
                    quantity = int(lot.replace('x', ''))
                    if quantity > 0:
                        unit_prices.append(price / quantity)
                except ValueError:
                    continue
            
            if unit_prices:
                avg_unit_price = int(sum(unit_prices) / len(unit_prices))
                data["precio_promedio"] = avg_unit_price

                # Search for item ID and update DB
                item_name = data.get("nombre_objeto")
                if item_name and item_name != "Desconocido/No detectado":
                    # Clean up name if needed (sometimes OCR leaves trailing chars)
                    clean_name = item_name.strip()
                    item_id = await search_resource(clean_name)
                    
                    if item_id:
                        data["item_id"] = item_id
                        
                        # Update DB
                        result = await db.execute(select(IngredientPriceModel).where(IngredientPriceModel.item_id == item_id))
                        ingredient = result.scalar_one_or_none()
                        
                        if ingredient:
                            ingredient.price = avg_unit_price
                        else:
                            ingredient = IngredientPriceModel(item_id=item_id, price=avg_unit_price)
                            db.add(ingredient)
                        
                        await db.commit()
                        data["db_updated"] = True
                        print(f"✅ [OCR] Base de datos actualizada: {clean_name} (ID: {item_id}) -> {avg_unit_price} kamas")
                    else:
                        data["db_updated"] = False
                        data["error_search"] = "Item not found in API"
                        print(f"❌ [OCR] No se pudo actualizar BD: Item '{clean_name}' no encontrado en API")
                else:
                     print("❌ [OCR] No se detectó nombre válido para actualizar BD")
        
        return data
    except Exception as e:
        print(f"❌ [OCR] Error interno: {e}")
        raise HTTPException(status_code=500, detail=str(e))
