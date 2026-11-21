import { test, expect } from "@playwright/test";
import {
  loginUI,
  irA,
  tokenAPI,
  auth,
  crearProductoAPI,
  crearProductoUI,
  productosAPI,
  eliminarProductoAPI,
  registrarMovimientoUI,
  stockEnTabla,
  filaProducto,
  skuUnico,
  cop,
  type Producto,
} from "./helpers";

/**
 * Regresión de los 10 criterios de aceptación de StockPascual.
 *
 * Cada test verifica el comportamiento CORRECTO que pide el negocio.
 * Cuando el criterio está roto por un bug ya reportado, el test se marca con
 * test.fail(): Playwright lo cuenta como "falla esperada" y la suite queda verde.
 * El día que el equipo de desarrollo corrija el bug, ese test pasará y
 * Playwright avisará ("expected to fail, but passed") para quitar la marca.
 *
 * Cada test adjunta una captura al reporte HTML (npm run report).
 */

// Productos creados por cada test, para limpiarlos al final
let creados: string[] = [];
let token = "";

test.beforeEach(async ({ request }) => {
  token = await tokenAPI(request, "admin");
  creados = [];
});

test.afterEach(async ({ request }) => {
  for (const id of creados) await eliminarProductoAPI(request, token, id);
});

async function captura(page: import("@playwright/test").Page, nombre: string) {
  await test.info().attach(nombre, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
}

test("CA-01 · OUT mayor al stock no deja stock negativo [BUG-01]", async ({ page, request }) => {
  test.fail(true, "BUG-01: la salida OUT deja el stock en negativo");
  const p = await crearProductoAPI(request, token, {
    sku: skuUnico("OUT"), name: "Monitor QA OUT", category: "Pantallas", price: 520000, stock: 3, minStock: 4,
  });
  creados.push(p.id);

  await loginUI(page, "admin");
  await registrarMovimientoUI(page, p.id, "OUT", 10, "Entrega laboratorio");
  await irA(page, "Productos");
  await captura(page, "CA-01 stock tras OUT 10 con stock 3");

  // Esperado: el sistema rechaza la salida y el stock sigue en 3
  expect(await stockEnTabla(page, p.sku)).toBe(3);
});

test("CA-02 · SKU duplicado es rechazado [BUG-05]", async ({ page, request }) => {
  test.fail(true, "BUG-05: el backend acepta SKU repetidos");
  const sku = skuUnico("DUP");
  const original = await crearProductoAPI(request, token, { sku, name: "Original QA", category: "General", price: 1000, stock: 1, minStock: 0 });
  creados.push(original.id);

  await loginUI(page, "admin");
  await crearProductoUI(page, { sku, name: "Duplicado QA", category: "General", price: 2000, stock: 1, minStock: 0 });
  await irA(page, "Productos");
  await captura(page, "CA-02 dos productos con el mismo SKU");

  const conEseSku = (await productosAPI(request, token)).filter((x) => x.sku === sku);
  creados.push(...conEseSku.filter((x) => x.id !== original.id).map((x) => x.id));
  // Esperado: solo debe existir un producto con ese SKU
  expect(conEseSku).toHaveLength(1);
});

test("CA-03 · precio y stock inicial negativos son rechazados [BUG-06]", async ({ page, request }) => {
  test.fail(true, "BUG-06: se aceptan precio y stock negativos");
  const sku = skuUnico("NEG");
  await loginUI(page, "admin");
  await crearProductoUI(page, { sku, name: "Negativo QA", category: "General", price: -5000, stock: -10, minStock: 0 });
  await page.waitForLoadState("networkidle");
  await captura(page, "CA-03 resultado al guardar precio -5000 y stock -10");

  const p = (await productosAPI(request, token)).find((x) => x.sku === sku);
  if (p) creados.push(p.id);
  // Esperado: el producto no se crea y el modal muestra un error de validación
  expect(p).toBeUndefined();
});

test("CA-04 · ADJUST establece el stock al valor contado [BUG-02]", async ({ page, request }) => {
  test.fail(true, "BUG-02: ADJUST suma la cantidad en lugar de fijarla");
  const p = await crearProductoAPI(request, token, {
    sku: skuUnico("ADJ"), name: "Teclado QA ADJ", category: "Periféricos", price: 189000, stock: 22, minStock: 5,
  });
  creados.push(p.id);

  await loginUI(page, "admin");
  await registrarMovimientoUI(page, p.id, "ADJUST", 20, "Conteo físico");
  await irA(page, "Productos");
  await captura(page, "CA-04 stock tras ADJUST 20 con stock 22");

  expect(await stockEnTabla(page, p.sku)).toBe(20);
});

test("CA-05 · búsqueda sin distinguir mayúsculas [BUG-07]", async ({ page }) => {
  test.fail(true, "BUG-07: la búsqueda es case-sensitive");
  await loginUI(page, "admin");
  await irA(page, "Productos");

  const buscar = async (q: string) => {
    await page.getByPlaceholder("Buscar por nombre o SKU...").fill(q);
    await page.getByRole("button", { name: "Buscar" }).click();
    await page.waitForLoadState("networkidle");
    return page.locator("#products-table tbody tr").count();
  };
  const referencia = await buscar("Mouse"); // así está escrito en la semilla
  expect(referencia).toBeGreaterThan(0);
  const minus = await buscar("mouse");
  await captura(page, "CA-05 búsqueda 'mouse'");
  const mayus = await buscar("MOUSE");

  expect(minus).toBe(referencia);
  expect(mayus).toBe(referencia);
});

test("CA-06 · el CSV exporta todos los productos [BUG-04]", async ({ page, request }) => {
  test.fail(true, "BUG-04: el CSV omite los 2 últimos productos");
  await loginUI(page, "admin");
  const enSistema = await productosAPI(request, token);

  const [descarga] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("link", { name: "Exportar CSV" }).click(),
  ]);
  const ruta = await descarga.path();
  const csv = (await import("fs")).readFileSync(ruta!, "utf8");
  const filas = csv.trim().split("\n").slice(1); // sin encabezado
  await test.info().attach("inventario.csv", { body: csv, contentType: "text/csv" });

  expect(filas.length).toBe(enSistema.length);
});

test("CA-07 · valor de inventario = Σ stock × precio [BUG-03]", async ({ page, request }) => {
  test.fail(true, "BUG-03: el dashboard divide el valor entre 1000");
  await loginUI(page, "admin");
  const esperado = (await productosAPI(request, token)).reduce((acc, p) => acc + p.stock * p.price, 0);

  const tarjeta = page.locator(".metric").filter({ hasText: "Valor inventario" }).locator("strong");
  await expect(tarjeta).not.toHaveText("");
  await captura(page, `CA-07 dashboard (esperado ${cop(esperado)})`);

  await expect(tarjeta).toHaveText(cop(esperado));
});

test("CA-08 · eliminar producto no deja movimientos huérfanos [BUG-09]", async ({ page, request }) => {
  test.fail(true, "BUG-09: los movimientos del producto eliminado quedan como '(producto eliminado)'");
  const p = await crearProductoAPI(request, token, {
    sku: skuUnico("DEL"), name: "Para borrar QA", category: "General", price: 1000, stock: 5, minStock: 1,
  });
  await request.post("/api/movements", { headers: auth(token), data: { productId: p.id, type: "IN", quantity: 3, reason: "Compra QA" } });

  await loginUI(page, "admin");
  await irA(page, "Productos");
  page.once("dialog", (d) => d.accept()); // confirm("¿Eliminar este producto?")
  await filaProducto(page, p.sku).getByRole("button", { name: "Eliminar" }).click();
  await expect(filaProducto(page, p.sku)).toHaveCount(0);

  await irA(page, "Movimientos");
  await captura(page, "CA-08 movimientos tras eliminar el producto");
  // Esperado: no deben quedar filas sin SKU ni producto
  await expect(page.locator("#movements-table").getByText("(producto eliminado)")).toHaveCount(0);
});

test("CA-09 · el operador no puede crear, editar ni eliminar productos", async ({ page, request }) => {
  // Este criterio SÍ se cumple: la UI oculta los controles y el backend responde 403
  await loginUI(page, "operador");
  await expect(page.getByRole("button", { name: "+ Producto" })).toBeHidden();
  await irA(page, "Productos");
  await expect(page.getByRole("button", { name: "Editar" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Eliminar" })).toHaveCount(0);
  await captura(page, "CA-09 vista de productos como operador");

  const tOp = await tokenAPI(request, "operador");
  const crear = await request.post("/api/products", { headers: auth(tOp), data: { sku: skuUnico("OP"), name: "Hack", price: 1 } });
  expect(crear.status()).toBe(403);
  const editar = await request.put("/api/products/p1", { headers: auth(tOp), data: { price: 1 } });
  expect(editar.status()).toBe(403);
  const borrar = await request.delete("/api/products/p1", { headers: auth(tOp) });
  expect(borrar.status()).toBe(403);
});

test("CA-10 · un nombre con HTML no ejecuta scripts en la UI [BUG-08]", async ({ page, request }) => {
  test.fail(true, "BUG-08: XSS almacenado en el selector de producto del modal de movimientos");
  // Payload inofensivo: solo marca una variable global si llega a ejecutarse
  const p: Producto = await crearProductoAPI(request, token, {
    sku: skuUnico("XSS"), name: '<img src=x onerror="window.__xss=(window.__xss||0)+1">', category: "General", price: 1000, stock: 5, minStock: 1,
  });
  creados.push(p.id);

  await loginUI(page, "admin");
  await page.getByRole("button", { name: "+ Movimiento" }).click();
  await captura(page, "CA-10 modal de movimientos con producto malicioso");

  const ejecuciones = await page.evaluate(() => (window as unknown as { __xss?: number }).__xss ?? 0);
  expect(ejecuciones, "veces que se ejecutó el onerror").toBe(0);
});
