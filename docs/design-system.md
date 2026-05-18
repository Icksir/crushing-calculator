# Kamaskope — Design System

## Visión general

Kamaskope es una calculadora de crushing (rompimiento de objetos) para Dofus. La identidad visual refleja el universo del juego: fondos azul marino oscuro con acento verde Dofus, tipografía moderna y datos numéricos legibles con fuente monoespaciada.

**Principios de diseño:**
- **Claridad numérica**: los datos financieros (kamas, coeficientes, totales) siempre en fuente mono.
- **Jerarquía de datos**: el beneficio es el dato más importante — destacado en verde primary.
- **Acento en éxito**: `--primary` (#22c55e) para ganancias, mínimo coeficiente favorable, y el mejor escenario.
- **Semántica de columnas**: Sin Focus = `--tertiary` (azul cielo), Con Focus = `--focus-accent` (violeta).
- **Modo oscuro como modo principal**: la app siempre está en modo dark.

---

## Tokens de diseño

Los tokens viven en `frontend/src/app/globals.css` dentro del bloque `.dark {}` y se exportan a Tailwind vía `@theme inline`.

### Colores

| Token CSS | Valor Hex | Clase Tailwind | Uso |
|---|---|---|---|
| `--background` | `#0b1326` | `bg-background` | Fondo de pantalla completa |
| `--card` | `#131b2e` | `bg-card` | Fondo de cards y contenedores principales |
| `--popover` | `#171f33` | `bg-popover` | Dropdowns, tooltips, popovers |
| `--muted` | `#171f33` | `bg-muted` | Sub-fondos, secciones secundarias |
| `--secondary` | `#222a3d` | `bg-secondary` | Chips, inputs internos |
| `--accent` | `#222a3d` | `bg-accent` | Hover de items en menús |
| `--border` | `#31394d` | `border-border` | Separadores, bordes de cards e inputs |
| `--input` | `#222a3d` | `bg-input` | Fondo de inputs |
| `--foreground` | `#e2e8f0` | `text-foreground` | Texto principal |
| `--muted-foreground` | `#94a3b8` | `text-muted-foreground` | Labels, texto secundario, placeholders |
| `--primary` | `#22c55e` | `text-primary`, `bg-primary` | Acento / Éxito / Beneficio positivo |
| `--primary-foreground` | `#0b1326` | `text-primary-foreground` | Texto sobre fondos primary |
| `--destructive` | `#ef4444` | `text-destructive`, `bg-destructive` | Errores, stats negativos, pérdidas |
| `--ring` | `#22c55e` | `ring-ring` | Focus ring de inputs |
| `--tertiary` | `#afc7ff` | `text-tertiary`, `bg-tertiary` | Columna "Sin Focus" |
| `--focus-accent` | `#c084fc` | `text-focus-accent`, `bg-focus-accent` | Columna "Con Focus" |

### Radios de borde

| Token CSS | Valor | Clase Tailwind | Uso |
|---|---|---|---|
| `--radius` | `1rem` (16px) | `rounded-2xl` | Cards, contenedores principales |
| `--radius-lg` | `1rem` (16px) | `rounded-lg` | Inputs, badges, botones |
| `--radius-md` | `0.75rem` (12px) | `rounded-md` | Elementos intermedios |
| `--radius-sm` | `0.5rem` (8px) | `rounded-sm` | Chips pequeños |

> **Regla principal:** todas las cards usan 16px (`rounded-2xl`). Todos los inputs usan `rounded-lg`.

---

## Tipografía

| Fuente | Variable CSS | Clase Tailwind | Uso |
|---|---|---|---|
| **Hanken Grotesk** | `--font-hanken-grotesk` | `font-sans` | Texto general, títulos, UI |
| **JetBrains Mono** | `--font-jetbrains-mono` | `font-mono` | Números, kamas, cantidades, totales, labels numéricos |

**Pesos usados:**
- 400 — cuerpo de texto
- 600 — títulos de sección, labels destacados
- 700 — títulos principales, totales más importantes

**Escala de tamaños clave:**
- `text-xs` + `font-mono uppercase tracking-wider` — micro labels de sección ("SIN FOCUS", "TOTAL", "KAMAS")
- `text-sm` — cuerpo de tabla, texto secundario
- `text-base` / `text-lg` — contenido principal de celdas
- `text-2xl font-bold` — títulos de sección (Desglose de Runas)
- `text-3xl font-extrabold` — nombre del item
- `text-5xl font-black` — beneficio estimado (dato más prominente)

---

## Componentes UI base

Todos en `frontend/src/components/ui/`.

### Card
**Archivo:** [card.tsx](../frontend/src/components/ui/card.tsx)

```tsx
<Card>                    // bg-card rounded-2xl border border-border shadow-sm
  <CardHeader>           // px-6, con border-b border-border cuando se usa
  <CardTitle>
  <CardContent>          // px-6
  <CardFooter>
</Card>
```

### Input / NumericInput
**Archivos:** [input.tsx](../frontend/src/components/ui/input.tsx), [numeric-input.tsx](../frontend/src/components/ui/numeric-input.tsx)

- Fondo: `bg-input/30` (dark)
- Borde: `border-input`
- Radio: `rounded-lg` (8px)
- Focus: ring verde primary (`--ring`)
- Variante inline (sin borde): pasar `border-none shadow-none focus-visible:ring-0 bg-transparent`

### Button
**Archivo:** [button.tsx](../frontend/src/components/ui/button.tsx)

Variantes disponibles: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`.

### Badge
**Archivo:** [badge.tsx](../frontend/src/components/ui/badge.tsx)

Para cantidades de runas:
```tsx
// Sin Focus
<Badge variant="outline" className="border-tertiary/40 text-tertiary font-mono text-xs">

// Con Focus
<Badge variant="outline" className="border-focus-accent/40 text-focus-accent font-mono text-xs">
```

### Table
**Archivo:** [table.tsx](../frontend/src/components/ui/table.tsx)

El contenedor de tabla usa `rounded-2xl border border-border bg-card overflow-hidden`.

---

## Patrones de la calculadora

### Convención de columnas (RuneTable)

| Concepto | Color | Token | Clase |
|---|---|---|---|
| Sin Focus — encabezado | Azul cielo | `--tertiary` | `text-tertiary` |
| Sin Focus — fondo columna | Azul cielo sutil | `--tertiary/5` | `bg-tertiary/5` |
| Sin Focus — hover | Azul cielo | `--tertiary/10` | `group-hover:bg-tertiary/10` |
| Sin Focus — badge cantidad | Azul cielo | `--tertiary` | `border-tertiary/40 text-tertiary` |
| Con Focus — encabezado | Violeta | `--focus-accent` | `text-focus-accent` |
| Con Focus — fondo columna | Violeta sutil | `--focus-accent/5` | `bg-focus-accent/5` |
| Con Focus — hover | Violeta | `--focus-accent/10` | `group-hover:bg-focus-accent/10` |
| Con Focus — badge cantidad | Violeta | `--focus-accent` | `border-focus-accent/40 text-focus-accent` |

### Convención de jerarquía de resultados

| Situación | Color | Token/Clase |
|---|---|---|
| Mejor resultado (ganador) | Verde Dofus | `text-primary` |
| 2° mejor (Top 3 mode) | Amarillo | `text-yellow-500` |
| 3° mejor (Top 3 mode) | Naranja | `text-orange-500` |
| Beneficio positivo (profit card) | Verde Dofus | `text-primary` |
| Beneficio negativo | Rojo | `text-destructive` |
| Stat negativo (fila tabla) | Rojo sutil | `bg-destructive/5` |
| Coeficiente mínimo favorable | Verde sutil | `bg-primary/15 text-primary` |
| Coeficiente mínimo desfavorable | Rojo sutil | `bg-destructive/15 text-destructive` |

### Estructura de la calculadora

```
Calculator.client.tsx
├── Header sticky (bg-card/95 border-b border-border)
│   ├── Logo + ItemSearch
│   └── Suggest + ServerSwitcher + LanguageSwitcher
│
├── Tab switcher (border-b border-border, tab activo: border-b-2 border-primary text-primary)
│   ├── Calculadora
│   ├── Precios Runas
│   └── Precios Recursos
│
└── Tab: Calculadora
    ├── Grid 3 cols
    │   ├── Item Info Card (lg:col-span-2) — imagen, nombre, nivel, inputs Cost/Coeff
    │   └── Profit Summary Card — beneficio, totales, coeficiente mínimo
    │
    └── Grid 4 cols
        ├── RecipeEditor (xl:col-span-1) — lista de ingredientes + costo total
        └── RuneTable (xl:col-span-3) — tabla de stats con Sin Focus / Con Focus
```

---

## Guías para nuevos componentes

1. **Siempre usar tokens semánticos** en vez de colores hardcoded. En vez de `text-green-400`, usa `text-primary`. En vez de `bg-slate-800`, usa `bg-card` o `bg-muted`.

2. **Números siempre en `font-mono`**. Cualquier valor numérico (kamas, porcentajes, cantidades de runas) debe usar la clase `font-mono`.

3. **Labels de sección en micro-uppercase**:
   ```tsx
   <span className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
     ETIQUETA
   </span>
   ```

4. **Cards con borde explícito**:
   ```tsx
   <Card className="border border-border shadow-md">
   ```
   No usar `border-none` (pierde la estructura visual sobre el fondo oscuro).

5. **Separadores internos con `border-border`**:
   ```tsx
   <div className="border-t border-border">
   ```

6. **Inputs inline** (dentro de cards, sin el borde de formulario habitual):
   ```tsx
   className="border-none shadow-none focus-visible:ring-0 bg-transparent font-mono"
   ```

7. **Estado de éxito / error**:
   - Fondo sutil de éxito: `bg-primary/15`
   - Fondo sutil de error: `bg-destructive/15`
   - Nunca usar `bg-green-*/bg-red-*` hardcoded.
