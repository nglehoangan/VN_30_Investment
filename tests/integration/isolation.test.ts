// @vitest-environment node
import { expect, it } from "vitest";
import { existsSync } from "node:fs";
import { testDatabase } from "../fixtures/database";
import { methodologyFixture } from "../fixtures/methodology";
it("independent database fixtures never share records and remove only their owned directories", async () => {
  const first = await testDatabase();
  try {
    const second = await testDatabase();
    try {
      expect(first.config.filePath).not.toBe(second.config.filePath);
      const record = methodologyFixture();
      await first.registry.append(record);
      expect(await second.registry.findById(record.methodologyId)).toBeNull();
      expect(await first.registry.findById(record.methodologyId)).toEqual(record);
    } finally { await second.close(); }
    expect(existsSync(second.directory)).toBe(false);
    expect(existsSync(first.directory)).toBe(true);
  } finally { await first.close(); }
  expect(existsSync(first.directory)).toBe(false);
});
