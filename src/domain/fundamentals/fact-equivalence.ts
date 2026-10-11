import type {FundamentalObservation} from './contracts';
import {comparableKey} from './normalization';
import {fundamentalHash,requireFundamental} from './validation';
import {instant} from '@/shared/time';
export interface FactEquivalenceResolution {
 readonly kind:'SAME_ECONOMIC_FACT'|'SAME_REVISED_ECONOMIC_FACT';readonly observationHashes:readonly string[];
 readonly representativeHash:string;readonly recordedAt:string;readonly reason:string;
 readonly sourcePageEvidenceHashes:readonly string[];readonly status:'REVIEW_CANDIDATE'|'APPROVED';readonly approvalReference:string|null;
 /** Exact source-note proof that technical extraction labels describe the
  * same January–December fiscal calendar. Original contexts stay immutable. */
 readonly calendarEvidence?:readonly {readonly observationHash:string;readonly bodyHash:string;readonly calendar:'JANUARY_DECEMBER'|'EXACT_INSTANT_DATE';readonly sourcePageEvidenceHashes:readonly string[]}[];
 /** Positive preparation declarations establish comparison context only;
  * original UNKNOWN observations and their hashes are never rewritten. */
 readonly accountingBasisEvidence?:readonly {readonly observationHash:string;readonly bodyHash:string;readonly accountingBasis:'VAS';readonly sourcePageEvidenceHashes:readonly string[]}[];
}
export function equivalentRepresentative(rows:readonly FundamentalObservation[],resolutions:readonly FactEquivalenceResolution[],cutoff:string,hash:(v:unknown)=>string,lineage:readonly FundamentalObservation[]=[]){
 if(rows.length<2)return null;
 const hashes=rows.map(hash).sort(),r=resolutions.find(r=>JSON.stringify([...r.observationHashes].sort())===JSON.stringify(hashes));if(!r)return null;
 instant(r.recordedAt);requireFundamental(r.recordedAt<=cutoff&&['SAME_ECONOMIC_FACT','SAME_REVISED_ECONOMIC_FACT'].includes(r.kind),'EQUIVALENCE_KNOWLEDGE');
 requireFundamental(r.status==='APPROVED'?r.approvalReference!==null:r.status==='REVIEW_CANDIDATE'&&r.approvalReference===null,'EQUIVALENCE_APPROVAL');
 requireFundamental(rows.every(o=>o.scope==='REVIEW_CANDIDATE')||r.status==='APPROVED','FORMAL_EQUIVALENCE_APPROVAL');
 requireFundamental(new Set(hashes).size===rows.length&&new Set(r.sourcePageEvidenceHashes).size>=rows.length&&r.reason.length>0,'EQUIVALENCE_SOURCE_EVIDENCE');r.sourcePageEvidenceHashes.forEach(fundamentalHash);
 requireFundamental(new Set(rows.map(o=>JSON.stringify([o.registryHash,o.itemDefinitionVersion,o.statementType,o.measurementSemantic]))).size===1,'EQUIVALENCE_CANONICAL_DEFINITION');
 let comparisonRows=[...rows];
 if(r.accountingBasisEvidence){
  requireFundamental(r.accountingBasisEvidence.length===rows.length&&new Set(r.accountingBasisEvidence.map(e=>e.observationHash)).size===rows.length,'EQUIVALENCE_BASIS_EXACT_OCCURRENCES');
  for(const o of rows){
   const e=r.accountingBasisEvidence.find(e=>e.observationHash===hash(o));
   requireFundamental(e&&e.accountingBasis==='VAS'&&['UNKNOWN','VAS'].includes(o.accountingBasis)&&o.transformationReferences.includes('document-sha256:'+e.bodyHash),'EQUIVALENCE_SOURCE_BASIS_CONTEXT');
   fundamentalHash(e!.bodyHash);
   requireFundamental(new Set(e!.sourcePageEvidenceHashes).size>=2&&e!.sourcePageEvidenceHashes.every(h=>r.sourcePageEvidenceHashes.includes(h)),'EQUIVALENCE_BASIS_SOURCE_PROOFS');
   e!.sourcePageEvidenceHashes.forEach(fundamentalHash);
  }
  comparisonRows=rows.map(o=>({...o,accountingBasis:'VAS'}));
 }
 let keys=comparisonRows.map(comparableKey);
 if(r.calendarEvidence){
  requireFundamental(r.calendarEvidence.length===rows.length&&new Set(r.calendarEvidence.map(e=>e.observationHash)).size===rows.length,'EQUIVALENCE_CALENDAR_EXACT_OCCURRENCES');
  for(const [i,o] of comparisonRows.entries()){
   const e=r.calendarEvidence.find(e=>e.observationHash===hash(rows[i]));
   requireFundamental(e&&(e.calendar==='JANUARY_DECEMBER'||e.calendar==='EXACT_INSTANT_DATE'&&o.periodType==='INSTANT'&&o.periodStart===o.periodEnd)&&o.transformationReferences.includes('document-sha256:'+e.bodyHash)&&o.accountingBasis==='VAS'&&['SOURCE_EXPLICIT_CALENDAR_WINDOW','SOURCE_EXPLICIT_YEAR_END'].includes(o.fiscalCalendarReference)&&o.fiscalYear===Number(o.periodEnd.slice(0,4))&&(o.fiscalQuarter===null||o.fiscalQuarter===Math.ceil(Number(o.periodEnd.slice(5,7))/3)),'EQUIVALENCE_SOURCE_CALENDAR_CONTEXT');
   fundamentalHash(e!.bodyHash);
   requireFundamental(Array.isArray(e!.sourcePageEvidenceHashes)&&new Set(e!.sourcePageEvidenceHashes).size>=2&&e!.sourcePageEvidenceHashes.every(h=>r.sourcePageEvidenceHashes.includes(h)),'EQUIVALENCE_CALENDAR_SOURCE_PROOFS');
   e!.sourcePageEvidenceHashes.forEach(fundamentalHash);
  }
  requireFundamental(new Set(r.calendarEvidence.map(e=>e.calendar)).size===1,'EQUIVALENCE_CALENDAR_PROOF_KIND');
  // Only two non-economic extraction-context fields can be reconciled, and
  // only with source-bound proof for every occurrence. Basis, period type,
  // exact dates, scope, definition and values still have to agree.
  keys=comparisonRows.map(o=>comparableKey({...o,fiscalQuarter:null,fiscalCalendarReference:'SOURCE_EVIDENCED_'+r.calendarEvidence![0].calendar}));
 }
 requireFundamental(new Set(keys).size===1&&new Set(rows.map(o=>o.normalized.value)).size===1&&rows.every(o=>o.quality==='VALID'&&o.dataPresence==='AVAILABLE'),'EQUIVALENCE_EXACT_ECONOMIC_FACT');
 if(r.kind==='SAME_ECONOMIC_FACT')requireFundamental(rows.every(o=>o.revisionKind==='ORIGINAL'),'EQUIVALENCE_EXACT_ECONOMIC_FACT');
 else {
  requireFundamental(rows.some(o=>o.revisionKind==='ISSUER_RESTATEMENT'),'EQUIVALENCE_REVISED_HEAD_REQUIRED');
  for(const head of rows.filter(o=>o.revisionKind!=='ORIGINAL')){
   requireFundamental(head.revisionKind==='ISSUER_RESTATEMENT'&&head.publication.publicationStatus==='VERIFIED'&&head.publication.evidenceReference!==null&&head.revisionEvidenceReference!==null&&head.correctionKnownAt!==null&&head.correctionKnownAt<=r.recordedAt,'EQUIVALENCE_REVISED_DISCLOSURE');
   const ancestors:string[]=[];let current=head;
   while(current.supersedesObservationId!==null){
    const old=lineage.find(o=>o.id===current.supersedesObservationId);
    requireFundamental(old!==undefined&&old.id!==head.id&&!ancestors.includes(old.id)&&!rows.some(o=>o.id===old.id)&&comparableKey(old)===comparableKey(head)&&old.quality==='VALID'&&current.correctionKnownAt!==null&&old.ingestedAt<=current.correctionKnownAt&&current.correctionKnownAt<=r.recordedAt,'EQUIVALENCE_REVISED_CHAIN');
    if(old!.revisionKind!=='ORIGINAL')requireFundamental(old!.revisionKind==='ISSUER_RESTATEMENT'&&old!.publication.publicationStatus==='VERIFIED'&&old!.publication.evidenceReference!==null&&old!.revisionEvidenceReference!==null&&old!.correctionKnownAt!==null&&old!.correctionKnownAt<=current.correctionKnownAt!,'EQUIVALENCE_REVISED_CHAIN');
    ancestors.push(old!.id);current=old!;
   }
   requireFundamental(current.revisionKind==='ORIGINAL'&&ancestors.length>0&&JSON.stringify(ancestors)===JSON.stringify(head.ancestorReferences),'EQUIVALENCE_REVISED_CHAIN');
  }
 }
 // Equal facts have no score preference: canonical representative selected by content hash order.
 requireFundamental(r.representativeHash===hashes[0],'EQUIVALENCE_DETERMINISTIC_REPRESENTATIVE');return rows.find(o=>hash(o)===r.representativeHash)!;
}
