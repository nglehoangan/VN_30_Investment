// @vitest-environment node
import {it,expect} from 'vitest';
import {dateOnlyEvidenceFixture} from '../fixtures/availability-evidence';
import {testDatabase} from '../fixtures/database';
import {PrismaFundamentals} from '@/infrastructure/repositories/fundamentals';
import {PrismaFundamentalSnapshot} from '@/infrastructure/repositories/fundamental-snapshot';
import {loadCanonicalRegistry} from '@/infrastructure/fundamentals/canonical-registry';
import {snapshotHash} from '@/infrastructure/fundamentals/snapshot-hash';
import {canonicalJson} from '@/domain/fundamentals/snapshot';
import {validateAvailabilityPolicy,isEvidenceAssessment} from '@/domain/fundamentals/availability';
import {openDatabase} from '@/infrastructure/db/client';
async function setup(db:Awaited<ReturnType<typeof testDatabase>>){
 const f=dateOnlyEvidenceFixture(),facts=new PrismaFundamentals(db.client,f.registry);
 await db.client.security.create({data:{id:f.observation.securityId,name:'Synthetic evidence issuer'}});
 await facts.appendSource(f.source);await facts.appendImport(f.batch,[f.capture]);await facts.appendObservation(f.observation);
 return f;
}
it('persists trusted boundaries and independently verifies authority on reopen; missing composition fails closed',async()=>{
 const db=await testDatabase();try{
  const f=await setup(db),bound=new PrismaFundamentalSnapshot(db.client,f.registry,null,null,[f.providerEvidenceBinding]);
  const a=await bound.assess(f.assessment.id,f.observation.id,f.policy,f.assessment.assessedAt);expect(a).toEqual(f.assessment);
  const s=await bound.seal(f.request);expect(s.members).toHaveLength(1);expect(await bound.findRun(f.request.runId)).toEqual(s);
  await expect(new PrismaFundamentalSnapshot(db.client,f.registry).findRun(f.request.runId)).rejects.toThrow();
  await db.client.$disconnect();const reopened=await openDatabase(db.config);try{expect(await new PrismaFundamentalSnapshot(reopened,f.registry,null,null,[f.providerEvidenceBinding]).findRun(f.request.runId)).toEqual(s);}finally{await reopened.$disconnect();}
 }finally{await db.close();}
},30_000);
it('adding a trusted binding does not reinterpret pinned fallback or legacy artifacts; new assessment has a separate identity',async()=>{
 const db=await testDatabase();try{
  const f=await setup(db),plain=new PrismaFundamentalSnapshot(db.client,f.registry),bound=new PrismaFundamentalSnapshot(db.client,f.registry,null,null,[f.providerEvidenceBinding]);
  const fallback=await plain.assess(f.assessment.id,f.observation.id,f.policy,f.assessment.assessedAt),first=await plain.seal(f.request);expect(fallback.availableAt).toBe('2026-07-25T17:00:00.000Z');expect(first.members).toEqual([]);expect(await bound.findRun(f.request.runId)).toEqual(first);
  const {dateOnlyEvidenceClasses:discarded,...base}=f.policy;expect(discarded).toEqual(['TRUSTED_PROVIDER_RECEIPT']);const legacy={...base,algorithm:'operational-max-v1' as const};
  const old=await plain.assess('legacy-assessment',f.observation.id,legacy,f.assessment.assessedAt),legacyRequest={...f.request,runId:'legacy-run',policy:legacy,assessmentPins:[{observationId:f.observation.id,assessmentId:old.id}]},oldRun=await plain.seal(legacyRequest);expect(old).not.toHaveProperty('evidenceInputs');expect(JSON.parse(oldRun.manifest).contract).toBe('fundamental-snapshot-content-v1');expect(await bound.findRun(oldRun.request.runId)).toEqual(oldRun);
  const strong=await bound.assess('strong-assessment',f.observation.id,f.policy,f.assessment.assessedAt),second=await bound.seal({...f.request,runId:'strong-run',assessmentPins:[{observationId:f.observation.id,assessmentId:strong.id}]});expect(second.members).toHaveLength(1);expect(second.contentHash).not.toBe(first.contentHash);expect(await bound.findRun(first.request.runId)).toEqual(first);
 }finally{await db.close();}
},30_000);
it('source/provider/hash/receipt mismatches reject governed input without persisting any assessment',async()=>{
 const db=await testDatabase();try{
  const f=await setup(db),b=f.providerEvidenceBinding;
  for(const authority of [{...b.authority,provider:'different-provider'},{...b.authority,sourceHash:'0'.repeat(64)},{...b.authority,sourceVersionId:'missing-source'}]){
   const repo=new PrismaFundamentalSnapshot(db.client,f.registry,null,null,[{...b,authority}]);await expect(repo.assess('bad-authority',f.observation.id,f.policy,f.assessment.assessedAt)).rejects.toThrow();
  }
  for(const receipt of [{...b.receipt,evidenceReference:'other-receipt'},{...b.receipt,receivedAt:'2026-07-25T14:59:00.000Z'},{...b.receipt,knownAt:'2026-08-01T00:00:00.000Z'}]){
   const repo=new PrismaFundamentalSnapshot(db.client,f.registry,null,null,[{...b,receipt}]);await expect(repo.assess('bad-receipt',f.observation.id,f.policy,f.assessment.assessedAt)).rejects.toThrow();
  }
  expect(await db.client.fundamentalAvailabilityAssessment.count()).toBe(0);
 }finally{await db.close();}
},30_000);
it('a forged stored trusted assessment cannot create authority even with a recomputed body hash',async()=>{
 const db=await testDatabase();try{
  const f=await setup(db),a=f.assessment;await db.client.fundamentalAvailabilityAssessment.create({data:{id:a.id,observationId:a.observationId,policyVersion:a.policy.version,availableAt:a.availableAt,assessedAt:a.assessedAt,body:canonicalJson(a),bodyHash:snapshotHash(a)}});
  const plain=new PrismaFundamentalSnapshot(db.client,f.registry);await expect(plain.seal(f.request)).rejects.toThrow();await expect(plain.seal({...f.request,providerEvidenceBindings:[f.providerEvidenceBinding]} as unknown as typeof f.request)).rejects.toThrow();expect(await db.client.fundamentalSnapshotContent.count()).toBe(0);expect(await db.client.fundamentalSnapshotRun.count()).toBe(0);
 }finally{await db.close();}
},30_000);
it('FORMAL v2 requires independent exact registry, policy and publicly receivable provider methodology bindings',async()=>{
 const db=await testDatabase();try{
  // Approved metadata exists only in this isolated synthetic DB.
  const f=dateOnlyEvidenceFixture('formal-evidence'),registry=loadCanonicalRegistry({...f.registry.manifest,governanceStatus:'APPROVED',approvalReference:'synthetic-registry-approval'}),registryBinding={registryHash:registry.registryHash,crosswalkVersion:registry.manifest.crosswalkVersion,methodologyIdentity:registry.manifest.methodologyIdentity,approvalReference:registry.manifest.approvalReference!},policyBinding={policyHash:snapshotHash(validateAvailabilityPolicy(f.policy)),approvalReference:f.policy.approvalReference!,methodologyId:'synthetic-policy-method'},o={...f.observation,scope:'FORMAL' as const,registryHash:registry.registryHash},b={...f.providerEvidenceBinding,receipt:{...f.providerEvidenceBinding.receipt,observationHash:snapshotHash(o)}};
  const method=(id:string,approvalReference:string,configurationReference:string)=>({methodologyId:id,family:'SYNTHETIC_CONTRACT_TEST',semanticVersion:'1.0.0',approvalReference,governanceStatus:'APPROVED' as const,intendedUse:'PRODUCTION' as const,effectiveDate:'2026-01-01',configurationReference,implementationIdentity:'synthetic-only-evidence-implementation',governingDocumentReference:'synthetic-only-authority',recordedAt:f.policy.recordedAt});
  for(const data of [method(registry.manifest.methodologyIdentity,registryBinding.approvalReference,'registry-sha256:'+registry.registryHash),method(policyBinding.methodologyId,policyBinding.approvalReference,'availability-sha256:'+policyBinding.policyHash)])await db.client.methodologyRecord.create({data});
  const facts=new PrismaFundamentals(db.client,registry,registryBinding);await db.client.security.create({data:{id:o.securityId,name:'Synthetic formal issuer'}});await facts.appendSource(f.source);await facts.appendImport(f.batch,[f.capture]);await facts.appendObservation(o);
  const bound=new PrismaFundamentalSnapshot(db.client,registry,registryBinding,policyBinding,[b]);await expect(bound.assess(f.assessment.id,o.id,f.policy,f.assessment.assessedAt)).rejects.toThrow();expect(await db.client.fundamentalAvailabilityAssessment.count()).toBe(0);
  await db.client.methodologyRecord.create({data:method(b.authority.methodologyIdentity,b.authority.approvalReference,'provider-receipt-authority-sha256:'+snapshotHash(b.authority))});
  const wrong={...b,authority:{...b.authority,version:'synthetic-unbound-version'}};await expect(new PrismaFundamentalSnapshot(db.client,registry,registryBinding,policyBinding,[wrong]).assess('unbound-version',o.id,f.policy,f.assessment.assessedAt)).rejects.toThrow();
  await expect(new PrismaFundamentalSnapshot(db.client,registry,registryBinding,null,[b]).assess('missing-policy',o.id,f.policy,f.assessment.assessedAt)).rejects.toThrow();
  const a=await bound.assess(f.assessment.id,o.id,f.policy,f.assessment.assessedAt);expect(isEvidenceAssessment(a)&&a.boundaryBasis).toBe('TRUSTED_PROVIDER_RECEIPT');const request={...f.request,scope:'FORMAL' as const},s=await bound.seal(request);expect(s.members).toHaveLength(1);expect(await bound.findRun(request.runId)).toEqual(s);expect(JSON.parse(s.manifest).scoringReadiness).toBe('DEFERRED_SLICE_06');
 }finally{await db.close();}
},30_000);
