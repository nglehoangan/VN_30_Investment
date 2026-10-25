/** Offline proposals only. None of these DTOs is an accepted market/portfolio snapshot. */
export type Digest = (canonicalText: string) => string;
export interface EvidenceRef { readonly reference:string; readonly sha256:string; readonly pointer:string; readonly knownAt:string }
export type Venue = 'HOSE'|'HNX'|'UPCOM';
export type SecurityClass = 'COMMON_SHARE'|'PREFERRED_SHARE'|'FUND_UNIT';
export interface AlternateIdentity {
 readonly kind:'STABLE_PROVIDER_CODE_VENUE_CLASS_AND_CONTINUITY';
 readonly providerInstrumentCode:string; readonly venue:Venue; readonly securityClass:SecurityClass;
 readonly continuity:readonly EvidenceRef[];
}
export interface BridgeRow {
 readonly id:string; readonly ledgerNamespace:string; readonly ledgerSecurityId:string;
 readonly marketNamespace:string; readonly marketSecurityId:string; readonly provider:'TCBS';
 readonly providerInstrumentCode:string; readonly isin:string|null; readonly alternate:AlternateIdentity|null;
 readonly venue:Venue; readonly securityClass:SecurityClass; readonly ticker:string;
 readonly validFrom:string; readonly validTo:string|null; readonly knownFrom:string; readonly knownTo:string|null; readonly recordedAt:string;
 readonly relationship:'SAME_ECONOMIC_INSTRUMENT'; readonly corporateActionStatus:'CLEAR'|'UNCERTAIN';
 readonly ledgerAnchor:EvidenceRef; readonly marketAnchor:EvidenceRef; readonly intervalEvidence:EvidenceRef; readonly corporateActionEvidence:EvidenceRef;
}
export interface BridgePayload { readonly contractVersion:'nav-security-identity-bridge-v1'; readonly mode:'OFFLINE_PREPARATION'; readonly portfolioId:string; readonly createdAt:string; readonly rows:readonly BridgeRow[] }
export interface Bridge extends BridgePayload { readonly contentHash:string }
export interface IdentityRequest { readonly portfolioId:string; readonly ledgerNamespace:string; readonly ledgerSecurityId:string; readonly marketNamespace:string; readonly provider:'TCBS'; readonly venue:Venue; readonly securityClass:SecurityClass; readonly tradingDate:string; readonly knowledgeCutoff:string; readonly now:string }
export interface SessionProof {
 readonly status:'CANDIDATE'; readonly tradingDate:string; readonly completedAt:string; readonly eligibleFrom:string; readonly eligibleThrough:string; readonly nextCompletedAt:string;
 readonly calendarFrom:string; readonly calendarThrough:string; readonly timezone:'Asia/Ho_Chi_Minh';
 readonly purpose:'PORTFOLIO_NAV'; readonly field:'CLOSE'; readonly adjustment:'RAW'; readonly calendar:EvidenceRef; readonly policy:EvidenceRef;
}
export interface PriceBinding {
 readonly ledgerSecurityId:string; readonly bridgeRowId:string; readonly marketSecurityId:string; readonly providerInstrumentCode:string; readonly isin:string|null;
 readonly venue:Venue; readonly securityClass:SecurityClass; readonly quantity:string; readonly price:string; readonly currency:'VND'; readonly unit:'VND_PER_SHARE'; readonly multiplier:'1';
 readonly tradingDate:string; readonly observedAt:string; readonly receivedAt:string; readonly validThrough:string; readonly source:EvidenceRef;
}
export interface NavPayload {
 readonly contractVersion:'nav-source-preparation-v1'; readonly mode:'OFFLINE_PREPARATION'; readonly origin:'SYNTHETIC_TEST'|'RETAINED_PREPARATION'; readonly purpose:'PORTFOLIO_NAV';
 readonly sourceId:'TCBS_OPENAPI_EOD'; readonly sourceSchema:'tcbs-bars-long-term-v1'; readonly normalizerVersion:'tcbs-latest-eod-close-v1';
 readonly portfolioId:string; readonly ledgerNamespace:string; readonly marketNamespace:string; readonly ledgerWatermark:string; readonly ledgerStateHash:string;
 readonly bridgeHash:string; readonly createdAt:string; readonly valuationAt:string; readonly session:SessionProof; readonly prices:readonly PriceBinding[];
}
export interface NavEnvelope extends NavPayload { readonly contentHash:string }
export type AuthorityKind='SOURCE_AUTHORITY'|'INDEPENDENT_ACCEPTANCE'|'OWNER_APPROVAL'|'IDENTITY_BRIDGE_ACCEPTANCE'|'CALENDAR_POLICY_ACCEPTANCE';
/** No ACCEPTED state: real identity/approval integration belongs to a later authorized phase. */
export interface AuthorityPlaceholder {
 readonly kind:AuthorityKind; readonly status:'MISSING'|'PENDING'|'PRESENT_UNVERIFIED'|'EXPIRED'|'REVOKED';
 readonly subjectHash:string; readonly evidence:EvidenceRef|null; readonly expiresAt:string|null; readonly revokedAt:string|null;
}
export interface EligibilityRequest {
 readonly purpose:'PORTFOLIO_NAV'; readonly portfolioId:string; readonly ledgerNamespace:string; readonly marketNamespace:string;
 readonly ledgerWatermark:string; readonly ledgerStateHash:string; readonly bridgeHash:string;
 readonly tradingDate:string; readonly valuationAt:string; readonly knowledgeCutoff:string; readonly now:string;
 readonly held:readonly {readonly ledgerSecurityId:string;readonly quantity:string}[];
 readonly sourcePins:readonly {readonly reference:string;readonly sha256:string}[];
 readonly authorities:readonly AuthorityPlaceholder[];
}
export interface NavUnavailable {
 readonly contractVersion:'nav-only-unavailable-v1'; readonly mode:'OFFLINE_PREPARATION'; readonly purpose:'PORTFOLIO_NAV';
 readonly status:'UNAVAILABLE'; readonly nav:null; readonly reasons:readonly string[];
 readonly technicalStatus:'PASS'|'BLOCKED'; readonly allHeldCovered:boolean;
 readonly productionAuthorized:false; readonly acceptedMapping:false; readonly investmentActionabilityAuthorized:false; readonly scoringAuthorized:false;
}
