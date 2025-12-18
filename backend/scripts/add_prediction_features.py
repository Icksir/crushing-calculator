"""
Migration script to add new feature columns to prediction_dataset table.
Adds:
  - server (String, indexed) - for server-specific economic context
  - has_high_value_rune (Boolean) - to distinguish PA/PM/Alcance items from others
  - dominant_rune_type (String) - "PA", "PM", "Alcance", "Generic"
  - previous_coefficient_24h (Float) - Trend signal
"""

import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from settings.config import env_settings

async def add_columns():
    # Detect database connection
    # Try docker-compose database first
    DATABASE_URL = env_settings.database_url
    
    engine = create_async_engine(DATABASE_URL, echo=True)
    
    async with engine.begin() as conn:
        # 1. Add server column
        print("\n[1/4] Adding 'server' column...")
        await conn.execute(text("""
            ALTER TABLE prediction_dataset
            ADD COLUMN IF NOT EXISTS server VARCHAR DEFAULT 'Dakal'
        """))
        
        print("[1b] Creating index on server column...")
        await conn.execute(text("""
            CREATE INDEX IF NOT EXISTS ix_prediction_dataset_server
            ON prediction_dataset(server)
        """))
        
        # 2. Add has_high_value_rune column
        print("\n[2/4] Adding 'has_high_value_rune' column...")
        await conn.execute(text("""
            ALTER TABLE prediction_dataset
            ADD COLUMN IF NOT EXISTS has_high_value_rune BOOLEAN DEFAULT false
        """))
        
        # 3. Add dominant_rune_type column
        print("\n[3/4] Adding 'dominant_rune_type' column...")
        await conn.execute(text("""
            ALTER TABLE prediction_dataset
            ADD COLUMN IF NOT EXISTS dominant_rune_type VARCHAR DEFAULT 'Generic'
        """))
        
        # 4. Add previous_coefficient_24h column
        print("\n[4/5] Adding 'previous_coefficient_24h' column...")
        await conn.execute(text("""
            ALTER TABLE prediction_dataset
            ADD COLUMN IF NOT EXISTS previous_coefficient_24h FLOAT
        """))

        # 5. Add profit_amount column
        print("\n[5/6] Adding 'profit_amount' column...")
        await conn.execute(text("""
            ALTER TABLE prediction_dataset
            ADD COLUMN IF NOT EXISTS profit_amount FLOAT DEFAULT 0
        """))

        # 6. Rename rune_value_100 to rune_value_real
        print("\n[6/6] Renaming 'rune_value_100' to 'rune_value_real'...")
        # Check if column exists before renaming to avoid errors if run multiple times
        await conn.execute(text("""
            DO $$
            BEGIN
              IF EXISTS(SELECT *
                FROM information_schema.columns
                WHERE table_name='prediction_dataset' and column_name='rune_value_100')
              THEN
                  ALTER TABLE prediction_dataset RENAME COLUMN rune_value_100 TO rune_value_real;
              END IF;
            END $$;
        """))
        
        print("\n✅ Migration completed successfully!")
        print("\nNew schema for prediction_dataset:")
        print("  - server (VARCHAR, indexed): Server-specific economic context")
        print("  - has_high_value_rune (BOOLEAN): Distinguishes PA/PM/Alcance items")
        print("  - dominant_rune_type (VARCHAR): Categorical rune type (PA, PM, Alcance, Generic)")
        print("  - previous_coefficient_24h (FLOAT): Trend signal (last known coefficient)")
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(add_columns())
