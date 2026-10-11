import {validateCafeFResponse,payloadHash,type CafeFEndpoint,type CafeFMode,type CafeFNamespace} from './cafef';
import {canonicalJson} from '@/domain/fundamentals/snapshot';
/** Ordering, labels, hierarchy and raw identifiers remain material. Only code-edge whitespace is normalized. */
export function cafeFSchema(body:string,endpoint:CafeFEndpoint,symbol:string,mode:CafeFMode,namespace:CafeFNamespace){
 const parsed=validateCafeFResponse(body,endpoint,symbol,mode);
 const root=parsed.rawValue as Record<string,unknown>;
 const rows=parsed.templates.map(t=>({rawCode:t.code,normalizedCode:t.code.trim(),label:t.name.normalize('NFC'),lever:t.lever??null,number:t.number??null,static:t.static??null}));
 const collisions=rows.filter((r,i)=>rows.some((other,j)=>j<i&&other.normalizedCode===r.normalizedCode));
 const collisionCodes=[...new Set(collisions.map(r=>r.normalizedCode))].sort();
 const material={version:'cafef-schema-v1',endpoint,namespace,reportType:parsed.providerType,providerUnit:parsed.unit,rootKeys:Object.keys(root).sort(),templateTree:root.templace,rows,recordKeys:[...new Set(parsed.records.flatMap(r=>Object.keys(r)))].sort(),cellKeys:[...new Set(parsed.records.flatMap(r=>r.data.flatMap(c=>Object.keys(c))))].sort(),listType:root.listType??null};
 return {fingerprint:payloadHash(canonicalJson(material)),material,rows,collisionCodes,parsed};
}
export function compareCafeFSchemas(before:ReturnType<typeof cafeFSchema>['material'],after:ReturnType<typeof cafeFSchema>['material']){
 const b=new Map(before.rows.map(r=>[r.normalizedCode,r])),a=new Map(after.rows.map(r=>[r.normalizedCode,r]));
 return {compatible:canonicalJson(before)===canonicalJson(after),newCodes:[...a.keys()].filter(k=>!b.has(k)),removedCodes:[...b.keys()].filter(k=>!a.has(k)),labelChanges:[...a.keys()].filter(k=>b.has(k)&&b.get(k)!.label!==a.get(k)!.label),hierarchyChanges:[...a.keys()].filter(k=>b.has(k)&&(b.get(k)!.lever!==a.get(k)!.lever||b.get(k)!.number!==a.get(k)!.number)),metadataDrift:canonicalJson({...before,rows:[],templateTree:[]})!==canonicalJson({...after,rows:[],templateTree:[]}),state:canonicalJson(before)===canonicalJson(after)?'COMPATIBLE':'REVIEW_REQUIRED'};
}
