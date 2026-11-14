import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  timeout: 75000,
  workers: 2,
  use: {
    baseURL: "http://127.0.0.1:5173",
    channel: process.env.IGNIS_BROWSER || "chrome",
  },
  reporter: "list",
});
