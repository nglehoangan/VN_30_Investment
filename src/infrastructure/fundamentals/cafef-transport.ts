import {CAFEF_ENDPOINTS,CAFEF_ACTIVE_MODES,payloadHash,type CafeFEndpoint,type CafeFMode} from './cafef';
export interface CafeFRequest {symbol:string;endpoint:CafeFEndpoint;mode:CafeFMode;pageIndex:number;pageSize:number}
export interface CafeFCapture {provider:'CAFEF';endpoint:CafeFEndpoint;url:string;symbol:string;requestParameters:{symbol:string;pageIndex:number;pageSize:number;reportType:string;TypeTime:CafeFMode};TypeTime:CafeFMode;reportType:string;pageIndex:number;attempt:number;retrievedAt:string;httpStatus:number|null;mediaType:string|null;payloadHash:string;requestFingerprint:string;error:string|null;body:string}
interface Dependencies {request:(url:string,init:RequestInit)=>Promise<Response>;sleep:(ms:number)=>Promise<void>;now:()=>string;retain:(capture:CafeFCapture)=>Promise<void>}
/** All HTTP attempts, including errors, are retained before normalization; injected IO in tests. */
export class CafeFTransport {
 private requests=0;public blocked=false;
 constructor(private readonly deps:Dependencies,private readonly timeoutMs=18000,private readonly intervalMs=1250){if(timeoutMs<1||timeoutMs>60000||intervalMs<1000)throw Error('INVALID_FETCH_POLICY');}
 async retrieve(query:CafeFRequest):Promise<CafeFCapture|null>{
  if(this.blocked)throw Error('ACCESS_OR_RATE_LIMIT_STOP');
  if(!/^[A-Z]{3}$/.test(query.symbol)||!Object.hasOwn(CAFEF_ENDPOINTS,query.endpoint)||!CAFEF_ACTIVE_MODES.some(mode=>mode===query.mode)||!Number.isInteger(query.pageIndex)||query.pageIndex<1||query.pageIndex>8||!Number.isInteger(query.pageSize)||query.pageSize<1||query.pageSize>20)throw Error('INVALID_CAFEF_REQUEST');
  const parameters={symbol:query.symbol,pageIndex:query.pageIndex,pageSize:query.pageSize,reportType:query.endpoint==='GetReportDetail'?'KQKD':'ALL',TypeTime:query.mode};
  const url=new URL(`https://apiweb.cafef.vn/api/${CAFEF_ENDPOINTS[query.endpoint]}/BCTC/${query.endpoint}`);for(const [k,v]of Object.entries(parameters))url.searchParams.set(k,String(v));
  for(let attempt=1;attempt<=2;attempt++){
   if(this.requests++)await this.deps.sleep(this.intervalMs);
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),this.timeoutMs);
   let status:number|null=null,mediaType:string|null=null,error:string|null=null,body='';
   try{
    const operation=async()=>{const response=await this.deps.request(url.href,{signal:controller.signal,redirect:'manual',credentials:'omit',headers:{accept:'application/json','user-agent':'VN30-Fundamental-Research-POC/1.0 (public-data validation; rate-limited)'}});
     status=response.status;mediaType=response.headers.get('content-type');
     const chunks:Uint8Array[]=[],reader=response.body?.getReader();let length=0;
     if(reader){try{while(true){const r=await reader.read();if(r.done)break;length+=r.value.length;if(length>4000000)throw Error('PAYLOAD_LIMIT');chunks.push(r.value);}}finally{await reader.cancel().catch(()=>{});}}
     body=Buffer.concat(chunks).toString('utf8');
     if([401,403,429].includes(status)){this.blocked=true;throw Error('ACCESS_OR_RATE_LIMIT_STOP');}
     if(status!==200)throw Error('HTTP_'+status);if(!mediaType?.includes('application/json'))throw Error('MEDIA_TYPE');
     const parsed=JSON.parse(body);if(parsed?.isSuccess!==true)throw Error('PROVIDER_FAILURE');
    };
    await Promise.race([operation(),new Promise<never>((_,reject)=>controller.signal.addEventListener('abort',()=>reject(Error('TIMEOUT')),{once:true}))]);
   }catch(e){error=e instanceof Error?e.message:'TRANSPORT_ERROR';}finally{clearTimeout(timer);controller.abort();}
   const capture:CafeFCapture={provider:'CAFEF',endpoint:query.endpoint,url:url.href,symbol:query.symbol,requestParameters:parameters,TypeTime:query.mode,reportType:parameters.reportType,pageIndex:query.pageIndex,attempt,retrievedAt:this.deps.now(),httpStatus:status,mediaType,payloadHash:payloadHash(body),requestFingerprint:payloadHash(url.href),error,body};
   await this.deps.retain(capture);
   if(!error)return capture;if(this.blocked||status!==null&&status<500)break;
   if(attempt<2)await this.deps.sleep(1000*2**(attempt-1));
  }
  return null;
 }
}
/** Annual pages continue until the oldest requested fiscal year is observed, not always page 1. */
export function cafeFNeedsNextPage(mode:CafeFMode,years:readonly number[],pageIndex:number,count:number,pageSize:number,currentYear:number){
 if(!years.length||pageIndex>=8||pageIndex*pageSize>=count)return false;
 return mode==='NAM'?Math.min(...years)>2022:Math.min(...years)>currentYear;
}
