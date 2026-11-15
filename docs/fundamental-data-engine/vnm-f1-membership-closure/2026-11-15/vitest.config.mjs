import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
export default defineConfig({resolve:{alias:{'@':fileURLToPath(new URL('../../../../',import.meta.url))+'src','server-only':fileURLToPath(new URL('../../../../node_modules/next/dist/compiled/server-only/empty.js',import.meta.url))}},test:{testTimeout:30000,include:['tests/integration/standing-authority-version.test.ts','tests/integration/cafef-standing-ingest.test.ts'],environment:'node'}});
