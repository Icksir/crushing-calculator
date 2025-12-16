# Dofus Crushing Calculator

Este proyecto es una calculadora de rompimiento de objetos para Dofus 3.4 (Unity). Permite calcular la rentabilidad de romper objetos para obtener runas, gestionar precios de recursos y runas, y buscar recetas rentables.

El proyecto está dividido en dos partes:
- **Backend**: API REST construida con Python (FastAPI).
- **Frontend**: Interfaz de usuario construida con Next.js y React.

## Estructura del Proyecto

```
/
├── backend/            # Código fuente del backend (Python/FastAPI)
├── frontend/           # Código fuente del frontend (Next.js/React)
├── .gitignore          # Archivos ignorados por git
└── README.md           # Este archivo
```

## Requisitos Previos

- **Python 3.12+**
- **Node.js 18+**
- **Poetry** (para gestión de dependencias de Python)
- **npm** o **yarn** (para gestión de dependencias de Node.js)

## Configuración e Instalación

### Backend

1.  Navega al directorio `backend`:
    ```bash
    cd backend
    ```

2.  Instala las dependencias usando Poetry:
    ```bash
    poetry install
    ```

3.  Configura las variables de entorno (crea un archivo `.env` basado en el ejemplo si existe, o configura las variables necesarias como `DEBUG`, `HOST`, `PORT`, `CORS_ORIGINS`).

4.  Ejecuta el servidor de desarrollo:
    ```bash
    poetry run python -m src.api.entrypoint
    # O si usas el script definido en pyproject.toml (si existe)
    # poetry run start
    ```
    El backend estará corriendo generalmente en `http://localhost:8000`.

### Frontend

1.  Navega al directorio `frontend`:
    ```bash
    cd frontend
    ```

2.  Instala las dependencias:
    ```bash
    npm install
    # o
    yarn install
    ```

3.  Ejecuta el servidor de desarrollo:
    ```bash
    npm run dev
    # o
    yarn dev
    ```
    El frontend estará disponible en `http://localhost:3000`.

## Características Principales

- **Búsqueda de Objetos**: Busca equipamiento de Dofus utilizando la API de DofusDude.
- **Cálculo de Rompimiento**: Calcula las runas obtenidas al romper un objeto basándose en sus stats y el coeficiente de rompimiento.
- **Gestión de Precios**:
    - Precios de Ingredientes: Actualiza los precios de los recursos para calcular el costo de crafteo.
    - Precios de Runas: Actualiza los precios de las runas para calcular el valor obtenido.
- **Análisis de Rentabilidad**: Encuentra los mejores objetos para craftear y romper basándose en el costo de los ingredientes y el valor de las runas.
- **OCR (Experimental)**: Funcionalidades para leer datos desde capturas de pantalla (usando OpenCV y Tesseract).

## Tecnologías Utilizadas

- **Backend**: FastAPI, HTTPX, SQLAlchemy, AsyncPG, OpenCV, Pytesseract.
- **Frontend**: Next.js, React, Tailwind CSS, Lucide React, Radix UI.
- **API Externa**: [DofusDude API](https://api.dofusdu.de/)

## Contribución

Si deseas contribuir, por favor crea un fork del repositorio y envía un Pull Request con tus mejoras.

## Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más detalles.
