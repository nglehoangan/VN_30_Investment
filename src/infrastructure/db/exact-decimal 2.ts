import { decimalString } from "@/shared/validation/decimal-string";
import { parseBoundary } from "@/shared/validation/parse";
import { DataIntegrityError } from "@/shared/errors";
const expected = { "$": "Exact decimal text; no exponent, locale formatting or numeric coercion" };
export function encodeExactDecimal(value: unknown): string {
  return parseBoundary(decimalString, value, expected);
}
export function decodeExactDecimal(value: unknown): string {
  try { return encodeExactDecimal(value); }
  catch { throw new DataIntegrityError(); }
}
