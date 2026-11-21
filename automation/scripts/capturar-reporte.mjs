/**
 * Paso 7: copia el reporte HTML de Playwright a evidencias/paso7_automation/reporte_html
 * y toma 2 capturas (resumen y detalle del E2E).
 * Correr después de `npm test`:   npm run evidencias:reporte
 */
import { chromium } from "@playwright/test";
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const REPORTE = path.join(aqui, "..", "playwright-report");
const P7 = path.join(aqui, "..", "..", "evidencias", "paso7_automation");
fs.mkdirSync(P7, { recursive: true });
fs.cpSync(REPORTE, path.join(P7, "reporte_html"), { recursive: true });

// El reporte necesita servirse por HTTP (no abre bien con file://)
const servidor = http.createServer((req, res) => {
  let ruta = decodeURIComponent(req.url.split("?")[0]);
  if (ruta === "/") ruta = "/index.html";
  fs.readFile(path.join(REPORTE, path.normalize(ruta)), (err, data) => {
    if (err) { res.statusCode = 404; return res.end(); }
    res.end(data);
  });
});
await new Promise((ok) => servidor.listen(9333, ok));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
await page.goto("http://localhost:9333/");
await page.getByText("ingreso, salida y alerta de stock bajo").first().waitFor();
await page.screenshot({ path: path.join(P7, "01_reporte_html_resumen.png"), fullPage: true });
await page.getByText("ingreso, salida y alerta de stock bajo").first().click();
await page.getByText("1. Login como admin").first().waitFor();
await page.screenshot({ path: path.join(P7, "02_reporte_e2e_pasos.png"), fullPage: true });
await browser.close();
servidor.close();
console.log("Reporte y capturas guardados en evidencias/paso7_automation");
