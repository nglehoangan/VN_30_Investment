// @vitest-environment node
import {it,expect} from 'vitest';
import {snapshotDerivationFixture} from '../fixtures/snapshot';
import {release} from '../fixtures/fundamentals';
import {loadDerivationCrosswalk} from '@/infrastructure/fundamentals/derivation-crosswalk';
import {normalizationHash} from '@/infrastructure/fundamentals/reviewed-statement';
import {deriveFundamentals} from '@/domain/fundamentals/derivation';
import {dateOnlyEvidenceFixture} from '../fixtures/availability-evidence';
import {assessAvailability,isEvidenceAssessment,validateAvailabilityPolicy} from '@/domain/fundamentals/availability';
import {buildFundamentalSnapshot,validateSnapshotRequest} from '@/domain/fundamentals/snapshot';
import {snapshotHash} from '@/infrastructure/fundamentals/snapshot-hash';
import type {FundamentalObservation} from '@/domain/fundamentals/contracts';
import type {EvidenceAvailabilityPolicy} from '@/domain/fundamentals/availability';
function assess(o:FundamentalObservation=dateOnlyEvidenceFixture().observation,options:{trusted?:boolean;policy?:EvidenceAvailabilityPolicy;knownAt?:string}={}){
 const f=dateOnlyEvidenceFixture(),providerEvidenceBinding=options.trusted?{...f.providerEvidenceBinding,receipt:{...f.providerEvidenceBinding.receipt,observationHash:snapshotHash(o),receivedAt:o.providerReceivedAt!,evidenceReference:o.providerReceiptReference!,knownAt:options.knownAt??f.providerEvidenceBinding.receipt.knownAt}}:null;
 const a=assessAvailability({id:f.assessment.id,observation:o,registry:f.registry,policy:options.policy??f.policy,assessedAt:f.assessment.assessedAt,providerEvidenceBinding,hash:snapshotHash});if(!isEvidenceAssessment(a))throw new Error('v2 required');return a;
}
it('A/C: no governed trusted evidence, including a generic provider timestamp, retains approved next-midnight fallback',()=>{
 const a=assess();expect(a.publicFallbackBoundary).toBe('2026-07-25T17:00:00.000Z');expect(a.publicBoundary).toBe(a.publicFallbackBoundary);expect(a.evidenceBackedBoundary).toBeNull();expect(a.availableAt).toBe('2026-07-25T17:00:00.000Z');expect(a.evidenceInputs.find(e=>e.evidenceClass==='UNTRUSTED_PROVIDER_RECEIPT')!.canEstablishPublicBoundary).toBe(false);
});
it('B/G: trusted same-day public filing receipt establishes 15Z public evidence, while 16:01Z ingestion remains the operational floor',()=>{
 const f=dateOnlyEvidenceFixture(),a=f.assessment;expect(a.publicFallbackBoundary).toBe('2026-07-25T17:00:00.000Z');expect(a.evidenceBackedBoundary).toBe('2026-07-25T15:00:00.000Z');expect(a.publicBoundary).toBe(a.evidenceBackedBoundary);expect(a.availableAt).toBe(f.observation.ingestedAt);expect(f.observation.publication.publishedAt).toBeNull();
 const at=buildFundamentalSnapshot(f.request,f.inputs,snapshotHash);expect(at.members).toHaveLength(1);
 const before={...f.request,decisionAsOf:'2026-07-25T16:00:59.999Z',systemKnownAt:'2026-07-25T16:00:59.999Z',marketCutoff:'2026-07-25T16:00:59.999Z',fundamentalCutoff:'2026-07-25T16:00:59.999Z',assessmentPins:[]};expect(buildFundamentalSnapshot(before,f.inputs,snapshotHash).members).toEqual([]);
 const delayed=assess(f.observation,{trusted:true,knownAt:'2026-07-25T16:02:00.000Z'}),s=buildFundamentalSnapshot(f.request,{...f.inputs,assessments:[delayed],providerEvidenceBindings:[delayed.providerEvidenceBinding!]},snapshotHash);expect(s.blockers).toContain('BLOCKED_NOT_YET_AVAILABLE');expect(delayed.availableAt).toBe('2026-07-25T16:02:00.000Z');
 expect(buildFundamentalSnapshot({...f.request,systemKnownAt:'2026-07-25T16:00:59.999Z',assessmentPins:[],builtAt:'2026-12-01T00:00:00.000Z'},f.inputs,snapshotHash).members).toEqual([]);
});
it('D/E: local retrieval and ingestion never establish or strengthen public disclosure',()=>{
 const f=dateOnlyEvidenceFixture(),a=assess({...f.observation,providerReceivedAt:null,providerReceiptReference:null});expect(a.publicBoundary).toBe('2026-07-25T17:00:00.000Z');expect(a.evidenceBackedBoundary).toBeNull();for(const e of a.evidenceInputs.filter(e=>e.evidenceClass.startsWith('LOCAL_')))expect(e.canEstablishPublicBoundary).toBe(false);
 for(const evidenceClass of ['LOCAL_RETRIEVAL','LOCAL_INGESTION','CORRECTION_KNOWLEDGE'])expect(()=>validateAvailabilityPolicy({...f.policy,dateOnlyEvidenceClasses:[evidenceClass]} as unknown as EvidenceAvailabilityPolicy)).toThrow();
});
it('F: receipt before publication local-day start is inconsistent, even if declared trusted; it is never dropped',()=>{
 const f=dateOnlyEvidenceFixture(),o={...f.observation,providerReceivedAt:'2026-07-24T16:59:59.999Z'};for(const trusted of [false,true]){const a=assess(o,{trusted});expect(a.status).toBe('INVALID');expect(a.finding).toBe('PUBLICATION_RECEIPT_CHRONOLOGY');expect(a.availableAt).toBeNull();expect(a.evidenceInputs.some(e=>e.timestamp===o.providerReceivedAt)).toBe(true);}
 const proposed=assess(o,{policy:{...f.policy,governanceStatus:'PROPOSED',approvalReference:null}});expect(proposed.status).toBe('INVALID');
});
it('H: policy authority, source authority and evidence-knowledge boundary are investment content',()=>{
 const f=dateOnlyEvidenceFixture(),base=buildFundamentalSnapshot(f.request,f.inputs,snapshotHash);
 const policy={...f.policy,dateOnlyEvidenceClasses:[]},a=assess(f.observation,{trusted:true,policy});expect(a.publicBoundary).toBe('2026-07-25T17:00:00.000Z');expect(a.evidenceInputs.find(e=>e.evidenceClass==='TRUSTED_PROVIDER_RECEIPT')!.canEstablishPublicBoundary).toBe(false);
 expect(buildFundamentalSnapshot({...f.request,policy},{...f.inputs,assessments:[a]},snapshotHash).contentHash).not.toBe(base.contentHash);
 const b={...f.providerEvidenceBinding,authority:{...f.providerEvidenceBinding.authority,version:'synthetic-authority-v2'}},changed=assessAvailability({id:f.assessment.id,observation:f.observation,registry:f.registry,policy:f.policy,assessedAt:f.assessment.assessedAt,providerEvidenceBinding:b,hash:snapshotHash});expect(buildFundamentalSnapshot(f.request,{...f.inputs,assessments:[changed],providerEvidenceBindings:[b]},snapshotHash).contentHash).not.toBe(base.contentHash);
});
it('I: request or stored assessment cannot self-declare provider authority',()=>{
 const f=dateOnlyEvidenceFixture();expect(()=>validateSnapshotRequest({...f.request,providerEvidenceBindings:[f.providerEvidenceBinding]} as unknown as typeof f.request)).toThrow();expect(()=>validateAvailabilityPolicy({...f.policy,providerTrusted:true} as unknown as EvidenceAvailabilityPolicy)).toThrow();expect(()=>buildFundamentalSnapshot(f.request,{...f.inputs,providerEvidenceBindings:[]},snapshotHash)).toThrow();
 for(const patch of [{receiptSemantics:'PRIVATE_FEED'},{governanceStatus:'PROPOSED'}])expect(()=>assessAvailability({id:f.assessment.id,observation:f.observation,registry:f.registry,policy:f.policy,assessedAt:f.assessment.assessedAt,providerEvidenceBinding:{...f.providerEvidenceBinding,authority:{...f.providerEvidenceBinding.authority,...patch}} as unknown as typeof f.providerEvidenceBinding,hash:snapshotHash})).toThrow();
 expect(()=>assessAvailability({id:f.assessment.id,observation:f.observation,registry:f.registry,policy:f.policy,assessedAt:f.assessment.assessedAt,providerEvidenceBinding:{...f.providerEvidenceBinding,receipt:{...f.providerEvidenceBinding.receipt,status:'UNKNOWN'}} as unknown as typeof f.providerEvidenceBinding,hash:snapshotHash})).toThrow();
});
it('J: correction knowledge before/after local retrieval remains system lineage, never issuer disclosure',()=>{
 const f=dateOnlyEvidenceFixture();for(const correctionKnownAt of ['2026-07-25T15:30:00.000Z','2026-07-25T16:00:30.000Z']){
  const o={...f.observation,revisionKind:'MAPPING_CORRECTION' as const,supersedesObservationId:'synthetic-prior-observation',revisionReason:'reviewed mapping repair',revisionEvidenceReference:'synthetic-correction-lineage',recordVersion:'2',correctionKnownAt},a=assess(o,{trusted:true});expect(a.publicBoundary).toBe('2026-07-25T15:00:00.000Z');expect(a.availableAt).toBe(o.ingestedAt);expect(a.evidenceInputs.find(e=>e.evidenceClass==='CORRECTION_KNOWLEDGE')).toMatchObject({timestamp:correctionKnownAt,evidenceReference:o.revisionEvidenceReference,canEstablishPublicBoundary:false});
  const unknown=assess({...o,publication:{publishedAt:null,publicationDate:null,publicationPrecision:'UNKNOWN',publicationStatus:'UNKNOWN',timezone:null,evidenceReference:null}},{trusted:true});expect(unknown.status).toBe('UNKNOWN');expect(unknown.publicBoundary).toBeNull();expect(unknown.availableAt).toBeNull();
 }
 expect(()=>assess({...f.observation,revisionKind:'MAPPING_CORRECTION',supersedesObservationId:'synthetic-prior-observation',revisionReason:'future correction',revisionEvidenceReference:'synthetic-correction-lineage',recordVersion:'2',correctionKnownAt:'2026-07-25T16:02:00.000Z'})).toThrow();
});
it('K/L: exact timestamp remains exact; signing, period, trusted provider and correction cannot fill UNKNOWN',()=>{
 const f=dateOnlyEvidenceFixture(),timestamp={...f.observation,publication:{...f.observation.publication,publicationPrecision:'TIMESTAMP' as const,publicationDate:null,publishedAt:'2026-07-25T14:00:00.000Z',timezone:'UTC'}};
 const a=assess(timestamp,{trusted:true});expect(a.publicBoundary).toBe(timestamp.publication.publishedAt);expect(a.publicFallbackBoundary).toBeNull();expect(a.evidenceBackedBoundary).toBeNull();expect(a.availableAt).toBe(f.observation.ingestedAt);expect(a.evidenceInputs.find(e=>e.evidenceClass==='ISSUER_PUBLICATION_TIMESTAMP')!.canEstablishPublicBoundary).toBe(true);
 expect(()=>assess({...timestamp,publication:{...timestamp.publication,publishedAt:'2026-07-25T15:01:00.000Z'}})).toThrow();
 const unknown=assess({...f.observation,publication:{publishedAt:null,publicationDate:null,publicationPrecision:'UNKNOWN',publicationStatus:'UNKNOWN',timezone:null,evidenceReference:null}},{trusted:true});expect(unknown.status).toBe('UNKNOWN');expect(unknown.evidenceInputs.find(e=>e.evidenceClass==='TRUSTED_PROVIDER_RECEIPT')!.canEstablishPublicBoundary).toBe(false);
});
it('M/N: AS_REVISED is diagnostic at its explicit cutoff; rebuild clocks do not broaden AS_KNOWN or change content',()=>{
 const f=dateOnlyEvidenceFixture(),early={...f.request,systemKnownAt:'2026-07-25T16:00:59.999Z',assessmentPins:[]},known=buildFundamentalSnapshot(early,f.inputs,snapshotHash),revised=buildFundamentalSnapshot({...early,mode:'AS_REVISED',revisionCutoff:f.request.systemKnownAt,assessmentPins:f.request.assessmentPins},f.inputs,snapshotHash);expect(known.members).toEqual([]);expect(revised.members).toHaveLength(1);expect(JSON.parse(revised.manifest).diagnosticOnly).toBe(true);expect(revised.contentHash).not.toBe(known.contentHash);
 const first=buildFundamentalSnapshot(f.request,f.inputs,snapshotHash),later=buildFundamentalSnapshot({...f.request,runId:'other-v2-run',builtAt:'2026-08-01T00:00:00.000Z'},f.inputs,snapshotHash);expect(later.contentHash).toBe(first.contentHash);expect(JSON.parse(first.manifest).contract).toBe('fundamental-snapshot-content-v2');
 const alias={...f.observation,id:'alias-v2-observation',rawCaptureId:'alias-v2-capture'},b={...f.providerEvidenceBinding,receipt:{...f.providerEvidenceBinding.receipt,observationHash:snapshotHash(alias)}},a=assessAvailability({id:'alias-v2-assessment',observation:alias,registry:f.registry,policy:f.policy,assessedAt:f.assessment.assessedAt,providerEvidenceBinding:b,hash:snapshotHash});expect(buildFundamentalSnapshot({...f.request,assessmentPins:[{observationId:alias.id,assessmentId:a.id}]},{...f.inputs,observations:[alias],assessments:[a],providerEvidenceBindings:[b]},snapshotHash).contentHash).toBe(first.contentHash);
});

it('v2 derived PIT inherits delayed evidence knowledge of every operand and remains diagnostic under AS_REVISED',()=>{
 const f=dateOnlyEvidenceFixture(),g=snapshotDerivationFixture(),observations=g.observations.map(o=>({...o,publication:f.observation.publication,providerReceivedAt:f.observation.providerReceivedAt,retrievedAt:f.observation.retrievedAt,ingestedAt:f.observation.ingestedAt})),bindings=observations.map((o,i)=>({...f.providerEvidenceBinding,receipt:{...f.providerEvidenceBinding.receipt,observationHash:snapshotHash(o),knownAt:i===0?o.ingestedAt:'2026-07-25T16:02:00.000Z'}})),assessments=observations.map((observation,i)=>assessAvailability({id:'assessment-'+observation.id,observation,registry:f.registry,policy:f.policy,assessedAt:f.assessment.assessedAt,providerEvidenceBinding:bindings[i],hash:snapshotHash}));
 const c=loadDerivationCrosswalk(release),crosswalk={...c.crosswalk,registryHash:f.registry.registryHash,recordedAt:f.policy.recordedAt,effectiveDate:'2026-01-01'},request={id:g.request.derivedIds[0],scope:f.request.scope,securityId:f.observation.securityId,sector:f.observation.sector,metric:'FCF' as const,periodStart:f.observation.periodStart,periodEnd:f.observation.periodEnd,cyclical:false,operands:observations.map(o=>({id:'operand-'+o.id,operation:'REPORTED' as const,observationIds:[o.id],adjustment:null}))},result=deriveFundamentals({request,recordedAt:f.request.builtAt,registry:f.registry,crosswalk,crosswalkHash:normalizationHash(crosswalk),observations,hash:normalizationHash}),inputs={registry:f.registry,observations,assessments,derived:[result],providerEvidenceBindings:bindings},r={...g.request,...f.request,requirements:g.request.requirements,assessmentPins:g.request.assessmentPins,derivedIds:g.request.derivedIds};
 const known=buildFundamentalSnapshot(r,inputs,snapshotHash);expect(known.derivedIds).toEqual([]);expect(known.blockers).toContain('BLOCKED_DERIVED_INPUTS');
 const at='2026-07-25T16:02:00.000Z',revised=buildFundamentalSnapshot({...r,mode:'AS_REVISED',revisionCutoff:at,fundamentalCutoff:at,decisionAsOf:at,marketCutoff:at},inputs,snapshotHash);expect(revised.derivedIds).toEqual([result.id]);const m=JSON.parse(revised.manifest);expect(m.diagnosticOnly).toBe(true);expect(m.derived[0].value).toBe('70');expect(m.derived[0].availableAt).toBe(at);
 expect(buildFundamentalSnapshot({...r,systemKnownAt:at,fundamentalCutoff:at,decisionAsOf:at,marketCutoff:at},inputs,snapshotHash).derivedIds).toEqual([result.id]);
});
