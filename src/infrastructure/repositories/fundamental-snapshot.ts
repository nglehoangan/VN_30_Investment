import type { PrismaClient, Prisma } from '@/infrastructure/db/generated/client';
import type { FundamentalSnapshotRepository } from '@/ports/fundamentals';
import type { RegistryRelease,RegistryApprovalBinding } from '@/domain/fundamentals/contracts';
import type { AvailabilityPolicy,AvailabilityAssessment } from '@/domain/fundamentals/availability';
import { assessAvailability,validateAvailabilityPolicy } from '@/domain/fundamentals/availability';
import type { SnapshotRequest,FundamentalSnapshot } from '@/domain/fundamentals/snapshot';
import { buildFundamentalSnapshot,validateSnapshotRequest,canonicalJson } from '@/domain/fundamentals/snapshot';
import { requireFundamental,fundamentalId } from '@/domain/fundamentals/validation';
import { loadCanonicalRegistry,verifyRegistryApproval } from '@/infrastructure/fundamentals/canonical-registry';
import { snapshotHash,manifestDigest } from '@/infrastructure/fundamentals/snapshot-hash';
import { PrismaFundamentals } from './fundamentals';
import { PrismaFundamentalDerivation } from './fundamental-derivation';
import { PrismaMethodologyRegistry } from './methodology-registry';
import { methodologyId } from '@/shared/ids';
import { DataIntegrityError } from '@/shared/errors';
export interface AvailabilityApprovalBinding {readonly policyHash:string;readonly approvalReference:string;readonly methodologyId:string}
/** Trusted composition supplies external approval bindings; request JSON cannot approve its own policy. */
export class PrismaFundamentalSnapshot implements FundamentalSnapshotRepository {
  constructor(private readonly client:PrismaClient,private readonly registry:RegistryRelease=loadCanonicalRegistry(),private readonly registryBinding:RegistryApprovalBinding|null=null,private readonly policyBinding:AvailabilityApprovalBinding|null=null){}
  private async governance(tx:Prisma.TransactionClient,scope:string,policy:AvailabilityPolicy,knownAt:string){
    if(scope!=='FORMAL')return;
    const registryMethod=await new PrismaMethodologyRegistry(tx).findById(methodologyId(this.registry.manifest.methodologyIdentity));
    verifyRegistryApproval(this.registry,this.registryBinding,registryMethod);
    const b=this.policyBinding;
    requireFundamental(b&&b.policyHash===snapshotHash(validateAvailabilityPolicy(policy))&&b.approvalReference===policy.approvalReference&&policy.governanceStatus==='APPROVED','AVAILABILITY_EXTERNAL_APPROVAL_REQUIRED');
    const method=await new PrismaMethodologyRegistry(tx).findById(methodologyId(b!.methodologyId));
    requireFundamental(method&&method.governanceStatus==='APPROVED'&&method.intendedUse==='PRODUCTION'&&method.approvalReference===b!.approvalReference&&method.configurationReference==='availability-sha256:'+b!.policyHash&&method.recordedAt<=knownAt&&registryMethod!.recordedAt<=knownAt&&method.effectiveDate<=knownAt.slice(0,10)&&registryMethod!.effectiveDate<=knownAt.slice(0,10),'AVAILABILITY_METHOD_BINDING');
  }
  async assess(id:string,observationId:string,policy:AvailabilityPolicy,assessedAt:string){
    try{return await this.client.$transaction(async tx=>{
      const facts=new PrismaFundamentals(tx,this.registry,this.registryBinding),o=await facts.findObservation(observationId);
      requireFundamental(o,'AVAILABILITY_FACT_NOT_FOUND');await this.governance(tx,o!.scope,policy,assessedAt);
      const a=assessAvailability({id,observation:o!,registry:this.registry,policy,assessedAt,hash:snapshotHash});
      await tx.fundamentalAvailabilityAssessment.create({data:{id:a.id,observationId:a.observationId,policyVersion:a.policy.version,availableAt:a.availableAt,assessedAt:a.assessedAt,body:canonicalJson(a),bodyHash:snapshotHash(a)}});return a;
    });}catch(error){throw new DataIntegrityError({cause:error});}
  }
  private async load(tx:Prisma.TransactionClient,request:SnapshotRequest){
    const r=validateSnapshotRequest(request),cutoff=r.mode==='AS_REVISED'?r.revisionCutoff!:[r.systemKnownAt,r.fundamentalCutoff].sort()[0];
    await this.governance(tx,r.scope,r.policy,cutoff);
    const facts=new PrismaFundamentals(tx,this.registry,this.registryBinding);
    // Enumerate in storage; callers cannot hide eligible conflicts by omitting candidate IDs.
    const rows=await tx.fundamentalObservation.findMany({where:{ingestedAt:{lte:cutoff},securityId:{in:[...new Set(r.requirements.map(q=>q.securityId))]},itemId:{in:[...new Set(r.requirements.map(q=>q.itemId))]}},orderBy:{id:'asc'}});
    const matching=rows.filter(o=>r.requirements.some(q=>q.securityId===o.securityId&&q.itemId===o.itemId&&q.reportingScope===o.reportingScope&&q.periodStart===o.periodStart&&q.periodEnd===o.periodEnd));
    const observations=await Promise.all(matching.map(async row=>{const o=await facts.findObservation(row.id);requireFundamental(o,'SNAPSHOT_FACT_NOT_FOUND');return o!;}));
    const applicable=observations.filter(o=>o.scope===r.scope&&r.requirements.some(q=>q.securityId===o.securityId&&q.itemId===o.itemId&&q.reportingScope===o.reportingScope&&q.periodStart===o.periodStart&&q.periodEnd===o.periodEnd));
    const assessments=await Promise.all(r.assessmentPins.map(async pin=>{
      const row=await tx.fundamentalAvailabilityAssessment.findUnique({where:{id:pin.assessmentId}});requireFundamental(row,'SNAPSHOT_ASSESSMENT_NOT_FOUND');
      requireFundamental(manifestDigest(row!.body)===row!.bodyHash,'ASSESSMENT_BODY_INTEGRITY');
      const a=JSON.parse(row!.body) as AvailabilityAssessment;
      requireFundamental(a.id===row!.id&&a.observationId===row!.observationId&&pin.observationId===row!.observationId&&a.policy.version===row!.policyVersion&&a.availableAt===row!.availableAt&&a.assessedAt===row!.assessedAt,'ASSESSMENT_INDEX_BINDING');return a;
    }));
    const derived=await Promise.all(r.derivedIds.map(async id=>{const d=await new PrismaFundamentalDerivation(tx,this.registry,this.registryBinding).find(id);requireFundamental(d,'SNAPSHOT_DERIVATION_NOT_FOUND');return d!;}));
    const snapshot=buildFundamentalSnapshot(r,{registry:this.registry,observations:applicable,assessments,derived},snapshotHash);
    const provenance=await Promise.all(applicable.map(async o=>{
      const row=await tx.fundamentalObservation.findUniqueOrThrow({where:{id:o.id}}),capture=await facts.findCapture(o.rawCaptureId);
      requireFundamental(capture,'SNAPSHOT_RAW_NOT_FOUND');
      const verifiedSource=await facts.findSource(o.sourceVersionId);requireFundamental(verifiedSource,'SNAPSHOT_SOURCE_NOT_FOUND');
      const raw=await tx.fundamentalRawCapture.findUniqueOrThrow({where:{id:o.rawCaptureId}}),source=await tx.fundamentalSourceVersion.findUniqueOrThrow({where:{id:o.sourceVersionId}}),batch=await facts.findImport(capture!.importExecutionId);
      requireFundamental(batch,'SNAPSHOT_IMPORT_NOT_FOUND');
      const importRow=await tx.fundamentalImportBatch.findUniqueOrThrow({where:{id:batch!.id}});
      return {observationId:o.id,observationBodyHash:row.bodyHash,semanticBodyHash:snapshotHash(o),captureId:raw.id,captureBodyHash:raw.bodyHash,payloadHash:capture!.payloadHash,sourceVersionId:source.id,sourceBodyHash:source.bodyHash,importId:batch!.id,importBodyHash:importRow.bodyHash,importHash:snapshotHash(batch),assessmentId:assessments.find(a=>a.observationId===o.id)!.id};
    }));
    return {snapshot,provenance,derivedIntegrity:derived.map(d=>({id:d.id,bodyHash:snapshotHash(d)})).sort((a,b)=>a.id<b.id?-1:1),manifestDigest:manifestDigest(snapshot.manifest)};
  }
  async seal(request:SnapshotRequest):Promise<FundamentalSnapshot>{
    const r=validateSnapshotRequest(request);
    try{return await this.client.$transaction(async tx=>{
      const envelope=await this.load(tx,r),s=envelope.snapshot;
      const existing=await tx.fundamentalSnapshotContent.findUnique({where:{contentHash:s.contentHash}});
      if(existing)requireFundamental(existing.manifest===s.manifest&&existing.manifestDigest===envelope.manifestDigest,'SNAPSHOT_CONTENT_REUSE_INTEGRITY');
      else await tx.fundamentalSnapshotContent.create({data:{contentHash:s.contentHash,manifest:s.manifest,manifestDigest:envelope.manifestDigest}});
      await tx.fundamentalSnapshotRun.create({data:{runId:r.runId,contentHash:s.contentHash,builtAt:r.builtAt,body:canonicalJson(envelope),bodyHash:snapshotHash(envelope)}});
      for(const p of r.assessmentPins)await tx.fundamentalSnapshotMember.create({data:{runId:r.runId,...p,selected:s.members.some(m=>m.observationId===p.observationId)}});
      for(const derivationId of r.derivedIds)await tx.fundamentalSnapshotDerivedMember.create({data:{runId:r.runId,derivationId,selected:s.derivedIds.includes(derivationId)}});
      return s;
    });}catch(error){throw new DataIntegrityError({cause:error});}
  }
  async findRun(runId:string){
    fundamentalId(runId);
    try{return await this.client.$transaction(async tx=>{
      const row=await tx.fundamentalSnapshotRun.findUnique({where:{runId},include:{content:true,members:{orderBy:{observationId:'asc'}},derivedMembers:{orderBy:{derivationId:'asc'}}}});if(!row)return null;
      requireFundamental(manifestDigest(row.body)===row.bodyHash,'SNAPSHOT_RUN_BODY_INTEGRITY');
      const saved=JSON.parse(row.body) as Awaited<ReturnType<PrismaFundamentalSnapshot['load']>>;
      requireFundamental(saved.snapshot.request.runId===row.runId&&saved.snapshot.request.builtAt===row.builtAt&&saved.snapshot.contentHash===row.contentHash&&saved.snapshot.manifest===row.content.manifest&&manifestDigest(row.content.manifest)===row.content.manifestDigest&&snapshotHash(JSON.parse(row.content.manifest))===row.contentHash,'SNAPSHOT_RUN_CONTENT_BINDING');
      const expected=saved.snapshot.request.assessmentPins.map(p=>({runId,...p,selected:saved.snapshot.members.some(m=>m.observationId===p.observationId)})).sort((a,b)=>a.observationId<b.observationId?-1:1);
      requireFundamental(canonicalJson(expected)===canonicalJson(row.members),'SNAPSHOT_MEMBER_BINDING');
      const expectedDerived=saved.snapshot.request.derivedIds.map(derivationId=>({runId,derivationId,selected:saved.snapshot.derivedIds.includes(derivationId)})).sort((a,b)=>a.derivationId<b.derivationId?-1:1);
      requireFundamental(canonicalJson(expectedDerived)===canonicalJson(row.derivedMembers),'SNAPSHOT_DERIVED_MEMBER_BINDING');
      const replay=await this.load(tx,saved.snapshot.request);
      requireFundamental(canonicalJson(replay)===canonicalJson(saved),'SNAPSHOT_RUN_REPLAY_MISMATCH');return replay.snapshot;
    });}catch(error){throw new DataIntegrityError({cause:error});}
  }
}
