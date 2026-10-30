// @vitest-environment node
import { afterEach, expect, it } from "vitest";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { personalAccountView, type PersonalAccountObservation } from "@/domain/portfolio/personal-account";
import { readPersonalAccount } from "@/infrastructure/personal-account";
import { PersonalAccount } from "@/ui/personal-account";
import { reconstructPortfolio } from "@/domain/portfolio/reconstruct";
import { instant } from "@/shared/time";
import { securityId } from "@/domain/portfolio/values";
import { P, NOW, W0, history, input } from "../fixtures/portfolio/history";
import { brokerSnapshotFixture } from "../fixtures/broker-snapshot";
const state = () => reconstructPortfolio(P, history([input("opening", "OPENING_BALANCE", 1, { securityId: securityId("FPT"), quantity: "220", opening: { cost: "16065060", evidence: "SYNTHETIC", migrationVersion: "test" } })]), NOW, W0);
const observation = (): PersonalAccountObservation => ({ schemaVersion: "personal-account-v1", portfolioId: P, ledgerWatermark: "0", asOfDate: "2026-09-16", cash: "327420", pendingDividends: "475000", custodyFee: "420", withdrawable: "327000", linkedBankAvailable: "12152752", buyingPower: "12479752", brokerReportedNav: "91742252", positions: [{ ticker: "FPT", isin: "VN000000FPT1", quantity: "220", tradableQuantity: "200", pendingQuantity: "20", importedCost: "16065060" }] });
const snapshot = { ...brokerSnapshotFixture(), holdingsAsOf: "2026-09-15T08:00:00.000Z", positions: [{ ...brokerSnapshotFixture().positions[0], symbol: "FPT", price: "57000" }] };
const dirs: string[] = [];
afterEach(async () => { await Promise.all(dirs.splice(0).map(d => rm(d, { recursive: true, force: true }))); });
async function source(o = observation()) { const root = await mkdtemp(path.join(tmpdir(), "personal-account-")); dirs.push(root); await mkdir(path.join(root, "data/account-current"), { recursive: true }); await writeFile(path.join(root, "data/account-current/personal-account.json"), JSON.stringify(o)); return root; }
it("uses imported basis and keeps FPT pending within220 without recognizing pending cash", () => {
  const view = personalAccountView(observation(), snapshot);
  expect(view.positions[0]).toMatchObject({ quantity: "220", tradableQuantity: "200", pendingQuantity: "20", marketValue: "12540000", unrealizedPnl: "-3525060" });
  expect(view.cash).toBe("327420"); expect(view.pendingDividends).toBe("475000"); expect(view.brokerReportedNav).toBe("91742252");
  expect(view.valuationAsOf).toBe(snapshot.holdingsAsOf);
});
it("leaves price/P&L unavailable without a dated price source", () => expect(personalAccountView(observation()).positions[0].unrealizedPnl).toBeNull());
it("does not treat linked-bank buying power as a second cash asset", () => { const o = observation(); o.buyingPower = "327420"; expect(() => personalAccountView(o)).toThrow(); });
it("rejects duplicate or misallocated holdings", () => { const o = observation(); o.positions.push(o.positions[0]); expect(() => personalAccountView(o)).toThrow(); const b = observation(); b.positions[0].pendingQuantity = "21"; expect(() => personalAccountView(b)).toThrow(); });
it("reads matching portfolio+revision+imported basis and preserves immutable ledger", async () => { const s = state(), before = JSON.stringify(s); const v = await readPersonalAccount(await source(), s, snapshot); expect(v?.cash).toBe("327420"); expect(JSON.stringify(s)).toBe(before); });
it("does not attach private owner observations to a different portfolio", async () => { const o = observation(); o.portfolioId = "OTHER"; expect(await readPersonalAccount(await source(o), state())).toBeUndefined(); });
it.each(["revision", "basis", "quantity", "future"])("refuses stale or mismatched %s instead of using fallback", async kind => { const o = observation(); if (kind === "revision") o.ledgerWatermark = "1"; if (kind === "basis") o.positions[0].importedCost = "16264878"; if (kind === "quantity") o.positions[0].quantity = "240"; if (kind === "future") o.asOfDate = "2027-01-01"; await expect(readPersonalAccount(await source(o), state())).rejects.toThrow(); });
it("renders separate pending, fee, price date and imported P/L without duplicate fees", () => { const html = renderToStaticMarkup(<PersonalAccount account={personalAccountView(observation(), snapshot)} />); for (const s of ["327.420", "475.000", "420", "91.742.252", "-3.525.060", "2026-09-15", "chưa được tính là tiền mặt"]) expect(html).toContain(s); });

it("interprets owner date in Vietnam rather than UTC across local midnight", async () => { const s = { ...state(), asOf: instant("2026-09-15T18:00:00.000Z") }; expect((await readPersonalAccount(await source(), s))?.asOfDate).toBe("2026-09-16"); });
