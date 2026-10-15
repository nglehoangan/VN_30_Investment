import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {qualifyConsumerAccountingRow,consumerAccountingCategory,qualifyConsumerFinancing,consumerLevelOneReady,type ConsumerAccountingRow} from '@/domain/fundamentals/consumer-retail-contract';
import {buildHybridAdmission,type HybridInput} from '@/domain/fundamentals/hybrid-admission';
import {financialHash} from '@/infrastructure/fundamentals/hybrid-input';
import {qualifiedNetDebt,evaluateDebtReceipt} from '@/domain/fundamentals/debt-contract';
const tickers=['MSN','MWG','VNM','SAB','MCH'];
const read=(t:string,s:string)=>JSON.parse(readFileSync(`docs/fundamental-data-engine/evidence/2026-10-15-ticker-closure-${t}/${s}.json`,'utf8'));
const row=(metric='REVENUE'):ConsumerAccountingRow=>({ticker:'MSN',metric,value:'100',sourceValue:'100',sourceCategory:consumerAccountingCategory(metric)!,scope:'CONSOLIDATED',currency:'VND',unit:'CURRENCY',frame:'YTD',start:'2026-01-01',end:'2026-06-30',sourceHash:'a'.repeat(64),locator:'Original consolidated income statement row10',sourceUnitMultiplier:'1',zeroVerified:false});
const qualify=(r:ConsumerAccountingRow,ticker='MSN',metric=r.metric)=>qualifyConsumerAccountingRow(ticker,metric,{start:'2026-01-01',end:'2026-06-30',frame:'YTD'},r);
it('1 MCH accounting evidence cannot enter MSN',()=>expect(qualify({...row(),ticker:'MCH'}).status).toBe('UNAVAILABLE'));
it('2 MSN accounting evidence cannot enter MCH',()=>expect(qualify(row(),'MCH').status).toBe('UNAVAILABLE'));
it.each([
 [3,'associate revenue','REVENUE','ASSOCIATE_REVENUE'],[4,'JV assets','TOTAL_ASSETS','JV_TOTAL_ASSETS'],
 [5,'retail operating sales','REVENUE','STORE_SALES'],[6,'GMV','REVENUE','GMV'],[7,'store count','TOTAL_ASSETS','STORE_COUNT'],
 [12,'customer advance as revenue','REVENUE','CUSTOMER_ADVANCE'],[15,'term deposit as cash','CASH_AND_EQUIVALENTS','TERM_DEPOSIT'],
 [16,'financial investment as cash','CASH_AND_EQUIVALENTS','FINANCIAL_INVESTMENT'],
 [22,'investing outflow as CapEx','CASH_CAPEX_REPORTED','INVESTING_CASH_OUTFLOW'],
 [23,'acquisition as CapEx','CASH_CAPEX_REPORTED','BUSINESS_ACQUISITION'],
 [24,'investment purchase as CapEx','CASH_CAPEX_REPORTED','FINANCIAL_INVESTMENT_PURCHASE'],
] as const)('%i rejects %s',(_n,_label,metric,category)=>expect(qualify({...row(metric),sourceCategory:category}).status).toBe('UNAVAILABLE'));
it('8 gross inventory cannot replace net inventory',()=>expect(qualify({...row('INVENTORY'),inventory:{gross:'110',provision:'-10'},value:'110',sourceValue:'110'}).status).toBe('UNAVAILABLE'));
it('9 inventory provision cannot disappear',()=>expect(qualify({...row('INVENTORY'),inventory:{gross:'110',provision:'0'}}).status).toBe('UNAVAILABLE'));
it.each([[10,'TRADE_PAYABLE'],[11,'SUPPLIER_PAYABLE'],[13,'CUSTOMER_ADVANCE'],[14,'RELATED_PARTY_PAYABLE']] as const)('%i commercial %s requires financing proof',(_n,category)=>expect(qualifyConsumerFinancing({category,explicitFinancing:false,amount:'100',measurementBasis:'ISSUER_REPORTED_CARRYING_AMOUNT',sourceHash:'a'.repeat(64),locator:'Payable note'}).status).toBe('UNAVAILABLE'));
it('17 generic cash cannot become unrestricted cash',()=>expect(qualify(row('UNRESTRICTED_ECONOMICALLY_AVAILABLE_CASH')).status).toBe('UNAVAILABLE'));
it('18 NET_DEBT stays unavailable without qualified cash',()=>{const i=read('MWG','MWG_RETAINED_ADMISSION_INPUT') as HybridInput,s=buildHybridAdmission(i,financialHash),d=s.canonicalFacts.find(f=>f.itemId==='REPORTED_BORROWINGS')!;expect(d).toBeTruthy();const cash=s.canonicalFacts.find(f=>f.itemId==='CASH_AND_EQUIVALENTS'&&f.period.end===d.period.end)!;expect(qualifiedNetDebt(d,cash).value).toBeNull();});
it('19 current borrowing portion is counted only once',()=>{const i=read('MWG','MWG_RETAINED_ADMISSION_INPUT') as HybridInput,s=buildHybridAdmission(i,financialHash),r=i.reportedDebtReceipts!.find(r=>r.periodEnd==='2024-12-31')!;expect(evaluateDebtReceipt(r,s.canonicalFacts,i,financialHash)).toBeTruthy();const altered={...r,longIncludesCurrentPortion:true};altered.bodyHash=financialHash(Object.fromEntries(Object.entries(altered).filter(([k])=>k!=='bodyHash')));expect(evaluateDebtReceipt(altered,s.canonicalFacts,i,financialHash)).toBeNull();});
it('20 a known financing bond omission invalidates debt receipt',()=>{const i=read('MWG','MWG_RETAINED_ADMISSION_INPUT') as HybridInput,s=buildHybridAdmission(i,financialHash),r=i.reportedDebtReceipts![0];const altered={...r,knownFinancingItems:[...r.knownFinancingItems,{id:'unreviewed-bond',amount:'10',applicable:true,verified:false,alreadyIncludedIn:null,kind:'BOND',inclusionEvidenceVerified:false,evidenceReference:'Missing bond population proof'}]};altered.bodyHash=financialHash(Object.fromEntries(Object.entries(altered).filter(([k])=>k!=='bodyHash')));expect(evaluateDebtReceipt(altered as typeof r,s.canonicalFacts,i,financialHash)).toBeNull();});
it('21 principal cannot silently replace carrying value',()=>expect(qualifyConsumerFinancing({category:'BOND',explicitFinancing:true,amount:'100',measurementBasis:'ISSUER_VERIFIED_PRINCIPAL',sourceHash:'a'.repeat(64),locator:'Face value'}).status).toBe('UNAVAILABLE'));
it('25 quarter cannot masquerade as YTD',()=>expect(qualify({...row(),frame:'QUARTER',start:'2026-04-01'}).status).toBe('UNAVAILABLE'));
it('26 unapproved interim annualization is rejected',()=>expect(qualify({...row(),value:'200'}).status).toBe('UNAVAILABLE'));
it('27 standalone evidence cannot enter consolidated facts',()=>expect(qualify({...row(),scope:'STANDALONE'}).status).toBe('UNAVAILABLE'));
it('28 restated observations have bound predecessor lineage',()=>{for(const t of tickers){const i=read(t,t+'_RETAINED_ADMISSION_INPUT') as HybridInput;for(const v of i.verifications.filter(v=>v.revisionStatus==='RESTATED')){expect(i.verifications.some(p=>p.id===v.supersedesFactId)).toBe(true);expect(i.sourceBindings.some(b=>b.path===v.revisionEvidence)).toBe(true);}}});
it('29 missing inventory cannot be neutral filled',()=>expect(qualify({...row('INVENTORY'),value:null,sourceValue:null}).status).toBe('UNAVAILABLE'));
it('30 qualified issuer nonzero defeats provider conflict',()=>{const i=read('MSN','MSN_RETAINED_ADMISSION_INPUT') as HybridInput,s=buildHybridAdmission(i,financialHash);const f=s.canonicalFacts.find(f=>f.itemId==='CFO'&&f.fiscalYear===2025)!;expect(f.value).toBe('1369570000000');const mutated={...i,candidates:i.candidates.map(c=>c.itemId==='CFO'&&c.fiscalYear===2025?{...c,normalized:{...c.normalized,value:'0'}}:c)};expect(buildHybridAdmission(mutated,financialHash).canonicalFacts.find(x=>x.itemId===f.itemId&&x.period.end===f.period.end)?.value).toBe(f.value);});
it('31 historical PIT does not block current Level 1',()=>expect(consumerLevelOneReady({coreMissing:0,sectorCoreMissing:0,materialIssues:0,currentYtdMissing:false,historicalPit:'NOT_READY'})).toBe(true));
it('32 offline inputs need no disposable extraction files',()=>{for(const t of tickers){const i=read(t,t+'_RETAINED_ADMISSION_INPUT') as HybridInput;expect(JSON.stringify(i)).not.toMatch(/retainedReaderProof|\.png"|manual-extracted/);expect(buildHybridAdmission(i,financialHash)).toEqual(read(t,t+'_CANONICAL_FACTS'));}});
it('33 all seven protected source and evidence hashes remain unchanged',()=>{for(const b of read('MSN','PROTECTED_BASELINE').bindings)expect(createHash('sha256').update(readFileSync(b.path)).digest('hex')).toBe(b.sha256);});
for(const t of tickers){
 it(t+' has isolated candidates, originals, verifications and canonical facts',()=>{const i=read(t,t+'_RETAINED_ADMISSION_INPUT') as HybridInput,s=buildHybridAdmission(i,financialHash);expect(i.universe).toHaveLength(1);expect(i.universe[0]).toEqual({ticker:t,sector:'RETAIL'});expect(i.certificationWitnesses).toEqual({candidates:[],verifications:[]});expect(i.verifications.every(v=>v.ticker===t)).toBe(true);expect(i.candidates.every(c=>c.ticker===t&&['NAM','QUY'].includes(c.requestMode))).toBe(true);expect(i.statements.every(d=>d.ticker===t&&d.reportingScope==='CONSOLIDATED')).toBe(true);expect(s.canonicalFacts.every(f=>f.ticker===t)).toBe(true);});
 it(t+' every new source row has exact accounting population, units and window',()=>{for(const r of read(t,t+'_ISSUER_VERIFICATION').rows)expect(qualifyConsumerAccountingRow(t,r.metric,{start:r.start,end:r.end,frame:r.frame},{...r,sourceCategory:consumerAccountingCategory(r.metric)}).status).toBe('AVAILABLE');});
}
