import 'server-only';
import { BoundaryLifecycle } from '@/application/market-boundary/lifecycle';
import type { BoundaryStore } from '@/ports/market-boundary';
import type { RawSource } from '@/domain/market-boundary/contracts';
import { systemClock } from '@/infrastructure/runtime';
import type { Clock } from '@/ports/runtime';
import { cafefAuthority } from '@/infrastructure/market-boundary/cafef-standing';
import type { Candidate, StandingTrust, StandingProfile, IngestSpec } from '@/infrastructure/market-boundary/cafef-standing';
import { assertStandingTrust, cafefIngestIdentity, buildCafefCandidate, retained } from '@/infrastructure/market-boundary/cafef-standing';
import { requireBoundary } from '@/domain/market-boundary/validation';
import type { PrismaBoundaryStore } from '@/infrastructure/repositories/market-boundary';
import type { MarketIngestItem } from '@/infrastructure/repositories/market-ingest';
export const ingestIdentity=cafefIngestIdentity;
export function ingestItem(c:Candidate):MarketIngestItem {return {identityKey:ingestIdentity(c),capability:c.capability,market:c.market,provenance:c.provenance};}
/** No policy/code trust is accepted from a submitted candidate or PASS flag. */
export async function ingestCafef(root:string,repo:PrismaBoundaryStore,runId:string,candidates:readonly Candidate[],trust:StandingTrust) {
 requireBoundary(candidates.length>0,'EMPTY_INGEST_BATCH');const raw=candidates[0];
 for(const c of candidates){requireBoundary(c.spec.raw.sha256===raw.spec.raw.sha256&&c.spec.raw.path===raw.spec.raw.path,'ATOMIC_BATCH_REQUIRES_SAME_RAW');assertStandingTrust(root,c,trust);}
 const map=new Map(candidates.map(c=>[c.market.id,c]));
 return repo.commitMarketIngest(runId,{hash:raw.spec.raw.sha256,provider:'CAFEF_PRICE_HISTORY',path:raw.spec.raw.path,text:raw.rawText},candidates.map(c=>({...ingestItem(c),provenance:{...c.provenance,captureAdmission:trust.capturedSource(c.spec.raw,c.market.body.sources[0].request.hash),standingAuthority:trust.standingAuthority?.()??null}})),async(store,reader,item)=>{
  const c=map.get(item.market.id)!;await validateCafefLifecycle(root,c,trust,store,reader);
 });
}

/** Raw entrypoint: transformation is part of ingestion, never an optional later mapper.
 * Hash-unavailable evidence cannot be stored under a falsely claimed hash.
 * Verified raw with failed qualification is immutable quarantine, not accepted market data. */
export async function ingestRetainedCafef(root:string,repo:PrismaBoundaryStore,runId:string,profile:StandingProfile,specs:readonly IngestSpec[],trust:StandingTrust) {
 requireBoundary(specs.length>0,'EMPTY_INGEST_BATCH');
 const first=specs[0],bytes=retained(root,first.raw),text=bytes.toString('utf8');
 try {
  requireBoundary(specs.every(s=>s.raw.path===first.raw.path&&s.raw.sha256===first.raw.sha256),'ATOMIC_BATCH_REQUIRES_SAME_RAW');
  const candidates=specs.map(spec=>buildCafefCandidate(root,profile,spec));
  const result=await ingestCafef(root,repo,runId,candidates,trust);return {status:'ACCEPTED_OR_IDEMPOTENT' as const,...result};
 } catch(error) {
  const reason=error instanceof Error?error.message:'UNKNOWN_INGEST_FAILURE';
  const quarantineId=await repo.quarantineMarket({hash:first.raw.sha256,provider:'CAFEF_PRICE_HISTORY',path:first.raw.path,text},reason,{runId,specs});
  return {status:'QUARANTINED' as const,accepted:[] as string[],duplicates:[] as string[],reason,quarantineId};
 }
}

export async function validateCafefLifecycle(root:string,c:Candidate,trust:StandingTrust,store:BoundaryStore,reader?:(source:RawSource)=>Promise<Uint8Array>,clock:Clock=systemClock) {
 requireBoundary(c.spec.knownAt<=clock.now(),'FUTURE_INGESTION_KNOWLEDGE');
 const authority=await cafefAuthority(root,c,trust,reader);
 const lifecycle=new BoundaryLifecycle(store,authority,clock);await lifecycle.qualifyCapability(c.capability);await lifecycle.acceptMarket(c.market);return {authority,lifecycle};
}
