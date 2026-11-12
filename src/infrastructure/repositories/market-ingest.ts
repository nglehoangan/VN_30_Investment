import type { PrismaClient } from '@/infrastructure/db/generated/client';
import type { BoundaryStore } from '@/ports/market-boundary';
import type { RawSource, Sealed } from '@/domain/market-boundary/contracts';
import { canonicalJson } from '@/domain/fundamentals/snapshot';
import { readSealed, requireBoundary, reference } from '@/domain/market-boundary/validation';
import { instant } from '@/shared/time';
import { snapshotHash as hash } from '@/infrastructure/fundamentals/snapshot-hash';
import { createHash } from 'node:crypto';
export interface MarketIngestItem {
 identityKey:string; capability:Sealed<'CAPABILITY'>; market:Sealed<'MARKET'>; provenance:unknown;
}
export interface MarketRaw {hash:string;provider:string;path:string;text:string}
type Db = Pick<PrismaClient,'$queryRawUnsafe'|'$executeRawUnsafe'>;
const h=(text:string)=>createHash('sha256').update(text).digest('hex');
export async function immutableMarketRaw(db:Db,raw:MarketRaw) {
 requireBoundary(h(raw.text)===raw.hash,'INGEST_RAW_HASH');
 const rows=await db.$queryRawUnsafe<{provider:string;original_path:string;raw_text:string}[]>('SELECT provider, original_path, raw_text FROM market_boundary_ingest_raw WHERE raw_hash=?',raw.hash);
 if(rows.length)requireBoundary(rows[0].provider===raw.provider&&rows[0].original_path===raw.path&&rows[0].raw_text===raw.text,'RAW_HASH_IDENTITY_CONFLICT');
 else await db.$executeRawUnsafe('INSERT INTO market_boundary_ingest_raw(raw_hash,provider,original_path,raw_text) VALUES(?,?,?,?)',raw.hash,raw.provider,raw.path,raw.text);
}
export function marketSemantic(item:MarketIngestItem) {
 const m=item.market.body,o=m.observations[0];
 return hash({securityId:o.securityId,ticker:o.ticker,exchange:o.exchange,value:o.value,unit:o.unit,currency:o.currency,field:o.field,adjustment:o.adjustment,date:o.tradingDate,session:o.session,observedAt:o.observedAt,normalization:m.normalizationVersion,policy:m.freshnessPolicy.id});
}
export async function rawFromMarketStore(db:Db,source:RawSource):Promise<Uint8Array> {
 const rows=await db.$queryRawUnsafe<{provider:string;original_path:string;raw_text:string}[]>('SELECT provider,original_path,raw_text FROM market_boundary_ingest_raw WHERE raw_hash=?',source.hash);
 requireBoundary(rows.length===1&&rows[0].provider===source.sourceId&&rows[0].original_path===source.rawPath&&h(rows[0].raw_text)===source.hash,'IMMUTABLE_MARKET_RAW_NOT_AVAILABLE');return Buffer.from(rows[0].raw_text,'utf8');
}
export async function commitMarketBatch(db:PrismaClient,runId:string,raw:MarketRaw,items:readonly MarketIngestItem[],validate:(store:BoundaryStore,reader:(source:RawSource)=>Promise<Uint8Array>,item:MarketIngestItem)=>Promise<void>) {
 requireBoundary(runId.trim()&&items.length>0&&new Set(items.map(i=>i.identityKey)).size===items.length,'INGEST_BATCH_IDENTITY');
 return db.$transaction(async tx=>{
  const accepted:string[]=[],duplicates:string[]=[];
  // Minimal transaction-scoped view of the existing boundary record table/lifecycle.
  const store:BoundaryStore={
   append:async record=>{
    requireBoundary(record.kind==='CAPABILITY'||record.kind==='MARKET','INGEST_RECORD_SCOPE');const r=readSealed(record,record.kind,hash),body=canonicalJson(r);
    const old=await tx.marketBoundaryRecord.findUnique({where:{id:r.id}});
    if(old)requireBoundary(old.bodyHash===r.contentHash&&old.body===body,'IMMUTABLE_RECORD_CONFLICT');
    else await tx.marketBoundaryRecord.create({data:{id:r.id,kind:r.kind,contractVersion:r.contractVersion,createdAt:r.createdAt,body,bodyHash:r.contentHash}});
   },
   find:async(pin,kind)=>{
    const row=await tx.marketBoundaryRecord.findUnique({where:{id:pin.id}});requireBoundary(row&&row.kind===kind&&row.bodyHash===pin.hash,'PINNED_SNAPSHOT_REQUIRED');
    const value=readSealed(JSON.parse(row.body),kind,hash);requireBoundary(value.id===row.id&&canonicalJson(value)===row.body,'SNAPSHOT_INDEX_BINDING');return value;
   },
   sealDecision:async()=>{throw Error('INGEST_CANNOT_SEAL_DECISIONS');},sealRanking:async()=>{throw Error('INGEST_CANNOT_PUBLISH_RANKING');},
  };
  for(const item of items){
   const m=readSealed(item.market,'MARKET',hash),c=readSealed(item.capability,'CAPABILITY',hash);
   requireBoundary(m.body.observations.length===1&&m.body.sources.length===1&&m.body.sources[0].hash===raw.hash&&m.body.sources[0].rawPath===raw.path&&m.body.sources[0].sourceId===raw.provider&&m.body.capability.id===c.id&&m.body.capability.hash===c.contentHash,'RAW_NORMALIZED_LINK_SCOPE');
   const existing=await tx.$queryRawUnsafe<{semantic_hash:string;market_id:string;raw_hash:string;request_hash:string;revoked:bigint}[]>('SELECT semantic_hash,market_id,raw_hash,request_hash,EXISTS(SELECT 1 FROM market_boundary_ingest_revocation r WHERE r.identity_key=market_boundary_ingest_link.identity_key) AS revoked FROM market_boundary_ingest_link WHERE identity_key=?',item.identityKey);
   if(existing.length){
    requireBoundary(Number(existing[0].revoked)===0,'OBSERVATION_REVOKED_REQUALIFICATION_REQUIRED');
    requireBoundary(existing[0].semantic_hash===marketSemantic(item),'DUPLICATE_OBSERVATION_CONFLICT');
    if(existing[0].raw_hash!==raw.hash||existing[0].request_hash!==m.body.sources[0].request.hash){
     await immutableMarketRaw(tx,raw);
     // Run the actual lifecycle against an ephemeral overlay: no duplicate active record.
     const staged=new Map<string,Sealed>();
     const overlay:BoundaryStore={...store,append:async r=>{requireBoundary(r.kind==='CAPABILITY'||r.kind==='MARKET','INGEST_RECORD_SCOPE');staged.set(r.id,readSealed(r,r.kind,hash));},find:async(pin,kind)=>{const r=staged.get(pin.id);if(!r)return store.find(pin,kind);requireBoundary(r.contentHash===pin.hash,'PINNED_SNAPSHOT_REQUIRED');return readSealed(r,kind,hash);}};
     await validate(overlay,s=>rawFromMarketStore(tx,s),item);
     const id=hash({market:existing[0].market_id,raw:raw.hash,request:m.body.sources[0].request.hash});
     const evidence=canonicalJson({role:'CORROBORATING_DUPLICATE_NOT_SOURCE_REWRITE',provenance:item.provenance});
     await tx.$executeRawUnsafe('INSERT OR IGNORE INTO market_boundary_ingest_receipt(id,market_id,raw_hash,request_hash,provenance) VALUES(?,?,?,?,?)',id,existing[0].market_id,raw.hash,m.body.sources[0].request.hash,evidence);
    }
    duplicates.push(existing[0].market_id);continue;
   }
   await immutableMarketRaw(tx,raw);
   await validate(store,source=>rawFromMarketStore(tx,source),item);
   // No raw/link/capability/market from a failed batch survives this transaction.
   const stored=await store.find(reference(m),'MARKET');requireBoundary(stored.contentHash===m.contentHash,'ACCEPTED_MARKET_RECORD_REQUIRED');
   await tx.$executeRawUnsafe('INSERT INTO market_boundary_ingest_link(identity_key,run_id,semantic_hash,capability_id,market_id,raw_hash,request_hash,provenance) VALUES(?,?,?,?,?,?,?,?)',item.identityKey,runId,marketSemantic(item),c.id,m.id,raw.hash,m.body.sources[0].request.hash,canonicalJson(item.provenance));accepted.push(m.id);
  }
  return {accepted,duplicates};
 },{timeout:60000});
}
export async function quarantineMarket(db:PrismaClient,raw:MarketRaw,reason:string,context:unknown) {
 const body=canonicalJson({reason,context,rawHash:raw.hash}),id=hash(body);
 await db.$transaction(async tx=>{await immutableMarketRaw(tx,raw);const rows=await tx.$queryRawUnsafe<{body:string}[]>('SELECT body FROM market_boundary_ingest_quarantine WHERE id=?',id);if(rows.length)requireBoundary(rows[0].body===body,'QUARANTINE_CONFLICT');else await tx.$executeRawUnsafe('INSERT INTO market_boundary_ingest_quarantine(id,raw_hash,reason,body) VALUES(?,?,?,?)',id,raw.hash,reason,body);});return id;
}
export async function revokeMarketRun(db:PrismaClient,runId:string,at:string,reason:string) {
 instant(at);requireBoundary(runId.trim()&&reason.trim(),'REVOCATION_REASON_REQUIRED');
 return db.$transaction(async tx=>{
  const rows=await tx.$queryRawUnsafe<{identity_key:string}[]>('SELECT identity_key FROM market_boundary_ingest_link WHERE run_id=?',runId);let count=0;
  for(const r of rows){count+=await tx.$executeRawUnsafe('INSERT OR IGNORE INTO market_boundary_ingest_revocation(identity_key,revoked_at,reason) VALUES(?,?,?)',r.identity_key,at,reason);}return count;
 });
}
export async function isMarketRevoked(db:Db,identityKey:string){return (await db.$queryRawUnsafe<unknown[]>('SELECT identity_key FROM market_boundary_ingest_revocation WHERE identity_key=?',identityKey)).length>0;}

export async function marketIngestBinding(db:Db,identityKey:string) {
 const rows=await db.$queryRawUnsafe<{market_id:string;raw_hash:string;revoked:bigint}[]>('SELECT l.market_id,l.raw_hash, EXISTS(SELECT 1 FROM market_boundary_ingest_revocation r WHERE r.identity_key=l.identity_key) AS revoked FROM market_boundary_ingest_link l WHERE l.identity_key=?',identityKey);
 return rows.length===1?{marketId:rows[0].market_id,rawHash:rows[0].raw_hash,revoked:Number(rows[0].revoked)!==0}:null;
}
