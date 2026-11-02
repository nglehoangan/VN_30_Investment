import type { ReviewLineageGraph } from './review-lineage';
import type { AiHash } from './provenance';
import { check } from '@/domain/scoring/validation';
export interface TopicRemediation {
  contract: 'ai-topic-remediation-worklist-v1';
  topics: readonly {id:string;ticker:string;rubricId:string;topic:string;candidateEvidenceNodes:readonly string[];sourceGraphHash:string;topicSpecificSufficiencyProven:false;readyForScoring:false;expiredObservationBindings:readonly string[]}[];
  rubrics: readonly {ticker:string;rubricId:string;maxPoints:number;topicIds:readonly string[];retainedHistoricalPoints:string|null;retainedHistoricalAssessmentHash:string;currentAssessment:null;currentReadyForScoring:false;autoRenewedBindings:0}[];
  rubricCount:number;topicCount:number;retainedUnratedRubrics:number;currentReadyRubrics:0;financialCriteriaChanged:false;
}
export interface BindingDispositions { contract:'ai-binding-dispositions-v1';bindings:readonly {ticker:string;observationId:string;disposition:'EXCLUDED_FROM_NEW_SCORING_SELECTION';historicalBindingUnchanged:true;replacementBinding:null;renewalAuthorized:false}[];count:number;historicalBindingsChanged:false;automaticRenewal:false }
/** Requires already byte/graph-verified lineage; this worklist is not DI or score evidence. */
export function verifyTopicRemediation(graphs:readonly ReviewLineageGraph[],work:TopicRemediation,retired:BindingDispositions,hash:AiHash) {
  check(graphs.length===30 && new Set(graphs.map(g=>g.ticker)).size===30,'TOPIC_EXACT_UNIVERSE');
  check(work.contract==='ai-topic-remediation-worklist-v1' && work.financialCriteriaChanged===false && work.currentReadyRubrics===0,'TOPIC_NOT_FINANCIAL_ADMISSION');
  check(retired.contract==='ai-binding-dispositions-v1' && retired.historicalBindingsChanged===false && retired.automaticRenewal===false,'TOPIC_NO_AUTO_RENEWAL');
  check(new Set(work.topics.map(t=>t.id)).size===work.topics.length && new Set(work.rubrics.map(r=>r.ticker+':'+r.rubricId)).size===work.rubrics.length,'TOPIC_DUPLICATE');
  const keys=retired.bindings.map(b=>b.ticker+':'+b.observationId);
  check(new Set(keys).size===keys.length && retired.count===keys.length,'TOPIC_BINDING_DUPLICATE_OR_COUNT');
  const expectedKeys=graphs.flatMap(g=>g.stalePriorFactBindings.map(id=>g.ticker+':'+id)).sort();
  check(hash([...keys].sort())===hash(expectedKeys),'TOPIC_EXPIRED_BINDING_SET_CHANGED');
  for(const b of retired.bindings) check(b.disposition==='EXCLUDED_FROM_NEW_SCORING_SELECTION' && b.historicalBindingUnchanged===true && b.replacementBinding===null && b.renewalAuthorized===false,'TOPIC_RENEWAL_REQUIRES_NEW_ADMISSION');
  let rubricCount=0,topicCount=0,unrated=0;
  for(const g of graphs){
    const nodes=new Map(g.nodes.map(n=>[n.id,n])); const cache=new Map<string,Set<string>>();
    const ancestors=(id:string):Set<string>=>{if(cache.has(id))return cache.get(id)!; const n=nodes.get(id);check(n,'TOPIC_DANGLING_INPUT');const all=new Set([id,...n.inputs.flatMap(p=>[...ancestors(p)])]);cache.set(id,all);return all;};
    for(const n of g.nodes.filter(n=>n.kind==='RUBRIC')){
      rubricCount++;if(n.value===null)unrated++;
      const r=work.rubrics.find(r=>r.ticker===g.ticker && r.rubricId===n.details.rubricId);
      check(r && r.maxPoints===n.details.maxPoints && r.retainedHistoricalPoints===n.value && r.retainedHistoricalAssessmentHash===n.details.retainedAssessmentHash,'TOPIC_CRITERIA_OR_ASSESSMENT_CHANGED');
      check(r.currentAssessment===null && r.currentReadyForScoring===false && r.autoRenewedBindings===0,'TOPIC_CANNOT_GRANT_SCORE');
      check(hash(r.topicIds)===hash(n.inputs.map(id=>g.ticker+':'+id)),'TOPIC_RUBRIC_REQUIREMENTS_CHANGED');
      for(const id of n.inputs){
        topicCount++;const e=nodes.get(id)!; const t=work.topics.find(t=>t.id===g.ticker+':'+id);
        check(t && t.ticker===g.ticker && t.rubricId===n.details.rubricId && t.topic===e.details.topic && t.sourceGraphHash===g.contentHash && hash(t.candidateEvidenceNodes)===hash(e.inputs),'TOPIC_EVIDENCE_BINDING_CHANGED');
        check(t.topicSpecificSufficiencyProven===false && t.readyForScoring===false,'TOPIC_MAPPING_NOT_SUFFICIENT_EVIDENCE');
        const closure=ancestors(id),expired=g.stalePriorFactBindings.filter(o=>closure.has('source:'+o)||closure.has('normalized:'+o)).sort();
        check(hash(t.expiredObservationBindings)===hash(expired),'TOPIC_EXPIRED_DEPENDENCIES_HIDDEN');
      }
    }
  }
  check(work.rubrics.length===rubricCount && work.rubricCount===rubricCount && rubricCount===690 && work.topics.length===topicCount && work.topicCount===topicCount && work.retainedUnratedRubrics===unrated,'TOPIC_COVERAGE_COUNTS_CHANGED');
  return Object.freeze({status:'VERIFIED_REMEDIATION_WORKLIST_ONLY',rubricCount,topicCount,retainedUnratedRubrics:unrated,expiredBindingCount:expectedKeys.length,currentReadyRubrics:0,diAccepted:false,productionScoringAuthorized:false,navAuthorized:false,tradingAuthorized:false});
}
