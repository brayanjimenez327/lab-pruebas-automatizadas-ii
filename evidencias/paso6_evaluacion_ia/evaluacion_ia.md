# Evaluación crítica del uso de IA

**Laboratorio:** Pruebas Automatizadas II + IA — StockPascual
**Estudiante:** Brayan Jiménez Ospina (trabajo individual)
**IA usada:** Claude (Anthropic), en un solo chat para todo el laboratorio

## 1. Las preguntas que le hice a la IA

Usé los prompts del repositorio tal como venían, sin cambiarles nada. El texto exacto de cada uno está en `prompts/PREGUNTAS_A_LA_IA.md`.

1. **Riesgos** (`prompts/01_analisis_riesgos.md`). Le pedí los 12 riesgos más importantes de StockPascual y un Top 5 para el piloto. Lo que respondió está en `evidencias/paso2_riesgos/respuesta_ia_cruda.md`.
2. **Casos de prueba** (`prompts/02_casos_de_prueba.md`). En el mismo chat le pedí la suite de casos con los 10 criterios de aceptación. Su respuesta está en `evidencias/paso3_casos/respuesta_ia_cruda.md`.
3. **Automatización** (`prompts/04_automatizacion.md`). Le pedí el test E2E en Playwright. El código quedó en `automation/tests/`. Cuando el script de capturas empezó a dar números raros, le describí en el mismo chat lo que se veía en las imágenes y lo corrigió.

## 2. En qué acertó

- Los cuatro riesgos que puso de primeros (salidas que dejan stock negativo, ADJUST, valor del dashboard y CSV incompleto) eran bugs reales. Los confirmé todos en la app (BUG-01 a BUG-04).
- El test E2E funcionó casi a la primera. Los formularios de la app tienen bien puestas las etiquetas, y eso ayudó a que los selectores fueran claros.
- La idea de marcar los bugs conocidos con `test.fail()` me pareció muy buena: la suite queda en verde, cada bug queda documentado y el día que lo arreglen Playwright avisa solo.
- Se dio cuenta de que los tests no podían correr en paralelo, porque todos comparten el mismo servidor con los datos en memoria. Si corrían al tiempo, un test le cambiaba el stock al otro.

## 3. En qué se inventó cosas

- Propuso un riesgo de **concurrencia**: dos personas registrando salidas al mismo tiempo. En este servidor eso no puede pasar, porque cada petición se procesa completa antes de la siguiente. Es un consejo que sirve para cualquier sistema, no para este.
- Dijo que la alerta de stock bajo "podría estar usando < en vez de <=". Lo probé y la alerta funciona bien.
- El error que más me costó: en el script de capturas usó una espera (`networkidle`) que en esta app no espera nada, porque la página nunca cambia de URL. El script tomaba la foto antes de que la tabla se actualizara y anotaba datos falsos, como "6 productos con el mismo SKU" cuando eran 2. No salió ningún error; lo vi porque en la imagen el buscador aparecía vacío.

## 4. Lo que la IA no vio y yo sí encontré

- **BUG-13:** después de cerrar sesión, el token sigue sirviendo. Con él pude registrar una salida de inventario.
- **BUG-11:** editar un producto no valida nada. Se puede poner un SKU repetido, un precio negativo o dejar el nombre vacío. La IA solo pensó en las validaciones al crear.
- **BUG-16:** no se puede registrar un conteo físico de 0, que es justo lo que pasa cuando algo se acaba.
- **BUG-15:** el historial de movimientos muestra el nombre actual del producto. Si lo renombro, cambia lo que "salió" en marzo.
- **BUG-18:** un producto sin precio, creado por la API, deja el valor de todo el inventario en $0.
- **BUG-08:** la IA sí sospechó el XSS, pero lo ubicó en el listado de productos, que está bien. El problema real está en la lista desplegable del modal de movimientos.

## 5. Falsos positivos

- **Permisos del operador.** La IA lo puso en su Top 5 como riesgo alto. Lo probé y está bien hecho: el operador no ve los botones y, si intenta usar la API directamente, el servidor le responde 403.
- **El caso de XSS que propuso** usaba `<script>alert(1)</script>`. Ese código nunca se ejecuta cuando se mete con `innerHTML`, así que el caso habría salido "Pass" y el bug se habría quedado escondido. Lo cambié por `<img src=x onerror=...>`, que sí se ejecutó.

## 6. Dónde me ayudó más y dónde me hizo perder tiempo

| | |
|--|--|
| **Me ayudó más** | Armando la base de Playwright: los helpers, el E2E por pasos y un test por cada criterio de aceptación. A mano me habría tomado mucho más. |
| **Me hizo perder tiempo** | Encontrar por qué el script de capturas daba números equivocados. No había ningún error que buscar, y tuve que revisar las imágenes una por una. |

## 7. Reflexión

¿Le recomendaría a la Institución Universitaria Pascual Bravo un proceso de QA hecho 100 % por IA? No.

La IA sí me ahorró mucho trabajo. En poco tiempo tenía una lista de riesgos con sentido, una buena cantidad de casos de prueba y un proyecto de Playwright corriendo. Pero también se equivocó, y lo hizo de una forma peligrosa: muy segura de sí misma. Su script me dijo que había 6 productos con el mismo SKU cuando eran 2, y su caso de XSS habría dado como bueno algo que estaba mal. Si no hubiera revisado cada captura, habría entregado datos falsos.

Hay otro detalle: la IA acertó los bugs más graves en parte porque el código de StockPascual trae comentarios que los señalan. En un sistema real nadie deja escrito "aquí hay un bug". Los hallazgos que no estaban comentados los encontré explorando la app: el token que no expira, la edición sin validaciones, el conteo en cero, el historial que se reescribe. Y son justo los que más afectan la trazabilidad que necesita el almacén.

Además, hay preguntas que no le tocan a una IA: si se puede borrar un producto con historial, o si un operador puede hacer ajustes de inventario. Eso lo decide la gente del almacén.

Para mí, la IA funciona como un compañero rápido que propone ideas y escribe código, pero alguien tiene que verificar todo lo que dice. La regla que me quedó de este laboratorio: nada es bug, y nada está bien, hasta verlo en la aplicación con su evidencia.
