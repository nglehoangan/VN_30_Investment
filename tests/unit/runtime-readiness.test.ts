// @vitest-environment node
import {it,expect} from 'vitest';
import {runtimeFixture} from '../fixtures/runtime-readiness';
import {RuntimeReadiness} from '@/application/fundamentals/runtime-readiness';
import {prepareFormalObservation} from '@/domain/fundamentals/runtime-provenance';
import {bindRuntimeAuthority} from '@/domain/fundamentals/runtime-authority';
import {buildFundamentalSnapshot} from '@/domain/fundamentals/snapshot';
import {assessAvailability} from '@/domain/fundamentals/availability';
import {buildIssuerDossier} from '@/domain/fundamentals/runtime-dossier';
import {deriveFundamentals} from '@/domain/fundamentals/derivation';
import {derivationFixture} from '../fixtures/derivation';
const unknown={publishedAt:null,publicationDate:null,publicationPrecision:'UNKNOWN' as const,publicationStatus:'UNKNOWN' as const,timezone:null,evidenceReference:null};
const service=(f:ReturnType<typeof runtimeFixture>)=>new RuntimeReadiness(f.authority,f.hash,f.digest);
it('formal preparation preserves canonical/raw/import lineage and distinct clocks',async()=>{
 const f=runtimeFixture(),r=await service(f).prepareObservation(f.preparation);
 expect(r.observation.normalized.value).toBe('15000000000');expect(r.lineage.canonicalPointer).toBe('/canonicalFacts/0');expect(r.lineage.sourcePointer).toBe('/netProfitAfterTax');
 expect(r.clocks.sourcePublishedAt).not.toBe(r.clocks.sourceRetrievedAt);expect(r.clocks.reportAsOf).not.toBe(r.clocks.periodEnd);expect(Object.isFrozen(r)).toBe(true);
});
it.each(['MISSING','REPORT_DATE','RETRIEVAL_DATE'] as const)('%s cannot establish publication evidence',kind=>{
 const f=runtimeFixture();const p={...structuredClone(f.preparation)};
 if(kind==='MISSING')p.observation={...p.observation,publication:unknown};
 else p.receipt={...p.receipt,publication:{...p.receipt.publication,kind:kind as never,publishedAt:kind==='REPORT_DATE'?p.observation.reportDate+'T00:00:00.000Z':p.observation.retrievedAt}};
 p.receipt={...p.receipt,observationHash:f.hash(p.observation)};
 expect(()=>prepareFormalObservation(p,f.hash,f.digest)).toThrow();
});
it('unknown publication produces a blocked AS_KNOWN snapshot, never zero',()=>{
 const f=runtimeFixture(),observations=f.observations.map(o=>({...o,publication:unknown})),assessments=observations.map(o=>assessAvailability({id:'unknown-'+o.id,observation:o,registry:f.registry,policy:f.policy,assessedAt:f.request.systemKnownAt,hash:f.hash}));
 const r=buildFundamentalSnapshot({...f.request,assessmentPins:assessments.map(a=>({observationId:a.observationId,assessmentId:a.id}))},{...f.sources,observations,assessments},f.hash);
 expect(r.members).toHaveLength(0);expect(r.blockers).toContain('BLOCKED_PUBLICATION_UNKNOWN');
});
it('future publication/retrieval/correction knowledge cannot be admitted',()=>{
 const f=runtimeFixture();expect(()=>prepareFormalObservation({...f.preparation,knownAt:'2026-07-25T00:00:00.000Z'},f.hash,f.digest)).toThrow();
 const o={...f.preparation.observation,revisionKind:'MAPPING_CORRECTION' as const,supersedesObservationId:'prior-observation',revisionReason:'correction',revisionEvidenceReference:'evidence',correctionKnownAt:'2026-08-01T00:00:00.000Z'};
 expect(()=>prepareFormalObservation({...f.preparation,observation:o},f.hash,f.digest)).toThrow();
});
it('corrected observations preserve predecessor and correction knowledge without backdating',()=>{
 const f=runtimeFixture(),o={...f.preparation.observation,revisionKind:'MAPPING_CORRECTION' as const,supersedesObservationId:'prior-observation',revisionReason:'corrected source mapping',revisionEvidenceReference:'reviewed-correction-evidence',correctionKnownAt:f.preparation.observation.ingestedAt};
 const r=prepareFormalObservation({...f.preparation,observation:o,receipt:{...f.preparation.receipt,observationHash:f.hash(o)}},f.hash,f.digest);
 expect(r.clocks.knownAt>=o.correctionKnownAt).toBe(true);expect(r.observation.supersedesObservationId).toBe('prior-observation');
});
it('lineage changes and unregistered receipts block preparation',async()=>{
 const f=runtimeFixture();await expect(service(f).prepareObservation({...f.preparation,receipt:{...f.preparation.receipt,canonicalFactId:'forged'}})).rejects.toThrow(failure('TRUSTED_LINEAGE_PUBLICATION_RECEIPT_REQUIRED'));
 expect(()=>prepareFormalObservation({...f.preparation,capture:{...f.preparation.capture,payload:'{}'}},f.hash,f.digest)).toThrow(failure('FORMAL_LINEAGE_INCOMPLETE'));
});
it('proposed, mismatched, expired and future authority cannot be active',()=>{
 const f=runtimeFixture(),r=f.registrations.get(f.registry.registryHash)!;
 expect(bindRuntimeAuthority(r.pin,r.method,f.preparation.asOf,f.preparation.knownAt).state).toBe('ACTIVE');
 expect(()=>bindRuntimeAuthority(r.pin,{...r.method,governanceStatus:'PROPOSED'},f.preparation.asOf,f.preparation.knownAt)).toThrow();
 expect(()=>bindRuntimeAuthority({...r.pin,effectiveThrough:'2026-06-01T00:00:00.000Z'},r.method,f.preparation.asOf,f.preparation.knownAt)).toThrow();
 expect(()=>bindRuntimeAuthority({...r.pin,hash:f.hash('wrong')},r.method,f.preparation.asOf,f.preparation.knownAt)).toThrow();
});
it('snapshot content hash is immutable and changes with financial content',()=>{
 const f=runtimeFixture();expect(buildFundamentalSnapshot(f.request,f.sources,f.hash).contentHash).toBe(f.snapshot.contentHash);
 const observations=f.observations.map((o,i)=>i?o:{...o,normalized:{...o.normalized,value:'16000000000'}}),assessments=observations.map(o=>assessAvailability({id:'new-'+o.id,observation:o,registry:f.registry,policy:f.policy,assessedAt:f.request.systemKnownAt,hash:f.hash}));
 const changed=buildFundamentalSnapshot({...f.request,assessmentPins:assessments.map(a=>({observationId:a.observationId,assessmentId:a.id}))},{...f.sources,observations,assessments},f.hash);
 expect(changed.contentHash).not.toBe(f.snapshot.contentHash);expect(()=>{(f.snapshot.members as unknown[]).push({});}).toThrow();
});
it('missing required input blocks readiness and dossier never supplies HUMAN outcomes',()=>{
 const f=runtimeFixture(),sources={...f.sources,observations:[],assessments:[]};
 const s=buildFundamentalSnapshot({...f.request,assessmentPins:[]},sources,f.hash);
 expect(s.blockers).toContain('BLOCKED_REQUIRED_FACT_MISSING');
 const dossier=buildIssuerDossier(f.input.securityId,'SCORABLE',s,sources,f.hash);
 expect(dossier.rubrics).toHaveLength(23);expect(dossier.rubrics.every(r=>r.formalAssessment===null)).toBe(true);expect(dossier.readyForScoring).toBe(false);
 expect(()=>buildIssuerDossier(f.input.securityId,'DEFERRED',s,sources,f.hash)).toThrow(failure('DEFERRED_DOSSIER_FORBIDDEN'));
});
it('governed derivation propagates max operand availability and rejects future inputs',async()=>{
 const f=runtimeFixture(),g=derivationFixture(),registry=f.registry,observations=g.observations.map((o,i)=>({...o,registryHash:registry.registryHash,publication:f.preparation.observation.publication,ingestedAt:i?'2026-07-26T10:00:00.000Z':o.ingestedAt}));
 const policy=f.policy,assessments=observations.map(o=>assessAvailability({id:'derived-'+o.id,observation:o,registry,policy,assessedAt:f.request.systemKnownAt,hash:f.hash}));
 const crosswalk={...g.crosswalk,registryHash:registry.registryHash,governanceStatus:'APPROVED' as const,approvalReference:'SYNTHETIC ONLY formula approval',recordedAt:'2026-01-01T00:00:00.000Z',effectiveDate:'2026-01-01'};
 f.register(f.hash(crosswalk),'derivation-crosswalk');
 const input={request:g.request,recordedAt:f.request.systemKnownAt,crosswalk,sources:{registry,observations,assessments,derived:[]},asOf:f.request.decisionAsOf,knownAt:f.request.systemKnownAt};
 const r=await service(f).derive(input);expect(r.assessment.value).toBe('70');expect(r.knownAt).toBe('2026-07-26T10:00:00.000Z');expect(r.operands).toHaveLength(2);
 await expect(service(f).derive({...input,knownAt:'2026-07-26T09:30:00.000Z'})).rejects.toThrow();
 expect(deriveFundamentals({...g,recordedAt:g.recordedAt}).value).toBe('70');
});
it('runtime snapshot builds exactly29 evidence dossiers, quarantines the deferred issuer and requires trusted lineage',async()=>{
 const f=runtimeFixture(),partition={members:f.observations.map((o,i)=>({securityId:o.securityId,state:i===29?'DEFERRED' as const:'SCORABLE' as const}))};
 const preparations=f.observations.slice(0,29).map((o,i)=>{
  const observation={...o,ancestorReferences:f.preparation.observation.ancestorReferences,raw:{...o.raw,fieldLocator:f.preparation.receipt.sourcePointer}},capture=f.captures[i];
  const receipt={...f.preparation.receipt,observationHash:f.hash(observation),captureHash:f.hash(capture),canonicalFactId:'synthetic-canonical-'+i};
  f.receipts.set(f.hash(receipt),receipt);return {...f.preparation,observation,capture,receipt};
 });
 const observations=preparations.map(p=>p.observation),assessments=observations.map((o,i)=>assessAvailability({id:f.assessments[i].id,observation:o,registry:f.registry,policy:f.policy,assessedAt:f.request.systemKnownAt,hash:f.hash}));
 const sources={...f.sources,observations,assessments},request={...f.request,requirements:f.request.requirements.slice(0,29),assessmentPins:f.request.assessmentPins.slice(0,29)};
 const envelope=await service(f).snapshot(request,sources,partition,f.hash(f.requirements),preparations);
 expect(envelope.dossiers).toHaveLength(29);expect(envelope.snapshot.members).toHaveLength(29);expect(envelope.readyForScoring).toBe(false);
 expect(envelope.dossiers.some(d=>d.securityId===f.observations[29].securityId)).toBe(false);
 await expect(service(f).snapshot(request,sources,partition,f.hash(f.requirements),[])).rejects.toThrow();
 await expect(service(f).snapshot(f.request,sources,partition,f.hash(f.requirements),preparations)).rejects.toThrow();
 const missing=await service(f).snapshot({...request,assessmentPins:[]},{...sources,observations:[],assessments:[]},partition,f.hash(f.requirements),[]);
 expect(missing.state).toBe('MISSING_REQUIRED_INPUT');expect(missing.snapshot.blockers.length).toBeGreaterThan(0);
});

function failure(reason:string){return expect.objectContaining({issues:expect.arrayContaining([expect.objectContaining({reason})])});}
