import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fundamentalFreshnessWindow as route} from './lib/08b-fundamental-freshness-window.mjs';
const o={securityId:'security',ticker:'TICKER',itemId:'CFO',reportingScope:'CONSOLIDATED',periodType:'YTD',periodStart:'2025-01-01',periodEnd:'2025-06-30',normalized:{value:'123000000'}};
const cycle={status:'VERIFIED_REQUIRED_CURRENT_PUBLIC_PERIOD',requiredPeriod:'2026-06-30'},version={requiredVersionBodyHashes:['current-body']};
const q={bodyHash:'current-body',ticker:'TICKER',documentId:'doc',status:'TECHNICALLY_QUALIFIED_REVIEW_CANDIDATE',period:{end:'2026-06-30'},scope:'CONSOLIDATED'};
const c={bodyHash:'current-body',documentId:'doc',securityId:'security',itemId:'CFO',comparativeColumn:true,status:'VERIFIED_TRANSCRIPTION_REVIEW_CANDIDATE',scope:'CONSOLIDATED',period:{start:'2025-01-01',end:'2025-06-30'},periodType:'YTD',normalizedCanonicalValue:'123000000',sourcePageEvidenceHashes:['reader-a','reader-b']};
const w={securityId:'security',itemId:'CFO',reportingScope:'CONSOLIDATED',periodStart:'2025-01-01',periodEnd:'2025-06-30',servesMetrics:['frozen-metric'],authorityReferences:['frozen-authority']};
const run=(observation=o,cell=c,windows=[w],versions=version,document=q)=>route(observation,'current-body',cycle,versions,[document],[cell],windows);
test('required historical operand uses its exact window confirmed in current report',()=>{
 const r=run();assert.equal(r.kind,'REQUIRED_HISTORICAL_OPERAND_CONFIRMED_IN_CURRENT_PUBLIC_REPORT');assert.equal(r.requiredPeriodOrVersion,'2025-06-30');assert.equal(r.currentReportingPeriod,'2026-06-30');
});
test('old document, unrequired history, and unverified inventories cannot establish currentness',()=>{
 assert.equal(run(o,c,[]),null);assert.equal(run(o,c,[w],{requiredVersionBodyHashes:['old-body']}),null);
 assert.equal(run(o,c,[w],version,{...q,period:{end:'2025-06-30'}}),null);
 assert.equal(route(o,'current-body',{...cycle,status:'UNKNOWN'},version,[q],[c],[w]),null);
});
test('comparative proof must bind value, window, scope, item and two source readings',()=>{
 for(const change of [{comparativeColumn:false},{normalizedCanonicalValue:'999'},{scope:'SEPARATE_STANDALONE'},{itemId:'REVENUE'},{period:{start:'2025-04-01',end:'2025-06-30'}},{sourcePageEvidenceHashes:['one']}])assert.equal(run(o,{...c,...change}),null);
});
test('current required reporting window preserves existing route',()=>assert.equal(run({...o,periodEnd:'2026-06-30'}).kind,'CURRENT_REPORTING_WINDOW'));
