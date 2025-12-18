import os
import subprocess
from urllib.parse import urlparse
from src.settings.config import get_settings

def dump_db():
    try:
        settings = get_settings()
        url = settings.database_url
        
        # Handle asyncpg driver in URL
        if "+asyncpg" in url:
            url = url.replace("+asyncpg", "")
            
        parsed = urlparse(url)
        
        user = parsed.username
        password = parsed.password
        host = parsed.hostname
        port = parsed.port or 5432
        dbname = parsed.path.lstrip('/')
        
        print(f"🔌 Database: {dbname} on {host}:{port} (User: {user})")
        
        output_file = "dofus_db_backup.sql"
        
        # Determine how to run pg_dump
        cmd = []
        env = os.environ.copy()
        
        if host == 'db':
            print("🐳 Detected Docker service 'db'. Using docker-compose...")
            # Use docker-compose to execute pg_dump inside the db container
            cmd = [
                "docker-compose", "exec", "-T", 
                "-e", f"PGPASSWORD={password}",
                "db",
                "pg_dump",
                "-U", user,
                "-d", dbname,
                "--clean", "--if-exists"
            ]
        else:
            print("🖥️  Running pg_dump locally...")
            env["PGPASSWORD"] = password
            cmd = [
                "pg_dump",
                "-h", host,
                "-p", str(port),
                "-U", user,
                "-d", dbname,
                "--clean", "--if-exists"
            ]

        print(f"🚀 Dumping to {output_file}...")
        
        # Run the command and redirect stdout to the file
        with open(output_file, "w") as f:
            subprocess.run(cmd, stdout=f, check=True, env=env)
            
        print(f"✅ Dump successful! Saved to {output_file}")
        
    except ImportError as e:
        print(f"❌ Import Error: {e}")
        print("Make sure you are running this script from the correct environment.")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    dump_db()