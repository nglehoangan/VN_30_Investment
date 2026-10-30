import { defineConfig } from "vitest/config";
import path from "node:path";
export default defineConfig({ resolve: { alias: { "@": path.resolve("src") } }, test: { environment: "node", include: ["docs/fundamental-data-engine/evidence/2026-10-28-b1-b5-runtime-integration/actual-owner.test.tsx"], testTimeout: 30000 } });
