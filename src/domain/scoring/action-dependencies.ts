/** M3 §3A.6 action dependencies. Source implementation approval does not activate production authority. */
import type {MetricRequest} from './metrics';
import type {Evidence} from '@/domain/scoring/evidence';
export const ACTION_RUBRICS:readonly string[] = Object.freeze(['GQ-HIST','VAL-PRIMARY','VAL-RET','VAL-MOS','CA-REINV','CA-DIST','CA-DIL','CA-PSV']);
export const ACTION_METRICS:readonly string[] = Object.freeze(['EPS_CAGR','EARNINGS_YIELD','DIVIDEND_YIELD','PB','FCF_YIELD','MOS','EV_EBIT']);
type TopicAssessment={readonly evidence:readonly {readonly refs:readonly string[]}[];readonly disconfirmingEvidence:readonly string[]};
export function requiresActionComparability(rubric:string,assessment:TopicAssessment|undefined,metrics:readonly MetricRequest[],evidence:readonly Evidence[]):boolean {
 if(ACTION_RUBRICS.includes(rubric))return true;
 if(!assessment)return false;
 const refs=new Set([...assessment.evidence.flatMap(x=>x.refs),...assessment.disconfirmingEvidence]);
 const metricDependency=metrics.some(m=>ACTION_METRICS.includes(m.metric)&&m.evidenceRefs.some(ref=>refs.has(ref)));
 if(metricDependency)return true;
 // Current ownership/share disclosures are not historical per-share economics.
 // Independent industry/governance stay independent unless an action-sensitive metric is actually used.
 if(['IC-IND','RG-GOV'].includes(rubric))return false;
 return evidence.some(e=>refs.has(e.id)&&['SHARES','VND_PER_SHARE'].includes(e.unit));
}
