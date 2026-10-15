import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ValidationError } from "@/shared/errors";
import { parseBoundary } from "@/shared/validation/parse";
import { decimalString } from "@/shared/validation/decimal-string";
const expected = { "$": "Object with rows", rows: "Array of rows", "rows[].price": "Exact decimal string in VND/share" };
const schema = z.strictObject({ rows: z.array(z.strictObject({ price: decimalString })) });
function capture(input: unknown) {
  try { parseBoundary(schema, input, expected); } catch (error) {
    if (error instanceof ValidationError) return error;
    throw error;
  }
  throw new Error("Expected validation failure");
}
describe("trust-boundary validation", () => {
  it("returns typed exact values without numeric conversion or rounding", () => {
    const input = { rows: [{ price: "900719925474099312345.00100" }] };
    expect(parseBoundary(schema, input, expected)).toEqual(input);
    expect(input.rows[0].price).toBe("900719925474099312345.00100");
  });
  it("gives nested field, reason and expected shape", () => {
    expect(capture({ rows: [{ price: "1" }, { price: 12.5 }] }).issues).toEqual([
      { field: "rows[1].price", reason: "Incorrect value type", expected: "Exact decimal string in VND/share" },
    ]);
  });
  it.each(["", " ", " 1", "1 ", "1e3", "1,000", "+1", ".5", "1.", "01", 0, 12.5, null, false, NaN, Infinity])("rejects dangerous numeric input %s", value => {
    expect(() => parseBoundary(decimalString, value, { "$": "Exact decimal string" })).toThrow(ValidationError);
  });
  it.each(["0", "-0", "-100.000", "0.00001"])("does not invent financial sign/scale rules for %s", value => {
    expect(parseBoundary(decimalString, value, { "$": "Exact decimal string" })).toBe(value);
  });
  it("rejects unexpected fields without echoing names or values", () => {
    const error = capture({ rows: [{ price: "1", "secret-key-canary": "secret-value-canary" }] });
    expect(error.issues[0].reason).toBe("Unexpected fields are not allowed");
    expect(JSON.stringify(error)).not.toContain("canary");
    expect(error.cause).toBeUndefined();
  });
  it("does not reflect attacker record keys or custom Zod messages", () => {
    const unsafeMessage = "password-canary-secret";
    const record = z.record(z.string(), z.string().min(10, { error: unsafeMessage }));
    try {
      parseBoundary(record, { "token-key-canary": "short" }, { "$": "Record with valid values" });
      expect.fail("Expected validation error");
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect(JSON.stringify(error)).not.toContain("canary");
      if (error instanceof ValidationError) expect(error.issues[0].field).toBe("$");
    }
  });
  it("works with user, import and provider payload schemas without integration code", () => {
    const name = z.strictObject({ name: z.string().min(1) });
    expect(parseBoundary(name, { name: "Test" }, { name: "Nonempty name" })).toEqual({ name: "Test" });
    expect(parseBoundary(z.array(decimalString), ["1.20"], { "$": "Decimal rows" })).toEqual(["1.20"]);
    const provider = z.strictObject({ observed: z.iso.datetime(), value: decimalString });
    const payload = { observed: "2024-01-01T00:00:00.000Z", value: "100.01" };
    expect(parseBoundary(provider, payload, { "$": "Dated provider observation" })).toEqual(payload);
  });
});
