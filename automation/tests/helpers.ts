import { expect, type APIRequestContext, type Page } from "@playwright/test";
import path from "path";

/** Carpeta donde se guardan las capturas de bugs (Paso 5) */
export const BUGS_DIR = path.join(__dirname, "..", "..", "evidencias", "paso5_bugs");

export const USERS = {
  admin: { username: "admin", password: "Admin123!", name: "Ana Admin" },
  operador: { username: "operador", password: "Oper123!", name: "Carlos Operador" },
} as const;

export type Producto = {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  minStock: number;
  location: string;
};

/** SKU dinámico para no chocar con datos existentes ni entre corridas */
export function skuUnico(prefijo = "QA") {
  return `${prefijo}-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
}

/** Login por la interfaz (lo que hace un usuario real) */
export async function loginUI(page: Page, rol: keyof typeof USERS) {
  const u = USERS[rol];
  await page.goto("/");
  await page.getByLabel("Usuario").fill(u.username);
  await page.getByLabel("Contraseña").fill(u.password);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByText(u.name)).toBeVisible();
}

export async function irA(page: Page, vista: "Dashboard" | "Productos" | "Movimientos" | "Alertas stock") {
  await page.getByRole("navigation").getByRole("button", { name: vista, exact: true }).click();
  await expect(page.getByRole("heading", { level: 2, name: vista })).toBeVisible();
}

/** Login por API: se usa solo para preparar datos o leer el estado real del backend */
export async function tokenAPI(request: APIRequestContext, rol: keyof typeof USERS = "admin") {
  const u = USERS[rol];
  const res = await request.post("/api/login", { data: { username: u.username, password: u.password } });
  expect(res.ok()).toBeTruthy();
  return (await res.json()).token as string;
}

export const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

export async function crearProductoAPI(request: APIRequestContext, token: string, datos: Partial<Producto>) {
  const res = await request.post("/api/products", { headers: auth(token), data: datos });
  expect(res.status(), "creación de producto por API").toBe(201);
  return (await res.json()).product as Producto;
}

export async function productosAPI(request: APIRequestContext, token: string) {
  const res = await request.get("/api/products", { headers: auth(token) });
  return (await res.json()).products as Producto[];
}

export async function eliminarProductoAPI(request: APIRequestContext, token: string, id: string) {
  await request.delete(`/api/products/${id}`, { headers: auth(token) });
}

/** Crea un producto desde el modal "+ Producto" (solo admin) */
export async function crearProductoUI(
  page: Page,
  p: { sku: string; name: string; category: string; price: number; stock: number; minStock: number; location?: string }
) {
  await page.getByRole("button", { name: "+ Producto" }).click();
  const dlg = page.locator("#product-dialog");
  await expect(dlg.getByRole("heading", { name: "Nuevo producto" })).toBeVisible();
  await dlg.getByLabel("SKU").fill(p.sku);
  await dlg.getByLabel("Nombre").fill(p.name);
  await dlg.getByLabel("Categoría").fill(p.category);
  await dlg.getByLabel("Precio (COP)").fill(String(p.price));
  await dlg.getByLabel("Stock inicial").fill(String(p.stock));
  await dlg.getByLabel("Stock mínimo").fill(String(p.minStock));
  await dlg.getByLabel("Ubicación").fill(p.location ?? "Z-99");
  await dlg.getByRole("button", { name: "Guardar" }).click();
}

/** Registra un movimiento desde el modal "+ Movimiento" */
export async function registrarMovimientoUI(
  page: Page,
  productId: string,
  tipo: "IN" | "OUT" | "ADJUST",
  cantidad: number,
  motivo = "Prueba QA"
) {
  await page.getByRole("button", { name: "+ Movimiento" }).click();
  const dlg = page.locator("#movement-dialog");
  await expect(dlg.getByRole("heading", { name: "Registrar movimiento" })).toBeVisible();
  await dlg.getByLabel("Producto").selectOption(productId);
  await dlg.getByLabel("Tipo").selectOption(tipo);
  await dlg.getByLabel("Cantidad").fill(String(cantidad));
  await dlg.getByLabel("Motivo").fill(motivo);
  await dlg.getByRole("button", { name: "Registrar" }).click();
}

/** Fila de la tabla de Productos que contiene el SKU dado */
export function filaProducto(page: Page, sku: string) {
  return page.locator("#products-table tbody tr").filter({ has: page.locator("td.sku", { hasText: sku }) });
}

/** Lee la columna Stock (5.ª columna) de la fila del SKU */
export async function stockEnTabla(page: Page, sku: string) {
  const txt = await filaProducto(page, sku).locator("td").nth(4).innerText();
  return Number(txt.trim());
}

/** Formato de dinero igual al que usa la app (es-CO, COP, sin decimales) */
export const cop = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
