// @vitest-environment node
import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {decimal} from '@/domain/portfolio/values';
import {normalizeCommonEarningsReading,evaluateAIReview} from '@/domain/scoring/review-analysis';
const root='docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-30/b6-economics-r3';
const read=p=>JSON.parse(readFileSync(p,'utf8')),sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const facts=read(root+'/checked-common-earnings.json').facts,index=read(root+'/economics-review-index.json');
it('covers30 source-reviewed annual common earnings notes, not totalNPAT or guessed zeros',()=>{
 expect(facts).toHaveLength(30);expect(new Set(facts.map(f=>f.ticker)).size).toBe(30);
 for(const f of facts){expect(sha(f.source.pdfPath)).toBe(f.source.sha256);expect(f.review.fullPageImageInspected).toBe(true);expect(f.weightedSharesAreCurrentOutstanding).toBe(false);}
 expect(index.accountingCommonReadingsReconciled).toBe(29);expect(index.sourceArithmeticConflicts).toEqual(['BSR']);
 expect(index.checkedSourcePages).toBe(38);
 expect(facts.find(f=>f.ticker==='LPB').sourceScope).toBe('STANDALONE');expect(facts.find(f=>f.ticker==='TCX').sourceScope).toBe('STANDALONE');
 expect(normalizeCommonEarningsReading(facts.find(f=>f.ticker==='GVR')).flags).toContain('FUND_TABLE_AND_FOOTNOTE_REQUIRE_RECONCILIATION');
});
it('links30 completed close references to one explicit SQLite run without depending on streaming frames',()=>{
 const receipt=read(root+'/market-review.json'),db=new DatabaseSync('data/vn30.sqlite',{readOnly:true});
 try{
  expect(receipt.applicationPriceReader.state).toBe('PASS');expect(receipt.applicationPriceReader.prices).toBe(30);
  expect(receipt.checkedPrices).toBe(30);expect(receipt.restRequests).toBe(93);expect(receipt.websocketRequiredForCompletedDailyClose).toBe(false);
  const r=db.prepare('SELECT body,body_hash FROM broker_observation WHERE id=?').get(receipt.runId);expect(createHash('sha256').update(r.body).digest('hex')).toBe(r.body_hash);
  const run=JSON.parse(r.body);expect(run.finishedAt).toBe(receipt.capturedAt);expect(run.displayPrices.state).toBe('UPDATED');
  for(const ref of receipt.rows){const row=db.prepare('SELECT body,body_hash FROM broker_observation WHERE id=?').get(ref.observationId);expect(createHash('sha256').update(row.body).digest('hex')).toBe(row.body_hash);const p=JSON.parse(row.body);expect(p.tradingDate).toBe('2026-10-30');expect(p.unit).toBe('VND_PER_SHARE');expect(p.selectedAt).toBe(run.finishedAt);expect(run.requests.some(q=>q.observationId===p.sourceObservationId)).toBe(true);}
 }finally{db.close();}
 expect(index.currentMarketPricesQualified).toBe(30);
});
it('cross-checks BSR statement parent profit and arithmetic without silently replacing the conflicting PDF subtotal',()=>{
 const r=read(root+'/bsr-source-reconciliation.json');expect(r.physicalPagesInspected).toEqual([11,41]);expect(r.sourceReadings.parentProfitIncomeStatementVnd).toBe(r.sourceReadings.parentProfitEpsNoteVnd);
 expect(decimal(r.sourceReadings.parentProfitIncomeStatementVnd).sub(decimal(r.sourceReadings.printedFundDeductionVnd)).toString()).toBe(r.analystCrossCheck.derivedNumeratorVnd);
 expect(r.analystCrossCheck.printedMinusDerivedVnd).toBe('21135191895');expect(r.analystCrossCheck.wholeVndEpsRoundingCompatible).toBe(true);expect(r.sourceConflictClosed).toBe(false);expect(r.issuerConfirmedCorrection).toBe(false);
});
it('keeps confirmed later funds as partial analyst bridges, not a fabricated annual restatement or normalized earnings',()=>{
 const bridges=read(root+'/later-fund-bridges.json').rows;expect(bridges).toHaveLength(2);
 for(const b of bridges){expect(sha(b.source.pdfPath)).toBe(b.source.sha256);expect(b.earningsPeriod).toBe('FY2025');expect(b.evidencePeriod).toBe('H1_2026');expect(b.issuerPublishedRestatedFY2025Eps).toBe(false);expect(b.comprehensiveGroupFundCoverageProven).toBe(false);expect(b.normalizedCommonProfitVnd).toBeNull();expect(decimal(b.originalCommonProfitVnd).sub(decimal(b.amountVnd)).toString()).toBe(b.lessConfirmedParentFundOnlyVnd);}
 expect(bridges.find(b=>b.ticker==='HDB').amountVnd).toBe('25000000000');expect(bridges.find(b=>b.ticker==='SSI').amountVnd).toBe('244818160367');
});
it.each(facts)('$ticker uses checked current price but refuses unsupported full scores/primary valuations',f=>{
 const x=read(root+'/issuers/'+f.ticker+'.json');expect(x.normalization.accountingCommonProfitVnd).toBe(normalizeCommonEarningsReading(f).accountingCommonProfitVnd);
 expect(x.valuation.market.tradingDate).toBe('2026-10-30');expect(x.scoreInput.marketQualified).toBe(true);expect(x.valuation.primaryValuationQualified).toBe(false);
 expect(x.scoreInput.assessments).toHaveLength(23);expect(evaluateAIReview(x.scoreInput)).toEqual(x.scoreReview);expect(x.scoreReview.totalScore).toBeNull();expect(x.scoreReview.productionScoringAuthorized).toBe(false);
 for(const sensitivity of x.valuation.reportedEarningsSensitivities){expect(sensitivity.fairValuePerShare).toBeNull();expect(sensitivity.sustainableEarningsProven).toBe(false);expect(sensitivity.primaryValuationQualified).toBe(false);}
});
it('preserves historical artifact pins and verifies authorized append-only DB evolution separately from old file hashes',()=>{
 for(const rev of ['b6-close-inputs-r1','b6-comparability-r2']){const m=read('docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-30/'+rev+'/artifact-manifest.json');for(const p of [...m.artifactPins,...m.builderPins])expect(sha(p.path)).toBe(p.sha256);expect(m.databaseSha256).toBe(read(root+'/database-before.json').databaseSha256);}
 const db=read(root+'/database-preservation.json');expect(db.state).toBe('PASS_APPEND_ONLY_BROKER_OBSERVATIONS');expect(db.tablesChecked).toBe(42);expect(db.ledgerAndScoringUnchanged).toBe(true);expect(db.schemaUnchanged).toBe(true);expect(db.changes.every(c=>c.table==='broker_observation')).toBe(true);
});
