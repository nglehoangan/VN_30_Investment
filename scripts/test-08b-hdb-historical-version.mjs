import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {hdbHistoricalVersions} from './lib/08b-hdb-historical-version.mjs';
const base='data/initialization-08b-remediation-work/',sha=b=>createHash('sha256').update(b).digest('hex'),cache=new Map(),changes=new Map();
const read=(f,raw=false)=>{if(!cache.has(f))cache.set(f,readFileSync(f));const bytes=changes.get(f)??cache.get(f);return raw?bytes:JSON.parse(bytes);};
const preview=read(base+'execution-preview.json'),correspondenceFile=base+'hdb-annual-2024-edition-correspondence.json';
const args={read,sha,qualified:preview.documentQualificationCandidates,documents:preview.recovery.documents,cutoff:new Date().toISOString(),base};
const records=hdbHistoricalVersions(args);assert.equal(records.length,3);assert.deepEqual(records.map(r=>r.periodEnd),['2022-12-31','2023-12-31','2024-12-31']);assert(records.every(r=>r.historicalPublicationTimeAsserted===false&&r.knowledgeBackdated===false));
const checks=[];
for(const [field,value] of [['auditReportNumber','OTHER'],['issuerAttachmentUrl','https://example.com/report.pdf'],['scope','SEPARATE_STANDALONE'],['periodEnd','2025-12-31'],['oversizedIssuerDocumentAdmitted',true],['historicalPublicationTimestampAsserted',true],['independentHumanApproval','FAKE'],['recordedAt','invalid']]){
 changes.set(correspondenceFile,Buffer.from(JSON.stringify({...read(correspondenceFile),[field]:value})));assert.throws(()=>hdbHistoricalVersions(args));changes.clear();checks.push(field);
}
const proof=read(correspondenceFile),changed=structuredClone(proof);changed.currentColumnCheckpoints[0].value='999';changes.set(correspondenceFile,Buffer.from(JSON.stringify(changed)));assert.throws(()=>hdbHistoricalVersions(args));changes.clear();checks.push('checkpoint_value');
changes.set(correspondenceFile,Buffer.from(JSON.stringify({...proof,sourceProofs:[]})));assert.throws(()=>hdbHistoricalVersions(args));changes.clear();checks.push('missing_dependency_closure');
const source=proof.sourceProofs.find(p=>p.file.endsWith('-p6.json'));changes.set(source.file,Buffer.from('{}'));assert.throws(()=>hdbHistoricalVersions(args));changes.clear();checks.push('changed_audit_source');
assert.throws(()=>hdbHistoricalVersions({...args,cutoff:'2026-10-10T15:00:00.000Z'}));checks.push('source_not_yet_known');
assert.equal(hdbHistoricalVersions({...args,qualified:args.qualified.map(q=>q.period?.end==='2024-12-31'&&q.ticker==='HDB'?{...q,scope:'SEPARATE_STANDALONE'}:q)}).length,2);checks.push('wrong_scope_not_admitted');
console.log(JSON.stringify({status:'PASS',realEditions:records.length,negativeControls:checks.length,sourceMutations:0}));
