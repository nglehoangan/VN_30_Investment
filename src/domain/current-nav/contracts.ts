import type { PortfolioState } from "@/domain/portfolio/reconstruct";
export const NAV_VERSION = "current-nav-result-v1" as const;
export const NAV_PROFILE = "NAV_ECONOMIC_POINT_V1" as const;
export const NAV_CALCULATION = "current-nav-decimal12-v1" as const;
export type NavDigest = (value: unknown) => string;
export type NavOrigin = "SYNTHETIC_TEST" | "RETAINED_RESEARCH";
export interface CurrentNavRequestV1 {
  readonly version: "current-nav-request-v1"; readonly portfolioId: string;
  readonly purpose: "PORTFOLIO_NAV"; readonly valuationMode: "LATEST_COMPLETED_EOD";
  readonly knowledgeMode: "RETROSPECTIVE"; readonly requestedAt: string; readonly knowledgeCutoff: string;
  readonly resultScope: "QUALIFIED_ONLY" | "OBSERVED_FULL_PORTFOLIO";
  readonly allowIndicative: boolean; readonly includeSecuritiesSubtotal: boolean; readonly ledgerRevision: string;
}
export interface NavEvidenceRefV1 { readonly reference: string; readonly sha256: string; readonly pointer: string; readonly knownAt: string }
export type CompletenessState = "COMPLETE" | "COMPLETE_WITH_LIMITATIONS" | "PARTIAL" | "BLOCKED" | "UNKNOWN";
export const NAV_DIMENSIONS = ["ledgerReplay", "transactions", "cash", "receivables", "liabilities", "securitiesQuantity", "tradingAvailability", "costBasis", "sourceIdentity", "independentValidation"] as const;
export type NavDimension = typeof NAV_DIMENSIONS[number];
export interface NavDimensionAssessment { readonly state: CompletenessState; readonly evidence: readonly NavEvidenceRefV1[]; readonly limitations: readonly string[] }
export interface CurrentNavComponentV1 {
  readonly version: "current-nav-component-v1"; readonly kind: "CASH" | "RECEIVABLES" | "LIABILITIES";
  readonly amount: string | null; readonly currency: "VND"; readonly economicAt: string;
  readonly evidence: readonly NavEvidenceRefV1[]; readonly complete: boolean;
}
export interface NavIdentityV1 {
  readonly marketNamespace: string; readonly marketSecurityId: string; readonly providerInstrumentCode: string;
  readonly isin: string | null; readonly alternateIdentityReference: string | null;
  readonly exchange: "HOSE"; readonly securityClass: "COMMON_SHARE";
  readonly evidence: readonly NavEvidenceRefV1[];
}
export interface NavEconomicUnitV1 {
  readonly unitId: string; readonly kind: "ORDINARY" | "TRADE_UNSETTLED_ORDINARY" | "CORPORATE_ACTION_PENDING_RIGHT";
  readonly quantity: string; readonly identity: NavIdentityV1 | null;
  readonly corporateActionHash: string; readonly corporateActionStatus: "CLEAR" | "UNCERTAIN";
  readonly eligibility: "ELIGIBLE" | "UNKNOWN" | "UNSUPPORTED";
}
export interface NavPositionV1 { readonly securityId: string; readonly economicAt: string; readonly units: readonly NavEconomicUnitV1[] }
export interface CurrentNavPriceV1 {
  readonly id: string; readonly securityId: string; readonly unitId: string; readonly identity: NavIdentityV1;
  readonly value: string; readonly currency: "VND"; readonly unit: "VND_PER_SHARE"; readonly multiplier: "1";
  readonly adjustment: "RAW"; readonly corporateActionHash: string;
  readonly priceKind: "OFFICIAL_CLOSE" | "PROVIDER_EOD_CLOSE" | "CURRENT_TRADE" | "LAST_AVAILABLE_CLOSE" | "HISTORICAL_CLOSE" | "UNQUALIFIED_INDICATIVE";
  readonly tradingDate: string; readonly sessionId: string; readonly calendarHash: string; readonly policyHash: string;
  readonly normalizedAt: string; readonly providerAt: string | null; readonly timestampOrigin: "PROVIDER_TIMESTAMP" | "NORMALIZED_SESSION_BOUNDARY";
  readonly retrievedAt: string; readonly knownAt: string; readonly validUntil: string;
  readonly revision: string; readonly source: NavEvidenceRefV1; readonly revokedAt: string | null;
}
export interface CurrentNavPlanV1 {
  readonly version: "current-nav-plan-v1"; readonly portfolioId: string; readonly perimeterId: string;
  readonly ledgerRevision: string; readonly valuationAt: string;
  readonly accountingImplementation: string; readonly valuationMethodologyId: string;
  readonly profile: typeof NAV_PROFILE; readonly evidenceHead: string;
  readonly session: {
    readonly tradingDate: string; readonly latestCompletedTradingDate: string; readonly id: string; readonly completedAt: string; readonly nextCompletedAt: string;
    readonly timezone: "Asia/Ho_Chi_Minh"; readonly calendarFrom: string; readonly calendarThrough: string;
    readonly calendar: NavEvidenceRefV1; readonly policy: NavEvidenceRefV1;
    readonly purposes: readonly string[]; readonly allowedPriceKinds: readonly CurrentNavPriceV1["priceKind"][];
    readonly allowNormalizedBoundary: boolean; readonly noHeldMarketNotRequired: boolean;
  };
  readonly components: readonly CurrentNavComponentV1[];
  readonly positions: readonly NavPositionV1[]; readonly prices: readonly CurrentNavPriceV1[];
  readonly sourcePins: readonly { readonly reference: string; readonly sha256: string }[];
  readonly completeness: Readonly<Record<NavDimension, NavDimensionAssessment>>;
  readonly basisEconomicImpact: "NONE" | "UNCERTAIN";
  readonly legacyReconciliation: { readonly status: string; readonly actionabilityBlocked: boolean };
  readonly unresolvedEconomicConflicts: readonly string[];
}
export type NavAuthorityKind = "NAV_PROFILE" | "METHODOLOGY" | "ACCOUNTING_SCOPE" | "CALENDAR_POLICY" | "IDENTITY" | "PRICE_SOURCE" | "INDEPENDENT_NAV_ACCEPTANCE" | "OWNER_NAV_SCOPE";
export interface NavAuthorityRequirementV1 { readonly kind: NavAuthorityKind; readonly subjectHash: string; readonly portfolioId: string; readonly purpose: "PORTFOLIO_NAV"; readonly valuationAt: string; readonly knowledgeCutoff: string; readonly calculatedAt: string }
export interface NavAuthorityProofV1 {
  readonly kind: NavAuthorityKind; readonly subjectHash: string; readonly portfolioId: string; readonly purpose: "PORTFOLIO_NAV";
  readonly origin: NavOrigin; readonly reference: string; readonly producer: string; readonly validator: string;
  readonly knownAt: string; readonly effectiveFrom: string; readonly effectiveUntil: string | null;
  readonly expiresAt: string | null; readonly revokedAt: string | null;
}
/** Trusted injected reader of already authenticated evidence, not a serializable acceptance flag.
 * No real authority reader or operational composition is implemented in Phase 3.2. */
export interface NavQualificationAuthorityV1 { verify(requirement: NavAuthorityRequirementV1): NavAuthorityProofV1 | null }
export interface NavQualificationAssessmentV1 {
  readonly version: "nav-qualification-assessment-v1"; readonly profile: typeof NAV_PROFILE;
  readonly economicReasons: readonly string[]; readonly authorityReasons: readonly string[];
  readonly dimensions: CurrentNavPlanV1["completeness"] | null;
  readonly authorityProofs: readonly NavAuthorityProofV1[];
  readonly qualified: boolean; readonly completeObservedPerimeter: boolean;
}
export interface CurrentNavEvidenceManifestV1 {
  readonly version: "current-nav-evidence-manifest-v1"; readonly calculationVersion: typeof NAV_CALCULATION;
  readonly origin: NavOrigin; readonly portfolioId: string; readonly ledgerRevision: string; readonly ledgerStateHash: string | null;
  readonly valuationAt: string | null; readonly knowledgeCutoff: string; readonly inputHash: string;
  readonly input: unknown; readonly qualification: NavQualificationAssessmentV1;
  readonly blockingReasons: readonly string[]; readonly resultHash: string;
}
export interface CurrentNavResultV1 {
  readonly version: typeof NAV_VERSION; readonly origin: NavOrigin; readonly portfolioId: string;
  readonly valuationAt: string | null; readonly requestedAt: string; readonly calculatedAt: string; readonly knowledgeCutoff: string;
  readonly navState: "QUALIFIED_NAV" | "INDICATIVE_NAV" | "NAV_BLOCKED";
  readonly totalNav: string | null; readonly indicativeValue: string | null;
  readonly cash: string | null; readonly securitiesMarketValue: string | null; readonly receivables: string | null; readonly liabilities: string | null;
  readonly securitiesSubtotal: { readonly label: "SECURITIES_SUBTOTAL — NOT NAV"; readonly value: string; readonly includedUnits: readonly string[]; readonly excludedUnits: readonly string[] } | null;
  readonly ledgerRevision: string; readonly accountingMethod: string; readonly calculationVersion: typeof NAV_CALCULATION;
  readonly qualification: NavQualificationAssessmentV1; readonly blockingReasons: readonly string[]; readonly limitations: readonly string[];
  readonly legacyReconciliation: CurrentNavPlanV1["legacyReconciliation"] | null;
  readonly manifest: CurrentNavEvidenceManifestV1; readonly runHash: string;
  readonly nonpositiveNav: boolean;
  readonly productionAuthorized: false; readonly officialUseEligible: false; readonly performanceAuthorized: false;
  readonly riskAuthorized: false; readonly investmentActionabilityAuthorized: false; readonly scoringAuthorized: false;
  readonly representsCurrentAccountNow: false; readonly snapshotPersisted: false;
}
export interface NavCalculationContextV1 { readonly calculatedAt: string; readonly origin: NavOrigin; readonly hash: NavDigest; readonly ledgerFactsHash?: string; readonly authority?: NavQualificationAuthorityV1 }
export interface NavCalculationInputV1 { readonly request: CurrentNavRequestV1; readonly state: PortfolioState; readonly plan: CurrentNavPlanV1 }
