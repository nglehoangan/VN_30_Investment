import type { RuntimeReviewerIdentity,HumanReviewStore } from '@/ports/runtime-readiness';
import type { DataInitializationAcceptance } from '@/domain/fundamentals/scoring-readiness-policy-b';
import { validateDIAcceptance,bindDIAcceptance,evaluateScoringReadiness } from '@/domain/fundamentals/scoring-readiness-policy-b';
import type { FundamentalSnapshot,SnapshotInputs } from '@/domain/fundamentals/snapshot';
import { canonicalJson } from '@/domain/fundamentals/snapshot';
import { assessmentReuseCandidate, type AssessmentContext } from '@/domain/fundamentals/runtime-review';
import { requireFundamental,fundamentalHash } from '@/domain/fundamentals/validation';
import { deepFreeze } from '@/domain/portfolio/transaction';
import { instant } from '@/shared/time';
import { buildIssuerDossier } from '@/domain/fundamentals/runtime-dossier';

export interface DatasetReviewPacket {
  readonly acceptance:DataInitializationAcceptance; readonly snapshot:FundamentalSnapshot; readonly sources:SnapshotInputs;
  readonly executableHash:string; readonly authorityHashes:readonly string[]; readonly dossierHashes:readonly string[];
  readonly marketHash:string; readonly reviews:readonly {readonly securityId:string;readonly rubricId:string;readonly reviewId:string;readonly reviewHash:string}[];
  /** Trusted M1 capability receipts for the exact three owner-gate envelopes per security. */
  readonly ownerGateBindings:readonly {readonly securityId:string;readonly inputGovernanceHash:string;readonly approvalReference:string}[];
}
export interface RuntimeDatasetAcceptanceWriter {
  /** Composition must configure the existing Policy-B repository's exact independent review binding and method registrations. */
  appendAcceptance(acceptance:DataInitializationAcceptance):Promise<void>;
}
/** Evidence packaging and independent review over the existing Policy-B acceptance; no score method exists here. */
export class AcceptRuntimeDataset {
  constructor(private readonly identity:RuntimeReviewerIdentity,private readonly reviews:HumanReviewStore,
    private readonly trustedOwnerGates:DatasetReviewPacket['ownerGateBindings'],private readonly writer:RuntimeDatasetAcceptanceWriter,
    private readonly now:()=>string,private readonly hash:(v:unknown)=>string,private readonly digest:(s:string)=>string){}
  async prepare(packet:DatasetReviewPacket) {
    const p=packet,a=validateDIAcceptance(p.acceptance,this.hash);bindDIAcceptance(a,p.snapshot,this.hash,this.digest);
    requireFundamental(a.contract==='independent-di-acceptance-v2'&&a.requirements.algorithm==='strict-canonical-m3-readiness-v2','POLICY_B_RUNTIME_ACCEPTANCE_REQUIRED');
    [p.executableHash,p.marketHash,...p.authorityHashes,...p.dossierHashes].forEach(fundamentalHash);
    requireFundamental(p.authorityHashes.length>=3&&p.dossierHashes.length===29&&new Set(p.dossierHashes).size===29,'DATASET_HASH_COVERAGE_REQUIRED');
    requireFundamental([p.sources.registry.registryHash,this.hash(p.snapshot.request.policy),a.requirementsHash].every(h=>p.authorityHashes.includes(h))&&
      p.marketHash===this.hash(p.snapshot.request.references.find(r=>r.kind==='MARKET')),'DATASET_AUTHORITY_MARKET_BINDING');
    const eligible=a.partialUniverse!.members.filter(m=>m.state==='SCORABLE');
    requireFundamental(eligible.length===29&&p.reviews.length===29*23&&new Set(p.reviews.map(r=>r.reviewId)).size===29*23,'COMPLETE_HUMAN_REVIEW_REQUIRED');
    requireFundamental(eligible.every(m=>p.dossierHashes.includes(buildIssuerDossier(m.securityId,'SCORABLE',p.snapshot,p.sources,this.hash).contentHash)),'DOSSIER_EXACT_HASH_BINDING');
    for(const t of a.tickers) {
      if(a.partialUniverse!.members.find(m=>m.securityId===t.securityId)!.state==='DEFERRED') {requireFundamental(t.input===null&&t.bridge===null,'DEFERRED_INPUT_FORBIDDEN');continue;}
      const i=t.input;requireFundamental(i&&i.assessments.length===23,'COMPLETE_HUMAN_REVIEW_REQUIRED');
      requireFundamental(p.reviews.filter(r=>r.securityId===t.securityId).length===23,'ISSUER_HUMAN_REVIEW_COVERAGE');
      for(const assessment of i.assessments) {
        const pin=p.reviews.find(r=>r.securityId===t.securityId&&r.rubricId===assessment.subcategory);
        const record=pin?await this.reviews.head(pin.reviewId):null;
        requireFundamental(record&&record.contentHash===pin!.reviewHash&&record.assessment&&canonicalJson(record.assessment)===canonicalJson(assessment),'REVIEWED_HUMAN_INPUT_REQUIRED');
        const context:AssessmentContext={...record.context,securityId:i.securityId,rubricId:assessment.subcategory,asOf:i.asOf,methodologyHash:this.hash(i.methodology),
          executableHash:p.executableHash,evidenceHashes:i.evidence.map(e=>this.hash(e)).sort(),derivationHashes:p.sources.derived.filter(d=>d.request.securityId===i.securityId&&p.snapshot.derivedIds.includes(d.id)).map(d=>this.hash(d)).sort(),
          sectorContextHash:this.hash(i.normalization),marketHash:p.marketHash};
        requireFundamental(assessmentReuseCandidate(record,context,a.acceptedAt,this.hash).eligibleForOwnerReview,'HUMAN_REVIEW_DEPENDENCIES_CHANGED');
      }
      const governanceHash=this.hash({stage0:i.stage0,hardVeto:i.hardVeto,residualRisk:i.residualRisk});
      requireFundamental(this.trustedOwnerGates.some(g=>g.securityId===t.securityId&&g.inputGovernanceHash===governanceHash&&g.approvalReference.trim())&&
        p.ownerGateBindings.some(g=>g.securityId===t.securityId&&g.inputGovernanceHash===governanceHash&&this.trustedOwnerGates.some(trusted=>canonicalJson(trusted)===canonicalJson(g))),'TRUSTED_CURRENT_OWNER_GATES_REQUIRED');
    }
    const readiness=evaluateScoringReadiness(a,p.snapshot,p.sources,this.hash);
    requireFundamental(readiness.filter(r=>r.readyForScoring).length===29&&eligible.every(m=>readiness.find(r=>r.securityId===m.securityId)?.readyForScoring),'RUNTIME_DATASET_NOT_READY');
    const evidence={contract:'runtime-independent-review-evidence-v1',snapshotHash:p.snapshot.contentHash,manifestDigest:this.digest(p.snapshot.manifest),
      authorityHashes:[...p.authorityHashes].sort(),availabilityHashes:p.sources.assessments.map(a=>this.hash(a)).sort(),derivationHashes:p.sources.derived.map(d=>this.hash(d)).sort(),
      dossierHashes:[...p.dossierHashes].sort(),reviewHashes:p.reviews.map(r=>r.reviewHash).sort(),ownerGateHashes:p.ownerGateBindings.map(g=>this.hash(g)).sort(),
      valuationContextHashes:a.tickers.flatMap(t=>t.input?[this.hash({expectedReturn:t.input.expectedReturn,normalization:t.input.normalization,evidence:t.input.evidence,stage0:t.input.stage0,hardVeto:t.input.hardVeto,residualRisk:t.input.residualRisk})]:[]).sort(),
      marketHash:p.marketHash,executableHash:p.executableHash,readyForScoring:false};
    requireFundamental(a.reviewArtifactReference==='runtime-review-evidence-sha256:'+this.hash(evidence),'INDEPENDENT_EVIDENCE_REFERENCE_REQUIRED');
    const body={contract:'runtime-independent-review-packet-v1',acceptanceHash:this.hash(a),evidence};
    return deepFreeze({...body,contentHash:this.hash(body)});
  }
  async accept(packet:DatasetReviewPacket,expectedPacketHash:string) {
    const actor=await this.identity.current(),at=this.now();instant(at);
    requireFundamental(actor.subject.trim()&&actor.sessionReference.trim()&&actor.roles.includes('INDEPENDENT_DATASET_REVIEWER'),'INDEPENDENT_REVIEWER_CAPABILITY_REQUIRED');
    requireFundamental(actor.subject===packet.acceptance.reviewerReference&&actor.subject!==packet.acceptance.producerReference,'PRODUCER_CANNOT_SELF_ACCEPT');
    requireFundamental(packet.acceptance.acceptedAt===at,'ACCEPTANCE_CURRENT_CLOCK_REQUIRED');
    const prepared=await this.prepare(packet);requireFundamental(prepared.contentHash===expectedPacketHash,'INDEPENDENT_PACKET_HASH_MISMATCH');
    await this.writer.appendAcceptance(packet.acceptance);
    return deepFreeze({status:'INDEPENDENT_ACCEPTANCE_RECORDED',acceptanceHash:this.hash(packet.acceptance),packetHash:prepared.contentHash,reviewer:actor.subject,sessionReference:actor.sessionReference,readyForScoring:false});
  }
}
