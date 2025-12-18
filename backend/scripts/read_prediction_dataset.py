import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from settings.config import env_settings

async def read_dataset():

    DATABASE_URL = env_settings.database_url    
    
    engine = create_async_engine(DATABASE_URL, echo=False)
    
    async with engine.begin() as conn:
        print("\n--- Reading Prediction Dataset ---\n")
        
        # Query all columns
        result = await conn.execute(text("SELECT * FROM prediction_dataset ORDER BY created_at DESC LIMIT 20"))
        rows = result.fetchall()
        
        if not rows:
            print("No data found in prediction_dataset table.")
            return

        # Get column names
        keys = list(result.keys())
        
        # Print header
        print(" | ".join(keys))
        print("-" * 150)
        
        for row in rows:
            print(" | ".join(str(val) for val in row))

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(read_dataset())
