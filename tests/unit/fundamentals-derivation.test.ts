// @vitest-environment node
import {it,expect} from 'vitest';
import {deriveFundamentals} from '@/domain/fundamentals/derivation';
import type {DerivationCrosswalk,DerivationRequest} from '@/domain/fundamentals/derivation';
import {derivationFixture,derivationFact} from '../fixtures/derivation';
import {normalizationHash} from '@/infrastructure/fundamentals/reviewed-statement';
import {loadCanonicalRegistry} from '@/infrastructure/fundamentals/canonical-registry';
const run=(patch:Partial<ReturnType<typeof derivationFixture>>={})=>deriveFundamentals({...derivationFixture(),...patch});
it('FCF uses existing ordered formula, exact decimals and immutable pinned lineage without publication',()=>{
 const r=run();expect(r.value).toBe('70');expect(r.status).toBe('CALCULATED');expect(r.confidence).toBe('HIGH');
 expect(r.availability.availableAt).toBeNull();expect(r.observations[0].publication.publishedAt).toBeNull();expect(Object.isFrozen(r.operands)).toBe(true);
 expect(run({observations:[derivationFact('cfo','CFO','100.000000000001'),derivationFact('capex','CAPEX','30')]}).value).toBe('70.000000000001');
});
it('missing, conflicting, mixed currency/scope, wrong item and future local facts fail closed',()=>{
 const f=derivationFixture();
 for(const patch of [{normalized:{...f.observations[0].normalized,value:null},quality:'UNKNOWN' as const},
  {quality:'CONFLICTING' as const},{reportingScope:'SEPARATE_STANDALONE' as const},{normalized:{...f.observations[0].normalized,currency:'USD'},raw:{...f.observations[0].raw,currency:'USD'}}]){
  expect(run({observations:[{...f.observations[0],...patch},f.observations[1]]}).status).toBe('N_R');
 }
 expect(()=>run({observations:[{...f.observations[0],ingestedAt:'2030-01-01T00:00:00.000Z'},f.observations[1]]})).toThrow();
 expect(()=>run({request:{...f.request,scope:'FORMAL'}})).toThrow();
 expect(run({request:{...f.request,cyclical:true}}).value).toBeNull();
});
it('ROE independently reconciles reviewed common profit and begin/end common equity; weak review limits confidence',()=>{
 const f=derivationFixture(),profit=derivationFact('profit','NET_INCOME_ATTRIBUTABLE_COMMON','24');
 const begin={...derivationFact('begin','COMMON_EQUITY','100'),periodType:'INSTANT' as const,periodStart:'2026-03-31',periodEnd:'2026-03-31',fiscalQuarter:1 as const};
 const end={...derivationFact('end','COMMON_EQUITY','140'),periodType:'INSTANT' as const,periodStart:'2026-06-30',periodEnd:'2026-06-30'};
 const request:DerivationRequest={...f.request,metric:'ROE',operands:[{id:'profit-operand',operation:'HUMAN_NORMALIZED',observationIds:[profit.id],adjustment:{id:'review-profit',reviewerReference:'fixture-reviewer',reviewedAt:f.recordedAt,evidenceReference:'fixture-normalization-evidence',rationale:'Reviewed 6-unit exceptional gain excluded',amount:'-6',confidence:'MEDIUM'}},{id:'equity-operand',operation:'AVERAGE_ENDPOINTS',observationIds:[begin.id,end.id],adjustment:null}]};
 const r=run({request,observations:[profit,begin,end]});expect(r.operands.map(o=>o.value)).toEqual(['18','120']);expect(r.value).toBe('0.15');expect(r.confidence).toBe('MEDIUM');
 expect(run({request,observations:[profit,{...begin,normalized:{...begin.normalized,value:'-140'}},end]}).reason).toContain('NONPOSITIVE');
 expect(()=>run({request:{...request,operands:[{...request.operands[0],adjustment:null},request.operands[1]]},observations:[profit,begin,end]})).toThrow();
});
it('bank CASA/NPL independently reconcile only with explicit isolated canonical component definitions',()=>{
 const f=derivationFixture();
 for(const [metric,ids,values,expected] of [['CASA',['TEST_CURRENT_SAVINGS','TEST_DEPOSITS'],['30','200'],'0.15'],['NPL',['TEST_NPL','TEST_GROSS_LOANS'],['4','200'],'0.02']] as const){
  const base=f.registry.manifest.items.find(i=>i.itemId==='TOTAL_ASSETS')!;
  const registry=loadCanonicalRegistry({...f.registry.manifest,items:[...f.registry.manifest.items,...ids.map(itemId=>({...base,itemId,name:itemId,meaning:'SYNTHETIC BANK COMPONENT ONLY',sectorApplicability:['BANK' as const],evidenceTopicMappings:[],operandMappings:[]}))]});
  const crosswalk:DerivationCrosswalk={...f.crosswalk,registryHash:registry.registryHash,routes:[{sector:'BANK',metric,operands:ids.map((itemId,i)=>({itemId,role:metric==='CASA'?['current_and_savings','deposits'][i]:['NPL','gross_loans'][i],operation:'REPORTED'}))}]};
  const observations=ids.map((itemId,i)=>({...derivationFact(`bank-${i}`,'TOTAL_ASSETS',values[i]),itemId,sector:'BANK' as const,registryHash:registry.registryHash,periodStart:'2026-06-30',periodType:'INSTANT' as const}));
  const request={...f.request,sector:'BANK' as const,metric,periodStart:'2026-06-30',operands:observations.map(o=>({id:`operand-${o.id}`,operation:'REPORTED' as const,observationIds:[o.id],adjustment:null}))};
  expect(run({registry,crosswalk,crosswalkHash:normalizationHash(crosswalk),request,observations}).value).toBe(expected);
  expect(run({registry,crosswalk,crosswalkHash:normalizationHash(crosswalk),request,observations:[observations[0],{...observations[1],normalized:{...observations[1].normalized,value:'0'}}]}).value).toBeNull();
 }
});
it('unresolved insurance/securities routes remain N/R; banks cannot substitute industrial FCF',()=>{
 const f=derivationFixture();for(const sector of ['INSURANCE','SECURITIES'] as const){
  const observations=[derivationFact('cfo','NET_INCOME','100'),derivationFact('capex','NET_INCOME','30')].map(o=>({...o,sector}));
  expect(run({observations,request:{...f.request,sector,metric:'ROE'}}).reason).toBe('UNRESOLVED_SECTOR_ROUTE');
 }
 const observations=[derivationFact('cfo','NET_INCOME','100'),derivationFact('capex','NET_INCOME','30')].map(o=>({...o,sector:'BANK' as const}));
 expect(run({observations,request:{...f.request,sector:'BANK',metric:'FCF'}}).reason).toBe('UNRESOLVED_SECTOR_ROUTE');
});
it('TTM adds exactly four ordered native quarters, rejects gaps, duplicates, stocks and incomplete years',()=>{
 const f=derivationFixture(),periods=[['2025-04-01','2025-06-30',2025,2],['2025-07-01','2025-09-30',2025,3],['2025-10-01','2025-12-31',2025,4],['2026-01-01','2026-03-31',2026,1]] as const;
 const observations=['CFO','CAPEX'].flatMap((itemId,j)=>periods.map(([periodStart,periodEnd,fiscalYear,fiscalQuarter],i)=>({...derivationFact(`part-${j}-${i}`,itemId,j?'2':'10'),periodStart,periodEnd,fiscalYear,fiscalQuarter})));
 const crosswalk={...f.crosswalk,version:'test-ttm',routes:[{sector:'TECHNOLOGY' as const,metric:'FCF' as const,operands:[{role:'CFO',itemId:'CFO',operation:'TTM_QUARTERS' as const},{role:'issuer_capex',itemId:'CAPEX',operation:'TTM_QUARTERS' as const}]}]};
 const request={...f.request,periodStart:periods[0][0],periodEnd:periods[3][1],operands:[0,1].map(j=>({id:`ttm-${j}`,operation:'TTM_QUARTERS' as const,observationIds:observations.slice(j*4,j*4+4).map(o=>o.id),adjustment:null}))};
 const patch={crosswalk,crosswalkHash:normalizationHash(crosswalk),request,observations};
 expect(run(patch).value).toBe('32');
 expect(run({...patch,observations:observations.map((o,i)=>i===1?{...o,periodStart:'2025-07-02'}:o)}).status).toBe('N_R');
 expect(()=>run({...patch,request:{...request,operands:[{...request.operands[0],observationIds:['part-0-0','part-0-0']},request.operands[1]]}})).toThrow();
 expect(run({...patch,request:{...request,operands:[{...request.operands[0],observationIds:request.operands[0].observationIds.slice(0,3)},request.operands[1]]},observations:observations.filter(o=>o.id!=='part-0-3')}).value).toBeNull();
});
it('quarter-from-YTD subtraction requires compatible ordered fiscal windows and explicit crosswalk',()=>{
 const f=derivationFixture(),observations=['CFO','CAPEX'].flatMap((itemId,j)=>[1,2].map((fiscalQuarter,i)=>({...derivationFact(`ytd-${j}-${i}`,itemId,j?(i?'9':'5'):(i?'50':'20')),periodStart:'2026-01-01',periodEnd:i?'2026-06-30':'2026-03-31',periodType:'YTD' as const,fiscalQuarter:fiscalQuarter as 1|2})));
 const crosswalk={...f.crosswalk,version:'test-ytd',routes:[{sector:'TECHNOLOGY' as const,metric:'FCF' as const,operands:[{role:'CFO',itemId:'CFO',operation:'QUARTER_FROM_YTD' as const},{role:'issuer_capex',itemId:'CAPEX',operation:'QUARTER_FROM_YTD' as const}]}]};
 const request={...f.request,operands:[0,1].map(j=>({id:`quarter-${j}`,operation:'QUARTER_FROM_YTD' as const,observationIds:observations.slice(j*2,j*2+2).map(o=>o.id),adjustment:null}))};
 const patch={crosswalk,crosswalkHash:normalizationHash(crosswalk),request,observations};expect(run(patch).value).toBe('26');expect(run(patch).operands.map(o=>o.value)).toEqual(['30','4']);
 expect(run({...patch,observations:observations.map((o,i)=>i===0?{...o,mappingVersion:'different-map'}:o)}).value).toBeNull();
 expect(run({...patch,request:{...request,operands:[{...request.operands[0],observationIds:[...request.operands[0].observationIds].reverse()},request.operands[1]]}}).value).toBeNull();
});
it('reviewed action factor retains per-share units and cannot masquerade as monetary FCF',()=>{
 const f=derivationFixture(),base=f.registry.manifest.items.find(i=>i.itemId==='CFO')!;
 const registry=loadCanonicalRegistry({...f.registry.manifest,items:[...f.registry.manifest.items,{...base,itemId:'TEST_EPS',name:'Synthetic EPS',meaning:'SYNTHETIC PER-SHARE TEST ONLY',measurementSemantic:'PER_SHARE',allowedUnits:['CURRENCY_PER_SHARE'],evidenceTopicMappings:[],operandMappings:[]}]});
 const first={...derivationFact('cfo'),registryHash:registry.registryHash,itemId:'TEST_EPS',measurementSemantic:'PER_SHARE' as const,raw:{...f.observations[0].raw,unit:'CURRENCY_PER_SHARE',multiplier:'1'},normalized:{value:'100',unit:'CURRENCY_PER_SHARE' as const,currency:'VND'}};
 const observations=[first,{...f.observations[1],registryHash:registry.registryHash}];
 const crosswalk={...f.crosswalk,registryHash:registry.registryHash,routes:[{sector:'TECHNOLOGY' as const,metric:'FCF' as const,operands:[{role:'CFO',itemId:'TEST_EPS',operation:'ACTION_ADJUSTED' as const},{role:'issuer_capex',itemId:'CAPEX',operation:'REPORTED' as const}]}]};
 const request={...f.request,operands:[{...f.request.operands[0],operation:'ACTION_ADJUSTED' as const,adjustment:{id:'test-split',reviewerReference:'fixture-reviewer',reviewedAt:f.recordedAt,evidenceReference:'fixture-reviewed-split',rationale:'Reviewed two-for-one split, factor one half',amount:'0.5',confidence:'LOW' as const}},f.request.operands[1]]};
 const result=run({registry,crosswalk,crosswalkHash:normalizationHash(crosswalk),request,observations});
 expect(result.operands[0]).toMatchObject({value:'50',unit:'CURRENCY_PER_SHARE',confidence:'LOW'});expect(result.value).toBeNull();expect(result.availability.availableAt).toBeNull();
});
it('rejects altered release hashes, future release/review clocks and missing/duplicate pinned inputs',()=>{
 const f=derivationFixture();expect(()=>run({crosswalkHash:'0'.repeat(64)})).toThrow();
 const future={...f.crosswalk,recordedAt:'2030-01-01T00:00:00.000Z'};
 expect(()=>run({crosswalk:future,crosswalkHash:normalizationHash(future)})).toThrow();
 expect(()=>run({observations:[f.observations[0],f.observations[0]]})).toThrow();
 expect(()=>run({observations:[f.observations[0]]})).toThrow();
 const wrong={...f.crosswalk,routes:f.crosswalk.routes.map(r=>({...r,operands:[...r.operands].reverse()}))};
 expect(()=>run({crosswalk:wrong,crosswalkHash:normalizationHash(wrong)})).toThrow();
 expect(()=>run({observations:[derivationFact('cfo','CFO','9'.repeat(30)),derivationFact('capex','CAPEX','0')],request:{...f.request,periodEnd:'2026-06-29'}})).not.toThrow();
});
it('future human review cannot bypass chronology through an unresolved route',()=>{
 const f=derivationFixture();
 const request={...f.request,metric:'ROE' as const,operands:[{...f.request.operands[0],operation:'HUMAN_NORMALIZED' as const,adjustment:{id:'future-review',reviewerReference:'fixture-reviewer',reviewedAt:'2030-01-01T00:00:00.000Z',evidenceReference:'fixture',rationale:'Future review must be rejected',amount:'0',confidence:'HIGH' as const}},f.request.operands[1]]};
 expect(()=>run({request})).toThrow();
});
