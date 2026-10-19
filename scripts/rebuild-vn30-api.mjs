/** Fresh public captures and occurrence-aware provider display; no accounting admission. */
import './lib/ts-runtime.mjs';
import {mkdirSync,readFileSync,writeFileSync,existsSync} from 'node:fs';
const {CafeFTransport}=await import('../src/infrastructure/fundamentals/cafef-transport.ts');
const {CAFEF_ENDPOINTS,payloadHash}=await import('../src/infrastructure/fundamentals/cafef.ts');
const {mapCafeFDisplay,CAFEF_DISPLAY_REPORTS}=await import('../src/infrastructure/fundamentals/cafef-display.ts');
const plan=JSON.parse(readFileSync('docs/fundamental-data-engine/rebuild-2026-10-19/source-plan.json','utf8'));
const base='data/manual-extracted-api';
mkdirSync(base+'/raw/cafef',{recursive:true});
const inventoryPath=base+'/requests.json';
const inventory=existsSync(inventoryPath)?JSON.parse(readFileSync(inventoryPath,'utf8')):[];
const write=(path,data)=>writeFileSync(path,JSON.stringify(data,null,2)+'\n');
const transport=new CafeFTransport({request:(url,init)=>fetch(url,init),sleep:ms=>new Promise(r=>setTimeout(r,ms)),now:()=>new Date().toISOString(),retain:async capture=>{
 const {body,...metadata}=capture;
 const rawPayloadLocation=base+'/raw/cafef/'+capture.payloadHash+'.json';
 if(!existsSync(rawPayloadLocation))writeFileSync(rawPayloadLocation,body);
 inventory.push({...metadata,rawPayloadLocation});write(inventoryPath,inventory);
}});
if(process.argv.includes('--repair-historical-schema')){
 for(const ticker of ['CTG','VCB'])for(const endpoint of Object.keys(CAFEF_ENDPOINTS)){
  if(transport.blocked)break;
  if(!inventory.some(r=>r.symbol===ticker&&r.endpoint===endpoint&&r.TypeTime==='NAM'&&r.requestParameters?.pageSize===20&&r.httpStatus===200&&!r.error))
   await transport.retrieve({symbol:ticker,endpoint,mode:'NAM',pageIndex:1,pageSize:20});
  if(!inventory.some(r=>r.symbol===ticker&&r.endpoint===endpoint&&r.TypeTime==='NAM'&&r.requestParameters?.pageSize===4&&r.httpStatus===200&&!r.error))
   await transport.retrieve({symbol:ticker,endpoint,mode:'NAM',pageIndex:1,pageSize:4});
 }
}
const manifest={schemaVersion:'cafef-display-v1',provider:'CAFEF',sourceInventory:inventoryPath,tickers:plan.tickers,files:[],failures:[],complete:false};
for(const ticker of plan.tickers){
 const result={schemaVersion:'cafef-display-v1',ticker,sourceInventory:inventoryPath,status:'PROVIDER_DISPLAY_ONLY',productionAdmissible:false,
  reports:Object.fromEntries(Object.values(CAFEF_DISPLAY_REPORTS).map(r=>[r.key,{...r,periods:{}}]))};
 for(const endpoint of Object.keys(CAFEF_ENDPOINTS))for(const mode of ['NAM','QUY']){
  if(transport.blocked)break;
  if(!inventory.some(r=>r.symbol===ticker&&r.endpoint===endpoint&&r.TypeTime===mode&&r.httpStatus===200&&!r.error))
   await transport.retrieve({symbol:ticker,endpoint,mode,pageIndex:1,pageSize:20});
  for(const [captureIndex,capture] of inventory.entries()){
   if(capture.symbol!==ticker||capture.endpoint!==endpoint||capture.TypeTime!==mode)continue;
  try{
   if(capture.error||capture.httpStatus!==200)throw Error(capture.error??'HTTP_FAILED');
   const request=capture;
   const body=readFileSync(request.rawPayloadLocation,'utf8');
   if(payloadHash(body)!==request.payloadHash)throw Error('RAW_HASH_MISMATCH');
   const mapped=mapCafeFDisplay(body,endpoint,ticker,mode);
   if(mapped.rejectedRecordCount)manifest.failures.push({ticker,endpoint,mode,error:'REJECTED_PERIOD_RECORDS',count:mapped.rejectedRecordCount});
   for(const column of mapped.columns){
    const period=result.reports[mapped.report.key].periods[column.periodKey]??={year:column.year,quarter:column.quarter,periodType:column.periodType,variants:[]};
    period.variants.push({...column,id:column.id+':capture:'+captureIndex,source:{provider:'CAFEF',endpoint,payloadHash:mapped.sourceHash,rawPayloadLocation:request.rawPayloadLocation,retrievedAt:request.retrievedAt,pageIndex:1,requestParameters:request.requestParameters,providerUnit:mapped.providerUnit,unitStatus:mapped.unitStatus}});
   }
  }catch(error){manifest.failures.push({ticker,endpoint,mode,rawPayloadLocation:capture.rawPayloadLocation,requestParameters:capture.requestParameters,error:error.message.slice(0,250)});}
  }
 }
 const path=base+'/'+ticker+'.json';write(path,result);
 manifest.files.push({ticker,path,sha256:payloadHash(readFileSync(path,'utf8')),reports:Object.values(result.reports).map(r=>({key:r.key,periods:Object.keys(r.periods).length}))});
 write(base+'/manifest.json',manifest);
 console.log(JSON.stringify({ticker,requests:inventory.length,blocked:transport.blocked}));
}
manifest.complete=!transport.blocked&&manifest.files.length===30;
manifest.accessOrRateLimitStop=transport.blocked;
manifest.rawCaptureCount=inventory.length;
manifest.completeDisplayMapping=manifest.complete&&manifest.failures.length===0;
manifest.status=transport.blocked?'STOPPED_BY_ACCESS_OR_RATE_LIMIT':manifest.failures.length?'COMPLETE_WITH_SCHEMA_QUARANTINE':'COMPLETE';
write(base+'/manifest.json',manifest);
if(transport.blocked)process.exitCode=1;
