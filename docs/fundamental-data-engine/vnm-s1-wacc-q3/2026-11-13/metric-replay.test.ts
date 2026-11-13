import {it,expect} from 'vitest';
import {readFileSync,writeFileSync} from 'node:fs';
import {calculateMetrics} from '@/domain/scoring/metrics';
import {decimal} from '@/domain/portfolio/values';
const dir='docs/fundamental-data-engine/vnm-s1-wacc-q3/2026-11-13/';
it('replays current nine-month operating-return arithmetic through unchanged M3 without applying annual score bands or formal Evidence',()=>{
 const d=JSON.parse(readFileSync(dir+'WACC_ROIC_Q3_ASSESSMENT.json','utf8')),c=d.q3CurrentPeriod.scenarios[0];
 const start='2026-01-01',end='2026-09-30',at=end+'T16:59:59.000Z';
 const operands=[{id:'s1-current-nopat',value:c.nopatNineMonths},{id:'s1-current-average-capital',value:c.averageCapital}].map(e=>({...e,unit:'VND' as const,quality:'VALID' as const,periodStart:start,periodEnd:end,validThrough:at,source:dir+'WACC_ROIC_Q3_ASSESSMENT.json'}));
 const q={id:'s1-nine-month-arithmetic-only',metric:'ROIC' as const,evidenceRefs:operands.map(e=>e.id),years:null,comparable:true,normalization:{kind:'NORMALIZED' as const,rationale:'Arithmetic-only normalization estimate; no financial admission or annual scoring-band selection.',evidenceRefs:operands.map(e=>e.id)}};
 const r=calculateMetrics([q],operands,'RETAIL',at,[],false)[0];
 expect(r.reason).toBeNull();expect(r.value).not.toBeNull();
 const expected=Number(c.returnNineMonthsNotAnnualized).toFixed(12),gap=decimal(r.value!).sub(decimal(expected)).units;expect(gap<=1n&&gap>=-1n).toBe(true);
 expect(r).not.toHaveProperty('points');expect(d.totalScore).toBeNull();
 writeFileSync(dir+'METRIC_REPLAY.json',JSON.stringify({status:'PASS',value:r.value,periodStart:start,periodEnd:end,notAnnualized:true,notTtm:true,formalAdmission:false,pointsAssigned:false},null,2)+'\n');
});
