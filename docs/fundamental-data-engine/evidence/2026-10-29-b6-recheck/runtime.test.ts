import { expect, it, vi } from "vitest";
import { writeFileSync } from "node:fs";
vi.mock("server-only", () => ({}));
import { loadDashboard } from "../../../../app/server/dashboard";
it("rechecks current personal account through actual composition root on a backup", async () => {
  vi.stubEnv("DATABASE_URL", "file:/private/tmp/vn30-b6-recheck/validation.sqlite");
  const m = await loadDashboard("holdings");
  expect(m.status).toBe("SUCCESS"); expect(m.personalAccountIssue).toBeUndefined();
  expect(m.personalAccount).toMatchObject({ cash: "327420", pendingDividends: "475000", custodyFee: "420", asOfDate: "2026-10-28" });
  expect(m.personalAccount?.positions).toHaveLength(11);
  expect(m.personalAccount?.positions.find(p => p.ticker === "FPT")).toMatchObject({ quantity: "220", tradableQuantity: "200", pendingQuantity: "20" });
  writeFileSync("docs/fundamental-data-engine/evidence/2026-10-29-b6-recheck/RUNTIME_RESULT.json", JSON.stringify({ checkedDate: "2026-10-29", status: "PASS", personalAsOfDate: m.personalAccount?.asOfDate, priceSourceAsOf: m.personalAccount?.valuationAsOf, holdings: m.personalAccount?.positions.length, currentActionability: m.current?.actionability, currentReasons: m.current?.reasons, brokerQuoteTradingDate: m.brokerApiData?.tradingDate, ledgerCash: m.state?.cash, personalCash: m.personalAccount?.cash, scope: "actual SQLite backup; no posting or authority activation" }, null, 2));
});
