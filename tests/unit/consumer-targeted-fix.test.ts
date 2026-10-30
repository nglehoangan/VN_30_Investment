import {historicalReplay} from '../fixtures/historical-replay';
import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {buildHybridAdmission,type HybridInput} from '@/domain/fundamentals/hybrid-admission';
import {financialHash} from '@/infrastructure/fundamentals/hybrid-input';
import {evaluateDebtReceipt,qualifiedNetDebt} from '@/domain/fundamentals/debt-contract';
const root='docs/fundamental-data-engine/evidence/2026-10-15-consumer-targeted-fix';
const read=(t:string,name:string)=>JSON.parse(readFileSync(`${root}/${t}/${name}.json`,'utf8'));
const input=(t:string)=>read(t,'RETAINED_ADMISSION_INPUT') as HybridInput;
const rehash=<T extends object>(x:T)=>({...x,bodyHash:financialHash(Object.fromEntries(Object.entries(x).filter(([k])=>k!=='bodyHash')))});
for(const t of ['MSN','VNM','SAB']){
 it(t+' replay is deterministic and preserves original observations',()=>{const i=input(t);expect(buildHybridAdmission(i,financialHash)).toEqual(read(t,'CANONICAL_FACTS'));const old=JSON.parse(readFileSync(`docs/fundamental-data-engine/evidence/2026-10-15-ticker-closure-${t}/${t}_RETAINED_ADMISSION_INPUT.json`,'utf8')) as HybridInput;for(const v of old.verifications)expect(i.verifications.find(n=>n.id===v.id)).toEqual(v);});
}
it('MSN all five periods add only carrying amounts outside the borrowing captions',()=>{
 const i=input('MSN'),s=buildHybridAdmission(i,financialHash);
 const expected=['82200529000000','85883704000000','89765091000000','65599893000000','69139926000000'];
 expect(i.reportedDebtReceipts).toHaveLength(5);
 for(const [n,r] of i.reportedDebtReceipts!.entries()){
  expect(r.shortIncludesCurrentPortion).toBe(true);expect(r.longIncludesCurrentPortion).toBe(false);
  expect(evaluateDebtReceipt(r,s.canonicalFacts,i,financialHash)?.value).toBe(expected[n]);
  expect(r.metadata.uncertainty.unclassifiedLiabilityAmount).toBeNull();expect(r.metadata.comprehensivePopulationStatus).toBe('COMPREHENSIVE_UNVERIFIED');
 }
});
it('MSN current bank/bond/lease deductions equal the one embedded current portion',()=>{
 const review=read('MSN','TARGETED_REVIEW');
 for(const p of review.periods){const parts=p.components as {id:string;amount:string;alreadyIncludedIn:string}[];expect(parts.filter(c=>['current-bank','current-bonds','current-finance-lease'].includes(c.id)).reduce((s,c)=>s+BigInt(c.amount),0n).toString()).toBe(p.currentPortion);}
});
it('MSN unverified financing addition fails the unchanged debt contract',()=>{const i=input('MSN'),s=buildHybridAdmission(i,financialHash),r=i.reportedDebtReceipts![0];const changed=rehash({...r,knownFinancingItems:r.knownFinancingItems.map(a=>a.id==='investment-deposit-short'?{...a,verified:false}:a)});expect(evaluateDebtReceipt(changed,s.canonicalFacts,i,financialHash)).toBeNull();});
it('MSN unknown financing amount cannot enter the addition sum as a verified item',()=>{const i=input('MSN'),s=buildHybridAdmission(i,financialHash),r=i.reportedDebtReceipts![0];const changed=rehash({...r,knownFinancingItems:r.knownFinancingItems.map(a=>a.id==='investment-deposit-short'?{...a,amount:null}:a)});expect(evaluateDebtReceipt(changed,s.canonicalFacts,i,financialHash)).toBeNull();});
it('MSN opaque deferred procurement fees remain unknown rather than commercial or zero',()=>{const p=read('MSN','TARGETED_REVIEW').periods[0];expect(p.deferredAcquisitionReview.classification).toBe('UNKNOWN');expect(p.deferredAcquisitionReview.amount).toBe('478193000000');expect(p.additions.some((a:{amount:string})=>a.amount==='478193000000')).toBe(false);});
it('MSN reported debt cannot imply unrestricted net debt',()=>{const i=input('MSN'),s=buildHybridAdmission(i,financialHash),d=s.canonicalFacts.find(f=>f.itemId==='REPORTED_BORROWINGS')!;expect(qualifiedNetDebt(d,s.canonicalFacts.find(f=>f.itemId==='CASH_AND_EQUIVALENTS'&&f.period.end===d.period.end)).value).toBeNull();});
historicalReplay('ARCH-02','VNM original PDF is bound to exact retained bytes',()=>{const source=read('VNM','TARGETED_REVIEW').source;expect(createHash('sha256').update(readFileSync(source.retainedPath)).digest('hex')).toBe(source.SHA256);expect(source.auditStatus).toBe('REVIEWED');expect(source.scope).toBe('CONSOLIDATED');expect(source.accessControlBypass).toBe(false);});
it('VNM current flow uses six-month YTD, not standalone Q2 or parent-only income',()=>{const s=buildHybridAdmission(input('VNM'),financialHash);for(const [metric,value] of [['REVENUE','34996005336611'],['NET_INCOME','5642622644280'],['CFO','3473788102329']]){const f=s.canonicalFacts.find(f=>f.itemId===metric&&f.period.end==='2026-06-30'&&f.reportPeriodType==='YTD')!;expect(f.value).toBe(value);expect(f.period.start).toBe('2026-01-01');}expect(read('VNM','CURRENT_TRAJECTORY')[0].CURRENT_TRAJECTORY.missingCurrentYtd).toBe(false);});
it('VNM current inventory reconciles gross less provision',()=>{expect((7768442112731n-48161335687n).toString()).toBe('7720280777044');expect(read('VNM','CANONICAL_FACTS').canonicalFacts.find((f:{itemId:string;period:{end:string}})=>f.itemId==='INVENTORY'&&f.period.end==='2026-06-30').value).toBe('7720280777044');});
it('VNM later annual transfers never become closing current portions or admitted debt',()=>{const i=input('VNM'),s=buildHybridAdmission(i,financialHash),review=read('VNM','TARGETED_REVIEW');expect(i.reportedDebtReceipts!.map(r=>r.periodEnd)).toEqual(['2022-12-31','2023-12-31']);for(const p of review.periods.slice(2)){expect(p.currentPortion).toBeNull();expect(p.rejectedMovementAsEndBalance).toBeTruthy();expect(s.canonicalFacts.some(f=>f.itemId==='REPORTED_BORROWINGS'&&f.period.end===p.periodEnd)).toBe(false);}expect(read('VNM','FINAL_SUFFICIENCY').levelOneReady).toBe(false);});
it('VNM exact closing current portions from 2022/2023 are admitted only once',()=>{const i=input('VNM'),s=buildHybridAdmission(i,financialHash);expect(i.reportedDebtReceipts!.map(r=>r.currentPortion)).toEqual(['18865350000','159660768300']);for(const r of i.reportedDebtReceipts!)expect(evaluateDebtReceipt(r,s.canonicalFacts,i,financialHash)?.value).toBe((BigInt(r.shortValue)+BigInt(r.longValue)).toString());});
it('SAB reclassification is an exact operating/investing bridge with unchanged total cash',()=>{const r=read('SAB','TARGETED_REVIEW').revision;expect(r.classification).toBe('RECLASSIFIED');expect((BigInt(r.comparative.value)-BigInt(r.original.value)).toString()).toBe('164654149300');expect((BigInt(r.bridge.originalInvesting)-BigInt(r.bridge.comparativeInvesting)).toString()).toBe('164654149300');expect((BigInt(r.original.value)+BigInt(r.bridge.originalInvesting)+BigInt(r.bridge.financingUnchanged)).toString()).toBe(r.bridge.netCashMovementUnchanged);expect((BigInt(r.comparative.value)+BigInt(r.bridge.comparativeInvesting)+BigInt(r.bridge.financingUnchanged)).toString()).toBe(r.bridge.netCashMovementUnchanged);});
it('SAB every predecessor has explicit lineage and current analysis uses comparative',()=>{const i=input('SAB'),r=read('SAB','TARGETED_REVIEW').revision;for(const id of r.predecessorIds){const old=i.verifications.find(v=>v.id===id)!;expect(old.value).toBe('1940064108479');expect(i.verifications.filter(v=>v.supersedesFactId===id&&v.revisionEvidence===root+'/SAB/TARGETED_REVIEW.json')).toHaveLength(1);}expect(buildHybridAdmission(i,financialHash).canonicalFacts.find(f=>f.itemId==='CFO'&&f.period.end==='2023-12-31')!.value).toBe('2104718257779');});
it('SAB removing revision lineage restores the conflict rather than preferring the newer number',()=>{const i=input('SAB');const changed={...i,verifications:i.verifications.map(v=>v.id.startsWith('targeted:SAB:CFO')?{...v,revisionStatus:'ORIGINAL' as const,supersedesFactId:null,revisionEvidence:null}:v)};expect(buildHybridAdmission(changed,financialHash).unresolvedIssuerConflicts.some(k=>k.includes('SAB|CFO|'))).toBe(true);});
historicalReplay('ARCH-03','All protected evidence and approved contracts retain their original hashes',()=>{const protectedFiles=JSON.parse(readFileSync(root+'/PROTECTED_BASELINE.json','utf8'));for(const b of protectedFiles.bindings)expect(createHash('sha256').update(readFileSync(b.path)).digest('hex')).toBe(b.sha256);});
