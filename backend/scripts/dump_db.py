import os
import subprocess
from urllib.parse import urlparse
from src.settings.config import get_settings

def dump_db():
    try:
        settings = get_settings()
        url = settings.database_url
        
        # Limpiar driver asyncpg si existe
        if "+asyncpg" in url:
            url = url.replace("+asyncpg", "")
            
        parsed = urlparse(url)
        
        user = parsed.username
        password = parsed.password
        # El host suele ser 'localhost' si corres el script fuera de Docker
        # o el nombre del servicio si corres el script dentro de la red de Docker
        host = parsed.hostname
        port = parsed.port or 5432
        dbname = parsed.path.lstrip('/')
        
        # NOMBRE DEL CONTENEDOR SEGÚN TU `docker ps`
        container_name = "crushing_calculator_db"
        output_file = "dofus_db_backup.sql"

        print(f"🔌 Intentando volcado de: {dbname} desde el contenedor {container_name}")

        # Comando para ejecutar pg_dump DENTRO del contenedor de Docker
        # Esto evita que necesites tener instalado postgres-client en tu PC local
        cmd = [
            "docker", "exec", "-t",
            "-e", f"PGPASSWORD={password}",
            container_name,
            "pg_dump",
            "-U", user,
            "-d", dbname,
            "--clean",
            "--if-exists"
        ]

        print(f"🚀 Ejecutando backup en {output_file}...")
        
        with open(output_file, "w", encoding="utf-8") as f:
            # Ejecutamos el comando de docker directamente
            subprocess.run(cmd, stdout=f, check=True)
            
        print(f"✅ ¡Dump exitoso! Guardado en {output_file}")
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Error de Docker/Postgres: {e}")
    except Exception as e:
        print(f"❌ Error inesperado: {e}")

if __name__ == "__main__":
    dump_db()