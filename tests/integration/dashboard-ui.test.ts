// @vitest-environment node
import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { testDatabase } from "../fixtures/database";
import { methodologyFixture } from "../fixtures/methodology";
import { PrismaPortfolioSetup, PrismaPortfolioLedger } from "@/infrastructure/repositories/portfolio-ledger";
import { initializePortfolio } from "@/application/portfolio/initialize";
import { ACCOUNTING_METHOD } from "@/domain/portfolio/values";
import { P, A, B, NOW, method } from "../fixtures/portfolio/history";
import { readDashboard } from "../../app/server/dashboard";
import { previewTransaction, confirmTransaction, assertLocalOrigin } from "../../app/server/manual-transactions";
const draft = { type: "CASH_DEPOSIT", date: "2026-01-01", time: "12:00", amount: "10000", security: "", quantity: "", price: "", fee: "0", tax: "0", reference: "", sourceReference: "manual-source-1" };
describe("M6.7 local read / confirmed command integration", () => {
  let db: Awaited<ReturnType<typeof testDatabase>>;
  const clock = { now: () => NOW };
  beforeEach(async () => {
    db = await testDatabase();
    await db.registry.append({ ...methodologyFixture(method), family: "ACCOUNTING", approvalReference: "synthetic-test-only", intendedUse: "PRODUCTION", governanceStatus: "APPROVED", implementationIdentity: ACCOUNTING_METHOD });
    await initializePortfolio(new PrismaPortfolioSetup(db.client), { id: P, name: "SYNTHETIC UI TEST ONLY", currency: "VND", inceptionAt: "2026-01-01T00:00:00.000Z" as typeof NOW, createdAt: NOW }, [{ id: A, name: "A" }, { id: B, name: "B" }]);
  });
  afterEach(async () => { await db?.close(); });
  it("preview does not write; confirmation posts; repeat confirmation cannot duplicate", async () => {
    const preview = await previewTransaction(db.client, draft, clock);
    expect(await db.client.ledgerTransaction.count()).toBe(0);
    const posted = await confirmTransaction(db.client, preview.token, clock);
    expect(posted.result.status).toBe("POSTED");
    await expect(confirmTransaction(db.client, preview.token, clock)).rejects.toThrow();
    expect(await db.client.ledgerTransaction.count()).toBe(1);
    const read = await readDashboard(db.client);
    expect(read.state?.cash).toBe("10000"); expect(read.transactions[0].facts.id).toBe(posted.transactionId);
  });
  it("rejects tampering, browser business outputs, expired confirmation and stale watermark", async () => {
    await expect(previewTransaction(db.client, { ...draft, decisionState: "BUY", availableCash: "1000000" }, clock)).rejects.toThrow();
    const a = await previewTransaction(db.client, draft, clock);
    const b = await previewTransaction(db.client, { ...draft, sourceReference: "second" }, clock);
    await expect(confirmTransaction(db.client, `${a.token}x`, clock)).rejects.toThrow();
    await expect(confirmTransaction(db.client, a.token, clock)).resolves.toBeDefined();
    await expect(confirmTransaction(db.client, b.token, clock)).rejects.toThrow();
    const c = await previewTransaction(db.client, { ...draft, sourceReference: "third" }, clock);
    await expect(confirmTransaction(db.client, c.token, { now: () => "2026-10-03T00:00:00.000Z" as typeof NOW })).rejects.toThrow();
    expect(await db.client.ledgerTransaction.count()).toBe(1);
  });
  it("reversal appends a new fact instead of mutating original", async () => {
    const a = await previewTransaction(db.client, draft, clock); const p = await confirmTransaction(db.client, a.token, clock);
    const original = await db.client.ledgerTransaction.findUniqueOrThrow({ where: { id: p.transactionId } });
    const r = await previewTransaction(db.client, { ...draft, type: "REVERSAL", date: "2026-01-02", reference: p.transactionId, sourceReference: "reversal" }, clock);
    await confirmTransaction(db.client, r.token, clock);
    expect(await db.client.ledgerTransaction.findUnique({ where: { id: p.transactionId } })).toEqual(original);
    expect((await readDashboard(db.client)).state?.cash).toBe("0");
  });
  it("BUY preview resolves amount on server and rejects oversell without posting", async () => {
    await confirmTransaction(db.client, (await previewTransaction(db.client, draft, clock)).token, clock);
    const buy = await previewTransaction(db.client, { ...draft, type: "BUY", date: "2026-01-02", security: A, quantity: "100", price: "10", amount: "999999", sourceReference: "buy" }, clock);
    expect(buy.transaction.facts.amount).toBe("1000");
    await confirmTransaction(db.client, buy.token, clock);
    await expect(previewTransaction(db.client, { ...draft, type: "SELL", date: "2026-01-03", security: A, quantity: "101", price: "10", sourceReference: "bad-sale" }, clock)).rejects.toThrow();
    expect((await new PrismaPortfolioLedger(db.client).read(P)).transactions).toHaveLength(2);
  });
  it("read validates immutable ledger rather than trusting projection payload", async () => {
    await confirmTransaction(db.client, (await previewTransaction(db.client, draft, clock)).token, clock);
    await db.client.portfolioProjection.update({ where: { portfolioId: P }, data: { payload: '{"cash":"999999999"}' } });
    expect((await readDashboard(db.client)).state?.cash).toBe("10000");
  });
  it("rejects missing/cross-origin and remote host writes", () => {
    expect(() => assertLocalOrigin("http://127.0.0.1:3000", "127.0.0.1:3000")).not.toThrow();
    for (const origin of [null, "http://attacker.test", "http://127.0.0.1:3001", "https://127.0.0.1:3000"]) expect(() => assertLocalOrigin(origin, "127.0.0.1:3000")).toThrow();
    expect(() => assertLocalOrigin("http://remote.test:3000", "remote.test:3000")).toThrow();
  });
});
