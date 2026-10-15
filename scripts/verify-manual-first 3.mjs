import './lib/ts-runtime.mjs';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const {readManualCurrentSnapshot}=await import('../src/infrastructure/fundamentals/manual-current.ts');
const root=resolve(import.meta.dirname,'..'),base=resolve(root,process.argv.find(a=>a.startsWith('--evidence-dir='))?.slice(15)??'docs/fundamental-data-engine/evidence/2026-10-13-manual-first-refactor');
const read=name=>JSON.parse(readFileSync(join(base,name),'utf8'));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const s=await readManualCurrentSnapshot(root);assert(s);
const manifest=read('MANUAL_SOURCE_MANIFEST.json');
for(const f of manifest.documents)assert.equal(sha(readFileSync(join(root,f.path))),f.sha256,'Retained corpus changed');
const historical=read('HISTORICAL_EVIDENCE_PRESERVATION.json');
for(const f of historical.files)assert.equal(sha(readFileSync(join(root,f.path))),f.sha256,'Historical evidence changed: '+f.path);
const qualification=read('MANUAL_DOCUMENT_QUALIFICATION.json');
const checked=new Set();
for(const q of qualification.documents)for(const e of q.evidence)for(const p of e.pages){
 if(checked.has(p.path))continue;assert.equal(sha(readFileSync(join(root,p.path))),p.sha256,'Qualification reader changed');checked.add(p.path);
}
for(const f of read('MANUAL_CANONICAL_FACTS.json').reviewedInputFacts){
 assert.equal(sha(readFileSync(join(root,f.retainedReaderProof.path))),f.retainedReaderProof.sha256,'Fact reader changed');
}
const report={status:'PASS',method:'SEPARATE_PROCESS_DURABLE_SOURCE_AND_CANONICAL_REPLAY',snapshotId:s.snapshotId,contentHash:s.contentHash,manualDocumentsRehashed:manifest.documents.length,admittedStatements:s.statements.filter(s=>s.reviewStatus==='QUALIFIED').length,knownDocumentIdentities:s.statements.length,qualificationReadersRehashed:checked.size,historicalArtifactsRehashed:historical.files.length,historicalPIT:'UNCHANGED',currentAnalysisReusedForHistorical:false,DI14SelfApproval:false,DI15SelfApproval:false};
writeFileSync(join(base,'INDEPENDENT_PROCESS_REPLAY.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
