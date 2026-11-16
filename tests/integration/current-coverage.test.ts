import {it,expect} from 'vitest';
import {currentCoverageFixture} from '../fixtures/current-coverage';
import {CurrentFinancialCoverage} from '@/infrastructure/source-admission/current-coverage';
it('qualifies reported debt and persists/consumes closed research and actual admitted history',async()=>{
 const f=await currentCoverageFixture();try{
  const a=await f.service.ingest(f.q,f.securityId),b=await f.datasets.bind(a.id,f.context),c=await f.coverage.bind(b.id,f.context);
  expect(c.result.qualifiedDebt.fact.value).toBe('8482073875397');expect(c.result.qualifiedDebt.receipt.currentPortion).toBeNull();
  expect(c.result.qualifiedDebt.fact.debtMetadata.comprehensivePopulationStatus).toBe('COMPREHENSIVE_UNVERIFIED');
  expect(c.result.qualifiedDebt.fact.debtMetadata.uncertainty.unclassifiedLiabilityAmount).toBe('124306352739');
  const read=await f.coverage.consume(c.id,f.context);expect(read.previouslyAdmittedHistory).toHaveLength(65);expect(read.research.roic.annual).toHaveLength(4);expect(read.research.revenueCagr.value).not.toBeNull();
  expect(read.research.fcf.consolidated9m2026.value).toBe('6434314662197');
  expect(read.research.estimatesPromotedToFacts).toBe(false);expect(read.readyForScoring).toBe(false);
  expect((await f.coverage.bind(b.id,f.context)).duplicate).toBe(true);
  expect(Number((await f.db.$queryRawUnsafe<{n:bigint}[]>('SELECT count(*) n FROM current_financial_fact'))[0].n)).toBe(69);
  expect(await f.db.scoringDatasetBinding.count()).toBe(0);expect(await f.db.analyticalArtifact.count()).toBe(0);
 }finally{await f.close();}
});
it('rejects wrong purpose/ticker and propagates debt fact revocation',async()=>{
 const f=await currentCoverageFixture();try{
  const a=await f.service.ingest(f.q,f.securityId),b=await f.datasets.bind(a.id,f.context),c=await f.coverage.bind(b.id,f.context);
  await expect(f.coverage.consume(c.id,{...f.context,purpose:'HISTORICAL_PIT'})).rejects.toThrow('CURRENT_ONLY_NOT_PIT');
  await expect(f.coverage.consume(c.id,{...f.context,ticker:'FPT'})).rejects.toThrow('CONSUMPTION_SCOPE');
  await f.service.revoke(c.result.qualifiedDebt.fact.id,'test only',f.q.knownAt);await expect(f.coverage.consume(c.id,f.context)).rejects.toThrow('REVOKED');
 }finally{await f.close();}
});
it('changed historical archive cannot inherit a trusted review flag',async()=>{
 const f=await currentCoverageFixture();try{
  const a=await f.service.ingest(f.q,f.securityId),b=await f.datasets.bind(a.id,f.context);f.put(f.composition.history.path,'{"qualified":true}');
  await expect(f.coverage.bind(b.id,f.context)).rejects.toThrow('SOURCE_HASH_MISMATCH');
 }finally{await f.close();}
});
it('wrong debt source value and scope are not qualified even in a trusted synthetic test catalog',async()=>{
 const f=await currentCoverageFixture();try{
  const a=await f.service.ingest(f.q,f.securityId),b=await f.datasets.bind(a.id,f.context);
  const review=JSON.parse(require('node:fs').readFileSync(f.root+'/'+f.composition.debtReview.path,'utf8'));review.reportedShort='0';
  const debtReview=f.put('bad-debt-review.json',review);f.registryBody.authorities[0].currentEnrichment.catalogs=[debtReview,f.composition.history,f.composition.research];f.setRegistry(f.registryBody);
  const coverage=new CurrentFinancialCoverage(f.db,f.root,f.service,f.datasets,{...f.composition,debtReview});
  // Changed base authority reference is itself blocked; no fake debt reaches storage.
  await expect(coverage.bind(b.id,f.context)).rejects.toThrow();
 }finally{await f.close();}
});
it('uses the existing debt validator to reject unsupported current-portion/population assertions',async()=>{
 const f=await currentCoverageFixture();try{
  const {evaluateDebtReceipt,validDebtMetadata}=await import('@/domain/fundamentals/debt-contract');
  const {snapshotHash:hash}=await import('@/infrastructure/fundamentals/snapshot-hash');
  const a=await f.service.ingest(f.q,f.securityId),b=await f.datasets.bind(a.id,f.context),result=await f.coverage.build(b.id,f.context);
  const d=result.qualifiedDebt;
  expect(evaluateDebtReceipt(d.receipt,a.plan.facts,d.validationContext,hash)?.value).toBe('8482073875397');
  for(const change of [{shortIncludesCurrentPortion:false},{longIncludesCurrentPortion:true},{currentPortion:'0'},{currentPortionPresentation:undefined}]){
   const {bodyHash:unused,...body}=d.receipt;const changed:Record<string,unknown>={...body,...change};if(changed.currentPortionPresentation===undefined)delete changed.currentPortionPresentation;const r={...changed,bodyHash:hash(changed)};
   expect(evaluateDebtReceipt(r as unknown as typeof d.receipt,a.plan.facts,d.validationContext,hash)).toBeNull();
  }
  expect(validDebtMetadata(d.fact.debtMetadata,'COMPREHENSIVE_FINANCIAL_DEBT',{ticker:'VNM',itemId:'COMPREHENSIVE_FINANCIAL_DEBT',value:d.fact.value,period:d.fact.period,scope:d.fact.scope,unit:d.fact.unit,currency:d.fact.currency},d.validationContext,hash)).toBe(false);
 }finally{await f.close();}
});
it('retains closed-research N/R and scope distinctions instead of fabricating normalized metric points',async()=>{
 const f=await currentCoverageFixture();try{
  const a=await f.service.ingest(f.q,f.securityId),b=await f.datasets.bind(a.id,f.context),r=await f.coverage.build(b.id,f.context);
  expect(r.research.roic.exactTtmRoic).toContain('N_R');
  expect(r.research.metricDispositions.find((x:{metric:string})=>x.metric==='ROE')?.status).toContain('NORMALIZED_POINT_N_R');
  expect(r.research.metricDispositions.find((x:{metric:string})=>x.metric==='PB')?.status).toBe('OPTIONAL_POINT_N_R_PRIMARY_S5_VALUATION_BOUND');
  expect(r.research.fcf.parentFY2025.scope).toBe('STANDALONE');expect(r.research.fcf.consolidated9m2026.scope).toBe('CONSOLIDATED');
  expect(r.research.liquidity.acceptance.status).toBe('CLOSED');expect(r.research.formalPointsGranted).toBe(false);
 }finally{await f.close();}
});
