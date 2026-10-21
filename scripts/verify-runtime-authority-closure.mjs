import './lib/ts-runtime.mjs';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
const {snapshotHash}=await import('../src/infrastructure/fundamentals/snapshot-hash.ts');
const {validateCanonicalRegistry}=await import('../src/domain/fundamentals/validation.ts');
const {validateAvailabilityPolicy}=await import('../src/domain/fundamentals/availability.ts');
const {validateCrosswalk}=await import('../src/domain/fundamentals/derivation.ts');
const {validateReadinessRequirements}=await import('../src/domain/fundamentals/scoring-readiness.ts');
const root=process.argv.find(a=>a.startsWith('--out='))?.slice(6)??'docs/fundamental-data-engine/evidence/2026-10-21-runtime-authority-source-closure';
if(existsSync(root+'/ARTIFACT_HASHES.json'))throw Error('SEALED_EVIDENCE');
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const spec=read(root+'/AUTHORITY_CANDIDATES_FINAL.json'),registry=read(root+'/authority/registry.json'),results=[];
for(const row of spec.candidates){
 const payload=read(row.payloadPath);if(snapshotHash(payload)!==row.contentHash)throw Error('CANDIDATE_HASH_MISMATCH:'+row.kind);
 let status='NOT_A_NATIVE_RUNTIME_PAYLOAD',findings=[];
 try{
  if(row.kind==='registry'){validateCanonicalRegistry(payload);status='NATIVE_SCHEMA_PASS_PROPOSED_ONLY';}
  else if(row.kind==='availability'){validateAvailabilityPolicy(payload);status='NATIVE_SCHEMA_PASS_PROPOSED_ONLY';}
  else if(row.kind==='derivation-crosswalk'){validateCrosswalk(payload,{manifest:registry,registryHash:snapshotHash(registry)});status='NATIVE_SCHEMA_PASS_PROPOSED_ONLY';}
  else if(row.kind==='readiness-requirements'){validateReadinessRequirements(payload);status='UNEXPECTED_NATIVE_PASS';}
 }catch(error){status='NATIVE_INCOMPATIBILITY_RECORDED';findings=error.issues?.map(i=>i.reason)??[error.message];}
 results.push({kind:row.kind,hashVerified:true,status,findings,approvalGranted:false,activationPerformed:false});
}
writeFileSync(root+'/NATIVE_AUTHORITY_VALIDATION.json',JSON.stringify({status:'REPLAYED_GAPS_REMAIN',results},null,2)+'\n');
const matrix=read(root+'/AUTHORITY_COMPATIBILITY_MATRIX.json');for(const r of matrix.rows)r.nativeValidation=results.find(x=>x.kind===r.kind);writeFileSync(root+'/AUTHORITY_COMPATIBILITY_MATRIX.json',JSON.stringify(matrix,null,2)+'\n');
console.log(JSON.stringify({candidateHashesVerified:results.length,results}));
