import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:3000",
    headless: true,
  },
  webServer: {
    command: "node .output/server/index.mjs",
    port: 3000,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
    env: {
      HOST: "127.0.0.1",
      PORT: "3000",
      BACKEND_URL: "http://127.0.0.1:8080",
    },
  },
});
