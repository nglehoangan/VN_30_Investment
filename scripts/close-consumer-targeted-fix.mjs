import './lib/ts-runtime.mjs';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const {buildHybridAdmission}=await import('../src/domain/fundamentals/hybrid-admission.ts');
const {financialHash}=await import('../src/infrastructure/fundamentals/hybrid-input.ts');
const {financialTargets,evaluateHybridTarget,selectHybridCurrentPeriods,hybridCoverage}=await import('../src/domain/fundamentals/hybrid-sufficiency.ts');
export const root='docs/fundamental-data-engine/evidence/2026-10-15-consumer-targeted-fix';
export const read=p=>JSON.parse(readFileSync(p,'utf8'));
export const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const reviewedAt='2026-10-15T16:16:14.000Z';
const base=t=>`docs/fundamental-data-engine/evidence/2026-10-15-ticker-closure-${t}`;
const body=x=>({...x,bodyHash:financialHash(x)});
const million=n=>(BigInt(n)*1000000n).toString();
function metadata(t,p,ref,input){return body({contractVersion:'nonfinancial-debt-contract-v2',ticker:t,periodEnd:p.periodEnd,scope:'CONSOLIDATED',unit:'CURRENCY',currency:'VND',measurementBasis:'ISSUER_REPORTED_CARRYING_AMOUNT',leasePolicyVersion:'issuer-recognized-financing-leases-v1',reportedPopulationStatus:p.additions?.length?'REPORTED_PLUS_IDENTIFIED_ADDITIONS':'REPORTED_COMPLETE',comprehensivePopulationStatus:'COMPREHENSIVE_UNVERIFIED',knownFinancingOmission:false,sourceHashes:[p.sourceHash],evidenceReference:ref,evidenceHash:sha(ref),reviewedAt:input.systemKnownAt,uncertainty:{components:p.uncertaintyComponents,unclassifiedLiabilityAmount:null,unclassifiedLiabilityRatioToBorrowings:null,materialityAssessment:'UNASSESSED',materialityEvidenceReference:null},exhaustiveEvidenceReference:null});}
function verification(t,doc,metric,value,start,end,locator){return {id:`targeted:${t}:${metric}:${end}`,ticker:t,itemId:metric,value,unit:'CURRENCY',currency:'VND',period:{start,end},scope:'CONSOLIDATED',sourceDocumentId:doc.documentId,sourceHash:doc.SHA256,evidenceLocator:locator,reportPeriodType:start===end?'QUARTER':'YTD',fiscalYear:2026,fiscalQuarter:2,authority:'REVIEWED_PDF',qualified:true,evidenceReference:locator,reviewedAt,publishedAt:null,historicalAvailability:'UNKNOWN',definitionVerified:true,valueVerified:true,zeroVerified:value==='0',provenanceVerified:true,origin:'SELECTIVE_PDF_SAMPLE',revisionStatus:'ORIGINAL',supersedesFactId:null,revisionEvidence:null};}
export function produce(t,out=resolve(root,t)){
 assert(['MSN','VNM','SAB'].includes(t));mkdirSync(out,{recursive:true});
 assert(!existsSync(resolve(out,'ARTIFACT_HASHES.json')),'Sealed targeted fix; use another output directory');
 const write=(n,v)=>writeFileSync(resolve(out,n+'.json'),JSON.stringify(v,null,2)+'\n');
 const input=structuredClone(read(`${base(t)}/${t}_RETAINED_ADMISSION_INPUT.json`));
 input.snapshotId=`${t.toLowerCase()}-targeted-level-one-2026-10-15`;input.analysisAt=reviewedAt;input.systemKnownAt=reviewedAt;
 const ref=`${root}/${t}/TARGETED_REVIEW.json`;
 const review={ticker:t,baselineHead:'883134b1c2f16cce6488cf775b1baa9d6a756e09',reviewedAt,scope:'CONFIRMED_LEVEL_ONE_BLOCKERS_ONLY',accountingRoute:'Inherited RETAIL evidence route; no production sector promotion',materialGaps:[],changes:[],periods:[]};
 if(t==='MSN'){
  const rows=[
   [2022,23520305,10271238,null,936287,35142828,22187234,358842,15255,18444260,1317816,'note19 p83; note20 p84; note21 pp85–89'],
   [2023,8962671,8008238,7803740,499635,16435049,5479909,343551,15634,33725965,3467128,'note19 pp65–66; notes20–21 pp66–71'],
   [2024,8725061,18282304,5912186,21250,12799172,2995494,247223,12258,34503851,5717309,'note19 pp67–68; notes20–21 pp68–73'],
   [2025,8181504,635415,87300,0,11164668,1995218,234964,13380,37328066,6172906,'note18 pp64–65; notes19–20 pp65–70'],
   [2026,9478342,0,0,null,11833546,2498373,228421,13979,38416421,6965990,'note22 pp67–68; notes23–24 pp68–74'],
  ];
  const original=read(`${base(t)}/${t}_DEBT_RECONCILIATION.json`);
  for(const [year,current,ds,dl,lc,bond,cbond,lease,clease,bank,cbank,locator] of rows){
   const p={...original.periods.find(p=>p.periodEnd.startsWith(String(year))),status:'QUALIFIED',currentPortion:million(current),locator,sourceUnit:'MILLION_VND',sourceUnitMultiplier:'1000000',comprehensiveDebtValue:null};delete p.reason;
   const included=(id,amount,side,kind)=>({id,amount:million(amount),classification:'ALREADY_INCLUDED_IN_REPORTED_BORROWINGS',alreadyIncludedIn:side,kind,nonOverlapProof:'Disjoint rows in long borrowing note, current deductions exactly match current row in short borrowing note'});
   p.components=[included('short-bank',BigInt(p.short)/1000000n-BigInt(current),'SHORT','OTHER_FINANCING'),included('current-bank',cbank,'SHORT','OTHER_FINANCING'),included('current-bonds',cbond,'SHORT','BOND'),included('current-finance-lease',clease,'SHORT','FINANCE_LEASE'),included('noncurrent-bank',bank-cbank,'LONG','OTHER_FINANCING'),included('noncurrent-bonds-net-issue-costs',bond-cbond,'LONG','BOND'),included('noncurrent-finance-lease',lease-clease,'LONG','FINANCE_LEASE')];
   assert.equal(cbank+cbond+clease,current);
   for(const side of ['SHORT','LONG'])assert.equal(p.components.filter(c=>c.alreadyIncludedIn===side).reduce((s,c)=>s+BigInt(c.amount),0n).toString(),side==='SHORT'?p.short:p.long);
   p.additions=[];
   for(const [id,amount,caption] of [['investment-deposit-short',ds,'Third-party investment deposits, current'],['investment-deposit-long',dl,'Third-party investment deposits, noncurrent'],['fixed-fee-bank-LC-payable',lc,'Domestic-bank deferred LC payable']]){
    if(amount===null||amount===0){p.components.push({id,amount:amount===null?null:'0',classification:amount===null?'UNKNOWN':null,caption,status:amount===0?'EXPLICIT_DASH_IN_CLOSING_COLUMN':'NOT_SEPARATELY_DISCLOSED',reason:amount===0?'No closing amount in this named reported row; not a claim about opaque liabilities':'Absence of separate row is not proof of economic absence'});continue;}
    const a={id,amount:million(amount),classification:'ADDITIONAL_IDENTIFIED_FINANCING',caption,alreadyIncludedIn:null,kind:'OTHER_FINANCING',nonOverlapProof:'Separate closing other-payables note, outside short and long borrowing note totals; no gross receipt/repayment flows used',financingProof:id.startsWith('investment')?'Issuer commits contractual return on deposited funds; linked interest payable disclosed separately in 2022/23':'Issuer specifies fixed annual financing fee on unpaid balance; converts to borrowing only upon default'};p.additions.push(a);p.components.push(a);
   }
   p.uncertaintyComponents=[{id:'opaque-other-liabilities',caption:'Residual other liabilities; financing character not established',amount:null,interestBearing:'UNKNOWN',evidenceReference:ref+'#'+p.periodEnd}];
   p.deferredAcquisitionReview={classification:'UNKNOWN',amount:year===2022?million(478193):null,originalCaption:year===2022?'Phí ký kết hợp đồng mua hàng hoãn lại':null,reason:'The FY2022 caption is deferred procurement-contract signing fees, not evidence of an equity-acquisition financing principal. No explicit financing terms for this caption established. Later residual other-payable balances are not an inferred extinction. Retained as opaque, never zero or commercial by assumption.'};
   p.uncertaintyComponents.push({id:'deferred-procurement-or-acquisition-character',caption:p.deferredAcquisitionReview.originalCaption??'Deferred acquisition financing not separately established in closing note',amount:p.deferredAcquisitionReview.amount,interestBearing:'UNKNOWN',evidenceReference:ref+'#'+p.periodEnd});
   p.interestAccrualPolicy='Separately accrued interest is not added to financing principal; no contractual capitalization established. No unrestricted-cash or comprehensive-debt qualification.';
   p.reportedBorrowings=(BigInt(p.short)+BigInt(p.long)+p.additions.reduce((s,a)=>s+BigInt(a.amount),0n)).toString();review.periods.push(p);
  }
  review.changes=['Qualify disjoint closing bank, bond carrying values net of issue costs, and issuer-recognized finance leases; current portion included exactly once','Add separately reported contractual-return investment deposits and fixed-fee bank LC financing; retain opaque liabilities as UNKNOWN'];
 }
 if(t==='VNM'){
  const path='data/manual-fundamentals/VNM/VNM_2026_6M_Reviewed_Consolidated.pdf',hash=sha(path);
  const doc={...input.statements.at(-1),documentId:'manual-sha256:'+hash,SHA256:hash,verifiedHash:hash,reportingPeriod:{start:'2026-01-01',end:'2026-06-30'},fiscalYear:2026,fiscalQuarter:2,retainedPath:path,importedAt:reviewedAt,reviewedAt,reviewReference:ref+'#source',auditStatus:'REVIEWED'};
  input.statements.push(doc);input.sourceBindings.push({path,sha256:hash});
  review.source={retainedPath:path,SHA256:hash,originalIssuerPdf:true,pages:72,scope:'CONSOLIDATED',auditStatus:'REVIEWED',reviewer:'KPMG',reviewDate:'2026-07-30',reviewLocators:'PDF pp5–6: review covers consolidated BS, quarter and six-month income, and six-month cash flow',publicationDate:'2026-07-30',publishedAt:null,historicalAvailability:'UNKNOWN',prioritySearch:[{priority:1,url:'https://www.vinamilk.com.vn/investor/reports/financial',result:'HTTP403; issuer-linked CloudFront original also HTTP403'},{priority:2,result:'No accessible exact original obtained on exchange path; public disclosure index attributes filing to HOSE'},{priority:3,index:'https://www.phs.vn/tin-tuc/vnm-bctc-hop-nhat-quy-2-nam-2026/6418300',url:'https://static2.vietstock.vn/vietstock/2026/7/31/20260730___vnm___bctc_da_soat_xet_q2_2026___hop_nhat.pdf',result:'HTTP200 original issuer-signed PDF; existing public original-filing mirror used by repository'}],accessControlBypass:false};
  review.rows=[['TOTAL_ASSETS','57451803693875',true,'p9 BS row280'],['TOTAL_EQUITY','35666334973929',true,'p10 BS row400'],['CASH_AND_EQUIVALENTS','4535672366831',true,'p7 BS row110'],['INVENTORY','7720280777044',true,'p7 BS inventory net: gross7768442112731 less provision48161335687'],['SHORT_TERM_FINANCIAL_BORROWINGS','8323441876837',true,'p10 BS row321; p52 note15(a) closing column'],['LONG_TERM_FINANCIAL_BORROWINGS','131430000000',true,'p10 BS row339; p53 note15(b) closing column'],['REVENUE','34996005336611',false,'p11 row10 SIX-MONTH column, not Q2 standalone18847347464988'],['NET_INCOME','5642622644280',false,'p12 row60 SIX-MONTH total consolidated earnings, not parent-only5595750943516'],['CFO','3473788102329',false,'p13 row20 SIX-MONTH cash flow']].map(([metric,value,stock,locator])=>({metric,value,start:stock?'2026-06-30':'2026-01-01',end:'2026-06-30',frame:stock?'QUARTER':'YTD',locator,sourceHash:hash}));
  for(const r of review.rows)input.verifications.push(verification(t,doc,r.metric,r.value,r.start,r.end,r.locator));
  const original=read(`${base(t)}/${t}_DEBT_RECONCILIATION.json`);
  for(const [i,end,short,long,current,locator] of [[0,'2022-12-31','4867129839103','66028725000','18865350000','note15 pp47–48'],[1,'2023-12-31','8217757172267','238476074100','159660768300','note15 pp46–47'],[2,'2024-12-31','9115435107250','157903902450',null,'note15 pp47–48'],[3,'2025-12-31','9393736731992','62907826150',null,'note15 pp47–48'],[4,'2026-06-30','8323441876837','131430000000',null,'note15 pp52–53']]){
   review.periods.push({periodEnd:end,short,long,currentPortion:current,currentPortionStatus:current===null?'END_BALANCE_NOT_SEPARATELY_DISCLOSED':'EXPLICIT_CLOSING_BALANCE',status:current===null?'UNQUALIFIED_POPULATION':'QUALIFIED',reportedBorrowings:current===null?null:(BigInt(short)+BigInt(long)).toString(),sourceHash:i===4?hash:original.periods[i].sourceHash,locator,comprehensiveDebtValue:null,additions:[],knownFinancingItems:[],uncertaintyComponents:[{id:'other-liabilities',caption:'Other-payable financing character not exhaustively established',amount:null,interestBearing:'UNKNOWN',evidenceReference:ref}],rejectedMovementAsEndBalance:i===2?'183157263872':i===3?'20750493750':i===4?'10401978750':null,bondAndLeaseSurvey:'Note15 reports bank borrowings only; no separately identified bond/recognized finance-lease balance. No comprehensive-debt absence assertion.'});
  }
  review.materialGaps=['Exact end-date current portion and complete financing reconciliation remain unqualified for FY2024, FY2025 and 6M2026; movement transfers cannot substitute for closing balances'];
  review.changes=['Obtain and retain original reviewed consolidated 6M2026 PDF with SHA256 and provenance','Admit required 6M2026 YTD and balance-sheet core/inventory observations only','Qualify FY2022 and FY2023 explicit closing current portion; preserve later end balances UNKNOWN and leave those debt requirements unavailable'];
 }
 if(t==='SAB'){
  const original=input.verifications.filter(v=>v.itemId==='CFO'&&v.period.start==='2023-01-01'&&v.period.end==='2023-12-31');assert(original.length);assert(original.every(v=>v.value==='1940064108479'));
  const doc=input.statements.find(d=>d.reportingPeriod.end==='2024-12-31');assert(doc);
  review.revision={classification:'RECLASSIFIED',conclusionBasis:'Issuer audited comparative row-population reconciliation, not chronological preference',original:{value:'1940064108479',sourceHash:original[0].sourceHash,locator:'FY2023 original PDF pp14–15; CFO row20; payables movement row11 (787119601677); investing CF2715583467608; no row25 payment'},comparative:{value:'2104718257779',sourceHash:doc.SHA256,locator:'FY2024 original PDF pp14–15, 2023 comparative; payables movement row11 (622465452377); row25 equity/NCI-acquisition payment (164654149300); investing CF2550929318308'},bridge:{operatingIncrease:'164654149300',investingDecrease:'164654149300',originalInvesting:'2715583467608',comparativeInvesting:'2550929318308',financingUnchanged:'-3685025044212',netCashMovementUnchanged:'970622531875'},note43:{locator:'FY2024 original PDF p74',scope:'Other comparatives at 1 January 2024 are carried from FY2023. This is an as-at balance-sheet statement, not a declaration that the full-year cash-flow presentation is identical.'},economicInterpretationLimit:'Payment presentation changed from operating working-capital to investing equity/NCI acquisition. No issuer disclosure establishing an accounting-error correction, policy change or scope change; do not classify as those.',authoritativeUse:'CURRENT_ANALYSIS / long-term comparative audited presentation',historicalPIT:'Separate; no verified publication timestamp inferred',predecessorIds:original.map(v=>v.id),successorIds:[]};
  for(const [i,old] of original.entries()){
   const revised={...old,id:`targeted:SAB:CFO:2023:reclassified:${i}`,value:'2104718257779',sourceDocumentId:doc.documentId,sourceHash:doc.SHA256,evidenceLocator:review.revision.comparative.locator,evidenceReference:ref,reviewedAt,publishedAt:null,historicalAvailability:'UNKNOWN',revisionStatus:'RESTATED',supersedesFactId:old.id,revisionEvidence:ref};input.verifications.push(revised);review.revision.successorIds.push(revised.id);
  }
  review.changes=['Retain original FY2023 CFO observations and bind explicit RECLASSIFIED lineage to audited FY2024 comparative; choose comparative only for CURRENT_ANALYSIS'];
 }
 write('TARGETED_REVIEW',review);input.sourceBindings.push({path:ref,sha256:sha(ref)});
 if(t!=='SAB'){
  const before=buildHybridAdmission(input,financialHash);
  input.reportedDebtReceipts=review.periods.filter(p=>p.status==='QUALIFIED').map(p=>{
   const short=before.canonicalFacts.find(f=>f.itemId==='SHORT_TERM_FINANCIAL_BORROWINGS'&&f.period.end===p.periodEnd),long=before.canonicalFacts.find(f=>f.itemId==='LONG_TERM_FINANCIAL_BORROWINGS'&&f.period.end===p.periodEnd);assert(short&&long);assert.equal(short.value,p.short);assert.equal(long.value,p.long);
   const known=t==='MSN'?p.components.filter(c=>c.amount!==null&&c.amount!=='0'&&['ALREADY_INCLUDED_IN_REPORTED_BORROWINGS','ADDITIONAL_IDENTIFIED_FINANCING'].includes(c.classification)).map(c=>({id:c.id,amount:c.amount,applicable:true,verified:true,alreadyIncludedIn:c.alreadyIncludedIn,kind:c.kind,inclusionEvidenceVerified:true,evidenceReference:ref+'#'+p.periodEnd})):[];
   return body({id:`targeted:${t}:debt:${p.periodEnd}`,ticker:t,sector:input.universe[0].sector,periodEnd:p.periodEnd,shortCanonicalId:short.id,longCanonicalId:long.id,shortValue:short.value,longValue:long.value,currentPortion:p.currentPortion,shortIncludesCurrentPortion:true,longIncludesCurrentPortion:false,knownFinancingItems:known,reportedSurveyVerified:true,currentPortionVerified:true,metadata:metadata(t,p,ref,input)});
  });
 }
 const snapshot=buildHybridAdmission(input,financialHash);assert.deepEqual(snapshot.invalidVerificationIds,[]);assert.deepEqual(snapshot.unresolvedIssuerConflicts,[]);
 const periods=financialTargets(input).map(p=>evaluateHybridTarget(p,input.universe[0].sector,snapshot,input));
 const coverage=Object.fromEntries(['CORE','SECTOR_CORE','SUPPORTING'].map(k=>{const required=periods.reduce((s,p)=>s+p[k].required,0),admitted=periods.reduce((s,p)=>s+p[k].available,0);return [k,{required,admitted,missing:required-admitted}];}));
 const current=selectHybridCurrentPeriods(input,snapshot);
 const ready=!review.materialGaps.length&&!coverage.CORE.missing&&!coverage.SECTOR_CORE.missing&&!current[0].CURRENT_TRAJECTORY.missingCurrentYtd;
 const final={ticker:t,levelOneReady:ready,coverage,periods,materialGaps:review.materialGaps,verdict:ready?`B. ${t} CONDITIONALLY CLOSED — ANALYTICAL GAPS CARRIED FORWARD`:`C. ${t} BLOCKED — MATERIAL LEVEL-1 DATA-INTEGRITY GAPS REMAIN`,historicalPIT:'NOT_READY',historicalPITBlocksCurrentAnalysis:false,independentReview:'PENDING',ownerApproval:'PENDING',readyForScoring:false,DI14:'NOT_APPROVED',DI15:'NOT_APPROVED',analyticalGapsReference:`${base(t)}/${t}_DEFERRED_ANALYTICAL_GAPS.json`,supportingCoverageChased:false};
 write('RETAINED_ADMISSION_INPUT',input);write('CANONICAL_FACTS',snapshot);write('FINAL_SUFFICIENCY',final);write('CURRENT_TRAJECTORY',current);write('CLOSURE_MATRIX',hybridCoverage(financialTargets(input),snapshot,input));write('OPEN_ISSUES',{Critical:[],Major:review.materialGaps,analyticalGapsReference:final.analyticalGapsReference});
 return {ticker:t,...coverage,verdict:final.verdict};
}
if(process.argv[1]&&resolve(process.argv[1])===resolve('scripts/close-consumer-targeted-fix.mjs')){
 const ticker=process.argv.find(a=>a.startsWith('--ticker='))?.slice(9);console.log(JSON.stringify(produce(ticker,process.argv.find(a=>a.startsWith('--out='))?.slice(6))));
}
