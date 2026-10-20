import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { boundaryCandidateReadiness } from '@/domain/market-boundary/readiness';
import { marketFreshness } from '@/domain/market-boundary/freshness';
import { replayTcbsPipeline, type TcbsPipelineCandidate } from './tcbs-pipeline';
import { snapshotHash } from '@/infrastructure/fundamentals/snapshot-hash';
import { requireBoundary } from '@/domain/market-boundary/validation';
export interface TcbsCandidateBinding {readonly version:'tcbs-active-candidate-v1';readonly path:string;readonly sha256:string;readonly independentAcceptance:'PENDING_INDEPENDENT_REVIEW'}
/** Replay actual bytes on read. No HTTP refresh, latest-pointer selection, acceptance or accounting mutation. */
export function readTcbsCandidateStatus(root:string,now:string,binding?:TcbsCandidateBinding|null){
 try{
  requireBoundary(binding!==null,'TCBS_CANDIDATE_DISABLED');
  binding=binding??JSON.parse(readFileSync(resolve(root,'data/market-boundary/active-candidate.json'),'utf8')) as TcbsCandidateBinding;
  requireBoundary(binding.version==='tcbs-active-candidate-v1'&&/^data\/market-boundary\/candidates\/[a-f0-9]{64}\/candidate\.json$/.test(binding.path),'CANDIDATE_BINDING_PATH');
  const candidate=JSON.parse(readFileSync(resolve(root,binding.path),'utf8')) as TcbsPipelineCandidate;
  requireBoundary(snapshotHash(candidate)===binding.sha256,'CANDIDATE_BINDING_CHECKSUM');
  replayTcbsPipeline(root,candidate);
  const proof=marketFreshness(candidate.market,candidate.capability,candidate.policy,{mode:'LIVE',now,requestedAt:now,knownAt:now,purpose:'VALUATION',securityIds:candidate.market.body.observations.map(o=>o.securityId),universe:candidate.initialization.body.universe},snapshotHash);
  return {...boundaryCandidateReadiness(true,candidate.initializationCandidate==='PASS_CANDIDATE',true),
   marketCapabilityAcceptance:'PENDING_INDEPENDENT_REVIEW',capabilityScope:'VN30_LATEST_COMPLETED_EOD_VALUATION',candidateId:candidate.initialization.id,candidateBuiltAt:candidate.input.builtAt,
   marketSnapshotCandidate:proof.status,marketSnapshotCandidateAsOf:candidate.profile.tradingDate,marketSnapshotCandidateReasons:proof.reasons,
   fullUniverseCount:30,fundamentallyEligibleCount:29,deferredTickers:['MBB'],tcxException:'ACTIVE',
   reasons:['INDEPENDENT_DI14_APPROVAL_REQUIRED','CURRENT_ACCEPTED_MARKET_SNAPSHOT_NOT_AVAILABLE']};
 }catch{
  return {...boundaryCandidateReadiness(false),marketCapabilityAcceptance:'NOT_ACCEPTED',marketSnapshotCandidate:'BLOCKED',
   reasons:['MARKET_CAPABILITY_REPLAY_NOT_QUALIFIED','CURRENT_MARKET_SNAPSHOT_NOT_AVAILABLE']};
 }
}
