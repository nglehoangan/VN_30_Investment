// @vitest-environment node
import {it,expect,vi} from 'vitest';
import {policyBQuarantinePorts} from '@/application/fundamentals/policy-b-ports';
import {assertPolicyBAction,type PolicyBAction} from '@/domain/fundamentals/partial-universe';
import {policyBFixture} from '../fixtures/policy-b';
import {snapshotHash} from '@/infrastructure/fundamentals/snapshot-hash';
import type {AnalyticalArtifacts} from '@/ports/scoring';
import type {DecisionArtifacts} from '@/ports/decision';
import type {MarginalArtifacts} from '@/ports/marginal';
import type {WorkflowArtifacts} from '@/ports/workflow';
function ports(state='BUY'){
 const f=policyBFixture(),id=f.policy.members[25].securityId;
 const decision={scope:'FORMAL',securityId:id,decisionState:state};
 const card={totalScore:'82',securityId:id,input:{artifactScope:'FORMAL'}};
 const plan={scope:'FORMAL',command:{baseDecisionIds:['old-positive-decision']}};
 const review={command:{scope:'FORMAL',decisionIds:[]},proposal:{items:[{securityId:id}]}};
 const writes=vi.fn();
 const base={analytical:{find:async()=>card,append:writes} as unknown as AnalyticalArtifacts,decisions:{find:async()=>decision,append:writes} as unknown as DecisionArtifacts,marginal:{find:async()=>plan,append:writes,substitutionHistory:async()=>[]} as unknown as MarginalArtifacts,workflow:{find:async()=>review,findIdentity:async()=>review,openEvents:async()=>[review],append:writes,appendExecution:writes} as unknown as WorkflowArtifacts};
 const admission={async assertAction(_release:string,sid:string,action:PolicyBAction){assertPolicyBAction(f.policy,sid,action,snapshotHash);}};
 return {guarded:policyBQuarantinePorts(base,admission,'trusted-current-release'),writes,decision,review};
}
it.each(['STRONG BUY','BUY','ACCUMULATE'])('stored %s cannot re-enter a quarantined release',async state=>{const {guarded,writes}=ports(state);await expect(guarded.decisions.find('old-positive-decision')).rejects.toThrow();expect(writes).not.toHaveBeenCalled();});
it('bound historical card cannot enter ranking/current decision reads',async()=>{const {guarded}=ports();await expect(guarded.analytical.find('old-score')).rejects.toThrow();});
it('cached marginal plans do not bypass current quarantine',async()=>{const {guarded}=ports();await expect(guarded.marginal.find('old-plan')).rejects.toThrow();});
it('cached DCA proposals cannot bypass current quarantine',async()=>{const {guarded}=ports();await expect(guarded.workflow.find('old-review')).rejects.toThrow();await expect(guarded.workflow.findIdentity('old-key')).rejects.toThrow();});
it('deferred new capital cannot reach an execution append',async()=>{const {guarded,writes}=ports();await expect(guarded.workflow.appendExecution({id:'link',decisionId:'old-positive-decision',reviewId:'old-review',proposalId:'old-proposal',transactionId:'tx',recordedAt:'2026-01-01T00:00:00.000Z',variance:'none'})).rejects.toThrow();expect(writes).not.toHaveBeenCalled();});
