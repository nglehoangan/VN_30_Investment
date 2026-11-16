import {it,expect,vi} from 'vitest';
import {currentCoverageFixture} from '../fixtures/current-coverage';
import {CurrentPreScoringBindings,PreboundScoringDatasets} from '@/infrastructure/source-admission/pre-scoring-binding';
import type {ScoreInput} from '@/domain/scoring/scorecard';
import type {ScoringDatasets} from '@/ports/scoring';
async function setup(){const f=await currentCoverageFixture();const a=await f.service.ingest(f.q,f.securityId),d=await f.datasets.bind(a.id,f.context),bindings=new CurrentPreScoringBindings(f.coverage),reference=await bindings.prepare(d.id,f.context);return {...f,bindings,reference,d};}
it('persists and verifies a real-data pre-scoring binding with no scorecard or numeric assessment',async()=>{
 const f=await setup();try{
  await f.bindings.verify(f.reference,f.context);const again=await f.bindings.prepare(f.d.id,f.context);expect(again).toEqual(f.reference);
  expect(Number((await f.db.$queryRawUnsafe<{n:bigint}[]>('SELECT count(*) n FROM current_financial_enrichment'))[0].n)).toBe(1);
  expect(await f.db.analyticalArtifact.count()).toBe(0);expect(await f.db.scoringDatasetBinding.count()).toBe(0);expect(await f.db.dataInitializationAcceptance.count()).toBe(0);
  expect(f.reference.permitsScoring).toBe(false);expect(f.reference.context.knownAt).toBe(f.context.knownAt);
  await expect(f.bindings.verify({...f.reference,manifestHash:'0'.repeat(64)},f.context)).rejects.toThrow('MANIFEST_MISMATCH');
  await expect(f.bindings.verify(f.reference,{...f.context,purpose:'HISTORICAL_PIT'})).rejects.toThrow('CURRENT_ONLY_NOT_PIT');
  await expect(f.bindings.verify(f.reference,{...f.context,ticker:'FPT'})).rejects.toThrow('CONTEXT_MISMATCH');
  await expect(f.bindings.verify(f.reference,{...f.context,economicCutoff:'2026-10-29'})).rejects.toThrow('CONTEXT_MISMATCH');
  await expect(f.bindings.verify(f.reference,{...f.context,knownAt:'2026-10-30T12:00:00.000Z'})).rejects.toThrow('CONTEXT_MISMATCH');
  await f.coverage.revoke(f.reference.bindingId,'isolated revocation',f.context.knownAt);
  await expect(f.bindings.verify(f.reference,f.context)).rejects.toThrow('REVOKED');
 }finally{await f.close();}
});
it('binding cannot bypass any downstream gate; fake readiness flags never authorize a score',async()=>{
 const f=await setup();try{
  // Partial input used only for boundary rejection; never calculates or persists a fake scorecard.
  const input={artifactScope:'FORMAL',securityId:f.securityId,asOf:f.context.economicCutoff+'T00:00:00.000Z',knownAt:f.context.knownAt} as ScoreInput;
  for(const gate of ['DI','ASSESSMENT','M1','CONFIDENCE','AUTHORIZATION']){
   const authorize=vi.fn(async()=>{throw Error(gate+'_PENDING');}),append=vi.fn();
   const downstream={authorize,append,findBinding:vi.fn()} as unknown as ScoringDatasets;
   const consumer=new PreboundScoringDatasets(f.bindings,f.reference,downstream);
   await expect(consumer.authorize(input,{snapshotRunId:'not-created',acceptanceId:'not-created'})).rejects.toThrow(gate+'_PENDING');expect(authorize).toHaveBeenCalledOnce();expect(append).not.toHaveBeenCalled();
   await expect(consumer.authorize({...input,securityId:'FPT'}, {snapshotRunId:'x',acceptanceId:'x'})).rejects.toThrow('SCORING_IDENTITY');expect(authorize).toHaveBeenCalledOnce();
  }
  await expect(f.bindings.verify({...f.reference,permitsScoring:true} as unknown as typeof f.reference,f.context)).rejects.toThrow('NOT_SCORING_AUTHORIZATION');
  expect(await f.db.analyticalArtifact.count()).toBe(0);
 }finally{await f.close();}
});
it('consumer resolves verified current binding before delegating; revoked data cannot reach authorization',async()=>{
 const f=await setup();try{
  const authorize=vi.fn(async()=>{throw Error('EXISTING_GOVERNANCE_GATE');});
  const downstream={authorize,append:vi.fn(),findBinding:vi.fn()} as unknown as ScoringDatasets;
  const consumer=new PreboundScoringDatasets(f.bindings,f.reference,downstream);
  await f.datasets.revoke(f.d.id,'isolated parent revocation',f.context.knownAt);
  const input={artifactScope:'FORMAL',securityId:f.securityId,asOf:f.context.economicCutoff+'T00:00:00.000Z',knownAt:f.context.knownAt} as ScoreInput;
  await expect(consumer.authorize(input,{snapshotRunId:'x',acceptanceId:'x'})).rejects.toThrow('REVOKED');expect(authorize).not.toHaveBeenCalled();
 }finally{await f.close();}
});
