import { defineConfig } from "@playwright/test";

const WEB_PORT = 3100;
const MOCK_PORT = 8099;

// e2e runs the real Next app against e2e/mock-api.mjs (no backend, no DB).
// In sandboxes with a preinstalled browser set PW_CHROMIUM=/path/to/chromium.
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  workers: 1, // the mock API holds shared state, so tests run serially
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    launchOptions: {
      executablePath: process.env.PW_CHROMIUM || undefined,
      args: ["--no-sandbox"],
    },
  },
  webServer: [
    {
      command: "node e2e/mock-api.mjs",
      env: { MOCK_PORT: String(MOCK_PORT) },
      url: `http://localhost:${MOCK_PORT}/__log`,
      reuseExistingServer: true,
    },
    {
      command: `bunx next dev -p ${WEB_PORT}`,
      env: { BACKEND_API_URL: `http://localhost:${MOCK_PORT}` },
      url: `http://localhost:${WEB_PORT}/auth/signin`,
      reuseExistingServer: true,
      timeout: 180_000,
    },
  ],
});
