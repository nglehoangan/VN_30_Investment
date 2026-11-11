/** G4/G5/G7 REVIEW PROTOTYPE ONLY. No score/point/confidence-level calculation. */
import {check} from '@/domain/scoring/validation';
export type Role='REQUIRED'|'SUPPORTING'|'CONTEXT_ONLY';
export interface Dependency {readonly id:string;readonly rubric:string;readonly kind:'TOPIC'|'METRIC'|'EVIDENCE';readonly role:Role;readonly usable:boolean;readonly topic?:string;readonly issue:string|null}
export function reviewDependencies(dependencies:readonly Dependency[],mandatoryTopics:Readonly<Record<string,readonly string[]>>) {
 const blocked=new Set<string>(),review=new Set<string>(),context:string[]=[];
 // Source/metric identity cannot be downgraded by adding a weaker duplicate role.
 const precedence={REQUIRED:3,SUPPORTING:2,CONTEXT_ONLY:1}as const;
 const effective=dependencies.filter(d=>!dependencies.some(x=>x.id===d.id&&x.rubric===d.rubric&&precedence[x.role]>precedence[d.role]));
 for(const [rubric,topics]of Object.entries(mandatoryTopics))for(const topic of topics){
  const proofs=effective.filter(d=>d.rubric===rubric&&d.kind==='TOPIC'&&d.topic===topic);
  check(!proofs.some(d=>d.role!=='REQUIRED'),'MANDATORY_TOPIC_CANNOT_BE_DOWNGRADED');
  if(!proofs.some(d=>d.usable))blocked.add(rubric);
 }
 for(const d of effective)if(!d.usable){
  if(d.role==='REQUIRED')blocked.add(d.rubric);
  else if(d.role==='SUPPORTING')review.add(d.rubric);
  else context.push(d.id);
 }
 return {blockedRubrics:[...blocked].sort(),confidenceReviewRubrics:[...review].sort(),contextIssues:[...new Set(context)].sort(),completeTotalBlocked:blocked.size>0,policyChanged:false,productionAdmissible:false};
}
