# Respuesta cruda de la IA — Prompt 01 (análisis de riesgos)

- **Herramienta:** Claude (Anthropic), chat del laboratorio
- **Fecha:** 21-11-2026
- **Prompt:** `prompts/01_analisis_riesgos.md`, bloque **Prompt**, pegado sin cambios
- **Advertencia de sesgo:** en esa misma sesión la IA ya había leído el repositorio, incluido `app/server.js`, que trae comentarios del tipo `// BUG-06: OUT permite stock negativo`. La respuesta no es "a ciegas". Esto se discute en `evidencias/paso6_evaluacion_ia/evaluacion_ia.md`.

Se guarda tal cual, sin corregir. La versión refinada está en `top5_riesgos.xlsx`.

---

## Riesgos de calidad — StockPascual (Top 12, ordenado por impacto × probabilidad)

| # | Riesgo | Tipo | Módulo | Impacto negocio | Probabilidad | Ideas de prueba |
|---|--------|------|--------|-----------------|--------------|-----------------|
| 1 | Una salida OUT mayor al stock deja existencias negativas y el almacén "entrega" insumos que no tiene | Integridad | Movimientos | Alto | Alta | OUT de 10 sobre stock 3; OUT igual al stock (debe quedar 0) |
| 2 | El ajuste ADJUST suma o resta en vez de fijar el valor del conteo físico, y el sistema nunca cuadra con la bodega | Integridad | Movimientos | Alto | Media | ADJUST 20 sobre stock 22 → esperado 20; ADJUST sobre stock 0 |
| 3 | El valor de inventario del dashboard no coincide con Σ stock × precio y la administración toma decisiones con cifras falsas | Reporting | Dashboard | Alto | Media | Calcular a mano con los 5 productos semilla y comparar; repetir tras un OUT |
| 4 | El CSV exportado omite productos o rompe columnas, y la auditoría institucional trabaja con un inventario incompleto | Reporting | Exportación | Alto | Media | Contar filas del CSV vs productos en pantalla; nombre con coma o comillas |
| 5 | El operador puede crear, editar o borrar productos (o cambiar precios) saltándose la UI | Seguridad/roles | Autenticación / Productos | Alto | Media | Login operador; llamar POST/PUT/DELETE /api/products con su token |
| 6 | SKU duplicado: dos productos con el mismo código hacen que entradas y salidas se registren al ítem equivocado | Datos | Productos | Alto | Media | Crear dos veces CAB-USB-01; editar un SKU para que choque con otro |
| 7 | Precio o stock inicial negativos distorsionan el valor del inventario | Datos | Productos | Medio | Media | Crear con precio -5000 y stock -10 |
| 8 | XSS almacenado en nombre, categoría o ubicación que se ejecuta al listar productos | Seguridad | Productos / UI | Alto | Baja | Nombre `<img src=x onerror=alert(1)>` y recorrer todas las vistas |
| 9 | La alerta de stock bajo no aparece o aparece tarde (uso de < en vez de <=) | Funcional | Alertas | Medio | Media | Producto con stock = mínimo; bajar justo al mínimo con OUT |
| 10 | Eliminar un producto con historial deja movimientos huérfanos y reportes inconsistentes | Integridad | Productos / Movimientos | Medio | Media | Borrar un producto con IN/OUT y revisar Movimientos y Dashboard |
| 11 | Movimientos simultáneos de dos usuarios sobre el mismo producto pierden actualizaciones (condición de carrera) | Integridad | Movimientos | Medio | Baja | Dos pestañas registrando OUT al mismo tiempo |
| 12 | La búsqueda distingue mayúsculas y el operador no encuentra el insumo durante una entrega | Usabilidad | Productos | Bajo | Alta | Buscar mouse / Mouse / MOUSE y SKU en minúsculas |

**Severidad técnica vs impacto de negocio:** el #12 es técnicamente trivial (un `toLowerCase`) pero en ventanilla frena la operación; el #11 es técnicamente complejo pero en un piloto con pocos usuarios su impacto real es bajo.

## Top 5 para el piloto de almacén

1. **OUT negativo (#1)** — es la causa raíz del problema que se quiere resolver (stock físico ≠ sistema).
2. **ADJUST (#2)** — sin un ajuste confiable, el conteo físico mensual nunca reconcilia.
3. **Valor de inventario (#3)** — es la métrica que la administración ya no confía; si falla, el piloto pierde credibilidad.
4. **CSV incompleto (#4)** — la auditoría trabajará sobre el archivo, no sobre la pantalla.
5. **Permisos del operador (#5)** — quién puede alterar precios es la pregunta de control interno más básica.
