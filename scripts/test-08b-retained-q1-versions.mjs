import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {retainedQ1Versions} from './lib/08b-retained-q1-versions.mjs';
const base='data/initialization-08b-remediation-work/',read=(f,raw=false)=>raw?readFileSync(f):JSON.parse(readFileSync(f)),sha=b=>createHash('sha256').update(b).digest('hex');
const inputs={read,sha,base,qualified:read(base+'qualifications.json'),documents:read(base+'corpus.json').documents,cutoff:'2026-10-11T00:40:00Z'};
const valid=retainedQ1Versions(inputs);assert.deepEqual(valid.map(r=>r.ticker),['VNM','VRE']);
for(const ticker of ['VNM','VRE']){
 for(const mutation of [q=>q.scope='STANDALONE',q=>q.accountingBasis='UNKNOWN',q=>q.period.end='2026-06-30',q=>q.auditStatus='AUDITED']){
  const qualified=structuredClone(inputs.qualified);mutation(qualified.find(q=>q.ticker===ticker&&q.bodyHash===valid.find(v=>v.ticker===ticker).bodyHash));assert.throws(()=>retainedQ1Versions({...inputs,qualified}));
 }
}
const manifestFile=base+'retained-public-index-manifest.json';
for(const mutation of [r=>r.httpStatus=403,r=>r.publicResponseBound=false,r=>r.retrievedAt='2026-10-12T00:00:00Z',r=>r.bytes-=1]){
 const manifest=read(manifestFile);mutation(manifest.records.find(r=>r.bodySha256===valid[0].inventorySha256));assert.throws(()=>retainedQ1Versions({...inputs,read:(f,raw=false)=>f===manifestFile&&!raw?manifest:read(f,raw)}));
}
console.log(JSON.stringify({status:'PASS',exactIssuerQuarterVersions:valid.length,negativeControls:12}));
