// @vitest-environment node
import {it,expect} from 'vitest';
import {snapshotFixture} from '../fixtures/snapshot';
import {validateSourcePeriodWithdrawals} from '@/domain/fundamentals/source-period-withdrawal';
import type {SourcePeriodWithdrawal} from '@/domain/fundamentals/source-period-withdrawal';
import {buildFundamentalSnapshot} from '@/domain/fundamentals/snapshot';
import {assessAvailability} from '@/domain/fundamentals/availability';
import type {LiveAvailabilityPolicy} from '@/domain/fundamentals/availability';
import {snapshotHash as hash} from '@/infrastructure/fundamentals/snapshot-hash';
function fixture(){
 const f=snapshotFixture('period-withdrawal'),bodyHash='a'.repeat(64);
 const old={...f.observation,scope:'REVIEW_CANDIDATE' as const,transformationReferences:['document-sha256:'+bodyHash,'qualification:prior-q']};
 const next={...old,id:'corrected-period',periodStart:'2026-01-01',periodEnd:'2026-03-31',periodType:'QUARTER' as const,fiscalQuarter:1 as const,transformationReferences:['document-sha256:'+bodyHash,'qualification:corrected-q']};
 const r:SourcePeriodWithdrawal={observationId:old.id,observationHash:hash(old),replacementObservationId:next.id,replacementObservationHash:hash(next),priorQualificationId:'prior-q',correctedQualificationId:'corrected-q',bodyHash,recordedAt:f.request.systemKnownAt,reason:'SOURCE_PERIOD_QUALIFICATION_CORRECTION',sourcePageEvidenceHashes:['b'.repeat(64),'c'.repeat(64)],status:'REVIEW_CANDIDATE',approvalReference:null};
 return {f,old,next,r};
}
it('withdraws only the exact period-defective occurrence and retains a same-source/value replacement',()=>{
 const {f,old,next,r}=fixture();expect([...validateSourcePeriodWithdrawals([r],[old,next],f.request.systemKnownAt,hash)]).toEqual([old.id]);expect(old.periodEnd).toBe('2026-06-30');expect(next.periodEnd).toBe('2026-03-31');
 for(const mutate of [(o:typeof next)=>({...o,normalized:{...o.normalized,value:'999'}}),(o:typeof next)=>({...o,sourceVersionId:'other-source'}),(o:typeof next)=>({...o,periodStart:old.periodStart,periodEnd:old.periodEnd,periodType:old.periodType}),(o:typeof next)=>({...o,transformationReferences:old.transformationReferences})]){
  const invalid=mutate(next);expect(()=>validateSourcePeriodWithdrawals([{...r,replacementObservationHash:hash(invalid)}],[old,invalid],f.request.systemKnownAt,hash)).toThrow();
 }
 expect(()=>validateSourcePeriodWithdrawals([{...r,recordedAt:'2099-01-01T00:00:00.000Z'}],[old,next],f.request.systemKnownAt,hash)).toThrow();
 expect(()=>validateSourcePeriodWithdrawals([{...r,sourcePageEvidenceHashes:['b'.repeat(64),'b'.repeat(64)]}],[old,next],f.request.systemKnownAt,hash)).toThrow();
});
it('requires external approval for withdrawal of FORMAL occurrences',()=>{
 const {f,old,next,r}=fixture(),rows=[{...old,scope:'FORMAL' as const},{...next,scope:'FORMAL' as const}],formal={...r,observationHash:hash(rows[0]),replacementObservationHash:hash(rows[1])};
 expect(()=>validateSourcePeriodWithdrawals([formal],rows,f.request.systemKnownAt,hash)).toThrow();
 expect([...validateSourcePeriodWithdrawals([{...formal,status:'APPROVED',approvalReference:'independent-review'}],rows,f.request.systemKnownAt,hash)]).toEqual([old.id]);
});

it('binds withdrawal into a new snapshot manifest while preserving both immutable occurrences',()=>{
 const {f,old,next,r}=fixture(),at=f.request.systemKnownAt;
 const policy:LiveAvailabilityPolicy={version:'test-live-v3',algorithm:'operational-live-public-v3',applicability:'INITIAL_LIVE_ONLY',governanceStatus:'PROPOSED',approvalReference:null,recordedAt:at,dateOnlyZones:['UTC','Asia/Ho_Chi_Minh'],dateOnlyEvidenceClasses:[]};
 const rows=[old,next],bindings=rows.map(o=>({observationHash:hash(o),sourceVersionId:o.sourceVersionId,bodyHash:r.bodyHash,responseBodyHash:r.bodyHash,documentUrl:'https://issuer.example/report.pdf',retrievedAt:o.retrievedAt,verifiedAt:at,evidenceReference:'test-public-proof',publicAccess:'UNAUTHENTICATED_PUBLIC_DOCUMENT' as const,status:'VERIFIED' as const}));
 const assessments=rows.map((observation,i)=>assessAvailability({id:'period-assessment-'+i,observation,registry:f.registry,policy,assessedAt:at,livePublicDisclosureBinding:bindings[i],hash}));
 const request={...f.request,scope:'REVIEW_CANDIDATE' as const,policy,requirements:rows.map(o=>({...f.request.requirements[0],periodStart:o.periodStart,periodEnd:o.periodEnd})),assessmentPins:assessments.map(a=>({observationId:a.observationId,assessmentId:a.id}))};
 const inputs={registry:f.registry,observations:rows,assessments,derived:[],livePublicDisclosureBindings:bindings,sourcePeriodWithdrawals:[r]};
 const result=buildFundamentalSnapshot(request,inputs,hash);expect(result.members.map(m=>m.observationId)).toEqual([next.id]);
 const manifest=JSON.parse(result.manifest);expect(manifest.sourcePeriodWithdrawals).toEqual([r]);expect(manifest.exclusions.some((e:{state:string})=>e.state==='WITHDRAWN_SOURCE_PERIOD_QUALIFICATION_CORRECTION')).toBe(true);
 const replay=buildFundamentalSnapshot(request,{...inputs,observations:[...rows].reverse()},hash);expect(replay.contentHash).toBe(result.contentHash);
 expect(()=>buildFundamentalSnapshot({...request,policy:f.policy},inputs,hash)).toThrow();
});
