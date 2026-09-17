// @vitest-environment node
import { beforeEach, afterEach, describe, it, expect } from "vitest";
import { testDatabase } from "../fixtures/database";
import { methodologyFixture } from "../fixtures/methodology";
import { PrismaPortfolioLedger, PrismaPortfolioProjection, PrismaPortfolioSetup } from "@/infrastructure/repositories/portfolio-ledger";
import { initializePortfolio } from "@/application/portfolio/initialize";
import { PortfolioEngine } from "@/application/portfolio/engine";
import { openDatabase } from "@/infrastructure/db/client";
import { ACCOUNTING_METHOD, watermark } from "@/domain/portfolio/values";
import { P, A, B, NOW, W0, at, method, deposit, buy, sell, reversal, settlement, goldenInputs } from "../fixtures/portfolio/history";
import { ConflictError } from "@/shared/errors";
import type { TransactionInput } from "@/domain/portfolio/transaction";
describe("M6.3 real SQLite ledger / commands / migrations", () => {
  let db: Awaited<ReturnType<typeof testDatabase>>, ledger: PrismaPortfolioLedger, projection: PrismaPortfolioProjection, engine: PortfolioEngine;
  beforeEach(async () => {
    db = await testDatabase();
    await db.registry.append({ ...methodologyFixture(method), implementationIdentity: ACCOUNTING_METHOD });
    await initializePortfolio(new PrismaPortfolioSetup(db.client), { id: P, name: "test portfolio", currency: "VND", inceptionAt: at(1), createdAt: NOW }, [{ id: A, name: "A" }, { id: B, name: "B" }]);
    ledger = new PrismaPortfolioLedger(db.client); projection = new PrismaPortfolioProjection(db.client); engine = new PortfolioEngine(ledger, { now: () => NOW }, projection);
  });
  afterEach(async () => { await db?.close(); });
  const post = async (f: TransactionInput) => engine.post([f], (await ledger.read(P)).watermark);
  it("VC-L01 Command -> validation -> repository -> SQLite -> reload -> replay", async () => {
    const result = await post(deposit()); expect(result).toMatchObject({ status: "POSTED", ledgerWatermark: "1", state: { cash: "10000" } });
    const reloaded = await ledger.read(P); expect(reloaded.transactions).toHaveLength(1); expect(reloaded.transactions[0].legs).toHaveLength(1);
    expect((await engine.reconstruct(P, NOW)).cash).toBe("10000"); expect((await projection.inspect(P)).status).toBe("VALID");
  });
  it("VC-L05 / VC-SEC02 duplicate key/source and stale double submit cannot post twice", async () => {
    await post(deposit());
    await expect(engine.post([deposit()], W0)).rejects.toBeInstanceOf(ConflictError);
    await expect(engine.post([{ ...deposit("different"), source: deposit().source }], watermark("1"))).rejects.toThrow();
    expect((await ledger.read(P)).watermark).toBe("1"); expect(await db.client.ledgerTransaction.count()).toBe(1);
  });
  it("same values with distinct economic identities are not silently merged", async () => {
    await post(deposit()); await post(deposit("second")); expect((await engine.reconstruct(P, NOW)).cash).toBe("20000");
  });
  it("VC-L03 oversell rejects before authoritative commit and revision advance", async () => {
    await post(deposit()); await post(buy()); await expect(post(sell("oversell", "101", "1515"))).rejects.toThrow();
    expect((await ledger.read(P)).watermark).toBe("2"); expect(await db.client.ledgerTransaction.count()).toBe(2);
  });
  it("VC-SEC03 stale draft is rejected; never posts against stale quantity", async () => {
    await post(deposit()); await post(buy()); const draftWatermark = (await ledger.read(P)).watermark;
    await post(sell()); await expect(engine.post([sell("second")], draftWatermark)).rejects.toBeInstanceOf(ConflictError);
  });
  it("raw late-leg insert/update/delete/replace/header destructive mutation fail", async () => {
    await post(deposit());
    await expect(db.client.$executeRaw`UPDATE ledger_transaction SET facts='{}' WHERE id='deposit'`).rejects.toThrow();
    await expect(db.client.$executeRaw`DELETE FROM ledger_transaction WHERE id='deposit'`).rejects.toThrow();
    await expect(db.client.$executeRaw`INSERT OR REPLACE INTO ledger_transaction SELECT * FROM ledger_transaction WHERE id='deposit'`).rejects.toThrow();
    await expect(db.client.$executeRaw`UPDATE ledger_leg SET amount='2' WHERE transaction_id='deposit'`).rejects.toThrow();
    await expect(db.client.$executeRaw`DELETE FROM ledger_leg WHERE transaction_id='deposit'`).rejects.toThrow();
    const leg = await db.client.ledgerLeg.findFirstOrThrow();
    await expect(db.client.ledgerLeg.create({ data: { ...leg, id: "late", sequence: 2 } })).rejects.toThrow();
    expect((await engine.reconstruct(P, NOW)).cash).toBe("10000");
  });
  it("failed required leg insert rolls back header, revision and all legs", async () => {
    await db.client.$executeRawUnsafe("CREATE TRIGGER fixture_fail_leg BEFORE INSERT ON ledger_leg BEGIN SELECT RAISE(ABORT,'test failure'); END");
    await expect(post(deposit())).rejects.toThrow();
    expect(await db.client.ledgerTransaction.count()).toBe(0); expect(await db.client.ledgerLeg.count()).toBe(0); expect((await ledger.read(P)).watermark).toBe("0");
  });
  it("VC-L07 projection failure retains authoritative event and stale old projection", async () => {
    await post(deposit());
    const failing = new PortfolioEngine(ledger, { now: () => NOW }, { rebuild: async () => { throw new Error("fixture projection failure"); } });
    expect(await failing.post([buy()], watermark("1"))).toMatchObject({ status: "POSTED", projectionStatus: "BLOCKED", state: null, ledgerWatermark: "2" });
    expect(await db.client.ledgerTransaction.count()).toBe(2); expect((await projection.inspect(P)).status).toBe("STALE");
    expect((await engine.reconstruct(P, NOW)).positions[0].quantity).toBe("100");
  });
  it("VC-L08 new event invalidates historical snapshot watermark", async () => {
    await post(deposit()); const state = await engine.reconstruct(P, at(1)); expect(await engine.isCurrent(state)).toBe(true);
    await post(buy()); expect(await engine.isCurrent(state)).toBe(false); expect((await engine.reconstruct(P, at(1))).cash).toBe("10000");
  });
  it("VC-L06 settled trade correction is atomic, queryable, survives reload", async () => {
    await post(deposit()); await post(buy()); await post(settlement("settle", "buy", "1000", 3));
    const group = { correctionGroupId: "correction" };
    await engine.post([reversal("01-r-settle", "settle", 4, group), reversal("02-r-buy", "buy", 4, group), buy("03-corrected", "50", "500", 4, group)], watermark("3"));
    expect(await db.client.ledgerTransaction.count()).toBe(6);
    expect((await engine.reconstruct(P, at(3))).positions[0].quantity).toBe("100");
    expect((await engine.reconstruct(P, NOW))).toMatchObject({ cash: "10000", payables: "500", positions: [{ quantity: "50", openCost: "500" }] });
  });
  it("independent connections racing at one watermark permit at most one economic command", async () => {
    await post(deposit()); await post(buy()); const other = await openDatabase(db.config);
    try {
      const e2 = new PortfolioEngine(new PrismaPortfolioLedger(other), { now: () => NOW });
      const results = await Promise.allSettled([engine.post([sell("sale1")], watermark("2")), e2.post([sell("sale2")], watermark("2"))]);
      expect(results.filter(r => r.status === "fulfilled")).toHaveLength(1);
      expect((await engine.reconstruct(P, NOW)).positions[0].quantity).toBe("40");
    } finally { await other.$disconnect(); }
  });
  it("decimal TEXT round-trip beyond safe integer and fractional charge", async () => {
    await post(deposit("d", "9007199254740993.123456789012"));
    const row = await db.client.$queryRaw<Array<{ amount: string; storage: string }>>`SELECT amount, typeof(amount) AS storage FROM ledger_leg`;
    expect(row).toEqual([{ amount: "9007199254740993.123456789012", storage: "text" }]);
    expect((await engine.reconstruct(P, NOW)).cash).toBe("9007199254740993.123456789012");
  });
  it("migration repeat/reopen retains methodology and reconstructs the golden fixture", async () => {
    for (const f of goldenInputs()) await post(f);
    expect(db.migration("status")).toBe(0); expect(db.migration("migrate")).toBe(0);
    const other = await openDatabase(db.config);
    try { const e2 = new PortfolioEngine(new PrismaPortfolioLedger(other), { now: () => NOW }); expect(await e2.reconstruct(P, NOW)).toMatchObject({ cash: "8270", realizedPnl: "246" }); expect(await other.methodologyRecord.count()).toBe(1); }
    finally { await other.$disconnect(); }
  });
  it("historical watermark reproduces the input set before a later backdated contribution", async () => {
    await post(deposit()); const earlier = await engine.reconstruct(P, NOW);
    await post(deposit("late-source", "500", 1));
    expect((await engine.reconstruct(P, NOW)).cash).toBe("10500");
    expect(await engine.reconstruct(P, NOW, earlier.ledgerWatermark)).toEqual(earlier);
  });
  it("an old rebuild cannot overwrite a projection from a newer ledger revision", async () => {
    await post(deposit()); const old = await engine.reconstruct(P, NOW);
    await post(buy()); await expect(projection.rebuild(old, NOW)).rejects.toBeInstanceOf(ConflictError);
    expect(await projection.inspect(P)).toMatchObject({ status: "VALID", watermark: "2" });
  });
  it("snapshot includes valuation/reconciliation versions and blocks missing evidence or changed inputs", async () => {
    await post(deposit());
    const prices = { version: "fixture-price-v1", methodologyId: "valuation-v1", observations: [] };
    const references = { version: "fixture-reference-v1", intervals: [] };
    const evidence = { id: "statement", portfolioId: P, asOf: at(1), receivedAt: at(1), sourceReference: "test statement", cash: "10000", positions: [], receivables: "0", payables: "0", unresolvedDiscrepancy: false };
    const snapshot = await engine.snapshot(P, at(1), prices, evidence, references, "taxonomy");
    expect(snapshot).toMatchObject({ status: "VALID", actionabilityBlocked: false, ledgerWatermark: "1", valuation: { nav: "10000", economicPnl: "0" }, reconciliation: { status: "MATCH" } });
    expect(await engine.isSnapshotCurrent(snapshot, { referenceVersion: references.version, priceVersion: prices.version })).toBe(true);
    expect(await engine.isSnapshotCurrent(snapshot, { referenceVersion: references.version, priceVersion: "new-prices" })).toBe(false);
    expect(await engine.snapshot(P, at(1), prices, null, references, "taxonomy")).toMatchObject({ status: "BLOCKED", actionabilityBlocked: true });
  });
  it("corporate reference and staged accounting effects persist separately and are immutable", async () => {
    await post(deposit());
    const { input } = await import("../fixtures/portfolio/history");
    const terms = { id: "rights-event", subtype: "RIGHTS_SUBSCRIPTION", numerator: "1", denominator: "1", evidence: "official allocation", stage: "EFFECTIVE" as const, basis: "200" };
    const exercise = input("rights-exercise", "CORPORATE_ACTION", 2, { securityId: A, quantity: "20", amount: "200", corporateAction: terms });
    await post(exercise);
    await post(input("rights-payment", "CORPORATE_ACTION", 3, { securityId: A, amount: "200", corporateAction: { ...terms, stage: "SETTLEMENT", originatingTransactionId: exercise.id } }));
    expect(await db.client.corporateActionReference.count()).toBe(1);
    expect((await engine.reconstruct(P, NOW))).toMatchObject({ cash: "9800", payables: "0", positions: [{ quantity: "20", openCost: "200" }] });
    await expect(db.client.corporateActionReference.update({ where: { id: terms.id }, data: { terms: "{}" } })).rejects.toThrow();
  });
  it("FK and value exclusivity constraints enabled", async () => {
    expect(await db.client.$queryRawUnsafe("PRAGMA foreign_keys")).toEqual([{ foreign_keys: 1n }]);
    await expect(db.client.ledgerLeg.create({ data: { id: "orphan", transactionId: "missing", type: "CASH", sequence: 1, effectiveAt: NOW, amount: "1" } })).rejects.toThrow();
  });
});
