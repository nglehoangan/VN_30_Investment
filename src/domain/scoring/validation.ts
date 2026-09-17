import { ValidationError } from "@/shared/errors";
export function check(value: unknown, reason: string): asserts value {
  if (!value) throw new ValidationError([{ field: "scoring", reason, expected: "M3 / M6.4 clarification contract" }]);
}
export function keys(value: object, allowed: string) {
  check(value && typeof value === "object" && !Array.isArray(value), "OBJECT_REQUIRED");
  check(Object.keys(value).every(k => allowed.split(" ").includes(k)), "UNRECOGNIZED_FIELD");
}
export function text(value: unknown): asserts value is string {
  check(typeof value === "string" && value.trim().length > 0 && value.length <= 4000 && !/[<>\x00-\x08]/.test(value), "PLAIN_TEXT_REQUIRED");
}
export function id(value: unknown): asserts value is string {
  check(typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/.test(value), "IDENTIFIER_REQUIRED");
}
export function list<T>(value: readonly T[], max = 1000): asserts value is readonly T[] {
  check(Array.isArray(value) && value.length <= max, "BOUNDED_ARRAY_REQUIRED");
}
export function unique(values: readonly string[]) { check(new Set(values).size === values.length, "DUPLICATE_IDENTIFIER"); }
/** Defensive JSON snapshot; no coercion of functions, prototypes, undefined or non-finite values. */
export function snapshot<T>(value: T): T {
  const visit = (v: unknown, depth: number) => {
    check(depth < 30, "INPUT_TOO_DEEP");
    if (v === null || typeof v === "boolean" || typeof v === "string") return;
    if (typeof v === "number") { check(Number.isSafeInteger(v), "INTEGER_ONLY"); return; }
    check(typeof v === "object" && (Array.isArray(v) || Object.getPrototypeOf(v) === Object.prototype), "PLAIN_JSON_REQUIRED");
    const entries = Object.entries(v as object); check(entries.length <= 10000, "INPUT_TOO_LARGE");
    for (const [k, child] of entries) { check(!["__proto__", "constructor", "prototype"].includes(k), "UNSAFE_KEY"); visit(child, depth + 1); }
  };
  visit(value, 0); return JSON.parse(JSON.stringify(value)) as T;
}
