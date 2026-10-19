import type { Consumption, Digest, Evidence, Kind, Pin, Sealed, SessionPolicy } from '@/domain/market-boundary/contracts';
export interface BoundaryStore {
  append(record: Sealed): Promise<void>;
  find<K extends Kind>(pin: Pin, kind: K): Promise<Sealed<K>>;
  /** One DB transaction: verify current dependency pin, append envelope+binding, commit before returning. */
  sealRanking(record: RankingPublication, expected: Pin): Promise<void>;
  sealDecision(record: Sealed<'DECISION'>, expected: Pin): Promise<void>;
}
/** Trusted adapter validates pinned approvals, actual retained bytes and deterministic raw normalization.
 * No request-supplied PASS booleans. Unknown/missing approval or proof throws. */
export interface BoundaryAuthority {
  readonly hash: Digest;
  approve(evidence: Evidence, knownAt: string): Promise<void>;
  replayCapability(record: Sealed<'CAPABILITY'>): Promise<void>;
  marketCurrent(record: Sealed<'MARKET'>, request: Consumption): Promise<void>;
  replayMarket(record: Sealed<'MARKET'>): Promise<void>;
  resolvePolicy(pin: Evidence, knownAt: string): Promise<SessionPolicy>;
  initializationCurrent(record: Sealed<'INITIALIZATION'>, request: Consumption): Promise<void>;
  portfolioCurrent(record: Sealed<'PORTFOLIO'>, at: string): Promise<void>;
  prerequisite(proof: Evidence, request: Consumption): Promise<void>;
  currentDependencies(): Promise<Pin>;
}
export interface RankingPublication {
  readonly id: string; readonly contractVersion: 'policy-b-ranking-publication-v1'; readonly analysis: Pin; readonly initialization: Pin;
  readonly dependenciesHash: string; readonly createdAt: string; readonly freshness: import('@/domain/market-boundary/contracts').FreshnessProof;
  readonly output: ReturnType<typeof import('@/domain/ranking/rank').rankPolicyB>; readonly contentHash: string;
}
