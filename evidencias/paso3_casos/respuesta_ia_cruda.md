# Respuesta cruda de la IA — Prompt 02 (casos de prueba)

- **Herramienta:** Claude (Anthropic), mismo chat del Paso 2
- **Fecha:** 21-11-2026
- **Prompt:** `prompts/02_casos_de_prueba.md`, bloque **Prompt**, sin cambios
- Se guarda tal cual. La suite refinada está en `casos_de_prueba_refinados.xlsx` (hoja `Cambios_vs_IA` explica qué se cambió y por qué).

---

| ID | Módulo | Título | Precondiciones | Pasos | Datos de prueba | Resultado esperado | Prioridad | Automatizable |
|----|--------|--------|----------------|-------|-----------------|--------------------|-----------|---------------|
| TC-01 | Autenticación | Login admin válido | App en :3080 | Ingresar usuario y clave → Ingresar | admin / Admin123! | Dashboard visible con "Ana Admin" | P0 | Sí |
| TC-02 | Autenticación | Login con clave errada | — | Ingresar clave incorrecta | admin / 123 | Mensaje "Credenciales inválidas" | P1 | Sí |
| TC-03 | Autenticación | Login operador | — | Ingresar credenciales de operador | operador / Oper123! | Dashboard con rol operator | P1 | Sí |
| TC-04 | Productos | Crear producto válido | Login admin | + Producto → llenar → Guardar | SKU HDMI-2M-06, Cable HDMI 2m, 25.000, stock 30, mín 5 | Aparece en la tabla | P0 | Sí |
| TC-05 | Productos | Editar producto | Login admin | Editar → cambiar precio → Guardar | TEC-MEC-03 → 175.000 | Precio actualizado | P1 | Sí |
| TC-06 | Productos | Eliminar producto | Login admin | Eliminar → confirmar | HDMI-2M-06 | Desaparece de la tabla | P1 | Sí |
| TC-07 | Productos | Buscar por nombre | Login admin | Escribir y Buscar | "Teclado" | 1 resultado | P1 | Sí |
| TC-08 | Productos | Búsqueda case-insensitive | Login admin | Buscar en minúsculas y mayúsculas | "teclado", "TECLADO" | Mismo resultado que "Teclado" | P1 | Sí |
| TC-09 | Productos | Filtro por categoría | Login admin | Elegir categoría → Buscar | Periféricos | Solo productos de esa categoría | P2 | Sí |
| TC-10 | Movimientos | Entrada IN | Login admin | + Movimiento → IN → Registrar | CAB-USB-01 +10 | Stock 40 → 50 | P0 | Sí |
| TC-11 | Movimientos | Salida OUT | Login admin | + Movimiento → OUT → Registrar | CAB-USB-01 -5 | Stock 40 → 35 | P0 | Sí |
| TC-12 | Movimientos | Ajuste ADJUST | Login admin | + Movimiento → ADJUST | TEC-MEC-03 conteo 20 | Stock = 20 | P0 | Sí |
| TC-13 | Alertas | Producto en alerta | Login admin | Ir a Alertas | Semilla | Se listan productos con stock <= mínimo | P1 | Sí |
| TC-14 | Dashboard | Métricas | Login admin | Ver Dashboard | Semilla | Las métricas se muestran correctamente | P1 | Sí |
| TC-15 | Exportación | Exportar CSV | Login admin | Clic en Exportar CSV | — | Se descarga el archivo | P1 | Sí |
| TC-16 | Validación | OUT mayor al stock | Login admin | OUT de 10 | MON-24-04 (stock 3) | Rechazo; stock sigue en 3 | P0 | Sí |
| TC-17 | Validación | SKU duplicado | Login admin | Crear con SKU existente | CAB-USB-01 | Error de SKU duplicado | P0 | Sí |
| TC-18 | Validación | Precio negativo | Login admin | Crear con precio negativo | -5000 | Error de validación | P1 | Sí |
| TC-19 | Validación | Stock inicial negativo | Login admin | Crear con stock negativo | -10 | Error de validación | P1 | Sí |
| TC-20 | Validación | Cantidad cero | Login admin | Movimiento con cantidad 0 | 0 | Error "Cantidad debe ser mayor a 0" | P2 | Sí |
| TC-21 | Seguridad | Operador no crea productos | Login operador | Buscar botón + Producto | — | No se muestra | P0 | Sí |
| TC-22 | Seguridad | Operador no edita/elimina por API | Token operador | PUT/DELETE /api/products/p1 | — | HTTP 403 | P0 | Sí |
| TC-23 | Seguridad | XSS en nombre | Login admin | Crear producto con script | `<script>alert(1)</script>` | Se muestra como texto, no se ejecuta | P0 | Sí |
| TC-24 | Integridad | Movimiento actualiza dashboard | Login admin | OUT 10 de CAB-USB-01 → Dashboard | — | Valor baja 189.000 y movimientos +1 | P1 | Sí |
| TC-25 | Integridad | Eliminar producto con movimientos | Login admin | Eliminar CAB-USB-01 → Movimientos | — | Sin inconsistencias | P1 | No |
| TC-26 | E2E | Flujo completo de almacén | Login admin | Crear → IN → OUT → Alertas → Exportar | SKU dinámico | Stock correcto, alerta y fila en CSV | P0 | Sí |

**Prioridad P0:** TC-01, 04, 10, 11, 12, 16, 17, 21, 22, 23, 26 (bloquean el piloto).
