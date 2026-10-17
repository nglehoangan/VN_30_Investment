import type {AnalyticalArtifacts} from '@/ports/scoring';
import type {DecisionArtifacts} from '@/ports/decision';
import type {MarginalArtifacts} from '@/ports/marginal';
import type {WorkflowArtifacts} from '@/ports/workflow';
import type {PolicyBAction} from '@/domain/fundamentals/partial-universe';
import type {ReviewArtifact} from '@/domain/workflow/contracts';
import type {MarginalAllocation} from '@/domain/decision/marginal';
import {requireFundamental} from '@/domain/fundamentals/validation';
/** Server-composed release guard. Existing engines retain their M3/M4/M5 rules; no action is
 * authorized here. These ports also check cached plans, so old positive artifacts cannot
 * re-enter a new release after their ticker is deferred. Historical v1 readers remain intact. */
export function policyBQuarantinePorts(base:{analytical:AnalyticalArtifacts;decisions:DecisionArtifacts;marginal:MarginalArtifacts;workflow:WorkflowArtifacts},admission:{assertAction(acceptanceId:string,securityId:string,action:PolicyBAction):Promise<void>},acceptanceId:string){
 const guard=(id:string,action:PolicyBAction)=>admission.assertAction(acceptanceId,id,action);
 const analytical:AnalyticalArtifacts={
  async append(a){for(const c of 'totalScore' in a?[a]:a.input.cards)if(c.input.artifactScope==='FORMAL')await guard(c.securityId,'RANKING');return base.analytical.append(a);},
  async find(id){const a=await base.analytical.find(id);if(a)for(const c of 'totalScore' in a?[a]:a.input.cards)if(c.input.artifactScope==='FORMAL')await guard(c.securityId,'RANKING');return a;}
 };
 const decisions:DecisionArtifacts={
  async append(d){if(d.scope==='FORMAL')await guard(d.securityId,'NEW_CAPITAL');return base.decisions.append(d);},
  async find(id){const d=await base.decisions.find(id);if(d?.scope==='FORMAL')await guard(d.securityId,'NEW_CAPITAL');return d;}
 };
 async function marginalCheck(a:MarginalAllocation|null){if(a?.scope==='FORMAL')for(const id of a.command.baseDecisionIds)requireFundamental(await decisions.find(id),'POLICY_B_MARGINAL_BASE_REQUIRED');return a;}
 const marginal:MarginalArtifacts={
  substitutionHistory:(...args)=>base.marginal.substitutionHistory(...args),
  async find(id){return marginalCheck(await base.marginal.find(id));},
  async append(a){await marginalCheck(a);return base.marginal.append(a);}
 };
 async function reviewCheck(a:ReviewArtifact|null){if(a?.command.scope==='FORMAL'){for(const id of a.command.decisionIds)requireFundamental(await decisions.find(id),'POLICY_B_DCA_DECISION_REQUIRED');for(const item of a.proposal?.items??[])await guard(item.securityId,'DCA');}return a;}
 const workflow:WorkflowArtifacts={
  async find(id){return reviewCheck(await base.workflow.find(id));},
  async findIdentity(id){return reviewCheck(await base.workflow.findIdentity(id));},
  async openEvents(id){const rows=await base.workflow.openEvents(id);for(const a of rows)await reviewCheck(a);return rows;},
  isSuperseded:(id)=>base.workflow.isSuperseded(id),hasExecution:(...args)=>base.workflow.hasExecution(...args),
  async append(a,events){await reviewCheck(a);return base.workflow.append(a,events);},
  appendFollowUp:(a)=>base.workflow.appendFollowUp(a),findFollowUp:(id)=>base.workflow.findFollowUp(id),
  async appendExecution(a){requireFundamental(await decisions.find(a.decisionId),'POLICY_B_EXECUTION_DECISION_REQUIRED');return base.workflow.appendExecution(a);},
  findExecution:(id)=>base.workflow.findExecution(id)
 };
 return {analytical,decisions,marginal,workflow};
}
