import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import {qualifyBankLoanReceipt,qualifyBankCapitalIdentity,bankGapIsMajor,type BankLoanReceipt} from '@/domain/fundamentals/bank-qualification';
const tickers='ACB BID CTG HDB LPB MBB SHB SSB STB TCB VIB VPB'.split(' ');
const load=(t:string,n:string)=>JSON.parse(readFileSync(`docs/fundamental-data-engine/evidence/2026-10-16-ticker-closure-${t}/${t}_${n}.json`,'utf8'));
const receipt=():BankLoanReceipt=>{const p=load('ACB','ACCOUNTING_QUALIFICATION').periods[4];return {...p,sourceHash:p.source.SHA256};};
describe('bank accounting qualification receipts',()=>{
 it.each(tickers)('%s reconciles original customer-loan populations in all five periods',t=>{
  const a=load(t,'ACCOUNTING_QUALIFICATION');
  for(const p of a.periods){
   const r=qualifyBankLoanReceipt({...p,sourceHash:p.source.SHA256});
   expect(r.npl.status).toBe('AVAILABLE');expect(r.llr.status).toBe('AVAILABLE');
   expect(r.groups.map(g=>g.concept)).toEqual(['GROUP_3','GROUP_4','GROUP_5']);
   expect(BigInt(r.approvedAllowance.value!)+BigInt(r.separatelyExcluded)).toBe(BigInt(r.balanceSheetAllowance));
  }
 });
 it('separate margin allowance cannot inflate LLR numerator',()=>{
  const r=qualifyBankLoanReceipt(receipt());
  expect(r.approvedAllowance.value).toBe('7947868000000');
  expect(r.balanceSheetAllowance).toBe('8065344000000');
  expect(r.separatelyExcluded).toBe('117476000000');
 });
 it('deferred L/C provision is excluded through exact HDB bridge',()=>{
  const p=load('HDB','ACCOUNTING_QUALIFICATION').periods[2],r=qualifyBankLoanReceipt({...p,sourceHash:p.source.SHA256});
  expect(r.approvedAllowance.value).toBe('5794763000000');expect(r.separatelyExcluded).toBe('83841000000');
 });
 it('an unexplained allowance difference fails closed',()=>{
  const r=receipt();expect(()=>qualifyBankLoanReceipt({...r,allowance:{...r.allowance,balanceSheetAllowanceMillion:'8065345'}})).toThrow('BRIDGE');
 });
 it.each(['OTHER','INTERBANK','SECURITIES'])('%s allowance population cannot satisfy a loan receipt',population=>{
  const r=receipt();expect(()=>qualifyBankLoanReceipt({...r,allowance:{...r.allowance,population}})).toThrow('DIMENSIONS');
 });
 it('missing page, unit or source identity rejects qualification',()=>{
  const r=receipt();expect(()=>qualifyBankLoanReceipt({...r,loanQuality:{...r.loanQuality,page:0}})).toThrow();
  expect(()=>qualifyBankLoanReceipt({...r,sourceHash:'unknown'})).toThrow();
  expect(()=>qualifyBankLoanReceipt({...r,unitBasis:'BILLION_CURRENCY' as 'MILLION_CURRENCY'})).toThrow();
 });
 it('Tier 1 cannot be relabelled CET1 even under a supported framework',()=>expect(()=>qualifyBankCapitalIdentity({metric:'CET1',identity:'TIER_1',value:'0.1',method:'REPORTED',framework:'TT41_2016_BASEL_II',scope:'CONSOLIDATED',end:'2025-12-31',sourceHash:'a'.repeat(64),locator:'synthetic'})).toThrow('IDENTITY'));
 it.each(['EXTRACTION_NOT_YET_PERFORMED','SOURCE_NOT_YET_ACQUIRED','DEFINITION_NOT_YET_QUALIFIED','ANALYTICAL_ONLY_GAP'] as const)('%s is not automatically a Major forensic blocker',c=>expect(bankGapIsMajor(c,true)).toBe(false));
 it('material real conflicts and bounded source failures remain Major',()=>{
  expect(bankGapIsMajor('TRUE_DATA_INTEGRITY_CONFLICT',true)).toBe(true);
  expect(bankGapIsMajor('SOURCE_UNAVAILABLE_AFTER_REASONABLE_SEARCH',true)).toBe(true);
  expect(bankGapIsMajor('TRUE_DATA_INTEGRITY_CONFLICT',false)).toBe(false);
 });
 it('LPB standalone applicability is proven without a scope exemption',()=>expect(load('LPB','SCOPE_APPLICABILITY')).toMatchObject({applicableScope:'STANDALONE',substitution:false,exemption:false}));
 it('VIB headline conflict cannot be hidden by complete core accounting',()=>{
  const final=load('VIB','FINAL_SUFFICIENCY');expect(final.coverage.CORE.missing).toBe(0);expect(final.levelOneReady).toBe(false);expect(final.major).toBe(2);
  expect(load('VIB','NPL_RECONCILIATION').headlineConflict).toHaveLength(1);
 });
 it.each(['BID','CTG','SHB','VIB','VPB'])('%s retains original and revised observations with lineage',t=>{
  const r=load(t,'RESTATEMENT_REVIEW'),input=load(t,'RETAINED_ADMISSION_INPUT');
  expect(r.silentOverwrite).toBe(false);expect(r.revisedObservations.length).toBeGreaterThan(0);
  for(const revised of r.revisedObservations){expect(revised.revisionStatus).toBe('RESTATED');expect(revised.revisionEvidence).toBeTruthy();expect(input.verifications.some((v:{id:string})=>v.id===revised.supersedesFactId)).toBe(true);}
 });
});
