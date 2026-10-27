import { defineConfig } from "vitest/config";
import path from "node:path";
export default defineConfig({root:process.cwd(),resolve:{alias:{"@":path.join(process.cwd(),"src")}},test:{environment:"node",maxWorkers:1,hookTimeout:30000,testTimeout:20000,include:["docs/fundamental-data-engine/evidence/2026-10-27-m8-phase2-3-accounting-reconciliation-validation/validation/*.test.ts"],passWithNoTests:false}});
