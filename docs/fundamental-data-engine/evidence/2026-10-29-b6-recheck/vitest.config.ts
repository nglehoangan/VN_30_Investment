import { defineConfig } from "vitest/config";
import path from "node:path";
export default defineConfig({ resolve: { alias: { "@": path.resolve("src") } }, test: { environment: "node", include: ["docs/fundamental-data-engine/evidence/2026-10-29-b6-recheck/runtime.test.ts"], testTimeout: 30000 } });
