/** Current review assembly from retained and directly checked evidence; no production writes. */
import './lib/ts-runtime.mjs';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
const {validateFundamentalObservation,validateFundamentalCapture}=await import('../src/domain/fundamentals/validation.ts');
const {assessAvailability}=await import('../src/domain/fundamentals/availability.ts');
const {buildFundamentalSnapshot}=await import('../src/domain/fundamentals/snapshot.ts');
const {snapshotHash}=await import('../src/infrastructure/fundamentals/snapshot-hash.ts');
const {deriveFundamentals,validateCrosswalk}=await import('../src/domain/fundamentals/derivation.ts');
const {validateBridgePlan,bridgeScoringInputs}=await import('../src/domain/fundamentals/scoring-bridge.ts');
const {SECTORS}=await import('../src/domain/scoring/methodology.ts');
const {decimal}=await import('../src/domain/portfolio/values.ts');
const root='docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-30/b6-close-inputs-r1';
const prior='docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-29/b6-integration-r1';
const read=p=>JSON.parse(readFileSync(p,'utf8')),sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const at=new Date().toISOString(),dbHash=sha('data/vn30.sqlite');
const save=(name,value)=>{const path=root+'/'+name;mkdirSync(path.slice(0,path.lastIndexOf('/')),{recursive:true});writeFileSync(path,JSON.stringify(value,null,2)+'\n');return {path,sha256:sha(path)};};
const original=read(prior+'/native-review-sources.json'),oldSnapshot=read(prior+'/native-review-snapshot.json');
const registry=original.registry,policy=original.policy;
const downloads=read('data/manual-download/manifest.json').requests.filter(r=>r.status==='DOWNLOADED');
const sourceByHash=new Map();for(const r of downloads){assert.equal(sha(r.path),r.sha256);if(!sourceByHash.has(r.sha256))sourceByHash.set(r.sha256,r);if(r.archivePath)assert.equal(sha(r.archivePath),r.archiveSha256);}
const bank=read(root+'/checked-bank-sources.json').facts,corporate=read(root+'/checked-corporate-sources.json').facts;
const vnm=read(root+'/vnm-qualified-borrowings.json').facts;
const witnesses=read(root+'/retained-pdf-witness-recovery.json').rows;
const ledger=[...bank,...corporate,...read(root+'/checked-history-sources.json').facts,...read(root+'/current-qualified-borrowings.json').facts,...read(root+'/checked-comparative-sources.json').facts];
const witnessByCanonical=new Map(witnesses.map(w=>[w.canonicalId,{id:'retained-pdf-witness-'+snapshotHash(w).slice(0,24),ticker:w.ticker,itemId:w.itemId,
  value:w.witness.value,rawValue:w.witness.value,rawUnit:w.witness.unit,multiplier:'1',unit:w.witness.unit,currency:w.witness.currency,
  period:w.witness.period,reportingScope:w.witness.scope,sourceHash:w.witness.sourceHash,sourcePdfPath:w.pdfPath,
  page:Number(/page[: ](\d+)/i.exec(w.witness.evidenceLocator??'')?.[1]??0),captionAndColumn:w.witness.evidenceLocator,
  method:'EXISTING_REVIEWED_PDF_WITNESS_IDENTICAL_RETAINED_BYTES',reviewedAt:at,legacyWitness:w.witness} ]));
const captures=new Map(original.rawReferenceCaptures.map(c=>[c.id,c]));
const observations=[],rawCaptures=[],contexts=[],resolutions=[];
function fresh(o,canonical,witness,source,kind){
 const next=structuredClone(o),sourceHash=witness?.sourceHash??canonical.sourceHash;
 const id='b6r2-observation-'+snapshotHash({previous:o.id,witness:witness?.id??null,sourceHash,kind}).slice(0,36);
 const captureId='b6r2-capture-'+id.slice(-36),publicHash=source.archiveSha256??sourceHash;
 const payload={contract:'retained-source-reference-capture-v2',publicAcquisitionReceipt:source,sourcePdfPath:source.path,sourcePdfSha256:sourceHash,
   originalCanonicalRecord:canonical,checkedTranscription:witness??null,previousObservationId:o.id,sourceResolution:kind,
   interpretation:'Local evidence descriptor referencing actual retained public PDF/archive bytes. Not a new issuer JSON response and not original-publication proof.'};
 const payloadText=JSON.stringify(payload);
 const capture={id:captureId,sourceVersionId:o.sourceVersionId,importExecutionId:'b6-source-recovery-20261030',requestFingerprint:snapshotHash({id,source}),
   resourceReference:'retained-pdf-reference:'+sourceHash,sourceRecordId:canonical.id,sourceRecordVersion:null,retrievedAt:new Date(source.retrievedAt).toISOString(),
   mediaType:'application/vnd.vn30.retained-source-reference+json',responseStatus:source.httpStatus,payload:payloadText,payloadHash:createHash('sha256').update(payloadText).digest('hex')};
 next.id=id;next.rawCaptureId=captureId;next.retrievedAt=capture.retrievedAt;next.ingestedAt=at;next.quality='VALID';next.recordVersion='b6-current-review-r2';
 next.normalized.value=decimal(witness?.value??o.normalized.value).toString();
 if(witness){
   next.raw={fieldId:next.itemId,label:witness.captionAndColumn??next.itemId,fieldLocator:witness.sourcePdfPath+'#page='+witness.page,
     lexicalValue:String(witness.sourcePrintedSignedValue??witness.rawValue??witness.value),unit:witness.rawUnit,multiplier:witness.multiplier,currency:next.normalized.currency};
   next.transformationReferences.push('checked-source:'+witness.id);
   if(witness.signNormalization||witness.sourcePrintedSignedValue?.startsWith('-')&&decimal(next.normalized.value).positive)next.transformationReferences.push('sign-policy:positive-disclosed-acquisition-cash-spend');
 }
 next.transformationReferences=next.transformationReferences.filter(r=>!r.startsWith('document-sha256:')&&!r.startsWith('extracted-pdf-sha256:')&&!r.startsWith('archive-member:'));
 next.transformationReferences.push('document-sha256:'+publicHash,...(source.archiveSha256?['extracted-pdf-sha256:'+sourceHash,'archive-member:'+source.archiveEntry]:[]));
 next.ancestorReferences.push('previous-review-observation:'+o.id,'source-resolution:'+kind);
 // Unknown original publication remains unknown, even when the PDF is recovered today.
 validateFundamentalCapture(capture);validateFundamentalObservation(next,registry);
 rawCaptures.push(capture);return next;
}
for(const o of original.observations){
 const oldContext=original.contexts.find(c=>c.observationId===o.id),capture=captures.get(o.rawCaptureId),canonical=JSON.parse(capture.payload).originalCanonicalRecord;
 let witness=ledger.find(f=>f.priorObservationIds.includes(o.id))??witnessByCanonical.get(canonical.id),source=sourceByHash.get(witness?.sourceHash??oldContext.sourceHash);
 let effective=o,kind=oldContext.sourceRetained?'PREVIOUS_RETAINED_SOURCE':source?'EXACT_SOURCE_BYTES_RECOVERED':'UNRESOLVED';
 if(!oldContext.sourceRetained&&source){
   if(witness)kind=witness.legacyWitness?'QUALIFIED_PDF_WITNESS_RECOVERED':'DIRECT_SOURCE_IMAGE_REBOUND';
   if(witness&&decimal(witness.value).toString()!==decimal(o.normalized.value).toString()){
     assert.equal(witness.comparison,'CONFLICT');assert.equal(o.ticker,'HPG');assert.equal(canonical.authority,'CAFEF_STRUCTURED');
     kind='PDF_FIRST_REVIEW_SELECTION_WITH_PROVIDER_DIFFERENCE';
   }
   effective=fresh(o,canonical,witness,source,kind);
 }else rawCaptures.push(capture);
 observations.push(effective);
 contexts.push({...oldContext,observationId:effective.id,previousObservationId:o.id,sourceHash:witness?.sourceHash??oldContext.sourceHash,
   sourceRetained:!!source,sourcePath:source?.path??null,checkedTranscriptionId:witness?.id??oldContext.checkedTranscriptionId,
   debtMetadata:witness?.debtMetadata??oldContext.debtMetadata,resolution:kind,originalAuthority:canonical.authority??null,productionAdmissible:false});
 if(!oldContext.sourceRetained)resolutions.push({previousObservationId:o.id,observationId:effective.id,ticker:o.ticker,itemId:o.itemId,periodEnd:o.periodEnd,
   status:kind,originalAuthority:canonical.authority??null,originalHash:oldContext.sourceHash,currentHash:witness?.sourceHash??oldContext.sourceHash,
   sourcePath:source?.path??null,value:o.normalized.value,reviewSelectedValue:effective.normalized.value,
   selectionRule:kind==='PDF_FIRST_REVIEW_SELECTION_WITH_PROVIDER_DIFFERENCE'?'src/domain/fundamentals/report-display-source-priority-v2.json':null,
   providerErrorAsserted:false,formalAdmission:false,
   remainingReason:source?null:o.ticker==='HPG'&&canonical.authority==='CAFEF_STRUCTURED'?'OLD_CAFEF_CAPTURE_NOT_RETAINED_AND_NO_QUALIFIED_PDF_WITNESS':o.ticker==='VPL'?'FY2022_SOURCE_MISSING_LATER_OPENING_BALANCE_CANNOT_BE_RELABELLED_CLOSING':o.itemId==='BANK_REPORTED_NPL'?'REVIEW_TOTAL_CREDIT_RISK_POPULATION_AND_PERIOD_ON_CURRENT_NOTE':'SOURCE_COLUMN_OR_RESTATEMENT_VINTAGE_NEEDS_EXPLICIT_REVIEW'});
}
for(const f of vnm){
 const component=original.observations.find(o=>o.ticker==='VNM'&&o.itemId==='SHORT_TERM_FINANCIAL_BORROWINGS'&&o.periodEnd===f.period.end),item=registry.manifest.items.find(i=>i.itemId===f.itemId);
 const template={...structuredClone(component),itemId:f.itemId,statementType:item.statementType,measurementSemantic:item.measurementSemantic,
   itemDefinitionVersion:item.itemDefinitionVersion,normalized:{value:f.value,unit:f.unit,currency:f.currency},ancestorReferences:[...component.ancestorReferences,'validated-debt-receipt:'+f.receiptId]};
 const canonical={...f,id:f.id,scope:f.reportingScope,authority:'DIRECT_PDF_REPORTED_DEBT_REVIEW'};
 const o=fresh(template,canonical,f,sourceByHash.get(f.sourceHash),'VNM_VALIDATED_REPORTED_DEBT_RECEIPT');observations.push(o);
 contexts.push({observationId:o.id,canonicalId:f.id,sourceHash:f.sourceHash,sourceRetained:true,sourcePath:f.sourcePdfPath,checkedTranscriptionId:f.id,
   debtMetadata:f.debtMetadata,resolution:'VNM_VALIDATED_REPORTED_DEBT_RECEIPT',productionAdmissible:false});
}
assert.equal(new Set(observations.map(o=>o.id)).size,observations.length);
const liveBindings=[],assessments=[];
for(const o of observations){
 const ctx=contexts.find(c=>c.observationId===o.id),source=sourceByHash.get(ctx.sourceHash),publicHash=source?.archiveSha256??ctx.sourceHash;
 const binding=source?{observationHash:snapshotHash(o),sourceVersionId:o.sourceVersionId,bodyHash:publicHash,documentUrl:source.url,retrievedAt:o.retrievedAt,verifiedAt:at,
   evidenceReference:'data/manual-download/manifest.json;'+source.path,publicAccess:'UNAUTHENTICATED_PUBLIC_DOCUMENT',responseBodyHash:publicHash,status:'VERIFIED'}:null;
 if(binding)liveBindings.push(binding);
 assessments.push(assessAvailability({id:'b6r2-availability-'+snapshotHash(o.id).slice(0,36),observation:o,registry,policy,assessedAt:at,livePublicDisclosureBinding:binding,hash:snapshotHash}));
}
const reqs=new Map();for(const o of observations){const r={securityId:o.securityId,itemId:o.itemId,reportingScope:o.reportingScope,periodStart:o.periodStart,periodEnd:o.periodEnd,maxAgeDays:36500};reqs.set(JSON.stringify(r),r);}
const request={...oldSnapshot.request,runId:'b6-current-review-20261030-r2',decisionAsOf:at,systemKnownAt:at,marketCutoff:at,fundamentalCutoff:at,
 requirements:[...reqs.values()],assessmentPins:observations.map((o,i)=>({observationId:o.id,assessmentId:assessments[i].id})),derivedIds:[],builtAt:at,
 softwareBuild:'b6-native-review-inputs-r2',validationRunReference:'b6-source-and-input-validation-20261030-r1'};
const inputs={registry,observations,assessments,derived:[],livePublicDisclosureBindings:liveBindings};
let snapshot=buildFundamentalSnapshot(request,inputs,snapshotHash);
const selectedIds=new Set(snapshot.members.map(m=>m.observationId)),selected=observations.filter(o=>selectedIds.has(o.id));
const derivationSectors=SECTORS.filter(s=>!['BANK','SECURITIES','INSURANCE'].includes(s));
const crosswalk=validateCrosswalk({version:'b6-disclosed-cash-acquisition-fcf-review-v1',recordedAt:at,effectiveDate:at.slice(0,10),governanceStatus:'PROPOSED',approvalReference:null,
 registryHash:registry.registryHash,formulaVersion:'existing-metrics-v1',precisionPolicy:'decimal-12-half-even-v1',
 authorityReferences:[root+'/checked-corporate-sources.json','docs/03 SCORING/METRIC_DEFINITIONS.md','Reported acquisition cash spending; not maintenance-normalized owner earnings; not primary project NAV for real estate.'],
 routes:derivationSectors.map(sector=>({sector,metric:'FCF',operands:[{role:'CFO',itemId:'CFO',operation:'REPORTED'},{role:'issuer_capex',itemId:'CASH_CAPEX_REPORTED',operation:'REPORTED'}]}))},registry);
const derived=[];
for(const cfo of selected.filter(o=>o.itemId==='CFO'&&derivationSectors.includes(o.sector))){
 const caps=selected.filter(o=>o.securityId===cfo.securityId&&o.itemId==='CASH_CAPEX_REPORTED'&&o.periodStart===cfo.periodStart&&o.periodEnd===cfo.periodEnd&&o.reportingScope===cfo.reportingScope&&decimal(o.normalized.value).units>=0n);
 if(caps.length!==1)continue;
 const cap=caps[0],id='b6r2-fcf-'+snapshotHash([cfo.id,cap.id]).slice(0,32);
 const d=deriveFundamentals({request:{id,scope:'REVIEW_CANDIDATE',securityId:cfo.securityId,sector:cfo.sector,metric:'FCF',periodStart:cfo.periodStart,periodEnd:cfo.periodEnd,cyclical:false,
   operands:[{id:id+'-cfo',operation:'REPORTED',observationIds:[cfo.id],adjustment:null},{id:id+'-capex',operation:'REPORTED',observationIds:[cap.id],adjustment:null}]},recordedAt:at,registry,crosswalk,crosswalkHash:snapshotHash(crosswalk),observations:[cfo,cap],hash:snapshotHash});
 assert.equal(d.status,'CALCULATED');assert.equal(d.value,decimal(cfo.normalized.value).sub(decimal(cap.normalized.value)).toString());derived.push(d);
}
inputs.derived=derived;request.derivedIds=derived.map(d=>d.id);snapshot=buildFundamentalSnapshot(request,inputs,snapshotHash);
save('native-review-sources.json',{...inputs,policy,rawReferenceCaptures:rawCaptures,contexts,crosswalk,excludedFacts:original.excludedFacts});
save('native-review-snapshot.json',snapshot);save('source-resolution.json',{originalGapCount:347,resolved:resolutions.filter(r=>r.status!=='UNRESOLVED').length,unresolved:resolutions.filter(r=>r.status==='UNRESOLVED').length,rows:resolutions});
const members=[];
for(const ticker of [...new Set(observations.map(o=>o.ticker))].sort()){
 const old=read(prior+'/native-inputs/'+ticker+'.json'),all=observations.filter(o=>o.ticker===ticker),available=all.filter(o=>snapshot.members.some(m=>m.observationId===o.id));
 const requirementStatus=old.requirementStatus.map(g=>{
   const matching=all.filter(o=>g.anyOf.includes(o.itemId)&&o.periodEnd===g.periodEnd),eligible=matching.filter(o=>available.some(a=>a.id===o.id));
   return {...g,observationIds:matching.map(o=>o.id),selectedObservationIds:eligible.map(o=>o.id),sourceUnavailable:matching.filter(o=>!contexts.find(c=>c.observationId===o.id).sourceRetained).map(o=>o.id),
     status:g.status==='DEFERRED_BY_OWNER'?g.status:eligible.length?'BOUND_SELECTED_REVIEW_OBSERVATIONS':matching.length?'BLOCKED_SOURCE_EVIDENCE':'BLOCKED_MISSING_QUALIFIED_ITEM'};
 });
 const ds=derived.filter(d=>d.request.securityId===old.securityId);
 const bridge={facts:available.map(o=>({observationId:o.id,evidenceId:'r2e-'+o.id,validThrough:at})),
   metrics:ds.map(d=>({derivationId:d.id,requestId:d.id+'-request',evidenceIds:[d.id+'-e1',d.id+'-e2'],validThrough:at})),external:old.bridgePlan.external};validateBridgePlan(bridge);
 assert.throws(()=>bridgeScoringInputs(snapshot,old.securityId,bridge,inputs),error=>error.issues?.some(i=>i.reason==='CANDIDATES_NOT_FOR_SCORING'));
 const unresolved=resolutions.filter(r=>r.ticker===ticker&&r.status==='UNRESOLVED');
 const body={...old,contract:'b6-native-scoring-input-assembly-v2',asOf:at,knownAt:at,snapshotRunId:request.runId,contentHash:snapshot.contentHash,
   observations:all,availability:assessments.filter(a=>all.some(o=>o.id===a.observationId)),requirementStatus,bridgePlan:bridge,
   nativeDerivations:ds.map(d=>({id:d.id,value:d.value,periodStart:d.request.periodStart,periodEnd:d.request.periodEnd,operandObservationIds:d.observations.map(o=>o.id),
     definition:'CFO minus disclosed acquisition cash spending; not normalized maintenance owner earnings or investment value',status:d.status})),
   sourceGaps:unresolved,readyForScoring:false,fullScoreInput:null,
   remainingInputs:['QUALIFIED_COMMON_EARNINGS_AND_COMMON_EQUITY_NOT_TOTALS','NORMALIZATION_AND_CORPORATE_ACTION_COMPARABILITY','VALUATION_MODELS_SCENARIOS_AND_DISCOUNT_RATES','RUBRIC_AND_RISK_EVIDENCE_REVIEW','ITEM4_AI_RUNTIME_AUTHORITY_AND_SCOPE_ADMISSION']};
 save('native-inputs/'+ticker+'.json',body);
 members.push({ticker,observations:all.length,selected:available.length,unresolvedSourceObservations:unresolved.length,nativeFcfDerivations:ds.length,
   requirementGroupsBlocked:requirementStatus.filter(g=>g.status.startsWith('BLOCKED')).length,deferred:requirementStatus.filter(g=>g.status==='DEFERRED_BY_OWNER').length,bridgeSchema:'PASS',readyForScoring:false});
}
assert.equal(sha('data/vn30.sqlite'),dbHash,'INPUT_REVIEW_MUST_NOT_WRITE_DATABASE');
save('native-review-validation.json',{status:'PASS_REVIEW_SCHEMA_SOURCE_REPLAY_AND_DERIVATION_NOT_FORMAL_SCORING',observations:observations.length,selected:snapshot.members.length,
 nativeFcfDerivations:derived.length,sourceGapsResolved:resolutions.filter(r=>r.status!=='UNRESOLVED').length,sourceGapsRemaining:resolutions.filter(r=>r.status==='UNRESOLVED').length,
 vnmReportedDebtGroupsQualified:3,otherCurrentReportedDebtGroupsQualified:5,snapshotBlockers:snapshot.blockers,bridgePlansValid:members.length,reviewToFormalRejected:members.length,databaseUnchanged:true,databaseSha256:dbHash,members,scoringAuthorized:false});
console.log(JSON.stringify({observations:observations.length,selected:snapshot.members.length,resolved:resolutions.filter(r=>r.status!=='UNRESOLVED').length,
 unresolved:resolutions.filter(r=>r.status==='UNRESOLVED').length,nativeFcfDerivations:derived.length,scoringAuthorized:false}));
