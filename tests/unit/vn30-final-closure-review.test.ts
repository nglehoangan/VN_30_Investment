import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {buildHybridAdmission,type HybridInput} from '@/domain/fundamentals/hybrid-admission';
import {financialHash} from '@/infrastructure/fundamentals/hybrid-input';
import {financialTargets,evaluateHybridTarget} from '@/domain/fundamentals/hybrid-sufficiency';
const root='docs/fundamental-data-engine/evidence/';
const load=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const aggregate=load(root+'2026-10-16-vn30-data-initialization-final-closure/AGGREGATE_COVERAGE.json');
it('accounts for exactly the effective dated research universe without promoting membership approval',()=>{
 const membership=load(root+'2026-10-10-di123-membership.json');
 const expected=membership.members.filter((m:{effectiveFrom:string;effectiveTo:string|null})=>m.effectiveFrom<='2026-10-16'&&(!m.effectiveTo||m.effectiveTo>'2026-10-16')).map((m:{ticker:string})=>m.ticker).sort();
 const actual=aggregate.tickers.map((r:{ticker:string})=>r.ticker).sort();
 expect(new Set(actual).size).toBe(30);expect(actual).toEqual(expected);
 expect(load(root+'2026-10-16-vn30-data-initialization-final-closure/VN30_UNIVERSE_RECONCILIATION.json').authority).toContain('NOT CERTIFIED');
});
it('reconstructs every material denominator and admission without scoring or losing blocked members',()=>{
 for(const row of aggregate.tickers){
  const input=load(row.inputPath) as HybridInput,snapshot=buildHybridAdmission(input,financialHash);
  expect(snapshot).toEqual(load(row.canonicalPath));expect(snapshot.readyForScoring).toBe(false);
  const periods=financialTargets(input).map(t=>evaluateHybridTarget(t,row.sector,snapshot,input));
  for(const tier of ['CORE','SECTOR_CORE','SUPPORTING'] as const){expect(row.coverage[tier].required).toBe(periods.reduce((n,p)=>n+p[tier].required,0));expect(row.coverage[tier].admitted).toBe(periods.reduce((n,p)=>n+p[tier].available,0));}
  if(row.coverage.CORE.missing||row.coverage.SECTOR_CORE.missing)expect(row.state).not.toBe('CLOSED');
 }
});
it('does not treat rejected provider observations as admitted canonical accounting facts',()=>{
 for(const row of aggregate.tickers){const input=load(row.inputPath) as HybridInput;const empty=buildHybridAdmission({...input,candidates:[],verifications:[],reportedDebtReceipts:[]},financialHash);expect(empty.canonicalFacts).toHaveLength(0);expect(empty.readyForScoring).toBe(false);}
});
