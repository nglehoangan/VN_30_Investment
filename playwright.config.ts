import { defineConfig, devices } from "@playwright/test";
const baseURL = process.env.VN30_E2E_BASE_URL;
if (!baseURL || !/^http:\/\/127\.0\.0\.1:\d+$/.test(baseURL)) {
  throw new Error("Run pnpm test:e2e to start and verify an owned loopback server");
}
export default defineConfig({
  testDir: "./tests/e2e", fullyParallel: false, workers: 1, retries: 0,
  timeout: 30000, globalTimeout: 60000, forbidOnly: true,
  reporter: "list", outputDir: "test-results",
  use: { baseURL, timezoneId: "UTC", locale: "vi-VN", trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
