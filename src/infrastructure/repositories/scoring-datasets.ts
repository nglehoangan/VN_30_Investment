import type {PrismaClient} from '@/infrastructure/db/generated/client';
import type {ScoringDatasets,ScoringDatasetSelection,ScoringDatasetAuthorization,ScoringReadinessRead} from '@/ports/scoring';
import type {FundamentalRepository,FundamentalDerivationRepository,FundamentalSnapshotRepository} from '@/ports/fundamentals';
import type {RegistryRelease} from '@/domain/fundamentals/contracts';
import type {AvailabilityAssessment} from '@/domain/fundamentals/availability';
import type {ScoreInput,Scorecard} from '@/domain/scoring/scorecard';
import {calculateScorecard} from '@/domain/scoring/scorecard';
import {deepFreeze} from '@/domain/portfolio/transaction';
import {validateDIAcceptance,bindDIAcceptance,evaluateScoringReadiness,scoringInputSemantic,type DataInitializationAcceptance} from '@/domain/fundamentals/scoring-readiness';
import {exactReadinessFields} from '@/domain/fundamentals/scoring-bridge';
import {requireFundamental,fundamentalId,fundamentalHash} from '@/domain/fundamentals/validation';
import {canonicalJson} from '@/domain/fundamentals/snapshot';
import {snapshotHash,manifestDigest} from '@/infrastructure/fundamentals/snapshot-hash';
import {methodologyId} from '@/shared/ids';
import {PrismaMethodologyRegistry} from './methodology-registry';
import {PrismaAnalyticalArtifacts} from './analytical-artifacts';
import {snapshot} from '@/domain/scoring/validation';
/** External independent review capability, configured by trusted composition; never accepted in request JSON. */
export interface IndependentDIReviewBinding {readonly acceptanceHash:string;readonly reviewerReference:string;readonly approvalReference:string}
export class PrismaScoringDatasets implements ScoringDatasets, ScoringReadinessRead {
 private readonly reviewBindings:readonly IndependentDIReviewBinding[];
 constructor(private readonly client:PrismaClient,private readonly snapshots:FundamentalSnapshotRepository,private readonly facts:FundamentalRepository,private readonly derivations:FundamentalDerivationRepository,private readonly registry:RegistryRelease,reviewBindings:readonly IndependentDIReviewBinding[]=[]){
  this.reviewBindings=deepFreeze(snapshot(reviewBindings));for(const b of this.reviewBindings){exactReadinessFields(b,'acceptanceHash reviewerReference approvalReference');fundamentalHash(b.acceptanceHash);requireFundamental(b.reviewerReference.trim()&&b.approvalReference.trim(),'DI_REVIEW_BINDING_REFERENCE');}
 }
 private async verified(a:DataInitializationAcceptance){
  validateDIAcceptance(a);const hash=snapshotHash(a);
  requireFundamental(this.reviewBindings.some(b=>b.acceptanceHash===hash&&b.reviewerReference===a.reviewerReference&&b.approvalReference===a.approvalReference),'EXTERNAL_INDEPENDENT_DI_REVIEW_REQUIRED');
  const methods=new PrismaMethodologyRegistry(this.client),method=await methods.findById(methodologyId(a.methodologyId)),policy=await methods.findById(methodologyId(a.requirements.methodologyId));
  requireFundamental(method&&method.governanceStatus==='APPROVED'&&method.intendedUse==='PRODUCTION'&&method.approvalReference===a.approvalReference&&method.configurationReference==='di-acceptance-sha256:'+hash&&method.recordedAt<=a.acceptedAt&&method.effectiveDate<=a.acceptedAt.slice(0,10),'DI_EXTERNAL_METHODOLOGY_BINDING');
  const p=a.requirements;requireFundamental(policy&&policy.governanceStatus==='APPROVED'&&policy.intendedUse==='PRODUCTION'&&policy.approvalReference===p.approvalReference&&policy.configurationReference==='readiness-requirements-sha256:'+snapshotHash(p)&&policy.recordedAt<=p.recordedAt&&policy.effectiveDate<=p.effectiveDate,'READINESS_EXTERNAL_REQUIREMENTS_BINDING');
  requireFundamental(p.sectors.every(route=>route.requiredItems.every(id=>this.registry.manifest.items.some(item=>item.itemId===id&&item.status==='ACTIVE'&&item.sectorApplicability.includes(route.sector)))),'READINESS_APPROVED_CANONICAL_ITEM_ROUTE');
  const s=await this.snapshots.findRun(a.snapshotRunId);requireFundamental(s,'SEALED_DI_SNAPSHOT_REQUIRED');bindDIAcceptance(a,s!,snapshotHash,manifestDigest);
  requireFundamental(this.registry.registryHash===JSON.parse(s!.manifest).registry.registryHash,'READINESS_CANONICAL_REGISTRY_BINDING');return {a,s:s!};
 }
 async appendAcceptance(raw:DataInitializationAcceptance){
  const a=validateDIAcceptance(raw);requireFundamental(a.requirements.algorithm==='strict-canonical-m3-readiness-v2','NEW_DI_ACCEPTANCE_REQUIRES_READINESS_V2');await this.verified(a);
  await this.client.dataInitializationAcceptance.create({data:{id:a.id,snapshotRunId:a.snapshotRunId,acceptedAt:a.acceptedAt,body:canonicalJson(a),bodyHash:snapshotHash(a)}});
 }
 private async acceptance(id:string){
  fundamentalId(id);const row=await this.client.dataInitializationAcceptance.findUnique({where:{id}});requireFundamental(row,'DI_ACCEPTANCE_REQUIRED');
  const a=JSON.parse(row!.body) as DataInitializationAcceptance;requireFundamental(snapshotHash(a)===row!.bodyHash&&canonicalJson(a)===row!.body&&a.id===row!.id&&a.snapshotRunId===row!.snapshotRunId&&a.acceptedAt===row!.acceptedAt,'DI_ACCEPTANCE_BODY_INDEX_BINDING');return this.verified(a);
 }
 private async sources(s:Awaited<ReturnType<FundamentalSnapshotRepository['findRun']>>){
  requireFundamental(s,'READINESS_SNAPSHOT_REQUIRED');
  const observations=await Promise.all(s.members.map(async m=>{const o=await this.facts.findObservation(m.observationId);requireFundamental(o&&snapshotHash(o)===m.observationHash,'READINESS_OBSERVATION_INTEGRITY');return o!;}));
  const assessments=await Promise.all(s.members.map(async m=>{const row=await this.client.fundamentalAvailabilityAssessment.findUniqueOrThrow({where:{id:m.assessmentId}}),a=JSON.parse(row.body) as AvailabilityAssessment;requireFundamental(snapshotHash(a)===row.bodyHash&&a.id===m.assessmentId&&a.observationId===m.observationId,'READINESS_ASSESSMENT_INTEGRITY');return a;}));
  const derived=await Promise.all(s.derivedIds.map(async id=>{const d=await this.derivations.find(id);requireFundamental(d,'READINESS_DERIVATION_INTEGRITY');return d!;}));return {registry:this.registry,observations,assessments,derived};
 }
 async readiness(acceptanceId:string){const {a,s}=await this.acceptance(acceptanceId);return evaluateScoringReadiness(a,s,await this.sources(s),snapshotHash);}
 async authorize(raw:ScoreInput,rawSelection:ScoringDatasetSelection):Promise<ScoringDatasetAuthorization>{return this.authorization(raw,rawSelection,false);}
 private async authorization(raw:ScoreInput,rawSelection:ScoringDatasetSelection,legacyReplay:boolean):Promise<ScoringDatasetAuthorization>{
  const input=snapshot(raw),selection=snapshot(rawSelection);exactReadinessFields(selection,'snapshotRunId acceptanceId');[selection.snapshotRunId,selection.acceptanceId].forEach(fundamentalId);
  requireFundamental(input.artifactScope==='FORMAL','FORMAL_DATASET_SCOPE_REQUIRED');const {a,s}=await this.acceptance(selection.acceptanceId);
  requireFundamental((a.requirements.algorithm==='strict-canonical-m3-readiness-v1')===legacyReplay,'NEW_FORMAL_REQUIRES_READINESS_V2');
  requireFundamental(selection.snapshotRunId===a.snapshotRunId&&a.acceptedAt<=input.calculatedAt,'DI_RUN_OR_ACCEPTANCE_TIME_MISMATCH');
  const reviewed=a.tickers.find(t=>t.securityId===input.securityId)?.input;requireFundamental(reviewed&&canonicalJson(scoringInputSemantic(input))===canonicalJson(scoringInputSemantic(reviewed)),'REVIEWED_SCORING_INPUT_REQUIRED');
  const registered=await new PrismaMethodologyRegistry(this.client).findById(input.methodology.methodologyId);requireFundamental(registered&&canonicalJson(registered)===canonicalJson(input.methodology),'REGISTERED_SCORING_METHOD_REQUIRED');
  const readiness=evaluateScoringReadiness(a,s,await this.sources(s),snapshotHash);requireFundamental(readiness.find(t=>t.securityId===input.securityId)?.readyForScoring,'TICKER_NOT_READY_FOR_SCORING');
  return deepFreeze({contract:legacyReplay?'scoring-dataset-binding-v1' as const:'scoring-dataset-binding-v2' as const,selection,acceptanceHash:snapshotHash(a),inputHash:snapshotHash(input),requirementsHash:a.requirementsHash,readiness});
 }
 async append(card:Scorecard,authorization:ScoringDatasetAuthorization){
  requireFundamental(Object.isFrozen(card)&&canonicalJson(calculateScorecard(card.input))===canonicalJson(card),'SCORING_DOMAIN_REPLAY_REQUIRED');
  const current=await this.authorize(card.input,authorization.selection);requireFundamental(canonicalJson(current)===canonicalJson(authorization),'SCORING_AUTHORIZATION_REPLAY_REQUIRED');
  const body=JSON.stringify(card);
  await this.client.$transaction(async tx=>{
   await tx.analyticalArtifact.create({data:{id:card.id,kind:'SCORECARD',methodologyId:card.methodology.methodologyId,asOf:card.asOf,calculatedAt:card.calculatedAt,body,bodyHash:manifestDigest(body)}});
   await tx.scoringDatasetBinding.create({data:{scorecardId:card.id,snapshotRunId:current.selection.snapshotRunId,acceptanceId:current.selection.acceptanceId,inputHash:current.inputHash,createdAt:card.calculatedAt,body:canonicalJson(current),bodyHash:snapshotHash(current)}});
  });
 }
 async findBinding(scorecardId:string){
  fundamentalId(scorecardId);const row=await this.client.scoringDatasetBinding.findUnique({where:{scorecardId}});if(!row)return null;
  const stored=JSON.parse(row.body) as ScoringDatasetAuthorization,card=await new PrismaAnalyticalArtifacts(this.client).find(scorecardId);
  requireFundamental(card&&'totalScore' in card&&snapshotHash(stored)===row.bodyHash&&stored.selection.snapshotRunId===row.snapshotRunId&&stored.selection.acceptanceId===row.acceptanceId&&stored.inputHash===row.inputHash&&card.calculatedAt===row.createdAt,'SCORING_DATASET_BODY_INDEX_BINDING');
  const replay=await this.authorization(card.input,stored.selection,stored.contract==='scoring-dataset-binding-v1');requireFundamental(canonicalJson(replay)===canonicalJson(stored)&&canonicalJson(calculateScorecard(card.input))===canonicalJson(card),'SCORING_DATASET_REPLAY');return replay;
 }
}
