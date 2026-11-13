export default {
 resolve:{alias:{'@':process.cwd()+'/src','server-only':process.cwd()+'/node_modules/next/dist/compiled/server-only/empty.js'}},
 test:{environment:'node',maxWorkers:1,pool:'threads',testTimeout:30000,include:[
 'docs/fundamental-data-engine/vnm-final-s1-s5-scoring/2026-11-13/execution.test.ts',
 'tests/unit/scoring.test.ts','tests/unit/scoring-golden.test.ts','tests/unit/scoring-evidence-time.test.ts',
 'tests/unit/scoring-readiness.test.ts','tests/unit/scoring-ai-review.test.ts','tests/unit/personal-ai-provenance.test.ts',
 'tests/unit/cafef-raw-close.test.ts','tests/unit/economic-normalization.test.ts'
 ]}
};
