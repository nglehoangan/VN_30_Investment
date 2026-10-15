import {it,expect} from 'vitest';
import {snapshotFixture} from '../fixtures/snapshot';
import {validateSourceFactRejections,type SourceFactRejection} from '@/domain/fundamentals/source-fact-rejection';
import {snapshotHash as hash} from '@/infrastructure/fundamentals/snapshot-hash';
it('quarantines a proven source mapping defect while retaining immutable original observations',()=>{
 const f=snapshotFixture(),body='a'.repeat(64),o={...f.observation,scope:'REVIEW_CANDIDATE' as const,transformationReferences:[...f.observation.transformationReferences,'document-sha256:'+body]};
 const r:SourceFactRejection={observationId:o.id,observationHash:hash(o),bodyHash:body,sourceLocator:o.raw.fieldLocator,recordedAt:f.request.systemKnownAt,reason:'WRONG_CANONICAL_CAPTION',sourceCaption:'Deposit insurance expense, not total deposits',sourcePeriodStart:o.periodStart,sourcePeriodEnd:o.periodEnd,sourcePageEvidenceHashes:['b'.repeat(64),'c'.repeat(64)],evidenceReference:'two-reader-proof:source-table',status:'REVIEW_CANDIDATE',approvalReference:null};
 expect(validateSourceFactRejections([r],[o],f.request.systemKnownAt,hash).has(o.id)).toBe(true);
 expect(hash(o)).toBe(r.observationHash);
 for(const change of [{observationHash:'d'.repeat(64)},{bodyHash:'e'.repeat(64)},{sourceLocator:'page:999/wrong'},{recordedAt:'2099-01-01T00:00:00.000Z'},{sourceCaption:o.raw.label},{sourcePageEvidenceHashes:['b'.repeat(64)]}])expect(()=>validateSourceFactRejections([{...r,...change}],[o],f.request.systemKnownAt,hash)).toThrow();
 expect(()=>validateSourceFactRejections([r,r],[o],f.request.systemKnownAt,hash)).toThrow();
 const formal={...o,scope:'FORMAL' as const};expect(()=>validateSourceFactRejections([{...r,observationHash:hash(formal)}],[formal],f.request.systemKnownAt,hash)).toThrow();
 expect(()=>validateSourceFactRejections([{...r,reason:'WRONG_SOURCE_COLUMN_PERIOD'}],[o],f.request.systemKnownAt,hash)).toThrow();
});

it('seals quarantine in the new manifest and replays without deleting either source occurrence',async()=>{
 const {buildFundamentalSnapshot}=await import('@/domain/fundamentals/snapshot');
 const {assessAvailability}=await import('@/domain/fundamentals/availability');
 const f=snapshotFixture('source-defect-snapshot'),body='a'.repeat(64);
 const good={...f.observation,scope:'REVIEW_CANDIDATE' as const,transformationReferences:[...f.observation.transformationReferences,'document-sha256:'+body]};
 const bad={...good,id:'incorrect-caption',raw:{...good.raw,lexicalValue:'999'},normalized:{...good.normalized,value:'999'}};
 const rows=[good,bad],at=f.request.systemKnownAt;
 const r:SourceFactRejection={observationId:bad.id,observationHash:hash(bad),bodyHash:body,sourceLocator:bad.raw.fieldLocator,recordedAt:at,reason:'WRONG_CANONICAL_CAPTION',sourceCaption:'Deposit insurance expense, not total deposits',sourcePeriodStart:bad.periodStart,sourcePeriodEnd:bad.periodEnd,sourcePageEvidenceHashes:['b'.repeat(64),'c'.repeat(64)],evidenceReference:'two-reader-proof:source-table',status:'REVIEW_CANDIDATE',approvalReference:null};
 const assessments=rows.map((observation,i)=>assessAvailability({id:'source-defect-assessment-'+i,observation,registry:f.registry,policy:f.policy,assessedAt:at,hash}));
 const request={...f.request,scope:'REVIEW_CANDIDATE' as const,assessmentPins:assessments.map(a=>({observationId:a.observationId,assessmentId:a.id}))};
 const inputs={registry:f.registry,observations:rows,assessments,derived:[]};
 expect(buildFundamentalSnapshot(request,inputs,hash).blockers).toContain('BLOCKED_CONFLICT');
 const result=buildFundamentalSnapshot(request,{...inputs,sourceFactRejections:[r]},hash);
 expect(result.members.map(m=>m.observationId)).toEqual([good.id]);
 const manifest=JSON.parse(result.manifest);expect(manifest.sourceFactRejections).toEqual([r]);
 expect(manifest.exclusions.some((e:{state:string})=>e.state==='QUARANTINED_SOURCE_EXTRACTION_OR_MAPPING_DEFECT')).toBe(true);
 expect(buildFundamentalSnapshot(request,{...inputs,observations:[...rows].reverse(),sourceFactRejections:[r]},hash).contentHash).toBe(result.contentHash);
 expect(rows).toHaveLength(2);
});
