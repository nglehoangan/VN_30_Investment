import {it,expect} from 'vitest';
import {snapshotFixture} from '../fixtures/snapshot';
import {equivalentRepresentative} from '@/domain/fundamentals/fact-equivalence';
import {snapshotHash as hash} from '@/infrastructure/fundamentals/snapshot-hash';
import type {FundamentalObservation} from '@/domain/fundamentals/contracts';
it('equates instant calendar labels only for source-bound facts at the exact same balance-sheet date',()=>{
 const f=snapshotFixture(),body='c'.repeat(64),scope='REVIEW_CANDIDATE' as const;
 const a={...f.observation,scope,accountingBasis:'VAS',periodType:'INSTANT' as const,periodStart:f.observation.periodEnd,fiscalYear:Number(f.observation.periodEnd.slice(0,4)),fiscalQuarter:null,fiscalCalendarReference:'SOURCE_EXPLICIT_YEAR_END',transformationReferences:[...f.observation.transformationReferences,'document-sha256:'+body]};
 const b={...a,id:'instant-copy',fiscalCalendarReference:'SOURCE_EXPLICIT_CALENDAR_WINDOW'},rows=[a,b],hashes=rows.map(hash).sort(),proofs=['a'.repeat(64),'b'.repeat(64)];
 const r={kind:'SAME_ECONOMIC_FACT' as const,observationHashes:hashes,representativeHash:hashes[0],recordedAt:f.request.systemKnownAt,reason:'Exact source instant dates and values retained',sourcePageEvidenceHashes:proofs,status:'REVIEW_CANDIDATE' as const,approvalReference:null,calendarEvidence:rows.map(o=>({observationHash:hash(o),bodyHash:body,calendar:'EXACT_INSTANT_DATE' as const,sourcePageEvidenceHashes:proofs}))};
 expect(equivalentRepresentative(rows,[r],f.request.systemKnownAt,hash)).not.toBeNull();
 for(const change of [{itemDefinitionVersion:'incompatible-definition'},{registryHash:'d'.repeat(64)},{periodType:'ANNUAL' as const},{periodStart:'2020-01-01'},{periodEnd:'2020-12-31'},{accountingBasis:'UNKNOWN'},{fiscalCalendarReference:'ARBITRARY_CALENDAR'},{normalized:{...b.normalized,value:'999'}}]){
  const altered=[a,{...b,...change}],ah=altered.map(hash).sort();
  expect(()=>equivalentRepresentative(altered,[{...r,observationHashes:ah,representativeHash:ah[0],calendarEvidence:altered.map(o=>({observationHash:hash(o),bodyHash:body,calendar:'EXACT_INSTANT_DATE',sourcePageEvidenceHashes:proofs}))}],f.request.systemKnownAt,hash)).toThrow();
 }
 expect(()=>equivalentRepresentative(rows,[{...r,calendarEvidence:r.calendarEvidence.slice(1)}],f.request.systemKnownAt,hash)).toThrow();
 expect(a.fiscalCalendarReference).toBe('SOURCE_EXPLICIT_YEAR_END');
});
it('completes UNKNOWN basis comparison only with exact source preparation proof for every occurrence',()=>{
 const f=snapshotFixture(),body='c'.repeat(64),scope='REVIEW_CANDIDATE' as const;
 const a={...f.observation,scope,accountingBasis:'UNKNOWN',transformationReferences:[...f.observation.transformationReferences,'document-sha256:'+body]};
 const b={...a,id:'source-vas-copy',accountingBasis:'VAS'},rows=[a,b],hashes=rows.map(hash).sort(),proofs=['a'.repeat(64),'b'.repeat(64)];
 const r={kind:'SAME_ECONOMIC_FACT' as const,observationHashes:hashes,representativeHash:hashes[0],recordedAt:f.request.systemKnownAt,reason:'Exact preparation declarations and values retained',sourcePageEvidenceHashes:proofs,status:'REVIEW_CANDIDATE' as const,approvalReference:null,accountingBasisEvidence:rows.map(o=>({observationHash:hash(o),bodyHash:body,accountingBasis:'VAS' as const,sourcePageEvidenceHashes:proofs}))};
 expect(equivalentRepresentative(rows,[r],f.request.systemKnownAt,hash)).not.toBeNull();
 expect(a.accountingBasis).toBe('UNKNOWN');expect(hash(a)).toBe(rows.map(hash)[0]);
 for(const evidence of [undefined,r.accountingBasisEvidence.slice(1),r.accountingBasisEvidence.map(e=>({...e,bodyHash:'d'.repeat(64)})),r.accountingBasisEvidence.map(e=>({...e,sourcePageEvidenceHashes:['e'.repeat(64)]}))])expect(()=>equivalentRepresentative(rows,[{...r,accountingBasisEvidence:evidence}],f.request.systemKnownAt,hash)).toThrow();
 for(const change of [{accountingBasis:'IFRS'},{normalized:{...a.normalized,value:'999'}},{periodEnd:'2020-12-31'}]){
  const altered=[{...a,...change},b],ah=altered.map(hash).sort();
  expect(()=>equivalentRepresentative(altered,[{...r,observationHashes:ah,representativeHash:ah[0],accountingBasisEvidence:altered.map(o=>({observationHash:hash(o),bodyHash:body,accountingBasis:'VAS',sourcePageEvidenceHashes:proofs}))}],f.request.systemKnownAt,hash)).toThrow();
 }
});
it('reconciles extraction calendar labels only with exact source-note proof for every occurrence',()=>{
 const f=snapshotFixture(),scope='REVIEW_CANDIDATE' as const,body='c'.repeat(64);
 const a={...f.observation,scope,accountingBasis:'VAS',fiscalYear:Number(f.observation.periodEnd.slice(0,4)),fiscalQuarter:null,fiscalCalendarReference:'SOURCE_EXPLICIT_YEAR_END',transformationReferences:[...f.observation.transformationReferences,'document-sha256:'+body]};
 const quarter=Math.ceil(Number(a.periodEnd.slice(5,7))/3) as Exclude<FundamentalObservation['fiscalQuarter'],null>;
 const wrongQuarter=(quarter%4+1) as Exclude<FundamentalObservation['fiscalQuarter'],null>;
 const b={...a,id:'calendar-independent',fiscalQuarter:quarter,fiscalCalendarReference:'SOURCE_EXPLICIT_CALENDAR_WINDOW'};
 const rows=[a,b],hashes=rows.map(hash).sort(),proofs=['a'.repeat(64),'b'.repeat(64)];
 const r={kind:'SAME_ECONOMIC_FACT' as const,observationHashes:hashes,representativeHash:hashes[0],recordedAt:f.request.systemKnownAt,reason:'Both exact source annual-calendar declarations and agreeing cells retained',sourcePageEvidenceHashes:proofs,status:'REVIEW_CANDIDATE' as const,approvalReference:null,calendarEvidence:rows.map(o=>({observationHash:hash(o),bodyHash:body,calendar:'JANUARY_DECEMBER' as const,sourcePageEvidenceHashes:proofs}))};
 expect(equivalentRepresentative(rows,[r],f.request.systemKnownAt,hash)).not.toBeNull();
 expect(()=>equivalentRepresentative(rows,[{...r,calendarEvidence:undefined}],f.request.systemKnownAt,hash)).toThrow();
 expect(()=>equivalentRepresentative(rows,[{...r,calendarEvidence:r.calendarEvidence.slice(1)}],f.request.systemKnownAt,hash)).toThrow();
 expect(()=>equivalentRepresentative(rows,[{...r,calendarEvidence:r.calendarEvidence.map(e=>({...e,bodyHash:'d'.repeat(64)}))}],f.request.systemKnownAt,hash)).toThrow();
 expect(()=>equivalentRepresentative(rows,[{...r,sourcePageEvidenceHashes:['e'.repeat(64),'f'.repeat(64)]}],f.request.systemKnownAt,hash)).toThrow();
 for(const change of [{accountingBasis:'UNKNOWN'},{fiscalQuarter:wrongQuarter},{fiscalCalendarReference:'ARBITRARY_CALENDAR'},{periodEnd:'2020-12-31'},{normalized:{...b.normalized,value:'999'}}]){
  const altered=[a,{...b,...change}],ah=altered.map(hash).sort();
  expect(()=>equivalentRepresentative(altered,[{...r,observationHashes:ah,representativeHash:ah[0],calendarEvidence:altered.map(o=>({observationHash:hash(o),bodyHash:body,calendar:'JANUARY_DECEMBER' as const,sourcePageEvidenceHashes:proofs}))}],f.request.systemKnownAt,hash)).toThrow();
 }
 const formal=rows.map(o=>({...o,scope:'FORMAL' as const})),fh=formal.map(hash).sort();
 expect(()=>equivalentRepresentative(formal,[{...r,observationHashes:fh,representativeHash:fh[0]}],f.request.systemKnownAt,hash)).toThrow();
 expect(rows[0].fiscalCalendarReference).toBe('SOURCE_EXPLICIT_YEAR_END');
});
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
