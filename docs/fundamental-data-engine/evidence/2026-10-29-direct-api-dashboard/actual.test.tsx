import { expect, it, vi } from "vitest";
import { writeFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
vi.mock("server-only", () => ({}));
import { loadDashboard } from "../../../../app/server/dashboard";
import { DashboardScreen } from "@/ui/dashboard";
it("dashboard reads fresh API prices and imported-basis P/L directly from active SQLite", async () => {
 const m = await loadDashboard("holdings");
 expect(m.status).toBe("SUCCESS"); expect(m.personalAccountIssue).toBeUndefined();
 const a = m.personalAccount!; expect(a).toBeDefined(); expect(a.positions).toHaveLength(11); expect(a.valuationAsOf).toBe("2026-10-28");
 const fpt = a.positions.find(p => p.ticker === "FPT")!;
 expect(fpt).toMatchObject({ price: "54000", quantity: "220", tradableQuantity: "200", pendingQuantity: "20", importedCost: "16065060", marketValue: "11880000", unrealizedPnl: "-4185060" });
 expect(a.cash).toBe("327420");expect(a.pendingDividends).toBe("475000");expect(a.custodyFee).toBe("420");
 expect(m.brokerApiData?.quotes).toHaveLength(30);expect(m.brokerApiData?.tradingDate).toBe("2026-10-28");
 const html = renderToStaticMarkup(<DashboardScreen model={m} screen="holdings" />);
 expect(html).toContain("54.000");expect(html).toContain("-4.185.060");expect(html).not.toContain("2026-10-11T04:16");
 writeFileSync("docs/fundamental-data-engine/evidence/2026-10-29-direct-api-dashboard/ACTUAL_RESULT.json",JSON.stringify({status:"PASS",priceDay:a.valuationAsOf,held:11,marketQuotes:m.brokerApiData?.quotes.length,fptPrice:fpt.price,fptPnl:fpt.unrealizedPnl,cash:a.cash,pendingDividends:a.pendingDividends,sourceReference:fpt.priceSource,capitalActionability:m.current?.actionability},null,2));
});
