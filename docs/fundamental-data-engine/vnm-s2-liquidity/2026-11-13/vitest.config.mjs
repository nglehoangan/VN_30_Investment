import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
export default defineConfig({resolve:{alias:{'@':fileURLToPath(new URL('../../../../',import.meta.url))+'src'}},test:{include:['tests/unit/economic-normalization.test.ts','tests/unit/scoring.test.ts','tests/unit/scoring-golden.test.ts'],environment:'node'}});
