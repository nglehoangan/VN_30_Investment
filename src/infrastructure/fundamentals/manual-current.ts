import {readFile,realpath} from 'node:fs/promises';
import {resolve,relative,isAbsolute} from 'node:path';
import {createHash} from 'node:crypto';
import type {CurrentAnalysisSnapshot} from '@/domain/fundamentals/manual-first';
import {buildManualCurrentSnapshot} from '@/domain/fundamentals/manual-first';
import {canonicalJson} from '@/domain/fundamentals/snapshot';
import {requireFundamental} from '@/domain/fundamentals/validation';

const hash=(v:unknown)=>createHash('sha256').update(canonicalJson(v)).digest('hex');
/** Read-only research evidence, never a replacement for independently accepted DI inputs. */
export async function readManualCurrentSnapshot(root:string):Promise<CurrentAnalysisSnapshot|null>{
 let bytes:Buffer;
 try{bytes=await readFile(resolve(root,'data/manual-current/current-analysis.json'));}
 catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return null;throw e;}
 requireFundamental(bytes.length<32_000_000,'BOUNDED_MANUAL_SNAPSHOT');
 const s=JSON.parse(bytes.toString('utf8')) as CurrentAnalysisSnapshot;
 requireFundamental(s.contract==='manual-current-analysis-snapshot-v1'&&s.mode==='CURRENT_ANALYSIS','CURRENT_MANUAL_CONTRACT');
 for(const statement of s.statements){
  const target=await realpath(resolve(root,statement.retainedPath)),within=relative(await realpath(resolve(root,'data/manual-fundamentals')),target);
  requireFundamental(!within.startsWith('..')&&!isAbsolute(within),'MANUAL_RETAINED_PATH_BOUNDARY');
  const body=await readFile(target);
  requireFundamental(body.subarray(0,5).toString('ascii')==='%PDF-'&&createHash('sha256').update(body).digest('hex')===statement.SHA256,'MANUAL_CURRENT_SOURCE_INTEGRITY');
 }
 const rebuilt=buildManualCurrentSnapshot({snapshotId:s.snapshotId,analysisAt:s.analysisAt,statements:s.statements,facts:s.canonicalFacts.flatMap(c=>c.facts),universe:s.readiness.map(r=>({ticker:r.ticker,sector:r.sector})),referenceStatus:s.referenceStatus},hash);
 requireFundamental(canonicalJson(s)===canonicalJson(rebuilt),'MANUAL_CURRENT_REPLAY_INTEGRITY');
 return rebuilt;
}
