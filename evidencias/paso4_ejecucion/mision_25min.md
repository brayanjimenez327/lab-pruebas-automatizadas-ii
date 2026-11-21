# Paso 4.2 — Sesión exploratoria con misión

- **Misión elegida:** A — Integridad de stock (de las 3 propuestas en `respuesta_ia_misiones.md`)
- **Objetivo:** comprobar que ninguna combinación de movimientos deja el stock del sistema distinto de lo que habría en la bodega.
- **Duración:** 25 minutos · **Inicio:** 9:00 a. m. · **Fin:** 9:25 a. m.
- **Entorno:** StockPascual en http://localhost:3080, servidor recién arrancado (datos semilla), Chromium
- **Registro técnico:** `exploracion_api_log.txt` (llamadas a la API con su respuesta HTTP y el stock resultante)

## Notas de la sesión

| # | Qué probé | Dato | Resultado observado | ¿Bug? |
|---|-----------|------|---------------------|-------|
| 1 | OUT mayor al stock | MON-24-04 stock 3, OUT 10 | Acepta sin mensaje, stock -7 | **BUG-01** |
| 2 | OUT exactamente igual al stock (frontera) | MON-24-04 stock 3, OUT 3 | Stock 0, estado Agotado. Correcto | No |
| 3 | OUT sobre stock 0 | MON-24-04 stock 0, OUT 1 | Stock -1 | BUG-01 (misma causa) |
| 4 | Cantidad 0 y -1 | CAB-USB-01, OUT 0 / OUT -1 | HTTP 400 "Cantidad debe ser mayor a 0". Correcto | No |
| 5 | Cantidad no numérica | IN "abc" | HTTP 400. Correcto | No |
| 6 | Cantidad decimal | IN 2.5 sobre CAB-USB-01 | Acepta, stock 42.5 und | **BUG-17** |
| 7 | ADJUST menor al stock | TEC-MEC-03 stock 22, conteo 20 | Stock 42 (suma) | **BUG-02** |
| 8 | ADJUST a 0 (conteo vacío) | CAB-USB-01, ADJUST 0 | HTTP 400; la UI tampoco deja (min=1) | **BUG-16** |
| 9 | ADJUST desde el operador | MOU-WL-02 stock 8, ADJUST 5 | Permitido (RF-04 lo permite) pero queda 13: mismo BUG-02 | BUG-02 |
| 10 | Tipo en minúscula / inexistente | "in" 1 / "TRANSFER" 1 | "in" se acepta como IN (razonable); TRANSFER → 400 | No |
| 11 | Producto inexistente | productId "zzz" | HTTP 404. Correcto | No |
| 12 | Stock inicial vs historial | Crear MUL-DIG-07 con stock 25 | No aparece ningún movimiento que explique las 25 und | **BUG-14** (a validar con PO) |
| 13 | Editar un producto con historial | CAB-USB-01 → "Cable USB-C 1m, trenzado" | Los movimientos de marzo muestran el nombre nuevo | **BUG-15** |
| 14 | Eliminar producto con historial | Eliminar MON-24-04 | Movimiento queda "(producto eliminado)", SKU "—" | **BUG-09** |
| 15 | Precio vacío por API → efecto en el dashboard | POST {sku: NP-01, name: "Sin precio"} | Precio NaN; Valor inventario $ 0 | **BUG-18** (fuera de la misión: se anota y se pasa a misión B) |

## Preguntas para el Product Owner

- ¿Crear un producto con stock inicial debe generar un movimiento IN automático?
- ¿Se puede eliminar un producto con movimientos, o solo desactivar (`active: false`)?
- ¿El operador debe poder hacer ADJUST, o solo el admin?

## Ideas para otra sesión

- Misión B: comparar el CSV con la pantalla después de 10 movimientos y de editar nombres con comas y comillas.
- Misión C: probar payloads en categoría y ubicación, no solo en el nombre.
