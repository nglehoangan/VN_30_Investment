/** The requirement selector is broader than comparableKey; report both levels. */
export function snapshotConflictDiagnostics(snapshot,observations,withdrawals=[]){
 const manifest=JSON.parse(snapshot.manifest),withdrawn=new Set(withdrawals.map(w=>w.observationId));
 return manifest.findings.filter(f=>f.code==='BLOCKED_CONFLICT').map(f=>{
  const q=f.requirement;
  if(!q||!Array.isArray(f.candidates)||f.candidates.length<2)throw Error('SNAPSHOT_CONFLICT_DIAGNOSTIC_BINDING');
  const rows=observations.filter(o=>!withdrawn.has(o.id)&&o.securityId===q.securityId&&o.itemId===q.itemId&&o.reportingScope===q.reportingScope&&o.periodStart===q.periodStart&&o.periodEnd===q.periodEnd);
  if(rows.length!==f.candidates.length)throw Error('SNAPSHOT_CONFLICT_OCCURRENCES_NOT_COMPLETE');
  return {key:'SNAPSHOT_REQUIREMENT:'+JSON.stringify(q),requirement:q,
   observationIds:rows.map(o=>o.id),values:rows.map(o=>o.normalized.value),
   type:'SNAPSHOT_REQUIRED_MULTIPLE_ROOTS_OR_CONTEXTS',
   selectorCandidateFingerprints:f.candidates.map(c=>c.fingerprint),
   contexts:rows.map(o=>({observationId:o.id,ticker:o.ticker,accountingBasis:o.accountingBasis,
    fiscalCalendarReference:o.fiscalCalendarReference,fiscalYear:o.fiscalYear,fiscalQuarter:o.fiscalQuarter,
    periodType:o.periodType,itemDefinitionVersion:o.itemDefinitionVersion,rawUnit:o.raw.unit,
    normalizedValue:o.normalized.value,sourceVersionId:o.sourceVersionId,
    definitionReferences:o.transformationReferences.filter(r=>r.startsWith('document-sha256:')||r.includes('definition-evidence:')||r.includes('exact-caption'))})),
   resolution:'EXACT_SOURCE_AND_CALENDAR_DEFINITION_REVIEW_REQUIRED; NO_LATEST_OR_ROUNDED_VALUE_ALIAS'};
 });
}
