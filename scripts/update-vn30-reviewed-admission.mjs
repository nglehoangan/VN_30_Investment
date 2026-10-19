import './lib/ts-runtime.mjs';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const {buildHybridAdmission}=await import('../src/domain/fundamentals/hybrid-admission.ts');
const {financialHash}=await import('../src/infrastructure/fundamentals/hybrid-input.ts');
const {financialTargets,evaluateHybridTarget}=await import('../src/domain/fundamentals/hybrid-sufficiency.ts');
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const root='docs/fundamental-data-engine/evidence/';
const output='data/manual-current/reviewed-admission-2026-10-19';
const at='2026-10-19T08:11:23.000Z';
const baseline=read(root+'2026-10-17-data-initialization-final-acceptance/ACCOUNTING_RECONSTRUCTION.json');
const decisionPaths={
 TCX:root+'2026-10-19-tcx-user-classification-decision/TCX_FY2022_CLASSIFICATION_DECISION.json',
 VIB:root+'2026-10-19-vib-npl-user-decision/VIB_NPL_CLASSIFICATION_DECISION.json',
 VIC:root+'2026-10-19-vic-lc-user-decision/VIC_LC_REPORTED_BORROWINGS_DECISION.json',
};
const sourcePaths={VIB:root+'2026-10-19-vib-capital-source-review/VIB_CAPITAL_SOURCE_REVIEW.json',VIC:root+'2026-10-19-vic-vietstock-review/VIC_6M2026_SOURCE_REVIEW.json'};
const body=x=>Object.fromEntries(Object.entries(x).filter(([k])=>k!=='bodyHash'));
const seal=x=>({...x,bodyHash:financialHash(body(x))});
const write=(p,x)=>{mkdirSync(p.slice(0,p.lastIndexOf('/')),{recursive:true});writeFileSync(p,JSON.stringify(x,null,2)+'\n');};
function bind(input,path,hash=sha(path)){if(!input.sourceBindings.some(b=>b.path===path&&b.sha256===hash))input.sourceBindings.push({path,sha256:hash});}
function document(input,source,type='FINANCIAL_STATEMENTS'){
 assert.equal(sha(source.path),source.sha256,source.path);bind(input,source.path,source.sha256);
 const doc={...input.statements[0],documentId:'reviewed-20261019:'+source.sha256,SHA256:source.sha256,verifiedHash:source.sha256,
  retainedPath:source.path,ticker:input.universe[0].ticker,documentType:type,reportingPeriod:{start:'2026-01-01',end:'2026-06-30'},
  fiscalYear:2026,fiscalQuarter:2,reportingScope:'CONSOLIDATED',reviewStatus:'QUALIFIED',reviewedAt:at,importedAt:at,
  reviewReference:sourcePaths[input.universe[0].ticker],publishedAt:null,historicalAvailability:'UNKNOWN',unitBasis:'MILLION_CURRENCY'};
 input.statements.push(doc);return doc;
}
function verify(input,doc,item,value,{end='2026-06-30',flow=false,page,reference,unit='CURRENCY',definition=item}={}){
 const v={id:`reviewed-20261019:${doc.ticker}:${end}:${item}`,ticker:doc.ticker,itemId:item,value,
  period:{start:flow?end.slice(0,4)+'-01-01':end,end},scope:doc.reportingScope,unit,currency:unit==='RATIO'?null:'VND',
  sourceDocumentId:doc.documentId,sourceHash:doc.SHA256,reportPeriodType:end.endsWith('12-31')?'ANNUAL':'YTD',
  fiscalYear:Number(end.slice(0,4)),fiscalQuarter:end.endsWith('12-31')?null:2,authority:'MANUAL_VERIFIED',
  definition,qualified:true,evidenceReference:reference,evidenceLocator:`PDF page ${page}; ${definition}`,
  reviewedAt:at,publishedAt:null,historicalAvailability:'UNKNOWN',definitionVerified:true,valueVerified:true,
  zeroVerified:value==='0',provenanceVerified:true,origin:'SELECTIVE_PDF_SAMPLE',revisionStatus:'ORIGINAL',supersedesFactId:null,revisionEvidence:null};
 input.verifications.push(v);return v;
}
const results=[];const snapshots=[];
for(const row of baseline.rows){
 const ticker=row.ticker;const original=read(row.inputPath);const originalSnapshot=buildHybridAdmission(original,financialHash);
 assert.deepEqual(originalSnapshot,read(row.canonicalPath),ticker+' baseline canonical replay');
 const input=structuredClone(original);input.analysisAt=at;input.systemKnownAt=at;input.snapshotId=`reviewed-vn30-20261019-${ticker}`;
 const decisions=[];
 if(decisionPaths[ticker]){bind(input,decisionPaths[ticker]);decisions.push(decisionPaths[ticker]);}
 if(ticker==='TCX'){
  const decision=read(decisionPaths.TCX);const doc=input.statements.find(d=>d.reportingPeriod.end==='2022-12-31');assert(doc);
  const pdf='data/manual-download/TCX/2026-10-19/TCX_FY2022_Audited_Standalone.pdf';assert.equal(sha(pdf),doc.SHA256);bind(input,pdf);
  doc.retainedPath=pdf;
  verify(input,doc,'FINANCIAL_DEBT',decision.reconciliation.analyticalFinancialDebt,{end:'2022-12-31',page:43,reference:decisionPaths.TCX,definition:'USER_APPROVED_INTEREST_BEARING_FINANCING; ISSUER_REPORTED_CARRYING_AMOUNT; includes Ket Vang once'});
 }
 if(ticker==='VIB'){
  const review=read(sourcePaths.VIB);bind(input,sourcePaths.VIB);const doc=document(input,review.source,'REGULATORY_DISCLOSURE');
  for(const [item,value] of [['BANK_REPORTED_CAR',review.selected.CAR],['BANK_REPORTED_CET1',review.selected.CET1]]){
   const v=verify(input,doc,item,value,{page:5,reference:sourcePaths.VIB,unit:'RATIO'});
   v.bankCapitalEvidence={framework:'TT14_2025_STANDARDIZED',method:'REPORTED'};
  }
  // Preserve customer-loan NPL and LLR operands. The approved broader headline is a distinct reported metric.
  const decision=read(decisionPaths.VIB);const source=decision.evidence.sourcePdf;
  const fs=input.statements.find(d=>d.SHA256===source.sha256);assert(fs);assert.equal(sha(source.path),source.sha256);bind(input,source.path);fs.retainedPath=source.path;
  for(const p of decision.periods)verify(input,fs,'BANK_REPORTED_NPL',p.selectedRatio,{end:p.date,page:63,reference:decisionPaths.VIB,unit:'RATIO',definition:'USER_APPROVED_REPORTED_NPL_OVER_TOTAL_CREDIT_RISK_ASSETS; not customer-loan-only NPL'});
 }
 if(ticker==='VIC'){
  const review=read(sourcePaths.VIC);bind(input,sourcePaths.VIC);const doc=document(input,review.source);
  for(const f of review.facts){
   if(['TOTAL_LIABILITIES','NCI_NET_INCOME'].includes(f.concept))continue;
   const item=f.concept==='SHORT_BORROWINGS_CAPTION'?'SHORT_TERM_FINANCIAL_BORROWINGS':f.concept==='NONCURRENT_BORROWINGS_CAPTION'?'LONG_TERM_FINANCIAL_BORROWINGS':f.concept==='CASH_CAPEX_SOURCE_PAYMENT'?'CASH_CAPEX_REPORTED':f.concept;
   const value=(BigInt(f.value)*(item==='CASH_CAPEX_REPORTED'?-1000000n:1000000n)).toString();
   verify(input,doc,item,value,{flow:['REVENUE','NET_INCOME','NET_INCOME_ATTRIBUTABLE_PARENT','CFO','CASH_CAPEX_REPORTED'].includes(item),page:f.physicalPage,reference:sourcePaths.VIC});
  }
  const preliminary=buildHybridAdmission(input,financialHash);
  const short=preliminary.canonicalFacts.find(f=>f.itemId==='SHORT_TERM_FINANCIAL_BORROWINGS'&&f.period.end==='2026-06-30');
  const long=preliminary.canonicalFacts.find(f=>f.itemId==='LONG_TERM_FINANCIAL_BORROWINGS'&&f.period.end==='2026-06-30');assert(short&&long);
  const metadata=seal({...input.reportedDebtReceipts[0].metadata,periodEnd:'2026-06-30',reportedPopulationStatus:'REPORTED_COMPLETE',sourceHashes:[doc.SHA256],evidenceReference:decisionPaths.VIC,evidenceHash:sha(decisionPaths.VIC),reviewedAt:at,
   uncertainty:{components:[{id:'VIC-2026-broader-financing',caption:'LC treated as trade payable per user decision; BCC and other wider obligations not automatically financing.',amount:null,interestBearing:'UNKNOWN',evidenceReference:decisionPaths.VIC}],unclassifiedLiabilityAmount:null,unclassifiedLiabilityRatioToBorrowings:null,materialityAssessment:'UNASSESSED',materialityEvidenceReference:null}});
  input.reportedDebtReceipts.push(seal({id:'reviewed-20261019:VIC:reported-debt',ticker,sector:'REAL_ESTATE',periodEnd:'2026-06-30',shortCanonicalId:short.id,longCanonicalId:long.id,shortValue:short.value,longValue:long.value,
   currentPortion:((25432067n+25473243n+62480n)*1000000n).toString(),shortIncludesCurrentPortion:true,longIncludesCurrentPortion:false,
   knownFinancingItems:[],reportedSurveyVerified:true,currentPortionVerified:true,metadata}));
 }
 // Presentation witnesses for VNM are bound and retained; they do not assert an unreviewed population survey.
 if(ticker==='VNM'){
  const p=root+'2026-10-19-included-current-portion/VNM_CURRENT_PORTION_PRESENTATIONS.json';bind(input,p);
  decisions.push(p);
 }
 const snapshot=buildHybridAdmission(input,financialHash);
 assert.deepEqual(snapshot.invalidVerificationIds,originalSnapshot.invalidVerificationIds,ticker+' newly invalid verification');assert.equal(snapshot.unresolvedIssuerConflicts.length,0,ticker+' issuer conflict');
 assert.equal(snapshot.readyForScoring,false);
 if(!['TCX','VIB','VIC'].includes(ticker))assert.deepEqual(snapshot.canonicalFacts,originalSnapshot.canonicalFacts,ticker+' unchanged canonical values');
 const fact=(id,end)=>snapshot.canonicalFacts.find(f=>f.itemId===id&&f.period.end===end);
 if(ticker==='TCX')assert.equal(fact('FINANCIAL_DEBT','2022-12-31')?.value,'13864719712130');
 if(ticker==='VIB'){
  assert.equal(fact('BANK_REPORTED_CAR','2026-06-30')?.value,'0.118');
  assert.equal(fact('BANK_REPORTED_CET1','2026-06-30')?.value,'0.100');
  assert.equal(fact('BANK_REPORTED_NPL','2026-06-30')?.value,'0.021');
  // Adding the broader reported ratio must not change loan-only bad-debt or provision facts.
  for(const f of originalSnapshot.canonicalFacts)assert.deepEqual(snapshot.canonicalFacts.find(n=>n.id===f.id),f);
 }
 if(ticker==='VIC')assert.equal(fact('REPORTED_BORROWINGS','2026-06-30')?.value,'355810545000000');
 const periods=financialTargets(input).map(t=>evaluateHybridTarget(t,row.sector,snapshot,input));
 assert.equal(periods.length,5);const missing=periods.flatMap(p=>p.missingRequirements.map(m=>({end:p.target.end,...m})));
 const state=ticker==='MBB'?'DEFERRED_PENDING_OFFICIAL_CAR':ticker==='VNM'?'PARTIAL_DEBT_POPULATION_QUALIFICATION':missing.length?'BLOCKED_MISSING_REQUIREMENTS':'LEVEL1_SUFFICIENT';
 const dir=`${output}/${ticker}`;write(dir+'/input.json',input);write(dir+'/canonical.json',snapshot);
 const retained=input.sourceBindings.map(b=>({path:b.path,status:!existsSync(b.path)?'HISTORICALLY_REMOVED':sha(b.path)===b.sha256?'HASH_MATCH':'HASH_MISMATCH'}));
 assert(!retained.some(b=>b.status==='HASH_MISMATCH'),ticker+' source hash mismatch');
 const status={ticker,sector:row.sector,state,periods,missingRequirements:missing,decisions,canonicalHash:snapshot.contentHash,baselineCanonicalHash:originalSnapshot.contentHash,baselineReplay:'PASS',invalidVerificationIds:snapshot.invalidVerificationIds,newInvalidVerificationIds:[],retainedSourceChecks:retained,sourceReplayLimitation:'Deleted historic PDFs/readers are not replayed; retained canonical inputs are replayed. New source PDFs and decision hashes checked.',readyForScoring:false};
 write(dir+'/qualification.json',status);results.push(status);snapshots.push(snapshot);
}
assert.equal(results.length,30);assert.equal(new Set(results.map(r=>r.ticker)).size,30);
const report={schemaVersion:'vn30-reviewed-admission-v1',analysisAt:at,members:results,counts:Object.fromEntries([...new Set(results.map(r=>r.state))].map(s=>[s,results.filter(r=>r.state===s).length])),readyForScoring:false,marketDataRequalified:false,independentReviewApproved:false,databasePersisted:false};
write(output+'/manifest.json',report);
if(process.argv.includes('--persist')){
 const {PrismaClient}=await import('../src/infrastructure/db/generated/client.ts');
 const {PrismaBetterSqlite3}=await import('@prisma/adapter-better-sqlite3');
 const {PrismaFinancialAdmission}=await import('../src/infrastructure/repositories/fundamental-admission.ts');
 const db=new PrismaClient({adapter:new PrismaBetterSqlite3({url:'file:'+process.cwd()+'/data/vn30.sqlite'})});
 try{await db.$transaction(async tx=>{const repository=new PrismaFinancialAdmission(tx);for(const s of snapshots)await repository.append(s,'retained-level1-20261017',at);},{timeout:120000});
  for(const s of snapshots){const loaded=await new PrismaFinancialAdmission(db).find(s.snapshotId);assert.deepEqual(loaded,s);}
  report.databasePersisted=true;report.persistedAdmissionRuns=snapshots.map(s=>s.snapshotId);write(output+'/manifest.json',report);
 }finally{await db.$disconnect();}
}
console.log(JSON.stringify({counts:report.counts,databasePersisted:report.databasePersisted,output},null,2));
