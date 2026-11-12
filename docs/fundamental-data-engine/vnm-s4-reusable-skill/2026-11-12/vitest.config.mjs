export default {
 resolve:{alias:{'@':process.cwd()+'/src'}},
 test:{environment:'node',maxWorkers:1,pool:'threads',include:[
 'tests/unit/vn30-market-price-corporate-actions.test.ts',
 'tests/unit/cafef-raw-close.test.ts','tests/architecture/cafef-raw-close.test.mjs',
 'tests/unit/market-boundary.test.ts','tests/architecture/market-boundary.test.mjs']}
};
