// @vitest-environment node
import {it,expect} from 'vitest';
import {scoringReadinessFixture} from '../fixtures/scoring-readiness';
import {evaluateScoringReadiness,bindDIAcceptance,validateDIAcceptance} from '@/domain/fundamentals/scoring-readiness';
import {bridgeScoringInputs,assertBridgeMatches} from '@/domain/fundamentals/scoring-bridge';
import {snapshotHash,manifestDigest} from '@/infrastructure/fundamentals/snapshot-hash';
import {assessAvailability} from '@/domain/fundamentals/availability';
import {buildFundamentalSnapshot} from '@/domain/fundamentals/snapshot';
import {calculateScorecard} from '@/domain/scoring/scorecard';
import type {DataInitializationAcceptance} from '@/domain/fundamentals/scoring-readiness';
function rows(a:DataInitializationAcceptance=scoringReadinessFixture().acceptance){const f=scoringReadinessFixture();return evaluateScoringReadiness(a,f.snapshot,f.sources,snapshotHash);}
it('accounts for all 30 tickers; data readiness, human score readiness and actionability remain distinct',()=>{
 const f=scoringReadinessFixture();bindDIAcceptance(f.acceptance,f.snapshot,snapshotHash,manifestDigest);const r=rows();expect(r).toHaveLength(30);expect(r[0]).toMatchObject({readyForScoring:true,dataReady:true,flowTechnical:'NOT_APPLICABLE',blockers:[]});expect(r[1]).toMatchObject({readyForScoring:false,dataReady:false,fundamentals:'READY',market:'BLOCKED'});expect(r[1].blockers).toContain('BLOCKED_ASSESSMENT_REQUIRED');expect(calculateScorecard(f.input).totalScore).toBe('82');
});
it('missing/failed DI, self-review and unresolved Critical/Major issues fail closed',()=>{
 const f=scoringReadinessFixture();for(const a of [{...f.acceptance,gates:f.acceptance.gates.slice(1)},{...f.acceptance,reviewerReference:f.acceptance.producerReference},{...f.acceptance,gates:f.acceptance.gates.map((g,i)=>i===0?{...g,status:'NOT_EXECUTED'}:g)},{...f.acceptance,issues:[{id:'critical',severity:'CRITICAL',resolutionReference:null}]}])expect(()=>validateDIAcceptance(a as DataInitializationAcceptance)).toThrow();
 expect(()=>validateDIAcceptance({...f.acceptance,tickers:f.acceptance.tickers.slice(1)})).toThrow();
});
it('same content with another run, modified policy/model/universe/cutoff or AS_REVISED cannot inherit acceptance',()=>{
 const f=scoringReadinessFixture();for(const s of [{...f.snapshot,request:{...f.request,runId:'another-run'}},{...f.snapshot,contentHash:'0'.repeat(64)},{...f.snapshot,request:{...f.request,requirementsVersion:'changed-requirements'}},{...f.snapshot,request:{...f.request,mode:'AS_REVISED' as const,revisionCutoff:f.request.systemKnownAt}}])expect(()=>bindDIAcceptance(f.acceptance,s,snapshotHash,manifestDigest)).toThrow();
 const changed={...f.acceptance,tickers:f.acceptance.tickers.map((t,i)=>i===0?{...t,input:{...f.input,knownAt:'2026-07-29T00:00:00.000Z'}}:t)};expect(rows(changed)[0].readyForScoring).toBe(false);expect(rows(changed)[0].blockers).toContain('READINESS_MODEL_OR_CUTOFF_MISMATCH');
});
it('human, valuation, confidence, gates and critical inputs produce explicit blockers without auto assessments',()=>{
 const f=scoringReadinessFixture();for(const input of [{...f.input,assessments:[]},{...f.input,expectedReturn:null},{...f.input,confidence:{...f.input.confidence,level:'LOW' as const}},{...f.input,stage0:{...f.input.stage0,status:'UNKNOWN' as const}},{...f.input,criticalMissing:['synthetic missing financial history']}]){
  const a={...f.acceptance,tickers:f.acceptance.tickers.map((t,i)=>i===0?{...t,input}:t)},r=rows(a)[0];expect(r.readyForScoring).toBe(false);expect(r.blockers.length).toBeGreaterThan(0);
 }
});
it('strict bridge preserves null/zero/currency/period and rejects unbound DATE_ONLY/UNKNOWN publication changes',()=>{
 const f=scoringReadinessFixture(),o=f.observations[0];for(const publicationPrecision of ['DATE_ONLY','UNKNOWN'] as const){const observations=f.observations.map((v,i)=>i===0?{...v,publication:{publishedAt:null,publicationDate:publicationPrecision==='DATE_ONLY'?'2026-07-25':null,publicationPrecision,publicationStatus:publicationPrecision==='DATE_ONLY'?'VERIFIED' as const:'UNKNOWN' as const,timezone:publicationPrecision==='DATE_ONLY'?'UTC':null,evidenceReference:publicationPrecision==='DATE_ONLY'?'date-only-ref':null}}:v);expect(()=>bridgeScoringInputs(f.snapshot,o.securityId,f.plan,{...f.sources,observations})).toThrow();}
 const zero={...o,normalized:{...o.normalized,value:'0'}};expect(bridgeScoringInputs(f.snapshot,o.securityId,f.plan,{...f.sources,observations:[zero,...f.observations.slice(1)]}).evidence[0].value).toBe('0');
 for(const normalized of [{...o.normalized,value:null},{...o.normalized,currency:'USD'}])expect(()=>bridgeScoringInputs(f.snapshot,o.securityId,f.plan,{...f.sources,observations:[{...o,normalized},...f.observations.slice(1)]})).toThrow();
});
it('forged Evidence, metric references and unclassified numeric fundamentals cannot bypass the bridge',()=>{
 const f=scoringReadinessFixture(),g=bridgeScoringInputs(f.snapshot,f.input.securityId,f.plan,f.sources);expect(()=>assertBridgeMatches({...f.input,evidence:f.input.evidence.map(e=>e.id===g.evidence[0].id?{...e,value:'999'}:e)},g,f.plan)).toThrow();
 expect(()=>assertBridgeMatches({...f.input,metrics:[{id:'forged-metric',metric:'FCF',evidenceRefs:['x','y'],years:null,comparable:true,normalization:{kind:'AS_REPORTED',rationale:'forged',evidenceRefs:[]}}]},g,f.plan)).toThrow();
 const id=f.plan.external[0].evidenceId;expect(()=>assertBridgeMatches({...f.input,evidence:f.input.evidence.map(e=>e.id===id?{...e,unit:'VND' as const,value:'123'}:e)},g,f.plan)).toThrow();
 expect(()=>bridgeScoringInputs({...f.snapshot,members:[]},f.input.securityId,f.plan,f.sources)).toThrow();
});
it('later local knowledge and stale bridges cannot be hidden by later calculation clocks',()=>{
 const f=scoringReadinessFixture(),late={...f.sources,assessments:f.assessments.map(a=>({...a,availableAt:'2026-07-29T00:00:00.000Z'}))};expect(()=>bridgeScoringInputs(f.snapshot,f.input.securityId,f.plan,late)).toThrow();expect(()=>bridgeScoringInputs(f.snapshot,f.input.securityId,{...f.plan,facts:f.plan.facts.map(r=>({...r,validThrough:'2026-07-26T00:00:00.000Z'}))},f.sources)).toThrow();
});

it('global DI4/valuation declarations cannot hide absent per-ticker required evidence',()=>{
 const f=scoringReadinessFixture();for(const [observation,blocker] of [['price','BLOCKED_MARKET_INPUTS'],['conservative_value','BLOCKED_VALUATION_INPUTS']]){
  const removed=f.input.evidence.find(e=>e.observation===observation)!,input={...f.input,evidence:f.input.evidence.filter(e=>e.id!==removed.id)},bridge={...f.plan,external:f.plan.external.filter(e=>e.evidenceId!==removed.id)},a={...f.acceptance,tickers:f.acceptance.tickers.map((t,i)=>i===0?{...t,input,bridge}:t)},r=rows(a)[0];expect(r.readyForScoring).toBe(false);expect(r.dataReady).toBe(false);expect(r.blockers).toContain(blocker);
 }
 const wrongUnit={...f.input,evidence:f.input.evidence.map(e=>e.observation==='price'?{...e,unit:'RATIO' as const}:e)},wrong={...f.acceptance,tickers:f.acceptance.tickers.map((t,i)=>i===0?{...t,input:wrongUnit}:t)};expect(rows(wrong)[0].market).toBe('BLOCKED');expect(rows(wrong)[0].readyForScoring).toBe(false);
 const input={...f.input,assessments:[]},a={...f.acceptance,tickers:f.acceptance.tickers.map((t,i)=>i===0?{...t,input}:t)},r=rows(a)[0];expect(r.dataReady).toBe(true);expect(r.readyForScoring).toBe(false);expect(r.blockers).toContain('BLOCKED_ASSESSMENT_REQUIRED');
});

it('fundamentals readiness uses selected eligible facts, never unselected, stale, wrong-scope or late repository rows',()=>{
 const f=scoringReadinessFixture();for(const [snapshot,sources] of [
  [{...f.snapshot,members:[]},f.sources],
  [{...f.snapshot,request:{...f.request,requirements:f.request.requirements.map(q=>({...q,maxAgeDays:0}))}},f.sources],
  [f.snapshot,{...f.sources,observations:f.observations.map(o=>({...o,scope:'SYNTHETIC_TEST' as const}))}],
  [f.snapshot,{...f.sources,assessments:f.assessments.map(a=>({...a,availableAt:'2026-07-29T00:00:00.000Z'}))}]
 ] as const){const r=evaluateScoringReadiness(f.acceptance,snapshot,sources,snapshotHash);expect(r.every(t=>t.fundamentals==='BLOCKED'&&!t.dataReady&&!t.readyForScoring)).toBe(true);}
});

it('coverage checks do not reject valid maximum-length canonical observation IDs',()=>{
 const f=scoringReadinessFixture(),observation={...f.observations[0],id:'F'.repeat(128)},assessment=assessAvailability({id:'long-id-assessment',observation,registry:f.registry,policy:f.policy,assessedAt:f.assessment.assessedAt,hash:snapshotHash}),sources={...f.sources,observations:[observation,...f.observations.slice(1)],assessments:[assessment,...f.assessments.slice(1)]},request={...f.request,assessmentPins:f.request.assessmentPins.map((p,i)=>i===0?{observationId:observation.id,assessmentId:assessment.id}:p)},snapshot=buildFundamentalSnapshot(request,sources,snapshotHash),acceptance={...f.acceptance,contentHash:snapshot.contentHash,manifestDigest:manifestDigest(snapshot.manifest),tickers:f.acceptance.tickers.map((t,i)=>i===0?{...t,input:null,bridge:null}:t)};
 expect(evaluateScoringReadiness(acceptance,snapshot,sources,snapshotHash)[0]).toMatchObject({fundamentals:'READY',dataReady:false,readyForScoring:false});
});
