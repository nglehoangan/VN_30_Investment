/* eslint-disable @typescript-eslint/no-explicit-any -- Negative contract tests intentionally supply malformed boundary values and inspect versioned JSON artifacts. */
import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import {calculateMetrics,type MetricRequest} from '@/domain/scoring/metrics';
import {calculateScorecard} from '@/domain/scoring/scorecard';
import {RUBRICS} from '@/domain/scoring/methodology';
import {authorityBytes} from '@/infrastructure/dependencies/production-authority';
import {fixture} from '../fixtures/scoring';
const root='docs/fundamental-data-engine/scoring-g2-g3-vnm-pilot/v1-0-cefdb63/vnm/';
const load=(name:string)=>JSON.parse(readFileSync(root+name,'utf8'));
describe('VNM bounded research pilot',()=>{
 it('keeps exactly 23 approved rubrics, six exact prior assessments and all formal points null',()=>{
  const p=load('VNM_23_RUBRIC_MATRIX.json');const prior=JSON.parse(readFileSync('docs/fundamental-data-engine/dfr-04/closure-37e12f2/issuers/VNM.json','utf8'));
  expect(p.engineSector).toBe('RETAIL');expect(p.rows.map((r:any)=>r.rubricId)).toEqual(RUBRICS.map(r=>r.id));
  expect(p.rows.filter((r:any)=>r.priorAssessment)).toHaveLength(6);
  for(const r of p.rows){expect(r.points).toBeNull();expect(r.scoreBand).toBeNull();expect(r.humanApproval).toBeNull();expect(r.formalScoreEligible).toBe(false);expect(r.requiredTopics).toEqual(RUBRICS.find(x=>x.id===r.rubricId)!.topics);expect(r.priorAssessment).toEqual(prior.rubrics.find((x:any)=>x.rubric===r.rubricId).assessment);}
  expect(p.totalScore).toBeNull();expect(p.M4Decision).toBeNull();expect(p.rows.filter((r:any)=>r.rubricId.startsWith('VAL-')).every((r:any)=>r.researchBand===null)).toBe(true);
 });
 it('replays exact VNM revenue CAGR with annual/source bindings but grants no points or publication admission',()=>{
  const g=load('VNM_GROWTH_REPLAY.json');const e=g.operandRecords.map((m:any,i:number)=>({id:m.id,value:m.value,source:g.sourceReferences[i],unit:'VND' as const,periodStart:m.periodStart,periodEnd:m.periodEnd,quality:'VALID' as const,validThrough:'2026-11-11T00:00:00.000Z'}));
  const r:MetricRequest={id:'vnm-revenue-cagr',metric:'REVENUE_CAGR',evidenceRefs:e.map((x:any)=>x.id),years:3,comparable:true,normalization:{kind:'AS_REPORTED',rationale:'Retrospective research arithmetic only; no publication or formal admission asserted.',evidenceRefs:[]},growthOperands:e.map((x:any)=>({evidenceRef:x.id,scope:'CONSOLIDATED',revisionPolicy:g.revisionPolicy,periodType:'ANNUAL',periodStart:x.periodStart,periodEnd:x.periodEnd,sourceReference:x.source}))};
  const result=calculateMetrics([r],e,'RETAIL','2026-11-11T00:00:00.000Z',[],false)[0];expect(result.value).toBe(g.value.replace(/0+$/,'').replace(/\.$/,''));expect(result).not.toHaveProperty('points');expect(g.formalAdmission).toBe(false);expect(g.operandRecords.every((m:any)=>m.publicationAt===null)).toBe(true);
  const changed={...r,growthOperands:r.growthOperands!.map((x,i)=>i?x:{...x,sourceReference:'wrong-document'})};expect(()=>calculateMetrics([changed],e,'RETAIL','2026-11-11T00:00:00.000Z',[],false)).toThrow();
 });
 it('old executable pin rejects changed engine bytes without updating any production authority',()=>{const pins=JSON.parse(readFileSync('docs/fundamental-data-engine/scoring-g2-g3-vnm-pilot/v1-0-cefdb63/engineering/protected-before.json','utf8'));expect(()=>authorityBytes(process.cwd(),{path:'src/domain/scoring/metrics.ts',sha256:pins['src/domain/scoring/metrics.ts']})).toThrow();});
 it('cannot label provisional research as formal or human',()=>{
  const p=load('VNM_23_RUBRIC_MATRIX.json');expect(()=>calculateScorecard({...fixture(),artifactScope:p.classification})).toThrow();
  const f=fixture();expect(()=>calculateScorecard({...f,assessments:f.assessments.map((a,i)=>i?a:{...a,source:'AI' as never})})).toThrow();
 });
});
