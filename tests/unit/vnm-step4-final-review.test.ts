import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {it,expect} from 'vitest';
import {RUBRICS} from '@/domain/scoring/methodology';
const base='docs/fundamental-data-engine/vnm-step4-final-review/2026-11-17/';
const read=(n:string)=>JSON.parse(readFileSync(base+n,'utf8'));
it('dispositions all 23/83 and promotes only the evidence-supported mixed allocation candidate',()=>{
 const c=read('VNM_ASSESSMENT_CANDIDATES_SUCCESSOR.json');expect(c.rows).toHaveLength(23);expect(c.rows.reduce((n:number,r:{requiredTopics:string[]})=>n+r.requiredTopics.length,0)).toBe(83);
 expect(c.rows.filter((r:{candidateBand:unknown})=>r.candidateBand!==null)).toHaveLength(20);expect(c.totalScore).toBeNull();
 const a=c.rows.find((r:{rubricId:string})=>r.rubricId==='CA-REINV');expect(a.candidateBand.label).toBe('Mixed/acceptable');expect(a.candidatePoints).toBe(1);expect(a.formalSelectedPoints).toBeNull();expect(a.humanApprovalReference).toBeNull();
 expect(a.topicAssessments.map((t:{topicId:string})=>t.topicId)).toEqual(RUBRICS.find(r=>r.id==='CA-REINV')!.topics);
 expect(a.topicAssessments.every((t:{support:string})=>t.support==='BOUNDED_RESEARCH_SUPPORT')).toBe(true);
});
it('does not force the other three bands or infer a numeric incremental ROIC from a distorted denominator',()=>{
 const c=read('FOUR_RUBRIC_FINAL_REVIEW.json');expect(c.currentEvidenceBlocked).toEqual(['GQ-INC','CA-DIST','CA-PSV']);
 for(const r of c.rows.filter((r:{rubricId:string})=>r.rubricId!=='CA-REINV')){expect(r.status).toBe('N/R');expect(r.candidatePoints).toBeNull();}
 expect(c.cycleNormalizationSensitivity).toHaveLength(48);expect(c.cycleNormalizationSensitivity.every((r:{qualifiedIncrementalRoic:null})=>r.qualifiedIncrementalRoic===null)).toBe(true);
});
it('preserves the exact retained source PDFs/notes and documents reviewed physical pages',()=>{
 const s=read('ALLOCATION_SOURCE_REVIEW.json');expect(s.physicalPagesReviewed).toEqual({parent:[29,30,47],consolidated:[37,40]});
 for(const pin of s.sourcePins)expect(createHash('sha256').update(readFileSync(pin.path)).digest('hex')).toBe(pin.sha256);
 expect(s.limits).toHaveLength(5);
});
