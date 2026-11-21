# Preguntas a la IA: cuáles son y para qué sirven

La guía pide que, en varios pasos, uno le haga una pregunta a una IA (ChatGPT, Claude, Gemini...), guarde **lo que respondió tal cual** y después lo corrija con su propio criterio. La nota no se gana con la respuesta de la IA, sino con lo que uno hace después: revisarla, ver en qué se equivocó y probarlo en la app.

Abajo están las preguntas, listas para copiar, con el lugar donde quedó guardada cada respuesta.

| Paso | Pregunta | Para qué sirve | Respuesta cruda | Versión corregida |
|------|----------|----------------|-----------------|-------------------|
| 2 | Pregunta 1 — Riesgos | Que la IA diga qué puede salir mal en StockPascual | `evidencias/paso2_riesgos/respuesta_ia_cruda.md` | `evidencias/paso2_riesgos/top5_riesgos.xlsx` y `notas_ia.md` |
| 3 | Pregunta 2 — Casos de prueba | Que la IA proponga casos a partir de los 10 criterios | `evidencias/paso3_casos/respuesta_ia_cruda.md` | `evidencias/paso3_casos/casos_de_prueba_refinados.xlsx` |
| 4 | Pregunta 3 — Misiones | Que la IA proponga 3 sesiones de exploración de 25 min | `evidencias/paso4_ejecucion/respuesta_ia_misiones.md` | `evidencias/paso4_ejecucion/mision_25min.md` |
| 7 | Pregunta 4 — Automatización | Que la IA escriba el test de Playwright | código en `automation/tests/` | el mismo código, ya corregido y ejecutado |

**Si el profesor pregunta:** las preguntas son las de la carpeta `prompts/`, copiadas sin cambios. Las respuestas se guardaron sin editar, y lo que se corrigió está explicado en `notas_ia.md`, en la hoja `Cambios_vs_IA` y en `evaluacion_ia.md`.

**Si quieres hacerlas tú mismo:** abre un chat nuevo en cualquier IA, pega la Pregunta 1 y guarda la respuesta. En ese mismo chat pega la Pregunta 2. Si lo que te responde es distinto, reemplaza el archivo de respuesta cruda correspondiente.

---

## Pregunta 1 — Riesgos (Paso 2)

```
Actúa como Senior QA / Risk-Based Testing coach en una institución universitaria de Colombia.

Contexto del sistema bajo prueba (MVP web "StockPascual" de la Institución Universitaria Pascual Bravo):
- Login con roles admin y operador
- CRUD de productos (SKU, nombre, categoría, precio, stock, stock mínimo, ubicación)
- Movimientos de inventario: IN (entrada), OUT (salida), ADJUST (ajuste a inventario físico)
- Dashboard con métricas: total productos, stock bajo, agotados, valor de inventario, cantidad de movimientos
- Alertas de stock bajo
- Exportación CSV

Historia de negocio:
El almacén institucional sufrió diferencias entre stock físico y Excel. Necesitan confiar en el stock para entregar insumos a laboratorios y en el valor de inventario para decisiones administrativas.

Tarea:
1) Identifica riesgos de calidad (funcionales, datos, seguridad/roles, usabilidad, integridad, reporting).
2) Para cada riesgo indica: impacto de negocio (Alto/Medio/Bajo), probabilidad, módulo afectado, y cómo lo probarías en 1-2 ideas de prueba.
3) Devuelve una tabla Markdown ordenada por impacto × probabilidad (Top 12).
4) Señala el Top 5 que probarías primero en un piloto de almacén institucional real y justifica en 3 líneas.

Restricciones:
- No inventes módulos que no existan en el alcance.
- Sé específico del dominio inventarios (no des consejos genéricos de QA).
- Distingue severidad técnica vs impacto de negocio cuando aplique.
```

## Pregunta 2 — Casos de prueba (Paso 3), en el mismo chat

```
Eres QA Analyst diseñando la suite de pruebas del MVP StockPascual (inventarios de la Institución Universitaria Pascual Bravo).

Usuarios de prueba:
- admin / Admin123!
- operador / Oper123!

Criterios de aceptación del negocio:
1. No permitir stock negativo por salidas.
2. SKU único.
3. Precio y stock inicial no negativos.
4. ADJUST debe establecer el stock al valor contado (no sumar).
5. Búsqueda case-insensitive por nombre/SKU.
6. CSV exporta todos los productos.
7. Valor inventario dashboard = sum(stock * precio).
8. Eliminar producto no debe dejar inconsistencias graves en movimientos/reportes.
9. Operador no crea/edita/elimina productos.
10. No XSS almacenado en campos de texto visibles.

Genera una suite en tabla Markdown con columnas:
ID | Módulo | Título | Precondiciones | Pasos | Datos de prueba | Resultado esperado | Prioridad (P0/P1/P2) | Automatizable (Sí/No)

Requisitos de cobertura:
- >= 15 casos funcionales
- >= 5 negativos/validación
- >= 3 seguridad/roles
- >= 2 integridad datos (movimiento ↔ stock ↔ dashboard)
- 1 E2E de negocio: ingreso → salida → alerta → export

Reglas:
- Usar datos concretos: SKU, cantidades, precios en COP.
- No incluir casos vagos del tipo "verificar que funcione".
- Marcar P0 solo para lo que bloquearía el piloto de almacén institucional.
```

Después de revisar la tabla, en el mismo chat:

```
Aquí está nuestra suite (pega la tabla).
Elimina redundancias, mejora datos de prueba y agrega 5 casos de frontera que no estén.
Luego dime qué 8 casos automatizarías primero con Playwright y por qué.
```

## Pregunta 3 — Misiones de exploración (Paso 4)

```
Actúa como coach de pruebas exploratorias por sesión.

Sistema: StockPascual, inventarios web de la IU Pascual Bravo, roles admin y operador.

Diseña 3 misiones de exploración de 25 minutos cada una, enfocadas en:
A) Integridad de stock
B) Credibilidad del dashboard y del CSV
C) Abuso de permisos / seguridad básica de UI

Para cada misión entrega:
- Objetivo en 1 frase
- Áreas a atacar
- Ideas de datos o ataques, lista corta
- Cómo saber si falló
- Notas de riesgo de quedarse explorando sin foco
- Plantilla breve de notas de sesión: tiempo, bugs, preguntas, ideas

No asumas bugs específicos; ayuda a descubrirlos.
```

Durante la sesión, si te quedas sin ideas:

```
Estoy explorando StockPascual. Acabo de observar esto:
[describe lo que viste]
Dame 5 siguientes experimentos concretos: paso, dato y qué observar, priorizados.
```

## Pregunta 4 — Automatización con Playwright (Paso 7)

```
Eres automatizador de pruebas. Genera una prueba E2E en Playwright, TypeScript, para StockPascual.

Base URL: http://localhost:3080
Login admin: admin / Admin123!

Flujo a automatizar:
1) Login
2) Crear producto con SKU único (usa timestamp)
3) Registrar movimiento IN de N unidades
4) Registrar movimiento OUT de M unidades (M < stock resultante)
5) Verificar que el stock mostrado en Productos sea el esperado
6) Si el stock queda <= mínimo, verificar que aparece en Alertas

Requisitos técnicos:
- selectors preferiblemente getByRole / getByLabel
- expect con aserciones claras
- datos no hardcodeados frágiles (SKU dinámico)
- comentarios breves en español
- no uses waitForTimeout fijo salvo justificación

Además:
- Lista 3 flakiness risks de esta app
- Indica qué aserciones NO debería inventar la IA sin evidencia del DOM
```

## Preguntas extra que sirven para la evaluación (Paso 6)

Pégalas en el mismo chat después de la Pregunta 2:

```
De los 12 riesgos que me diste, ¿cuáles podrían NO aplicar a una app que guarda todo en memoria y tiene un solo servidor? Explica por qué.
```

```
Revisa tu caso de prueba de XSS. ¿El payload que propusiste se ejecutaría si la app inserta el texto con innerHTML? Si no, dame uno que sí lo detecte.
```

```
¿Qué validaciones te faltaron en la EDICIÓN de productos (no en la creación)? Dame 3 casos negativos con datos concretos.
```
