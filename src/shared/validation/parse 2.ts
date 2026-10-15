import type { z } from "zod";
import { ValidationError } from "@/shared/errors";
/** Expected shapes are developer-authored constants, never provider/input messages. */
export type ExpectedFields = Readonly<Record<string, string>>;
const reasons: Readonly<Record<string, string>> = Object.freeze({
  invalid_type: "Incorrect value type",
  invalid_value: "Value is not an allowed option",
  invalid_format: "Incorrect value format",
  too_small: "Value is below the required minimum",
  too_big: "Value exceeds the allowed maximum",
  unrecognized_keys: "Unexpected fields are not allowed",
  invalid_union: "Value does not match an allowed shape",
  not_multiple_of: "Value does not match the required increment",
});
/** Sync boundary schemas only; structural/domain/financial policies remain distinct. */
export function parseBoundary<T>(schema: z.ZodType<T>, input: unknown, expected: ExpectedFields): T {
  const result = schema.safeParse(input);
  if (result.success) return result.data;
  const issues = result.error.issues.map(issue => {
    const parts = issue.path;
    const pattern = parts.map((part, index) => typeof part === "number" ? "[]" : `${index === 0 ? "" : "."}${String(part)}`).join("") || "$";
    // A record/map key can be attacker-controlled. Only declared schema paths are reflected.
    const known = Object.hasOwn(expected, pattern);
    const field = known ? parts.map((part, index) => typeof part === "number" ? `[${part}]` : `${index === 0 ? "" : "."}${String(part)}`).join("") || "$" : "$";
    return { field, reason: reasons[issue.code] ?? "Value does not satisfy the declared schema", expected: (known ? expected[pattern] : expected["$"]) ?? "Value matching the declared schema" };
  });
  // Do not retain ZodError, raw input, custom messages or unknown keys in cause.
  throw new ValidationError(issues);
}
