import { requireBoundary } from '@/domain/market-boundary/validation';
/** JSON numbers become their original decimal lexemes. Reject duplicate keys and trailing input. */
export function exactJson(text: string): unknown {
  requireBoundary(text.length<=4_000_000,'JSON_SIZE');let at=0;
  const ws=()=>{while(/\s/.test(text[at]??'')&&at<text.length)at++;};
  const string=()=>{const start=at++;while(at<text.length){if(text[at]==='\\'){at+=2;continue;}if(text[at++]==='"')return JSON.parse(text.slice(start,at)) as string;}throw Error('MARKET_BOUNDARY:INVALID_JSON_STRING');};
  const value=(depth:number):unknown=>{
    requireBoundary(depth<60,'JSON_DEPTH');ws();const c=text[at];
    if(c==='"')return string();
    if(c==='{'||c==='['){const object=c==='{',result:Record<string,unknown>=Object.create(null),items:unknown[]=[],keys=new Set<string>();at++;ws();if(text[at]===(object?'}':']')){at++;return object?result:items;}
      while(at<text.length){if(object){requireBoundary(text[at]==='"','JSON_OBJECT_KEY');const key=string();requireBoundary(!keys.has(key),'DUPLICATE_JSON_KEY');keys.add(key);ws();requireBoundary(text[at++]===':','JSON_COLON');result[key]=value(depth+1);}else items.push(value(depth+1));ws();const end=text[at++];if(end===(object?'}':']'))return object?result:items;requireBoundary(end===',','JSON_SEPARATOR');ws();}
    }
    for(const [word,meaning] of [['true',true],['false',false],['null',null]] as const){if(text.slice(at,at+word.length)===word){at+=word.length;return meaning;}}
    const token=/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(text.slice(at));requireBoundary(token,'JSON_VALUE');at+=token[0].length;return token[0];
  };
  const result=value(0);ws();requireBoundary(at===text.length,'JSON_TRAILING_INPUT');return result;
}
