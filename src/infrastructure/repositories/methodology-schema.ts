import { z } from "zod";
import { parseBoundary } from "@/shared/validation/parse";
import { dateOnly, instant } from "@/shared/time";
import { methodologyId } from "@/shared/ids";
import type { MethodologyRecord } from "@/domain/methodology/record";
function semanticVersion(value: string): boolean {
  const [corePre, build, extraBuild] = value.split("+");
  if (extraBuild !== undefined || (build !== undefined && !/^[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*$/.test(build))) return false;
  const dash = corePre.indexOf("-");
  const core = dash === -1 ? corePre : corePre.slice(0, dash);
  if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(core)) return false;
  if (dash === -1) return true;
  const identifiers = corePre.slice(dash + 1).split(".");
  return identifiers.every(part => /^[0-9A-Za-z-]+$/.test(part) && (!/^\d+$/.test(part) || /^(0|[1-9]\d*)$/.test(part)));
}
const text = z.string().min(1).refine(value => value.trim() === value && !/[\x00-\x1f]/.test(value));
const validDate = text.refine(value => { try { dateOnly(value); return true; } catch { return false; } });
const validInstant = text.refine(value => { try { instant(value); return true; } catch { return false; } });
const schema = z.strictObject({
  methodologyId: text, family: text, semanticVersion: text.refine(semanticVersion),
  approvalReference: text, effectiveDate: validDate, configurationReference: text,
  implementationIdentity: text, governingDocumentReference: text, recordedAt: validInstant,
});
const expected = Object.freeze({
  "$": "Complete methodology registry metadata", methodologyId: "Nonempty immutable ID", family: "Nonempty methodology family",
  semanticVersion: "Semantic version MAJOR.MINOR.PATCH with optional prerelease/build identifiers", approvalReference: "External approval evidence reference",
  effectiveDate: "Valid YYYY-MM-DD date", configurationReference: "Immutable configuration reference",
  implementationIdentity: "Pinned implementation/build identity", governingDocumentReference: "Governing baseline document reference", recordedAt: "Canonical UTC millisecond timestamp",
});
export function validateMethodology(value: unknown): Readonly<MethodologyRecord> {
  const row = parseBoundary(schema, value, expected);
  return Object.freeze({ ...row, methodologyId: methodologyId(row.methodologyId), effectiveDate: dateOnly(row.effectiveDate), recordedAt: instant(row.recordedAt) });
}
