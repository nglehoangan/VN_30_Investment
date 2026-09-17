import { dateOnly, instant } from "@/shared/time";
import { decimal } from "@/domain/portfolio/values";
import { check, id, keys, list, text, unique } from "./validation";
export interface Evidence {
  readonly id: string; readonly version: string; readonly securityId: string; readonly observation: string;
  readonly value: string; readonly unit: "VND" | "VND_PER_SHARE" | "SHARES" | "RATIO" | "TEXT";
  readonly classification: "FACT" | "ESTIMATE" | "ASSUMPTION"; readonly source: string;
  readonly periodStart: string; readonly periodEnd: string; readonly asOf: string; readonly publishedAt: string;
  readonly receivedAt: string; readonly validThrough: string; readonly critical: boolean;
  readonly quality: "VALID" | "STALE" | "CONFLICTING_DATA" | "MISSING_REQUIRED_DATA";
  readonly family: string;
}
export function validateEvidence(rows: readonly Evidence[], securityId: string, asOf: string, knownAt: string) {
  list(rows); unique(rows.map(e => e.id));
  const conflicts: string[] = [];
  for (const e of rows) {
    keys(e, "id version securityId observation value unit classification source periodStart periodEnd asOf publishedAt receivedAt validThrough critical quality family");
    [e.id,e.version,e.securityId,e.observation,e.family].forEach(id); text(e.source);
    check(e.securityId === securityId, "MIXED_SECURITY_EVIDENCE");
    check(["FACT","ESTIMATE","ASSUMPTION"].includes(e.classification), "EVIDENCE_CLASS_REQUIRED");
    check(["VALID","STALE","CONFLICTING_DATA","MISSING_REQUIRED_DATA"].includes(e.quality), "INVALID_QUALITY");
    check(typeof e.critical === "boolean", "CRITICALITY_REQUIRED");
    dateOnly(e.periodStart); dateOnly(e.periodEnd);
    [e.asOf,e.publishedAt,e.receivedAt,e.validThrough].forEach(instant);
    check(e.periodStart <= e.periodEnd && (e.classification !== "FACT" || e.periodEnd <= e.asOf.slice(0,10)), "INVALID_PERIOD");
    check(e.asOf <= asOf && e.publishedAt <= knownAt && e.receivedAt <= knownAt && e.publishedAt <= e.receivedAt && e.validThrough >= e.asOf, "FUTURE_OR_INVALID_EVIDENCE");
    check(["VND","VND_PER_SHARE","SHARES","RATIO","TEXT"].includes(e.unit), "INVALID_UNIT");
    if (e.unit === "TEXT") text(e.value); else { const value=decimal(e.value); if(e.unit==="SHARES")check(!value.negative&&value.integer,"INVALID_SHARE_UNIT"); }
    if (rows.some(o => o.id !== e.id && o.observation === e.observation && o.periodStart === e.periodStart && o.periodEnd === e.periodEnd)) conflicts.push(e.id);
  }
  return conflicts;
}
export function available(e: Evidence, asOf: string, conflicts: readonly string[]) { return e.quality === "VALID" && e.validThrough >= asOf && !conflicts.includes(e.id); }
