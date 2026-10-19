import { describe, expect, it } from "vitest";
import { dashboardTitle, isDashboardScreen, navigation, supportsDashboardDetail } from "@/ui/navigation";

describe("dashboard route catalog", () => {
  it("keeps every navigation entry routable with a single title", () => {
    const entries = navigation.flatMap(group => group.items);
    expect(new Set(entries.map(([id]) => id)).size).toBe(entries.length);
    for (const [id, title] of entries) {
      expect(isDashboardScreen(id)).toBe(true);
      expect(dashboardTitle(id)).toBe(title);
    }
  });

  it("preserves hidden scorecard routes without adding a duplicate sidebar item", () => {
    expect(isDashboardScreen("scoring")).toBe(true);
    expect(supportsDashboardDetail("scoring")).toBe(true);
    expect(dashboardTitle("scoring")).toBe("Scorecards");
    expect(navigation.flatMap(group => group.items).some(([id]) => id === "scoring")).toBe(false);
  });

  it("rejects unknown routes and detail pages that have no artifact contract", () => {
    for (const value of ["__proto__", "constructor", "unknown", "settings/new", ""]) {
      expect(isDashboardScreen(value)).toBe(false);
      expect(supportsDashboardDetail(value)).toBe(false);
    }
    for (const value of ["dashboard", "risk", "performance", "settings", "imports", "vn30"]) {
      expect(isDashboardScreen(value)).toBe(true);
      expect(supportsDashboardDetail(value)).toBe(false);
    }
    expect(supportsDashboardDetail("data")).toBe(true);
  });
});
