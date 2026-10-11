import '../../../../scripts/lib/ts-runtime.mjs';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root=new URL('../../../../',import.meta.url).pathname;
const {buildFundamentalSnapshot,canonicalJson}=await import(root+'src/domain/fundamentals/snapshot.ts');
const {snapshotHash}=await import(root+'src/infrastructure/fundamentals/snapshot-hash.ts');
const b=root+'docs/fundamental-data-engine/evidence/2026-10-12-governance-closure-selected-path-corrected/';
const read=n=>JSON.parse(readFileSync(b+n,'utf8'));
const packet=read('EXECUTION_PACKAGE_REDACTED.json'),manifest=read('SNAPSHOT_MANIFEST.json');
const expected=packet.snapshotContentHash;
const result=buildFundamentalSnapshot(packet.cutoffs,{registry:manifest.registry,observations:[...packet.canonicalObservations].reverse(),assessments:[...packet.availabilityAssessments].reverse(),derived:[...packet.derivedMetrics].reverse(),providerEvidenceBindings:packet.availabilityAssessments.map(a=>a.providerEvidenceBinding).filter(Boolean),livePublicDisclosureBindings:packet.availabilityAssessments.map(a=>a.livePublicDisclosureBinding).filter(Boolean),sourceFactRejections:packet.sourceFactRejections,sourcePeriodWithdrawals:packet.sourcePeriodWithdrawals,equivalenceResolutions:manifest.equivalenceResolutions,operationalFreshnessBindings:manifest.operationalFreshnessBindings},snapshotHash);
assert.equal(result.contentHash,expected);assert.equal(result.manifest,canonicalJson(manifest));
const outfile=process.argv[2]??'/private/tmp/vn30-final-snapshot-replay.json';
writeFileSync(outfile,JSON.stringify({status:'PASS',scope:'DETERMINISTIC_SELECTOR_AND_AVAILABILITY_REPLAY_FROM_PRESERVED_REDACTED_INPUTS',method:'SEPARATE_PROCESS_REVERSED_OBSERVATIONS_ASSESSMENTS_DERIVED',snapshotRunId:packet.snapshotRunId,contentHash:result.contentHash,manifestDigest:createHash('sha256').update(result.manifest).digest('hex'),members:result.members.length,availabilityAssessmentsReplayed:packet.availabilityAssessments.length,unsafeSelected:result.members.filter(m=>packet.availabilityAssessments.find(a=>a.id===m.assessmentId).status!=='VERIFIED').length,fullRawDocumentAndReaderHashReplay:'NOT_REPRODUCIBLE_AFTER_PREVIOUS_USER_AUTHORIZED_CLEANUP',sourceReacquisition:false,productOrApprovedDocumentModified:false},null,2)+'\n');
const {deriveFundamentals}=await import(root+'src/domain/fundamentals/derivation.ts');
const numericReplay=[];
for(const d of packet.derivedMetrics){
 const run=observations=>deriveFundamentals({request:d.request,recordedAt:d.recordedAt,registry:d.registry,crosswalk:d.crosswalk,crosswalkHash:d.crosswalkHash,observations,hash:snapshotHash});
 const normal=run(d.observations),reverse=run([...d.observations].reverse());
 assert.equal(canonicalJson(normal),canonicalJson(d));
 for(const key of ['value','unit','currency','status','confidence','reason','operands'])assert.equal(canonicalJson(normal[key]),canonicalJson(reverse[key]));
 numericReplay.push({id:d.id,status:'PASS',value:d.value,availability:d.availability,productionAdmission:false});
}
const report=JSON.parse(readFileSync(outfile,'utf8'));report.numericCalculatedArtifactReplay=numericReplay;
writeFileSync(outfile,JSON.stringify(report,null,2)+'\n');
console.log('PASS',result.contentHash,result.members.length,'numeric',numericReplay.length);
