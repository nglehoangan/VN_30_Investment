import type { LedgerRead } from "@/ports/portfolio";
import type { PortfolioState } from "@/domain/portfolio/reconstruct";
import type { CurrentNavRequestV1 } from "@/domain/current-nav/contracts";

export interface BrokerEvidencePinV1 {
  readonly id: string; readonly path: string; readonly sha256: string; readonly size: number;
  readonly schema: "nav-broker-observations-v1"; readonly documentId: string;
  readonly provider: string; readonly accountId: string; readonly portfolioId: string; readonly perimeterId: string;
}
export interface BrokerFieldV1 {
  readonly id: string; readonly field: string; readonly kind: "CASH" | "RECEIVABLE" | "LIABILITY" | "SECURITY" | "CORPORATE_ACTION";
  readonly value: string | null; readonly unit: "VND" | "SHARES";
  readonly securityId: string | null; readonly lifecycle: "ORDINARY" | "PENDING" | "UNKNOWN" | null;
  readonly reference: string; readonly pointer: string;
}
/** Observation envelope, never an acceptance record or financial interpretation. */
export interface BrokerObservationsV1 {
  readonly schema: "nav-broker-observations-v1"; readonly documentId: string; readonly provider: string;
  readonly accountId: string; readonly portfolioId: string; readonly perimeterId: string;
  readonly observedAt: string; readonly retrievedAt: string; readonly knownAt: string;
  readonly publicationAt: string | null; readonly currency: "VND";
  readonly fields: readonly BrokerFieldV1[]; readonly conflicts: readonly string[];
}
export type BrokerEvidenceReadV1 =
  | { readonly status: "OBSERVED"; readonly pin: BrokerEvidencePinV1; readonly observation: BrokerObservationsV1; readonly contentHash: string; readonly accepted: false }
  | { readonly status: "BLOCKED"; readonly pin: BrokerEvidencePinV1; readonly reasons: readonly string[]; readonly conflicts: readonly string[]; readonly observation: BrokerObservationsV1 | null; readonly accepted: false };
export interface BrokerEvidenceReader {
  read(pin: BrokerEvidencePinV1, cutoff: { readonly valuationAt: string; readonly knowledgeCutoff: string; readonly calculatedAt: string }): Promise<BrokerEvidenceReadV1>;
}
export interface LedgerSnapshotV1 {
  readonly version: "nav-ledger-read-v1"; readonly portfolioId: string; readonly ledgerRevision: string;
  readonly valuationAt: string; readonly knowledgeCutoff: string; readonly factsHash: string; readonly stateHash: string;
  readonly ledger: LedgerRead; readonly state: PortfolioState; readonly financiallyComplete: false;
}
export interface NavLedgerSnapshotReader {
  snapshot(request: CurrentNavRequestV1, valuationAt: string, expected?: { readonly stateHash?: string; readonly factsHash?: string }): Promise<LedgerSnapshotV1>;
}
/** Typed partial preparation. It deliberately has no complete plan or acceptance flags. */
export interface BlockedNavInputsV1 {
  readonly version: "nav-input-preparation-v1"; readonly status: "BLOCKED";
  readonly portfolioId: string; readonly valuationAt: string; readonly knowledgeCutoff: string;
  readonly ledgerRevision: string; readonly ledger: LedgerSnapshotV1 | null;
  readonly observations: readonly BrokerEvidenceReadV1[]; readonly sourcePins: readonly BrokerEvidencePinV1[]; readonly evidenceHead: string;
  readonly reasons: readonly string[]; readonly limitations: readonly string[];
  readonly productionAuthorized: false; readonly completePlanAvailable: false;
}
