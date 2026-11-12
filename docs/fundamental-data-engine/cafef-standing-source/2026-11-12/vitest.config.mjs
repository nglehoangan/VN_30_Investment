export default {resolve:{alias:{'@':process.cwd()+'/src','server-only':process.cwd()+'/node_modules/next/dist/compiled/server-only/empty.js'}},test:{environment:'node',maxWorkers:1,pool:'threads',testTimeout:30000,include:[
 'tests/integration/cafef-standing-ingest.test.ts',
 'tests/unit/vn30-market-price-corporate-actions.test.ts',
 'tests/unit/cafef-raw-close.test.ts','tests/architecture/cafef-raw-close.test.mjs',
 'tests/unit/market-boundary.test.ts','tests/architecture/market-boundary.test.mjs']}};
