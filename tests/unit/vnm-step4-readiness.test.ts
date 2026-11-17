import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {describe,it,expect} from 'vitest';
import {calculateScorecard as aiScorecard} from '@/domain/personal-ai/scorecard';
import {reviewedAiInput} from '../fixtures/personal-ai-scoring';
import {snapshotHash} from '@/infrastructure/fundamentals/snapshot-hash';
import {dateOnly} from '@/shared/time';
import {RUBRICS} from '@/domain/scoring/methodology';
import {calculateScorecard} from '@/domain/scoring/scorecard';
import {fixture} from '../fixtures/scoring';
const base='docs/fundamental-data-engine/vnm-step4-scoring-validation/2026-11-17/';
const read=(name:string)=>JSON.parse(readFileSync(base+name,'utf8'));
describe('VNM Step4 retained real evidence review and actual rejection',()=>{
 it('accounts for exact 23 rubrics and 83 topics without claiming adoption',()=>{
  const a=read('VNM_23_ASSESSMENT_ADOPTION.json');expect(a.rows).toHaveLength(23);
  expect(a.rows.reduce((n:number,r:{topicAssessments:unknown[]})=>n+r.topicAssessments.length,0)).toBe(83);
  for(const rubric of RUBRICS){const row=a.rows.find((r:{rubricId:string})=>r.rubricId===rubric.id);expect(row.requiredTopics).toEqual(rubric.topics);expect(row.topicAssessments.map((t:{topicId:string})=>t.topicId)).toEqual(rubric.topics);expect(row.formalSelectedPoints).toBeNull();expect(row.humanApprovalReference).toBeNull();expect(row.trustedAiProductionReviewBinding).toBeNull();}
  expect(a.adoptedFormalAssessments).toBe(0);expect(a.totalScore).toBeNull();
 });
 it('every supported candidate band exists in unchanged approved rubric',()=>{
  for(const r of read('VNM_23_ASSESSMENT_ADOPTION.json').rows){if(r.candidateBand)expect(RUBRICS.find(x=>x.id===r.rubricId)!.bands.some(b=>b.label===r.candidateBand.label)).toBe(true);}
 });
 it('retains four economic N/R dispositions without default zero or midpoint',()=>{
  const d=read('VNM_4_RUBRIC_RESOLUTION.json');expect(d.rows.map((r:{rubricId:string})=>r.rubricId)).toEqual(['GQ-INC','CA-REINV','CA-DIST','CA-PSV']);
  for(const r of d.rows){expect(r.status).toBe('N/R');expect(r.candidateBand).toBeNull();expect(r.candidatePoints).toBeNull();expect(r.remainingEconomicDependency.length).toBeGreaterThan(30);}
  for(const s of d.calculations.multiYearScenarioDiagnostics)expect(s.qualifiedIncrementalRoic).toBeNull();
 });
 it('reconciles investment movement exactly and never turns JV loss into marginal ROIC',()=>{
  const j=read('VNM_4_RUBRIC_RESOLUTION.json').calculations.allocationBridge.jointVentureAssociates;
  expect(BigInt(j.openingVnd)+BigInt(j.newInvestmentVnd)+BigInt(j.lossShareVnd)+BigInt(j.dividendsVnd)).toBe(BigInt(j.closingVnd));
 });
 it('preserves closed S2 and separates payability from distribution discipline',()=>{
  const c=read('VNM_4_RUBRIC_RESOLUTION.json').calculations;expect(c.s2Closed).toBe(true);expect(c.s2CoreCases).toBe(6);expect(Number(c.s2MinimumCoreSurplusVnd)).toBeGreaterThan(0);expect(c.bookPlusCashIsIntrinsicReturn).toBe(false);
 });
 it('every consumed source pin still matches bytes',()=>{
  for(const pin of read('INPUT_PINS.json').inputs)expect(createHash('sha256').update(readFileSync(pin.path)).digest('hex'),pin.path).toBe(pin.sha256);
 });
 it('records actual registered engine rejection, no fake scorecard, and deterministic replay',()=>{
  const x=read('VNM_SCORING_EXECUTION.json');expect(x.actualEngineError).toContain('DI_ACCEPTANCE_REQUIRED');expect(x.replayedEngineError).toBe(x.actualEngineError);expect(x.exactApprovedMethodRegisteredInIsolatedDatabase).toBe(true);expect(x.domainGuardError).toContain('FUTURE_METHODOLOGY');expect(x.databaseCountsAfter).toEqual(x.databaseCountsBefore);expect(x.databaseCountsAfter.scorecards).toBe(0);expect(x.formalScorecardProduced).toBe(false);expect(x.totalScore).toBeNull();
 });
 it('real current consumer proves 35 current and 65 history while refusing PIT',()=>{
  const x=read('VNM_SCORING_EXECUTION.json');expect(x.currentDataset.facts).toBe(35);expect(x.currentDataset.history).toBe(65);expect(x.currentDataset.reference.permitsScoring).toBe(false);expect(x.currentDataset.reference.historicalPitGranted).toBe(false);
  const real=read('REAL_EXECUTION.json');expect(real.checks.some((c:{reason:string})=>c.reason.includes('CURRENT_ONLY_NOT_PIT'))).toBe(true);expect(real.protectedDatabase.after).toEqual(real.protectedDatabase.before);
 });
 it('does not fabricate portfolio, trade or M1 approvals',()=>{
  expect(read('VNM_M1_RISK_GATE_VALIDATION.json').formalGateRecordsCreated).toBe(0);expect(read('VNM_DECISION_GATE_VALIDATION.json').tradeRecommendation).toBeNull();
 });
});
describe('approved engine negative controls, synthetic adversarial fixtures only',()=>{
 it('rejects AI assessment masquerading as the legacy human path',()=>{
  const f=fixture();expect(()=>calculateScorecard({...f,assessments:f.assessments.map((a,i)=>i===0?{...a,source:'AI'}:a)} as never)).toThrow('Dữ liệu');
 });
 it('rejects absent band rather than silently awarding zero',()=>{
  const f=fixture();expect(()=>calculateScorecard({...f,assessments:f.assessments.map((a,i)=>i===0?{...a,assessment:null,selectedPoints:null}:a)} as never)).toThrow();
 });
 it('missing topic leaves N/R and null total; never renormalizes partial score',()=>{
  const f=fixture(),a=f.assessments[0];const c=calculateScorecard({...f,assessments:[{...a,evidence:a.evidence.slice(1)},...f.assessments.slice(1)]});expect(c.totalScore).toBeNull();expect(c.subcategories[0].status).toBe('N/R');
 });
 it('later method cannot be backdated through knownAt',()=>{
  const f=fixture();expect(()=>calculateScorecard({...f,methodology:{...f.methodology,effectiveDate:dateOnly('2099-01-01')}})).toThrow();
 });
 it('missing external lineage cannot become Stage0 pass',()=>{
  const f=fixture();expect(()=>calculateScorecard({...f,stage0:{...f.stage0,status:'PASS',evidenceRefs:[]}})).toThrow();
 });
});

describe('personal-AI parity for approved scoped action dependencies, synthetic only',()=>{
 it('keeps unrelated rubric scores when per-share action comparability fails',()=>{
  const f=fixture(),source={...f,normalization:{...f.normalization,actionComparable:false}};
  const human=calculateScorecard(source),ai=aiScorecard(reviewedAiInput(source).input,snapshotHash);
  expect(ai.subcategories.map(r=>({id:r.id,points:r.points,status:r.status}))).toEqual(human.subcategories.map(r=>({id:r.id,points:r.points,status:r.status})));
  expect(ai.subcategories.find(r=>r.id==='BQ-EQ')!.points).not.toBeNull();
  expect(ai.subcategories.find(r=>r.id==='CA-DIL')!.points).toBeNull();
  expect(ai.operationalAuthorizationGranted).toBe(false);
 });
});
