# Kamaskope — Guía para Claude

## Qué es este proyecto

Kamaskope es una calculadora de "crushing" (rompimiento de objetos) para el MMORPG **Dofus**. Permite a los jugadores calcular la ganancia esperada al romper un objeto y obtener runas, comparando el costo de crafteo versus el valor de las runas obtenidas (con y sin enfoque de rompimiento).

## Stack técnico

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| Backend | FastAPI (Python 3.12) |
| Base de datos | PostgreSQL |
| Infraestructura | Docker Compose, Nginx |
| UI lib | Radix UI + shadcn/ui base |
| Estado | Context API (LanguageContext, RunePriceContext) |

## Comandos principales

```bash
# Desarrollo local (frontend)
cd frontend && npm run dev

# Build de producción
cd frontend && npm run build

# Lint
cd frontend && npm run lint

# Infraestructura completa
docker compose up -d
```

## Estructura de archivos clave

```
frontend/src/
├── app/[lang]/
│   ├── layout.tsx              # Layout principal, fuentes, providers
│   ├── page.tsx                # Entry point de la página
│   └── Calculator.client.tsx  # Componente principal (~900 líneas)
│
├── components/
│   ├── RuneTable.tsx           # Tabla de desglose de runas (tabla central)
│   ├── RecipeEditor.tsx        # Card de costo de receta (ingredientes)
│   ├── RunePriceEditor.tsx     # Tab de precios de runas
│   ├── ResourcePriceEditor.tsx # Tab de precios de recursos
│   ├── ItemSearch.tsx          # Búsqueda de items (autocomplete)
│   └── ui/                    # Componentes base (Button, Card, Input, etc.)
│
├── context/
│   ├── LanguageContext.tsx     # i18n (es/en/fr/pt)
│   └── RunePriceContext.tsx    # Precios de runas + server activo
│
├── lib/
│   ├── api.ts                  # Llamadas al backend
│   └── utils.ts                # formatNumber, formatDate, cn
│
└── constants/
    └── translations.ts         # Strings de i18n
```

## Design System

**Antes de tocar cualquier archivo de UI, leer:** [`docs/design-system.md`](docs/design-system.md)

### Tokens esenciales (modo dark — modo por defecto de la app)

| Propósito | Token CSS | Hex |
|---|---|---|
| Fondo app | `--background` | `#0b1326` |
| Cards | `--card` | `#131b2e` |
| Separadores | `--border` | `#31394d` |
| Texto principal | `--foreground` | `#e2e8f0` |
| Texto secundario | `--muted-foreground` | `#94a3b8` |
| **Acento / Éxito** | `--primary` | `#22c55e` |
| Errores | `--destructive` | `#ef4444` |
| Sin Focus | `--tertiary` | `#afc7ff` |
| Con Focus | `--focus-accent` | `#c084fc` |

### Reglas críticas de UI

1. **No usar colores hardcoded** como `text-green-400`, `bg-slate-800`, `text-blue-700`, etc. Usar siempre tokens semánticos (`text-primary`, `bg-card`, `text-tertiary`).
2. **Números siempre en `font-mono`** (JetBrains Mono).
3. **Cards con `border border-border`** — no `border-none` sobre fondo oscuro.
4. **Radio 16px** para cards (`rounded-2xl`), **8px** para inputs (`rounded-lg`).
5. **Sin Focus = `--tertiary` (azul cielo)**, **Con Focus = `--focus-accent` (violeta)**.

## Convenciones de desarrollo

- El proyecto siempre está en **modo dark** (`<html class="dark">`).
- **i18n**: todos los strings de UI van por `const { t } = useLanguage()`. Las claves están en `translations.ts`.
- **Cálculos**: la lógica de negocio (breakEvenCoeff, liveMetrics, etc.) vive en `Calculator.client.tsx`. No tocar sin entender el flujo completo.
- **Precios**: los precios de runas se guardan en `RunePriceContext` y se persisten en el backend por servidor (Dakal, Brial, etc.).
- **Exos**: los stats exóticos tienen su propio estado `exos[]` separado de `stats[]`. Ambos se combinan en `allStats` para el cálculo.

## Servidores soportados

Dakal, Brial, Draconiros, Hell Mina, Imagiro, Kourial, Mikhal, Orukam, Rafal, Salar, Tal Kasha, Tylezia.

## Idiomas soportados

`es` (español), `en` (inglés), `fr` (francés), `pt` (portugués).
