import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {qualifyRealEstateRow,realEstateRowCategory,realEstateFinancingComponent,realEstateLevelOneReadiness,type RealEstateRow} from '@/domain/fundamentals/real-estate-contract';
import {buildHybridAdmission,type HybridInput} from '@/domain/fundamentals/hybrid-admission';
import {financialHash} from '@/infrastructure/fundamentals/hybrid-input';
import {financialTargets,evaluateHybridTarget} from '@/domain/fundamentals/hybrid-sufficiency';
import {validateCafeFResponse} from '@/infrastructure/fundamentals/cafef';
const dir='docs/fundamental-data-engine/evidence/2026-10-16-ticker-closure-VIC/';
const read=(n:string)=>JSON.parse(readFileSync(dir+n+'.json','utf8'));
const input=read('VIC_RETAINED_ADMISSION_INPUT') as HybridInput;
const snapshot=buildHybridAdmission(input,financialHash);
const target={start:'2026-01-01',end:'2026-06-30',frame:'YTD' as const};
const row=(metric='REVENUE'):RealEstateRow=>({ticker:'VIC',metric,value:'100',sourceValue:'100',sourceCategory:realEstateRowCategory(metric)!,scope:'CONSOLIDATED',currency:'VND',unit:'CURRENCY',...target,sourceHash:'a'.repeat(64),locator:'Issuer consolidated statement exact row',sourceUnitMultiplier:'1',zeroVerified:false});
const qualify=(r:RealEstateRow)=>qualifyRealEstateRow('VIC',r.metric,target,r);
it.each(['VHM','VRE','VPL'])('%s observations cannot satisfy VIC',ticker=>expect(qualify({...row(),ticker}).status).toBe('UNAVAILABLE'));
it.each([
 ['REVENUE','SUM_SUBSIDIARY_REVENUE'],['SHORT_TERM_FINANCIAL_BORROWINGS','CONSOLIDATED_PLUS_SUBSIDIARY_DEBT'],
 ['NET_INCOME_ATTRIBUTABLE_PARENT','NCI_PROFIT'],['REVENUE','PRESALES'],['INVENTORY','INVESTMENT_PROPERTY'],['INVENTORY','CONSTRUCTION_IN_PROGRESS'],
 ['CASH_AND_EQUIVALENTS','FINANCIAL_INVESTMENTS'],['UNRESTRICTED_ECONOMICALLY_AVAILABLE_CASH','REPORTED_CASH_AND_EQUIVALENTS'],
 ['CASH_CAPEX_REPORTED','TOTAL_INVESTING_OUTFLOW'],['CASH_CAPEX_REPORTED','ACQUISITION_CONSIDERATION']
])('rejects %s from %s',(metric,sourceCategory)=>expect(qualify({...row(metric),sourceCategory}).status).toBe('UNAVAILABLE'));
it.each(['CUSTOMER_ADVANCE','RELATED_PARTY_PAYABLE','OFF_BALANCE_COMMITMENT','EQUITY_COMPONENT','CONVERSION_OPTION','EMBEDDED_DERIVATIVE','PREFERENCE_INSTRUMENT','REDEEMABLE_INSTRUMENT'])('%s is not automatically borrowings',category=>expect(realEstateFinancingComponent({category,explicitFinancing:false,amount:'100',measurementBasis:'ISSUER_REPORTED_CARRYING_AMOUNT',sourceHash:'a'.repeat(64),locator:'Issuer classification'}).status).toBe('UNAVAILABLE'));
it('explicit issuer financing classification may qualify carrying amount',()=>expect(realEstateFinancingComponent({category:'BOND',explicitFinancing:true,amount:'100',measurementBasis:'ISSUER_REPORTED_CARRYING_AMOUNT',sourceHash:'a'.repeat(64),locator:'Issuer debt note'})).toMatchObject({status:'AVAILABLE',value:'100'}));
it('quarter cannot masquerade as YTD',()=>expect(qualify({...row(),frame:'QUARTER',start:'2026-04-01'}).status).toBe('UNAVAILABLE'));
it('interim flow cannot be annualized',()=>expect(qualify({...row(),value:'200'}).status).toBe('UNAVAILABLE'));
it('original observations are retained exactly without disposable OCR dependency',()=>{const old=JSON.parse(readFileSync('docs/fundamental-data-engine/evidence/2026-10-14-structured-certification-closure/RETAINED_ADMISSION_INPUT.json','utf8')) as HybridInput;for(const v of old.verifications.filter(v=>v.ticker==='VIC'))expect(input.verifications.find(n=>n.id===v.id)).toEqual(Object.fromEntries(Object.entries(v).filter(([k])=>k!=='retainedReaderProof')));expect(read('VIC_RESTATEMENT_REVIEW').silentOverwrite).toBe(false);});
it('provider zero cannot overwrite qualified issuer nonzero',()=>{const f=snapshot.canonicalFacts.find(f=>f.value!=='0')!;expect(f).toBeTruthy();const changed={...input,candidates:input.candidates.map(c=>c.itemId===f.itemId&&c.periodEnd===f.period.end?{...c,normalized:{...c.normalized,value:'0'}}:c)};expect(buildHybridAdmission(changed,financialHash).canonicalFacts.find(n=>n.itemId===f.itemId&&n.period.end===f.period.end)?.value).toBe(f.value);});
it('missing cannot be neutral filled',()=>{expect(qualify({...row(),value:null,sourceValue:null}).status).toBe('UNAVAILABLE');const empty={...input,candidates:[],verifications:[],reportedDebtReceipts:[]},s=buildHybridAdmission(empty,financialHash);expect(evaluateHybridTarget(financialTargets(empty)[0],'REAL_ESTATE',s,empty).CORE.available).toBe(0);});
it('unknown CafeF schema drift fails closed',()=>{const c=input.candidates[0];expect(()=>validateCafeFResponse(JSON.stringify({unexpectedSchema:[{value:100}]}),c.endpoint as Parameters<typeof validateCafeFResponse>[1],'VIC','NAM')).toThrow();});
it('historical PIT NOT_READY alone does not block Level1',()=>expect(realEstateLevelOneReadiness({coreMissing:0,sectorCoreMissing:0,materialConflicts:0,criticalIssues:0,currentYtdMissing:false,historicalPit:'NOT_READY'}).levelOneReady).toBe(true));
it('all 25 approved tickers and deferred evidence remain protected',()=>{const p=read('PROTECTED_BASELINE');expect(p.approvedTickers).toHaveLength(25);for(const ticker of p.approvedTickers){const bindings=p.bindings.filter((b:{path:string})=>b.path.endsWith('/'+ticker+'_CANONICAL_FACTS.json')||b.path.endsWith('/'+ticker+'_FINAL_SUFFICIENCY.json'));expect(bindings.length).toBeGreaterThanOrEqual(2);for(const b of bindings)expect(createHash('sha256').update(readFileSync(b.path)).digest('hex')).toBe(b.sha256);}});
it.each(['VNM','TCX','MBB','VIB'])('%s remains DEFERRED BLOCKED',ticker=>{
 expect(read('PROTECTED_BASELINE').deferredBlocked).toContain(ticker);
 const paths:Record<string,string>={VNM:'2026-10-15-consumer-targeted-fix/VNM/FINAL_SUFFICIENCY.json',TCX:'2026-10-16-tcx-targeted-fix/TCX_TARGETED_FINAL_SUFFICIENCY.json',MBB:'2026-10-16-bank-targeted-fix/MBB_TARGETED_FINAL_SUFFICIENCY.json',VIB:'2026-10-16-bank-targeted-fix/VIB_TARGETED_FINAL_SUFFICIENCY.json'};
 const final=JSON.parse(readFileSync('docs/fundamental-data-engine/evidence/'+paths[ticker],'utf8'));expect(final.levelOneReady).toBe(false);expect(final.verdict??final.outcome).toContain('BLOCKED');
});
it('readyForScoring remains false',()=>{expect(snapshot.readyForScoring).toBe(false);expect(read('VIC_FINAL_SUFFICIENCY').readyForScoring).toBe(false);});
it('decisionReady remains false',()=>expect(read('VIC_FINAL_SUFFICIENCY').decisionReady).toBe(false));
it('blocked verdict retains exact denominators and current requirement',()=>{const f=read('VIC_FINAL_SUFFICIENCY');expect(f.levelOneReady).toBe(false);expect(f.coverage.CORE).toEqual({required:35,admitted:13,missing:22});expect(f.coverage.SECTOR_CORE).toEqual({required:5,admitted:3,missing:2});expect(f.coverage.SUPPORTING).toEqual({required:40,admitted:9,missing:31});expect(f.finalHead).toBe('PENDING_COMMIT');expect(financialTargets(input).find(t=>t.frame==='YTD')).toMatchObject(target);expect(f.materialGaps.length).toBeGreaterThan(0);});
it('replay has no foreign issuer witnesses or disposable dependencies',()=>{expect(input.certificationWitnesses).toEqual({candidates:[],verifications:[]});for(const rows of [input.candidates,input.verifications,input.statements,snapshot.canonicalFacts])expect(rows.every(r=>r.ticker==='VIC')).toBe(true);expect(JSON.stringify(input)).not.toMatch(/retainedReaderProof|manual-extracted|\.png"|\/private\/tmp\//);expect(input.candidates.every(c=>['NAM','QUY'].includes(c.requestMode))).toBe(true);expect(snapshot).toEqual(read('VIC_CANONICAL_FACTS'));});
