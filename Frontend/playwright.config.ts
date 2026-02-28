import { defineConfig } from "@playwright/test";

const webPort = Number(process.env.PLAYWRIGHT_PORT ?? "3000");

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  use: {
    baseURL: `http://127.0.0.1:${webPort}`,
    headless: true,
  },
  webServer: {
    command: "node .output/server/index.mjs",
    port: webPort,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
    env: {
      HOST: "127.0.0.1",
      PORT: String(webPort),
      BACKEND_URL: "http://127.0.0.1:8080",
    },
  },
});
