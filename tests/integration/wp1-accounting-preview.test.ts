// @vitest-environment node
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { DatabaseSync } from "node:sqlite";
import { createHash } from "node:crypto";
import { RetainedWp1EvidenceReader } from "@/infrastructure/portfolio/wp1-evidence-reader";
import { openDatabase } from "@/infrastructure/db/client";
import { loadDatabaseConfig } from "@/infrastructure/config/database";
import { PrismaPortfolioLedger } from "@/infrastructure/repositories/portfolio-ledger";
import { PortfolioAccountingValidation } from "@/application/portfolio/accounting-validation";
import { applyAccountingPreview, initialAccountingPreview, requireWp1PostingAuthority, type AccountingEventProposal } from "@/domain/portfolio/accounting-event-preview";
import { portfolioId, watermark } from "@/domain/portfolio/values";
import { hash } from "../fixtures/portfolio/accounting-preview";
const rule = (reason: RegExp) => expect.objectContaining({ issues: expect.arrayContaining([expect.objectContaining({ reason: expect.stringMatching(reason) })]) });
const source = join(process.cwd(), "data/vn30.sqlite");
const fileHash = (path: string) => createHash("sha256").update(readFileSync(path)).digest("hex");

describe.skipIf(process.env.WP1_PRIVATE_DB !== "1")("WP1 actual retained case in disposable SQLite copy", () => {
  let directory: string, copy: string, originalHash: string, client: Awaited<ReturnType<typeof openDatabase>>;
  let service: PortfolioAccountingValidation, reader: RetainedWp1EvidenceReader;
  let sql: DatabaseSync;
  const input = { portfolioId: portfolioId("tcbs-personal-v1"), expectedWatermark: watermark("1"), ledgerAsOf: "2026-10-31T00:00:00.000Z", calculatedAt: "2026-11-01T00:00:00.000Z", maxReceiptAgeMs: 4 * 86400000 };
  beforeAll(async () => {
    for (const ext of ["-wal", "-journal"]) expect(!existsSync(source + ext) || statSync(source + ext).size === 0).toBe(true);
    originalHash = fileHash(source); directory = mkdtempSync(join(tmpdir(), "vn30-wp1-preview-")); copy = join(directory, "copy.sqlite"); copyFileSync(source, copy);
    client = await openDatabase(loadDatabaseConfig({ DATABASE_URL: `file:${copy}` }, process.cwd()));
    reader = new RetainedWp1EvidenceReader(process.cwd(), copy);
    service = new PortfolioAccountingValidation(new PrismaPortfolioLedger(client), reader, hash);
    sql = new DatabaseSync(copy);
    // TEST-ONLY preview journal. Never a production schema migration or ledger transaction.
    sql.exec(`CREATE TABLE wp1_preview_event(id TEXT PRIMARY KEY, economic_key TEXT UNIQUE NOT NULL, plan_hash TEXT NOT NULL, payload TEXT NOT NULL, result_hash TEXT NOT NULL);
      CREATE TRIGGER wp1_preview_no_update BEFORE UPDATE ON wp1_preview_event BEGIN SELECT RAISE(ABORT,'immutable preview'); END;
      CREATE TRIGGER wp1_preview_no_delete BEFORE DELETE ON wp1_preview_event BEGIN SELECT RAISE(ABORT,'immutable preview'); END;`);
  });
  afterAll(async () => {
    try { sql?.close(); await client?.$disconnect(); expect(fileHash(source)).toBe(originalHash); }
    finally { if (directory) rmSync(directory, { recursive: true, force: true }); }
  });
  it("verifies source lineage, records/reloads immutable previews, and reproduces the economic bridge without production posting", async () => {
    const result = await service.preview(input), sourceBefore = JSON.stringify(await client.ledgerTransaction.findMany({ orderBy: { id: "asc" } }));
    expect(result.state).toMatchObject({ cash: "232420", receivables: "570000", payables: "0" });
    expect(result.preview).toMatchObject({ cash: "327420", receivables: "475000", payables: "420", accruedExpensesDelta: "420", commonEconomicCutoff: null, productionAccepted: false });
    expect(result.preview.positions.find(p => p.securityId === "TCB")).toMatchObject({ total: "150", available: "100", pending: "50" });
    expect(result.preview.positions.find(p => p.securityId === "FPT")).toMatchObject({ total: "220", available: "200", pending: "20", openCost: "16065060" });
    expect(result.preview.positions.map(p => [p.securityId, p.openCost])).toEqual(result.state.positions.map(p => [p.securityId, p.openCost]));
    expect(result.state).toMatchObject({ netDividends: "0", netContributions: "0", cashAdjustments: "0" });
    let previous = initialAccountingPreview(result.state);
    const insert = sql.prepare("INSERT INTO wp1_preview_event VALUES(?,?,?,?,?)");
    for (const event of result.plan.events) {
      previous = applyAccountingPreview(previous, event, event);
      insert.run(event.id, event.economicKey, hash(result.plan), JSON.stringify(event), hash(previous));
      expect(() => insert.run(event.id, event.economicKey, hash(result.plan), JSON.stringify(event), hash(previous))).toThrow();
      expect(() => applyAccountingPreview(previous, event, event)).toThrow(rule(/WP1_DUPLICATE_PREVIEW_EVENT/));
    }
    let replay = initialAccountingPreview(result.state);
    for (const row of sql.prepare("SELECT * FROM wp1_preview_event ORDER BY rowid").all()) {
      const event = JSON.parse(String(row.payload)) as AccountingEventProposal;
      const trusted = result.plan.events.find(e => e.id === event.id)!;
      expect(row.plan_hash).toBe(hash(result.plan)); replay = applyAccountingPreview(replay, event, trusted); expect(row.result_hash).toBe(hash(replay));
    }
    expect(replay).toEqual(result.preview);
    expect(() => sql.exec("UPDATE wp1_preview_event SET payload='{}'")).toThrow(/immutable preview/);
    expect(() => sql.exec("DELETE FROM wp1_preview_event")).toThrow(/immutable preview/);
    expect(await client.ledgerTransaction.count()).toBe(12); expect(await client.ledgerLeg.count()).toBe(24);
    expect(JSON.stringify(await client.ledgerTransaction.findMany({ orderBy: { id: "asc" } }))).toBe(sourceBefore);
    expect(result).toMatchObject({ status: "BLOCKED", navAuthorized: false, tradingAuthorized: false, productionAccepted: false, postingCommands: [] });
    expect(() => requireWp1PostingAuthority(result.plan)).toThrow(/WP1_PRODUCTION_POSTING_NOT_AUTHORIZED/);
    expect(fileHash(source)).toBe(originalHash);
    if (process.env.WP1_EVIDENCE_OUTPUT) writeFileSync(process.env.WP1_EVIDENCE_OUTPUT, JSON.stringify({
      baseline: "6c49b6d5a78489d03260eca15d42f78be0de096d", sourceDatabaseHashBefore: originalHash, sourceDatabaseHashAfter: fileHash(source),
      actualLedgerTransactions: 12, actualLedgerLegs: 24, disposablePreviewRows: 4, planHash: hash(result.plan), plan: result.plan, before: { cash: result.state.cash, receivables: result.state.receivables, payables: result.state.payables },
      preview: result.preview, reconciliation: result.reconciliation, projectedReconciliation: result.projectedReconciliation,
      productionPostingAuthorized: false, productionLedgerChanged: false, commonEconomicCutoffCertified: false,
    }, null, 2) + "\n");
  });
  it("blocks source/date/effect overrides against the actual event plan", async () => {
    const result = await service.preview(input), original = result.plan.events[1];
    expect(original).toMatchObject({ economicEffectiveDate: "2026-10-16", economicEffectiveAt: null, brokerActionId: null });
    expect(original.evidence.find(p => p.id.endsWith("CASH_HISTORY.json"))).toMatchObject({ pointer: "/reports/1/rows/57", knownAt: null, retrievedAt: null });
    const forged = { ...original, economicEffectiveDate: "2026-10-17" };
    expect(() => applyAccountingPreview(initialAccountingPreview(result.state), forged, original)).toThrow(rule(/WP1_UNSUPPORTED_EVENT_DATE_OR_SOURCE_BINDING/));
    const foreign = { ...original, evidence: original.evidence.map(p => ({ ...p, id: "foreign-account-source" })) };
    expect(() => applyAccountingPreview(initialAccountingPreview(result.state), foreign, original)).toThrow(rule(/WP1_UNSUPPORTED_EVENT_DATE_OR_SOURCE_BINDING/));
  });
  it("keeps actual stale, quantity, corporate-action and unknown cutoff failures visible in the connected workflow", async () => {
    const result = await service.preview({ ...input, maxReceiptAgeMs: 1 });
    expect(result.reconciliation.reasons).toContain("STALE_OBSERVATION"); expect(result.projectedReconciliation.reasons).toContain("STALE_OBSERVATION");
    expect(result.reconciliation.reasons).toContain("MISSING_ECONOMIC_CUTOFF");
    expect(result.reconciliation.positions.find(p => p.securityId === "TCB")?.difference).toBe("50");
    expect(result.projectedReconciliation.positions.every(p => p.difference === "0")).toBe(true);
    for (const ticker of ["TCB", "FPT"]) expect(result.projectedReconciliation.positions.find(p => p.securityId === ticker)?.issues).toContain("MISSING_CORPORATE_ACTION_EVIDENCE");
  });
  it("rejects corrupted observation bytes and a changed owner source record in isolated negative copies", async () => {
    const bad = join(directory, "corrupt.sqlite"); copyFileSync(source, bad);
    const altered = new DatabaseSync(bad);
    try {
      // Fault injection on a SECOND disposable copy only; production/source triggers remain intact.
      for (const row of altered.prepare("SELECT name FROM sqlite_master WHERE type='trigger' AND tbl_name='broker_observation'").all()) {
        altered.exec(`DROP TRIGGER "${String(row.name).replaceAll('"', '""')}"`);
      }
      altered.prepare("UPDATE broker_observation SET body=body || ' ' WHERE id=?").run("TCBS_API_RESPONSE:99fcccfa342efaa7587aa48ffeafa3646f8230fc119946a57726762e5b2b448a");
    } finally { altered.close(); }
    await expect(new RetainedWp1EvidenceReader(process.cwd(), bad).read()).rejects.toThrow(rule(/WP1_OBSERVATION_HASH_MISMATCH/));
    const fakeRoot = join(directory, "changed-owner"), ownerPath = "docs/fundamental-data-engine/governance/PORTFOLIO_OWNER_CONFIRMATIONS_2026-10-31.json";
    mkdirSync(join(fakeRoot, "docs/fundamental-data-engine/governance"), { recursive: true });
    writeFileSync(join(fakeRoot, ownerPath), readFileSync(ownerPath, "utf8") + " ");
    await expect(new RetainedWp1EvidenceReader(fakeRoot, copy).read()).rejects.toThrow(rule(/WP1_OWNER_RECORD_HASH_MISMATCH/));
    expect(fileHash(source)).toBe(originalHash);
  });
  it("does not accept a different source/account identity at the application boundary", async () => {
    const evidence = await reader.read();
    const foreign = new PortfolioAccountingValidation(new PrismaPortfolioLedger(client), { read: async () => ({ ...evidence, accountReference: "foreign" }) }, hash);
    await expect(foreign.preview(input)).rejects.toThrow(rule(/WP1_ACCOUNT_SOURCE_MISMATCH/));
    expect(await client.ledgerTransaction.count()).toBe(12);
  });
});
