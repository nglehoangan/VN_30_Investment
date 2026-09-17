// @vitest-environment node
import { beforeEach, afterEach, describe, expect, it } from "vitest";
import { statSync } from "node:fs";
import { testDatabase } from "../fixtures/database";
import { methodologyFixture } from "../fixtures/methodology";
import { methodologyId } from "@/shared/ids";
import { requireMethodology } from "@/application/methodology/find-methodology";
import { PrismaMethodologyRegistry } from "@/infrastructure/repositories/methodology-registry";
import { openDatabase } from "@/infrastructure/db/client";
import { ConflictError, NotFoundError, ValidationError, DataIntegrityError } from "@/shared/errors";
describe("actual SQLite methodology registry", () => {
  let db: Awaited<ReturnType<typeof testDatabase>>;
  beforeEach(async () => { db = await testDatabase(); });
  afterEach(async () => { await db?.close(); });
  it("migrates an empty DB with expected foundation/ledger tables and private permissions", async () => {
    const tables = await db.client.$queryRaw<Array<{ name: string }>>`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`;
    expect(tables.map(t => t.name)).toEqual(["_prisma_migrations", "corporate_action_reference", "ledger_leg", "ledger_transaction", "methodology_record", "portfolio", "portfolio_projection", "security"]);
    expect(db.migration("status")).toBe(0);
    expect(statSync(db.directory).mode & 0o077).toBe(0);
    expect(statSync(db.config.filePath).mode & 0o077).toBe(0);
    const columns = await db.client.$queryRawUnsafe<Array<{ name: string; type: string }>>('PRAGMA table_info("methodology_record")');
    expect(columns.map(c => c.name)).toEqual(["methodology_id", "family", "semantic_version", "approval_reference", "effective_date", "configuration_reference", "implementation_identity", "governing_document_reference", "recorded_at"]);
    expect(columns.every(c => c.type === "TEXT")).toBe(true);
  });
  it("round-trips full metadata and date/instant semantics and freezes the mapped record", async () => {
    const record = methodologyFixture(); await db.registry.append(record);
    const result = await requireMethodology(db.registry, record.methodologyId);
    expect(result).toEqual(record); expect(Object.isFrozen(result)).toBe(true);
    expect(result.effectiveDate).toBe("2024-02-29"); expect(result.recordedAt).toBe("2024-02-29T00:00:00.000Z");
  });
  it("maps duplicates to ConflictError without replacing the original", async () => {
    const record = methodologyFixture(); await db.registry.append(record);
    await expect(db.registry.append({ ...record, implementationIdentity: "different-build" })).rejects.toBeInstanceOf(ConflictError);
    expect(await db.registry.findById(record.methodologyId)).toEqual(record);
  });
  it("preserves find missing/null and maps required missing to NotFoundError", async () => {
    const id = methodologyId("missing");
    expect(await db.registry.findById(id)).toBeNull();
    await expect(requireMethodology(db.registry, id)).rejects.toBeInstanceOf(NotFoundError);
  });
  it("rejects malformed metadata before writing", async () => {
    await expect(db.registry.append({ ...methodologyFixture(), semanticVersion: "01.0.0" })).rejects.toBeInstanceOf(ValidationError);
    expect(await db.client.methodologyRecord.count()).toBe(0);
  });
  it("rolls back the entire transaction on a duplicate append", async () => {
    const existing = methodologyFixture(); await db.registry.append(existing);
    await expect(db.client.$transaction(async tx => {
      const registry = new PrismaMethodologyRegistry(tx);
      await registry.append(methodologyFixture("must-roll-back"));
      await registry.append(existing);
    })).rejects.toBeInstanceOf(ConflictError);
    expect(await db.client.methodologyRecord.count()).toBe(1);
    expect(await db.registry.findById(methodologyId("must-roll-back"))).toBeNull();
  });
  it("blocks update, delete and REPLACE through supported connections", async () => {
    const record = methodologyFixture(); await db.registry.append(record);
    await expect(db.client.$executeRaw`UPDATE methodology_record SET family='changed' WHERE methodology_id=${record.methodologyId}`).rejects.toThrow();
    await expect(db.client.$executeRaw`DELETE FROM methodology_record WHERE methodology_id=${record.methodologyId}`).rejects.toThrow();
    await expect(db.client.$executeRaw`INSERT OR REPLACE INTO methodology_record SELECT * FROM methodology_record WHERE methodology_id=${record.methodologyId}`).rejects.toThrow();
    expect(await db.registry.findById(record.methodologyId)).toEqual(record);
  });
  it("preserves records on reconnect and repeated migration deploy", async () => {
    const record = methodologyFixture(); await db.registry.append(record); await db.client.$disconnect();
    expect(db.migration("migrate")).toBe(0);
    const reopened = await openDatabase(db.config);
    try { expect(await new PrismaMethodologyRegistry(reopened).findById(record.methodologyId)).toEqual(record); }
    finally { await reopened.$disconnect(); }
  });
  it("detects invalid persisted metadata instead of returning trusted domain state", async () => {
    const record = methodologyFixture();
    await db.client.methodologyRecord.create({ data: { ...record, semanticVersion: "invalid" } });
    await expect(db.registry.findById(record.methodologyId)).rejects.toBeInstanceOf(DataIntegrityError);
  });
  it("supports canonical effective-date filtering without implicit timezone shifts", async () => {
    const record = methodologyFixture(); await db.registry.append(record);
    expect(await db.client.methodologyRecord.count({ where: { effectiveDate: { lt: "2024-02-29" } } })).toBe(0);
    expect(await db.client.methodologyRecord.count({ where: { effectiveDate: { lte: "2024-02-29" } } })).toBe(1);
  });
});
