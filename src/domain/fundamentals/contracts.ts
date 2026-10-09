import type { Sector } from '@/domain/scoring/methodology';
import type { MetricId } from '@/domain/scoring/metrics';
import type { SecurityId } from '@/domain/portfolio/values';

export type MeasurementSemantic = 'FLOW' | 'STOCK' | 'PER_SHARE' | 'RATIO';
export type ReportingScope = 'CONSOLIDATED' | 'SEPARATE_STANDALONE';
export type FinancialUnit = 'CURRENCY' | 'CURRENCY_PER_SHARE' | 'SHARES' | 'RATIO';
export interface CanonicalItem {
  readonly itemId: string; readonly name: string; readonly meaning: string;
  readonly statementType: 'INCOME' | 'BALANCE' | 'CASH_FLOW' | 'SUPPLEMENTARY';
  readonly measurementSemantic: MeasurementSemantic; readonly allowedUnits: readonly FinancialUnit[];
  readonly currencyApplicability: 'REQUIRED' | 'NONE'; readonly signConvention: 'SIGNED' | 'NONNEGATIVE';
  readonly allowedReportingScopes: readonly ReportingScope[]; readonly sectorApplicability: readonly Sector[];
  readonly evidenceTopicMappings: readonly { readonly documentMetricId: string; readonly rubricId: string; readonly topic: string; readonly requirement: string }[];
  readonly operandMappings: readonly { readonly metricId: MetricId; readonly position: 0 | 1; readonly operand: string; readonly requirement: string }[];
  readonly itemDefinitionVersion: string; readonly methodologyIdentity: string; readonly authorityReferences: readonly string[];
  readonly status: 'ACTIVE' | 'DEPRECATED'; readonly deprecatedFrom: string | null; readonly supersededBy: string | null;
}
export interface CanonicalRegistry {
  readonly registryVersion: string; readonly methodologyIdentity: string; readonly crosswalkVersion: string;
  readonly governanceStatus: 'PROPOSED' | 'APPROVED'; readonly approvalReference: string | null;
  readonly recordedAt: string; readonly effectiveDate: string; readonly authorityReferences: readonly string[];
  readonly items: readonly CanonicalItem[];
}
/** Approval is external evidence, not an approval workflow or a self-issued production record. */
export interface RegistryApprovalBinding {
  readonly registryHash: string; readonly crosswalkVersion: string; readonly methodologyIdentity: string;
  readonly approvalReference: string;
}
export interface RegistryRelease { readonly manifest: CanonicalRegistry; readonly registryHash: string }
export interface FundamentalSourceVersion {
  readonly id: string; readonly provider: string; readonly documentationReference: string; readonly termsReference: string;
  readonly adapterVersion: string; readonly schemaVersion: string; readonly coverageLimitations: readonly string[];
  readonly temporalLimitations: readonly string[]; readonly recordedAt: string;
}
export interface FundamentalRawCapture {
  readonly id: string; readonly sourceVersionId: string; readonly importExecutionId: string;
  readonly requestFingerprint: string; readonly resourceReference: string; readonly sourceRecordId: string | null;
  readonly sourceRecordVersion: string | null; readonly retrievedAt: string; readonly mediaType: string;
  readonly responseStatus: number; readonly payload: string; readonly payloadHash: string;
}
export interface FundamentalImportBatch {
  readonly id: string; readonly sourceVersionId: string; readonly requestFingerprint: string;
  readonly startedAt: string; readonly completedAt: string; readonly ingestedAt: string;
  readonly completion: 'COMPLETE' | 'PARTIAL' | 'FAILED'; readonly captureIds: readonly string[];
  readonly errors: readonly string[];
}
export interface PublicationProvenance {
  readonly publishedAt: string | null; readonly publicationDate: string | null;
  readonly publicationPrecision: 'TIMESTAMP' | 'DATE_ONLY' | 'UNKNOWN'; readonly publicationStatus: 'VERIFIED' | 'UNKNOWN';
  readonly timezone: string | null; readonly evidenceReference: string | null;
}
export interface FundamentalObservation {
  readonly id: string; readonly scope: 'FORMAL' | 'SYNTHETIC_TEST'; readonly securityId: SecurityId;
  readonly ticker: string; readonly identifierReference: string; readonly sourceVersionId: string; readonly rawCaptureId: string;
  readonly itemId: string; readonly registryVersion: string; readonly registryHash: string; readonly itemDefinitionVersion: string;
  readonly statementType: CanonicalItem['statementType']; readonly measurementSemantic: MeasurementSemantic;
  readonly sector: Sector; readonly reportingScope: ReportingScope; readonly segment: string | null;
  readonly accountingBasis: string; readonly auditStatus: 'AUDITED' | 'REVIEWED' | 'UNAUDITED' | 'UNKNOWN';
  readonly periodStart: string; readonly periodEnd: string; readonly periodType: 'QUARTER' | 'YTD' | 'ANNUAL' | 'INSTANT';
  readonly fiscalYear: number; readonly fiscalQuarter: 1 | 2 | 3 | 4 | null; readonly fiscalCalendarReference: string;
  readonly reportDate: string | null; readonly reportDateReference: string | null;
  readonly publication: PublicationProvenance;
  readonly providerReceivedAt: string | null; readonly providerReceiptReference: string | null;
  readonly retrievedAt: string; readonly ingestedAt: string;
  /** Reserved representation only. Slice 5 appends assessments; it never updates this record. */
  readonly availability: { readonly availableAt: null; readonly status: 'UNKNOWN'; readonly policyReference: string | null; readonly mode: 'AS_KNOWN' | 'AS_REVISED' | null; readonly provenanceReferences: readonly string[] };
  readonly raw: { readonly fieldId: string; readonly label: string; readonly fieldLocator: string; readonly lexicalValue: string | null; readonly unit: string; readonly multiplier: string | null; readonly currency: string | null };
  readonly normalized: { readonly value: string | null; readonly unit: FinancialUnit; readonly currency: string | null };
  readonly mappingVersion: string; readonly transformationReferences: readonly string[];
  readonly dataPresence: 'AVAILABLE' | 'MISSING' | 'SOURCE_UNAVAILABLE';
  readonly quality: 'VALID' | 'WARNING' | 'INVALID' | 'CONFLICTING' | 'UNKNOWN';
  readonly applicability: 'APPLICABLE' | 'NOT_APPLICABLE' | 'UNRESOLVED'; readonly applicabilityReference: string | null;
  readonly scopeFallback: { readonly requestedScope: ReportingScope; readonly approvalReference: string; readonly rationale: string } | null;
  /** Future transformations may reference a full immutable FX artifact. Slice 1 never converts currency. */
  readonly fxLineageReference: string | null;
  readonly revisionKind: 'ORIGINAL' | 'ISSUER_RESTATEMENT' | 'PROVIDER_CORRECTION' | 'MAPPING_CORRECTION';
  readonly recordVersion: string; readonly supersedesObservationId: string | null;
  readonly revisionReason: string | null; readonly revisionEvidenceReference: string | null;
  /** Actual system knowledge of correction/revision semantics, with revisionEvidenceReference lineage.
   * Not issuer/provider/public publication; cannot establish a public boundary.
   * A corrected observation is ingested at/after this knowledge; future knowledge requires a new revision. */
  readonly correctionKnownAt: string | null;
  readonly ancestorReferences: readonly string[];
}
