import asyncio
import sys
import os
from urllib.parse import urlparse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

# Config por defecto (fallback)
from settings.config import env_settings

def build_database_url() -> str:
    """
    Construye la DATABASE_URL priorizando las variables:
      - POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB
      - DATABASE_HOST (opcional, default: 'db' en contenedor, 'localhost' fuera)
    Fallbacks:
      - env var DATABASE_URL
      - env_settings.database_url
    """
    pg_user = os.getenv("POSTGRES_USER")
    pg_pass = os.getenv("POSTGRES_PASSWORD")
    pg_db = os.getenv("POSTGRES_DB")

    # Detectar si corremos dentro de un contenedor
    running_in_docker = os.path.exists("/.dockerenv")

    # Host configurable por env var, con defaults inteligentes
    default_host = "db" if running_in_docker else "localhost"
    pg_host = os.getenv("DATABASE_HOST", os.getenv("PGHOST", default_host))
    pg_port = os.getenv("PGPORT", "5432")

    if pg_user and pg_pass and pg_db:
        return f"postgresql+asyncpg://{pg_user}:{pg_pass}@{pg_host}:{pg_port}/{pg_db}"

    # Fallback 1: usar DATABASE_URL del entorno si existe
    env_url = os.getenv("DATABASE_URL")
    if env_url:
        return env_url

    # Fallback 2: usar settings (pydantic)
    return env_settings.database_url


async def add_saved_column():
    """Add 'saved' column to prediction_dataset table with default False."""

    database_url = build_database_url()

    # Log útil (sin contraseña)
    try:
        parsed = urlparse(database_url)
        safe_netloc = parsed.hostname or "localhost"
        print(f"🔗 Conectando a Postgres en {safe_netloc}:{parsed.port or 5432} / DB={parsed.path.lstrip('/')}")
    except Exception:
        pass

    engine = create_async_engine(database_url)

    try:
        async with engine.begin() as conn:
            print("📦 Verificando tabla y agregando columna 'saved'...")

            await conn.execute(text(
                """
                ALTER TABLE prediction_dataset
                ADD COLUMN IF NOT EXISTS saved BOOLEAN DEFAULT false
                """
            ))

            print("✅ ¡Migración completada con éxito!")
            print("   - Columna 'saved' añadida (Default: False)")

    except Exception as e:
        print(f"❌ Error durante la migración: {e}")
        # Tips comunes
        if "Connection refused" in str(e):
            print("\n💡 Tip: Asegúrate de que el contenedor 'crushing_calculator_db' esté corriendo")
            print("y que el puerto 5432 esté mapeado a tu localhost si corres desde fuera del contenedor.")
        if "password authentication failed" in str(e):
            print("\n🔐 Revisa POSTGRES_USER/POSTGRES_PASSWORD/POSTGRES_DB o DATABASE_URL.")
        raise
    finally:
        await engine.dispose()


if __name__ == "__main__":
    print("=" * 60)
    print("Migración: Agregar columna 'saved' a prediction_dataset")
    print("=" * 60)

    try:
        asyncio.run(add_saved_column())
    except Exception:
        sys.exit(1)