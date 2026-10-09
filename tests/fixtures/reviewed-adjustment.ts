import {derivationFixture,derivationFact} from './derivation';
import type {DerivationRequest,ReviewedAdjustment} from '@/domain/fundamentals/derivation';
/** Synthetic dimensions declared independently of the fact; no inheritance from its normalized unit. */
export function reviewedAdjustmentFixture(){
  const f=derivationFixture();
  const profit=derivationFact('reviewed-profit','NET_INCOME_ATTRIBUTABLE_COMMON','24');
  const begin={...derivationFact('reviewed-begin','COMMON_EQUITY','100'),periodType:'INSTANT' as const,periodStart:'2026-03-31',periodEnd:'2026-03-31',fiscalQuarter:1 as const};
  const end={...derivationFact('reviewed-end','COMMON_EQUITY','140'),periodType:'INSTANT' as const,periodStart:'2026-06-30',periodEnd:'2026-06-30'};
  const adjustment:ReviewedAdjustment={id:'reviewed-gain-removal',reviewerReference:'fixture-reviewer',reviewedAt:f.recordedAt,
    evidenceReference:'fixture-evidence-gain',rationale:'Reviewed non-recurring gain of 6 VND removed from common profit',amount:'-6',
    unit:'CURRENCY',currency:'VND',adjustmentKind:'NON_RECURRING_GAIN',confidence:'MEDIUM'};
  const request:DerivationRequest={...f.request,id:'reviewed-roe',metric:'ROE',operands:[
    {id:'reviewed-profit-operand',operation:'HUMAN_NORMALIZED',observationIds:[profit.id],adjustment},
    {id:'reviewed-equity-operand',operation:'AVERAGE_ENDPOINTS',observationIds:[begin.id,end.id],adjustment:null}]};
  return {...f,request,observations:[profit,begin,end],adjustment};
}
