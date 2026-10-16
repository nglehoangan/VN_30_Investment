import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import {bankNpl,bankRatio,reportedBankCapital,bankLevelOneReadiness,type BankQuantity} from '@/domain/fundamentals/bank-contract';
import {buildHybridAdmission,type HybridInput} from '@/domain/fundamentals/hybrid-admission';
import {financialHash} from '@/infrastructure/fundamentals/hybrid-input';
import {financialTargets,evaluateHybridTarget} from '@/domain/fundamentals/hybrid-sufficiency';
import {DEBT_CONTRACT,debtRequirementsAt} from '@/domain/fundamentals/debt-contract';
const tickers='ACB BID CTG HDB LPB MBB SHB SSB STB TCB VIB VPB'.split(' ');
const root='docs/fundamental-data-engine/evidence/';
const load=(ticker:string,suffix:string)=>JSON.parse(readFileSync(`${root}2026-10-16-ticker-closure-${ticker}/${suffix}.json`,'utf8'));
const quantity=(concept:string,value='10',population:BankQuantity['population']='CUSTOMER_LOANS'):BankQuantity=>({id:concept,ticker:'ACB',end:'2025-12-31',scope:'CONSOLIDATED',population,concept,value,sourceHash:'a'.repeat(64),locator:'synthetic-test-fixture:page:1'});
const groups=()=>[3,4,5].map(n=>quantity('GROUP_'+n));
const gross=()=>quantity('GROSS_CUSTOMER_LOANS','100');
describe('bank group mandatory accounting boundaries',()=>{
 it('Group 3+4+5 yields NPL and gross-customer-loan ratio',()=>expect(bankNpl(groups(),gross())).toMatchObject({value:'30',ratio:'0.3'}));
 it.each(['GROUP_2','INTERBANK_LOANS','CORPORATE_BONDS','OTHER_RECEIVABLES','VAMC_BONDS','WRITTEN_OFF_LOANS','RESTRUCTURED_UNCLASSIFIED'])('%s cannot enter on-balance customer NPL',concept=>expect(bankNpl([quantity(concept),...groups().slice(1)],gross()).value).toBeNull());
 it.each(['NET_CUSTOMER_LOANS','INTERBANK_LOANS','TOTAL_CREDIT_EXPOSURE','GROSS_LOANS_LESS_ALLOWANCE_TWICE','CORPORATE_BONDS'])('%s cannot replace gross customer loans',concept=>expect(bankNpl(groups(),{...gross(),concept}).value).toBeNull());
 it('VCB quantities cannot satisfy ACB denominator',()=>expect(bankNpl(groups().map(q=>({...q,ticker:'VCB'})),gross()).value).toBeNull());
 it('standalone and consolidated loan facts cannot mix',()=>expect(bankNpl(groups().map((q,i)=>i? q:{...q,scope:'STANDALONE'}),gross()).value).toBeNull());
 it.each(['SECURITIES_ALLOWANCE','INTERBANK_ALLOWANCE','TOTAL_CREDIT_RISK_PROVISIONS','SPECIFIC_CUSTOMER_LOAN_ALLOWANCE'])('%s cannot automatically enter customer LLR',concept=>expect(bankRatio('LLR',quantity(concept),quantity('NPL_CUSTOMER_LOANS')).value).toBeNull());
 it('LLR requires explicit general-plus-specific loan population',()=>expect(bankRatio('LLR',quantity('CUSTOMER_LOAN_ALLOWANCE_GENERAL_PLUS_SPECIFIC'),quantity('NPL_CUSTOMER_LOANS','20'))).toMatchObject({value:'0.5'}));
 it('CAR cannot be derived from accounting equity/assets',()=>expect(reportedBankCapital({metric:'CAR',value:'0.1',method:'DERIVED',framework:'TT41_2016_BASEL_II',scope:'CONSOLIDATED',end:'2025-12-31',sourceHash:'a'.repeat(64),locator:'test'}).value).toBeNull());
 it('ambiguous demand deposits cannot manufacture CASA',()=>expect(bankRatio('CASA',quantity('CUSTOMER_DEMAND_DEPOSITS','10','CUSTOMER_DEPOSITS'),quantity('TOTAL_CUSTOMER_DEPOSITS','100','CUSTOMER_DEPOSITS')).value).toBeNull());
 it('interbank deposits cannot enter CASA denominator',()=>expect(bankRatio('CASA',quantity('CURRENT_AND_SAVINGS_DEPOSITS','10','CUSTOMER_DEPOSITS'),quantity('INTERBANK_DEPOSITS','100','OTHER')).value).toBeNull());
 it('NIM cannot use total assets or improvised average assets',()=>expect(bankRatio('NIM',quantity('NET_INTEREST_INCOME','10','EARNING_ASSETS'),quantity('AVERAGE_TOTAL_ASSETS','100','TOTAL_ASSETS')).value).toBeNull());
 it('interim NIM flows cannot be annualized',()=>expect(bankRatio('NIM',{...quantity('NET_INTEREST_INCOME','10','EARNING_ASSETS'),frame:'YTD'},{...quantity('AVERAGE_EARNING_ASSETS','100','EARNING_ASSETS'),frame:'YTD'}).value).toBeNull());
 it('nonfinancial Debt Contract v2 excludes banks and customer funding',()=>{expect(DEBT_CONTRACT.applicableSectors).not.toContain('BANK');expect(JSON.stringify(debtRequirementsAt('2026-10-16T02:00:00.000Z').sectors.BANK)).not.toContain('REPORTED_BORROWINGS');});
 it('historical PIT NOT_READY does not block otherwise qualified current Level 1',()=>expect(bankLevelOneReadiness({coreMissing:0,sectorCoreMissing:0,materialConflicts:0,criticalIssues:0,currentYtdMissing:false,historicalPit:'NOT_READY'})).toMatchObject({levelOneReady:true,readyForScoring:false,decisionReady:false}));
 it.each(tickers)('%s input, replay and verdict are independently isolated',ticker=>{
  const input=load(ticker,ticker+'_RETAINED_ADMISSION_INPUT') as HybridInput,snapshot=buildHybridAdmission(input,financialHash);
  expect(snapshot).toEqual(load(ticker,ticker+'_CANONICAL_FACTS'));
  expect(input.statements.every(d=>d.ticker===ticker&&d.retainedPath.startsWith(`data/manual-fundamentals/${ticker}/`))).toBe(true);
  expect(input.verifications.every(v=>v.ticker===ticker)).toBe(true);
  expect(input.candidates.every(v=>v.ticker===ticker&&['NAM','QUY'].includes(v.requestMode))).toBe(true);
  expect(input.certificationWitnesses).toEqual({candidates:[],verifications:[]});
  const rows=financialTargets(input).map(t=>evaluateHybridTarget(t,'BANK',snapshot,input));
  expect(rows.reduce((n,r)=>n+r.CORE.required,0)).toBe(15);expect(rows.reduce((n,r)=>n+r.SECTOR_CORE.required,0)).toBe(20);
  expect(financialTargets(input).find(t=>t.track==='CURRENT_TRAJECTORY')).toMatchObject({frame:'YTD',start:'2026-01-01',end:'2026-06-30'});
  const final=load(ticker,ticker+'_FINAL_SUFFICIENCY');expect(final).toMatchObject({levelOneReady:!['MBB','VIB'].includes(ticker),readyForScoring:false,decisionReady:false,finalHead:'PENDING_COMMIT'});expect(final.coverage.CORE.admitted).toBe(15);expect(final.verdict).toMatch(['MBB','VIB'].includes(ticker)?/^C\./:/^B\./);
 });
 it('cross-bank PDF evidence fails issuer binding even if a fact ticker is forged',()=>{
  const input=load('ACB','ACB_RETAINED_ADMISSION_INPUT') as HybridInput;
  const bid=load('BID','BID_RETAINED_ADMISSION_INPUT') as HybridInput;
  const fact={...bid.verifications.find(v=>v.itemId==='TOTAL_ASSETS')!,ticker:'ACB',id:'forged-cross-bank'};
  const result=buildHybridAdmission({...input,verifications:[fact],statements:bid.statements,candidates:[]},financialHash);
  expect(result.invalidVerificationIds).toContain('forged-cross-bank');expect(result.canonicalFacts).toHaveLength(0);
 });
 it('unverified provider zero cannot overwrite an issuer nonzero',()=>{
  const input=load('ACB','ACB_RETAINED_ADMISSION_INPUT') as HybridInput;
  const before=buildHybridAdmission(input,financialHash),v=before.canonicalFacts.find(f=>f.value!=='0')!;
  const changed=buildHybridAdmission({...input,candidates:input.candidates.map(c=>c.itemId===v.itemId?{...c,normalized:{...c.normalized,value:'0'}}:c)},financialHash);
  expect(changed.canonicalFacts.find(f=>f.id===v.id)?.value).toBe(v.value);
 });
 it('unknown provider fingerprint fails closed',()=>{
  const input=load('ACB','ACB_RETAINED_ADMISSION_INPUT') as HybridInput;
  const snapshot=buildHybridAdmission({...input,verifications:[],candidates:input.candidates.map(c=>({...c,contractMetadata:c.contractMetadata?{...c.contractMetadata,schemaFingerprint:'UNKNOWN_SCHEMA'}:undefined}))},financialHash);
  expect(snapshot.canonicalFacts).toHaveLength(0);
 });
 it('current quarter cannot replace required YTD income',()=>{
  const original=load('ACB','ACB_RETAINED_ADMISSION_INPUT') as HybridInput;
  const input={...original,verifications:original.verifications.map(v=>v.itemId==='NET_INCOME'&&v.period.end==='2026-06-30'?{...v,reportPeriodType:'QUARTER' as const,period:{start:'2026-04-01',end:'2026-06-30'}}:v)},snapshot=buildHybridAdmission(input,financialHash);
  const target=financialTargets(input).find(t=>t.track==='CURRENT_TRAJECTORY')!;
  expect(evaluateHybridTarget(target,'BANK',snapshot,input).missingRequirements.some(m=>m.id==='earnings')).toBe(true);
 });
 it('VNM and TCX remain DEFERRED BLOCKED',()=>{
  for(const [ticker,date] of [['VNM','2026-10-15'],['TCX','2026-10-16']]){
   const final=JSON.parse(readFileSync(`${root}${date}-ticker-closure-${ticker}/${ticker}_FINAL_SUFFICIENCY.json`,'utf8'));expect(final.levelOneReady).toBe(false);
  }
 });
});
