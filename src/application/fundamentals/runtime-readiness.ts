import type { FundamentalRepository, FundamentalSnapshotRepository } from '@/ports/fundamentals';
import type { RuntimeEvidenceAuthority } from '@/ports/runtime-readiness';
import type { FormalPreparation } from '@/domain/fundamentals/runtime-provenance';
import { prepareFormalObservation } from '@/domain/fundamentals/runtime-provenance';
import { bindRuntimeAuthority, type RuntimeAuthorityKind } from '@/domain/fundamentals/runtime-authority';
import { requireFundamental } from '@/domain/fundamentals/validation';
import { canonicalJson, buildFundamentalSnapshot, type SnapshotRequest, type SnapshotInputs } from '@/domain/fundamentals/snapshot';
import { buildIssuerDossier } from '@/domain/fundamentals/runtime-dossier';
import { deriveFundamentals, type DerivationRequest, type DerivationCrosswalk } from '@/domain/fundamentals/derivation';
import { deepFreeze } from '@/domain/portfolio/transaction';

export interface RuntimePartition { readonly members:readonly {readonly securityId:string;readonly state:'SCORABLE'|'DEFERRED'}[] }
/** Orchestrates existing contracts. No scoring, portfolio, order, approval or head-write dependency. */
export class RuntimeReadiness {
  constructor(private readonly authorities:RuntimeEvidenceAuthority,private readonly hash:(v:unknown)=>string,private readonly digest:(v:string)=>string){}
  private async active(hash:string,kind:RuntimeAuthorityKind,asOf:string,knownAt:string,seen=new Set<string>()) {
    requireFundamental(!seen.has(hash),'RUNTIME_AUTHORITY_DEPENDENCY_CYCLE');seen.add(hash);
    const selected=await this.authorities.authority(hash);
    requireFundamental(selected&&selected.pin.kind===kind&&selected.pin.hash===hash,'RUNTIME_AUTHORITY_MISSING');
    const active=bindRuntimeAuthority(selected.pin,selected.method,asOf,knownAt);
    for(const dependency of selected.pin.dependencies){const next=await this.authorities.authority(dependency);requireFundamental(next,'RUNTIME_AUTHORITY_DEPENDENCY_MISSING');await this.active(dependency,next.pin.kind,asOf,knownAt,new Set(seen));}
    return active;
  }
  async prepareObservation(input:FormalPreparation) {
    const lineage=await this.authorities.lineage(this.hash(input.receipt));
    requireFundamental(lineage&&canonicalJson(lineage)===canonicalJson(input.receipt),'TRUSTED_LINEAGE_PUBLICATION_RECEIPT_REQUIRED');
    await this.active(input.registry.registryHash,'registry',input.asOf,input.knownAt);
    await this.active(this.hash(input.policy),'availability',input.asOf,input.knownAt);
    requireFundamental(input.receipt.authorityHash===input.registry.registryHash,'LINEAGE_REGISTRY_AUTHORITY_MISMATCH');
    return prepareFormalObservation(input,this.hash,this.digest);
  }
  async admitObservation(input:FormalPreparation,repository:FundamentalRepository) {
    const prepared=await this.prepareObservation(input);
    const [source,capture,batch]=await Promise.all([repository.findSource(input.source.id),repository.findCapture(input.capture.id),repository.findImport(input.batch.id)]);
    requireFundamental(source&&capture&&batch&&this.hash(source)===this.hash(input.source)&&this.hash(capture)===this.hash(input.capture)&&this.hash(batch)===this.hash(input.batch),'PERSISTED_SOURCE_IMPORT_REQUIRED');
    await repository.appendObservation(prepared.observation);return prepared;
  }
  async derive(input:{request:DerivationRequest;recordedAt:string;crosswalk:DerivationCrosswalk;sources:SnapshotInputs;asOf:string;knownAt:string}) {
    const {sources,knownAt,asOf}=input;
    const registryAuthority=await this.active(sources.registry.registryHash,'registry',asOf,knownAt);
    const formulaAuthority=await this.active(this.hash(input.crosswalk),'derivation-crosswalk',asOf,knownAt);
    const result=deriveFundamentals({request:input.request,recordedAt:input.recordedAt,registry:sources.registry,crosswalk:input.crosswalk,crosswalkHash:this.hash(input.crosswalk),observations:sources.observations,hash:this.hash});
    const ids=[...new Set(input.request.operands.flatMap(o=>o.observationIds))];
    const available=ids.map(id=>{const o=sources.observations.find(o=>o.id===id),a=sources.assessments.find(a=>a.observationId===id);
      requireFundamental(o&&a&&a.observationHash===this.hash(o)&&a.status==='VERIFIED'&&a.availableAt!==null&&a.availableAt<=knownAt,'DERIVATION_OPERAND_AVAILABILITY_REQUIRED');
      return a.availableAt!;
    });
    const derivedKnownAt=[...available,registryAuthority.method.recordedAt,formulaAuthority.method.recordedAt,input.crosswalk.recordedAt,...input.request.operands.flatMap(o=>o.adjustment?[o.adjustment.reviewedAt]:[])].sort().at(-1)!;
    requireFundamental(derivedKnownAt<=knownAt&&input.recordedAt>=derivedKnownAt&&input.recordedAt<=asOf&&result.status==='CALCULATED','DERIVATION_FUTURE_OR_UNAVAILABLE');
    return deepFreeze({assessment:result,derivationHash:this.hash(result),knownAt:derivedKnownAt,operands:result.inputHashes,methodHash:this.hash(input.crosswalk)});
  }
  async snapshot(request:SnapshotRequest,sources:SnapshotInputs,partition:RuntimePartition,readinessHash:string,lineagePreparations:readonly FormalPreparation[]) {
    requireFundamental(request.scope==='FORMAL'&&request.mode==='AS_KNOWN'&&request.revisionCutoff===null,'FORMAL_AS_KNOWN_REQUIRED');
    const universe=request.references.find(r=>r.kind==='UNIVERSE')?.content??[];
    requireFundamental(partition.members.length===30&&new Set(partition.members.map(m=>m.securityId)).size===30&&partition.members.every(m=>universe.includes(m.securityId))&&
      partition.members.filter(m=>m.state==='SCORABLE').length===29&&partition.members.filter(m=>m.state==='DEFERRED').length===1,'RUNTIME_29_1_PARTITION_REQUIRED');
    requireFundamental(request.requirements.every(q=>partition.members.find(m=>m.securityId===q.securityId)?.state==='SCORABLE'),'DEFERRED_SNAPSHOT_INPUT_FORBIDDEN');
    requireFundamental(partition.members.filter(m=>m.state==='SCORABLE').every(m=>request.requirements.some(q=>q.securityId===m.securityId)),'ELIGIBLE_REQUIREMENTS_INCOMPLETE');
    const pins=[sources.registry.registryHash,this.hash(request.policy),readinessHash];
    await this.active(pins[0],'registry',request.decisionAsOf,request.systemKnownAt);
    await this.active(pins[1],'availability',request.decisionAsOf,request.systemKnownAt);
    await this.active(pins[2],'readiness-requirements',request.decisionAsOf,request.systemKnownAt);
    for(const o of sources.observations){
      requireFundamental(partition.members.find(m=>m.securityId===o.securityId)?.state==='SCORABLE','DEFERRED_SNAPSHOT_INPUT_FORBIDDEN');
      const p=lineagePreparations.find(p=>this.hash(p.observation)===this.hash(o));
      requireFundamental(p&&p.asOf===request.decisionAsOf&&p.knownAt===request.systemKnownAt&&p.registry.registryHash===sources.registry.registryHash&&this.hash(p.policy)===this.hash(request.policy),'SNAPSHOT_FORMAL_LINEAGE_REQUIRED');
      await this.prepareObservation(p);
    }
    const s=buildFundamentalSnapshot(request,sources,this.hash);
    const dossiers=partition.members.filter(m=>m.state==='SCORABLE').map(m=>buildIssuerDossier(m.securityId,m.state,s,sources,this.hash));
    const body={contract:'runtime-readiness-envelope-v1',snapshot:s,authorityHashes:pins,partitionHash:this.hash(partition),lineageHashes:lineagePreparations.map(p=>this.hash(p.receipt)).sort(),
      availabilityHashes:s.members.map(m=>this.hash(sources.assessments.find(a=>a.id===m.assessmentId))),
      derivationHashes:s.derivedIds.map(id=>this.hash(sources.derived.find(d=>d.id===id))),dossiers,
      state:s.blockers.length?'MISSING_REQUIRED_INPUT':'EVIDENCE_PREPARED_HUMAN_REVIEW_REQUIRED',readyForScoring:false};
    return deepFreeze({...body,contentHash:this.hash(body)});
  }
  /** Repository enumerates complete persisted candidates and seals immutable source/import provenance. */
  async sealSnapshot(request:SnapshotRequest,sources:SnapshotInputs,partition:RuntimePartition,readinessHash:string,lineagePreparations:readonly FormalPreparation[],repository:FundamentalSnapshotRepository) {
    const envelope=await this.snapshot(request,sources,partition,readinessHash,lineagePreparations);
    requireFundamental(envelope.snapshot.blockers.length===0,'RUNTIME_SNAPSHOT_INPUTS_INCOMPLETE');
    const sealed=await repository.seal(request);requireFundamental(sealed.contentHash===envelope.snapshot.contentHash,'RUNTIME_PERSISTED_CANDIDATE_SET_CHANGED');return sealed;
  }
}
