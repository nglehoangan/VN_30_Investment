import './lib/ts-runtime.mjs';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const {verifyLineageAcceptanceSnapshot}=await import('../src/infrastructure/personal-ai/review-lineage.ts');
const path='docs/fundamental-data-engine/scoring-dataset-acceptance/2026-11-02/vn30-lineage-v1/acceptance-snapshot.json';
const sha256=createHash('sha256').update(readFileSync(path)).digest('hex');
const {results,...summary}=await verifyLineageAcceptanceSnapshot(process.cwd(),{reference:'VN30_LINEAGE_REVIEW_ONLY',path,sha256});
console.log(JSON.stringify({...summary,validatedGraphHashes:results.map(r=>({ticker:r.ticker,hash:r.contentHash}))},null,2));
