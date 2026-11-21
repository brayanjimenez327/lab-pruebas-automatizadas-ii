# Automatización Playwright — StockPascual

Paso obligatorio del laboratorio. Instrucciones en
`docs/Laboratorio_Pruebas_Automatizadas_II_IA.md`, Paso 7 — peso 0,75 sobre 5,0.

## Requisitos

- Node.js 18+
- StockPascual corriendo en `http://localhost:3080` (**recién arrancado** para `npm run evidencias`)

## Setup

```bash
cd automation
npm install
npx playwright install chromium
```

## Ejecutar

```bash
npm test               # toda la suite, sin ventana
npm run test:headed    # con navegador visible
npm run report         # abre el reporte HTML
npm run evidencias     # regenera capturas de evidencias/paso1_arranque y evidencias/paso5_bugs
```

## Qué hay en `tests/`

| Archivo | Qué prueba |
|---------|-----------|
| `stockpascual-smoke.spec.ts` | Smoke original: login admin y operador sin botón + Producto |
| `stockpascual-e2e.spec.ts` | **E2E de negocio** (TC-E2E-01): login → crear producto con SKU dinámico → IN 20 → OUT 18 → stock 7 y estado Bajo → aparece en Alertas → IN y OUT en Movimientos. Un segundo test verifica que el producto salga en el CSV (falla por BUG-04) |
| `criterios-aceptacion.spec.ts` | Un test por cada uno de los 10 criterios de aceptación (CA-01 a CA-10) |
| `helpers.ts` | Login, navegación, crear producto, registrar movimiento, leer stock de la tabla |

### Bugs conocidos y `test.fail()`

Cada test verifica el comportamiento **correcto** que pide el negocio. Si el criterio está roto por un bug ya reportado,
el test lleva `test.fail(true, "BUG-xx: ...")`: Playwright lo marca con ✘ pero lo cuenta como resultado esperado,
y la corrida queda en verde. Cuando desarrollo corrija el bug, ese test empezará a pasar y Playwright lo marcará
como fallo ("expected to fail, but passed"): esa es la señal para quitar el `test.fail`.

Resultado actual: 14 tests, 5 pasan normalmente (smoke ×2, CA-09, E2E principal) y 9 son fallas esperadas por BUG-01 a BUG-09.

### Decisiones y riesgos de flakiness

1. **Estado compartido en memoria.** Todos los tests usan el mismo servidor; en paralelo, uno cambiaría el stock o el valor
   que otro está midiendo. Por eso `playwright.config.ts` usa `workers: 1` y cada test crea y borra sus propios productos.
2. **El selector de producto usa el id interno** (`p1`, `p8f3a...`), no el SKU. El test lee el id por API antes de elegir la opción.
3. **La app no navega entre vistas**: `waitForLoadState("networkidle")` no sirve como espera. Se usan aserciones web-first
   (`expect(...).toHaveText`, `expect.poll`) y, en el script de evidencias, `waitForResponse` de la API.
4. **No se inventan aserciones sin evidencia del DOM**: por ejemplo, no se valida el texto del error de "stock insuficiente"
   porque la app no muestra ninguno; se valida el número de stock.
