/** Current-purpose score authorization. No historical DI insert, HUMAN relabeling or live activation. */
import type {PrismaClient} from '@/infrastructure/db/generated/client';
import type {MethodologyRegistry} from '@/ports/methodology-registry';
import type {CurrentScoringDatasets,CurrentScoringDataset} from '@/ports/current-scoring-datasets';
import type {PreScoringDatasetReference} from '@/ports/pre-scoring-datasets';
import type {MethodologyRecord} from '@/domain/methodology/record';
import {calculateScorecard,type ScoreInput} from '@/domain/current-scoring/scorecard';
import {METRICS} from '@/domain/scoring/metrics';
import {aiInputSemantic} from '@/domain/current-scoring/provenance';
import {PinnedAiReviewVerifier,pinnedAiBytes,type AiArtifactPin,type AiReviewTrustBinding} from './current-review';
import {snapshotHash as hash} from '@/infrastructure/fundamentals/snapshot-hash';
import {canonicalJson} from '@/domain/fundamentals/snapshot';
import {deepFreeze} from '@/domain/portfolio/transaction';
import {check,snapshot} from '@/domain/scoring/validation';
import {assertNotRevoked} from '@/infrastructure/repositories/unified-admission';
export interface CurrentAssessmentAdoption {verify(input:ScoreInput,dataset:CurrentScoringDataset):Promise<void>}
/** Trusted configuration, never a caller PASS or source standing approval. */
export interface CurrentExecutableAuthority {verify(method:MethodologyRecord):Promise<void>}
export class PinnedCurrentAssessmentAdoption implements CurrentAssessmentAdoption {
 private readonly reviews:PinnedAiReviewVerifier;
 constructor(private readonly root:string,private readonly inputPin:AiArtifactPin,bindings:readonly AiReviewTrustBinding[]){this.reviews=new PinnedAiReviewVerifier(root,bindings);}
 async verify(input:ScoreInput,_dataset:CurrentScoringDataset){
  const packet=await pinnedAiBytes(this.root,this.inputPin) as {contract:string;input:ScoreInput;datasetHash:string;metricDecisions:readonly {metric:string;status:string;ruleReference:string;evidenceRefs:readonly string[]}[]};
  check(packet.contract==='current-assessment-adoption-v1'&&packet.datasetHash===hash(_dataset),'CURRENT_ASSESSMENT_DATASET_BINDING_REQUIRED');
  const reviewed=packet.input;
  check(Array.isArray(packet.metricDecisions)&&packet.metricDecisions.length===Object.keys(METRICS).length&&new Set(packet.metricDecisions.map(d=>d.metric)).size===Object.keys(METRICS).length,'CURRENT_METRIC_DISPOSITIONS_REQUIRED');
  for(const d of packet.metricDecisions){
   check(Object.hasOwn(METRICS,d.metric)&&['USE','PRINCIPLE_EQUIVALENT','N_R','NOT_APPLICABLE'].includes(d.status)&&typeof d.ruleReference==='string'&&d.ruleReference.trim().length>0&&d.evidenceRefs.length>0&&d.evidenceRefs.every((ref:string)=>input.evidence.some(e=>e.id===ref)),'CURRENT_METRIC_DISPOSITION_EVIDENCE_REQUIRED');
   if(d.status==='USE')check(input.metrics.some(m=>m.metric===d.metric),'CURRENT_REQUIRED_METRIC_MISSING');
  }
  check(hash(aiInputSemantic(reviewed))===hash(aiInputSemantic(input))&&hash(reviewed.review)===hash(input.review),'CURRENT_EXACT_ASSESSMENT_ADOPTION_REQUIRED');
  // Both reviews bind all assessments AND the exact dated external M1/risk gates in inputHash.
  await this.reviews.verify(input);
 }
}
export class CurrentPurposeScoring {
 constructor(private readonly db:PrismaClient,private readonly registry:MethodologyRegistry,private readonly data:CurrentScoringDatasets,private readonly adoption:CurrentAssessmentAdoption,private readonly executable:CurrentExecutableAuthority){}
 private async authorize(raw:ScoreInput,reference:PreScoringDatasetReference){
  const input=deepFreeze(snapshot(raw)),p=input.currentPurpose;
  check(p?.contract==='current-scoring-time-v1'&&p.purpose==='CURRENT_FORMAL_VALUATION','CURRENT_SCORING_PURPOSE_REQUIRED');
  check(input.artifactScope==='FORMAL'&&input.securityId===reference.context.securityId&&input.asOf.slice(0,10)===reference.context.economicCutoff&&p.economicCutoff===reference.context.economicCutoff,'CURRENT_SCORE_DATASET_IDENTITY');
  const method=await this.registry.findById(input.methodology.methodologyId);
  check(method&&hash(method)===hash(input.methodology),'UNREGISTERED_CURRENT_METHODOLOGY');
  await this.executable.verify(method);
  const dataset=await this.data.resolve(reference,{...reference.context,knownAt:input.knownAt});
  check(dataset.context.knownAt<=input.knownAt&&dataset.purpose===p.purpose&&dataset.financialAssemblyComplete&&dataset.bindingId===reference.bindingId&&dataset.manifestHash===reference.manifestHash&&dataset.context.securityId===input.securityId&&dataset.context.economicCutoff===p.economicCutoff&&dataset.originalBindingKnownAt===reference.context.knownAt,'CURRENT_SCORE_DATASET_NOT_READY');
  for(const e of dataset.evidence)check(input.evidence.some(v=>v.id===e.id&&hash(v)===hash(e)),'CURRENT_SCORE_FINANCIAL_LINEAGE_REQUIRED');
  await this.adoption.verify(input,dataset);
  check(['PASS','PASS WITH CONDITIONS'].includes(input.stage0.status)&&input.hardVeto.status!=='PENDING','CURRENT_SCORE_M1_UNRESOLVED');
  const card=calculateScorecard(input,hash);
  check(card.reference.membership==='MEMBER'&&card.ticker===dataset.context.ticker,'CURRENT_SCORE_MEMBERSHIP_REQUIRED');
  check(card.totalScore!==null&&!card.missingEvidence.length,'CURRENT_SCORE_MANDATORY_ASSESSMENTS_REQUIRED');
  // LOW confidence is retained as NON-ACTIONABLE, never increased or converted into a trade authorization.
  const authorization={contract:'current-purpose-score-authorization-v1',reference,dataAcceptanceId:dataset.dataAcceptanceId,datasetHash:hash(dataset),inputHash:hash(input),reviewHash:hash(input.review),methodologyHash:hash(method),purpose:p.purpose,economicCutoff:p.economicCutoff,knownAt:input.knownAt,evaluatedAt:p.evaluatedAt,productionActivated:false,historicalPitGranted:false};
  return {input,card,authorization,dataset};
 }
 async preflight(input:ScoreInput,reference:PreScoringDatasetReference){const a=await this.authorize(input,reference);return a.authorization;}
 async score(input:ScoreInput,reference:PreScoringDatasetReference){
  const a=await this.authorize(input,reference),body=canonicalJson({card:a.card,authorization:a.authorization}),digest=hash({card:a.card,authorization:a.authorization});
  await this.db.$transaction(async tx=>{
   for(const id of [reference.bindingId,a.dataset.parentDatasetId,a.dataset.dataAcceptanceId])await assertNotRevoked(tx,id);
   const rows=await tx.$queryRawUnsafe<{body:string;body_hash:string}[]>('SELECT body,body_hash FROM current_score_artifact WHERE id=?',a.card.id);
   if(rows.length)check(rows[0].body===body&&rows[0].body_hash===digest,'CURRENT_SCORE_ID_CONFLICT');
   else await tx.$executeRawUnsafe('INSERT INTO current_score_artifact VALUES(?,?,?,?,?)',a.card.id,reference.bindingId,a.dataset.dataAcceptanceId,body,digest);
  });return a.card;
 }
 async find(id:string){
  const rows=await this.db.$queryRawUnsafe<{body:string;body_hash:string}[]>('SELECT body,body_hash FROM current_score_artifact WHERE id=?',id);
  if(!rows.length)return null;
  const saved=JSON.parse(rows[0].body) as {card:ReturnType<typeof calculateScorecard>;authorization:Awaited<ReturnType<CurrentPurposeScoring['preflight']>>};
  check(hash(saved)===rows[0].body_hash&&canonicalJson(saved)===rows[0].body&&saved.card.id===id,'CURRENT_SCORE_ARTIFACT_INTEGRITY');
  const replay=await this.authorize(saved.card.input,saved.authorization.reference);
  check(hash(replay.authorization)===hash(saved.authorization)&&hash(replay.card)===hash(saved.card),'CURRENT_SCORE_REPLAY_REQUIRED');
  return deepFreeze(saved);
 }
}
