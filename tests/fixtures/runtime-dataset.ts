import {policyBFixture} from './policy-b';
import {runtimeFixture} from './runtime-readiness';
import {buildFundamentalSnapshot} from '@/domain/fundamentals/snapshot';
import {bridgeScoringInputs} from '@/domain/fundamentals/scoring-bridge';
import {buildIssuerDossier} from '@/domain/fundamentals/runtime-dossier';
import {ReviewAssessment} from '@/application/fundamentals/review-assessment';
import type {HumanReviewRecord,AssessmentContext} from '@/domain/fundamentals/runtime-review';
import type {HumanReviewStore} from '@/ports/runtime-readiness';
import type {DatasetReviewPacket} from '@/application/fundamentals/accept-runtime-dataset';
import {AcceptRuntimeDataset} from '@/application/fundamentals/accept-runtime-dataset';

/** Entire 29/1 dataset is SYNTHETIC. No production store, real facts, scoring or orders. */
export async function runtimeDatasetFixture(){
 const f=runtimeFixture(),b=policyBFixture(),sources={...f.sources,observations:f.observations.slice(0,29),assessments:f.assessments.slice(0,29)};
 const request={...f.request,requirements:f.request.requirements.slice(0,29),assessmentPins:f.request.assessmentPins.slice(0,29)},s=buildFundamentalSnapshot(request,sources,f.hash);
 const issues=b.policy.issues.slice(-1),policy={...b.policy,issues,sourceIssueRegister:{...b.policy.sourceIssueRegister,issues,issuesHash:f.hash(issues)},members:b.policy.members.map((m,index)=>index<29?{...m,state:'SCORABLE' as const,levelOnePass:true,blockerIds:[],reopenTriggers:[],quarantine:null}:m)};
 const acceptance={...b.acceptance,partialUniverse:policy,contentHash:s.contentHash,manifestDigest:f.digest(s.manifest),issues:issues.map(i=>({id:i.id,severity:i.severity,resolutionReference:i.resolutionReference})),tickers:b.acceptance.tickers.map((t,index)=>{
  if(index===29)return {...t,input:null,bridge:null};
  const plan={...f.plan,facts:f.plan.facts.map(p=>({...p,observationId:f.observations[index].id}))};
  const generated=bridgeScoringInputs(s,t.securityId,plan,sources),input={...f.input,id:'synthetic-runtime-input-'+index,securityId:t.securityId,
    evidence:[...f.input.evidence.filter(e=>e.id!=='canonical-net-income').map(e=>({...e,securityId:t.securityId})),...generated.evidence],
    assessments:f.input.assessments.map(a=>({...a,analyst:f.identity.subject}))};
  return {...t,input,bridge:plan};
 })};
 const rows=new Map<string,HumanReviewRecord>(),store:HumanReviewStore={head:async id=>rows.get(id)??null,append:async(r,expected)=>{if((rows.get(r.id)?.contentHash??null)!==expected)throw Error('CAS');rows.set(r.id,r);}};
 const review=new ReviewAssessment(store,f.identityPort,()=>request.systemKnownAt,f.hash),reviews:DatasetReviewPacket['reviews'][number][]=[];
 const marketHash=f.hash(request.references.find(r=>r.kind==='MARKET')),executableHash=f.hash('SYNTHETIC ONLY executable');
 for(const t of acceptance.tickers)if(t.input)for(const assessment of t.input.assessments){
  const context:AssessmentContext={securityId:t.securityId,rubricId:assessment.subcategory,asOf:t.input.asOf,methodologyHash:f.hash(t.input.methodology),executableHash,
    evidenceHashes:t.input.evidence.map(e=>f.hash(e)).sort(),derivationHashes:[],sectorContextHash:f.hash(t.input.normalization),marketHash,invalidationTriggers:['EVIDENCE_OR_METHOD_OR_CONTEXT_CHANGE'],validThrough:acceptance.acceptedAt};
  const d=await review.draft('synthetic-'+t.securityId+'-'+assessment.subcategory,context),r=await review.transition(d.id,d.contentHash,'REVIEWED',assessment),a=await review.transition(d.id,r.contentHash,'APPROVED');
  reviews.push({securityId:t.securityId,rubricId:assessment.subcategory,reviewId:a.id,reviewHash:a.contentHash});
 }
 const ownerGateBindings=acceptance.tickers.flatMap(t=>t.input?[{securityId:t.securityId,inputGovernanceHash:f.hash({stage0:t.input.stage0,hardVeto:t.input.hardVeto,residualRisk:t.input.residualRisk}),approvalReference:'SYNTHETIC ONLY trusted M1 receipt'}]:[]);
 const authorityHashes=[sources.registry.registryHash,f.hash(request.policy),acceptance.requirementsHash],dossierHashes=policy.members.filter(m=>m.state==='SCORABLE').map(m=>buildIssuerDossier(m.securityId,'SCORABLE',s,sources,f.hash).contentHash);
 let packet:DatasetReviewPacket={acceptance,snapshot:s,sources,executableHash,authorityHashes,dossierHashes,marketHash,reviews,ownerGateBindings};
 const evidence={contract:'runtime-independent-review-evidence-v1',snapshotHash:s.contentHash,manifestDigest:f.digest(s.manifest),authorityHashes:[...authorityHashes].sort(),availabilityHashes:sources.assessments.map(a=>f.hash(a)).sort(),derivationHashes:[],dossierHashes:[...dossierHashes].sort(),reviewHashes:reviews.map(r=>r.reviewHash).sort(),ownerGateHashes:ownerGateBindings.map(g=>f.hash(g)).sort(),valuationContextHashes:acceptance.tickers.flatMap(t=>t.input?[f.hash({expectedReturn:t.input.expectedReturn,normalization:t.input.normalization,evidence:t.input.evidence,stage0:t.input.stage0,hardVeto:t.input.hardVeto,residualRisk:t.input.residualRisk})]:[]).sort(),marketHash,executableHash,readyForScoring:false};
 packet={...packet,acceptance:{...acceptance,reviewArtifactReference:'runtime-review-evidence-sha256:'+f.hash(evidence)}};
 let writes=0;const writer={appendAcceptance:async()=>{writes++;}};
 const service=new AcceptRuntimeDataset(f.identityPort,store,ownerGateBindings,writer,()=>acceptance.acceptedAt,f.hash,f.digest);
 return {...f,packet,store,rows,service,writes:()=>writes};
}
