/**
 * Captura de evidencias (Paso 1 y Paso 5) sobre StockPascual.
 *
 * IMPORTANTE: correr con el servidor RECIÉN ARRANCADO (datos semilla intactos),
 * porque los pasos usan los productos de la semilla (MON-24-04, TEC-MEC-03, ...)
 * y van cambiando el estado en orden.
 *
 *   terminal 1:  cd app && npm start
 *   terminal 2:  cd automation && npm run evidencias
 *
 * Guarda capturas en ../evidencias/paso1_arranque y ../evidencias/paso5_bugs
 * y un registro de lo observado en ../evidencias/paso5_bugs/registro_confirmacion.txt
 */
import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const BASE = process.env.BASE_URL || "http://localhost:3080";
const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const P1 = path.join(raiz, "evidencias", "paso1_arranque");
const P5 = path.join(raiz, "evidencias", "paso5_bugs");
fs.mkdirSync(P1, { recursive: true });
fs.mkdirSync(P5, { recursive: true });

const log = [];
const anota = (linea) => {
  log.push(linea);
  console.log(linea);
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true, locale: "es-CO" });
const page = await ctx.newPage();
const dialogos = [];
page.on("dialog", async (d) => {
  dialogos.push(`${d.type()}: ${d.message()}`);
  await d.accept();
});

/**
 * Cada acción (login, guardar, registrar, eliminar) dispara refreshAll() en la app, que pide
 * productos, dashboard, movimientos y alertas. Esperamos esas respuestas y un instante de pintado
 * antes de capturar. (waitForLoadState("networkidle") no sirve aquí: la página nunca navega.)
 */
function recarga() {
  return Promise.all([
    page.waitForResponse((r) => r.url().includes("/api/products?lowStock=true")),
    page.waitForResponse((r) => r.url().endsWith("/api/movements") && r.request().method() === "GET"),
    page.waitForResponse((r) => r.url().endsWith("/api/dashboard")),
  ]).then(() => page.waitForTimeout(200));
}

const shot = (dir, nombre) => page.screenshot({ path: path.join(dir, nombre), fullPage: true });

async function login(usuario, clave) {
  await page.goto(BASE);
  await page.getByLabel("Usuario").fill(usuario);
  await page.getByLabel("Contraseña").fill(clave);
  await Promise.all([recarga(), page.getByRole("button", { name: "Ingresar" }).click()]);
  await page.getByRole("heading", { name: "Dashboard" }).waitFor();
}
async function logout() {
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await page.getByRole("button", { name: "Ingresar" }).waitFor();
}
async function ir(vista) {
  await page.getByRole("navigation").getByRole("button", { name: vista, exact: true }).click();
  await page.getByRole("heading", { level: 2 }).filter({ hasText: vista }).waitFor();
}
async function idPorSku(sku) {
  return page.evaluate(async (s) => {
    const r = await fetch("/api/products", { headers: { Authorization: "Bearer " + localStorage.getItem("sp_token") } });
    return (await r.json()).products.find((p) => p.sku === s)?.id;
  }, sku);
}
async function stockDe(sku) {
  return page.evaluate(async (s) => {
    const r = await fetch("/api/products", { headers: { Authorization: "Bearer " + localStorage.getItem("sp_token") } });
    return (await r.json()).products.find((p) => p.sku === s)?.stock;
  }, sku);
}
async function abrirMovimiento(sku, tipo, cantidad, motivo) {
  await page.getByRole("button", { name: "+ Movimiento" }).click();
  const dlg = page.locator("#movement-dialog");
  await dlg.getByLabel("Producto").selectOption(await idPorSku(sku));
  await dlg.getByLabel("Tipo").selectOption(tipo);
  await dlg.getByLabel("Cantidad").fill(String(cantidad));
  await dlg.getByLabel("Motivo").fill(motivo);
  return dlg;
}
async function nuevoProducto(p) {
  await page.getByRole("button", { name: "+ Producto" }).click();
  const dlg = page.locator("#product-dialog");
  await dlg.getByLabel("SKU").fill(p.sku);
  await dlg.getByLabel("Nombre").fill(p.name);
  await dlg.getByLabel("Categoría").fill(p.category);
  await dlg.getByLabel("Precio (COP)").fill(String(p.price));
  await dlg.getByLabel("Stock inicial").fill(String(p.stock));
  await dlg.getByLabel("Stock mínimo").fill(String(p.minStock));
  await dlg.getByLabel("Ubicación").fill(p.location);
  return dlg;
}
/** Clic en Guardar/Registrar y esperar a que el modal cierre y la app recargue los datos */
async function enviar(dlg, boton) {
  await Promise.all([recarga(), dlg.getByRole("button", { name: boton }).click()]);
  await dlg.waitFor({ state: "hidden" });
}
async function buscar(q) {
  await page.getByPlaceholder("Buscar por nombre o SKU...").fill(q);
  // Esperar la respuesta de la búsqueda (no basta con networkidle: la tabla se pinta después del fetch)
  // loadProducts() pinta la tabla y luego pide /api/products (sin filtros) para las categorías:
  // cuando llega esa segunda respuesta, la tabla filtrada ya está pintada.
  await Promise.all([
    page.waitForResponse((r) => r.url().endsWith("/api/products")),
    page.getByRole("button", { name: "Buscar" }).click(),
  ]);
  await page.waitForTimeout(100);
}
async function descargarCSV(destino) {
  const [d] = await Promise.all([page.waitForEvent("download"), page.getByRole("link", { name: "Exportar CSV" }).click()]);
  await d.saveAs(destino);
  return fs.readFileSync(destino, "utf8");
}
/** Muestra un archivo de texto real (CSV / respuesta HTTP) en una pestaña aparte para capturarlo */
async function capturaTexto(titulo, contenido, destino) {
  const p2 = await ctx.newPage();
  const esc = (s) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;");
  await p2.setContent(
    `<body style="font:14px/1.5 monospace;padding:24px;background:#fff"><h3 style="font-family:sans-serif">${esc(titulo)}</h3><pre style="border:1px solid #ccc;padding:12px;background:#f7f7f7">${esc(contenido)}</pre></body>`
  );
  await p2.screenshot({ path: destino, fullPage: true });
  await p2.close();
}

// ───────────────────────── PASO 1 · Arranque y recorrido ─────────────────────────
await page.goto(BASE);
await shot(P1, "01_login.png");
await login("admin", "Admin123!");
await shot(P1, "02_dashboard_admin.png");
await ir("Productos");
await shot(P1, "03_productos_admin.png");
await ir("Movimientos");
await shot(P1, "04_movimientos.png");
await ir("Alertas stock");
await shot(P1, "05_alertas.png");
const csvInicial = await descargarCSV(path.join(P1, "06_inventario_exportado.csv"));
await logout();
await login("operador", "Oper123!");
await shot(P1, "07_dashboard_operador.png");
await ir("Productos");
await shot(P1, "08_productos_operador_sin_editar.png");
await logout();
anota("PASO 1: recorrido admin y operador capturado.");

// ───────────────────────── PASO 5 · Confirmación de bugs ─────────────────────────
await login("admin", "Admin123!");

// BUG-03 · valor de inventario (antes de tocar datos)
const valor = await page.locator(".metric").filter({ hasText: "Valor inventario" }).locator("strong").innerText();
const prods = await page.evaluate(async () => {
  const r = await fetch("/api/products", { headers: { Authorization: "Bearer " + localStorage.getItem("sp_token") } });
  return (await r.json()).products;
});
const esperado = prods.reduce((a, p) => a + p.stock * p.price, 0);
await shot(P5, "bug03_valor_inventario.png");
anota(`BUG-03: dashboard muestra "${valor}"; Σ stock×precio = ${esperado.toLocaleString("es-CO")} COP.`);

// BUG-04 · CSV incompleto
await ir("Productos");
await shot(P5, "bug04a_productos_en_pantalla.png");
const filasCsv = csvInicial.trim().split("\n").length - 1;
fs.copyFileSync(path.join(P1, "06_inventario_exportado.csv"), path.join(P5, "bug04_inventario_exportado.csv"));
await capturaTexto(`inventario.csv descargado — ${filasCsv} filas de datos vs ${prods.length} productos en pantalla`, csvInicial, path.join(P5, "bug04b_csv_descargado.png"));
anota(`BUG-04: pantalla ${prods.length} productos; CSV ${filasCsv} filas. Faltan: ${prods.slice(filasCsv).map((p) => p.sku).join(", ")}.`);

// BUG-07 · búsqueda case-sensitive
await buscar("Mouse");
const nMouse = await page.locator("#products-table tbody tr").count();
await shot(P5, "bug07a_busqueda_Mouse.png");
await buscar("mouse");
const nmouse = await page.locator("#products-table tbody tr").count();
await shot(P5, "bug07b_busqueda_mouse.png");
await buscar("MOUSE");
const nMOUSE = await page.locator("#products-table tbody tr").count();
await buscar("mou-wl-02");
const nSku = await page.locator("#products-table tbody tr").count();
await buscar("");
anota(`BUG-07: "Mouse"→${nMouse} fila(s), "mouse"→${nmouse}, "MOUSE"→${nMOUSE}, "mou-wl-02"→${nSku}.`);

// BUG-01 · OUT deja stock negativo (MON-24-04 stock 3)
let dlg = await abrirMovimiento("MON-24-04", "OUT", 10, "Entrega laboratorio de redes");
await shot(P5, "bug01a_formulario_out_10.png");
await enviar(dlg, "Registrar");
await ir("Productos");
await buscar("MON-24-04");
await shot(P5, "bug01b_stock_negativo.png");
anota(`BUG-01: MON-24-04 stock 3, OUT 10 → stock ${await stockDe("MON-24-04")}. Sin mensaje de error.`);
await buscar("");

// BUG-02 · ADJUST suma (TEC-MEC-03 stock 22, conteo físico 20)
dlg = await abrirMovimiento("TEC-MEC-03", "ADJUST", 20, "Conteo físico noviembre");
await shot(P5, "bug02a_formulario_adjust_20.png");
await enviar(dlg, "Registrar");
await buscar("TEC-MEC-03");
await shot(P5, "bug02b_adjust_suma.png");
anota(`BUG-02: TEC-MEC-03 stock 22, ADJUST 20 → stock ${await stockDe("TEC-MEC-03")} (esperado 20).`);
await buscar("");

// BUG-05 · SKU duplicado
dlg = await nuevoProducto({ sku: "CAB-USB-01", name: "Cable USB-C 2m", category: "Accesorios", price: 24900, stock: 15, minStock: 5, location: "A-02" });
await enviar(dlg, "Guardar");
await buscar("CAB-USB-01");
const nDup = await page.locator("#products-table tbody tr").count();
await shot(P5, "bug05_sku_duplicado.png");
anota(`BUG-05: tras crear otro producto con SKU CAB-USB-01, la búsqueda devuelve ${nDup} filas con ese SKU.`);
await buscar("");

// BUG-06 · precio y stock negativos
dlg = await nuevoProducto({ sku: "NEG-TEST-01", name: "Producto prueba negativos", category: "General", price: -5000, stock: -10, minStock: 0, location: "Z-01" });
await shot(P5, "bug06a_formulario_negativos.png");
await enviar(dlg, "Guardar");
await buscar("NEG-TEST-01");
await shot(P5, "bug06b_producto_negativo_creado.png");
anota(`BUG-06: NEG-TEST-01 creado con precio -5000 y stock ${await stockDe("NEG-TEST-01")}. Modal sin error.`);
await buscar("");

// BUG-12 · SKU vacío
dlg = await nuevoProducto({ sku: "", name: "Pinza de punta (sin SKU)", category: "Herramientas", price: 32000, stock: 6, minStock: 2, location: "H-04" });
await enviar(dlg, "Guardar");
await buscar("Pinza");
await shot(P5, "bug12_sku_vacio.png");
const sinSku = await page.evaluate(async () => {
  const r = await fetch("/api/products", { headers: { Authorization: "Bearer " + localStorage.getItem("sp_token") } });
  return (await r.json()).products.filter((p) => p.sku === "").length;
});
anota(`BUG-12: productos con SKU vacío en el sistema: ${sinSku}.`);
await buscar("");

// BUG-11 · edición sin validación (SKU repetido y precio negativo)
await buscar("AUD-BT-05");
await page.locator("#products-table tbody tr").first().getByRole("button", { name: "Editar" }).click();
dlg = page.locator("#product-dialog");
await dlg.getByLabel("SKU").fill("MOU-WL-02");
await dlg.getByLabel("Precio (COP)").fill("-99000");
await shot(P5, "bug11a_edicion_sku_y_precio.png");
await enviar(dlg, "Guardar");
await buscar("MOU-WL-02");
await shot(P5, "bug11b_edicion_guardada.png");
anota(`BUG-11: Audífonos editado a SKU MOU-WL-02 y precio -99000; búsqueda MOU-WL-02 → ${await page.locator("#products-table tbody tr").count()} filas.`);
await buscar("");

// BUG-10 · CSV sin escape (coma en el nombre)
await buscar("Cable USB-C 1m");
await page.locator("#products-table tbody tr").first().getByRole("button", { name: "Editar" }).click();
dlg = page.locator("#product-dialog");
await dlg.getByLabel("Nombre").fill("Cable USB-C 1m, trenzado");
await enviar(dlg, "Guardar");
await buscar("");
const csvComa = await descargarCSV(path.join(P5, "bug10_inventario_coma.csv"));
const filaCab = csvComa.split("\n").find((l) => l.startsWith("CAB-USB-01,Cable USB-C 1m"));
await capturaTexto(
  `inventario.csv — la fila de CAB-USB-01 tiene ${filaCab.split(",").length} columnas (encabezado: 7)`,
  csvComa,
  path.join(P5, "bug10_csv_sin_escape.png")
);
anota(`BUG-10: fila "${filaCab}" → ${filaCab.split(",").length} columnas; encabezado tiene 7.`);

// BUG-09 · eliminar producto con movimientos (MON-24-04 tiene el OUT del BUG-01)
await buscar("MON-24-04");
await Promise.all([recarga(), page.locator("#products-table tbody tr").first().getByRole("button", { name: "Eliminar" }).click()]);
await buscar("");
await ir("Movimientos");
await shot(P5, "bug09_movimientos_huerfanos.png");
const huerfanos = await page.locator("#movements-table").getByText("(producto eliminado)").count();
await ir("Dashboard");
const movDash = await page.locator(".metric").filter({ hasText: "Movimientos" }).locator("strong").innerText();
anota(`BUG-09: tras eliminar MON-24-04, Movimientos muestra ${huerfanos} fila(s) "(producto eliminado)" con SKU "—"; dashboard sigue contando ${movDash} movimientos.`);

// BUG-14 · stock inicial sin movimiento que lo respalde
await ir("Productos");
dlg = await nuevoProducto({ sku: "MUL-DIG-07", name: "Multímetro digital", category: "Laboratorio", price: 75000, stock: 25, minStock: 5, location: "L-07" });
await enviar(dlg, "Guardar");
await ir("Movimientos");
const movMul = await page.locator("#movements-table tbody tr").filter({ hasText: "MUL-DIG-07" }).count();
await shot(P5, "bug14_stock_inicial_sin_movimiento.png");
anota(`BUG-14: MUL-DIG-07 creado con stock 25; filas en Movimientos para ese SKU: ${movMul}.`);

// BUG-08 · XSS almacenado en el selector del modal de movimientos
await ir("Productos");
const payload = `<img src=x onerror="document.querySelector('#view-subtitle').textContent='XSS ejecutado - token: '+localStorage.getItem('sp_token')">`;
dlg = await nuevoProducto({ sku: "XSS-01", name: payload, category: "General", price: 1000, stock: 5, minStock: 1, location: "Z-02" });
await enviar(dlg, "Guardar");
// El onerror se dispara cuando el navegador intenta cargar la imagen "x"
await page.waitForFunction(() => document.querySelector("#view-subtitle")?.textContent?.startsWith("XSS"), null, { timeout: 5000 }).catch(() => {});
await shot(P5, "bug08a_xss_ejecutado_tras_guardar.png");
const subt = await page.locator("#view-subtitle").innerText();
await page.getByRole("button", { name: "+ Movimiento" }).click();
await shot(P5, "bug08b_xss_modal_movimientos.png");
await page.locator("#movement-dialog").getByRole("button", { name: "Cancelar" }).click();
// Variante de la guía: alert(1)
const antes = dialogos.length;
dlg = await nuevoProducto({ sku: "XSS-02", name: "<img src=x onerror=alert(1)>", category: "General", price: 1000, stock: 5, minStock: 1, location: "Z-03" });
await enviar(dlg, "Guardar");
await page.waitForTimeout(500); // margen para que el navegador dispare el onerror de la imagen
anota(`BUG-08: subtítulo cambiado por el script → "${subt.slice(0, 60)}..."; payload alert(1) abrió ${dialogos.length - antes} diálogo(s): ${dialogos.slice(antes).join(" | ")}`);

// BUG-13 · el token sigue válido tras cerrar sesión
const tokenViejo = await page.evaluate(() => localStorage.getItem("sp_token"));
await logout();
const r = await page.request.get(`${BASE}/api/me`, { headers: { Authorization: `Bearer ${tokenViejo}` } });
const cuerpo = await r.text();
const r2 = await page.request.post(`${BASE}/api/movements`, {
  headers: { Authorization: `Bearer ${tokenViejo}` },
  data: { productId: "p1", type: "OUT", quantity: 1, reason: "Token tras logout" },
});
const txt13 = [
  "1) Login admin en la UI y lectura de localStorage.sp_token",
  `   token = ${tokenViejo}`,
  "2) Clic en 'Cerrar sesión' (la UI vuelve al login)",
  "3) GET /api/me con el token anterior",
  `   HTTP ${r.status()}  ${cuerpo}`,
  "4) POST /api/movements (OUT 1 de p1) con el token anterior",
  `   HTTP ${r2.status()}  ${(await r2.text()).slice(0, 160)}`,
  "",
  "Esperado: 401 No autenticado en ambos casos (sesión invalidada en el servidor).",
].join("\n");
fs.writeFileSync(path.join(P5, "bug13_token_tras_logout.txt"), txt13);
await capturaTexto("Token reutilizado después de cerrar sesión", txt13, path.join(P5, "bug13_token_tras_logout.png"));
anota(`BUG-13: /api/me con token tras logout → HTTP ${r.status()}; movimiento con token viejo → HTTP ${r2.status()}.`);

// BUG-18 · producto sin precio creado por API deja el valor del inventario en $ 0
const tk = (await (await page.request.post(`${BASE}/api/login`, { data: { username: "admin", password: "Admin123!" } })).json()).token;
const r18 = await page.request.post(`${BASE}/api/products`, {
  headers: { Authorization: `Bearer ${tk}` },
  data: { sku: "NP-01", name: "Sin precio" },
});
const prod18 = (await r18.json()).product;
await login("admin", "Admin123!");
const valor18 = await page.locator(".metric").filter({ hasText: "Valor inventario" }).locator("strong").innerText();
await shot(P5, "bug18_valor_inventario_en_cero.png");
anota(`BUG-18: POST /api/products {sku: NP-01, name: "Sin precio"} → HTTP ${r18.status()}, price=${JSON.stringify(prod18?.price)}; el dashboard muestra Valor inventario "${valor18}".`);

fs.writeFileSync(path.join(P5, "registro_confirmacion.txt"), `Corrida: ${new Date().toISOString()}  ·  ${BASE}\n\n` + log.join("\n") + "\n");
await browser.close();
