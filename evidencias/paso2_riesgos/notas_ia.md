# Paso 2 — Notas sobre la respuesta de la IA

Respuesta cruda: `respuesta_ia_cruda.md`. Top 5 refinado: `top5_riesgos.xlsx` (hoja `Top5_riesgos`; la hoja `Notas_IA` repite estas observaciones).

## Lo que la IA inventó, subestimó o dejó genérico

1. **Inventó un riesgo que no aplica: concurrencia (#11).** Propone "dos pestañas registrando OUT al mismo tiempo". En StockPascual cada petición se procesa completa antes de la siguiente: Express sobre un arreglo en memoria, sin `await` dentro del handler de movimientos. Es un consejo de QA de manual, no del sistema bajo prueba.
2. **Hipótesis sin evidencia en Alertas (#9).** Dice que la alerta "podría usar < en vez de <=". Se probó y funciona bien: MON-24-04 (3 de mínimo 4) y MOU-WL-02 (8 de 15) aparecen.
3. **Subestimó el XSS (#8).** Lo puso con probabilidad *Baja* y en el listado de productos. El listado sí escapa el HTML; el XSS real está en el selector del modal de movimientos y se ejecuta cada vez que la app recarga datos, para cualquier usuario. Además el token está en `localStorage`, así que el impacto es robo de sesión del admin (BUG-08).
4. **Subestimó el precio negativo (#7, impacto *Medio*).** Un precio negativo resta del valor del inventario, que es la cifra en la que la administración ya no confía. Con un precio vacío por API el total queda en $0 (BUG-18).
5. **Sobreestimó los permisos del operador (#5) al meterlos en su Top 5.** Era razonable sospechar, pero al probar el backend responde 403 a POST, PUT y DELETE. Salió del Top 5 y quedó como prueba de regresión P0.
6. **No vio:** token válido después de cerrar sesión (BUG-13), edición sin validaciones (BUG-11), que no se puede registrar un conteo físico de 0 (BUG-16), cantidades decimales (BUG-17), historial que cambia al editar (BUG-15).

## Cómo quedó el Top 5

| # | Riesgo | I × P |
|---|--------|-------|
| 1 | Stock del sistema ≠ bodega por movimientos (OUT negativo, ADJUST que suma, conteo 0 imposible) | Alto × Alta |
| 2 | Valor de inventario no confiable (cálculo, precios negativos o vacíos) | Alto × Alta |
| 3 | CSV de auditoría incompleto o con columnas corridas | Alto × Alta |
| 4 | Robo de sesión: XSS almacenado + token que no expira al cerrar sesión | Alto × Alta |
| 5 | Pérdida de trazabilidad del producto (SKU duplicado/vacío, edición sin validar, huérfanos, historial mutable) | Alto × Media |

**Nota de sesgo:** la IA había leído `app/server.js`, que trae comentarios `// BUG-0x`. Por eso acertó tanto en los riesgos #1 a #4. Lo que no estaba comentado en el código (puntos 3 a 6) es justo lo que no vio.
