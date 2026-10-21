import type { RuntimeReviewerIdentity,HumanReviewStore } from '@/ports/runtime-readiness';
import type { Assessment } from '@/domain/scoring/scorecard';
import { validateReviewContext,validateHumanSelection,type HumanReviewRecord,type AssessmentContext,type ReviewStatus } from '@/domain/fundamentals/runtime-review';
import { requireFundamental,fundamentalId } from '@/domain/fundamentals/validation';
import { snapshot } from '@/domain/scoring/validation';
import { instant } from '@/shared/time';
import { deepFreeze } from '@/domain/portfolio/transaction';

/** No HTTP route exposed. Trusted composition must supply authenticated identity and an append-only CAS store. */
export class ReviewAssessment {
  constructor(private readonly store:HumanReviewStore,private readonly identity:RuntimeReviewerIdentity,private readonly now:()=>string,private readonly hash:(v:unknown)=>string){}
  async draft(id:string,context:AssessmentContext,text:string|null=null) {
    fundamentalId(id);validateReviewContext(context);const actor=await this.identity.current();
    requireFundamental(actor.roles.includes('ANALYST')&&actor.subject.trim()&&actor.sessionReference.trim(),'AUTHENTICATED_ANALYST_REQUIRED');
    const at=this.now();instant(at);requireFundamental(at>=context.asOf,'REVIEW_BEFORE_ASOF');
    const body={id,context:snapshot(context),status:'DRAFT' as const,assessment:null,draft:text===null?null:{label:'UNTRUSTED_ANALYST_DRAFT' as const,text},actor:actor.subject,authenticatedSessionReference:actor.sessionReference,at,previousHash:null};
    const r=deepFreeze({...body,contentHash:this.hash(body)});await this.store.append(r,null);return r;
  }
  async transition(id:string,expectedHash:string,status:Exclude<ReviewStatus,'DRAFT'>,assessment?:Assessment) {
    const prior=await this.store.head(id);requireFundamental(prior&&prior.contentHash===expectedHash,'REVIEW_CAS_CONFLICT');
    const {contentHash,...priorBody}=prior;requireFundamental(this.hash(priorBody)===contentHash,'REVIEW_HASH_MISMATCH');
    const actor=await this.identity.current(),at=this.now();instant(at);
    requireFundamental(actor.subject.trim()&&actor.sessionReference.trim()&&at>=prior.at,'AUTHENTICATED_REVIEWER_REQUIRED');
    const allowed:Record<ReviewStatus,readonly ReviewStatus[]>={DRAFT:['REVIEWED','REJECTED'],REVIEWED:['APPROVED','REJECTED','INVALIDATED'],APPROVED:['INVALIDATED'],REJECTED:[],INVALIDATED:[]};
    requireFundamental(allowed[prior.status].includes(status),'REVIEW_TRANSITION_FORBIDDEN');
    requireFundamental((status==='INVALIDATED'?actor.roles.includes('OWNER'):actor.roles.includes('ANALYST')),'REVIEWER_AUTHORITY_REQUIRED');
    requireFundamental(status!=='APPROVED'||prior.context.validThrough>=at,'REVIEW_EXPIRED');
    if(status==='REVIEWED') {requireFundamental(assessment,'HUMAN_SELECTION_REQUIRED');validateHumanSelection(assessment,prior.context,actor.subject,at);}
    else requireFundamental(assessment===undefined,'REVIEW_CONTENT_IMMUTABLE');
    const body={...priorBody,status,assessment:status==='REVIEWED'?snapshot(assessment!):prior.assessment,actor:actor.subject,authenticatedSessionReference:actor.sessionReference,at,previousHash:contentHash};
    const r:HumanReviewRecord=deepFreeze({...body,contentHash:this.hash(body)});await this.store.append(r,expectedHash);return r;
  }
}
