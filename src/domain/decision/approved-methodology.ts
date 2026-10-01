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
export function isApprovedDecisionMethodology(record: MethodologyRecord): boolean {
  return Object.entries(APPROVED_DECISION_METHODOLOGY).every(([key, value]) => record[key as keyof MethodologyRecord] === value);
}
