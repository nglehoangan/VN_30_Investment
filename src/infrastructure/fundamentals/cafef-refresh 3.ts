import {cafeFSchema,compareCafeFSchemas} from './cafef-schema';
import {decimal} from '@/domain/portfolio/values';
import type {CafeFEndpoint,CafeFMode,CafeFNamespace} from './cafef';
/** Compare captures in the same issuer/endpoint/mode namespace before certifying a refresh.
 * New financial periods are additions; changed same-period cells require independent revision evidence.
 * No previous capture or previously admitted snapshot is mutated. */
export function auditCafeFRefresh(beforeBody:string,afterBody:string,endpoint:CafeFEndpoint,symbol:string,mode:CafeFMode,namespace:CafeFNamespace){
 const before=cafeFSchema(beforeBody,endpoint,symbol,mode,namespace),after=cafeFSchema(afterBody,endpoint,symbol,mode,namespace);
 const schema=compareCafeFSchemas(before.material,after.material);
 const cells=(s:typeof before)=>s.parsed.records.flatMap(r=>r.data.map(c=>({key:[r.year,r.quater,r.type,c.code.trim()].join('|'),year:r.year,quarter:r.quater,providerType:r.type,rawCode:c.code,value:c.value===null?null:String(c.value)})));
 const old=new Map(cells(before).map(c=>[c.key,c])),current=cells(after);
 const same=(a:string|null,b:string|null)=>{if(a===null||b===null)return a===b;try{return decimal(a).eq(decimal(b));}catch{return a===b;}};
 const revisions=current.filter(c=>old.has(c.key)&&!same(c.value,old.get(c.key)!.value)).map(c=>({...c,beforeValue:old.get(c.key)!.value,afterValue:c.value,state:'UNEXPLAINED_CHANGE' as const}));
 return {symbol,endpoint,mode,namespace,beforeFingerprint:before.fingerprint,afterFingerprint:after.fingerprint,schema,state:schema.compatible?'COMPATIBLE' as const:'REVIEW_REQUIRED' as const,revisions,newCells:current.filter(c=>!old.has(c.key)).length,rule:'Incompatible schema cannot reuse prior certificate; changed cells require independently retained revision evidence; historical facts retain original bindings.'};
}
