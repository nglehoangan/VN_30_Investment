import {deepFreeze} from '@/domain/portfolio/transaction';
import {snapshot} from '@/domain/scoring/validation';
import {dateOnly,instant} from '@/shared/time';
import {ValidationError} from '@/shared/errors';
import {canonicalJson} from './snapshot';
import {fundamentalHash,fundamentalId,requireFundamental} from './validation';
import {exactReadinessFields} from './scoring-bridge';
export const POLICY_B_VERSION='quarantined-partial-universe-v1' as const;
export const POLICY_B_ACTIONS=['SCORING','RANKING','TOP10','STRONG BUY','BUY','ACCUMULATE','NEW_CAPITAL','DCA','SCORE_WEIGHT_REDISTRIBUTION','CAPITAL_REDISTRIBUTION'] as const;
export type PolicyBAction=typeof POLICY_B_ACTIONS[number];
export const ISOLATED_BLOCKERS=['SOURCE_UNAVAILABLE','REGULATORY_SOURCE_UNAVAILABLE','ACCOUNTING_POPULATION_UNRESOLVED','DEFINITION_UNRESOLVED'] as const;
export const GLOBAL_BLOCKERS=['UNIVERSE_IDENTITY','CROSS_TICKER_CONTAMINATION','SHARED_REGISTRY','SCORING_CONTRACT','UNIT_CORRUPTION','PROVIDER_SCHEMA_DRIFT','SHARED_MAPPING','CANONICAL_REPLAY_DIVERGENCE','DATABASE_CORRUPTION','SHARED_SOURCE_CONTRACT','SHARED_ENGINE','PRODUCTION_INFRASTRUCTURE'] as const;
export interface PolicyBIssue {
 readonly id:string;readonly securityId:string|null;readonly kind:'TICKER_ISOLATED_BLOCKER'|'GLOBAL_SYSTEM_BLOCKER';
 readonly severity:'CRITICAL'|'MAJOR'|'MINOR';readonly status:'OPEN'|'RESOLVED';readonly classification:string;readonly detail:string;
 readonly provenance:readonly {readonly reference:string;readonly sha256:string}[];readonly resolutionReference:string|null;
}
export interface ReopenTrigger {readonly type:'AUTHORITATIVE_ISSUER_FILING'|'REGULATORY_DISCLOSURE'|'ORIGINAL_SOURCE_ACCESSIBLE'|'ISSUER_DEFINITION_BRIDGE'|'AUTHORITATIVE_DEBT_NOTE';readonly condition:string;readonly evidenceReference:string}
export interface PolicyBMember {
 readonly securityId:string;readonly ticker:string;readonly state:'SCORABLE'|'DEFERRED';readonly levelOnePass:boolean;
 readonly levelOneEvidence:{readonly reference:string;readonly sha256:string};readonly blockerIds:readonly string[];
 readonly reopenTriggers:readonly ReopenTrigger[];readonly score:null;
 readonly quarantine:{readonly scoring:false;readonly ranking:false;readonly top10:false;readonly positiveCapital:false;readonly dca:false;readonly weightRedistribution:false;readonly capitalRedistribution:false}|null;
}
export interface PolicyBAdmission {
 readonly contract:typeof POLICY_B_VERSION;
 readonly ownerApproval:{readonly reference:string;readonly sha256:string;readonly effectiveDate:string};
 readonly universe:{readonly asOf:string;readonly certification:'PASS'|'BLOCKED';readonly reference:object;readonly hash:string;readonly evidence:{readonly reference:string;readonly sha256:string};readonly identities:readonly {readonly securityId:string;readonly ticker:string}[];readonly identitiesHash:string};
 readonly sourceIssueRegister:{readonly reference:string;readonly sha256:string;readonly issuesHash:string;readonly issues:readonly PolicyBIssue[]};
 readonly issues:readonly PolicyBIssue[];readonly members:readonly PolicyBMember[];
 readonly prerequisites:readonly {readonly gate:string;readonly status:'PASS'|'PENDING'|'FAIL'|'NOT_EXECUTED';readonly evidenceReference:string}[];
}
function ref(v:unknown){requireFundamental(typeof v==='string'&&v.trim()===v&&v.length>0&&v.length<=4000&&!/[\x00-\x1f<>]/.test(v),'POLICY_B_REFERENCE');}
function proof(v:{reference:string;sha256:string}){exactReadinessFields(v,'reference sha256');ref(v.reference);fundamentalHash(v.sha256);}
function issue(v:PolicyBIssue){
 exactReadinessFields(v,'id securityId kind severity status classification detail provenance resolutionReference');fundamentalId(v.id);if(v.securityId!==null)fundamentalId(v.securityId);
 requireFundamental(['TICKER_ISOLATED_BLOCKER','GLOBAL_SYSTEM_BLOCKER'].includes(v.kind)&&['CRITICAL','MAJOR','MINOR'].includes(v.severity)&&['OPEN','RESOLVED'].includes(v.status),'POLICY_B_ISSUE_CLASSIFICATION');ref(v.detail);
 requireFundamental(Array.isArray(v.provenance)&&v.provenance.length>0,'POLICY_B_PROVENANCE_REQUIRED');v.provenance.forEach(proof);
 requireFundamental(v.kind==='GLOBAL_SYSTEM_BLOCKER'?GLOBAL_BLOCKERS.includes(v.classification as typeof GLOBAL_BLOCKERS[number]):ISOLATED_BLOCKERS.includes(v.classification as typeof ISOLATED_BLOCKERS[number])&&v.securityId!==null,'POLICY_B_SHARED_FAILURE_CANNOT_BE_ISOLATED');
 requireFundamental(v.status==='OPEN'?v.resolutionReference===null:typeof v.resolutionReference==='string','POLICY_B_QUARANTINE_IS_NOT_RESOLUTION');if(v.resolutionReference!==null)ref(v.resolutionReference);
}
/** Independent acceptance hashes bind this complete register. A caller's PASS string is not authority. */
export function validatePolicyBAdmission(raw:PolicyBAdmission,hash:(v:unknown)=>string){
 const a=snapshot(raw);exactReadinessFields(a,'contract ownerApproval universe sourceIssueRegister issues members prerequisites');requireFundamental(a.contract===POLICY_B_VERSION,'POLICY_B_CONTRACT_VERSION');
 exactReadinessFields(a.ownerApproval,'reference sha256 effectiveDate');ref(a.ownerApproval.reference);fundamentalHash(a.ownerApproval.sha256);dateOnly(a.ownerApproval.effectiveDate);
 exactReadinessFields(a.universe,'asOf certification reference hash evidence identities identitiesHash');dateOnly(a.universe.asOf);fundamentalHash(a.universe.hash);proof(a.universe.evidence);
 // reference is exactly the same hash-bound UNIVERSE object used by the sealed DI snapshot.
 const u=a.universe.reference as {kind:string;version:string;knownAt:string;content:readonly string[]};
 exactReadinessFields(u,'kind version knownAt content');ref(u.version);instant(u.knownAt);requireFundamental(u.kind==='UNIVERSE'&&Array.isArray(u.content)&&u.content.length===30&&new Set(u.content).size===30,'POLICY_B_FULL_UNIVERSE_REQUIRED');u.content.forEach(fundamentalId);
 requireFundamental(hash(u)===a.universe.hash,'POLICY_B_UNIVERSE_HASH_MISMATCH');
 requireFundamental(Array.isArray(a.universe.identities)&&a.universe.identities.length===30&&new Set(a.universe.identities.map(m=>m.securityId)).size===30&&new Set(a.universe.identities.map(m=>m.ticker)).size===30&&hash(a.universe.identities)===a.universe.identitiesHash,'POLICY_B_CERTIFIED_IDENTITIES');
 for(const identity of a.universe.identities){exactReadinessFields(identity,'securityId ticker');fundamentalId(identity.securityId);fundamentalId(identity.ticker);requireFundamental(u.content.includes(identity.securityId),'POLICY_B_CERTIFIED_IDENTITIES');}
 exactReadinessFields(a.sourceIssueRegister,'reference sha256 issuesHash issues');ref(a.sourceIssueRegister.reference);fundamentalHash(a.sourceIssueRegister.sha256);fundamentalHash(a.sourceIssueRegister.issuesHash);
 requireFundamental(Array.isArray(a.issues)&&Array.isArray(a.sourceIssueRegister.issues)&&new Set(a.issues.map(i=>i.id)).size===a.issues.length&&new Set(a.sourceIssueRegister.issues.map(i=>i.id)).size===a.sourceIssueRegister.issues.length,'POLICY_B_ISSUE_IDS');
 a.issues.forEach(issue);a.sourceIssueRegister.issues.forEach(issue);
 requireFundamental(hash(a.sourceIssueRegister.issues)===a.sourceIssueRegister.issuesHash&&canonicalJson(a.issues)===canonicalJson(a.sourceIssueRegister.issues),'POLICY_B_ISSUE_INTEGRITY');
 requireFundamental(Array.isArray(a.members)&&a.members.length===30&&new Set(a.members.map(m=>m.securityId)).size===30&&new Set(a.members.map(m=>m.ticker)).size===30,'POLICY_B_EXACT_PARTITION');
 for(const m of a.members){
  exactReadinessFields(m,'securityId ticker state levelOnePass levelOneEvidence blockerIds reopenTriggers score quarantine');fundamentalId(m.securityId);fundamentalId(m.ticker);proof(m.levelOneEvidence);
  requireFundamental(a.universe.identities.some(i=>i.securityId===m.securityId&&i.ticker===m.ticker)&&u.content.includes(m.securityId)&&['SCORABLE','DEFERRED'].includes(m.state)&&typeof m.levelOnePass==='boolean','POLICY_B_PARTITION_MEMBER');
  requireFundamental(Array.isArray(m.blockerIds)&&new Set(m.blockerIds).size===m.blockerIds.length&&Array.isArray(m.reopenTriggers),'POLICY_B_MEMBER_BLOCKERS');
  requireFundamental(m.score===null,'POLICY_B_NO_PLACEHOLDER_SCORE');
  const open=a.issues.filter(i=>i.securityId===m.securityId&&i.status==='OPEN'&&['CRITICAL','MAJOR'].includes(i.severity));
  requireFundamental(m.blockerIds.every((id:string)=>open.some(i=>i.id===id))&&open.every(i=>m.blockerIds.includes(i.id)),'POLICY_B_EXACT_BLOCKER_ACCOUNTING');
  if(m.state==='SCORABLE'){requireFundamental(m.levelOnePass&&open.length===0&&m.blockerIds.length===0&&m.quarantine===null&&m.reopenTriggers.length===0,'POLICY_B_SCORABLE_HAS_MATERIAL_BLOCKER');}
  else{
   requireFundamental(!m.levelOnePass&&open.length>0&&open.every(i=>i.kind==='TICKER_ISOLATED_BLOCKER'),'POLICY_B_DEFERRED_REQUIRES_BLOCKER');
   requireFundamental(m.quarantine!==null,'POLICY_B_TECHNICAL_QUARANTINE_REQUIRED');exactReadinessFields(m.quarantine,'scoring ranking top10 positiveCapital dca weightRedistribution capitalRedistribution');requireFundamental(Object.values(m.quarantine).every(v=>v===false),'POLICY_B_TECHNICAL_QUARANTINE_REQUIRED');
   requireFundamental(m.reopenTriggers.length>0,'POLICY_B_REOPEN_TRIGGER_REQUIRED');
   for(const t of m.reopenTriggers){exactReadinessFields(t,'type condition evidenceReference');requireFundamental(['AUTHORITATIVE_ISSUER_FILING','REGULATORY_DISCLOSURE','ORIGINAL_SOURCE_ACCESSIBLE','ISSUER_DEFINITION_BRIDGE','AUTHORITATIVE_DEBT_NOTE'].includes(t.type),'POLICY_B_EVIDENCE_REOPEN_ONLY');ref(t.condition);ref(t.evidenceReference);}
  }
 }
 requireFundamental(a.issues.every(i=>i.securityId===null||u.content.includes(i.securityId)),'POLICY_B_ISSUE_OUTSIDE_UNIVERSE');
 requireFundamental(Array.isArray(a.prerequisites)&&a.prerequisites.length===14&&new Set(a.prerequisites.map(g=>g.gate)).size===14,'POLICY_B_OTHER_DI_GATES_REQUIRED');
 for(const g of a.prerequisites){exactReadinessFields(g,'gate status evidenceReference');requireFundamental(Array.from({length:14},(_,i)=>'DI'+(i+1)).includes(g.gate)&&['PASS','PENDING','FAIL','NOT_EXECUTED'].includes(g.status),'POLICY_B_DI_GATE');ref(g.evidenceReference);}
 return deepFreeze(a);
}
export function evaluatePolicyBDI15(raw:PolicyBAdmission,hash:(v:unknown)=>string){
 try{
  const a=validatePolicyBAdmission(raw,hash),reasons:string[]=[];
  if(a.universe.certification!=='PASS')reasons.push('POLICY_B_UNIVERSE_NOT_CERTIFIED');
  // Preserve v1's stricter Critical rule: no unresolved Critical, even purportedly isolated.
  for(const i of a.issues)if(i.status==='OPEN'&&(i.severity==='CRITICAL'||i.kind==='GLOBAL_SYSTEM_BLOCKER'))reasons.push('GLOBAL_SYSTEM_BLOCKER:'+i.id);
  const structuralReasons=[...reasons];for(const g of a.prerequisites)if(g.status!=='PASS')reasons.push('REQUIRED_DI_NOT_PASS:'+g.gate);
  return deepFreeze({status:reasons.length?'FAIL' as const:'PASS' as const,quarantineStatus:structuralReasons.length?'FAIL' as const:'PASS' as const,reasons,GLOBAL_SYSTEM_BLOCKERS:a.issues.filter(i=>i.status==='OPEN'&&(i.severity==='CRITICAL'||i.kind==='GLOBAL_SYSTEM_BLOCKER')),FULL_UNIVERSE_COUNT:a.members.length,SCORABLE_UNIVERSE_COUNT:a.members.filter(m=>m.state==='SCORABLE').length,DEFERRED_UNIVERSE_COUNT:a.members.filter(m=>m.state==='DEFERRED').length,readyForScoring:false,decisionReady:false});
 }catch(error){return deepFreeze({status:'FAIL' as const,quarantineStatus:'FAIL' as const,reasons:error instanceof ValidationError?error.issues.map(i=>i.reason):['POLICY_B_INVALID_CONTRACT'],GLOBAL_SYSTEM_BLOCKERS:[],FULL_UNIVERSE_COUNT:null,SCORABLE_UNIVERSE_COUNT:null,DEFERRED_UNIVERSE_COUNT:null,readyForScoring:false,decisionReady:false});}
}
/** Exclusion guard, never affirmative investment authorization. Existing M3/M4/M5 gates still apply. */
export function assertPolicyBAction(a:PolicyBAdmission,securityId:string,action:PolicyBAction,hash:(v:unknown)=>string){
 requireFundamental(POLICY_B_ACTIONS.includes(action),'POLICY_B_ACTION');
 requireFundamental(action!=='SCORE_WEIGHT_REDISTRIBUTION'&&action!=='CAPITAL_REDISTRIBUTION','POLICY_B_NO_REDISTRIBUTION');
 const review=evaluatePolicyBDI15(a,hash);requireFundamental(review.status==='PASS','POLICY_B_ADMISSION_NOT_ACCEPTED');
 requireFundamental(a.members.find(m=>m.securityId===securityId)?.state==='SCORABLE','DEFERRED_TICKER_NOT_SCORABLE');
}
export function policyBReporting(a:PolicyBAdmission,hash:(v:unknown)=>string){
 const p=validatePolicyBAdmission(a,hash),deferred=p.members.filter(m=>m.state==='DEFERRED');
 return deepFreeze({FULL_UNIVERSE_COUNT:p.members.length,SCORABLE_UNIVERSE_COUNT:p.members.length-deferred.length,DEFERRED_UNIVERSE_COUNT:deferred.length,deferredTickers:deferred.map(m=>m.ticker),rankingLabel:deferred.length?'Top ranked among currently scorable VN30 constituents':'VN30 ranking',weightRedistribution:false,capitalRedistribution:false});
}
