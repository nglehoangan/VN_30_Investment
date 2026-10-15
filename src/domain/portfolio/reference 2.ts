import { dateOnly, type DateOnly } from "@/shared/time";
import { requireRule, type SecurityId } from "./values";
export interface ReferenceInterval {
  readonly id: string; readonly kind: "IDENTIFIER" | "MEMBERSHIP" | "COVERAGE" | "SECTOR";
  readonly securityId: SecurityId | null; readonly from: DateOnly; readonly to: DateOnly | null;
  readonly value: string; readonly taxonomy: string | null; readonly sourceReference: string;
}
export interface ReferenceData { readonly version: string; readonly intervals: readonly ReferenceInterval[] }
export function validateReference(data: ReferenceData) {
  requireRule(data.version.trim().length > 0, "REFERENCE_VERSION_REQUIRED");
  requireRule(new Set(data.intervals.map(r => r.id)).size === data.intervals.length, "DUPLICATE_REFERENCE_ID");
  for (const row of data.intervals) {
    dateOnly(row.from); if (row.to) dateOnly(row.to);
    requireRule((!row.to || row.to > row.from) && row.sourceReference.trim() && row.value.trim(), "INVALID_REFERENCE_INTERVAL");
    requireRule(row.kind === "COVERAGE" ? row.securityId === null : row.securityId !== null, "REFERENCE_SECURITY_REQUIRED");
    if (row.kind === "SECTOR") requireRule(row.taxonomy?.trim(), "SECTOR_TAXONOMY_REQUIRED");
    if (row.kind === "COVERAGE") requireRule(["COMPLETE_CONFIRMED", "INCOMPLETE_SOURCE_DATA", "UNSUPPORTED"].includes(row.value), "INVALID_COVERAGE");
    for (const other of data.intervals) {
      if (other.id === row.id || other.kind !== row.kind || other.securityId !== row.securityId || other.taxonomy !== row.taxonomy) continue;
      requireRule((row.to !== null && row.to <= other.from) || (other.to !== null && other.to <= row.from), "OVERLAPPING_REFERENCE_INTERVALS");
    }
  }
}
export function referenceAt(data: ReferenceData, securityId: string, asOf: DateOnly, taxonomy: string) {
  validateReference(data); dateOnly(asOf);
  const active = data.intervals.filter(r => r.from <= asOf && (!r.to || asOf < r.to));
  const rows = active.filter(r => r.securityId === securityId);
  const member = rows.some(r => r.kind === "MEMBERSHIP");
  const complete = active.some(r => r.kind === "COVERAGE" && r.value === "COMPLETE_CONFIRMED") && new Set(active.filter(r => r.kind === "MEMBERSHIP").map(r => r.securityId)).size === 30;
  return { securityId, identifier: rows.find(r => r.kind === "IDENTIFIER")?.value ?? null,
    membership: member ? "MEMBER" : complete ? "NON_MEMBER_CONFIRMED" : "UNKNOWN_OR_UNSUPPORTED",
    sector: rows.find(r => r.kind === "SECTOR" && r.taxonomy === taxonomy)?.value ?? null,
    referenceVersion: data.version } as const;
}
