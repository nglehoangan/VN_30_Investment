import {readFileSync} from 'node:fs';
import {it,expect,vi} from 'vitest';
import {currentCoverageFixture} from '../fixtures/current-coverage';
import {CurrentPreScoringBindings} from '@/infrastructure/source-admission/pre-scoring-binding';
import {CurrentPurposeScoringConsumer} from '@/infrastructure/source-admission/current-scoring-consumer';
import {ScoringEngine} from '@/application/scoring/engine';
import type {ScoreInput} from '@/domain/scoring/scorecard';
async function setup(){
 const f=await currentCoverageFixture(),a=await f.service.ingest(f.q,f.securityId),d=await f.datasets.bind(a.id,f.context),bindings=new CurrentPreScoringBindings(f.coverage),reference=await bindings.prepare(d.id,f.context);
 for(const sql of readFileSync('prisma/proposals/current-scoring-data-acceptance-v1.sql','utf8').match(/CREATE TRIGGER[\s\S]*?END;|CREATE TABLE[\s\S]*?;/g)??[])await f.db.$executeRawUnsafe(sql);
 const consumer=new CurrentPurposeScoringConsumer(f.db,bindings,f.coverage,f.datasets);
 const registry={findById:vi.fn()},artifacts={append:vi.fn(),find:vi.fn()};
 const engine=new ScoringEngine(registry,artifacts,undefined,consumer);
 return {...f,bindings,reference,consumer,engine,registry,artifacts,d};
}
it('actual ScoringEngine resolves real VNM current data without historical DI snapshot or scorecard',async()=>{
 const f=await setup();try{
  const receipt=await f.engine.resolveCurrentDataset(f.reference,f.context);
  expect(receipt.status).toBe('ACCEPTED_CURRENT_DATA');expect(receipt.dataAcceptanceId).toContain('current-data-acceptance:');expect(receipt.facts).toHaveLength(35);expect(receipt.history).toHaveLength(65);
  expect(receipt.evidence.every(e=>e.time.contract==='current-formal-evidence-time-v1')).toBe(true);
  expect(receipt.facts.find(x=>x.itemId==='REPORTED_BORROWINGS')?.value).toBe('8482073875397');
  expect(receipt.price.value).toBe('56900');expect(receipt.shares.value).toBe('2089955445');
  expect(receipt.originalBindingKnownAt).toBe(f.reference.context.knownAt);expect(receipt.context.economicCutoff).toBe('2026-10-30');
  expect(receipt.readyForScoring).toBe(false);expect(receipt.historicalPitGranted).toBe(false);expect(receipt.VNM17Promoted).toBe(false);
  expect(Object.isFrozen(receipt)).toBe(true);expect(f.registry.findById).not.toHaveBeenCalled();expect(f.artifacts.append).not.toHaveBeenCalled();
  expect(await f.db.dataInitializationAcceptance.count()).toBe(0);expect(await f.db.scoringDatasetBinding.count()).toBe(0);expect(await f.db.analyticalArtifact.count()).toBe(0);
  expect(await f.engine.resolveCurrentDataset(f.reference,f.context)).toEqual(receipt);
  expect(Number((await f.db.$queryRawUnsafe<{n:bigint}[]>('SELECT count(*) n FROM current_scoring_data_acceptance'))[0].n)).toBe(1);
  await expect(f.db.$executeRawUnsafe("UPDATE current_scoring_data_acceptance SET body='{}'")).rejects.toThrow('IMMUTABLE');
 }finally{await f.close();}
});
it('rejects wrong purpose, cutoff, ticker, early knowledge, forged hash and revoked admission',async()=>{
 const f=await setup();try{
  for(const change of [{purpose:'HISTORICAL_PIT'},{ticker:'FPT'},{economicCutoff:'2026-10-29'},{knownAt:'2026-10-30T23:59:59.999Z'}])await expect(f.engine.resolveCurrentDataset(f.reference,{...f.context,...change})).rejects.toThrow();
  await expect(f.engine.resolveCurrentDataset({...f.reference,manifestHash:'f'.repeat(64)},f.context)).rejects.toThrow('MANIFEST_MISMATCH');
  const r=await f.consumer.resolve(f.reference,f.context);await f.service.revoke(r.facts[0].id,'isolated',f.context.knownAt);
  await expect(f.engine.resolveCurrentDataset(f.reference,f.context)).rejects.toThrow('REVOKED');expect(f.artifacts.append).not.toHaveBeenCalled();
 }finally{await f.close();}
});
it('accepted data never supplies the formal score authorization or changes the legacy scoring path',async()=>{
 const f=await setup();try{
  await f.engine.resolveCurrentDataset(f.reference,f.context);
  // Minimal rejection-only input; no fabricated assessments, M1 approvals or scorecard.
  const methodology={methodologyId:'pending-real-authorization'};f.registry.findById.mockResolvedValue(methodology);
  await expect(f.engine.score({artifactScope:'FORMAL',methodology} as ScoreInput)).rejects.toMatchObject({issues:[{reason:'FORMAL_SCORING_DATASET_REQUIRED'}]});
  expect(f.artifacts.append).not.toHaveBeenCalled();expect(await f.db.analyticalArtifact.count()).toBe(0);
  const unconfigured=new ScoringEngine(f.registry,f.artifacts);
  await expect(unconfigured.resolveCurrentDataset(f.reference,f.context)).rejects.toMatchObject({issues:[{reason:'CURRENT_PURPOSE_CONSUMER_REQUIRED'}]});
 }finally{await f.close();}
});
