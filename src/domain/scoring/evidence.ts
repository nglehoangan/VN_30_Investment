import { dateOnly, instant } from "@/shared/time";
import { decimal } from "@/domain/portfolio/values";
import { check, id, keys, list, text, unique } from "./validation";
export interface CanonicalEvidenceTime {
  readonly contract: "canonical-evidence-time-v2";
  readonly snapshotRunId: string;
  readonly fundamentalCutoff: string;
  readonly availableAt: string;
  readonly reviewKnownAt: readonly string[];
  readonly constituents: readonly {
    readonly observationId: string;
    readonly publicationPrecision: "TIMESTAMP" | "DATE_ONLY";
    readonly publicationStatus: "VERIFIED";
    readonly publishedAt: string | null;
    readonly publicationDate: string | null;
    readonly timezone: string | null;
    readonly evidenceReference: string;
    readonly assessmentId: string;
    readonly observationHash: string;
    readonly policyHash: string;
    readonly availableAt: string;
    /** Exact immutable Slice 05 assessment, including governed receipt authority and proof. */
    readonly availabilityProvenance: string;
  }[];
}
interface EvidenceBase {
  readonly id: string; readonly version: string; readonly securityId: string; readonly observation: string;
  readonly value: string; readonly unit: "VND" | "VND_PER_SHARE" | "SHARES" | "RATIO" | "TEXT";
  readonly classification: "FACT" | "ESTIMATE" | "ASSUMPTION"; readonly source: string;
  readonly periodStart: string; readonly periodEnd: string; readonly asOf: string; readonly publishedAt: string | null;
  readonly receivedAt: string; readonly validThrough: string; readonly critical: boolean;
  readonly quality: "VALID" | "STALE" | "CONFLICTING_DATA" | "MISSING_REQUIRED_DATA";
  readonly family: string;
}
/** Absence of time means the original exact-timestamp contract, without reinterpretation. */
export type Evidence = EvidenceBase & (
  { readonly publishedAt: string; readonly time?: never } |
  { readonly time: CanonicalEvidenceTime }
);
function exactTimeKeys(value:object,fields:string){keys(value,fields);check(Object.keys(value).sort().join(' ')===fields.split(' ').sort().join(' '),"EVIDENCE_TIME_EXACT_FIELDS");}
function validateTime(e: Evidence, knownAt: string) {
  if (!e.time) { instant(e.publishedAt!); check(e.publishedAt !== null && e.publishedAt <= knownAt && e.publishedAt <= e.receivedAt, "FUTURE_OR_INVALID_EVIDENCE"); return; }
  const t=e.time;
  exactTimeKeys(t,"contract snapshotRunId fundamentalCutoff availableAt reviewKnownAt constituents");
  check(t.contract==="canonical-evidence-time-v2","UNSUPPORTED_EVIDENCE_TIME_CONTRACT"); id(t.snapshotRunId);
  [t.fundamentalCutoff,t.availableAt].forEach(instant); list(t.reviewKnownAt); t.reviewKnownAt.forEach(instant);
  list(t.constituents); check(t.constituents.length>0,"PUBLICATION_CONSTITUENTS_REQUIRED");
  unique(t.constituents.map(c=>c.observationId));
  for(const c of t.constituents){
    exactTimeKeys(c,"observationId publicationPrecision publicationStatus publishedAt publicationDate timezone evidenceReference assessmentId observationHash policyHash availableAt availabilityProvenance");
    [c.observationId,c.assessmentId].forEach(id); text(c.evidenceReference); check(typeof c.availabilityProvenance==="string"&&c.availabilityProvenance.length>0&&c.availabilityProvenance.length<=64000,"BOUNDED_AVAILABILITY_PROVENANCE");
    check([c.observationHash,c.policyHash].every(h=>typeof h==="string"&&/^[a-f0-9]{64}$/.test(h)),"INVALID_TIME_PROVENANCE_HASH");
    instant(c.availableAt); check(c.publicationStatus==="VERIFIED","VERIFIED_PUBLICATION_REQUIRED");
    if(c.publicationPrecision==="TIMESTAMP") { instant(c.publishedAt!); check(c.publishedAt!==null&&c.publicationDate===null&&c.publishedAt<=c.availableAt,"INVALID_EXACT_PUBLICATION"); }
    else { check(c.publicationPrecision==="DATE_ONLY"&&c.publishedAt===null&&c.publicationDate!==null,"INVALID_DATE_ONLY_PUBLICATION"); dateOnly(c.publicationDate!); text(c.timezone!); }
  }
  const exact=t.constituents.every(c=>c.publicationPrecision==="TIMESTAMP");
  check(e.publishedAt===(exact?t.constituents.map(c=>c.publishedAt!).sort().at(-1)!:null),"COMPOSITE_PUBLICATION_PRECISION");
  check(t.availableAt===[...t.constituents.map(c=>c.availableAt),...t.reviewKnownAt].sort().at(-1)&&e.receivedAt===t.availableAt&&t.availableAt<=knownAt&&t.availableAt<=t.fundamentalCutoff,"INVALID_OPERATIONAL_KNOWLEDGE");
}
export function validateEvidence(rows: readonly Evidence[], securityId: string, asOf: string, knownAt: string) {
  list(rows); unique(rows.map(e => e.id));
  const conflicts: string[] = [];
  for (const e of rows) {
    keys(e, "id version securityId observation value unit classification source periodStart periodEnd asOf publishedAt receivedAt validThrough critical quality family"+(e.time?" time":""));
    [e.id,e.version,e.securityId,e.observation,e.family].forEach(id); text(e.source);
    check(e.securityId === securityId, "MIXED_SECURITY_EVIDENCE");
    check(["FACT","ESTIMATE","ASSUMPTION"].includes(e.classification), "EVIDENCE_CLASS_REQUIRED");
    check(["VALID","STALE","CONFLICTING_DATA","MISSING_REQUIRED_DATA"].includes(e.quality), "INVALID_QUALITY");
    check(typeof e.critical === "boolean", "CRITICALITY_REQUIRED");
    dateOnly(e.periodStart); dateOnly(e.periodEnd);
    [e.asOf,e.receivedAt,e.validThrough].forEach(instant); validateTime(e,knownAt);
    check(e.periodStart <= e.periodEnd && (e.classification !== "FACT" || e.periodEnd <= e.asOf.slice(0,10)), "INVALID_PERIOD");
    check(e.asOf <= asOf && e.receivedAt <= knownAt && e.validThrough >= e.asOf, "FUTURE_OR_INVALID_EVIDENCE");
    check(["VND","VND_PER_SHARE","SHARES","RATIO","TEXT"].includes(e.unit), "INVALID_UNIT");
    if (e.unit === "TEXT") text(e.value); else { const value=decimal(e.value); if(e.unit==="SHARES")check(!value.negative&&value.integer,"INVALID_SHARE_UNIT"); }
    if (rows.some(o => o.id !== e.id && o.observation === e.observation && o.periodStart === e.periodStart && o.periodEnd === e.periodEnd)) conflicts.push(e.id);
  }
  return conflicts;
}
export function available(e: Pick<Evidence,"id" | "quality" | "validThrough">, asOf: string, conflicts: readonly string[]) { return e.quality === "VALID" && e.validThrough >= asOf && !conflicts.includes(e.id); }
