# AGENTS.md — Dofus Crushing Calculator

## Stack

- **Frontend**: Next.js 16 (React 19, TypeScript, Tailwind CSS v4, shadcn/ui/Radix)
- **Backend**: FastAPI (Python 3.12), async SQLAlchemy + asyncpg
- **Database**: PostgreSQL 15 (Docker)
- **Package managers**: npm (frontend), Poetry (backend)

## Quick commands

```bash
# Development (hot reload, Nginx local on localhost:8080)
docker compose up -d --build

# Production (builds standalone frontend, uses external web_network)
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Frontend only (native, no Docker)
cd frontend && npm run dev      # localhost:3000

# Backend only (native, no Docker, needs running Postgres and .env)
cd backend && poetry install && poetry run python -m src.api.entrypoint
```

## Monorepo layout

- `/frontend` — Next.js app. Standalone Docker output.
- `/backend` — FastAPI app. Entrypoint: `src/api/entrypoint.py`.
- `/scripts` — Deploy, maintenance, and sync helpers.
- `/.env` — Required at repo root. Copy from `.example.env`.

## Frontend specifics

- **Path alias**: `@/*` → `./src/*`
- **i18n**: URL-based (`/es/`, `/en/`, `/fr/`, `/pt/`). Default locale is `es`. Root layout in `src/app/[lang]/layout.tsx`.
- **API proxy (dev)**: `next.config.ts` rewrites `/api/*` via `API_PROXY_TARGET` env var (defaults to `http://127.0.0.1:8000`). In Docker dev it is set to `http://backend:8000`. Public API URL is `NEXT_PUBLIC_API_URL`.
- **Images**: remote host `api.dofusdu.de` is allowlisted.
- **Scripts**: `npm run dev`, `npm run build`, `npm run lint`. No test runner configured.
- **Dead code note**: `frontend/src/proxy.ts` is not imported anywhere; it is not active middleware.

## Backend specifics

- **Entrypoint**: `python -m src.api.entrypoint`
- **Docker startup**: `python -m src.db.create_tables && python -m src.api.entrypoint` — tables are auto-created on start.
- **API prefix**: All routes mounted under `/api`.
- **Config**: `src/settings/config.py` loads from repo-root `.env` via `pydantic-settings`.
- **OCR stack**: OpenCV + Tesseract + pyautogui (system deps installed in Dockerfile).
- **Tests**: `backend/tests/test_execution.py` is a manual async script, not a pytest suite. Run it as a script, not with `pytest`.
- **No Alembic**: schema changes are handled manually or via one-off scripts in `backend/scripts/`.

## Environment variables

Key vars in `.env` (all required for Docker):
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- `ENVIRONMENT` (`development` | `production`)
- `CORS_ORIGINS` (comma-separated)
- `NEXT_PUBLIC_API_URL` (public domain used by frontend build)
- `NGINX_HOST_PORT`

## Docker / deploy

- **Dev vs prod is driven by `ENVIRONMENT` in `.env` and the compose files you use:**
  - **Dev**: `docker compose up` auto-merges `docker-compose.override.yml`, which adds a local Nginx on `localhost:8080`, mounts source volumes for hot reload, and sets `API_PROXY_TARGET=http://backend:8000`.
  - **Prod**: `docker compose -f docker-compose.yml -f docker-compose.prod.yml up` attaches services to the **external** `web_network` for the global Nginx reverse proxy.
- `scripts/deploy.sh` — smart deploy with prod compose. Checks last commit diff and rebuilds only changed services.
- `scripts/update.sh` — simple pull + full rebuild with prod compose (hardcoded server path inside script).
- `scripts/activar_mantenimiento.sh` / `desactivar_mantenimiento.sh` — toggle maintenance mode by writing `backend/config/status.json`.
- `scripts/sync_images.sh` — triggers `POST /api/prices/runes/sync-images?server=<SERVER>` against a running backend.

## Database

- Tables created automatically by `src/db/create_tables.py` on container start.
- Manual migrations and data fixes live in `backend/scripts/` (e.g., `migrate_to_multiserver.py`, `add_saved_column.py`).

## Testing / verification

- Frontend: no automated tests.
- Backend: run the debug script manually from repo root:
  ```bash
  cd backend && python -m tests.test_execution
  ```

## Style / conventions

- Frontend: ESLint 9 with `eslint-config-next` (core-web-vitals + typescript).
- Backend: no formatter/linter configured in `pyproject.toml`.
- Keep i18n strings in `frontend/src/constants/translations.ts`. Server and language contexts reset calculator state on change.
