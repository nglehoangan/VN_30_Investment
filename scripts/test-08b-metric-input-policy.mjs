import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {metricInputs,CAPITAL_PREFERENCE_AUTHORITY} from './lib/08b-metric-input-policy.mjs';
const text=readFileSync('docs/03 SCORING/METRIC_DEFINITIONS.md','utf8');
const metric={metricId:'FH-BS-BANK-01',canonicalInputs:['BANK_REPORTED_CAR','BANK_REPORTED_CET1']};
test('frozen disclosure preference keeps total CAR mandatory',()=>{
 const p=metricInputs(metric,'BANK',new Set(),text);
 assert.deepEqual(p.required,['BANK_REPORTED_CAR']);assert.equal(p.preferred[0].status,'PREFERRED_EVIDENCE_NOT_ESTABLISHED');
 assert.match(p.preferred[0].treatment,/NO_ZERO_NO_N_R_NO_SCORE_NO_WEIGHT_REDISTRIBUTION/);
});
test('disclosed CET1 remains a verification requirement',()=>assert.deepEqual(metricInputs(metric,'BANK',new Set(['BANK_REPORTED_CET1']),text).required,metric.canonicalInputs));
test('unrelated metrics and sector routes preserve every input',()=>{
 assert.deepEqual(metricInputs({...metric,metricId:'OTHER'},'BANK',new Set(),text).required,metric.canonicalInputs);
 assert.deepEqual(metricInputs(metric,'SECURITIES',new Set(),text).required,metric.canonicalInputs);
});
test('missing authority or missing mandatory CAR cannot authorize preference',()=>{
 assert.throws(()=>metricInputs(metric,'BANK',new Set(),text.replace(CAPITAL_PREFERENCE_AUTHORITY,'')),/AUTHORITY_REQUIRED/);
 assert.throws(()=>metricInputs({...metric,canonicalInputs:['BANK_REPORTED_CET1']},'BANK',new Set(),text),/AUTHORITY_REQUIRED/);
});
test('bank accrual quality uses the frozen bank evidence substitute',()=>{
 const cash={metricId:'BQ-CASH-03',canonicalInputs:['RECEIVABLES','INVENTORY','CAPITALIZED_COSTS']};
 const p=metricInputs(cash,'BANK',new Set(),text);
 assert.deepEqual(p.required,[]);assert.equal(p.substitute.requiredEvidence.length,6);
 assert.equal(p.substitute.status,'REQUIRED_REVIEWED_BANK_EARNINGS_QUALITY_CONTEXT');
 assert.deepEqual(metricInputs(cash,'INDUSTRIAL',new Set(),text).required,cash.canonicalInputs);
 assert.throws(()=>metricInputs(cash,'BANK',new Set(),''),/AUTHORITY_REQUIRED/);
});
