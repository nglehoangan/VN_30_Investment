/** Public, sequential, cache-aware POC acquisition; no production repositories. */
import './lib/ts-runtime.mjs';
import {mkdirSync,existsSync,readFileSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
const {CafeFTransport,cafeFNeedsNextPage}=await import('../src/infrastructure/fundamentals/cafef-transport.ts');
const {CAFEF_ENDPOINTS,CAFEF_ACTIVE_MODES,payloadHash,validateCafeFResponse}=await import('../src/infrastructure/fundamentals/cafef.ts');
const root=resolve(import.meta.dirname,'..'),out=join(root,'data/providers/cafef/poc-2026-10-13');mkdirSync(join(out,'raw'),{recursive:true});
const symbols='ACB BID BSR CTG FPT GAS GVR HDB HPG LPB MBB MCH MSN MWG SAB SHB SSB SSI STB TCB TCX VCB VHM VIB VIC VJC VNM VPB VPL VRE'.split(' ');
const inventoryPath=join(out,'requests.json');const inventory=existsSync(inventoryPath)?JSON.parse(readFileSync(inventoryPath,'utf8')):[];
const transport=new CafeFTransport({request:(url,init)=>fetch(url,init),sleep:ms=>new Promise(r=>setTimeout(r,ms)),now:()=>new Date().toISOString(),retain:async capture=>{
 if(existsSync(join(root,'docs/fundamental-data-engine/evidence/2026-10-13-cafef-structured-poc/ARTIFACT_HASHES.json')))throw Error('SEALED_POC_RUN_REQUIRES_NEW_NAMESPACE');
 const {body,...metadata}=capture,rawPayloadLocation=join('data/providers/cafef/poc-2026-10-13/raw',capture.payloadHash+'.json');
 if(!existsSync(join(root,rawPayloadLocation)))writeFileSync(join(root,rawPayloadLocation),body);
 inventory.push({...metadata,rawPayloadLocation});writeFileSync(inventoryPath,JSON.stringify(inventory,null,2)+'\n');
}});
async function retrieve(symbol,endpoint,mode,pageIndex){
 const cache=inventory.findLast(r=>r.symbol===symbol&&r.endpoint===endpoint&&r.TypeTime===mode&&r.pageIndex===pageIndex);
 if(cache?.httpStatus===200&&!cache.error&&existsSync(resolve(root,cache.rawPayloadLocation))){const raw=readFileSync(resolve(root,cache.rawPayloadLocation));if(payloadHash(raw)!==cache.payloadHash)throw Error('CACHE_HASH_MISMATCH');return raw.toString();}
 if(process.argv.includes('--offline'))throw Error('OFFLINE_CACHE_MISS');
 const capture=await transport.retrieve({symbol,endpoint,mode,pageIndex,pageSize:4});return capture?.body??null;
}
for(const symbol of symbols){if(transport.blocked)break;
 for(const endpoint of Object.keys(CAFEF_ENDPOINTS))for(const mode of CAFEF_ACTIVE_MODES){
  if(transport.blocked)break;
  let previousHash=null;
  for(let page=1;page<=8;page++){
   const body=await retrieve(symbol,endpoint,mode,page);if(!body||transport.blocked)break;
   const hash=payloadHash(body);if(hash===previousHash)break;previousHash=hash;
   try{const parsed=validateCafeFResponse(body,endpoint,symbol,mode),years=parsed.records.map(r=>r.year);
    if(!cafeFNeedsNextPage(mode,years,page,parsed.count,4,2026))break;
   }catch{break;} // Malformed payload is already retained and later reported, never treated as coverage.
  }
 }
 console.log(JSON.stringify({symbol,retainedRequests:inventory.filter(r=>r.symbol===symbol).length,blocked:transport.blocked}));
}
if(transport.blocked)console.log('STOPPED: access/rate-limit response; no bypass attempted');
