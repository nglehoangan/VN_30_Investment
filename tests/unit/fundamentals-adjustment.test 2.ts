// @vitest-environment node
import {it,expect} from 'vitest';
import {deriveFundamentals,validateDerivationRequest} from '@/domain/fundamentals/derivation';
import type {ReviewedAdjustment} from '@/domain/fundamentals/derivation';
import {reviewedAdjustmentFixture} from '../fixtures/reviewed-adjustment';
import {derivationFact} from '../fixtures/derivation';
const run=(patch:Partial<ReviewedAdjustment>={})=>{
  const f=reviewedAdjustmentFixture(),request={...f.request,operands:[{...f.request.operands[0],adjustment:{...f.adjustment,...patch}},f.request.operands[1]]};
  return deriveFundamentals({...f,request});
};
it('explicit VND monetary normalization retains all dimensions and review evidence',()=>{
 const f=reviewedAdjustmentFixture(),r=run();expect(r.value).toBe('0.15');expect(r.operands[0].value).toBe('18');
 expect(r.request.operands[0].adjustment).toEqual(f.adjustment);expect(r.confidence).toBe('MEDIUM');
 expect(r.availability).toEqual({availableAt:null,status:'UNKNOWN'});expect(r.observations[0].publication.publishedAt).toBeNull();
 expect(Object.isFrozen(r.request.operands[0].adjustment)).toBe(true);
});
it('currency/unit mismatches yield N/R, no FX or scaling; base facts remain unchanged',()=>{
 for(const patch of [{currency:'USD'},{unit:'RATIO' as const,currency:null},{unit:'CURRENCY_PER_SHARE' as const,currency:'VND'},{unit:'SHARES' as const,currency:null}]){
  const r=run(patch);expect(r.status).toBe('N_R');expect(r.value).toBeNull();expect(r.operands[0].value).toBeNull();
  expect(r.reason).toBe('MONETARY_ADJUSTMENT_DIMENSION_MISMATCH');expect(r.confidence).toBe('LOW');
  expect(r.observations[0].normalized).toEqual({value:'24',unit:'CURRENCY',currency:'VND'});
 }
 expect(()=>run({unit:'MILLION_CURRENCY' as ReviewedAdjustment['unit']})).toThrow();
});
it('missing dimensions, unknown taxonomy, missing review/evidence/rationale and invalid currency reject admission',()=>{
 const f=reviewedAdjustmentFixture();
 for(const name of ['unit','currency','adjustmentKind','reviewerReference','reviewedAt','evidenceReference','rationale'] as const){
  const request=JSON.parse(JSON.stringify(f.request));delete request.operands[0].adjustment[name];
  expect(()=>validateDerivationRequest(request)).toThrow();
 }
 for(const patch of [{currency:null},{currency:'vnd'},{adjustmentKind:'UNKNOWN' as ReviewedAdjustment['adjustmentKind']},{reviewerReference:''},{evidenceReference:''},{rationale:''}])expect(()=>run(patch)).toThrow();
});
it('signed amounts are authoritative: removing a gain and adding back an expense do not flip by classification',()=>{
 expect(run({amount:'-6',adjustmentKind:'NON_RECURRING_GAIN'}).operands[0].value).toBe('18');
 expect(run({amount:'6',adjustmentKind:'NON_RECURRING_LOSS'}).operands[0].value).toBe('30');
 expect(run({amount:'6',adjustmentKind:'NON_RECURRING_GAIN'}).operands[0].value).toBe('30');
 expect(run({amount:'-6',adjustmentKind:'ACCOUNTING_RECLASSIFICATION'}).operands[0].value).toBe('18');
 expect(run({amount:'-6',adjustmentKind:'OTHER_REVIEWED'}).operands[0].value).toBe('18');
});
it('ROE default crosswalk requires reviewed normalized common profit; no synthetic zero is injected',()=>{
 const f=reviewedAdjustmentFixture();
 expect(f.crosswalk.routes.filter(r=>r.metric==='ROE').every(r=>r.operands[0].operation==='HUMAN_NORMALIZED'&&r.operands[0].role==='normalized_common_profit')).toBe(true);
 const missing={...f.request,operands:[{...f.request.operands[0],adjustment:null},f.request.operands[1]]};
 expect(()=>deriveFundamentals({...f,request:missing})).toThrow();
 const reported={...f.request,operands:[{...f.request.operands[0],operation:'REPORTED' as const,adjustment:null},f.request.operands[1]]};
 const r=deriveFundamentals({...f,request:reported});expect(r.status).toBe('N_R');expect(r.reason).toBe('OPERAND_CROSSWALK_MISMATCH');
 expect(r.request.operands[0].adjustment).toBeNull();expect(f.adjustment.amount).toBe('-6');
});
it('monetary additions and action factors cannot be confused; factors require per-share input',()=>{
 expect(()=>run({unit:'RATIO',currency:null,adjustmentKind:'CORPORATE_ACTION_FACTOR',amount:'0.5'})).toThrow();
 const f=reviewedAdjustmentFixture();
 const action=(patch:Partial<ReviewedAdjustment>={})=>({...f.request,operands:[{...f.request.operands[0],operation:'ACTION_ADJUSTED' as const,
  adjustment:{...f.adjustment,unit:'RATIO' as const,currency:null,adjustmentKind:'CORPORATE_ACTION_FACTOR' as const,amount:'0.5',...patch}},f.request.operands[1]]});
 for(const patch of [{unit:'CURRENCY' as const,currency:'VND'},{unit:'RATIO' as const,currency:'USD'},{adjustmentKind:'OTHER_REVIEWED' as const},{amount:'0'},{amount:'-1'}])expect(()=>validateDerivationRequest(action(patch))).toThrow();
 const crosswalk={...f.crosswalk,routes:f.crosswalk.routes.map(r=>r.metric==='ROE'?{...r,operands:r.operands.map((o,i)=>i===0?{...o,operation:'ACTION_ADJUSTED' as const}:o)}:r)};
 const r=deriveFundamentals({...f,request:action(),crosswalk,crosswalkHash:f.hash(crosswalk)});
 expect(r.operands[0].value).toBeNull();expect(r.reason).toBe('ACTION_REQUIRES_PER_SHARE_INPUT');
});
it('non-monetary base cannot accept monetary HUMAN_NORMALIZED adjustment',()=>{
 const f=reviewedAdjustmentFixture();
 // The exact canonical registry governs base dimensions; a per-share primitive is covered by the existing action test.
 const bad=derivationFact('reviewed-profit','NET_INCOME_ATTRIBUTABLE_COMMON','24');
 expect(()=>deriveFundamentals({...f,observations:[{...bad,normalized:{...bad.normalized,unit:'RATIO',currency:null}},...f.observations.slice(1)]})).toThrow();
});
