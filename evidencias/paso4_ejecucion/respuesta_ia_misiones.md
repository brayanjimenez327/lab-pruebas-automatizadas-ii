# Respuesta cruda de la IA — Prompt 03 (misiones exploratorias)

- **Herramienta:** Claude (Anthropic) · **Fecha:** 21-11-2026
- **Prompt:** `prompts/03_exploracion_guiada.md`, bloque **Prompt**, sin cambios
- **Misión elegida:** A (integridad de stock). Notas de la sesión en `mision_25min.md`.

---

## Misión A — Integridad de stock

- **Objetivo:** comprobar que ninguna combinación de movimientos deja el stock del sistema distinto de lo que habría en la bodega.
- **Áreas:** modal + Movimiento (IN, OUT, ADJUST), tabla Productos, Alertas, contador de movimientos del Dashboard, API `/api/movements`.
- **Ideas de ataque:** OUT mayor, igual y menor al stock; OUT sobre stock 0; ADJUST mayor, menor e igual al stock; ADJUST 0; cantidades 0, -1, 2.5, texto; tipo en minúscula o inexistente; movimientos del operador; producto inexistente; eliminar o editar un producto con movimientos.
- **Cómo saber si falló:** el stock queda negativo o decimal; ADJUST no deja el valor contado; la suma de movimientos no explica el stock; una fila del historial pierde su producto.
- **Riesgo de perder el foco:** terminar probando estilos o textos de la UI. Si una idea no toca el número de stock, anotarla y seguir.

## Misión B — Credibilidad del dashboard y del CSV

- **Objetivo:** demostrar si las cifras que verá la administración (valor, stock bajo, agotados, CSV) coinciden con los datos reales.
- **Áreas:** tarjetas del Dashboard, Exportar CSV, tabla Productos.
- **Ideas:** calcular Σ stock × precio a mano; contar filas del CSV; nombres con comas, comillas y tildes; producto con precio 0 o enorme; recalcular tras cada movimiento.
- **Cómo saber si falló:** cualquier diferencia entre la cifra mostrada y el cálculo manual; filas faltantes o columnas corridas en Excel.
- **Riesgo:** confiar en "se ve bien" sin hacer la cuenta.

## Misión C — Abuso de permisos y seguridad básica de UI

- **Objetivo:** encontrar formas de que el operador (o un tercero) haga lo que no debe.
- **Áreas:** login, botones ocultos, API con token de operador, campos de texto.
- **Ideas:** llamar la API con token de operador; reutilizar un token tras cerrar sesión; payloads `<img onerror>` en nombre, categoría y ubicación y recorrer todas las vistas y modales.
- **Cómo saber si falló:** respuesta 2xx donde se esperaba 401/403; un script que se ejecuta.
- **Riesgo:** quedarse solo en la UI; los controles ocultos no son seguridad.

## Plantilla de notas de sesión

| Tiempo | Qué probé | Resultado | ¿Bug? | Pregunta / idea siguiente |
|--------|-----------|-----------|-------|---------------------------|
