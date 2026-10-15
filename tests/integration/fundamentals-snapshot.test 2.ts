// @vitest-environment node
import {it,expect} from 'vitest';
import {release} from '../fixtures/fundamentals';
import {testDatabase} from '../fixtures/database';
import {snapshotFixture,snapshotDerivationFixture} from '../fixtures/snapshot';
import {validateAvailabilityPolicy} from '@/domain/fundamentals/availability';
import {PrismaFundamentals} from '@/infrastructure/repositories/fundamentals';
import {PrismaFundamentalSnapshot} from '@/infrastructure/repositories/fundamental-snapshot';
import {BuildFundamentalSnapshot} from '@/application/fundamentals/build-snapshot';
import {loadCanonicalRegistry} from '@/infrastructure/fundamentals/canonical-registry';
import {openDatabase} from '@/infrastructure/db/client';
import {snapshotHash,manifestDigest} from '@/infrastructure/fundamentals/snapshot-hash';
import {PrismaFundamentalDerivation} from '@/infrastructure/repositories/fundamental-derivation';
import {loadDerivationCrosswalk} from '@/infrastructure/fundamentals/derivation-crosswalk';
import {normalizationHash} from '@/infrastructure/fundamentals/reviewed-statement';
import {deriveFundamentals} from '@/domain/fundamentals/derivation';
import {canonicalJson} from '@/domain/fundamentals/snapshot';
async function setup(db:Awaited<ReturnType<typeof testDatabase>>){
 const f=snapshotFixture(),facts=new PrismaFundamentals(db.client,f.registry),snapshots=new PrismaFundamentalSnapshot(db.client,f.registry);
 await db.client.security.create({data:{id:f.observation.securityId,name:'Synthetic snapshot issuer'}});await facts.appendSource(f.source);await facts.appendImport(f.batch,[f.capture]);await facts.appendObservation(f.observation);
 const a=await snapshots.assess(f.assessment.id,f.observation.id,f.policy,f.assessment.assessedAt);expect(a).toEqual(f.assessment);
 return {f,facts,snapshots,build:new BuildFundamentalSnapshot(snapshots)};
}
it('atomically seals/reopens content, selected/excluded members, provenance and independent build runs',async()=>{
 const db=await testDatabase();try{
  const {f,facts,snapshots,build}=await setup(db),s=await build.run(f.request);expect(s.members).toHaveLength(1);expect(await snapshots.findRun(s.request.runId)).toEqual(s);
  const second=await build.run({...f.request,runId:'second-run',builtAt:'2026-07-29T00:00:00.000Z'});expect(second.contentHash).toBe(s.contentHash);expect(second.request.runId).not.toBe(s.request.runId);
  expect(await db.client.fundamentalSnapshotContent.count()).toBe(1);expect(await db.client.fundamentalSnapshotRun.count()).toBe(2);expect(await db.client.fundamentalSnapshotMember.count()).toBe(2);
  expect((await facts.findObservation(f.observation.id))!.availability).toEqual(f.observation.availability);
  await expect(build.run(f.request)).rejects.toThrow();expect(await db.client.fundamentalSnapshotRun.count()).toBe(2);
  await db.client.$disconnect();const reopened=await openDatabase(db.config);try{expect(await new PrismaFundamentalSnapshot(reopened,f.registry).findRun(s.request.runId)).toEqual(s);}finally{await reopened.$disconnect();}
 }finally{await db.close();}
},30_000);
it('authoritative enumeration rejects hidden conflicts, incomplete pins and forged availability with no partial content',async()=>{
 const db=await testDatabase();try{
  const {f,facts,snapshots,build}=await setup(db),other=snapshotFixture('conflict');await facts.appendImport(other.batch,[other.capture]);await facts.appendObservation({...other.observation,normalized:{...other.observation.normalized,value:'1'}});
  await snapshots.assess(other.assessment.id,other.observation.id,f.policy,f.assessment.assessedAt);
  await expect(build.run(f.request)).rejects.toThrow();expect(await db.client.fundamentalSnapshotContent.count()).toBe(0);expect(await db.client.fundamentalSnapshotRun.count()).toBe(0);
  const blocked=await build.run({...f.request,assessmentPins:[...f.request.assessmentPins,{observationId:other.observation.id,assessmentId:other.assessment.id}]});expect(blocked.members).toEqual([]);expect(blocked.blockers).toContain('BLOCKED_CONFLICT');expect(await snapshots.findRun(f.request.runId)).toEqual(blocked);
  const forged={...f.assessment,id:'forged-assessment',availableAt:'2026-07-01T00:00:00.000Z'};await db.client.fundamentalAvailabilityAssessment.create({data:{id:forged.id,observationId:forged.observationId,policyVersion:forged.policy.version,availableAt:forged.availableAt,assessedAt:forged.assessedAt,body:canonicalJson(forged),bodyHash:snapshotHash(forged)}});
  await expect(build.run({...f.request,runId:'forged-run',assessmentPins:[{observationId:f.observation.id,assessmentId:forged.id},{observationId:other.observation.id,assessmentId:other.assessment.id}]})).rejects.toThrow();expect(await db.client.fundamentalSnapshotRun.count()).toBe(1);
 }finally{await db.close();}
},30_000);
it('new imports after frozen cutoff reproduce original content and eligible lineage while retained raw evidence stays immutable',async()=>{
 const db=await testDatabase();try{
  const {f,facts,snapshots,build}=await setup(db),first=await build.run(f.request),later=snapshotFixture('later');
  const capture={...later.capture,retrievedAt:'2026-08-01T00:00:00.000Z'},batch={...later.batch,startedAt:capture.retrievedAt,completedAt:capture.retrievedAt,ingestedAt:'2026-08-01T00:01:00.000Z'},o={...later.observation,retrievedAt:capture.retrievedAt,ingestedAt:batch.ingestedAt,normalized:{...later.observation.normalized,value:'999'}};
  await facts.appendImport(batch,[capture]);await facts.appendObservation(o);
  const second=await build.run({...f.request,runId:'new-frozen-run',builtAt:'2026-08-02T00:00:00.000Z'});expect(second.contentHash).toBe(first.contentHash);expect(second.members).toEqual(first.members);expect(await snapshots.findRun(first.request.runId)).toEqual(first);
  const row=await db.client.fundamentalSnapshotRun.findUniqueOrThrow({where:{runId:second.request.runId}}),envelope=JSON.parse(row.body);expect(envelope.provenance.map((p:{captureId:string})=>p.captureId)).toEqual([f.capture.id]);expect(await db.client.fundamentalRawCapture.count()).toBe(2);
 }finally{await db.close();}
},30_000);
it('all artifact/member writes reject update/delete/replace and restrictive FK violations',async()=>{
 const db=await testDatabase();try{
  const {f,build}=await setup(db);await build.run(f.request);
  for(const table of ['fundamental_availability_assessment','fundamental_snapshot_content','fundamental_snapshot_run','fundamental_snapshot_member']){
   await expect(db.client.$executeRawUnsafe(`UPDATE ${table} SET ${table==='fundamental_snapshot_content'?'manifest':table==='fundamental_snapshot_member'?'selected':'body'}='{}'`)).rejects.toThrow();
   await expect(db.client.$executeRawUnsafe(`DELETE FROM ${table}`)).rejects.toThrow();await expect(db.client.$executeRawUnsafe(`INSERT OR REPLACE INTO ${table} SELECT * FROM ${table}`)).rejects.toThrow();
  }
  await expect(db.client.fundamentalSnapshotMember.create({data:{runId:f.request.runId,observationId:'missing-fact',assessmentId:f.assessment.id,selected:true}})).rejects.toThrow();
  await expect(db.client.fundamentalSnapshotRun.create({data:{runId:'missing-content',contentHash:'0'.repeat(64),builtAt:f.request.builtAt,body:'{}',bodyHash:'0'.repeat(64)}})).rejects.toThrow();
  expect(await db.client.$queryRawUnsafe('PRAGMA foreign_key_check')).toEqual([]);
 }finally{await db.close();}
},30_000);
it('detects run/manifest/member tampering even if the attacker recomputes transport body hashes',async()=>{
 const db=await testDatabase();try{
  const {f,snapshots,build}=await setup(db),s=await build.run(f.request),row=await db.client.fundamentalSnapshotRun.findUniqueOrThrow({where:{runId:f.request.runId}}),forged=JSON.parse(row.body);forged.provenance[0].payloadHash='0'.repeat(64);
  forged.snapshot.request.runId='forged-run';await db.client.fundamentalSnapshotRun.create({data:{runId:'forged-run',contentHash:s.contentHash,builtAt:f.request.builtAt,body:canonicalJson(forged),bodyHash:snapshotHash(forged)}});
  await db.client.fundamentalSnapshotMember.create({data:{runId:'forged-run',observationId:f.observation.id,assessmentId:f.assessment.id,selected:true}});await expect(snapshots.findRun('forged-run')).rejects.toThrow();
  await db.client.$executeRawUnsafe('DROP TRIGGER fundamental_snapshot_content_no_update');const manifest=JSON.parse(s.manifest);manifest.policy.version='forged-policy';const bytes=canonicalJson(manifest);await db.client.fundamentalSnapshotContent.update({where:{contentHash:s.contentHash},data:{manifest:bytes,manifestDigest:manifestDigest(bytes)}});
  await expect(snapshots.findRun(f.request.runId)).rejects.toThrow();await expect(build.run({...f.request,runId:'cannot-reuse-tampered-content'})).rejects.toThrow();
 }finally{await db.close();}
},30_000);
it('raw capture tampering is detected during replay and future builds, despite apparently valid content identity',async()=>{
 const db=await testDatabase();try{
  const {f,snapshots,build}=await setup(db);await build.run(f.request);
  await db.client.$executeRawUnsafe('DROP TRIGGER fundamental_raw_capture_no_update');await db.client.fundamentalRawCapture.update({where:{id:f.capture.id},data:{payloadHash:'0'.repeat(64)}});
  await expect(snapshots.findRun(f.request.runId)).rejects.toThrow();await expect(build.run({...f.request,runId:'raw-tamper-run'})).rejects.toThrow();
 }finally{await db.close();}
},30_000);
it('proposed registry/policy and request self-approval cannot produce a FORMAL run',async()=>{
 const db=await testDatabase();try{
  const {f,snapshots,build}=await setup(db);await expect(build.run({...f.request,scope:'FORMAL',policy:{...f.policy,governanceStatus:'APPROVED',approvalReference:'caller-self-approval'}})).rejects.toThrow();
  expect(await db.client.fundamentalSnapshotRun.count()).toBe(0);expect(await snapshots.findRun('nonexistent-run')).toBeNull();
 }finally{await db.close();}
},30_000);

it('persists derived membership with restrictive FKs and rejects output tampering through derivation replay',async()=>{
 const db=await testDatabase();try{
  const {f,facts,snapshots,build}=await setup(db),g=snapshotDerivationFixture(),c=loadDerivationCrosswalk(release),crosswalk={...c.crosswalk,registryHash:f.registry.registryHash,recordedAt:f.policy.recordedAt,effectiveDate:'2026-01-01'};
  for(const o of g.observations){const capture={...f.capture,id:o.rawCaptureId,importExecutionId:'batch-'+o.id},batch={...f.batch,id:capture.importExecutionId,captureIds:[capture.id]};await facts.appendImport(batch,[capture]);await facts.appendObservation(o);await snapshots.assess('assessment-'+o.id,o.id,f.policy,f.request.builtAt);}
  const request={id:g.request.derivedIds[0],scope:f.request.scope,securityId:f.observation.securityId,sector:f.observation.sector,metric:'FCF' as const,periodStart:f.observation.periodStart,periodEnd:f.observation.periodEnd,cyclical:false,operands:g.observations.map(o=>({id:'operand-'+o.id,operation:'REPORTED' as const,observationIds:[o.id],adjustment:null}))};
  const d=deriveFundamentals({request,recordedAt:f.request.builtAt,registry:f.registry,crosswalk,crosswalkHash:normalizationHash(crosswalk),observations:g.observations,hash:normalizationHash});await new PrismaFundamentalDerivation(db.client,f.registry).append(d);
  const s=await build.run(g.request);expect(s.derivedIds).toEqual([d.id]);expect(await snapshots.findRun(g.request.runId)).toEqual(s);expect(await db.client.fundamentalSnapshotDerivedMember.count()).toBe(1);
  for(const sql of ['UPDATE fundamental_snapshot_derived_member SET selected=0','DELETE FROM fundamental_snapshot_derived_member','INSERT OR REPLACE INTO fundamental_snapshot_derived_member SELECT * FROM fundamental_snapshot_derived_member'])await expect(db.client.$executeRawUnsafe(sql)).rejects.toThrow();
  await expect(db.client.fundamentalSnapshotDerivedMember.create({data:{runId:g.request.runId,derivationId:'missing-derivation',selected:true}})).rejects.toThrow();
  await db.client.$executeRawUnsafe('DROP TRIGGER fundamental_derivation_no_update');const bad={...d,value:'999'};await db.client.fundamentalDerivation.update({where:{id:d.id},data:{body:JSON.stringify(bad),bodyHash:normalizationHash(bad)}});await expect(snapshots.findRun(g.request.runId)).rejects.toThrow();
 }finally{await db.close();}
},30_000);
it('FORMAL availability requires an exact external policy hash binding and production methodology record',async()=>{
 const db=await testDatabase();try{
  // Entire governance bundle is a synthetic TEMP fixture; no repository release is approved by this test.
  const f=snapshotFixture('formal-contract'),registry=loadCanonicalRegistry({...f.registry.manifest,governanceStatus:'APPROVED',approvalReference:'synthetic-external-registry-approval'}),registryBinding={registryHash:registry.registryHash,crosswalkVersion:registry.manifest.crosswalkVersion,methodologyIdentity:registry.manifest.methodologyIdentity,approvalReference:registry.manifest.approvalReference!},policy={...f.policy,governanceStatus:'APPROVED' as const,approvalReference:'synthetic-external-policy-approval'},policyBinding={policyHash:snapshotHash(validateAvailabilityPolicy(policy)),approvalReference:policy.approvalReference,methodologyId:'synthetic-availability-method'};
  for(const [id,approvalReference,configurationReference] of [[registry.manifest.methodologyIdentity,registryBinding.approvalReference,'registry-sha256:'+registry.registryHash],[policyBinding.methodologyId,policyBinding.approvalReference,'availability-sha256:'+policyBinding.policyHash]])await db.client.methodologyRecord.create({data:{methodologyId:id,family:'SYNTHETIC_CONTRACT_TEST',semanticVersion:'1.0.0',approvalReference,governanceStatus:'APPROVED',intendedUse:'PRODUCTION',effectiveDate:'2026-01-01',configurationReference,implementationIdentity:'synthetic-only-availability-implementation',governingDocumentReference:'synthetic-only-authority',recordedAt:f.policy.recordedAt}});
  const o={...f.observation,scope:'FORMAL' as const,registryHash:registry.registryHash},facts=new PrismaFundamentals(db.client,registry,registryBinding);await db.client.security.create({data:{id:o.securityId,name:'Synthetic governance fixture'}});await facts.appendSource(f.source);await facts.appendImport(f.batch,[f.capture]);await facts.appendObservation(o);
  const absent=new PrismaFundamentalSnapshot(db.client,registry,registryBinding);await expect(absent.assess(f.assessment.id,o.id,policy,f.assessment.assessedAt)).rejects.toThrow();
  const wrong=new PrismaFundamentalSnapshot(db.client,registry,registryBinding,{...policyBinding,policyHash:'0'.repeat(64)});await expect(wrong.assess(f.assessment.id,o.id,policy,f.assessment.assessedAt)).rejects.toThrow();
  const bound=new PrismaFundamentalSnapshot(db.client,registry,registryBinding,policyBinding);await bound.assess(f.assessment.id,o.id,policy,f.assessment.assessedAt);const request={...f.request,scope:'FORMAL' as const,policy};const s=await bound.seal(request);expect(s.members).toHaveLength(1);expect(await bound.findRun(request.runId)).toEqual(s);expect(JSON.parse(s.manifest).scoringReadiness).toBe('DEFERRED_SLICE_06');
  await expect(absent.findRun(request.runId)).rejects.toThrow();await expect(bound.seal({...request,runId:'changed-policy',policy:{...policy,version:'unbound-policy-v2'}})).rejects.toThrow();
 }finally{await db.close();}
},30_000);
