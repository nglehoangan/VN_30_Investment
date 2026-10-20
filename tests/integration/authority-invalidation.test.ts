// @vitest-environment node
import {it,expect} from 'vitest';
import {dependencyFixture} from '../fixtures/dependencies';
import {testDatabase} from '../fixtures/database';
import {ProductionDependencies} from '@/application/dependencies/service';
import {PrismaDependencyRegistry} from '@/infrastructure/repositories/dependencies';
import {snapshotHash as hash} from '@/infrastructure/fundamentals/snapshot-hash';
import {head,ref} from '@/domain/dependencies/validation';
import type {Head} from '@/domain/dependencies/contracts';
// Disposable synthetic authorities only; no scoring engine or investment decision is invoked.
it.each(['POLICY','SCORING_MODEL','RISK_POLICY','DECISION_ENGINE'] as const)('%s supersession invalidates current publication/cache and preserves historical replay',async type=>{
 const db=await testDatabase();
 try{
  const f=dependencyFixture(),registry=new PrismaDependencyRegistry(db.client),service=new ProductionDependencies(registry,f.catalog,f.clock,hash);
  const a=await service.activate(null,'SYNTHETIC ONLY A');
  const resolved=await service.resolveProductionAnalysisDependencies({purpose:'VALUATION',requestedAsOf:f.at});
  const publication=await service.sealAnalysis(f.analysis(resolved),resolved);
  for(const key of ['policy','scoringModel','riskPolicy','decisionEngine','release'])await expect(service.resolveProductionAnalysisDependencies({purpose:'VALUATION',requestedAsOf:f.at,[key]:'SUPERSEDED_OR_UNKNOWN'} as never)).rejects.toThrow('CALLER_SELECTED_STALE_HEAD');
  const old=head(f.heads,type),content=type==='SCORING_MODEL'?{...(old.content as object),implementationIdentity:'SYNTHETIC NEXT SCORING'}:'SYNTHETIC NEXT '+type;
  const replacement:Head={...old,content,pin:{id:old.pin.id+':next',hash:hash(content)}};
  const next=f.heads.map(h=>h.type===type?replacement:h).map(h=>({...h,requires:h.requires.map(r=>r.type===type?{...r,pin:replacement.pin}:r)}));
  f.setHeads(next);const b=await service.activate(ref(a),'SYNTHETIC ONLY B');
  expect(await service.cacheState(ref(a))).toBe('STALE_DEPENDENCY');
  await expect(service.resolveProductionDecisionDependencies(ref(publication),'VALUATION')).rejects.toThrow('REANALYSIS_REQUIRED');
  const replay=await service.replayHistorical(ref(a),f.at);expect(replay.publicationAuthority).toBe(false);
  expect(ref((await registry.current())!)).toEqual(ref(b));
  expect((await registry.publication(ref(publication))).snapshot.contentHash).toBe(publication.snapshot.contentHash);
  expect(await db.client.marketBoundaryDecisionSeal.count()).toBe(0);
 }finally{await db.close();}
});
