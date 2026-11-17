import {defineConfig} from 'vitest/config';
import {fileURLToPath} from 'node:url';
export default defineConfig({resolve:{alias:{'@':fileURLToPath(new URL('../../../../src',import.meta.url))}},test:{include:['tests/unit/retained-financial-admission.test.ts','tests/unit/fundamentals-normalization.test.ts'],environment:'node'}});
