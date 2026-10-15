import {describe,it,expect} from 'vitest';
import {classifyMappingOperand,adjustmentDependency,existingQualificationForContext} from '../../scripts/lib/08b-mapping-closure-classification.mjs';
describe('closure diagnostics cannot substitute evidence authority',()=>{
 it('does not map cash payments, demand-deposit caption or regulatory categories as complete frozen operands',()=>{
  for(const itemId of ['CAPEX','BANK_CURRENT_AND_SAVINGS_DEPOSITS','BANK_NONPERFORMING_LOANS'])expect(classifyMappingOperand({itemId,operation:'REPORTED',captionCandidates:[{page:1}]}).disposition).toBe('GOVERNANCE_MAPPING_GAP');
 });
 it('keeps exact but public-unknown facts outside resolved selected operands',()=>{
  expect(classifyMappingOperand({itemId:'CFO',operation:'REPORTED',exactFacts:[{id:'x'}],unknownIds:['x']}).disposition).toBe('PIT_UNKNOWN');
  expect(classifyMappingOperand({itemId:'CFO',operation:'REPORTED',exactFacts:[{id:'x'}],selectedIds:['x']}).disposition).toBe('RESOLVED_VALID_SELECTED_OPERAND');
 });
 it('never turns reported earnings or a missing adjustment into an automatic zero adjustment',()=>{
  expect(adjustmentDependency('HUMAN_NORMALIZED')).toEqual({classification:'HUMAN_INVESTMENT_JUDGMENT',workflow:'INDEPENDENT_REVIEWED_NORMALIZED_EARNINGS',mechanical:false,financialPdfMissing:false,adjustmentCreated:false});
  expect(()=>adjustmentDependency('REPORTED')).toThrow();
 });
});

it('pins an existing qualification by exact body, period and scope instead of the first body match or latest date',()=>{
 const period={start:'2026-01-01',end:'2026-06-30',type:'YTD',fiscalYear:2026,fiscalQuarter:2,calendarReference:'SOURCE_EXPLICIT_CALENDAR_WINDOW'};
 const first={id:'narrow',status:'QUALIFIED',bodyHash:'body',reportingScope:'CONSOLIDATED',period:{...period,start:'2026-04-01',type:'QUARTER'}};
 const exact={...first,id:'wide',period};
 const latest={...exact,id:'latest-separate',reviewedAt:'2099-01-01',reportingScope:'SEPARATE_STANDALONE'};
 expect(existingQualificationForContext([first,latest,exact],'body',period,'CONSOLIDATED')).toBe(exact);
 expect(existingQualificationForContext([first,latest],'body',period,'CONSOLIDATED')).toBeNull();
});
