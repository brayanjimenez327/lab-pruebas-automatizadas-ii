import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  // StockPascual guarda todo en memoria y todos los tests comparten el mismo servidor:
  // en paralelo, un test cambiaría el stock o el valor de inventario que otro está midiendo.
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: "http://localhost:3080",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  reporter: [["list"], ["html", { open: "never" }]],
});
