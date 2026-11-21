# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: criterios-aceptacion.spec.ts >> CA-10 · un nombre con HTML no ejecuta scripts en la UI [BUG-08]
- Location: tests/criterios-aceptacion.spec.ts:197:5

# Error details

```
Error: veces que se ejecutó el onerror

expect(received).toBe(expected) // Object.is equality

Expected: 0
Received: 2
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - complementary [ref=e3]:
      - generic [ref=e4]:
        - generic [ref=e5]: SP
        - generic [ref=e6]:
          - strong [ref=e7]: StockPascual
          - text: Ana Admin · admin
      - navigation [ref=e8]:
        - button "Dashboard" [ref=e9] [cursor=pointer]
        - button "Productos" [ref=e10] [cursor=pointer]
        - button "Movimientos" [ref=e11] [cursor=pointer]
        - button "Alertas stock" [ref=e12] [cursor=pointer]
      - button "Cerrar sesión" [ref=e13] [cursor=pointer]
    - main [ref=e14]:
      - generic [ref=e15]:
        - generic [ref=e16]:
          - heading "Dashboard" [level=2] [ref=e17]
          - paragraph [ref=e18]: Resumen operativo del inventario
        - generic [ref=e19]:
          - link "Exportar CSV" [ref=e20] [cursor=pointer]:
            - /url: /api/export/csv
          - button "+ Producto" [ref=e21] [cursor=pointer]
          - button "+ Movimiento" [ref=e22] [cursor=pointer]
      - generic [ref=e23]:
        - generic [ref=e24]:
          - generic [ref=e25]:
            - generic [ref=e26]: Productos activos
            - strong [ref=e27]: "6"
          - generic [ref=e28]:
            - generic [ref=e29]: Stock bajo
            - strong [ref=e30]: "3"
          - generic [ref=e31]:
            - generic [ref=e32]: Agotados
            - strong [ref=e33]: "1"
          - generic [ref=e34]:
            - generic [ref=e35]: Valor inventario
            - strong [ref=e36]: $ 6.846
          - generic [ref=e37]:
            - generic [ref=e38]: Movimientos
            - strong [ref=e39]: "5"
        - generic [ref=e40]:
          - heading "Productos con stock bajo" [level=3] [ref=e41]
          - table [ref=e43]:
            - rowgroup [ref=e44]:
              - row [ref=e45]:
                - columnheader "SKU" [ref=e46]
                - columnheader "Producto" [ref=e47]
                - columnheader "Categoría" [ref=e48]
                - columnheader "Precio" [ref=e49]
                - columnheader "Stock" [ref=e50]
                - columnheader "Mín." [ref=e51]
                - columnheader "Estado" [ref=e52]
            - rowgroup [ref=e53]:
              - row [ref=e54]:
                - cell "MOU-WL-02" [ref=e55]
                - cell "Mouse inalámbrico" [ref=e56]
                - cell "Periféricos" [ref=e57]
                - cell "$ 45.900" [ref=e58]
                - cell "8" [ref=e59]
                - cell "15" [ref=e60]
                - cell "Bajo" [ref=e61]
              - row [ref=e63]:
                - cell "MON-24-04" [ref=e64]
                - cell "Monitor 24\" IPS" [ref=e65]
                - cell "Pantallas" [ref=e66]
                - cell "$ 520.000" [ref=e67]
                - cell "3" [ref=e68]
                - cell "4" [ref=e69]
                - cell "Bajo" [ref=e70]
              - row [ref=e72]:
                - cell "AUD-BT-05" [ref=e73]
                - cell "Audífonos Bluetooth" [ref=e74]
                - cell "Audio" [ref=e75]
                - cell "$ 99.000" [ref=e76]
                - cell "0" [ref=e77]
                - cell "8" [ref=e78]
                - cell "Agotado" [ref=e79]
  - dialog [ref=e81]:
    - generic [ref=e82]:
      - heading "Registrar movimiento" [level=3] [ref=e83]
      - generic [ref=e84]:
        - text: Producto
        - combobox "Producto" [active] [ref=e85]:
          - 'option "CAB-USB-01 — Cable USB-C 1m (stock: 40)" [selected]'
          - 'option "MOU-WL-02 — Mouse inalámbrico (stock: 8)"'
          - 'option "TEC-MEC-03 — Teclado mecánico (stock: 22)"'
          - 'option "MON-24-04 — Monitor 24\" IPS (stock: 3)"'
          - 'option "AUD-BT-05 — Audífonos Bluetooth (stock: 0)"'
          - 'option "XSS-MWQMJXAJ-670 — (stock: 5)"'
      - generic [ref=e86]:
        - generic [ref=e87]:
          - text: Tipo
          - combobox "Tipo" [ref=e88]:
            - option "Entrada (IN)" [selected]
            - option "Salida (OUT)"
            - option "Ajuste (ADJUST)"
        - generic [ref=e89]:
          - text: Cantidad
          - spinbutton "Cantidad" [ref=e90]: "1"
      - generic [ref=e91]:
        - text: Motivo
        - textbox "Motivo" [ref=e92]:
          - /placeholder: Compra, entrega a laboratorio, merma, conteo físico...
      - generic [ref=e93]:
        - button "Cancelar" [ref=e94] [cursor=pointer]
        - button "Registrar" [ref=e95] [cursor=pointer]
```

# Test source

```ts
  110 | test("CA-05 · búsqueda sin distinguir mayúsculas [BUG-07]", async ({ page }) => {
  111 |   test.fail(true, "BUG-07: la búsqueda es case-sensitive");
  112 |   await loginUI(page, "admin");
  113 |   await irA(page, "Productos");
  114 | 
  115 |   const buscar = async (q: string) => {
  116 |     await page.getByPlaceholder("Buscar por nombre o SKU...").fill(q);
  117 |     await page.getByRole("button", { name: "Buscar" }).click();
  118 |     await page.waitForLoadState("networkidle");
  119 |     return page.locator("#products-table tbody tr").count();
  120 |   };
  121 |   const referencia = await buscar("Mouse"); // así está escrito en la semilla
  122 |   expect(referencia).toBeGreaterThan(0);
  123 |   const minus = await buscar("mouse");
  124 |   await captura(page, "CA-05 búsqueda 'mouse'");
  125 |   const mayus = await buscar("MOUSE");
  126 | 
  127 |   expect(minus).toBe(referencia);
  128 |   expect(mayus).toBe(referencia);
  129 | });
  130 | 
  131 | test("CA-06 · el CSV exporta todos los productos [BUG-04]", async ({ page, request }) => {
  132 |   test.fail(true, "BUG-04: el CSV omite los 2 últimos productos");
  133 |   await loginUI(page, "admin");
  134 |   const enSistema = await productosAPI(request, token);
  135 | 
  136 |   const [descarga] = await Promise.all([
  137 |     page.waitForEvent("download"),
  138 |     page.getByRole("link", { name: "Exportar CSV" }).click(),
  139 |   ]);
  140 |   const ruta = await descarga.path();
  141 |   const csv = (await import("fs")).readFileSync(ruta!, "utf8");
  142 |   const filas = csv.trim().split("\n").slice(1); // sin encabezado
  143 |   await test.info().attach("inventario.csv", { body: csv, contentType: "text/csv" });
  144 | 
  145 |   expect(filas.length).toBe(enSistema.length);
  146 | });
  147 | 
  148 | test("CA-07 · valor de inventario = Σ stock × precio [BUG-03]", async ({ page, request }) => {
  149 |   test.fail(true, "BUG-03: el dashboard divide el valor entre 1000");
  150 |   await loginUI(page, "admin");
  151 |   const esperado = (await productosAPI(request, token)).reduce((acc, p) => acc + p.stock * p.price, 0);
  152 | 
  153 |   const tarjeta = page.locator(".metric").filter({ hasText: "Valor inventario" }).locator("strong");
  154 |   await expect(tarjeta).not.toHaveText("");
  155 |   await captura(page, `CA-07 dashboard (esperado ${cop(esperado)})`);
  156 | 
  157 |   await expect(tarjeta).toHaveText(cop(esperado));
  158 | });
  159 | 
  160 | test("CA-08 · eliminar producto no deja movimientos huérfanos [BUG-09]", async ({ page, request }) => {
  161 |   test.fail(true, "BUG-09: los movimientos del producto eliminado quedan como '(producto eliminado)'");
  162 |   const p = await crearProductoAPI(request, token, {
  163 |     sku: skuUnico("DEL"), name: "Para borrar QA", category: "General", price: 1000, stock: 5, minStock: 1,
  164 |   });
  165 |   await request.post("/api/movements", { headers: auth(token), data: { productId: p.id, type: "IN", quantity: 3, reason: "Compra QA" } });
  166 | 
  167 |   await loginUI(page, "admin");
  168 |   await irA(page, "Productos");
  169 |   page.once("dialog", (d) => d.accept()); // confirm("¿Eliminar este producto?")
  170 |   await filaProducto(page, p.sku).getByRole("button", { name: "Eliminar" }).click();
  171 |   await expect(filaProducto(page, p.sku)).toHaveCount(0);
  172 | 
  173 |   await irA(page, "Movimientos");
  174 |   await captura(page, "CA-08 movimientos tras eliminar el producto");
  175 |   // Esperado: no deben quedar filas sin SKU ni producto
  176 |   await expect(page.locator("#movements-table").getByText("(producto eliminado)")).toHaveCount(0);
  177 | });
  178 | 
  179 | test("CA-09 · el operador no puede crear, editar ni eliminar productos", async ({ page, request }) => {
  180 |   // Este criterio SÍ se cumple: la UI oculta los controles y el backend responde 403
  181 |   await loginUI(page, "operador");
  182 |   await expect(page.getByRole("button", { name: "+ Producto" })).toBeHidden();
  183 |   await irA(page, "Productos");
  184 |   await expect(page.getByRole("button", { name: "Editar" })).toHaveCount(0);
  185 |   await expect(page.getByRole("button", { name: "Eliminar" })).toHaveCount(0);
  186 |   await captura(page, "CA-09 vista de productos como operador");
  187 | 
  188 |   const tOp = await tokenAPI(request, "operador");
  189 |   const crear = await request.post("/api/products", { headers: auth(tOp), data: { sku: skuUnico("OP"), name: "Hack", price: 1 } });
  190 |   expect(crear.status()).toBe(403);
  191 |   const editar = await request.put("/api/products/p1", { headers: auth(tOp), data: { price: 1 } });
  192 |   expect(editar.status()).toBe(403);
  193 |   const borrar = await request.delete("/api/products/p1", { headers: auth(tOp) });
  194 |   expect(borrar.status()).toBe(403);
  195 | });
  196 | 
  197 | test("CA-10 · un nombre con HTML no ejecuta scripts en la UI [BUG-08]", async ({ page, request }) => {
  198 |   test.fail(true, "BUG-08: XSS almacenado en el selector de producto del modal de movimientos");
  199 |   // Payload inofensivo: solo marca una variable global si llega a ejecutarse
  200 |   const p: Producto = await crearProductoAPI(request, token, {
  201 |     sku: skuUnico("XSS"), name: '<img src=x onerror="window.__xss=(window.__xss||0)+1">', category: "General", price: 1000, stock: 5, minStock: 1,
  202 |   });
  203 |   creados.push(p.id);
  204 | 
  205 |   await loginUI(page, "admin");
  206 |   await page.getByRole("button", { name: "+ Movimiento" }).click();
  207 |   await captura(page, "CA-10 modal de movimientos con producto malicioso");
  208 | 
  209 |   const ejecuciones = await page.evaluate(() => (window as unknown as { __xss?: number }).__xss ?? 0);
> 210 |   expect(ejecuciones, "veces que se ejecutó el onerror").toBe(0);
      |                                                          ^ Error: veces que se ejecutó el onerror
  211 | });
  212 | 
```