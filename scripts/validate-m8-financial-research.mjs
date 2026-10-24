/** Actual retained-current-layout reads; no ingestion, transformations or database writes. */
import {readRetainedResearch} from '../src/infrastructure/fundamentals/retained-research.ts';
import {writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const out='docs/fundamental-data-engine/evidence/2026-10-24-m8-financial-current-layout-adapter';
const root=process.cwd(),viewedAt=new Date().toISOString(),catalog=await readRetainedResearch(root,undefined,undefined,undefined,viewedAt),records=[];
for(const {ticker,selections} of catalog.catalog){
 try{const r=await readRetainedResearch(root,ticker,undefined,undefined,viewedAt);
 records.push({ticker,status:'PARSED',fileHash:r.fileHash,retainedSelectionCounts:selections,variants:r.variants.length,scopes:[...new Set(r.variants.map(v=>v.reportingScope))],unknownScopeVariants:r.variants.filter(v=>v.reportingScope==='UNKNOWN').length,unknownPeriodVariants:r.variants.filter(v=>v.periodEnd===null).length,publicationQualifiedVariants:r.variants.filter(v=>v.publicationAt!==null).length,defaultSelection:r.selected,displayedRows:r.rows.length,numericRows:r.rows.filter(v=>v.value!==null).length,withheldRows:r.rows.filter(v=>v.status==='WITHHELD').length,missingRows:r.rows.filter(v=>v.value===null).length,reasons:[...new Set(r.rows.flatMap(v=>v.reasons))],productionAdmissible:r.productionAdmissible,scoringAuthorized:r.scoringAuthorized});
 }catch(e){records.push({ticker,status:'BLOCKED',reason:e.issues?.slice(0,4)??e.message});}
}
const vnm=await readRetainedResearch(root,'VNM');
const parent=vnm.variants.find(v=>v.sourcePath.includes('Congtyme')&&v.provider==='MANUAL_PDF');
const consolidated=vnm.variants.find(v=>v.reportingScope==='CONSOLIDATED');
const api=vnm.variants.find(v=>v.provider==='CAFEF');
const probes=[];
for(const [name,v] of [['parent-labelled PDF scope remains unqualified unless explicit',parent],['consolidated PDF',consolidated],['CafeF reference',api]]){
 assert.ok(v);const r=await readRetainedResearch(root,'VNM',String(v.index));
 probes.push({name,selected:r.selected,rows:r.rows.length,numeric:r.rows.filter(v=>v.value!==null).length,missing:r.rows.filter(v=>v.value===null).length,withheld:r.rows.filter(v=>v.status==='WITHHELD').length,sample:r.rows.slice(0,2)});
}
const result={classification:'ACTUAL_RETAINED_FINANCIAL_FILES_NOT_FIXTURES',viewedAt,status:records.every(r=>r.status==='PARSED')?'PASS':'BLOCKED',catalogTickers:catalog.catalog.length,quarantines:catalog.quarantines,records,representativeProbes:probes,productionAdmissible:false,scoringAuthorized:false};
writeFileSync(out+'/ACTUAL_DATA_COVERAGE.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({status:result.status,tickers:records.length,blocked:records.filter(r=>r.status==='BLOCKED'),probes:probes.map(p=>({name:p.name,numeric:p.numeric,withheld:p.withheld}))}));assert.equal(result.status,'PASS');
