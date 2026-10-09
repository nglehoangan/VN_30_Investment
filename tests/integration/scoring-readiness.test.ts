// @vitest-environment node
import {it,expect} from 'vitest';
import {testDatabase} from '../fixtures/database';
import {setupScoringReadiness} from '../fixtures/scoring-readiness-db';
import {PrismaScoringDatasets} from '@/infrastructure/repositories/scoring-datasets';
import {ScoringEngine} from '@/application/scoring/engine';
import {calculateScorecard} from '@/domain/scoring/scorecard';
import {fixture} from '../fixtures/scoring';
import {snapshotHash} from '@/infrastructure/fundamentals/snapshot-hash';
import {canonicalJson} from '@/domain/fundamentals/snapshot';
import {openDatabase} from '@/infrastructure/db/client';
import {PrismaFundamentalSnapshot} from '@/infrastructure/repositories/fundamental-snapshot';
import {PrismaFundamentals} from '@/infrastructure/repositories/fundamentals';
import {PrismaFundamentalDerivation} from '@/infrastructure/repositories/fundamental-derivation';
it('FORMAL writes score plus immutable exact dataset binding, computes all-ticker readiness and reopens',async()=>{
 const db=await testDatabase();try{
  const f=await setupScoringReadiness(db),card=await f.engine.score(f.input,f.selection),binding=await f.datasets.findBinding(card.id);expect(card.totalScore).toBe('82');expect(binding!.inputHash).toBe(snapshotHash(f.input));expect(binding!.readiness).toHaveLength(30);expect(binding!.readiness.filter(r=>r.readyForScoring)).toHaveLength(1);expect(await f.artifacts.find(card.id)).toEqual(card);
  const second=await f.engine.score({...f.input,id:'second-formal-score',calculatedAt:'2026-07-29T00:00:00.000Z'},f.selection);expect(second.totalScore).toBe(card.totalScore);expect(await db.client.scoringDatasetBinding.count()).toBe(2);
  await expect(f.engine.score(f.input,f.selection)).rejects.toThrow();expect(await db.client.analyticalArtifact.count()).toBe(2);
  await db.client.$disconnect();const c=await openDatabase(db.config);try{
   const datasets=new PrismaScoringDatasets(c,new PrismaFundamentalSnapshot(c,f.registry,f.registryBinding,f.policyBinding),new PrismaFundamentals(c,f.registry,f.registryBinding),new PrismaFundamentalDerivation(c,f.registry,f.registryBinding),f.registry,[f.reviewBinding]);expect(await datasets.findBinding(card.id)).toEqual(binding);
  }finally{await c.$disconnect();}
 }finally{await db.close();}
},30_000);
it('direct/default FORMAL engine and artifact repository cannot bypass DI; synthetic scope remains intact',async()=>{
 const db=await testDatabase();try{
  const f=await setupScoringReadiness(db,false);await expect(new ScoringEngine(db.registry,f.artifacts).score(f.input)).rejects.toThrow();await expect(f.engine.score(f.input)).rejects.toThrow();await expect(f.engine.score(f.input,f.selection)).rejects.toThrow();await expect(f.artifacts.append(calculateScorecard(f.input))).rejects.toThrow();
  await expect(f.engine.score({...f.input,ready:true} as typeof f.input,f.selection)).rejects.toThrow();expect(await db.client.analyticalArtifact.count()).toBe(0);expect(await db.client.scoringDatasetBinding.count()).toBe(0);
  const synthetic=fixture();await db.registry.append(synthetic.methodology);expect((await f.engine.score(synthetic)).input.artifactScope).toBe('SYNTHETIC_TEST');await expect(f.engine.score(synthetic,f.selection)).rejects.toThrow();
 }finally{await db.close();}
},30_000);
it('a stored caller-authored DI PASS or a different run cannot manufacture independent review authority',async()=>{
 const db=await testDatabase();try{
  const f=await setupScoringReadiness(db,false),a=f.acceptance,plain=new PrismaScoringDatasets(db.client,f.snapshots,f.facts,f.derivations,f.registry);
  await expect(plain.appendAcceptance(a)).rejects.toThrow();expect(await db.client.dataInitializationAcceptance.count()).toBe(0);
  await db.client.dataInitializationAcceptance.create({data:{id:a.id,snapshotRunId:a.snapshotRunId,acceptedAt:a.acceptedAt,body:canonicalJson(a),bodyHash:snapshotHash(a)}});await expect(plain.authorize(f.input,f.selection)).rejects.toThrow();
  const other=await f.snapshots.seal({...f.request,runId:'same-content-different-run',builtAt:'2026-07-28T00:30:00.000Z'});expect(other.contentHash).toBe(f.snapshot.contentHash);await expect(f.engine.score(f.input,{...f.selection,snapshotRunId:other.request.runId})).rejects.toThrow();expect(await db.client.analyticalArtifact.count()).toBe(0);
 }finally{await db.close();}
},30_000);
it('reviewed financial/model/human inputs and clocks cannot be changed behind a valid acceptance',async()=>{
 const db=await testDatabase();try{
  const f=await setupScoringReadiness(db);
  for(const input of [{...f.input,ready:true},{...f.input,evidence:f.input.evidence.map(e=>e.id==='canonical-net-income'?{...e,value:'999'}:e)},{...f.input,expectedReturn:null},{...f.input,assessments:[]},{...f.input,knownAt:'2026-07-28T00:00:00.000Z'},{...f.input,calculatedAt:'2026-07-27T00:00:00.000Z'},{...f.input,methodology:{...f.input.methodology,configurationReference:'unreviewed'}}])await expect(f.engine.score(input,f.selection)).rejects.toThrow();
  expect(await db.client.analyticalArtifact.count()).toBe(0);expect(await db.client.scoringDatasetBinding.count()).toBe(0);
 }finally{await db.close();}
},30_000);
it('immutable guards, restrictive links and rollback retain both datasets and legacy score artifacts',async()=>{
 const db=await testDatabase();try{
  const f=await setupScoringReadiness(db),card=await f.engine.score(f.input,f.selection);
  for(const table of ['data_initialization_acceptance','scoring_dataset_binding'])for(const sql of [`UPDATE ${table} SET body='{}'`,`DELETE FROM ${table}`,`INSERT OR REPLACE INTO ${table} SELECT * FROM ${table}`,`INSERT INTO ${table} SELECT * FROM ${table} WHERE true ON CONFLICT DO UPDATE SET body='{}'`])await expect(db.client.$executeRawUnsafe(sql)).rejects.toThrow();
  const row=await db.client.scoringDatasetBinding.findUniqueOrThrow({where:{scorecardId:card.id}});await expect(db.client.scoringDatasetBinding.create({data:{...row,scorecardId:'missing-card'}})).rejects.toThrow();expect(await db.client.$queryRawUnsafe('PRAGMA foreign_key_check')).toEqual([]);
  // Simulate an insertion failure after the score insert; transaction must roll the score back.
  await db.client.$executeRawUnsafe("CREATE TRIGGER synthetic_binding_failure BEFORE INSERT ON scoring_dataset_binding BEGIN SELECT RAISE(ABORT,'synthetic rollback'); END");await expect(f.engine.score({...f.input,id:'rolled-back-score'},f.selection)).rejects.toThrow();expect(await f.artifacts.find('rolled-back-score')).toBeNull();expect(await f.datasets.findBinding(card.id)).not.toBeNull();
 }finally{await db.close();}
},30_000);
it('transport hashes cannot hide tampered DI review, readiness bindings or forged domain scores',async()=>{
 const db=await testDatabase();try{
  const f=await setupScoringReadiness(db),card=await f.engine.score(f.input,f.selection);
  await expect(f.datasets.append({...card,id:'forged-score',totalScore:'100'},await f.datasets.authorize({...f.input,id:'forged-score'},f.selection))).rejects.toThrow();
  await db.client.$executeRawUnsafe('DROP TRIGGER scoring_dataset_binding_no_update');const row=await db.client.scoringDatasetBinding.findUniqueOrThrow({where:{scorecardId:card.id}}),body=JSON.parse(row.body);body.readiness[1].readyForScoring=true;await db.client.scoringDatasetBinding.update({where:{scorecardId:card.id},data:{body:canonicalJson(body),bodyHash:snapshotHash(body)}});await expect(f.datasets.findBinding(card.id)).rejects.toThrow();
  await db.client.$executeRawUnsafe('DROP TRIGGER data_initialization_acceptance_no_update');const forged={...f.acceptance,reviewArtifactReference:'other-review'};await db.client.dataInitializationAcceptance.update({where:{id:forged.id},data:{body:canonicalJson(forged),bodyHash:snapshotHash(forged)}});await expect(f.datasets.readiness(forged.id)).rejects.toThrow();
 }finally{await db.close();}
},30_000);
it('historical FORMAL artifacts without dataset links remain readable but cannot claim readiness at the ranking boundary',async()=>{
 const db=await testDatabase();try{
  const f=await setupScoringReadiness(db),card=calculateScorecard({...f.input,id:'legacy-formal'}),body=JSON.stringify(card);
  // Historical fixture insertion, not an authorized new production scoring path.
  const {manifestDigest}=await import('@/infrastructure/fundamentals/snapshot-hash');await db.client.analyticalArtifact.create({data:{id:card.id,kind:'SCORECARD',methodologyId:card.methodology.methodologyId,asOf:card.asOf,calculatedAt:card.calculatedAt,body,bodyHash:manifestDigest(body)}});expect(await f.artifacts.find(card.id)).toEqual(card);expect(await f.datasets.findBinding(card.id)).toBeNull();
  await expect(f.engine.rank({id:'blocked-rank',asOf:card.asOf,calculatedAt:card.calculatedAt,cards:[card],universe:{referenceVersion:'reference-v1',securityIds:[card.securityId],complete:true},requiredReturnAssessments:[]})).rejects.toThrow();expect(await db.client.scoringDatasetBinding.count()).toBe(0);
 }finally{await db.close();}
},30_000);
it('configured review hashes still require an exact approved production methodology and requirements binding',async()=>{
 const db=await testDatabase();try{
  const f=await setupScoringReadiness(db,false);
  for(const [i,patch] of [{governanceStatus:'PROPOSED'},{intendedUse:'TEST'},{approvalReference:'wrong-approval'},{configurationReference:'wrong-config'}].entries()){
   const a={...f.acceptance,id:'bad-method-acceptance-'+i,methodologyId:'bad-di-method-'+i},hash=snapshotHash(a),original=await db.client.methodologyRecord.findUniqueOrThrow({where:{methodologyId:f.acceptance.methodologyId}});
   await db.client.methodologyRecord.create({data:{...original,methodologyId:a.methodologyId,configurationReference:'di-acceptance-sha256:'+hash,...patch}});
   const repo=new PrismaScoringDatasets(db.client,f.snapshots,f.facts,f.derivations,f.registry,[{acceptanceHash:hash,reviewerReference:a.reviewerReference,approvalReference:a.approvalReference}]);await expect(repo.appendAcceptance(a)).rejects.toThrow();
  }
  const a={...f.acceptance,id:'bad-requirements-acceptance',methodologyId:'other-di-method',requirements:{...f.requirements,approvalReference:'unapproved-policy-reference'}},hash=snapshotHash(a),method=await db.client.methodologyRecord.findUniqueOrThrow({where:{methodologyId:f.acceptance.methodologyId}});await db.client.methodologyRecord.create({data:{...method,methodologyId:a.methodologyId,configurationReference:'di-acceptance-sha256:'+hash}});
  const repo=new PrismaScoringDatasets(db.client,f.snapshots,f.facts,f.derivations,f.registry,[{acceptanceHash:hash,reviewerReference:a.reviewerReference,approvalReference:a.approvalReference}]);await expect(repo.appendAcceptance(a)).rejects.toThrow();expect(await db.client.dataInitializationAcceptance.count()).toBe(0);
 }finally{await db.close();}
},30_000);
