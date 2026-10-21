// @vitest-environment node
import {it,expect} from 'vitest';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {runtimeFixture} from '../fixtures/runtime-readiness';
import {ReviewAssessment} from '@/application/fundamentals/review-assessment';
import {FileHumanReviews} from '@/infrastructure/repositories/file-human-reviews';
import {assessmentReuseCandidate,type AssessmentContext} from '@/domain/fundamentals/runtime-review';
function setup(){
 const f=runtimeFixture(),dir=mkdtempSync(join(tmpdir(),'runtime-human-')),store=new FileHumanReviews(dir),at=f.request.systemKnownAt;
 const context:AssessmentContext={securityId:f.input.securityId,rubricId:'BQ-MOAT',asOf:at,validThrough:'2026-08-01T00:00:00.000Z',methodologyHash:f.hash(f.input.methodology),executableHash:f.hash('executable'),
  evidenceHashes:f.input.evidence.map(e=>f.hash(e)).sort(),derivationHashes:[],sectorContextHash:f.hash(f.input.normalization),marketHash:f.hash('market'),invalidationTriggers:['EVIDENCE_CHANGED','OWNER_INVALIDATION']};
 const assessment={...f.input.assessments.find(a=>a.subcategory==='BQ-MOAT')!,analyst:f.identity.subject};
 const service=new ReviewAssessment(store,f.identityPort,()=>at,f.hash);
 return {...f,context,assessment,store,service,close:()=>rmSync(dir,{recursive:true,force:true})};
}
it('authenticated selection transitions draft → reviewed → approved, append-only with CAS',async()=>{
 const f=setup();try{
  const draft=await f.service.draft('review-test',f.context,'Machine narrative awaiting human review');expect(draft.draft?.label).toBe('UNTRUSTED_ANALYST_DRAFT');expect(draft.assessment).toBeNull();
  const reviewed=await f.service.transition(draft.id,draft.contentHash,'REVIEWED',f.assessment);
  const approved=await f.service.transition(draft.id,reviewed.contentHash,'APPROVED');expect(approved.assessment).toEqual(f.assessment);expect(approved.previousHash).toBe(reviewed.contentHash);
  expect((await new FileHumanReviews((f.store as unknown as {root:string}).root).head(draft.id))?.contentHash).toBe(approved.contentHash);
  await expect(f.service.transition(draft.id,draft.contentHash,'REJECTED')).rejects.toThrow(failure('REVIEW_CAS_CONFLICT'));
  expect(assessmentReuseCandidate(approved,f.context,f.context.asOf,f.hash)).toMatchObject({eligibleForOwnerReview:true,automaticReuseAuthorized:false});
 }finally{f.close();}
});
it('AI draft cannot become HUMAN approval or submit request-controlled analyst identity',async()=>{
 const f=setup();try{
  const d=await f.service.draft('ai-draft',f.context,'AI recommendation');
  await expect(f.service.transition(d.id,d.contentHash,'APPROVED')).rejects.toThrow(failure('REVIEW_TRANSITION_FORBIDDEN'));
  await expect(f.service.transition(d.id,d.contentHash,'REVIEWED',{...f.assessment,source:'AI' as never})).rejects.toThrow(failure('EXPLICIT_AUTHENTICATED_HUMAN_SELECTION_REQUIRED'));
  await expect(f.service.transition(d.id,d.contentHash,'REVIEWED',{...f.assessment,analyst:'request-controlled-owner'})).rejects.toThrow(failure('EXPLICIT_AUTHENTICATED_HUMAN_SELECTION_REQUIRED'));
  expect((await f.store.head(d.id))?.status).toBe('DRAFT');
 }finally{f.close();}
});
it('reviewer capability is required and owner invalidation is terminal',async()=>{
 const f=setup();try{
  f.identity.roles=[];await expect(f.service.draft('denied',f.context)).rejects.toThrow(failure('AUTHENTICATED_ANALYST_REQUIRED'));f.identity.roles=['ANALYST'];
  const d=await f.service.draft('invalidate',f.context),r=await f.service.transition(d.id,d.contentHash,'REVIEWED',f.assessment),a=await f.service.transition(d.id,r.contentHash,'APPROVED');
  await expect(f.service.transition(d.id,a.contentHash,'INVALIDATED')).rejects.toThrow(failure('REVIEWER_AUTHORITY_REQUIRED'));f.identity.roles=['OWNER'];const invalid=await f.service.transition(d.id,a.contentHash,'INVALIDATED');
  expect(assessmentReuseCandidate(invalid,f.context,f.context.asOf,f.hash).eligibleForOwnerReview).toBe(false);
  await expect(f.service.transition(d.id,invalid.contentHash,'APPROVED')).rejects.toThrow(failure('REVIEW_TRANSITION_FORBIDDEN'));
 }finally{f.close();}
});
it.each(['evidenceHashes','methodologyHash','executableHash','marketHash','sectorContextHash','derivationHashes','asOf'] as const)('%s change invalidates reuse eligibility',async key=>{
 const f=setup();try{
  const d=await f.service.draft('reuse-change',f.context),r=await f.service.transition(d.id,d.contentHash,'REVIEWED',f.assessment),a=await f.service.transition(d.id,r.contentHash,'APPROVED');
  const next={...f.context,[key]:key.endsWith('Hashes')?[f.hash('changed')]:key==='asOf'?'2026-07-28T00:00:00.000Z':f.hash('changed')};
  expect(assessmentReuseCandidate(a,next,f.context.asOf,f.hash).reasons).toContain('DEPENDENCY_CHANGED:'+key);
 }finally{f.close();}
});
it('unapproved/expired and forged review records never qualify for reuse',async()=>{
 const f=setup();try{
  const d=await f.service.draft('expiry',f.context);expect(assessmentReuseCandidate(d,f.context,f.context.asOf,f.hash).eligibleForOwnerReview).toBe(false);
  const r=await f.service.transition(d.id,d.contentHash,'REVIEWED',f.assessment),a=await f.service.transition(d.id,r.contentHash,'APPROVED');
  expect(assessmentReuseCandidate(a,f.context,'2026-09-01T00:00:00.000Z',f.hash).eligibleForOwnerReview).toBe(false);
  expect(assessmentReuseCandidate({...a,assessment:{...f.assessment,selectedPoints:0}},f.context,f.context.asOf,f.hash).reasons).toContain('REVIEW_HASH_MISMATCH');
 }finally{f.close();}
});

function failure(reason:string){return expect.objectContaining({issues:expect.arrayContaining([expect.objectContaining({reason})])});}
