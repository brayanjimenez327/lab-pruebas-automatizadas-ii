# Conclusiones del laboratorio — StockPascual

**Estudiante:** Brayan Jiménez Ospina · **Curso:** Pruebas de Software · **Fecha:** 21 de noviembre de 2026

## Cómo está StockPascual hoy

Hoy no lo pondría en el almacén. Encontré 18 bugs, y 4 son críticos. Los críticos atacan justo lo que el almacén necesitaba arreglar:

- **El stock no se puede creer.** El sistema deja sacar más de lo que hay (de 3 unidades saqué 10 y quedó en -7). Además, el ajuste por conteo físico suma en lugar de corregir: si conté 20 y había 22, quedan 42.
- **El valor del inventario está mal.** El dashboard muestra $6.841 cuando el valor real es $6.841.200. Si la administración ya desconfiaba del Excel, con esta cifra desconfiaría también del sistema.
- **El CSV para auditoría sale incompleto.** Siempre deja por fuera los dos últimos productos y no avisa de nada.
- **Hay un hueco de seguridad.** Basta con escribir un código en el nombre de un producto para que se ejecute en el navegador de quien abra la pantalla de movimientos. Con eso se puede leer el token del admin. Y como cerrar sesión no invalida el token, ese acceso no se vence nunca.

También encontré algo que sí funciona bien: los permisos del operador. No ve los botones de crear, editar ni eliminar, y si lo intenta directamente por la API, el servidor le dice que no.

## Qué arreglaría primero

1. Las salidas y el ajuste (BUG-01, BUG-02 y BUG-16). Sin esto el sistema repite el problema del Excel.
2. El cálculo del valor del inventario y las validaciones de precio (BUG-03, BUG-06 y BUG-18).
3. El CSV (BUG-04 y BUG-10).
4. El XSS y el cierre de sesión (BUG-08 y BUG-13).
5. Las validaciones al editar y el historial de movimientos (BUG-05, BUG-09, BUG-11 y BUG-15).

## Lo que aprendí sobre probar con IA

- **La IA arranca rápido, pero no hay que creerle todo.** Me dio riesgos y casos de prueba en minutos, pero también inventó riesgos que no aplicaban y propuso un caso de XSS que nunca iba a fallar.
- **Una prueba automatizada también se puede equivocar.** El script de capturas que armé con la IA llegó a reportar 6 productos repetidos cuando eran 2. No salió ningún error. Lo vi porque revisé las imágenes.
- **Explorar a mano encuentra lo que nadie escribió.** Los bugs que la IA no vio (el token que no se vence, la edición sin validar, el conteo en cero, el historial que cambia) salieron de probar la app con una misión clara.
- **Un bug sin evidencia no cuenta.** Cada uno de los 18 tiene pasos, datos y captura, y cualquiera puede repetirlo.
- **Marcar los bugs conocidos en la automatización ayuda mucho.** Con `test.fail()` la suite queda en verde, pero cada bug sigue a la vista. Cuando lo arreglen, el test lo avisa solo.

## Preguntas para el dueño del producto

- ¿Al crear un producto con stock inicial, el sistema debe registrar un movimiento de entrada?
- ¿Se puede borrar un producto que ya tiene movimientos, o solo desactivarlo?
- ¿El operador puede hacer ajustes de inventario, o eso debe quedar solo para el admin?

## En una frase

La IA me ayudó a ir más rápido, pero lo que hizo que el trabajo sirviera fue verificar cada cosa en la aplicación y dejar la evidencia.
