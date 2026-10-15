import type { MethodologyId } from "@/shared/ids";
import type { DateOnly, Instant } from "@/shared/time";
/** Registry records external governance evidence; it cannot grant approval. */
export interface MethodologyRecord {
  readonly methodologyId: MethodologyId;
  readonly family: string;
  readonly semanticVersion: string;
  readonly approvalReference: string;
  /** External governance state; the registry records it but never grants approval. */
  readonly governanceStatus: "DRAFT" | "PROPOSED" | "APPROVED" | "RETIRED";
  readonly intendedUse: "PRODUCTION" | "TEST";
  readonly effectiveDate: DateOnly;
  /** Reference to an immutable snapshot, not a mutable settings URL. */
  readonly configurationReference: string;
  readonly implementationIdentity: string;
  readonly governingDocumentReference: string;
  readonly recordedAt: Instant;
}
