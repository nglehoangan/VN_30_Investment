import type {CurrentReleaseGate,CurrentPublicationSubject} from '@/ports/current-publication';
import {snapshotHash as hash} from '@/infrastructure/fundamentals/snapshot-hash';
export interface CurrentDeploymentPlan extends CurrentPublicationSubject {readonly contract:'governed-current-deployment-v1';readonly sourcePins:readonly {path:string;sha256:string}[];readonly historicalPitGranted:false;readonly activatesPublication:false}
/** Trusted recipe uses existing admission/consumer/methodology services, never raw record insertion.
 * Verification/permission precede any migration or registration. Replays must be idempotent. */
export class GovernedCurrentDeployment {
 constructor(private readonly gate:CurrentReleaseGate,private readonly recipe:{verify(plan:CurrentDeploymentPlan):Promise<void>;replay(plan:CurrentDeploymentPlan):Promise<{subject:CurrentPublicationSubject;facts:number;bindingId:string}>}){}
 async apply(plan:CurrentDeploymentPlan){
  if(plan.contract!=='governed-current-deployment-v1'||plan.historicalPitGranted!==false||plan.activatesPublication!==false||!plan.sourcePins.length)throw Error('CURRENT_DEPLOYMENT_SCOPE');
  await this.gate.verify('MATERIALIZE',plan,hash(plan));await this.recipe.verify(plan);await this.gate.verify('MATERIALIZE',plan,hash(plan));
  const result=await this.recipe.replay(plan);
  const subject={scorecardId:plan.scorecardId,scorecardHash:plan.scorecardHash,datasetHash:plan.datasetHash,methodologyHash:plan.methodologyHash,reviewHash:plan.reviewHash};
  if(hash(result.subject)!==hash(subject))throw Error('CURRENT_DEPLOYMENT_RESULT_MISMATCH');
  return {...result,authorityReference:this.gate.authorityReference,authorityHash:this.gate.authorityHash,publicationActivated:false as const,historicalPitGranted:false as const};
 }
}
