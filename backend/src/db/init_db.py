import asyncio
from db.database import engine, Base
# Import models so they are registered with Base
from models.sql_models import RunePriceModel, IngredientPriceModel, ItemCoefficientHistoryModel

async def init_models():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Tables created successfully.")

if __name__ == "__main__":
    asyncio.run(init_models())
