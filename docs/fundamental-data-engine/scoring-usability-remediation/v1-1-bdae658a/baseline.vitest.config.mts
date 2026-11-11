import {defineConfig}from 'vitest/config';
import {fileURLToPath}from 'node:url';
process.env.TZ='UTC';
export default defineConfig({resolve:{alias:{'@':fileURLToPath(new URL('../../../../src',import.meta.url))}},test:{environment:'node',maxWorkers:1,include:['tests/unit/scoring.test.ts','tests/unit/scoring-golden.test.ts','tests/unit/methodology-validation.test.ts','tests/unit/scoring-evidence-time.test.ts'],testTimeout:20000}});
