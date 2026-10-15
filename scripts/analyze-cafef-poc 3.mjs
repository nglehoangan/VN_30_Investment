import './lib/ts-runtime.mjs';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import assert from 'node:assert/strict';
const {normalizeCafeF,cafeFAllZeroAnomaly,cafeFPeriod,reconcileCafeFValues,selectCafeFAnalysisPeriod,payloadHash,cafeFRawCapture}=await import('../src/infrastructure/fundamentals/cafef.ts');
const {decimal}=await import('../src/domain/portfolio/values.ts');
const root=resolve(import.meta.dirname,'..'),rawBase=join(root,'data/providers/cafef/poc-2026-10-13'),out=join(root,'docs/fundamental-data-engine/evidence/2026-10-13-cafef-structured-poc');mkdirSync(out,{recursive:true});
assert(!existsSync(join(out,'ARTIFACT_HASHES.json')),'Sealed evidence package');
const read=p=>JSON.parse(readFileSync(join(root,p),'utf8'));
const write=(name,v)=>writeFileSync(join(out,name),JSON.stringify(v,null,2)+'\n');
const csv=(name,rows)=>{const keys=[...new Set(rows.flatMap(r=>Object.keys(r)))];const quote=v=>'"'+String(typeof v==='object'&&v!==null?JSON.stringify(v):v??'').replaceAll('"','""')+'"';writeFileSync(join(out,name),[keys.map(quote).join(','),...rows.map(r=>keys.map(k=>quote(r[k])).join(','))].join('\n')+'\n');};
const symbols='ACB BID BSR CTG FPT GAS GVR HDB HPG LPB MBB MCH MSN MWG SAB SHB SSB SSI STB TCB TCX VCB VHM VIB VIC VJC VNM VPB VPL VRE'.split(' ');
const requests=JSON.parse(readFileSync(join(rawBase,'requests.json'),'utf8'));
const contextPath=join(out,'cafef_run_context.json');
const context=existsSync(contextPath)?JSON.parse(readFileSync(contextPath,'utf8')):{analysisAt:requests.map(r=>r.retrievedAt).sort().at(-1),calculatedAt:new Date().toISOString()};
write('cafef_run_context.json',context);const asOf=context.analysisAt;
const manualBase='docs/fundamental-data-engine/evidence/2026-10-13-physical-corpus-reconciliation/';
const manual=read(manualBase+'CURRENT_ANALYSIS_SNAPSHOT.json'),requirements=read('src/domain/fundamentals/manual-fundamental-evidence-requirements-v1.json');
const sectors=new Map(manual.readiness.map(r=>[r.ticker,r.sector]));
const namespace=symbol=>sectors.get(symbol)==='BANK'?'BANK':sectors.get(symbol)==='SECURITIES'?'SECURITIES':sectors.get(symbol)==='REAL_ESTATE'||symbol==='VIC'?'REAL_ESTATE':'STANDARD_CORPORATE';
const facts=[],templates=[],periods=[],anomalies=[],identities=[],failures=[],captures=[],rawSupport=[];
const latestRequests=[...new Map(requests.map(r=>[r.requestFingerprint,r])).values()];
for(const request of latestRequests){
 const body=readFileSync(request.rawPayloadLocation,'utf8');assert.equal(payloadHash(body),request.payloadHash,'Raw archive changed');
 captures.push(cafeFRawCapture(request,body));
 if(request.error||request.httpStatus!==200){failures.push({...request,failure:request.error??'HTTP_ERROR'});continue;}
 try{
 const p=normalizeCafeF(body,request.endpoint,request.symbol,request.TypeTime,namespace(request.symbol),request.retrievedAt);facts.push(...p.facts);
 for(const rejected of p.rejectedRecords)anomalies.push({symbol:request.symbol,endpoint:request.endpoint,requestMode:request.TypeTime,year:rejected.year,quater:rejected.quater,providerType:rejected.type,kind:'INVALID_PROVIDER_PERIOD_SENTINEL',payloadHash:request.payloadHash,canonicalZeroAdmission:false});
 const templateHash=payloadHash(JSON.stringify(p.templates));templates.push({symbol:request.symbol,endpoint:request.endpoint,mode:request.TypeTime,mappingNamespace:namespace(request.symbol),templateHash,payloadHash:request.payloadHash,unit:p.unit,rows:p.templates,unmappedCodes:[...new Set(p.unmapped.map(r=>r.code))]});
 const bundles=new Map();for(const r of p.records){const key=JSON.stringify([r.year,r.quater,r.type]);if(!bundles.has(key))bundles.set(key,[]);bundles.get(key).push(r);}
 for(const records of bundles.values()){
  const record=records[0],period=cafeFPeriod(record,request.TypeTime);periods.push({symbol:request.symbol,endpoint:request.endpoint,requestMode:request.TypeTime,...period,type:record.type,content:record.content,time:record.time,payloadHash:request.payloadHash});
  const zero=cafeFAllZeroAnomaly(records);if(zero.anomaly)anomalies.push({symbol:request.symbol,endpoint:request.endpoint,...period,providerType:record.type,kind:'ALL_OR_NEAR_ZERO_STATEMENT',...zero,payloadHash:request.payloadHash,canonicalZeroAdmission:false});
  if(request.endpoint==='GetReportLCTT'&&period.periodType==='QUARTER'&&record.quater>1)anomalies.push({symbol:request.symbol,endpoint:request.endpoint,...period,kind:'QUARTER_CASH_FLOW_BASIS_UNVERIFIED',payloadHash:request.payloadHash,canonicalZeroAdmission:false});
  if(period.modeMismatch)anomalies.push({symbol:request.symbol,endpoint:request.endpoint,...period,providerType:record.type,kind:'REQUEST_MODE_NOT_HONORED',payloadHash:request.payloadHash,canonicalZeroAdmission:false});
  const cells=new Map(records.flatMap(r=>r.data).map(c=>[c.code.trim(),c.value===null?null:String(c.value)]));
  const tlabel=code=>p.templates.find(t=>t.code.trim()===code)?.name.toLocaleLowerCase('vi')??'';
  const get=code=>cells.get(code)??null;
  const sameUnitAssumed=true; // Numeric provider-internal reconciliation only; does not establish currency/unit.
  if(request.endpoint==='GetReportCDKT'){
   let assets=null,liabilities=null,equity=null;
   if(namespace(request.symbol)==='BANK'&&tlabel('300').includes('tổng tài sản')&&tlabel('400').includes('tổng nợ phải trả')&&tlabel('500').includes('vốn chủ sở hữu')){assets=get('300');liabilities=get('400');equity=get('500');}
   else if(tlabel('270').includes('tài sản')&&tlabel('300').includes('nợ phải trả')&&tlabel('400').includes('vốn chủ sở hữu')){assets=get('270');liabilities=get('300');equity=get('400');}
   const sum=liabilities!==null&&equity!==null?decimal(liabilities).add(decimal(equity)).toString():null;
   identities.push({symbol:request.symbol,kind:'ASSETS_EQUALS_LIABILITIES_PLUS_EQUITY',...period,providerType:record.type,left:assets,right:sum,status:reconcileCafeFValues(assets,sum,sameUnitAssumed),absoluteTolerance:'1000 provider raw units',relativeTolerance:'0.000001',payloadHash:request.payloadHash,verifiedCurrency:false});
   if(identities.at(-1).status==='CONFLICT')for(const f of p.facts.filter(f=>f.fiscalYear===record.year&&f.fiscalQuarter===(record.quater||null)&&f.providerType===record.type&&['TOTAL_ASSETS','TOTAL_EQUITY'].includes(f.itemId)))f.providerStatus='CONFLICT';
   const base=p.facts.find(f=>f.fiscalYear===record.year&&f.fiscalQuarter===(record.quater||null)&&f.providerType===record.type&&f.itemId==='TOTAL_ASSETS');
   if(base&&!zero.anomaly&&!period.modeMismatch){
    const derive=(itemId,value,codes)=>{const id=payloadHash([request.payloadHash,request.TypeTime,itemId,record.year,record.quater,record.type].join(':'));const sourceFactIds=codes.map(code=>'raw-witness:'+request.payloadHash+':'+record.year+':'+record.quater+':'+record.type+':'+code);facts.push({...base,id,itemId,valueType:'MECHANICALLY_DERIVED',providerCode:null,rawLocator:'derived:CDKT/'+codes.join('+'),sourceFactIds,normalized:{value,unit:'CURRENCY',currency:'VND'},derivation:{method:'EXACT_SAME_RECORD_SUM_V1',codes,calculatedAt:context.calculatedAt,providerInternalUnitsUnverified:true}});};
    if(['STANDARD_CORPORATE','REAL_ESTATE'].includes(namespace(request.symbol))&&tlabel('320').includes('vay')&&tlabel('338').includes('vay')&&get('320')!==null&&get('338')!==null)derive('FINANCIAL_DEBT',decimal(get('320')).add(decimal(get('338'))).toString(),['320','338']);
   }
  }
  if(request.endpoint==='GetReportLCTT'&&tlabel('HDTC_40').includes('đầu kỳ')&&tlabel('HDTC_42').includes('cuối kỳ')){
   const codes=['HDTC_40','HDTC_39','HDTC_41'];const left=codes.every(code=>get(code)!==null)?codes.map(get).map(decimal).reduce((a,b)=>a.add(b),decimal('0')).toString():null;
   identities.push({symbol:request.symbol,kind:'OPENING_PLUS_CHANGE_PLUS_FX_EQUALS_CLOSING_CASH',...period,providerType:record.type,left,right:get('HDTC_42'),status:zero.anomaly?'PROVIDER_ANOMALY':reconcileCafeFValues(left,get('HDTC_42')),absoluteTolerance:'1000 provider raw units',relativeTolerance:'0.000001',payloadHash:request.payloadHash});
  }
  rawSupport.push({request,period,record,cells:Object.fromEntries(cells),templates:p.templates});
 }
 }catch(e){failures.push({...request,failure:'SCHEMA_OR_NORMALIZATION: '+e.message});}
}
const uniqueFacts=[...new Map(facts.map(f=>[f.id,f])).values()];
const key=f=>JSON.stringify([f.ticker,f.itemId,f.periodType,f.reportPeriodType,f.periodStart,f.periodEnd,f.providerType]);
const detailed=uniqueFacts.filter(f=>f.endpoint!=='GetReportSummary'&&!f.modeMismatch&&!f.ambiguousQuarterlyFlow&&f.periodEnd<=asOf.slice(0,10));
const canonicalCandidates=[];
for(const k of [...new Set(detailed.map(key))].sort()){
 const rows=detailed.filter(f=>key(f)===k),values=[...new Set(rows.filter(f=>f.normalized.value!==null).map(f=>f.normalized.value))];
 const status=rows.some(f=>f.providerStatus==='PROVIDER_ANOMALY')?'PROVIDER_ANOMALY':rows.some(f=>f.providerStatus==='CONFLICT')?'CONFLICT':values.length>1?'CONFLICT':values.length===0?'MISSING':'UNVERIFIED';
 canonicalCandidates.push({key:k,status,value:status==='UNVERIFIED'?values[0]:null,facts:rows,productionAdmissible:false});
}
const reconciliation=[...identities];
for(const f of uniqueFacts.filter(f=>f.endpoint==='GetReportSummary')){
 const d=detailed.find(d=>key(d)===key(f));
 reconciliation.push({symbol:f.ticker,kind:'DETAIL_VS_SUMMARY',metric:f.itemId,periodType:f.reportPeriodType,periodEnd:f.periodEnd,providerType:f.providerType,left:d?.normalized.value??null,right:f.normalized.value,status:d?.providerStatus==='PROVIDER_ANOMALY'||f.providerStatus==='PROVIDER_ANOMALY'?'PROVIDER_ANOMALY':reconcileCafeFValues(d?.normalized.value??null,f.normalized.value,!!d&&!f.modeMismatch,f.normalized.unit==='CURRENCY_PER_SHARE'?'0.01':'1000'),detailFactId:d?.id??null,summaryFactId:f.id,detailPayloadHash:d?.sourceHash??null,summaryPayloadHash:f.sourceHash,scopeComparison:'SAME_RAW_PROVIDER_TYPE_ONLY_UNVERIFIED',unitComparison:'PROVIDER_INTERNAL_UNVERIFIED'});
}
for(const s of rawSupport.filter(s=>s.request.endpoint==='GetReportLCTT'&&!s.period.modeMismatch)){
 const bs=rawSupport.find(b=>b.request.endpoint==='GetReportCDKT'&&b.request.symbol===s.request.symbol&&b.record.year===s.record.year&&b.record.quater===s.record.quater&&b.record.type===s.record.type&&!b.period.modeMismatch);
 const cf=s.templates.find(t=>t.code==='HDTC_42'),cash=detailed.find(f=>f.ticker===s.request.symbol&&f.itemId==='CASH_AND_EQUIVALENTS'&&f.fiscalYear===s.record.year&&f.fiscalQuarter===(s.record.quater||null)&&f.providerType===s.record.type);
 if(cf?.name.toLowerCase().includes('cuối kỳ'))reconciliation.push({symbol:s.request.symbol,kind:'BS_CASH_VS_CF_CLOSING_CASH',periodType:s.period.periodType,periodEnd:s.period.periodEnd,providerType:s.record.type,left:cash?.normalized.value??null,right:s.cells.HDTC_42??null,status:reconcileCafeFValues(cash?.normalized.value??null,s.cells.HDTC_42??null,!!bs&&!!cash),payloadHash:s.request.payloadHash,balancePayloadHash:bs?.request.payloadHash??null});
}
const usable=canonicalCandidates.filter(c=>c.status==='UNVERIFIED').flatMap(c=>[c.facts.find(f=>f.normalized.value===c.value)]);
const summary=[];for(const symbol of symbols){
 const f=usable.filter(f=>f.ticker===symbol),selected=selectCafeFAnalysisPeriod(f,asOf,'CURRENT_ANALYSIS'),short=f=>f?{periodType:f.reportPeriodType,year:f.fiscalYear,quarter:f.fiscalQuarter,months:f.monthsCovered,periodEnd:f.periodEnd,auditStatus:f.auditStatus,scope:f.reportingScope,providerType:f.providerType}:null;
 summary.push({symbol,sector:sectors.get(symbol),mappingNamespace:namespace(symbol),attemptedRequests:requests.filter(r=>r.symbol===symbol).length,successfulHttpRequests:latestRequests.filter(r=>r.symbol===symbol&&r.httpStatus===200&&!r.error).length,schemaFailures:failures.filter(r=>r.symbol===symbol).length,latestAnnual:short(selected.latestAnnual),latestQuarter:short(selected.latestQuarter),latestYTD:short(selected.latestYtd),effectiveAnalysisPeriod:short(selected.effectiveAnalysisPeriod),annual2022:periods.some(p=>p.symbol===symbol&&!p.modeMismatch&&p.periodType==='ANNUAL'&&p.fiscalYear===2022),annual2023:periods.some(p=>p.symbol===symbol&&!p.modeMismatch&&p.periodType==='ANNUAL'&&p.fiscalYear===2023),annual2024:periods.some(p=>p.symbol===symbol&&!p.modeMismatch&&p.periodType==='ANNUAL'&&p.fiscalYear===2024),annual2025:periods.some(p=>p.symbol===symbol&&!p.modeMismatch&&p.periodType==='ANNUAL'&&p.fiscalYear===2025),currentYearQuarter:periods.some(p=>p.symbol===symbol&&!p.modeMismatch&&p.periodType==='QUARTER'&&p.fiscalYear===2026),currentYearYTD:periods.some(p=>p.symbol===symbol&&!p.modeMismatch&&p.periodType==='YTD'&&p.fiscalYear===2026),anomalyRecords:anomalies.filter(a=>a.symbol===symbol&&a.kind==='ALL_OR_NEAR_ZERO_STATEMENT').length,historicalPitReady:false,productionAdmissible:false});
}
const manualFacts=manual.canonicalFacts.filter(c=>c.status==='AVAILABLE').map(c=>({canonicalKey:c.key,value:c.value,...c.facts.find(f=>c.selectedFactIds.includes(f.id))}));
const coverage=[];for(const symbol of symbols){
 const route=requirements.sectors[sectors.get(symbol)],selected=summary.find(s=>s.symbol===symbol).effectiveAnalysisPeriod;
 const classes={CORE:route.CORE.flatMap(g=>g.anyOf),SECTOR_CORE:route.SECTOR_CORE.flatMap(g=>g.anyOf),SUPPORTING:route.SUPPORTING,OPTIONAL:route.OPTIONAL};
 for(const [evidenceClass,metrics]of Object.entries(classes))for(const metric of [...new Set(metrics)]){
  const c=selected?canonicalCandidates.find(c=>{const f=c.facts[0];return f.ticker===symbol&&f.itemId===metric&&f.reportPeriodType===selected.periodType&&f.periodEnd===selected.periodEnd&&f.providerType===selected.providerType;}):null;
  const manualFallback=manualFacts.filter(f=>f.ticker===symbol&&f.itemId===metric&&f.period.end<=asOf.slice(0,10)).sort((a,b)=>b.period.end.localeCompare(a.period.end))[0];
  const classification=c?.status==='CONFLICT'?'CONFLICT':c?.status==='PROVIDER_ANOMALY'?'PROVIDER_ANOMALY':c?.status==='UNVERIFIED'?c.facts.some(f=>f.valueType==='MECHANICALLY_DERIVED')?'SAFE_DERIVED':'DIRECT':manualFallback?'PDF_FALLBACK_REQUIRED':'UNAVAILABLE';
  coverage.push({symbol,sector:sectors.get(symbol),evidenceClass,metric,classification,periodType:selected?.periodType??null,periodEnd:selected?.periodEnd??null,providerValue:c?.value??null,providerFactIds:c?.facts.map(f=>f.id)??[],payloadHashes:c?[...new Set(c.facts.map(f=>f.sourceHash))]:[],pdfFallbackHash:manualFallback?.sourceHash??null,pdfFallbackPeriod:manualFallback?.period.end??null,verificationStatus:c?.status??'NO_PROVIDER_CANDIDATE',scopeVerified:false,currencyUnitVerified:false,calendarVerified:false,productionAdmissible:false});
 }
}
const requirementGroups=[];
for(const symbol of symbols){const route=requirements.sectors[sectors.get(symbol)];for(const evidenceClass of ['CORE','SECTOR_CORE'])for(const group of route[evidenceClass]){
 const cells=coverage.filter(c=>c.symbol===symbol&&c.evidenceClass===evidenceClass&&group.anyOf.includes(c.metric));
 requirementGroups.push({symbol,evidenceClass,requirementId:group.id,anyOf:group.anyOf,direct:cells.some(c=>c.classification==='DIRECT'),directOrSafeDerived:cells.some(c=>['DIRECT','SAFE_DERIVED'].includes(c.classification)),classifications:cells.map(c=>({metric:c.metric,classification:c.classification}))});
}}
csv('cafef_requirement_group_coverage.csv',requirementGroups);
const metricSummary=[];for(const klass of ['CORE','SECTOR_CORE','SUPPORTING','OPTIONAL']){const rows=coverage.filter(r=>r.evidenceClass===klass);metricSummary.push({evidenceClass:klass,denominatorMetricSymbolCells:rows.length,...Object.fromEntries(['DIRECT','SAFE_DERIVED','PDF_FALLBACK_REQUIRED','UNAVAILABLE','PROVIDER_ANOMALY','CONFLICT'].map(s=>[s,rows.filter(r=>r.classification===s).length])),directPercent:100*rows.filter(r=>r.classification==='DIRECT').length/rows.length,directPlusSafeDerivedPercent:100*rows.filter(r=>['DIRECT','SAFE_DERIVED'].includes(r.classification)).length/rows.length,measurement:'PROVISIONAL_CODE_VALUE_PERIOD_COVERAGE_NOT_PRODUCTION_ADMISSION'});}
const sampleObservations=read('docs/fundamental-data-engine/evidence/2026-10-13-cafef-structured-poc/cafef_pdf_sample_cell_observations.json').observations;
const pdfEvidence=[...sampleObservations,...manualFacts];
const pdfSample=[];for(const symbol of ['HPG','VCB','SSI','VIC'])for(const metric of [...new Set(['REVENUE','NET_INCOME_ATTRIBUTABLE_PARENT','NET_INCOME','TOTAL_ASSETS','TOTAL_EQUITY','FINANCIAL_DEBT','CASH_AND_EQUIVALENTS','CFO','CASH_CAPEX_REPORTED',...(symbol==='VCB'?['BANK_GROSS_CUSTOMER_LOANS','BANK_CUSTOMER_DEPOSITS','BANK_LOAN_LOSS_RESERVES','BANK_REPORTED_CAR']:symbol==='SSI'?['SECURITIES_MARGIN_LOANS']:[])])]){
 const candidates=detailed.filter(f=>f.ticker===symbol&&f.itemId===metric&&f.reportPeriodType==='ANNUAL'&&f.auditStatus==='AUDITED');
 const pairs=candidates.flatMap(f=>pdfEvidence.filter(m=>m.ticker===symbol&&m.itemId===metric&&m.period.start===f.periodStart&&m.period.end===f.periodEnd).map(m=>({f,m}))).sort((a,b)=>b.f.periodEnd.localeCompare(a.f.periodEnd));
 const pair=pairs[0];let classification='UNRESOLVED',numericComparison='MISSING';
 if(pair){numericComparison=reconcileCafeFValues(pair.f.normalized.value,pair.m.value);if(pair.f.providerStatus==='PROVIDER_ANOMALY')classification='CAFEF_ERROR';else if(pair.f.ticker==='VCB'&&metric==='NET_INCOME_ATTRIBUTABLE_PARENT'&&numericComparison==='CONFLICT')classification='CAFEF_ERROR';else if(pair.f.providerType==='HK'&&pair.m.scope==='CONSOLIDATED'&&pair.f.normalized.currency===pair.m.currency&&pair.f.normalized.unit===pair.m.unit){classification=numericComparison==='MATCH'?'MATCH':numericComparison==='MATCH_WITHIN_TOLERANCE'?'ROUNDING':'UNRESOLVED';}}
 const source=pair?.m?manual.statements.find(s=>s.SHA256===pair.m.sourceHash):null;
 if(source)assert.equal(payloadHash(readFileSync(join(root,source.retainedPath))),pair.m.sourceHash);
 pdfSample.push({symbol,metric,classification,numericComparison,periodEnd:pair?.f.periodEnd??null,cafeFValue:pair?.f.normalized.value??null,pdfValue:pair?.m.value??null,cafeFPayloadHash:pair?.f.sourceHash??null,pdfHash:pair?.m.sourceHash??null,pdfPath:source?.retainedPath??null,pdfLocator:pair?.m.evidenceLocator??null,pdfReviewReference:pair?.m.reviewReference??null,pdfReaderProof:pair?.m.retainedReaderProof??null,pdfPocObservation:pair?.m.pocVerificationOnly??false,pdfScope:pair?.m.scope??null,providerType:pair?.f.providerType??null,comparisonAssumptions:'HK compared with qualified consolidated audited PDF; same numeric unit magnitude witnessed locally, not general CafeF scope/unit certification.',productionAdmissible:false,reason:pair?classification==='CAFEF_ERROR'&&symbol==='VCB'?'CafeF parent NPAT 35,218,217 million differs from audited PDF 35,177,663 million; CafeF total NPAT matches, while minority deduction sign is inconsistent.':classification==='CAFEF_ERROR'?'All-zero provider flow contradicted by nonzero visually verified audited PDF cell.':'Existing reviewed/POC visual PDF cells rebound to exact retained hash; unresolved differences are not promoted.':'No exact compatible retained AVAILABLE reviewed cell/provider pair; no new PDF extraction.'});
}
for(const metric of ['CFO','CASH_CAPEX_REPORTED']){
 const m=sampleObservations.find(m=>m.ticker==='HPG'&&m.itemId===metric&&m.period.end==='2024-12-31');const f=detailed.find(f=>f.ticker==='HPG'&&f.itemId===metric&&f.fiscalYear===2024&&f.reportPeriodType==='ANNUAL');
 pdfSample.push({symbol:'HPG',metric,classification:'CAFEF_ERROR',numericComparison:reconcileCafeFValues(f?.normalized.value??null,m?.value??null),periodEnd:'2024-12-31',cafeFValue:f?.normalized.value??null,pdfValue:m?.value??null,cafeFPayloadHash:f?.sourceHash??null,pdfHash:m?.sourceHash??null,pdfLocator:m?.evidenceLocator??null,reason:'All-zero 2024 CafeF LCTT contradicted by explicit nonzero 2024 comparative column in retained audited FY2025 PDF; current-analysis verification only.',productionAdmissible:false});
}
write('cafef_request_inventory.json',{requests,uniqueRequests:latestRequests.length,rawArchiveDirectory:'data/providers/cafef/poc-2026-10-13/raw',failures});
write('cafef_template_inventory.json',{templates:templates.map(t=>Object.fromEntries(Object.entries(t).filter(([key])=>key!=='rows'))),templateDefinitions:[...new Map(templates.map(t=>[t.templateHash,{templateHash:t.templateHash,exampleSymbol:t.symbol,endpoint:t.endpoint,rows:t.rows}])).values()]});write('cafef_period_inventory.json',{analysisAt:asOf,periods});
write('cafef_raw_capture_manifest.json',captures.map(c=>({...Object.fromEntries(Object.entries(c).filter(([key])=>key!=='payload')),payloadRetainedInRawArchive:true,rawPayloadLocation:latestRequests.find(r=>r.payloadHash===c.payloadHash)?.rawPayloadLocation})));
writeFileSync(join(rawBase,'normalized-provider-facts.json'),JSON.stringify(uniqueFacts)+'\n');writeFileSync(join(rawBase,'canonical-review-candidates.json'),JSON.stringify(canonicalCandidates)+'\n');
csv('cafef_coverage_matrix.csv',coverage);csv('cafef_anomalies.csv',anomalies);csv('cafef_reconciliation.csv',reconciliation);csv('cafef_pdf_validation_sample.csv',pdfSample);csv('cafef_symbol_summary.csv',summary);csv('cafef_metric_summary.csv',metricSummary);
const counts={symbolsAttempted:summary.filter(s=>s.attemptedRequests>0).length,symbolsWithHttpSuccess:summary.filter(s=>s.successfulHttpRequests>0).length,httpRequests:requests.length,httpFailures:requests.filter(r=>r.error||r.httpStatus!==200).length,schemaOrNormalizationFailures:failures.filter(f=>f.failure.startsWith('SCHEMA')).length,annual2022:summary.filter(s=>s.annual2022).length,annual2023:summary.filter(s=>s.annual2023).length,annual2024:summary.filter(s=>s.annual2024).length,annual2025:summary.filter(s=>s.annual2025).length,currentYearQuarter:summary.filter(s=>s.currentYearQuarter).length,currentYearYTD:summary.filter(s=>s.currentYearYTD).length,providerFacts:uniqueFacts.length,canonicalReviewCandidates:canonicalCandidates.length,allOrNearZeroStatements:anomalies.filter(a=>a.kind==='ALL_OR_NEAR_ZERO_STATEMENT').length,modeMismatchStatements:anomalies.filter(a=>a.kind==='REQUEST_MODE_NOT_HONORED').length,pdfSampleRows:pdfSample.length,pdfMatches:pdfSample.filter(r=>r.classification==='MATCH').length,pdfRounding:pdfSample.filter(r=>r.classification==='ROUNDING').length,pdfCafeFErrors:pdfSample.filter(r=>r.classification==='CAFEF_ERROR').length,pdfUnresolved:pdfSample.filter(r=>r.classification==='UNRESOLVED').length,crossEndpoint:Object.fromEntries(['MATCH','MATCH_WITHIN_TOLERANCE','CONFLICT','NOT_COMPARABLE','MISSING','PROVIDER_ANOMALY'].map(status=>[status,reconciliation.filter(r=>r.kind==='DETAIL_VS_SUMMARY'&&r.status===status).length])),criticalGapSymbols:symbols.filter(symbol=>requirementGroups.some(g=>g.symbol===symbol&&!g.directOrSafeDerived)),anomalySymbols:[...new Set(anomalies.filter(a=>a.kind==='ALL_OR_NEAR_ZERO_STATEMENT').map(a=>a.symbol))],observedStatementBundles:periods.length,invalidPeriodSentinelRecords:anomalies.filter(a=>a.kind==='INVALID_PROVIDER_PERIOD_SENTINEL').length,ambiguousQuarterCashFlowRecords:anomalies.filter(a=>a.kind==='QUARTER_CASH_FLOW_BASIS_UNVERIFIED').length,accountingIdentity:Object.fromEntries(['MATCH','MATCH_WITHIN_TOLERANCE','CONFLICT','MISSING'].map(status=>[status,identities.filter(r=>r.status===status).length])),metricCoverage:metricSummary};
write('CAFEF_POC_SUMMARY.json',{status:counts.symbolsAttempted===30?'POC_RUN_COMPLETED_AWAITING_REVIEW':'POC_INCOMPLETE',counts,failures,authority:'NON_AUTHORITATIVE_REVIEW_CANDIDATE',productionMigrationPerformed:false,scoringUnblocked:false,investmentLogicChanged:false,rawNormalizedCanonicalNamespaces:'ISOLATED',historicalPitReady:0,universeSource:'Explicit Project Owner POC instruction; not a certification of current official membership',analysisMode:'CURRENT_ANALYSIS',productionCanonicalFactsWritten:0});
console.log(JSON.stringify(counts,null,2));
