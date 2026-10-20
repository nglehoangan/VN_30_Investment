/** Synthetic rejection probes only; no lifecycle publication, scoring or ranking. */
import '../../../../scripts/lib/ts-runtime.mjs';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
const {seal}=await import('../../../../src/domain/market-boundary/validation.ts');
const {snapshotHash}=await import('../../../../src/infrastructure/fundamentals/snapshot-hash.ts');
const {harness,analysis}=await import('../../../../tests/fixtures/market-boundary.ts');
const {normalizeTcbsEod}=await import('../../../../src/domain/market-boundary/tcbs-eod.ts');
const P='docs/fundamental-data-engine/evidence/2026-10-20-di14-di15-final-acceptance',binding=JSON.parse(readFileSync('data/market-boundary/active-candidate.json','utf8')),c=JSON.parse(readFileSync(binding.path,'utf8')),results=[];
const a=analysis(harness());
for(const [id,body] of [['analysis_missing_market_freshness',{...a.body,freshness:null}],['analysis_failed_market_freshness',{...a.body,freshness:{...a.body.freshness,status:'BLOCKED'}}],['analysis_missing_market_snapshot',{...a.body,market:null}]]){
 assert.throws(()=>seal('ANALYSIS','synthetic-negative-only',a.createdAt,a.knownAt,body,snapshotHash));results.push({id,status:'PASS_REJECTED',fixture:'SYNTHETIC_CONTRACT_ONLY'});
}
assert.throws(()=>normalizeTcbsEod({ticker:c.profile.identities[0].ticker,unexpectedSchema:[]},c.market.body.sources[0],c.profile));results.push({id:'provider_schema_drift_missing_data_array',status:'PASS_REJECTED',fixture:'SYNTHETIC_PROVIDER_SHAPE_ONLY'});
writeFileSync(P+'/SUPPLEMENTAL_NEGATIVE_RESULTS.json',JSON.stringify({status:'PASS',results,productionWrites:0,investmentDecisionCreated:false},null,2)+'\n');console.log('PASS: '+results.length+' supplemental rejection probes');
