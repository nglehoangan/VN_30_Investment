import './lib/ts-runtime.mjs';
import {readFileSync,writeFileSync,existsSync,mkdirSync,readdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const {buildManualCurrentSnapshot,MANUAL_EVIDENCE_REQUIREMENTS,admitManualStatement}=await import('../src/domain/fundamentals/manual-first.ts');
const {canonicalJson}=await import('../src/domain/fundamentals/snapshot.ts');
const {normalizeLexical}=await import('../src/domain/fundamentals/normalization.ts');
const root=resolve(import.meta.dirname,'..');
const evidenceArg=process.argv.find(a=>a.startsWith('--evidence-dir='))?.slice(15);
const out=resolve(root,evidenceArg??'docs/fundamental-data-engine/evidence/2026-10-13-manual-first-refactor');
mkdirSync(out,{recursive:true});
assert(!existsSync(join(out,'ARTIFACT_HASHES.json')),'This dated evidence package is sealed. Create a new dated package and audit for another initialization; never overwrite reviewed evidence.');
const old='docs/fundamental-data-engine/evidence/2026-10-12-governance-closure-selected-path-corrected/';
const reconciled='docs/fundamental-data-engine/evidence/2026-10-11-final-reconciliation/';
const previous='docs/fundamental-data-engine/evidence/2026-10-13-clean-production-initialization/';
const read=p=>JSON.parse(readFileSync(join(root,p),'utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const hash=v=>sha(canonicalJson(v));
const write=(name,v)=>writeFileSync(join(out,name),JSON.stringify(v,null,2)+'\n');
// Physical discovery is mandatory before qualification; a sealed PDF list is never discovery authority.
const physical=JSON.parse(readFileSync(join(out,'PHYSICAL_MANUAL_CORPUS_INVENTORY.json'),'utf8'));
assert.equal(physical.unexplainedFiles,0,'CORPUS_RECONCILIATION_FAILED');
const discovered=[];
function discover(dir){for(const e of readdirSync(dir,{withFileTypes:true})){const p=join(dir,e.name);assert(!e.isSymbolicLink(),'Unresolved corpus symlink');if(e.isDirectory())discover(p);else {assert(e.isFile(),'Unresolved nonregular corpus entry');discovered.push({path:p.slice(root.length+1),sha256:sha(readFileSync(p))});}}}
discover(join(root,'data/manual-fundamentals'));
assert.equal(discovered.length,physical.files.length,'Physical inventory stale: rerun reconciliation');
for(const f of discovered)assert(physical.files.some(r=>r.path===f.path&&r.sha256===f.sha256),'Physical inventory changed: '+f.path);
const audit={retainedPdfInventory:physical.files.filter(f=>f.eligibleFinancialStatementProcessing).map(f=>({...f,tickerHint:f.tickerDirectory}))};
const packet=read(old+'EXECUTION_PACKAGE_REDACTED.json');
const qualifications=read(reconciled+'DOCUMENT_QUALIFICATION_RECONCILIATION.json');
const cells=read(reconciled+'SOURCE_CELL_AUDIT.json');
const official=read(previous+'PRODUCTION_UNIVERSE.json');
const members=official.datedOfficialCandidateMembers;
const analysisAt=process.argv.find(a=>a.startsWith('--analysis-at='))?.slice(14)??new Date().toISOString();
const sectorMap=new Map(packet.canonicalObservations.map(o=>[o.ticker,o.sector]));
const universe=members.map(m=>({ticker:m.ticker,sector:sectorMap.get(m.ticker)}));
assert(universe.length===30&&universe.every(u=>Object.hasOwn(MANUAL_EVIDENCE_REQUIREMENTS.sectors,u.sector)));
const readers=new Map(),readerFailures=[];
function pageReader(bodyHash,page){
 const key=bodyHash+':'+page;if(readers.has(key))return readers.get(key);
 const path='data/manual-extracted/current/ocr/'+bodyHash+'-p'+page+'.json';
 if(!existsSync(join(root,path))){readers.set(key,null);return null;}
 try{const bytes=readFileSync(join(root,path)),reader=JSON.parse(bytes);assert.equal(reader.bodyHash,bodyHash);assert.equal(reader.page,page);
  const proof={path,sha256:sha(bytes),renderSha256:reader.renderSha256,bodyHash,page};readers.set(key,proof);return proof;
 }catch{readers.set(key,null);readerFailures.push({bodyHash,page,reason:'RETAINED_READER_INVALID'});return null;}
}
const statements=[],documentQualification=[],manifest=[];
for(const f of audit.retainedPdfInventory){
 const bytes=readFileSync(join(root,f.path)),digest=sha(bytes);assert.equal(digest,f.sha256);assert.equal(bytes.subarray(0,5).toString(),'%PDF-');
 const q=qualifications.find(q=>q.bodyHash===digest);
 const observations=packet.canonicalObservations.filter(o=>o.transformationReferences.includes('document-sha256:'+digest));
 const requiredDimensions=['ISSUER_IDENTITY','DOCUMENT_TYPE','REPORTING_SCOPE','REPORTING_PERIOD'];
 const evidence=requiredDimensions.map(d=>({dimension:d,pages:(q?.relevantPageEvidence?.[d]??[]).map(p=>pageReader(digest,p)).filter(Boolean)}));
 const qualified=q?.status==='QUALIFIED'&&q.issuer===true&&q.period&&q.scope&&evidence.every(e=>e.pages.length>0)&&observations.length>0;
 const scopes=new Set(observations.map(o=>o.reportingScope));
 const reportingScope=q?.scope==='CONSOLIDATED'?'CONSOLIDATED':'STANDALONE';
 const expectedOldScope=reportingScope==='CONSOLIDATED'?'CONSOLIDATED':'SEPARATE_STANDALONE';
 const currencyValues=[...new Set(observations.map(o=>o.normalized.currency).filter(Boolean))];
 const publication=observations.find(o=>o.publication.publicationStatus==='VERIFIED'&&o.publication.publicationPrecision==='TIMESTAMP'&&o.publication.publishedAt&&o.publication.evidenceReference)?.publication;
 const fiscalYearEnd=q?.period?.type==='ANNUAL'?Number(q.period.end.slice(5,7)):null;
 const annualQualification=qualifications.find(x=>x.ticker===q?.ticker&&x.status==='QUALIFIED'&&x.period?.type==='ANNUAL');
 const calendarMonth=fiscalYearEnd??(annualQualification?Number(annualQualification.period.end.slice(5,7)):null);
 const s={documentId:'manual-sha256:'+digest,SHA256:digest,ticker:q?.ticker??f.tickerHint,issuer:members.find(m=>m.ticker===(q?.ticker??f.tickerHint))?.issuer??'UNKNOWN',documentType:'FINANCIAL_STATEMENTS',reportingPeriod:{start:q?.period?.start??'1900-01-01',end:q?.period?.end??'1900-01-01'},fiscalYear:q?.period?.fiscalYear??1900,fiscalQuarter:q?.period?.fiscalQuarter??null,reportingScope,currency:currencyValues.length===1?currencyValues[0]:'UNKNOWN',unitBasis:[...new Set(observations.map(o=>o.raw.unit))].sort().join(';')||'UNKNOWN',retainedPath:f.path,importedAt:analysisAt,reviewedAt:analysisAt,publishedAt:publication?.publishedAt??null,historicalAvailability:publication?'VERIFIED':'UNKNOWN',reviewStatus:qualified&&scopes.has(expectedOldScope)&&currencyValues.length===1?'QUALIFIED':'REVIEW_REQUIRED',reviewReference:reconciled+'DOCUMENT_QUALIFICATION_RECONCILIATION.json#'+digest,verifiedHash:digest,cadence:'QUARTERLY',fiscalYearEndMonth:calendarMonth};
 // Keep known unqualified document identities visible; only qualification admits their facts.
 if(q?.period&&q?.scope)statements.push(s);
 const inventoryIdentity={...s,reportingPeriod:q?.period?{start:q.period.start,end:q.period.end}:null,fiscalYear:q?.period?.fiscalYear??null,reportingScope:q?.scope?reportingScope:null,currency:s.currency==='UNKNOWN'?null:s.currency,unitBasis:s.unitBasis==='UNKNOWN'?null:s.unitBasis};
 manifest.push({...f,documentId:s.documentId,identity:inventoryIdentity,sourceOwnership:'MANUAL_FINANCIAL_STATEMENTS'});
 documentQualification.push({documentId:s.documentId,sha256:digest,status:s.reviewStatus,method:'REUSED_REVIEW_REBOUND_TO_FRESH_RETAINED_PDF_HASH',historicalQualificationReference:s.reviewReference,evidence,reason:s.reviewStatus==='QUALIFIED'?null:'DOCUMENT_CONTENT_REVIEW_OR_RETAINED_LINEAGE_INSUFFICIENT',currentAdmission:admitManualStatement(s,{mode:'CURRENT_ANALYSIS',analysisAt}),historicalAdmission:admitManualStatement(s,{mode:'HISTORICAL_REPLAY',decisionAt:analysisAt,systemKnownAt:analysisAt})});
}
const byHash=new Map(statements.map(s=>[s.SHA256,s]));
const rejected=new Set([...packet.sourceFactRejections,...packet.sourcePeriodWithdrawals].map(r=>r.observationId));
const facts=[],excluded=[];
const passCells=cells.rows.filter(c=>c.status==='PASS');
for(const o of packet.canonicalObservations){
 const sourceHash=o.transformationReferences.find(r=>r.startsWith('document-sha256:'))?.slice(16),s=byHash.get(sourceHash);
 if(!s){excluded.push({id:o.id,reason:audit.retainedPdfInventory.some(f=>f.sha256===sourceHash)?'DOCUMENT_NOT_QUALIFIED':'OUTSIDE_OWNER_MANUAL_CORPUS_PROVIDER_OR_SUPPLEMENTARY_DIAGNOSTIC'});continue;}
 const page=Number(o.raw.fieldLocator.match(/page:(\d+)/)?.[1]);
 const reviewedCell=passCells.find(c=>c.bodyHash===sourceHash&&c.page===page&&c.itemId===o.itemId&&c.lexicalValue===o.raw.lexicalValue&&c.period.end===o.periodEnd);
 const proof=pageReader(sourceHash,page);
 if(rejected.has(o.id)||!reviewedCell||!proof||proof.renderSha256!==reviewedCell.renderSha256||s.reviewStatus!=='QUALIFIED'||o.quality!=='VALID'||o.scopeFallback!==null){excluded.push({id:o.id,ticker:o.ticker,itemId:o.itemId,sourceHash,reason:rejected.has(o.id)?'PRESERVED_SOURCE_REJECTION_OR_PERIOD_WITHDRAWAL':!reviewedCell?'NO_EXACT_REVIEWED_SOURCE_CELL':!proof||proof.renderSha256!==reviewedCell.renderSha256?'REVIEWED_RENDER_LINEAGE_NOT_RETAINED':s.reviewStatus!=='QUALIFIED'?'DOCUMENT_NOT_QUALIFIED':'INVALID_OR_FALLBACK_FACT'});continue;}
 // Generic bank contracts remain strict. This audit contains no admitted NPL/CASA definition proofs.
 if(['BANK_CURRENT_AND_SAVINGS_DEPOSITS','BANK_REPORTED_NPL'].includes(o.itemId)){excluded.push({id:o.id,reason:'BANK_GENERIC_DEFINITION_PROOF_REQUIRED'});continue;}
 facts.push({id:'manual-current:'+o.id,ticker:o.ticker,itemId:o.itemId,value:o.normalized.value,unit:o.normalized.unit,currency:o.normalized.currency,period:{start:o.periodStart,end:o.periodEnd},scope:o.reportingScope==='CONSOLIDATED'?'CONSOLIDATED':'STANDALONE',sourceDocumentId:s.documentId,sourceHash,evidenceLocator:o.raw.fieldLocator,extractionMethod:'REVIEWED_EXTRACTION',reviewStatus:'REVIEWED',reviewReference:reconciled+'SOURCE_CELL_AUDIT.json#'+sourceHash+'/'+page+'/'+o.itemId,reviewedAt:analysisAt,quality:'VALID',revisionStatus:o.revisionKind==='ORIGINAL'?'ORIGINAL':'RESTATED',supersedesFactId:o.supersedesObservationId?'manual-current:'+o.supersedesObservationId:null,revisionEvidence:o.revisionEvidenceReference,classification:'REPORTED',retainedReaderProof:proof});
}
// Reprocess reviewed source cells independently of what the failed historical selector retained.
// Only an exact reviewed currency/header witness on the same PDF page supplies dimensions.
// No new OCR value, caption mapping, implicit FX or bank definition is inferred here.
const stocks=new Set(['TOTAL_ASSETS','TOTAL_EQUITY','COMMON_EQUITY','CURRENT_ASSETS','CURRENT_LIABILITIES','INVENTORY','RECEIVABLES','BANK_CUSTOMER_DEPOSITS','BANK_GROSS_CUSTOMER_LOANS','BANK_LOAN_LOSS_RESERVES']);
const allowed=new Set(packet.canonicalObservations.map(o=>o.itemId));
for(const c of passCells){
 const index=cells.rows.indexOf(c);
 const s=byHash.get(c.bodyHash),proof=pageReader(c.bodyHash,c.page);
 if(!s||s.reviewStatus!=='QUALIFIED'||!proof||proof.renderSha256!==c.renderSha256||!allowed.has(c.itemId)||packet.canonicalObservations.some(o=>o.itemId===c.itemId&&o.normalized.unit!=='CURRENCY')||['BANK_CURRENT_AND_SAVINGS_DEPOSITS','BANK_REPORTED_NPL'].includes(c.itemId))continue;
 if(facts.some(f=>f.sourceHash===c.bodyHash&&f.itemId===c.itemId&&f.period.end===c.period.end))continue;
 const observations=packet.canonicalObservations.filter(o=>o.transformationReferences.includes('document-sha256:'+c.bodyHash)&&o.itemId===c.itemId&&o.periodEnd===c.period.end);
 if(observations.some(o=>rejected.has(o.id)||o.revisionKind!=='ORIGINAL'||o.quality!=='VALID'||o.scopeFallback!==null))continue;
 const witnesses=facts.filter(f=>f.sourceHash===c.bodyHash&&f.unit==='CURRENCY'&&f.currency==='VND'&&Number(f.evidenceLocator.match(/page:(\d+)/)?.[1])===c.page);
 const witness=witnesses.map(f=>packet.canonicalObservations.find(o=>'manual-current:'+o.id===f.id)).filter(Boolean);
 const units=[...new Set(witness.map(o=>o.raw.unit))];
 if(units.length!==1)continue;
 const n=normalizeLexical(c.lexicalValue,{format:'VI',unit:units[0],sign:c.itemId==='CASH_CAPEX_REPORTED'?'NEGATE_NONPOSITIVE':'IDENTITY',missingTokens:[]});
 if(n.state!=='AVAILABLE')continue;
 facts.push({id:'manual-current:reviewed-cell-'+c.bodyHash+'-'+index,ticker:s.ticker,itemId:c.itemId,value:n.value,unit:'CURRENCY',currency:'VND',period:{start:stocks.has(c.itemId)?c.period.end:c.period.start,end:c.period.end},scope:s.reportingScope,sourceDocumentId:s.documentId,sourceHash:c.bodyHash,evidenceLocator:'page:'+c.page+'/reviewed-audit-cell:'+index,extractionMethod:'REVIEWED_TRANSCRIPTION',reviewStatus:'REVIEWED',reviewReference:reconciled+'SOURCE_CELL_AUDIT.json#rows/'+index,reviewedAt:analysisAt,quality:'VALID',revisionStatus:'ORIGINAL',supersedesFactId:null,revisionEvidence:null,classification:'REPORTED',retainedReaderProof:proof,unitEvidence:{reviewedWitnessFactId:witnesses[0].id,declaredUnit:units[0],sameRetainedPage:true},normalizationVersion:'existing-normalizeLexical-v1'});
}
const id='manual-current-2026-10-13-'+hash({statements,facts,requirements:MANUAL_EVIDENCE_REQUIREMENTS}).slice(0,20);
const input={snapshotId:id,analysisAt,statements,facts,universe,referenceStatus:'UNRESOLVED'};
const snapshot=buildManualCurrentSnapshot(input,hash);
const reverse=buildManualCurrentSnapshot({...input,statements:[...statements].reverse(),facts:[...facts].reverse(),universe:[...universe].reverse()},hash);
assert.equal(canonicalJson(snapshot),canonicalJson(reverse));
write('ARCHITECTURE_AMENDMENT.json',{status:'PROJECT OWNER APPROVED',effectiveDate:'2026-10-13',approvalSource:'Explicit current Project Owner workflow instruction',document:'docs/08_CONTINUOUS_IMPROVEMENT/MANUAL_FUNDAMENTALS_ARCHITECTURE.md',historicalEvidenceRewritten:false,DI14SelfApproval:false,DI15SelfApproval:false});
write('MANUAL_SOURCE_MANIFEST.json',{manualPdfCount:manifest.length,documents:manifest,bulkDownloadPerformed:false});
write('MANUAL_DOCUMENT_QUALIFICATION.json',{documents:documentQualification,readerFailures,qualified:statements.filter(s=>s.reviewStatus==='QUALIFIED').length,scopeFallbackPerformed:false});
write('MANUAL_CANONICAL_FACTS.json',{facts:snapshot.canonicalFacts,reviewedInputFacts:facts,excluded,providerAccountingFactsUsedAsAuthority:0,oldSnapshotReused:false});
write('EVIDENCE_REQUIREMENTS.json',MANUAL_EVIDENCE_REQUIREMENTS);
write('EVIDENCE_SUFFICIENCY_MATRIX.json',snapshot.readiness);
write('DERIVED_METRICS.json',{metrics:snapshot.derivedMetrics,analystAdjusted:0,qualitativeFabricated:0});
write('FRESHNESS_REPORT.json',{policy:MANUAL_EVIDENCE_REQUIREMENTS.freshness,analysisAt,rows:snapshot.readiness.map(r=>({ticker:r.ticker,latestQualifiedReportingPeriod:r.reportingPeriod,scope:r.scope,freshness:r.freshness,cadence:r.latestStatement?.cadence,fiscalYearEndMonth:r.latestStatement?.fiscalYearEndMonth,knownNewerReportInventory:'NOT_REACQUIRED',retrievedAtUsed:false}))});
write('FUNDAMENTAL_READINESS_MATRIX.json',{referenceStatus:'UNRESOLVED',universeAuthority:'DATED_OFFICIAL_30_NAME_RESEARCH_DENOMINATOR_CURRENT_MEMBERSHIP_UNRESOLVED',sectorAuthority:'PRESERVED_RESEARCH_CLASSIFICATIONS_NOT_FORMAL_EFFECTIVE_DATED_ADMISSION',rows:snapshot.readiness});
const diagnostics=packet.canonicalObservations.filter(o=>!byHash.has(o.transformationReferences.find(r=>r.startsWith('document-sha256:'))?.slice(16))).flatMap(o=>{
 const c=snapshot.canonicalFacts.find(c=>c.status==='AVAILABLE'&&c.facts[0].ticker===o.ticker&&c.facts[0].itemId===o.itemId&&c.facts[0].period.start===o.periodStart&&c.facts[0].period.end===o.periodEnd&&c.facts[0].scope===(o.reportingScope==='CONSOLIDATED'?'CONSOLIDATED':'STANDALONE')&&c.facts[0].unit===o.normalized.unit&&c.facts[0].currency===o.normalized.currency);
 return c&&o.normalized.value!==null&&c.value!==o.normalized.value?[{observationId:o.id,sourceVersionId:o.sourceVersionId,ticker:o.ticker,itemId:o.itemId,periodEnd:o.periodEnd,manualValue:c.value,diagnosticValue:o.normalized.value,classification:'NON_AUTHORITATIVE_FOR_ACCOUNTING',productionVeto:false}]:[];
});
write('PROVIDER_DIAGNOSTIC_REPORT.json',{classification:'DIAGNOSTIC / NON_AUTHORITATIVE_FOR_ACCOUNTING',providerAccountingFactsUsedAsAuthority:0,productionVeto:false,excluded,diagnosticDiscrepancies:diagnostics,manualConflicts:snapshot.canonicalFacts.filter(f=>f.status==='CONFLICTING'),membershipConflict:official.conflict,priorProviderEvidencePreserved:true});
write('REVIEWED_SOURCE_ARTIFACT_BINDINGS.json',[old+'EXECUTION_PACKAGE_REDACTED.json',reconciled+'DOCUMENT_QUALIFICATION_RECONCILIATION.json',reconciled+'SOURCE_CELL_AUDIT.json',previous+'PRODUCTION_UNIVERSE.json'].map(path=>({path,sha256:sha(readFileSync(join(root,path))),authority:'REUSED_REVIEW_EVIDENCE_ONLY_NOT_OLD_SNAPSHOT_ADMISSION'})));
write('CURRENT_ANALYSIS_SNAPSHOT.json',snapshot);
write('CURRENT_ANALYSIS_REPLAY.json',{status:'PASS',normalHash:snapshot.contentHash,reversedHash:reverse.contentHash,mode:'CURRENT_ANALYSIS',historicalReplayPIT:'UNCHANGED',inputOrderReversed:['statements','facts','universe'],sourceHashesFreshlyVerified:manifest.length,oldSnapshotReused:false});
write('DI_IMPACT_REPORT.json',{amendments:{DI5:'MATERIAL_CORE_AND_SECTOR_CORE',DI7:'SUPPORTING_OPTIONAL_NOT_AUTOMATIC_BLOCKERS',DI8:'REPORTING_CYCLE',DI9:'AUTHORITATIVE_MANUAL_CONFLICTS_ONLY',DI10:'REQUIRED_EXACT_MECHANICAL_DERIVATIONS',DI11:'EXPLICIT_CURRENT_HISTORICAL_SEPARATION'},DI14:'AWAITING_INDEPENDENT_REVIEW',DI15:'AWAITING_PROJECT_OWNER_APPROVAL',downstreamGatesWaived:false,remainingDependencies:['Official membership discrepancy','Effective-dated sector admission','Material accounting evidence and freshness gaps','Current approved market/valuation evidence','Qualitative evidence','Independent review'],readyForScoring:snapshot.readiness.filter(r=>r.readyForScoring).length});
mkdirSync(join(root,'data/manual-current'),{recursive:true});writeFileSync(join(root,'data/manual-current/current-analysis.json'),JSON.stringify(snapshot)+'\n');
const summary={snapshotId:id,contentHash:snapshot.contentHash,pdfs:manifest.length,qualified:statements.filter(s=>s.reviewStatus==='QUALIFIED').length,reviewedFacts:facts.length,canonicalFacts:snapshot.canonicalFacts.filter(f=>f.status==='AVAILABLE').length,conflicts:snapshot.canonicalFacts.filter(f=>f.status==='CONFLICTING').length,invalid:snapshot.canonicalFacts.filter(f=>f.status==='INVALID').length,FULL:snapshot.readiness.filter(r=>r.financialEvidenceStatus==='FULL').length,PARTIAL:snapshot.readiness.filter(r=>r.financialEvidenceStatus==='PARTIAL').length,INSUFFICIENT:snapshot.readiness.filter(r=>r.financialEvidenceStatus==='INSUFFICIENT').length,scorable:snapshot.readiness.filter(r=>r.fundamentalScorable).length,derived:snapshot.derivedMetrics.filter(d=>d.status==='AVAILABLE').length,freshness:Object.fromEntries(['CURRENT','AGING','STALE','UNKNOWN'].map(s=>[s,snapshot.readiness.filter(r=>r.freshness===s).length]))};
write('REPROCESS_SUMMARY.json',summary);
// Pin all historical tracked evidence independently from the new package.
const history=[];
function walk(dir){for(const e of readdirSync(dir,{withFileTypes:true})){const p=join(dir,e.name);if(p===out)continue;if(e.isDirectory())walk(p);else if(e.isFile())history.push({path:p.slice(root.length+1),sha256:sha(readFileSync(p))});}}
walk(join(root,'docs/fundamental-data-engine/evidence'));write('HISTORICAL_EVIDENCE_PRESERVATION.json',{files:history.sort((a,b)=>a.path.localeCompare(b.path)),rewritten:false});
console.log(JSON.stringify(summary,null,2));
