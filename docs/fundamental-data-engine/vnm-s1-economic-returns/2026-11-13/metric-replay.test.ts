import {it,expect} from 'vitest';
import {readFileSync,writeFileSync} from 'node:fs';
import {calculateMetrics} from '@/domain/scoring/metrics';
import {decimal} from '@/domain/portfolio/values';
const dir='docs/fundamental-data-engine/vnm-s1-economic-returns/2026-11-13/';
const data=JSON.parse(readFileSync(dir+'S1_ECONOMIC_RETURNS.json','utf8'));
it('replays four real retained VNM annual ROIC arithmetic rows through the unchanged M3 metric calculator, without formal Evidence or scoring',()=>{
 const results=[];
 for(const row of data.engineArithmeticInputs){
  const periodStart=`${row.year}-01-01`,periodEnd=`${row.year}-12-31`,asOf=periodEnd+'T16:59:59.000Z';
  // MetricOperand is an arithmetic-only type; these are NOT admitted Evidence or a ScoreInput.
  const operands=[{id:'analysis-nopat',value:row.nopat},{id:'analysis-capital',value:row.averageCapital}].map(e=>({...e,unit:'VND' as const,quality:'VALID' as const,periodStart,periodEnd,validThrough:asOf,source:dir+'S1_ECONOMIC_RETURNS.json'}));
  const request={id:'annual-ROIC',metric:'ROIC' as const,evidenceRefs:operands.map(e=>e.id),years:null,comparable:true,normalization:{kind:'NORMALIZED' as const,rationale:'Arithmetic validation of declared consolidated normalization sensitivity; no source admission or point selection.',evidenceRefs:operands.map(e=>e.id)}};
  const result=calculateMetrics([request],operands,'RETAIL',asOf,[],false)[0];
  expect(result.reason).toBeNull();expect(result.value).not.toBeNull();
  const gap=decimal(result.value!).sub(decimal(row.expectedRoic12dp)).units;expect(gap<=1n&&gap>=-1n).toBe(true);expect(result).not.toHaveProperty('points');
  results.push({year:row.year,value:result.value,expected:row.expectedRoic12dp,scope:'ARITHMETIC_ONLY_NOT_ADMISSION_OR_SCORING'});
 }
 expect(data.S1Closed).toBe(false);expect(data.costOfCapitalComparison.status).toBe('N_R');
 writeFileSync(dir+'METRIC_REPLAY.json',JSON.stringify({status:'PASS',existingCalculator:'src/domain/scoring/metrics.ts::calculateMetrics',rows:results,formalAdmission:false,pointsAssigned:false},null,2)+'\n');
});
