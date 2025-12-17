import asyncio
import sys
import os
# Add the parent directory to sys.path to allow imports from src
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.settings.config import get_settings
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def migrate():
    print("🚀 Starting migration to Multi-Server support (PostgreSQL)...")
    
    settings = get_settings()
    database_url = settings.database_url
    engine = create_async_engine(database_url, echo=True)

    async with engine.begin() as conn:
        # 1. Rune Prices
        print("📦 Migrating rune_prices...")
        try:
            # Add server column
            await conn.execute(text("ALTER TABLE rune_prices ADD COLUMN IF NOT EXISTS server VARCHAR DEFAULT 'Dakal' NOT NULL"))
            
            # Drop old PK and add new one
            # We try to drop the constraint by name. If it fails, we might need to inspect.
            # Standard naming convention is table_pkey
            try:
                await conn.execute(text("ALTER TABLE rune_prices DROP CONSTRAINT rune_prices_pkey"))
            except Exception as e:
                print(f"⚠️ Could not drop PK constraint on rune_prices (might not exist or different name): {e}")
            
            await conn.execute(text("ALTER TABLE rune_prices ADD PRIMARY KEY (rune_name, server)"))
            print("✅ rune_prices migrated")
        except Exception as e:
            print(f"❌ Error migrating rune_prices: {e}")

        # 2. Ingredient Prices
        print("📦 Migrating ingredient_prices...")
        try:
            await conn.execute(text("ALTER TABLE ingredient_prices ADD COLUMN IF NOT EXISTS server VARCHAR DEFAULT 'Dakal' NOT NULL"))
            
            try:
                await conn.execute(text("ALTER TABLE ingredient_prices DROP CONSTRAINT ingredient_prices_pkey"))
            except Exception as e:
                print(f"⚠️ Could not drop PK constraint on ingredient_prices: {e}")
                
            await conn.execute(text("ALTER TABLE ingredient_prices ADD PRIMARY KEY (item_id, server)"))
            print("✅ ingredient_prices migrated")
        except Exception as e:
            print(f"❌ Error migrating ingredient_prices: {e}")

        # 3. Item Coefficient History
        print("📦 Migrating item_coefficient_history...")
        try:
            await conn.execute(text("ALTER TABLE item_coefficient_history ADD COLUMN IF NOT EXISTS server VARCHAR DEFAULT 'Dakal'"))
            await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_item_coefficient_history_server ON item_coefficient_history (server)"))
            print("✅ item_coefficient_history migrated")
        except Exception as e:
            print(f"❌ Error migrating item_coefficient_history: {e}")

    print("🎉 Migration completed!")

if __name__ == "__main__":
    asyncio.run(migrate())
