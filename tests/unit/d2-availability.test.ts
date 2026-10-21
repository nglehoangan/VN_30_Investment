// @vitest-environment node
import {it,expect} from 'vitest';
import {assessD2Availability,d2ConservativeBoundary,D2_POLICY_CANDIDATE} from '@/domain/fundamentals/d2-availability';
import {d2Fixture} from '../fixtures/d2-availability';
import {assessAvailability} from '@/domain/fundamentals/availability';
const run=(f:Parameters<typeof assessD2Availability>[0]=d2Fixture())=>assessD2Availability(f);
it.each([
 ['2026-10-21','2026-10-21T17:00:00.000Z'],['2026-01-31','2026-01-31T17:00:00.000Z'],['2026-12-31','2026-12-31T17:00:00.000Z'],
 ['2024-02-28','2024-02-28T17:00:00.000Z'],['2024-02-29','2024-02-29T17:00:00.000Z'],['2026-02-28','2026-02-28T17:00:00.000Z'],['2000-02-29','2000-02-29T17:00:00.000Z'],['2100-02-28','2100-02-28T17:00:00.000Z'],
])('next-local-calendar-day boundary for %s is %s',(date,boundary)=>expect(d2ConservativeBoundary(date)).toBe(boundary));
it('rejects invalid calendar dates and noncanonical date/timestamp strings',()=>{
 for(const d of ['2026-02-29','2100-02-29','2026-13-01','2026-1-01','2026-10-21T00:00:00Z','not-a-date'])expect(()=>d2ConservativeBoundary(d)).toThrow();
});
it('preserves original DATE_ONLY precision and publishedAt=null without activating or admitting evidence',()=>{
 const f=d2Fixture(),r=run(f);expect(r.status).toBe('QUALIFIED_CANDIDATE');expect(r.publication).toEqual(f.observation.publication);expect(r.publication.publishedAt).toBeNull();expect(r.publicBoundary).toBe('2027-01-01T17:00:00.000Z');expect(r.effectiveKnownAt).toBe(r.publicBoundary);expect(r.admissionAuthorized).toBe(false);expect(r.productionActivated).toBe(false);expect(D2_POLICY_CANDIDATE.runtimeGovernanceStatus).toBe('PROPOSED');
});
it.each(['documentVerifiedAt','mappingKnownAt','methodologyKnownAt','other'])('%s may delay effectiveKnownAt and cannot be ignored',field=>{
 const f=d2Fixture(),later='2027-01-02T01:00:00.000Z';
 if(field==='documentVerifiedAt')f.evidence={...f.evidence,documentVerifiedAt:later};else if(field==='other')f.evidence={...f.evidence,knowledge:{...f.evidence.knowledge,otherBoundaries:[{...f.evidence.knowledge.otherBoundaries[0],at:later}]}};else f.evidence={...f.evidence,knowledge:{...f.evidence.knowledge,[field]:later}};
 const r=run(f);expect(r.effectiveKnownAt).toBe(later);expect(r.status).toBe('BLOCKED');expect(r.finding).toBe('D2_AS_KNOWN_LOOKAHEAD');
});
it('one millisecond before boundary blocks; exact boundary passes with no implicit intraday publication time',()=>{
 const f=d2Fixture();for(const [at,expected] of [['2027-01-01T16:59:59.999Z','BLOCKED'],['2027-01-01T17:00:00.000Z','QUALIFIED_CANDIDATE']] as const){const r=run({...f,cutoff:{...f.cutoff,systemKnownAt:at,decisionAsOf:at}});expect(r.status).toBe(expected);expect(r.publication.publishedAt).toBeNull();}
});
it.each(['mappingKnownAt','methodologyKnownAt'])('missing required %s blocks rather than defaulting to capture/publication time',field=>{
 const f=d2Fixture();expect(()=>run({...f,evidence:{...f.evidence,knowledge:{...f.evidence.knowledge,[field]:undefined}}} as unknown as ReturnType<typeof d2Fixture>)).toThrow();
});
it('missing verification, ingestion and additional required contract boundary evidence blocks',()=>{
 const f=d2Fixture();expect(()=>run({...f,evidence:{...f.evidence,documentVerifiedAt:undefined}} as unknown as ReturnType<typeof d2Fixture>)).toThrow();
 expect(()=>run({...f,evidence:{...f.evidence,knowledge:{...f.evidence.knowledge,otherBoundaries:[]}}})).toThrow();
 const observation={...f.observation,ingestedAt:undefined};expect(()=>run({...f,observation} as unknown as ReturnType<typeof d2Fixture>)).toThrow();
});
it('verified exact TIMESTAMP remains exact and existing timestamp availability behavior remains unchanged',()=>{
 const f=d2Fixture('TIMESTAMP'),before=assessAvailability({id:'synthetic-d2-timestamp',observation:f.observation,registry:f.registry,policy:f.policy,assessedAt:f.cutoff.assessedAt,hash:f.hash}),r=run(f),after=assessAvailability({id:'synthetic-d2-timestamp',observation:f.observation,registry:f.registry,policy:f.policy,assessedAt:f.cutoff.assessedAt,hash:f.hash});
 expect(after).toEqual(before);expect(r.publicBoundary).toBe(f.observation.publication.publishedAt);expect(r.publication.publicationPrecision).toBe('TIMESTAMP');expect(r.boundaries.some(b=>b.kind==='CONSERVATIVE_DATE_ONLY_BOUNDARY')).toBe(false);
});
it('source-contract clocks and identity/method knowledge are lower bounds, never ignored for a historical cutoff',()=>{
 const f=d2Fixture(),identityMethod={...f.identityMethod,recordedAt:'2027-01-02T01:00:00.000Z' as never};expect(run({...f,identityMethod}).effectiveKnownAt).toBe(identityMethod.recordedAt);expect(run({...f,identityMethod}).status).toBe('BLOCKED');
});
it('unverified VHM-style date leads and non-issuer/exchange date-only sources never qualify',()=>{
 const f=d2Fixture(),observation={...f.observation,publication:{publishedAt:null,publicationDate:null,publicationPrecision:'UNKNOWN' as const,publicationStatus:'UNKNOWN' as const,timezone:null,evidenceReference:null}};
 const e={...f.evidence,observationHash:f.hash(observation),knowledge:{...f.evidence.knowledge,observationHash:f.hash(observation)}};expect(run({...f,observation,evidence:e}).status).toBe('BLOCKED');
 for(const sourceKind of ['OFFICIAL_SOURCE_METADATA','APPROVED_API_PUBLICATION'] as const){const sourceContract={...f.sourceContract,sourceKind},identityBinding={...f.identityBinding,sourceContractHash:f.hash(sourceContract)},identityMethod={...f.identityMethod,configurationReference:'d2-source-identity-sha256:'+f.hash(identityBinding)};expect(run({...f,sourceContract,identityBinding,identityMethod,evidence:{...f.evidence,identityBindingHash:f.hash(identityBinding)}}).status).toBe('BLOCKED');}
});
it('source identity must be independently approved with exact immutable binding, not granted by D2 semantics',()=>{
 const f=d2Fixture();for(const identityMethod of [null,{...f.identityMethod,governanceStatus:'PROPOSED' as const},{...f.identityMethod,configurationReference:'wrong-hash'}])expect(run({...f,identityMethod}).status).toBe('BLOCKED');
 expect(()=>run({...f,evidence:{...f.evidence,sourceHash:f.hash('replacement-source')}})).toThrow();expect(()=>run({...f,evidence:{...f.evidence,filing:{...f.evidence.filing,documentHash:f.hash('replacement-PDF')}}})).toThrow();
});
it('conflicting independently bound publication dates block; no latest-wins choice is made',()=>{
 const f=d2Fixture(),first=f.evidence.publicationCaptures[0],second={...first,artifactHash:f.hash('second capture'),payload:{...first.payload as object,released:'2026-12-31'},reference:'synthetic-conflicting-date'},identityBinding={...f.identityBinding,publicationCaptures:[...f.identityBinding.publicationCaptures,{sha256:second.artifactHash,pageUrl:'https://issuer.example/second-disclosure'}]},identityMethod={...f.identityMethod,configurationReference:'d2-source-identity-sha256:'+f.hash(identityBinding)};
 const r=run({...f,identityBinding,identityMethod,evidence:{...f.evidence,identityBindingHash:f.hash(identityBinding),publicationCaptures:[first,second]}});expect(r.status).toBe('BLOCKED');expect(r.finding).toBe('D2_CONFLICTING_PUBLICATION_EVIDENCE');
});
it.each(['ingestion','retrieval','correction','providerReceipt'])('%s is an operational lower bound and cannot move availability backwards',kind=>{
 const f=d2Fixture(),later='2027-01-02T01:00:00.000Z';
 const observation={...f.observation,...(kind==='ingestion'?{ingestedAt:later}:kind==='retrieval'?{retrievedAt:later,ingestedAt:later}:kind==='correction'?{revisionKind:'MAPPING_CORRECTION' as const,supersedesObservationId:'synthetic-prior',revisionReason:'Synthetic mapping correction',recordVersion:'2',ingestedAt:later,correctionKnownAt:later,revisionEvidenceReference:'synthetic-correction'}:{providerReceivedAt:later,providerReceiptReference:'synthetic-receipt',retrievedAt:later,ingestedAt:later})};
 const evidence={...f.evidence,observationHash:f.hash(observation),knowledge:{...f.evidence.knowledge,observationHash:f.hash(observation)},...(['retrieval','providerReceipt'].includes(kind)?{documentRetrievedAt:later,documentVerifiedAt:later}:{})};
 const r=run({...f,observation,evidence});expect(r.status).toBe('BLOCKED');expect(r.effectiveKnownAt).toBe(later);
});
it('calendar boundary is independent of host timezone, including leap-day and year rollover',()=>{
 const previous=process.env.TZ;try{for(const zone of ['UTC','Asia/Ho_Chi_Minh','America/Los_Angeles']){process.env.TZ=zone;expect(d2ConservativeBoundary('2024-02-29')).toBe('2024-02-29T17:00:00.000Z');expect(d2ConservativeBoundary('2026-12-31')).toBe('2026-12-31T17:00:00.000Z');}}finally{process.env.TZ=previous;}
});
it('DATE_ONLY UTC timezone is not silently reinterpreted as Vietnam local date',()=>{
 const f=d2Fixture(),observation={...f.observation,publication:{...f.observation.publication,timezone:'UTC'}};const e={...f.evidence,observationHash:f.hash(observation),knowledge:{...f.evidence.knowledge,observationHash:f.hash(observation)}};expect(run({...f,observation,evidence:e}).finding).toBe('D2_AUTHORITATIVE_ISSUER_EXCHANGE_DATE_ONLY_REQUIRED');
});
it('an earlier provider receipt cannot advance the next-local-day conservative boundary',()=>{
 const f=d2Fixture(),observation={...f.observation,providerReceivedAt:'2027-01-01T10:00:00.000Z',providerReceiptReference:'synthetic-earlier-provider-receipt'},evidence={...f.evidence,observationHash:f.hash(observation),knowledge:{...f.evidence.knowledge,observationHash:f.hash(observation)}};
 expect(run({...f,observation,evidence}).publicBoundary).toBe('2027-01-01T17:00:00.000Z');
});

it('candidate receipt binds exact decision/system/assessment cutoffs and cannot be replayed as a different context',()=>{
 const f=d2Fixture(),a=run(f),b=run({...f,cutoff:{...f.cutoff,systemKnownAt:'2027-01-01T23:59:59.999Z'}});expect(a.cutoff).toEqual(f.cutoff);expect(a.contentHash).not.toBe(b.contentHash);expect(a.admissionAuthorized).toBe(false);
});
