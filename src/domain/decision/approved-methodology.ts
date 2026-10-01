import type { MethodologyRecord } from "@/domain/methodology/record";
import { methodologyId } from "@/shared/ids";
import { dateOnly, instant } from "@/shared/time";

export const APPROVED_METHOD = "m65-decision-v1-approved-resolutions-20260930";
/** Records the owner's external approval; code and registry do not grant approval. */
export const APPROVED_DECISION_METHODOLOGY: Readonly<MethodologyRecord> = Object.freeze({
  methodologyId: methodologyId(APPROVED_METHOD),
  family: "M4_DECISION",
  semanticVersion: "1.0.1",
  implementationIdentity: APPROVED_METHOD,
  configurationReference: APPROVED_METHOD,
  governanceStatus: "APPROVED",
  intendedUse: "PRODUCTION",
  governingDocumentReference: "docs/06_DASHBOARD/6.5 Decision Engine/CHANGE_REQUESTS.md",
  approvalReference: "docs/06_DASHBOARD/6.5 Decision Engine/M652_OWNER_APPROVAL.md",
  effectiveDate: dateOnly("2026-09-30"),
  recordedAt: instant("2026-09-30T00:00:00.000Z"),
});
/** M65-R3-M01 corrects implementation under the existing CR-01/02/03 approval. */
export const MONOTONIC_METHOD = "m65-decision-v1-sector-monotonicity-20261001";
export const MONOTONIC_DECISION_METHODOLOGY: Readonly<MethodologyRecord> = Object.freeze({
  ...APPROVED_DECISION_METHODOLOGY,
  methodologyId: methodologyId(MONOTONIC_METHOD),
  semanticVersion: "1.0.2",
  implementationIdentity: MONOTONIC_METHOD,
  configurationReference: MONOTONIC_METHOD,
  governingDocumentReference: "docs/06_DASHBOARD/6.5 Decision Engine/M653_SECTOR_POLICY.md",
  effectiveDate: dateOnly("2026-10-01"),
  recordedAt: instant("2026-10-01T00:00:00.000Z"),
});
export const APPROVED_IMPLEMENTATIONS: readonly string[] = Object.freeze([APPROVED_METHOD, MONOTONIC_METHOD]);
export function isApprovedDecisionMethodology(record: MethodologyRecord): boolean {
  const expected = record.implementationIdentity === MONOTONIC_METHOD ? MONOTONIC_DECISION_METHODOLOGY : APPROVED_DECISION_METHODOLOGY;
  return Object.entries(expected).every(([key, value]) => record[key as keyof MethodologyRecord] === value);
}
