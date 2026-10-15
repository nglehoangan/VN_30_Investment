// @vitest-environment node
import {it,expect} from 'vitest';
import {dateOnlyEvidenceFixture} from '../fixtures/availability-evidence';
import {scoringReadinessFixture} from '../fixtures/scoring-readiness';
import {buildFundamentalSnapshot} from '@/domain/fundamentals/snapshot';
import {bridgeScoringInputs,assertBridgeMatches} from '@/domain/fundamentals/scoring-bridge';
import {validateEvidence,type Evidence} from '@/domain/scoring/evidence';
import {snapshotHash} from '@/infrastructure/fundamentals/snapshot-hash';
import {scoringInputSemantic} from '@/domain/fundamentals/scoring-readiness';
function dateOnly(){const f=dateOnlyEvidenceFixture('score-time'),snapshot=buildFundamentalSnapshot(f.request,f.inputs,snapshotHash),plan={facts:[{observationId:f.observation.id,evidenceId:'date-only-fact',validThrough:f.request.decisionAsOf}],metrics:[],external:[]};return {...f,snapshot,plan};}
it('governed receipt bridges DATE_ONLY at and after availability, retaining date, precision, exact proof and null publication clock',()=>{
 const f=dateOnly();expect(f.assessment.boundaryBasis).toBe('TRUSTED_PROVIDER_RECEIPT');
 for(const cutoff of [f.assessment.availableAt!,'2026-07-25T16:02:00.000Z']){
  const s={...f.snapshot,request:{...f.request,systemKnownAt:cutoff,fundamentalCutoff:cutoff,decisionAsOf:cutoff}},e=bridgeScoringInputs(s,f.observation.securityId,{...f.plan,facts:f.plan.facts.map(p=>({...p,validThrough:cutoff}))},f.inputs).evidence[0];
  expect(e.publishedAt).toBeNull();expect(e.receivedAt).toBe(f.assessment.availableAt);expect(e.time!.constituents[0]).toMatchObject({publicationDate:'2026-07-25',publicationPrecision:'DATE_ONLY',publicationStatus:'VERIFIED',evidenceReference:f.observation.publication.evidenceReference});expect(JSON.parse(e.time!.constituents[0].availabilityProvenance)).toEqual(f.assessment);expect(validateEvidence([e],f.observation.securityId,cutoff,cutoff)).toEqual([]);
 }
});
it('each cutoff independently blocks late DATE_ONLY; ungoverned, unknown and missing selected membership fail closed',()=>{
 const f=dateOnly(),before='2026-07-25T16:00:59.999Z';
 for(const request of [{...f.request,systemKnownAt:before},{...f.request,fundamentalCutoff:before}])expect(()=>bridgeScoringInputs({...f.snapshot,request},f.observation.securityId,f.plan,f.inputs)).toThrow();
 expect(()=>bridgeScoringInputs({...f.snapshot,members:[]},f.observation.securityId,f.plan,f.inputs)).toThrow();
 expect(()=>bridgeScoringInputs(f.snapshot,f.observation.securityId,f.plan,{...f.inputs,assessments:[{...f.assessment,policy:{...f.policy,governanceStatus:'PROPOSED',approvalReference:null}}]})).toThrow();
 expect(()=>bridgeScoringInputs(f.snapshot,f.observation.securityId,f.plan,{...f.inputs,observations:[{...f.observation,publication:{publishedAt:null,publicationDate:null,publicationPrecision:'UNKNOWN',publicationStatus:'UNKNOWN',timezone:null,evidenceReference:null}}]})).toThrow();
});
it('TIMESTAMP stays exact, legacy exact Evidence remains unchanged and neither contract permits a fake publication clock',()=>{
 const f=scoringReadinessFixture(),e=f.input.evidence.find(e=>e.id==='canonical-net-income')!;expect(e.publishedAt).toBe(f.observations[0].publication.publishedAt);expect(e.time!.constituents[0].publicationPrecision).toBe('TIMESTAMP');
 const old=scoringReadinessFixture('legacy');expect(old.input.evidence.every(e=>!e.time&&e.publishedAt!==null)).toBe(true);expect(validateEvidence(old.input.evidence,old.input.securityId,old.input.asOf,old.input.knownAt)).toEqual([]);
 const d=dateOnly(),g=bridgeScoringInputs(d.snapshot,d.observation.securityId,d.plan,d.inputs),bad={...g.evidence[0],publishedAt:d.assessment.publicBoundary!};expect(()=>validateEvidence([bad],d.observation.securityId,d.request.decisionAsOf,d.request.systemKnownAt)).toThrow();
});
it('precision, date, disclosure and governed receipt proof change full reviewed semantics and cannot replace the canonical bridge',()=>{
 const f=scoringReadinessFixture('date-only'),canonical=f.input.evidence.find(e=>e.time)!,base=snapshotHash(scoringInputSemantic(f.input));
 const changes=[{publicationPrecision:'TIMESTAMP',publishedAt:canonical.receivedAt,publicationDate:null},{publicationDate:'2026-07-24'},{evidenceReference:'other-disclosure'},{availabilityProvenance:canonical.time!.constituents[0].availabilityProvenance+' '}];
 for(const change of changes){const evidence=f.input.evidence.map(e=>e.id===canonical.id?{...e,time:{...e.time!,constituents:e.time!.constituents.map(c=>({...c,...change}))}} as Evidence:e),input={...f.input,evidence};expect(snapshotHash(input)).not.toBe(snapshotHash(f.input));expect(snapshotHash(scoringInputSemantic(input))).not.toBe(base);expect(()=>assertBridgeMatches(input,bridgeScoringInputs(f.snapshot,f.input.securityId,f.plan,f.sources),f.plan)).toThrow();}
 const external=f.input.evidence.find(e=>e.observation==='price')!;expect(()=>assertBridgeMatches({...f.input,evidence:f.input.evidence.map(e=>e.id===external.id?{...e,publishedAt:null,time:canonical.time!}:e)},bridgeScoringInputs(f.snapshot,f.input.securityId,f.plan,f.sources),f.plan)).toThrow();
});
