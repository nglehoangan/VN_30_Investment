// @vitest-environment node
import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {decimal} from '@/domain/portfolio/values';
import {discountedFlows,evaluateAIReview} from '@/domain/scoring/review-analysis';
const root='docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-30/b6-underwriting-r4';
const read=n=>JSON.parse(readFileSync(root+'/'+n,'utf8')),sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
it('joins reported annual CFO and acquisitions by exact period/scope, preserving negative cash and the mixed VRE row',()=>{
 const rows=read('annual-cash-bridges.json').rows;expect(rows).toHaveLength(59);
 expect(rows.filter(r=>r.reportedPostAcquisitionCash!==null)).toHaveLength(58);
 for(const r of rows){expect(r.normalizedOwnerFcfe).toBe(false);if(r.cashAcquisitionSpending!==null)expect(decimal(r.cfo).sub(decimal(r.cashAcquisitionSpending)).toString()).toBe(r.reportedPostAcquisitionCash);for(const c of r.sourceContexts)expect(sha(c.sourcePath)).toBe(c.sourceHash);}
 const vre=rows.find(r=>r.ticker==='VRE'&&r.year===2023);expect(vre.cashAcquisitionSpending).toBeNull();expect(vre.reportedPostAcquisitionCash).toBeNull();
 expect(rows.some(r=>r.reportedPostAcquisitionCash!==null&&decimal(r.reportedPostAcquisitionCash).negative)).toBe(true);
 expect(rows.filter(r=>r.ticker==='VPL').map(r=>r.year)).toEqual([2023,2024,2025]);
});
it('binds VNM column years explicitly instead of trusting numeric object-key enumeration or OCR reading order',()=>{
 const x=read('vnm-parent-owner-cash-input.json'),y=x.valuesByYear['2025'],p=x.valuesByYear['2024'];
 expect(sha(x.source.pdfPath)).toBe(x.source.sha256);expect(y.subsidiaryAndAssociateCashInvestment).toBe('421094220000');expect(p.subsidiaryAndAssociateCashInvestment).toBeNull();
 expect(y.cashInterestAndDividendsReceived).toBe('1571241822856');expect(p.cashInterestAndDividendsReceived).toBe('1740624672263');
 const model=read('VNM-conditional-owner-valuation.json');
 for(const year of ['2025','2024'])expect(x.valuesByYear[year].signedWorkingCapitalFlows.reduce((s,v)=>s.add(decimal(v)),decimal('0')).toString()).toBe(model.workingCapital.signedFlowsByYear[year]);
 const a=read('vnm-specific-adjustment-input.json');expect(a.developmentFundReclassificationIsIncome).toBe(false);expect(a.supplierSupportByYear).toEqual({'2025':'87000000000','2024':'88000000000'});
 for(const s of model.scenarios){expect(s.pretaxDisposalGainRemoved).toBe('6136383841');expect(s.valuation.acceptedFairValuePerShare).toBeNull();for(const y of s.forecast.years){expect(decimal(y.totalReinvestment).units>=decimal(y.growthFundingRequired).units).toBe(true);expect(decimal(y.totalReinvestment).units>=decimal(y.standingReinvestmentReserve).units).toBe(true);}}
});
it('keeps matched ACB customer-loan provision distinct from aggregate credit expense and avoids double bonus capital',()=>{
 const x=read('ACB-conditional-residual-income.json'),loan=x.loanNormalization,c=read('acb-current-common-book.json');
 expect(loan.currentNonLoanResidual).toBe('-694000000');expect(loan.weightedRate).toBe('0.004167459006');
 expect(x.earningsAdjustment.modelCommonEarnings).toBe('16080211562161.12736');expect(c.bonusCapitalMustNotBeAddedToTotalEquityAgain).toBe(true);
 expect(decimal(c.priorCommonShares).add(decimal(c.bonusSharesIssued)).toString()).toBe(c.commonSharesOutstanding);
 expect(x.commonEquityH126).toBe('99314518000000');
 for(const s of x.scenarios){const cf=s.model.years.map((y,i)=>i===s.model.years.length-1?decimal(y.dividends).add(decimal(s.terminalPriceBeforePerShare)).toString():y.dividends);const pv=decimal(discountedFlows(cf,s.assumptions.cost).value);expect(Math.abs(Number(pv.sub(decimal(s.model.equityValue)).div(decimal(x.referenceShares)).toString()))).toBeLessThan(0.001);expect(s.acceptedFairValuePerShare).toBeNull();}
});
it('removes SSB gain rather than sale proceeds, distinguishes fund policies and preserves unknown conversion dilution',()=>{
 const s=read('SSB-identified-normalization.json');expect(s.scenarios.map(s=>s.modelCommonEarnings)).toEqual(['3258398600000','3320974062000']);
 const input=read('ssb-disposal-adjustment-input.json');expect(input.disposal.cashProceedsAreGain).toBe(false);expect(input.tax.transactionSpecificTaxSeparatelyDisclosed).toBe(false);
 const later=read('ssb-later-fund-and-capital.json');expect(later.allocationYearExplicitInParagraph).toBe(false);expect(later.doNotSilentlyRestateFullYear2025).toBe(true);expect(later.contingentDilution).toContain('not yet determined');
});
it('keeps every captured profile and discovery hash plus the provisional-rights warning',()=>{
 const ref=read('profile-capture-reference.json');expect(sha(ref.path)).toBe(ref.sha256);const m=JSON.parse(readFileSync(ref.path,'utf8'));expect(m.rows).toHaveLength(30);
 for(const r of m.rows){expect(r.status).toBe('CAPTURED');expect(sha(r.rawPath)).toBe(r.sha256);expect(sha(r.discovery.rawPath)).toBe(r.discovery.sha256);expect(r.fields.find(f=>f.label==='Khối lượng lưu hành').notes.join(' ')).toContain('tạm tính');}
 const r=read('issuers/HDB.json');expect(r.currentSharesReference.listedDiffersFromProviderOutstanding).toBe(true);expect(r.currentSharesReference.denominatorAccepted).toBe(false);
});
it('records two source-supported AI uncertainty judgments without converting incomplete coverage into a total',()=>{
 const index=read('review-index.json');expect(index.rows).toHaveLength(30);expect(index.scoredRubrics).toBe(2);expect(index.acceptedTotalScores).toBe(0);expect(index.ownerDataRequests).toEqual([]);
 for(const row of index.rows){const r=read('issuers/'+row.ticker+'.json');expect(evaluateAIReview(r.scoreInput)).toEqual(r.scoreReview);expect(r.scoreReview.totalScore).toBeNull();expect(r.scoreReview.independentHumanReviewClaimed).toBe(false);expect(r.productionScoringAuthorized).toBe(false);}
 for(const ticker of ['ACB','VNM']){const r=read('issuers/'+ticker+'.json');expect(r.scoreReview.coveredMaximum).toBe(2);expect(r.scoreReview.rows.find(r=>r.id==='RG-UNC').points).toBe(0);const bad=structuredClone(r.scoreInput);bad.evidence.find(e=>e.family==='issuer-specific-forecast-range').checked=false;expect(()=>evaluateAIReview(bad)).toThrow();}
});
