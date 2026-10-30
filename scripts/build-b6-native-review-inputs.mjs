/** Native-shaped isolated review artifacts, never SYNTHETIC_TEST or production approval. */
import './lib/ts-runtime.mjs';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
const {loadCanonicalRegistry}=await import('../src/infrastructure/fundamentals/canonical-registry.ts');
const {validateFundamentalObservation,validateFundamentalCapture}=await import('../src/domain/fundamentals/validation.ts');
const {assessAvailability}=await import('../src/domain/fundamentals/availability.ts');
const {buildFundamentalSnapshot}=await import('../src/domain/fundamentals/snapshot.ts');
const {snapshotHash}=await import('../src/infrastructure/fundamentals/snapshot-hash.ts');
const {instantiateSectorRequirements,approvedSectorRequirementTemplate}=await import('../src/domain/fundamentals/sector-requirement-templates.ts');
const {validateBridgePlan,bridgeScoringInputs}=await import('../src/domain/fundamentals/scoring-bridge.ts');
const {RUBRICS,SECTORS}=await import('../src/domain/scoring/methodology.ts');
const {decimal}=await import('../src/domain/portfolio/values.ts');
const out='docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-29/b6-integration-r1';
const read=p=>JSON.parse(readFileSync(p,'utf8')),sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
assert(!existsSync(out+'/native-review-manifest.json'),'NATIVE_REVIEW_EXISTS');
const at=new Date().toISOString(),dbBefore=sha('data/vn30.sqlite'),pins=[];
const save=(name,x)=>{const path=out+'/'+name;mkdirSync(path.slice(0,path.lastIndexOf('/')),{recursive:true});writeFileSync(path,JSON.stringify(x,null,2)+'\n');pins.push({path,sha256:sha(path)});};
const ledger=read(out+'/checked-source-ledger.json');
const catalog=read('docs/fundamental-data-engine/evidence/2026-10-19-level1-promotion-partition-closure/RELEASE.json').partition.members;
const sectors=new Map(read('docs/fundamental-data-engine/evidence/2026-10-17-data-initialization-final-acceptance/ACCOUNTING_RECONSTRUCTION.json').rows.map(r=>[r.ticker,r.sector]));
const downloads=read('data/manual-download/manifest.json').requests.filter(r=>r.status==='DOWNLOADED');
const sourceByHash=new Map();for(const r of downloads){assert.equal(sha(r.path),r.sha256);if(!sourceByHash.has(r.sha256))sourceByHash.set(r.sha256,r);}
const base=read('src/infrastructure/fundamentals/canonical-items-v1.json'),debt=read('src/infrastructure/fundamentals/debt-canonical-items-v2.json');
const definitions={
 BANK_CUSTOMER_DEPOSITS:['BALANCE','STOCK','CURRENCY','Reported customer deposits; not interbank funding or all liabilities.'],
 BANK_GROSS_CUSTOMER_LOANS:['BALANCE','STOCK','CURRENCY','Reported gross customer-loan population before loss allowances; not total credit risk assets.'],
 BANK_NET_INTEREST_INCOME:['INCOME','FLOW','CURRENCY','Reported net interest income; not total operating income.'],
 BANK_REPORTED_CAR:['SUPPLEMENTARY','RATIO','RATIO','Issuer-reported capital adequacy ratio under the stated framework and regulatory consolidation scope; preserve CCB basis.'],
 BANK_REPORTED_CET1:['SUPPLEMENTARY','RATIO','RATIO','Reported common equity tier1 ratio; never substitute total tier1 or CAR.'],
 TOTAL_EQUITY:['BALANCE','STOCK','CURRENCY','Reported total equity including NCI where present; not common equity or tangible book value.'],
 BANK_LOAN_LOSS_RESERVES:['BALANCE','STOCK','CURRENCY','Reported loan-loss allowance for the explicitly qualified loan population.'],
 CURRENT_ASSETS:['BALANCE','STOCK','CURRENCY','Reported current assets; not all assets or bank liquidity.'],
 INVENTORY:['BALANCE','STOCK','CURRENCY','Reported inventory at stated carrying amount; not project realizable NAV.'],
 SHORT_TERM_FINANCIAL_BORROWINGS:['BALANCE','STOCK','CURRENCY','Reported current financial borrowings including source-qualified current portions once.'],
 LONG_TERM_FINANCIAL_BORROWINGS:['BALANCE','STOCK','CURRENCY','Reported noncurrent financial borrowings; avoid double-counting current portions.'],
 CURRENT_LIABILITIES:['BALANCE','STOCK','CURRENCY','Reported current liabilities; not financial debt.'],
 RECEIVABLES:['BALANCE','STOCK','CURRENCY','Reported receivables for the source caption population; not automatically collectible cash.'],
 CASH_AND_EQUIVALENTS:['BALANCE','STOCK','CURRENCY','Reported cash and cash equivalents; not automatically unrestricted economically available cash.'],
 CASH_CAPEX_REPORTED:['CASH_FLOW','FLOW','CURRENCY','Reported cash payments for source-qualified investing/reinvestment captions; not normalized maintenance capex.'],
 BASIC_EPS:['INCOME','PER_SHARE','CURRENCY_PER_SHARE','Reported basic EPS for the stated period and share basis; not normalized or action-adjusted EPS.'],
 GROSS_PROFIT:['INCOME','FLOW','CURRENCY','Reported gross profit; not EBIT.'],
 NET_INCOME_ATTRIBUTABLE_PARENT:['INCOME','FLOW','CURRENCY','Reported after-tax profit attributable to parent owners; not automatically common-share earnings.'],
 OPERATING_PROFIT:['INCOME','FLOW','CURRENCY','Issuer-caption operating profit; not automatically normalized EBIT.'],
 FINANCIAL_DEBT:['SUPPLEMENTARY','STOCK','CURRENCY','Securities issuer financing population from reviewed borrowing/bond/other qualifying financing evidence; never total liabilities.'],
 SECURITIES_MARGIN_LOANS:['BALANCE','STOCK','CURRENCY','Gross margin-loan principal at carrying/original amount; exclude settlement advances and fair-value column unless specifically justified.'],
 BANK_REPORTED_NPL:['SUPPLEMENTARY','RATIO','RATIO','Reported NPL ratio with explicit numerator/denominator population; not silently loan-only or total-credit substituted.'],
 CONVERTIBLE_AND_EXCHANGEABLE_BOND_LIABILITIES:['BALANCE','STOCK','CURRENCY','Issuer-recognized convertible/exchangeable financing liability carrying amount; equity/options remain separate.'],
};
const method='b6-native-review-definitions-v1';
const originalItems=[...base.items,...debt.items];assert.equal(new Set(originalItems.map(i=>i.itemId)).size,originalItems.length);
const items=originalItems.map(i=>({...i,methodologyIdentity:method,authorityReferences:[...i.authorityReferences,'REVIEW_ONLY: original definition retained; no base/debt approval imported']}));
for(const [itemId,[statementType,measurementSemantic,unit,meaning]] of Object.entries(definitions)){
 const bank=itemId.startsWith('BANK_');
 items.push({itemId,name:itemId.replaceAll('_',' '),meaning,statementType,measurementSemantic,allowedUnits:[unit],currencyApplicability:unit==='RATIO'?'NONE':'REQUIRED',signConvention:'SIGNED',allowedReportingScopes:['CONSOLIDATED','SEPARATE_STANDALONE'],sectorApplicability:bank?['BANK']:['FINANCIAL_DEBT','SECURITIES_MARGIN_LOANS'].includes(itemId)?['SECURITIES']:SECTORS,evidenceTopicMappings:[],operandMappings:[],itemDefinitionVersion:'review-definition-1',methodologyIdentity:method,authorityReferences:['src/domain/fundamentals/manual-fundamental-evidence-requirements-v2.json','docs/03 SCORING/METRIC_DEFINITIONS.md',out+'/checked-source-ledger.json'],status:'ACTIVE',deprecatedFrom:null,supersededBy:null});
}
const registry=loadCanonicalRegistry({registryVersion:'b6-native-review-v1',methodologyIdentity:method,crosswalkVersion:'review-only-v1',governanceStatus:'PROPOSED',approvalReference:null,recordedAt:at,effectiveDate:at.slice(0,10),authorityReferences:['src/infrastructure/fundamentals/canonical-items-v1.json','src/infrastructure/fundamentals/debt-canonical-items-v2.json',out+'/checked-source-ledger.json'],items});
save('review-registry.json',registry);
const policy={version:'b6-initial-current-review-v1',algorithm:'operational-live-public-v3',governanceStatus:'PROPOSED',approvalReference:null,recordedAt:at,dateOnlyZones:['Asia/Ho_Chi_Minh','UTC'],dateOnlyEvidenceClasses:[],applicability:'INITIAL_LIVE_ONLY'};
const db=new DatabaseSync('data/vn30.sqlite',{readOnly:true});
const observations=[],assessments=[],liveBindings=[],contexts=[],rawCaptures=[],metricCandidates=[],excludedFacts=[];
const annualAcquisition=read('docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-29/annual-download-r1/download-manifest.json');
const normalizedScope=s=>s==='STANDALONE'?'SEPARATE_STANDALONE':s;
const key=f=>[f.ticker,f.itemId,f.period.start,f.period.end,normalizedScope(f.scope??f.reportingScope)].join('|');
const checked=new Map(ledger.facts.map(f=>[key(f),f])),used=new Set();
try{
 for(const row of db.prepare('SELECT id,body,body_hash FROM fundamental_admission_run ORDER BY id').all()){
  assert.equal(createHash('sha256').update(row.body).digest('hex'),row.body_hash);const admission=JSON.parse(row.body);
  for(const f of admission.canonicalFacts){
   const witness=checked.get(key(f));if(witness){assert.equal(decimal(witness.value).toString(),decimal(f.value).toString(),'SOURCE_VALUE_CONFLICT:'+key(f));used.add(witness.id);}
   append(f,witness,row.id);
  }
  metricCandidates.push(...admission.derivedMetrics.map(d=>({...d,formalNativeDerivation:false,nativeDerivationId:null})));
 }
 for(const f of ledger.facts)if(!used.has(f.id))append({...f,scope:f.reportingScope,sourceHash:f.sourceHash,reviewedAt:at,qualified:true,quality:'VALID'},f,'new-source-review');
}finally{db.close();}
function append(f,witness,admissionId){
 const member=catalog.find(m=>m.ticker===f.ticker);assert(member);const item=registry.manifest.items.find(i=>i.itemId===f.itemId);assert(item,'MISSING_DEFINITION:'+f.itemId);
 const scope=normalizedScope(witness?.reportingScope??f.scope);
 if(!item.sectorApplicability.includes(sectors.get(f.ticker))||!item.allowedReportingScopes.includes(scope)){excludedFacts.push({canonicalId:f.id,ticker:f.ticker,itemId:f.itemId,value:f.value,reason:'EXISTING_DEFINITION_DOES_NOT_AUTHORIZE_THIS_SECTOR_OR_SCOPE',preservedInAdmission:admissionId});return;}
 const sourceHash=witness?.sourceHash??f.sourceHash,source=sourceByHash.get(sourceHash),value=decimal(witness?.value??f.value).toString();
 const publicBodyHash=source?.archiveSha256??sourceHash;
 if(source?.archiveSha256){const record=annualAcquisition.records.find(r=>r.archive.url===source.url);assert(record);assert.equal(sha(record.archive.path),publicBodyHash);assert(record.pdfs.some(p=>p.sha256===sourceHash&&p.archiveEntry===source.archiveEntry));}
 const id='review-observation-'+snapshotHash({admissionId,canonicalId:f.id,witnessId:witness?.id??null}).slice(0,40);
 const captureId='review-capture-'+id.slice(-40),sourceVersionId='retained-review-source-v1';
 const retrievedAt=source?new Date(source.retrievedAt).toISOString():at;
 const period=f.period;
 const pub=ledger.publications.find(p=>p.sourceHash===sourceHash);
 const publication=pub?{publishedAt:null,publicationDate:pub.publicationDate,publicationPrecision:'DATE_ONLY',publicationStatus:'VERIFIED',timezone:pub.timezone,evidenceReference:pub.evidencePdf+'#page='+pub.page}:{publishedAt:null,publicationDate:null,publicationPrecision:'UNKNOWN',publicationStatus:'UNKNOWN',timezone:null,evidenceReference:null};
 const rawUnit=witness?.rawUnit??(f.unit==='RATIO'?'RATIO':f.unit==='CURRENCY_PER_SHARE'?'CURRENCY_PER_SHARE':'CURRENCY');
 const rawValue=witness?.rawValue??value;
 const semantic=item.measurementSemantic;
 const payload={contract:'retained-source-reference-capture-v1',sourcePdfPath:source?.path??null,sourcePdfSha256:sourceHash,publicAcquisitionReceipt:source??null,originalCanonicalRecord:f,checkedTranscription:witness??null,interpretation:'Reference to original retained PDF bytes plus canonical/transcription witness; not an issuer JSON endpoint or an original-publication timestamp.'};
 const capture={id:captureId,sourceVersionId,importExecutionId:'b6-review-import-v1',requestFingerprint:snapshotHash({sourceHash,canonicalId:f.id,originalUrl:source?.url??null}),resourceReference:'retained-pdf-reference:'+sourceHash,sourceRecordId:f.id,sourceRecordVersion:null,retrievedAt,mediaType:'application/vnd.vn30.retained-source-reference+json',responseStatus:200,payload:JSON.stringify(payload),payloadHash:createHash('sha256').update(JSON.stringify(payload)).digest('hex')};
 validateFundamentalCapture(capture);rawCaptures.push(capture);
 const o={id,scope:'REVIEW_CANDIDATE',securityId:member.securityId,ticker:f.ticker,identifierReference:'retained-universe:'+member.securityId,sourceVersionId,rawCaptureId:captureId,itemId:f.itemId,registryVersion:registry.manifest.registryVersion,registryHash:registry.registryHash,itemDefinitionVersion:item.itemDefinitionVersion,statementType:item.statementType,measurementSemantic:semantic,sector:sectors.get(f.ticker),reportingScope:scope,segment:null,accountingBasis:'ISSUER_REPORTED_SOURCE_CAPTION',auditStatus:witness&&['SSI','TCX'].includes(f.ticker)?'AUDITED':f.authority==='AUDITED_PDF'?'AUDITED':'UNKNOWN',periodStart:semantic==='STOCK'||semantic==='RATIO'?period.end:period.start,periodEnd:period.end,periodType:semantic==='STOCK'||semantic==='RATIO'?'INSTANT':period.end.endsWith('12-31')?'ANNUAL':'YTD',fiscalYear:Number(period.end.slice(0,4)),fiscalQuarter:semantic!=='STOCK'&&semantic!=='RATIO'&&!period.end.endsWith('12-31')?Math.ceil(Number(period.end.slice(5,7))/3):null,fiscalCalendarReference:'DECLARED_CALENDAR_YEAR_SOURCE_PERIOD',reportDate:null,reportDateReference:null,publication,providerReceivedAt:null,providerReceiptReference:null,retrievedAt,ingestedAt:at,availability:{availableAt:null,status:'UNKNOWN',policyReference:null,mode:null,provenanceReferences:[]},raw:{fieldId:f.itemId,label:item.name,fieldLocator:witness?witness.sourcePdfPath+'#page='+witness.page+';'+(witness.captionAndColumn??witness.method):'sqlite:fundamental_admission_run/'+admissionId+'/canonicalFacts/'+f.id,lexicalValue:String(rawValue),unit:rawUnit,multiplier:rawUnit==='PERCENT'?'0.01':'1',currency:item.currencyApplicability==='REQUIRED'?'VND':null},normalized:{value,unit:item.allowedUnits[0],currency:item.currencyApplicability==='REQUIRED'?'VND':null},mappingVersion:'b6-retained-and-checked-review-v1',transformationReferences:['document-sha256:'+sourceHash,'source-reference-capture:'+captureId,...(witness?.bankCapitalFramework?['bank-framework:'+witness.bankCapitalFramework]:[])],dataPresence:'AVAILABLE',quality:source?'VALID':'WARNING',applicability:'APPLICABLE',applicabilityReference:null,scopeFallback:null,fxLineageReference:null,revisionKind:'ORIGINAL',recordVersion:'b6-review-r1',supersedesObservationId:null,revisionReason:null,revisionEvidenceReference:null,correctionKnownAt:null,ancestorReferences:['retained-canonical:'+f.id,...(witness?['checked-transcription:'+witness.id]:[])]};
 if(source?.archiveSha256){o.transformationReferences=o.transformationReferences.filter(r=>!r.startsWith('document-sha256:'));o.transformationReferences.push('document-sha256:'+publicBodyHash,'extracted-pdf-sha256:'+sourceHash,'archive-member:'+source.archiveEntry);}
 validateFundamentalObservation(o,registry);observations.push(o);
 const binding=source?{observationHash:snapshotHash(o),sourceVersionId,bodyHash:publicBodyHash,documentUrl:source.url,retrievedAt:o.retrievedAt,verifiedAt:at,evidenceReference:'data/manual-download/manifest.json; path='+source.path+(source.archiveSha256?'; archive-public-body='+publicBodyHash:''),publicAccess:'UNAUTHENTICATED_PUBLIC_DOCUMENT',responseBodyHash:publicBodyHash,status:'VERIFIED'}:null;
 if(binding)liveBindings.push(binding);
 const a=assessAvailability({id:'review-availability-'+id.slice(-40),observation:o,registry,policy,assessedAt:at,livePublicDisclosureBinding:binding,hash:snapshotHash});assessments.push(a);
 contexts.push({observationId:id,canonicalId:f.id,sourceHash,sourceRetained:!!source,sourcePath:source?.path??null,checkedTranscriptionId:witness?.id??null,bankCapitalFramework:witness?.bankCapitalFramework??null,scopeBasis:witness?.scopeBasis??null,historicalPublicationExternallyVerified:false,eligibility:'INITIAL_CURRENT_REVIEW_ONLY',productionAdmissible:false});
}
assert.equal(new Set(observations.map(o=>o.id)).size,observations.length);
const market=read(out+'/market-qualification.json');
const reqs=new Map();for(const o of observations){const r={securityId:o.securityId,itemId:o.itemId,reportingScope:o.reportingScope,periodStart:o.periodStart,periodEnd:o.periodEnd,maxAgeDays:36500};reqs.set(JSON.stringify(r),r);}
const request={runId:'b6-current-review-20261029-r1',scope:'REVIEW_CANDIDATE',mode:'AS_KNOWN',decisionAsOf:at,systemKnownAt:at,marketCutoff:at,fundamentalCutoff:at,revisionCutoff:null,policy,requirementsVersion:'b6-review-sector-groups-v1',requirements:[...reqs.values()],references:[{kind:'UNIVERSE',version:'retained-project-30-v1',knownAt:at,content:catalog.map(m=>m.securityId)},{kind:'SECTOR',version:'retained-sector-review-v1',knownAt:at,content:catalog.map(m=>m.securityId+':'+sectors.get(m.ticker))},{kind:'MARKET',version:market.market.id,knownAt:market.builtAt,content:[market.market.id+':'+market.market.contentHash]}],assessmentPins:observations.map((o,i)=>({observationId:o.id,assessmentId:assessments[i].id})),derivedIds:[],builtAt:at,softwareBuild:'b6-native-review-inputs-v1',operatorReference:'CHATGPT_OWNER_AUTHORIZED_REVIEW',validationRunReference:'b6-native-review-validation-20261029-r1',reviewContext:'ISOLATED_CURRENT_REVIEW_NOT_PRODUCTION_OR_HISTORICAL_PUBLICATION_APPROVAL'};
const snapshot=buildFundamentalSnapshot(request,{registry,observations,assessments,derived:[],livePublicDisclosureBindings:liveBindings},snapshotHash);
save('native-review-snapshot.json',snapshot);save('native-review-sources.json',{registry,policy,observations,assessments,derived:[],livePublicDisclosureBindings:liveBindings,rawReferenceCaptures:rawCaptures,contexts,excludedFacts});
const summaries=[];
for(const member of catalog){
 const sector=sectors.get(member.ticker),obs=observations.filter(o=>o.securityId===member.securityId),selected=obs.filter(o=>snapshot.members.some(m=>m.observationId===o.id));
 const specs=[],requirementStatus=[];
 for(const end of ['2022-12-31','2023-12-31','2024-12-31','2025-12-31','2026-06-30']){
  const template=approvedSectorRequirementTemplate(sector),dimensions={};
  for(const itemId of [...new Set([...template.groups.flatMap(g=>g.anyOf),...template.supporting,...template.optional])]){
   const item=registry.manifest.items.find(i=>i.itemId===itemId);if(!item)continue;
   const matching=obs.filter(o=>o.itemId===itemId&&o.periodEnd===end),preferred=matching.find(o=>o.reportingScope==='CONSOLIDATED')??matching[0];
   const stock=['STOCK','RATIO'].includes(item.measurementSemantic);
   dimensions[itemId]={periodStart:preferred?.periodStart??(stock?end:end.slice(0,4)+'-01-01'),periodEnd:end,reportingScope:preferred?.reportingScope??(['LPB','TCX'].includes(member.ticker)?'SEPARATE_STANDALONE':'CONSOLIDATED'),unit:item.allowedUnits[0],currency:item.currencyApplicability==='REQUIRED'?'VND':null,preferredSources:[]};
  }
  const missing=template.groups.flatMap(g=>g.anyOf).filter(item=>!dimensions[item]);
  if(missing.length){specs.push({periodEnd:end,status:'BLOCKED_MISSING_DEFINITION',itemIds:missing});continue;}
  const instantiated=instantiateSectorRequirements(sector,'b6-'+member.ticker+'-'+end,dimensions);specs.push({periodEnd:end,...instantiated});
  for(const g of template.groups){const matches=obs.filter(o=>g.anyOf.includes(o.itemId)&&o.periodEnd===end);const deferred=member.ticker==='MBB'&&end==='2026-06-30'&&g.id==='capital_strength';requirementStatus.push({periodEnd:end,requirementId:g.id,anyOf:g.anyOf,status:deferred?'DEFERRED_BY_OWNER':matches.length?'BOUND_TO_NATIVE_REVIEW_OBSERVATIONS':'BLOCKED_MISSING_QUALIFIED_ITEM',observationIds:matches.map(o=>o.id),sourceUnavailable:matches.filter(o=>!contexts.find(c=>c.observationId===o.id).sourceRetained).map(o=>o.id)});}
 }
 const bridge={facts:selected.map(o=>({observationId:o.id,evidenceId:'review-evidence-'+o.id.slice(-40),validThrough:at})),metrics:[],external:[{evidenceId:'review-market-'+member.ticker,kind:'MARKET'}]};validateBridgePlan(bridge);
 let rejected=false;try{bridgeScoringInputs(snapshot,member.securityId,bridge,{registry,observations,assessments,derived:[]});}catch{rejected=true;}assert(rejected,'REVIEW_CANDIDATE_MUST_NOT_ENTER_FORMAL_BRIDGE');
 const factsById=new Map(obs.map(o=>[o.id,o]));
 const rubricInputs=RUBRICS.map(r=>({subcategory:r.id,category:r.category,source:'AI_REVIEW_CANDIDATE',selectedPoints:null,assessment:null,evidenceTopics:r.topics.map(topic=>({topic,observationIds:obs.filter(o=>registry.manifest.items.find(i=>i.itemId===o.itemId).evidenceTopicMappings.some(m=>m.rubricId===r.id&&m.topic===topic)).map(o=>o.id)})),rationale:'Reported facts and source limitations are assembled; no unsupported neutral score or HUMAN attribution.',counterEvidence:requirementStatus.filter(s=>s.status.startsWith('BLOCKED')).map(s=>s.requirementId+':'+s.periodEnd)}));
 const ni=obs.filter(o=>o.itemId==='NET_INCOME'&&['2024-12-31','2025-12-31'].includes(o.periodEnd));
 const a=ni.find(o=>o.periodEnd==='2024-12-31'),b=ni.find(o=>o.periodEnd==='2025-12-31');
 const financialNarrative={classification:'REPORTED_FACT_DESCRIPTION_NOT_INVESTMENT_SCORE',reportedProfit2024:a?.normalized.value??null,reportedProfit2025:b?.normalized.value??null,reportedProfitGrowth:a&&b&&decimal(a.normalized.value).positive?decimal(b.normalized.value).sub(decimal(a.normalized.value)).div(decimal(a.normalized.value)).toString():null,sourceObservationIds:[a?.id,b?.id].filter(Boolean),limitations:['Reported total profit growth is not normalized common EPS growth, moat proof or expected investment return.','Source-readiness and valuation assumptions remain explicit; no points inferred from labels or matching amounts.']};
 const body={contract:'b6-native-scoring-input-assembly-v1',ticker:member.ticker,securityId:member.securityId,sector,snapshotRunId:request.runId,contentHash:snapshot.contentHash,asOf:at,knownAt:at,artifactScope:'REVIEW_CANDIDATE',readyForScoring:false,retainedPartitionState:member.state,observations:obs,availability:assessments.filter(a=>factsById.has(a.observationId)),sectorRequirements:specs,requirementStatus,bridgePlan:bridge,bridgePlanSchema:'PASS',formalBridgeExecution:'BLOCKED_REVIEW_SCOPE_AS_EXPECTED',metricCandidates:metricCandidates.filter(m=>m.ticker===member.ticker),financialNarrative,rubricInputs,marketPrice:market.market.body.observations.find(o=>o.securityId===member.securityId),marketPurpose:'VALUATION_ONLY_NOT_FORMAL_SCORING',valuationAssumptions:null,stage0Assessment:null,hardVetoAssessment:null,residualRiskAssessment:null,fullScoreInput:null,remainingInputs:['EVIDENCE_BACKED_VALUATION_MODEL_AND_SCENARIOS','23_RUBRIC_JUDGMENTS_AND_COUNTEREVIDENCE','NATIVE_DERIVATION_AND_SELECTED_OPERAND_REVIEW','ITEM4_AI_RUNTIME_AUTHORITY_AND_SCOPE_ADMISSION']};
 save('native-inputs/'+member.ticker+'.json',body);
 summaries.push({ticker:member.ticker,sector,observations:obs.length,selectedForCurrentReview:selected.length,requirementsBound:requirementStatus.filter(s=>s.status==='BOUND_TO_NATIVE_REVIEW_OBSERVATIONS').length,requirementsBlocked:requirementStatus.filter(s=>s.status.startsWith('BLOCKED')).length,requirementsDeferred:requirementStatus.filter(s=>s.status==='DEFERRED_BY_OWNER').length,bridgeSchema:'PASS',formalScoringReady:false});
}
save('native-review-validation.json',{status:'PASS_NATIVE_REVIEW_SCHEMA_AND_CURRENT_SOURCE_BINDINGS_NOT_FORMAL_ACCEPTANCE',observations:observations.length,availabilityVerified:assessments.filter(a=>a.status==='VERIFIED').length,sourceUnavailable:contexts.filter(c=>!c.sourceRetained).length,selectedSnapshotMembers:snapshot.members.length,snapshotBlockers:snapshot.blockers,registryItems:registry.manifest.items.length,checkedSourceFacts:ledger.facts.length,bridgePlansValid:summaries.length,formalBridgeBypassRejected:summaries.length,scope:'REVIEW_CANDIDATE',policyGovernanceStatus:policy.governanceStatus,productionAdmission:false,scoringAuthorized:false,notes:['Initial-current public-document availability is conservative at this review ingestion time; it does not certify original publication or historical AS_KNOWN.','No synthetic test scope, fabricated original publication, HUMAN reviewer or neutral score used.'],members:summaries});
assert.equal(sha('data/vn30.sqlite'),dbBefore,'REVIEW_BUILDER_CHANGED_DB');
save('native-review-manifest.json',{contract:'b6-native-review-artifacts-v1',createdAt:at,snapshotRunId:request.runId,snapshotContentHash:snapshot.contentHash,databaseUnchanged:true,productionAdmissible:false,artifacts:[...pins]});
console.log(JSON.stringify({observations:observations.length,selected:snapshot.members.length,sourceUnavailable:contexts.filter(c=>!c.sourceRetained).length,validBridgePlans:summaries.length,formalScoringAuthorized:false}));
