import {it,expect} from 'vitest';
import {snapshotFixture} from '../fixtures/snapshot';
import {equivalentRepresentative} from '@/domain/fundamentals/fact-equivalence';
import {snapshotHash as hash} from '@/infrastructure/fundamentals/snapshot-hash';
it('exact economic equivalence preserves both facts and chooses a hash-defined representative',()=>{
 const f=snapshotFixture(),rows=[{...f.observation,scope:'REVIEW_CANDIDATE' as const},{...f.observation,id:'separate-receipt',rawCaptureId:'capture-2',scope:'REVIEW_CANDIDATE' as const}];
 const hashes=rows.map(hash).sort(),r={kind:'SAME_ECONOMIC_FACT' as const,observationHashes:hashes,representativeHash:hashes[0],recordedAt:f.request.systemKnownAt,reason:'Same issuer, caption, unit, definition, scope and period independently read in both public documents',sourcePageEvidenceHashes:['a'.repeat(64),'b'.repeat(64)],status:'REVIEW_CANDIDATE' as const,approvalReference:null};
 expect(hash(equivalentRepresentative(rows,[r],f.request.systemKnownAt,hash)!)).toBe(hashes[0]);expect(rows).toHaveLength(2);
 const changed=[rows[0],{...rows[1],normalized:{...rows[1].normalized,value:'999'}}],ch=changed.map(hash).sort();expect(()=>equivalentRepresentative(changed,[{...r,observationHashes:ch,representativeHash:ch[0]}],f.request.systemKnownAt,hash)).toThrow();
 expect(()=>equivalentRepresentative(rows,[{...r,recordedAt:'2099-01-01T00:00:00.000Z'}],f.request.systemKnownAt,hash)).toThrow();
});
it('equates a copied revised fact only with its complete known issuer revision chain',()=>{
 const f=snapshotFixture(),scope='REVIEW_CANDIDATE' as const;
 const old={...f.observation,id:'original',scope,normalized:{...f.observation.normalized,value:'90'}};
 const head={...f.observation,id:'issuer-restated',scope,revisionKind:'ISSUER_RESTATEMENT' as const,supersedesObservationId:old.id,ancestorReferences:[old.id],correctionKnownAt:f.request.systemKnownAt,revisionEvidenceReference:'issuer-note:restatement',publication:{...f.observation.publication,publicationStatus:'VERIFIED' as const,evidenceReference:'issuer-publication:restatement'}};
 const copy={...f.observation,id:'independent-copy',scope},rows=[head,copy],hashes=rows.map(hash).sort();
 const r={kind:'SAME_REVISED_ECONOMIC_FACT' as const,observationHashes:hashes,representativeHash:hashes[0],recordedAt:f.request.systemKnownAt,reason:'Exact corrected issuer cell and independent copy agree; original retained',sourcePageEvidenceHashes:['a'.repeat(64),'b'.repeat(64)],status:'REVIEW_CANDIDATE' as const,approvalReference:null};
 expect(equivalentRepresentative(rows,[r],f.request.systemKnownAt,hash,[old,...rows])).not.toBeNull();
 expect(()=>equivalentRepresentative(rows,[r],f.request.systemKnownAt,hash)).toThrow();
 expect(()=>equivalentRepresentative(rows,[{...r,kind:'SAME_ECONOMIC_FACT'}],f.request.systemKnownAt,hash,[old,...rows])).toThrow();
 expect(()=>equivalentRepresentative(rows,[r],f.request.systemKnownAt,hash,[{...old,periodEnd:'2020-12-31'},...rows])).toThrow();
 const future={...head,correctionKnownAt:'2099-01-01T00:00:00.000Z'},fh=[future,copy].map(hash).sort();
 expect(()=>equivalentRepresentative([future,copy],[{...r,observationHashes:fh,representativeHash:fh[0]}],f.request.systemKnownAt,hash,[old,future,copy])).toThrow();
 const intermediate={...head,id:'first-restatement',ancestorReferences:[old.id]},second={...head,id:'second-restatement',supersedesObservationId:intermediate.id,ancestorReferences:[intermediate.id,old.id]};
 const sh=[second,copy].map(hash).sort(),sr={...r,observationHashes:sh,representativeHash:sh[0]};
 expect(equivalentRepresentative([second,copy],[sr],f.request.systemKnownAt,hash,[old,intermediate,second,copy])).not.toBeNull();
 expect(()=>equivalentRepresentative([second,copy],[sr],f.request.systemKnownAt,hash,[old,{...intermediate,publication:{...intermediate.publication,publicationStatus:'UNKNOWN',evidenceReference:null}},second,copy])).toThrow();
 expect(()=>equivalentRepresentative([second,copy],[sr],f.request.systemKnownAt,hash,[old,{...intermediate,correctionKnownAt:'2099-01-01T00:00:00.000Z'},second,copy])).toThrow();
});
