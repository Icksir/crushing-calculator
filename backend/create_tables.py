import asyncio
from src.db.database import engine, Base
from src.models.sql_models import PredictionDataset

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Tables created successfully.")

if __name__ == "__main__":
    asyncio.run(init_db())
