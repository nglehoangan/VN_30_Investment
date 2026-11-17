import {defineConfig} from 'vitest/config';
import {fileURLToPath} from 'node:url';
export default defineConfig({resolve:{alias:{'@':fileURLToPath(new URL('../../../../src',import.meta.url)),'server-only':fileURLToPath(new URL('../../../../node_modules/next/dist/compiled/server-only/empty.js',import.meta.url))}},test:{testTimeout:30000,include:['tests/integration/current-financial-route.test.ts'],environment:'node'}});
