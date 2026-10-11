/** Independent process replay from the serialized execution packet; no database or scoring access. */
import './lib/ts-runtime.mjs';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const {loadCanonicalRegistry}=await import('../src/infrastructure/fundamentals/canonical-registry.ts');
const {buildFundamentalSnapshot}=await import('../src/domain/fundamentals/snapshot.ts');
const {snapshotHash}=await import('../src/infrastructure/fundamentals/snapshot-hash.ts');
const base='data/initialization-08b-remediation-work/';
const bytes=readFileSync(base+'execution-preview.json'),packet=JSON.parse(bytes.toString());
const result=buildFundamentalSnapshot(packet.cutoffs,{
 registry:loadCanonicalRegistry(packet.registry.manifest),
 observations:[...packet.canonicalObservations].reverse(),
 assessments:[...packet.availabilityAssessments].reverse(),
 derived:[...packet.derivedMetrics].reverse(),
 livePublicDisclosureBindings:packet.livePublicDisclosureBindings,
 equivalenceResolutions:packet.equivalenceResolutions,
 sourcePeriodWithdrawals:packet.sourcePeriodWithdrawals,
 operationalFreshnessBindings:packet.operationalFreshnessBindings,
},snapshotHash);
const sha=value=>createHash('sha256').update(value).digest('hex');
if(result.contentHash!==packet.snapshotContentHash||sha(result.manifest)!==packet.manifestDigest||result.manifest!==packet.snapshot.manifest)throw Error('INDEPENDENT_SERIALIZED_REPLAY_MISMATCH');
const evidence={status:'PASS',method:'SEPARATE_PROCESS_SERIALIZED_INPUT_REPLAY_REVERSED_ORDER',
 recordedAt:new Date().toISOString(),inputFile:'execution-preview.json',inputSha256:sha(bytes),
 snapshotRunId:packet.snapshotRunId,contentHash:result.contentHash,manifestDigest:sha(result.manifest),
 eligibleMembers:result.members.length,retainedOccurrences:packet.canonicalObservations.length};
writeFileSync(base+'independent-snapshot-replay.json',JSON.stringify(evidence,null,2)+'\n',{mode:0o600});
console.log(JSON.stringify(evidence));
