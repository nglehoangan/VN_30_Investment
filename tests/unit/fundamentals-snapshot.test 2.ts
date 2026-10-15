// @vitest-environment node
import { it,expect } from 'vitest';
import { snapshotFixture } from '../fixtures/snapshot';
import { assessAvailability } from '@/domain/fundamentals/availability';
import { buildFundamentalSnapshot,canonicalJson } from '@/domain/fundamentals/snapshot';
import { loadCanonicalRegistry } from '@/infrastructure/fundamentals/canonical-registry';
import { snapshotHash } from '@/infrastructure/fundamentals/snapshot-hash';
import type { SnapshotRequest } from '@/domain/fundamentals/snapshot';
import type { FundamentalObservation } from '@/domain/fundamentals/contracts';
function build(f= snapshotFixture(),r=f.request){return buildFundamentalSnapshot(r,f.inputs,snapshotHash);}
function replaceFact(o:FundamentalObservation,policy=snapshotFixture().policy){const f=snapshotFixture(),assessment=assessAvailability({id:'assessment-replaced',observation:o,registry:f.registry,policy,assessedAt:f.request.builtAt,hash:snapshotHash});return {...f,request:{...f.request,policy,assessmentPins:[{observationId:o.id,assessmentId:assessment.id}]},inputs:{...f.inputs,observations:[o],assessments:[assessment]}};}
it('keeps signing/publication/provider/local receipt distinct and includes the exact local knowledge boundary',()=>{
 const f=snapshotFixture();expect(f.observation.reportDate).toBe('2026-07-22');expect(f.assessment.publicBoundary).toBe('2026-07-25T09:00:00.000Z');expect(f.assessment.availableAt).toBe('2026-07-26T09:01:00.000Z');
 for(const cutoff of ['2026-07-10T00:00:00.000Z','2026-07-22T23:59:59.999Z','2026-07-25T23:59:59.999Z','2026-07-26T09:00:59.999Z']){
  const r={...f.request,decisionAsOf:cutoff,systemKnownAt:cutoff,marketCutoff:cutoff,fundamentalCutoff:cutoff,assessmentPins:[]};const s=build(f,r);expect(s.members).toEqual([]);expect(s.blockers).toContain('BLOCKED_REQUIRED_FACT_MISSING');
 }
 const boundary=f.assessment.availableAt!,r={...f.request,decisionAsOf:boundary,systemKnownAt:boundary,marketCutoff:boundary,fundamentalCutoff:boundary};expect(build(f,r).members).toHaveLength(1);
 expect(build(f,{...r,systemKnownAt:'2026-07-25T23:59:59.999Z',assessmentPins:[],builtAt:'2026-10-01T00:00:00.000Z'}).members).toEqual([]);
});
it('unknown publication remains unknown, optional provider receipt can be absent and false chronology is rejected',()=>{
 const f=snapshotFixture(),unknown=replaceFact({...f.observation,publication:{publishedAt:null,publicationDate:null,publicationPrecision:'UNKNOWN',publicationStatus:'UNKNOWN',timezone:null,evidenceReference:null}});
 expect(build(unknown).blockers).toContain('BLOCKED_PUBLICATION_UNKNOWN');expect(unknown.inputs.assessments[0].availableAt).toBeNull();
 const absent=replaceFact({...f.observation,providerReceivedAt:null,providerReceiptReference:null});expect(build(absent).members).toHaveLength(1);
 expect(()=>replaceFact({...f.observation,providerReceivedAt:'2026-07-24T00:00:00.000Z'})).toThrow();expect(()=>replaceFact({...f.observation,availability:{...f.observation.availability,availableAt:'2026-06-30T00:00:00.000Z'} as never})).toThrow();
});
it('date-only July25 uses next local midnight only with approved timezone policy and never fabricates publishedAt',()=>{
 const f=snapshotFixture(),o={...f.observation,publication:{publishedAt:null,publicationDate:'2026-07-25',publicationPrecision:'DATE_ONLY' as const,publicationStatus:'VERIFIED' as const,timezone:'Asia/Ho_Chi_Minh',evidenceReference:'synthetic-date-disclosure'}};
 expect(replaceFact(o).inputs.assessments[0].finding).toBe('DATE_ONLY_POLICY_UNAPPROVED');
 const p={...f.policy,governanceStatus:'APPROVED' as const,approvalReference:'synthetic-date-policy-approval'},g=replaceFact(o,p);expect(g.inputs.assessments[0].publicBoundary).toBe('2026-07-25T17:00:00.000Z');expect(g.inputs.observations[0].publication.publishedAt).toBeNull();expect(build(g).members).toHaveLength(1);
 expect(replaceFact({...o,publication:{...o.publication,timezone:'Unapproved/Zone'}},p).inputs.assessments[0].status).toBe('UNKNOWN');
 const invalid=replaceFact({...o,providerReceivedAt:'2026-07-24T16:59:59.999Z'},p);expect(invalid.inputs.assessments[0].status).toBe('INVALID');expect(build(invalid).members).toEqual([]);
});
it('canonical content ignores key ordering, whitespace, build metadata and assessment execution IDs',()=>{
 const f=snapshotFixture(),a=build(f),r={...f.request,runId:'different-run',builtAt:'2026-08-01T00:00:00.000Z',operatorReference:'other-operator'};
 expect(build(f,r).contentHash).toBe(a.contentHash);expect(build(f,r).request.runId).not.toBe(a.request.runId);
 expect(snapshotHash(JSON.parse(' { "b": 2, "a": 1 } '))).toBe(snapshotHash({a:1,b:2}));expect(canonicalJson({b:2,a:1})).toBe('{"a":1,"b":2}');
 const assessed=assessAvailability({id:'another-assessment',observation:f.observation,registry:f.registry,policy:f.policy,assessedAt:r.builtAt,hash:snapshotHash});
 expect(build({...f,inputs:{...f.inputs,assessments:[assessed]}},{...r,assessmentPins:[{observationId:f.observation.id,assessmentId:assessed.id}]}).contentHash).toBe(a.contentHash);
 expect(Object.isFrozen(a)).toBe(true);
});
it('changes selected values, currency, mapping, receipt, policy or methodology meaning change identity',()=>{
 const f=snapshotFixture(),base=build(f).contentHash;
 for(const patch of [{normalized:{...f.observation.normalized,value:'15000000001'}},{normalized:{...f.observation.normalized,currency:'USD'},raw:{...f.observation.raw,currency:'USD'}},{mappingVersion:'synthetic-map-v2'},{ingestedAt:'2026-07-26T09:02:00.000Z'}])expect(build(replaceFact({...f.observation,...patch})).contentHash).not.toBe(base);
 expect(build(replaceFact(f.observation,{...f.policy,version:'synthetic-policy-v2'})).contentHash).not.toBe(base);
 const registry=loadCanonicalRegistry({...f.registry.manifest,crosswalkVersion:'other-method'}),o={...f.observation,registryHash:registry.registryHash};const a=assessAvailability({id:f.assessment.id,observation:o,registry,policy:f.policy,assessedAt:f.assessment.assessedAt,hash:snapshotHash});expect(buildFundamentalSnapshot(f.request,{...f.inputs,registry,observations:[o],assessments:[a]},snapshotHash).contentHash).not.toBe(base);
});
it('pins cannot omit conflicts and unrelated source receipts never resolve disagreement',()=>{
 const f=snapshotFixture(),o={...f.observation,id:'other-source-fact',sourceVersionId:'other-source',rawCaptureId:'other-capture',normalized:{...f.observation.normalized,value:'1'}},a=assessAvailability({id:'other-assessment',observation:o,registry:f.registry,policy:f.policy,assessedAt:f.request.builtAt,hash:snapshotHash}),g={...f,inputs:{...f.inputs,observations:[f.observation,o],assessments:[f.assessment,a]}};
 expect(()=>build(g)).toThrow();const r={...f.request,assessmentPins:[...f.request.assessmentPins,{observationId:o.id,assessmentId:a.id}]};expect(build(g,r).blockers).toContain('BLOCKED_CONFLICT');expect(build(g,r).members).toEqual([]);
 expect(build({...g,inputs:{...g.inputs,observations:[o,f.observation],assessments:[a,f.assessment]}},{...r,assessmentPins:[...r.assessmentPins].reverse()}).contentHash).toBe(build(g,r).contentHash);
});
it.each(['ISSUER_RESTATEMENT','PROVIDER_CORRECTION','MAPPING_CORRECTION'] as const)('selects %s only once its explicit correction chain becomes knowable',kind=>{
 const f=snapshotFixture(),o={...f.observation,id:'revision',rawCaptureId:'revision-capture',ingestedAt:'2026-08-01T00:00:00.000Z',retrievedAt:'2026-07-31T23:59:00.000Z',normalized:{...f.observation.normalized,value:'2'},publication:kind==='ISSUER_RESTATEMENT'?{...f.observation.publication,evidenceReference:'new-issuer-disclosure'}:f.observation.publication,revisionKind:kind,recordVersion:'2',supersedesObservationId:f.observation.id,revisionReason:'synthetic revision',revisionEvidenceReference:'synthetic-revision-evidence',correctionKnownAt:'2026-07-31T00:00:00.000Z'},a=assessAvailability({id:'revision-assessment',observation:o,registry:f.registry,policy:f.policy,assessedAt:'2026-08-02T00:00:00.000Z',hash:snapshotHash}),g={...f,inputs:{...f.inputs,observations:[f.observation,o],assessments:[f.assessment,a]}};
 expect(build(g).contentHash).toBe(build(f).contentHash);
 const r:SnapshotRequest={...f.request,decisionAsOf:'2026-08-02T00:00:00.000Z',systemKnownAt:'2026-08-02T00:00:00.000Z',marketCutoff:'2026-08-02T00:00:00.000Z',fundamentalCutoff:'2026-08-02T00:00:00.000Z',builtAt:'2026-08-03T00:00:00.000Z',assessmentPins:[...f.request.assessmentPins,{observationId:o.id,assessmentId:a.id}]};
 expect(build(g,r).members.map(m=>m.observationId)).toEqual([o.id]);
 const diagnostic=build(g,{...r,mode:'AS_REVISED',decisionAsOf:f.request.decisionAsOf,systemKnownAt:f.request.systemKnownAt,marketCutoff:f.request.marketCutoff,fundamentalCutoff:f.request.fundamentalCutoff,revisionCutoff:r.systemKnownAt});expect(JSON.parse(diagnostic.manifest).diagnosticOnly).toBe(true);expect(diagnostic.members[0].observationId).toBe(o.id);
});
it('missing, stale, invalid, quality and scope eligibility are explicit blockers without zeros',()=>{
 const f=snapshotFixture();expect(build(f,{...f.request,requirements:[{...f.request.requirements[0],maxAgeDays:1}]}).blockers).toContain('BLOCKED_STALE_FUNDAMENTALS');
 expect(build(replaceFact({...f.observation,quality:'WARNING'})).blockers).toContain('BLOCKED_FACT_QUALITY');
 expect(build(f,{...f.request,requirements:[{...f.request.requirements[0],itemId:'CFO'}],assessmentPins:[]}).blockers).toContain('BLOCKED_REQUIRED_FACT_MISSING');
 expect(()=>build(f,{...f.request,scope:'FORMAL'})).toThrow();expect(()=>build(f,{...f.request,systemKnownAt:'2026-08-01T00:00:00.000Z'})).toThrow();
});
it('forged availability, policy bindings and assessment membership fail closed',()=>{
 const f=snapshotFixture();for(const patch of [{availableAt:'2026-07-01T00:00:00.000Z'},{observationHash:'0'.repeat(64)},{policyHash:'0'.repeat(64)}])expect(()=>build({...f,inputs:{...f.inputs,assessments:[{...f.assessment,...patch}]}})).toThrow();
});

it('storage occurrence IDs do not masquerade as changed investment content',()=>{
 const f=snapshotFixture(),alias=replaceFact({...f.observation,id:'another-storage-id',rawCaptureId:'another-raw-storage-id'});expect(build(alias).contentHash).toBe(build(f).contentHash);
 const entries=Object.entries(f.observation).reverse(),o=Object.fromEntries(entries) as unknown as FundamentalObservation;expect(build(replaceFact(o)).contentHash).toBe(build(f).contentHash);
});
it('unrelated unknown-publication evidence remains visible and blocks a conflicting requirement',()=>{
 const f=snapshotFixture(),other=replaceFact({...f.observation,id:'unknown-competitor',rawCaptureId:'unknown-capture',normalized:{...f.observation.normalized,value:'1'},publication:{publishedAt:null,publicationDate:null,publicationPrecision:'UNKNOWN',publicationStatus:'UNKNOWN',timezone:null,evidenceReference:null}}),r={...f.request,assessmentPins:[...f.request.assessmentPins,...other.request.assessmentPins]};
 const s=buildFundamentalSnapshot(r,{...f.inputs,observations:[f.observation,...other.inputs.observations],assessments:[f.assessment,...other.inputs.assessments]},snapshotHash);expect(s.blockers).toContain('BLOCKED_CONFLICT');expect(JSON.parse(s.manifest).exclusions).toHaveLength(2);
});
it('date-only selection excludes the millisecond before approved next midnight and includes the exact boundary',()=>{
 const f=snapshotFixture(),p={...f.policy,governanceStatus:'APPROVED' as const,approvalReference:'synthetic-date-approval'},o={...f.observation,publication:{publishedAt:null,publicationDate:'2026-07-25',publicationPrecision:'DATE_ONLY' as const,publicationStatus:'VERIFIED' as const,timezone:'Asia/Ho_Chi_Minh',evidenceReference:'synthetic-date-only'},providerReceivedAt:'2026-07-25T15:00:00.000Z',retrievedAt:'2026-07-25T16:00:00.000Z',ingestedAt:'2026-07-25T16:01:00.000Z'},g=replaceFact(o,p);
 for(const cutoff of ['2026-07-25T16:59:59.999Z','2026-07-25T17:00:00.000Z']){const s=build(g,{...g.request,decisionAsOf:cutoff,systemKnownAt:cutoff,marketCutoff:cutoff,fundamentalCutoff:cutoff});expect(s.members.length).toBe(cutoff.endsWith('999Z')?0:1);if(cutoff.endsWith('999Z'))expect(s.blockers).toContain('BLOCKED_NOT_YET_AVAILABLE');}
});
it('forked explicit revision chains remain conflicts; missing predecessors and cycles fail closed',()=>{
 const f=snapshotFixture(),o={...f.observation,id:'fork-one',revisionKind:'MAPPING_CORRECTION' as const,recordVersion:'2',supersedesObservationId:f.observation.id,revisionReason:'synthetic mapping correction',revisionEvidenceReference:'synthetic-mapping-review',correctionKnownAt:f.observation.ingestedAt},p={...o,id:'fork-two'},assessments=[o,p].map(o=>assessAvailability({id:'assessment-'+o.id,observation:o,registry:f.registry,policy:f.policy,assessedAt:f.request.builtAt,hash:snapshotHash})),r={...f.request,assessmentPins:[...f.request.assessmentPins,...assessments.map(a=>({observationId:a.observationId,assessmentId:a.id}))]},inputs={...f.inputs,observations:[f.observation,o,p],assessments:[f.assessment,...assessments]};
 expect(buildFundamentalSnapshot(r,inputs,snapshotHash).blockers).toContain('BLOCKED_CONFLICT');
 const missing={...o,supersedesObservationId:'absent-predecessor'},a=assessAvailability({id:'assessment-fork-one',observation:missing,registry:f.registry,policy:f.policy,assessedAt:f.request.builtAt,hash:snapshotHash});expect(()=>buildFundamentalSnapshot({...f.request,assessmentPins:[{observationId:missing.id,assessmentId:a.id}]},{...f.inputs,observations:[missing],assessments:[a]},snapshotHash)).toThrow();
});
it('AS_REVISED selects latest valid chain vintage diagnostically while AS_KNOWN blocks an invalid current revision',()=>{
 const f=snapshotFixture(),o={...f.observation,id:'invalid-revision',quality:'INVALID' as const,revisionKind:'MAPPING_CORRECTION' as const,recordVersion:'2',supersedesObservationId:f.observation.id,revisionReason:'synthetic invalid revision',revisionEvidenceReference:'synthetic-revision-review',correctionKnownAt:f.observation.ingestedAt},a=assessAvailability({id:'assessment-invalid-revision',observation:o,registry:f.registry,policy:f.policy,assessedAt:f.request.builtAt,hash:snapshotHash}),r={...f.request,assessmentPins:[...f.request.assessmentPins,{observationId:o.id,assessmentId:a.id}]},inputs={...f.inputs,observations:[f.observation,o],assessments:[f.assessment,a]};
 expect(buildFundamentalSnapshot(r,inputs,snapshotHash).blockers).toContain('BLOCKED_FACT_QUALITY');const revised=buildFundamentalSnapshot({...r,mode:'AS_REVISED',revisionCutoff:r.systemKnownAt},inputs,snapshotHash);expect(revised.members.map(m=>m.observationId)).toEqual([f.observation.id]);expect(JSON.parse(revised.manifest).diagnosticOnly).toBe(true);
});
it('normalization execution markers stay in pinned run provenance while their IDs do not change content identity',()=>{
 const f=snapshotFixture(),a=replaceFact({...f.observation,transformationReferences:[...f.observation.transformationReferences,'normalization-run:execution-one']}),b=replaceFact({...f.observation,transformationReferences:[...f.observation.transformationReferences,'normalization-run:execution-two']});expect(build(a).contentHash).toBe(build(b).contentHash);expect(a.inputs.assessments[0].provenance).toContain('normalization-run:execution-one');expect(b.inputs.assessments[0].provenance).toContain('normalization-run:execution-two');expect(a.inputs.assessments[0].observationHash).not.toBe(b.inputs.assessments[0].observationHash);
});
it('canonical key order uses Unicode code points, including supplementary characters',()=>{
 expect(canonicalJson({'𐀀':2,'\uE000':1})).toBe('{"\uE000":1,"𐀀":2}');expect(snapshotHash({'𐀀':2,'\uE000':1})).toBe(snapshotHash({'\uE000':1,'𐀀':2}));
});
