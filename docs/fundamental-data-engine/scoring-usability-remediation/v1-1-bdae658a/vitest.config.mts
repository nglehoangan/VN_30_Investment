import {defineConfig} from 'vitest/config';
import {fileURLToPath} from 'node:url';
export default defineConfig({resolve:{alias:{'@':fileURLToPath(new URL('../../../../src',import.meta.url))}},test:{environment:'node',maxWorkers:1,include:['docs/fundamental-data-engine/scoring-usability-remediation/v1-1-bdae658a/*.test.ts'],testTimeout:20000}});
