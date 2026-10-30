import {it} from 'vitest';
import inventory from './historical-replay-inventory.json';
/** Explicit archival cases only. Strict mode executes original assertions and exposes missing prerequisites. */
export function historicalReplay(id:string,title:string,run:()=>unknown){
 const item=inventory.records.find(r=>r.id===id);
 if(!item||item.title!==title)throw Error('UNCLASSIFIED_HISTORICAL_REPLAY:'+id);
 const strict=process.env.VN30_REQUIRE_ARCHIVAL_REPLAY==='1';
 return it.skipIf(!strict)(`[${id} ${strict?'ARCHIVAL_REPLAY':'ARCHIVAL_NOT_EXECUTED'}] ${title}`,run);
}
