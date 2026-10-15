import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {describe,it,expect} from 'vitest';
import {buildHybridAdmission,type HybridInput,type DebtPopulationVerification} from '@/domain/fundamentals/hybrid-admission';
import {financialHash} from '@/infrastructure/fundamentals/hybrid-input';
import {financialTargets,hybridCoverage} from '@/domain/fundamentals/hybrid-sufficiency';
const base=resolve('docs/fundamental-data-engine/evidence/2026-10-14-ticker-closure-HPG');
const input=JSON.parse(readFileSync(resolve(base,'HPG_RETAINED_ADMISSION_INPUT.json'),'utf8')) as HybridInput;
const expected=JSON.parse(readFileSync(resolve(base,'HPG_CANONICAL_FACTS.json'),'utf8'));
const ends=['2022-12-31','2023-12-31','2024-12-31','2025-12-31','2026-06-30'];
describe('HPG principal-only comprehensive debt fail-closed regression on actual retained inputs',()=>{
 it('does not mistake five reconciled borrowing subtotals for complete financing populations',()=>{
  const s=buildHybridAdmission(input,financialHash);expect(s).toEqual(expected);
  const cov=hybridCoverage(financialTargets(input),s,input);
  expect(cov.groups.filter(g=>g.evidenceClass==='CORE')).toHaveLength(35);
  for(const end of ends){expect(s.canonicalFacts.some(f=>f.itemId==='FINANCIAL_DEBT'&&f.period.end===end)).toBe(false);expect(s.canonicalFacts.some(f=>f.itemId==='SHORT_TERM_FINANCIAL_BORROWINGS'&&f.period.end===end)).toBe(true);expect(s.canonicalFacts.some(f=>f.itemId==='LONG_TERM_FINANCIAL_BORROWINGS'&&f.period.end===end)).toBe(true);}
 });
 it('unproven population cannot be authorized by arbitrary strings attached to all real borrowing facts',()=>{
  const altered={...input,verifications:input.verifications.map(v=>({...v,debtPopulationEvidence:'balance sheet reconciles; assume remaining financing absent'}))};
  expect(buildHybridAdmission(altered,financialHash).canonicalFacts.some(f=>f.itemId==='FINANCIAL_DEBT')).toBe(false);
 });
 it('hashed UNKNOWN population still vetoes comprehensive debt for each actual period',()=>{
  const binding=input.sourceBindings[0];
  const populations:DebtPopulationVerification[]=ends.map(end=>{const v=input.verifications.find(v=>v.itemId==='SHORT_TERM_FINANCIAL_BORROWINGS'&&v.period.end===end)!;const body:Omit<DebtPopulationVerification,'bodyHash'>={id:'unknown:'+end,ticker:'HPG',periodEnd:end,scope:'CONSOLIDATED',unit:'CURRENCY',currency:'VND',includedMetrics:['SHORT_TERM_FINANCIAL_BORROWINGS','LONG_TERM_FINANCIAL_BORROWINGS'],completeness:'UNKNOWN',qualified:true,reviewedAt:input.systemKnownAt,evidenceReference:binding.path,evidenceHash:binding.sha256,sourceHashes:[v.sourceHash]};return {...body,bodyHash:financialHash(body)};});
  expect(buildHybridAdmission({...input,debtPopulationVerifications:populations},financialHash).canonicalFacts.some(f=>f.itemId==='FINANCIAL_DEBT')).toBe(false);
 });
 it('does not turn mismatched period or scope into complete debt evidence',()=>{
  const v=input.verifications.find(v=>v.itemId==='SHORT_TERM_FINANCIAL_BORROWINGS'&&v.period.end==='2026-06-30')!,binding=input.sourceBindings[0];
  for(const dimensions of [{periodEnd:'2026-06-29',scope:'CONSOLIDATED' as const},{periodEnd:'2026-06-30',scope:'STANDALONE' as const}]){const body:Omit<DebtPopulationVerification,'bodyHash'>={id:'wrong-dimension',ticker:'HPG',...dimensions,unit:'CURRENCY',currency:'VND',includedMetrics:['SHORT_TERM_FINANCIAL_BORROWINGS','LONG_TERM_FINANCIAL_BORROWINGS'],completeness:'COMPLETE',qualified:true,reviewedAt:input.systemKnownAt,evidenceReference:binding.path,evidenceHash:binding.sha256,sourceHashes:[v.sourceHash]};expect(buildHybridAdmission({...input,debtPopulationVerifications:[{...body,bodyHash:financialHash(body)}]},financialHash).canonicalFacts.some(f=>f.itemId==='FINANCIAL_DEBT')).toBe(false);}
 });
 it.each([['CFO','6608320655215'],['CASH_CAPEX_REPORTED','35495026797327']])('preserves issuer fallback and raw-zero veto for FY2024 %s',(metric,value)=>{
  const s=buildHybridAdmission(input,financialHash),fact=s.canonicalFacts.find(f=>f.itemId===metric&&f.period.end==='2024-12-31');expect(fact).toMatchObject({value,classification:'PDF_VERIFIED'});
  const zeros=input.candidates.filter(c=>c.itemId===metric&&c.periodEnd==='2024-12-31'&&c.normalized.value==='0');expect(zeros.length).toBeGreaterThan(0);expect(s.canonicalFacts.filter(f=>f.classification==='DIRECT_STRUCTURED').every(f=>f.candidateIds.every(id=>!zeros.some(c=>c.id===id)))).toBe(true);
 });
 it('keeps current exact issuer window and reserved readiness gates separate from debt review',()=>{
  const s=buildHybridAdmission(input,financialHash);expect(s.readyForScoring).toBe(false);expect(s.DI14).toBe('AWAITING_INDEPENDENT_REVIEW');expect(s.DI15).toBe('AWAITING_PROJECT_OWNER_APPROVAL');expect(s.canonicalFacts.filter(f=>f.reportPeriodType==='YTD'&&f.period.start!==f.period.end).every(f=>f.period.start==='2026-01-01'&&f.period.end==='2026-06-30'&&f.authority==='REVIEWED_PDF')).toBe(true);
 });
});

describe('qualified correction from original reviewed 6M2026 statement',()=>{
 const dir=resolve('docs/fundamental-data-engine/evidence/2026-10-14-ticker-closure-HPG-debt');
 it('corrects the 433/343 transcription while preserving every other canonical fact',()=>{
  const correctedInput=JSON.parse(readFileSync(resolve(dir,'HPG_RETAINED_ADMISSION_INPUT_AFTER_DEBT.json'),'utf8')) as HybridInput,s=buildHybridAdmission(correctedInput,financialHash);
  const unchanged=(f:{itemId:string;period:{end:string}})=>f.itemId!=='SHORT_TERM_FINANCIAL_BORROWINGS'||f.period.end!=='2026-06-30';
  expect(s.canonicalFacts.filter(unchanged)).toEqual(expected.canonicalFacts.filter(unchanged));
  expect(s.canonicalFacts.find(f=>!unchanged(f))).toMatchObject({value:'71433383400905',classification:'PDF_VERIFIED',authority:'REVIEWED_PDF',sourceHash:'2601aa68f0dd3e55195bfa263452ab513efd56094459fa436748b93d6ebcfe8c',historicalPitEligible:false});
  expect(BigInt('61795211374175')+BigInt('9638172026730')).toBe(BigInt('71433383400905'));
  expect(s.canonicalFacts.some(f=>f.itemId==='FINANCIAL_DEBT')).toBe(false);
 });
 it('retires the wrong extraction through retained correction evidence without fabricating issuer restatement',()=>{
  const correction=JSON.parse(readFileSync(resolve(dir,'HPG_CANONICAL_CORRECTION.json'),'utf8')),correctedInput=JSON.parse(readFileSync(resolve(dir,'HPG_RETAINED_ADMISSION_INPUT_AFTER_DEBT.json'),'utf8')) as HybridInput;
  expect(correction.retiredVerification.value).toBe('71343383400905');expect(correction.verification.value).toBe('71433383400905');expect(correction.sourceCell.difference).toBe('90000000000');expect(correction.notIssuerRestatement).toBe(true);
  expect(correctedInput.verifications.some(v=>v.id===correction.retiredVerification.id)).toBe(false);expect(correctedInput.verifications.find(v=>v.id===correction.verification.id)).toMatchObject({publishedAt:null,historicalAvailability:'UNKNOWN',supersedesFactId:null,revisionEvidence:null});
  expect(correctedInput.sourceBindings.some(b=>b.path.endsWith('/HPG_CANONICAL_CORRECTION.json'))).toBe(true);
 });
});
