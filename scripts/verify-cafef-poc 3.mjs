import './lib/ts-runtime.mjs';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const {payloadHash,cafeFRawCapture,parseCafeFJson}=await import('../src/infrastructure/fundamentals/cafef.ts');
const {decimal}=await import('../src/domain/portfolio/values.ts');
const root=resolve(import.meta.dirname,'..'),base=join(root,'docs/fundamental-data-engine/evidence/2026-10-13-cafef-structured-poc');
const read=p=>JSON.parse(readFileSync(resolve(root,p),'utf8'));
const requests=read('data/providers/cafef/poc-2026-10-13/requests.json');
assert.equal(new Set(requests.map(r=>r.symbol)).size,30);const raw=new Map();
for(const r of requests){const body=readFileSync(resolve(root,r.rawPayloadLocation),'utf8');assert.equal(payloadHash(body),r.payloadHash);assert.equal(payloadHash(r.url),r.requestFingerprint);cafeFRawCapture(r,body);raw.set(r.payloadHash,parseCafeFJson(body));}
const facts=read('data/providers/cafef/poc-2026-10-13/normalized-provider-facts.json'),canonical=read('data/providers/cafef/poc-2026-10-13/canonical-review-candidates.json');assert.equal(new Set(facts.map(f=>f.id)).size,facts.length);
const records=body=>body.value.data.flatMap(g=>g.symbol?[g]:g.data);
for(const f of facts){assert.equal(f.productionAdmissible,false);assert.equal(f.scope,'REVIEW_CANDIDATE');assert(raw.has(f.sourceHash));assert.equal(f.publication.publishedAt,null);
 if(f.measurementSemantic==='STOCK'){assert.equal(f.periodType,'INSTANT');assert.equal(f.periodStart,f.periodEnd);}
 if(f.periodType==='ANNUAL'){assert.equal(f.monthsCovered,12);assert.equal(f.fiscalQuarter,null);}
 if(f.periodType==='YTD'){assert.equal(f.monthsCovered,f.fiscalQuarter*3);assert.equal(f.periodStart,`${f.fiscalYear}-01-01`);}
 if(f.valueType==='MECHANICALLY_DERIVED'){
  assert.equal(f.itemId,'FINANCIAL_DEBT');assert.equal(f.sourceFactIds.length,2);const values=[];
  for(const id of f.sourceFactIds){const [prefix,hash,year,quarter,type,code]=id.split(':');assert.equal(prefix,'raw-witness');assert.equal(hash,f.sourceHash);
   const matched=records(raw.get(hash)).find(r=>Number(r.year)===Number(year)&&Number(r.quater)===Number(quarter)&&r.type===type&&r.data.some(c=>c.code===code));assert(matched);values.push(String(matched.data.find(c=>c.code===code).value));
  }
  assert.equal(decimal(values[0]).add(decimal(values[1])).toString(),f.normalized.value);
 }
}
for(const c of canonical){assert.equal(c.productionAdmissible,false);assert(c.facts.every(f=>!f.ambiguousQuarterlyFlow&&!f.modeMismatch));if(c.status!=='UNVERIFIED')assert.equal(c.value,null);}
const observations=read(join(base,'cafef_pdf_sample_cell_observations.json')).observations;
for(const m of observations){assert.equal(payloadHash(readFileSync(resolve(root,m.sourcePath))),m.sourceHash);const proof=m.retainedReaderProof;assert.equal(payloadHash(readFileSync(resolve(root,proof.path))),proof.sha256);const reader=read(proof.path);assert.equal(reader.bodyHash,m.sourceHash);assert.equal(reader.renderSha256,proof.renderSha256);assert.equal(m.productionAdmissible,false);}
let preserved=0;for(const name of ['2026-10-13-manual-first-refactor','2026-10-13-physical-corpus-reconciliation']){const old=join(root,'docs/fundamental-data-engine/evidence',name);for(const f of read(join(old,'ARTIFACT_HASHES.json')).artifacts){assert.equal(payloadHash(readFileSync(join(old,f.path))),f.sha256);preserved++;}}
assert.deepEqual(read('data/manual-current/current-analysis.json'),read('docs/fundamental-data-engine/evidence/2026-10-13-physical-corpus-reconciliation/CURRENT_ANALYSIS_SNAPSHOT.json'));
const protectedDiff=execFileSync('git',['diff','--name-only','HEAD','--','src/domain','src/application','src/ports','src/ui','app','prisma','src/infrastructure/repositories'],{cwd:root,encoding:'utf8'}).trim();assert.equal(protectedDiff,'','Existing investment/application/persistence logic changed');
const report={status:'PASS',rawRequestsReverified:requests.length,providerFactsReverified:facts.length,canonicalCandidatesReverified:canonical.length,pdfSampleObservationsReverified:observations.length,sealedHistoricalArtifactsPreserved:preserved,currentManualSnapshotUnchanged:true,investmentApplicationPersistenceLogicUnchanged:true,productionAdmissibleFacts:0,DI14SelfApproval:false,DI15SelfApproval:false};
const seal=join(base,'ARTIFACT_HASHES.json');if(existsSync(seal)){for(const artifact of read(seal).artifacts)assert.equal(payloadHash(readFileSync(join(base,artifact.path))),artifact.sha256);assert.deepEqual(read(join(base,'cafef_independent_replay.json')),report);}else writeFileSync(join(base,'cafef_independent_replay.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
