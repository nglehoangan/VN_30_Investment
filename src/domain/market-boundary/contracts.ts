/** Prospective contracts. Legacy fundamental/portfolio snapshot types keep their original semantics. */
export const AMENDMENT = 'di-market-boundary-v1' as const;
export const VERSIONS = {
  INITIALIZATION: 'initialization-manifest-v1', CAPABILITY: 'market-data-capability-v1',
  MARKET: 'market-snapshot-v1', ANALYSIS: 'analysis-snapshot-v1',
  PORTFOLIO: 'portfolio-snapshot-binding-v1', DECISION: 'decision-snapshot-v1',
} as const;
export type Kind = keyof typeof VERSIONS;
export type Digest = (value: unknown) => string;
export interface Pin { readonly id: string; readonly hash: string }
export interface Evidence extends Pin { readonly knownAt: string; readonly effectiveAt: string }
export interface Member { readonly securityId: string; readonly ticker: string; readonly exchange: string; readonly state: 'SCORABLE' | 'DEFERRED' }
export interface Exception extends Evidence { readonly securityId: string; readonly status: 'ACTIVE'; readonly classification: 'OWNER_ANALYTICAL_EXCEPTION'; readonly amountVnd: string }
export interface Initialization {
  readonly universe: Evidence; readonly members: readonly Member[];
  readonly securityMaster: Evidence; readonly sectorMaster: Evidence; readonly fundamentals: Evidence;
  readonly qualifications: Evidence; readonly dispositions: Evidence; readonly partition: Evidence;
  readonly exceptions: readonly Exception[]; readonly provenanceContract: Evidence;
  readonly capability: Pin; readonly dataClassPolicy: Evidence; readonly softwareVersion: string; readonly schemaVersion: string;
}
export interface Capability {
  readonly sourceContract: Evidence; readonly sourceId: string; readonly sourceSchema: string;
  readonly normalizerVersion: string; readonly identityVersion: string; readonly semanticsVersion: string;
  readonly corporateActionPolicy: Evidence; readonly freshnessPolicy: Evidence; readonly calendar: Evidence;
  readonly rawSamples: readonly RawSource[]; readonly normalizedSampleHash: string;
  readonly negativeValidation: Evidence; readonly missingBehavior: 'BLOCK'; readonly duplicateBehavior: 'BLOCK_CONFLICT';
}
export interface RawSource extends Pin {
  readonly sourceId: string; readonly request: Evidence; readonly rawPath: string;
  readonly retrievedAt: string; readonly providerAt: string | null; readonly schemaVersion: string;
  readonly origin: 'REAL_SOURCE' | 'SYNTHETIC_TEST';
}
export type Conflict = 'MATCH' | 'ROUNDING_ONLY' | 'TIMESTAMP_DIFFERENCE' | 'SESSION_DIFFERENCE' | 'ADJUSTMENT_DIFFERENCE' | 'SOURCE_CONFLICT' | 'UNKNOWN';
export interface Observation {
  readonly securityId: string; readonly ticker: string; readonly exchange: string;
  readonly value: string; readonly currency: 'VND'; readonly unit: 'VND_PER_SHARE';
  readonly field: 'CLOSE' | 'LAST' | 'REFERENCE'; readonly adjustment: 'RAW' | 'ADJUSTED';
  readonly corporateActions: Evidence; readonly tradingDate: string; readonly session: string;
  readonly observedAt: string; readonly availableAt: string; readonly source: Pin;
  readonly pointer: string; readonly conflict: Conflict;
}
export interface Market {
  readonly capability: Pin; readonly universe: Evidence; readonly requestedAsOf: string;
  readonly purpose: MarketPurpose; readonly acceptedTradingDate: string; readonly session: string;
  readonly observations: readonly Observation[]; readonly sources: readonly RawSource[];
  readonly normalizationVersion: string; readonly freshnessPolicy: Evidence; readonly calendar: Evidence;
}
export type MarketPurpose = 'VALUATION' | 'SCORING' | 'RANKING' | 'TOP10' | 'TECHNICAL' | 'MONEY_FLOW' | 'NEW_CAPITAL' | 'DCA' | 'EXECUTION' | 'PORTFOLIO_NAV';
export type Purpose = MarketPurpose | 'FUNDAMENTAL_DESCRIPTION';
export interface FreshnessProof {
  readonly status: 'PASS' | 'BLOCKED'; readonly reasons: readonly string[];
  readonly market: Pin | null; readonly at: string; readonly purpose: Purpose;
  readonly policy: Pin; readonly calendar: Pin; readonly coverageHash: string; readonly eligibleUntil: string | null;
}
export interface Analysis {
  readonly initialization: Pin; readonly fundamentals: Evidence; readonly universe: Evidence;
  readonly market: Pin | null; readonly marketRequirement: 'REQUIRED' | 'MARKET_DATA_NOT_REQUIRED';
  readonly purpose: Purpose; readonly analysisTimestamp: string; readonly members: readonly Member[];
  readonly exceptions: readonly Exception[]; readonly sourceHashes: readonly Pin[]; readonly inputArtifacts: readonly Pin[];
  readonly freshness: FreshnessProof; readonly policy: Evidence; readonly scoringModel: Evidence;
  readonly engineVersion: string; readonly prerequisiteProof: Evidence;
}
export interface PortfolioBinding {
  readonly portfolioSnapshotId: string; readonly portfolioAsOf: string; readonly ledgerWatermark: string;
  readonly cash: string; readonly positionsHash: string; readonly costBasisHash: string;
  readonly pendingTransactionsHash: string; readonly navInputs: readonly Pin[]; readonly accountingVersion: string;
}
export interface DecisionBinding {
  readonly decisionId: string; readonly decisionTimestamp: string; readonly securityId: string;
  readonly universe: Evidence; readonly initialization: Pin; readonly fundamentals: Evidence;
  readonly market: Pin; readonly analysis: Pin; readonly portfolio: Pin;
  readonly policy: Evidence; readonly scoringModel: Evidence; readonly engineVersion: string;
  readonly sourceHashes: readonly Pin[]; readonly freshness: FreshnessProof;
  readonly disposition: Evidence; readonly exceptions: readonly Exception[];
  readonly decisionState: string; readonly eligibilityProof: Evidence; readonly executionEligibility: 'PASS' | 'BLOCKED';
  readonly dependenciesHash: string;
}
export interface Bodies { INITIALIZATION: Initialization; CAPABILITY: Capability; MARKET: Market; ANALYSIS: Analysis; PORTFOLIO: PortfolioBinding; DECISION: DecisionBinding }
export type Sealed<K extends Kind = Kind> = K extends Kind ? {
  readonly id: string; readonly kind: K; readonly contractVersion: typeof VERSIONS[K]; readonly amendment: typeof AMENDMENT;
  readonly createdAt: string; readonly knownAt: string; readonly body: Bodies[K]; readonly contentHash: string;
} : never;
/** Approved explicit session windows, not a guessed N-calendar-day age. A holiday window may require the preceding trading session. */
export interface SessionPolicy extends Evidence {
  readonly timezone: 'Asia/Ho_Chi_Minh'; readonly calendar: Evidence;
  readonly purposes: readonly MarketPurpose[]; readonly field: Observation['field']; readonly adjustment: Observation['adjustment'];
  readonly windows: readonly { readonly from: string; readonly through: string; readonly tradingDate: string; readonly session: string; readonly observationCutoff: string }[];
}
export interface Consumption {
  readonly mode: 'LIVE' | 'HISTORICAL'; readonly requestedAt: string; readonly knownAt: string; readonly now: string;
  readonly purpose: Purpose; readonly securityIds: readonly string[]; readonly universe: Evidence;
}
export interface Readiness { readonly initialized: boolean; readonly marketCapability: boolean; readonly marketCurrent: boolean; readonly analysisReady: boolean; readonly decisionReady: boolean }
