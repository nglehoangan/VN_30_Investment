// @vitest-environment node
import { beforeAll, afterAll, expect, it } from "vitest";
import { testDatabase } from "../fixtures/database";
import { encodeExactDecimal, decodeExactDecimal } from "@/infrastructure/db/exact-decimal";
import { openDatabase } from "@/infrastructure/db/client";
import { DataIntegrityError, ValidationError } from "@/shared/errors";
let db: Awaited<ReturnType<typeof testDatabase>>;
beforeAll(async () => {
  db = await testDatabase();
  // Test DB only; this table is deliberately absent from production schema/migrations.
  await db.client.$executeRaw`CREATE TABLE numeric_probe (id TEXT PRIMARY KEY, value_text TEXT NOT NULL CHECK(typeof(value_text)='text'))`;
});
afterAll(async () => { await db?.close(); });
const values = ["0", "5000000", "900719925474099312345.00100", "12500.005", "0.0015", "-123456789.1234567890123456789", "1.00000000000000000000000000000000001", "999999999999999999999999999999999999999999999999999999999999"];
// Independent exact rational representation for technical transport proof, not an accounting policy.
function rational(text: string) { const [whole, fraction = ""] = text.split("."); return { numerator: BigInt(whole + fraction), denominator: 10n ** BigInt(fraction.length) }; }
it("serializes -> persists TEXT through Prisma/SQLite -> reopens -> reads -> recalculates exactly", async () => {
  for (const [index, value] of values.entries()) {
    const serialized: unknown = JSON.parse(JSON.stringify(value));
    const text = encodeExactDecimal(serialized);
    await db.client.$executeRaw`INSERT INTO numeric_probe(id, value_text) VALUES (${String(index)}, ${text})`;
  }
  const reopened = await openDatabase(db.config);
  try {
    const rows = await reopened.$queryRaw<Array<{ id: string; value_text: string; storage_type: string }>>`SELECT id, value_text, typeof(value_text) AS storage_type FROM numeric_probe ORDER BY id`;
    expect(rows).toHaveLength(values.length);
    for (const row of rows) {
      const original = values[Number(row.id)]; // Index only, never financial value.
      const restored = decodeExactDecimal(row.value_text);
      expect(row.storage_type).toBe("text"); expect(restored).toBe(original);
      const before = rational(original), after = rational(restored), rate = rational("0.0015");
      expect({ numerator: after.numerator * rate.numerator, denominator: after.denominator * rate.denominator }).toEqual({ numerator: before.numerator * rate.numerator, denominator: before.denominator * rate.denominator });
    }
  } finally { await reopened.$disconnect(); }
});
it.each([1.5, 9007199254740992, "1e3", "", "1,000", "NaN", null])("rejects unsafe transport input %s before DB conversion", value => {
  expect(() => encodeExactDecimal(value)).toThrow(ValidationError);
});
it.each([1.5, "broken", null])("classifies invalid persisted representation %s as integrity failure", value => {
  expect(() => decodeExactDecimal(value)).toThrow(DataIntegrityError);
});
