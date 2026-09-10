import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
process.env.TZ = "UTC";
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { environment: "jsdom", setupFiles: ["./tests/setup.ts"], include: ["tests/unit/**/*.test.{ts,tsx}", "tests/architecture/**/*.test.mjs", "tests/integration/**/*.test.ts"], hookTimeout: 30000, testTimeout: 20000, passWithNoTests: false },
});
