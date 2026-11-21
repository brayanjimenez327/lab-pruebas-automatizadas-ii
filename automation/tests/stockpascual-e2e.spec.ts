import { test, expect } from "@playwright/test";
import {
  loginUI,
  irA,
  crearProductoUI,
  registrarMovimientoUI,
  filaProducto,
  stockEnTabla,
  tokenAPI,
  productosAPI,
  eliminarProductoAPI,
  skuUnico,
} from "./helpers";

/**
 * E2E de negocio (Paso 7): login → crear producto → IN → OUT → stock → alerta → movimientos.
 *
 * Datos:
 *   stock inicial 5, mínimo 10, IN +20 (queda 25), OUT -18 (queda 7).
 *   Como 7 <= 10, el producto debe aparecer en Alertas y en el panel de stock bajo.
 * Todos los cálculos esperados se derivan de estas constantes, no de lo que muestra la app.
 */
const STOCK_INICIAL = 5;
const MINIMO = 10;
const ENTRADA = 20;
const SALIDA = 18;
const STOCK_ESPERADO = STOCK_INICIAL + ENTRADA - SALIDA; // 7

test.describe("Flujo E2E de almacén", () => {
  // Los dos tests comparten el producto creado: se ejecutan en orden y en el mismo worker
  test.describe.configure({ mode: "serial" });

  const sku = skuUnico("E2E");
  const nombre = `Cautín de soldadura ${sku}`;

  test.afterAll(async ({ request }) => {
    // Limpieza: borrar el producto creado para no contaminar otras corridas
    const token = await tokenAPI(request, "admin");
    const p = (await productosAPI(request, token)).find((x) => x.sku === sku);
    if (p) await eliminarProductoAPI(request, token, p.id);
  });

  test("ingreso, salida y alerta de stock bajo", async ({ page, request }) => {
    await test.step("1. Login como admin", async () => {
      await loginUI(page, "admin");
    });

    await test.step("2. Crear producto con SKU único", async () => {
      await crearProductoUI(page, {
        sku, name: nombre, category: "Laboratorio", price: 85000, stock: STOCK_INICIAL, minStock: MINIMO, location: "L-02",
      });
      await expect(page.locator("#product-dialog")).not.toBeVisible();
      await irA(page, "Productos");
      await expect(filaProducto(page, sku)).toHaveCount(1);
      expect(await stockEnTabla(page, sku)).toBe(STOCK_INICIAL);
    });

    // El <select> del modal usa el id interno del producto; se lee del backend
    const token = await tokenAPI(request, "admin");
    const producto = (await productosAPI(request, token)).find((x) => x.sku === sku)!;
    expect(producto, "el producto debe existir en el backend").toBeDefined();

    await test.step(`3. Movimiento IN de ${ENTRADA} unidades`, async () => {
      await registrarMovimientoUI(page, producto.id, "IN", ENTRADA, "Compra almacén");
      await expect(page.locator("#movement-dialog")).not.toBeVisible();
      await expect.poll(() => stockEnTabla(page, sku)).toBe(STOCK_INICIAL + ENTRADA);
    });

    await test.step(`4. Movimiento OUT de ${SALIDA} unidades (menor al stock)`, async () => {
      await registrarMovimientoUI(page, producto.id, "OUT", SALIDA, "Entrega laboratorio de electrónica");
      await expect(page.locator("#movement-dialog")).not.toBeVisible();
    });

    await test.step(`5. El stock en Productos es ${STOCK_ESPERADO} y el estado es "Bajo"`, async () => {
      await expect.poll(() => stockEnTabla(page, sku)).toBe(STOCK_ESPERADO);
      await expect(filaProducto(page, sku).getByText("Bajo", { exact: true })).toBeVisible();
    });

    await test.step("6. Aparece en Alertas porque stock <= mínimo", async () => {
      await irA(page, "Alertas stock");
      const filaAlerta = page.locator("#alerts-table tbody tr").filter({ hasText: sku });
      await expect(filaAlerta).toHaveCount(1);
      await expect(filaAlerta.locator("td").nth(4)).toHaveText(String(STOCK_ESPERADO));
      await test.info().attach("alertas", { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
    });

    await test.step("7. Movimientos registra IN y OUT con el usuario admin", async () => {
      await irA(page, "Movimientos");
      const filas = page.locator("#movements-table tbody tr").filter({ hasText: sku });
      await expect(filas).toHaveCount(2);
      // La tabla está ordenada del más reciente al más antiguo
      await expect(filas.nth(0).locator("td").nth(3)).toHaveText("OUT");
      await expect(filas.nth(0).locator("td").nth(4)).toHaveText(String(SALIDA));
      await expect(filas.nth(1).locator("td").nth(3)).toHaveText("IN");
      await expect(filas.nth(1).locator("td").nth(4)).toHaveText(String(ENTRADA));
      await expect(filas.nth(0).locator("td").nth(6)).toHaveText("admin");
    });
  });

  test("export CSV incluye el producto recién creado [BUG-04]", async ({ page }) => {
    // Cierre del flujo de negocio. Falla por BUG-04 (el CSV omite los 2 últimos productos)
    test.fail(true, "BUG-04: el producto recién creado no aparece en el CSV");
    await loginUI(page, "admin");
    const [descarga] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("link", { name: "Exportar CSV" }).click(),
    ]);
    const csv = (await import("fs")).readFileSync((await descarga.path())!, "utf8");
    await test.info().attach("inventario.csv", { body: csv, contentType: "text/csv" });
    expect(csv).toContain(sku);
  });
});
