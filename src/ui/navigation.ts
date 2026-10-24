/** Route identity and navigation are shared by pages and presentation. */
const screens = [
  { id: "dashboard", title: "Dashboard", group: "Overview", detail: false },
  { id: "holdings", title: "Holdings", group: "Overview", detail: true },
  { id: "risk", title: "Risk", group: "Overview", detail: false },
  { id: "performance", title: "Performance", group: "Overview", detail: false },
  { id: "vn30", title: "VN30 Universe", group: "Research & Decisions", detail: true },
  { id: "ranking", title: "Scoring & Ranking", group: "Research & Decisions", detail: true },
  { id: "decisions", title: "Decision Center", group: "Research & Decisions", detail: true },
  { id: "dca", title: "DCA Planner", group: "Research & Decisions", detail: true },
  { id: "transactions", title: "Transactions", group: "Operations", detail: true },
  { id: "reviews", title: "Reviews", group: "Operations", detail: true },
  { id: "journal", title: "Journal", group: "Operations", detail: true },
  { id: "imports", title: "Imports", group: "Data", detail: false },
  { id: "data", title: "Data Freshness", group: "Data", detail: true },
  { id: "audit", title: "Audit / Methodology", group: "Data", detail: true },
  { id: "settings", title: "Settings", group: "Settings", detail: false },
  { id: "scoring", title: "Scorecards", group: null, detail: true },
] as const;

export type DashboardScreenId = typeof screens[number]["id"];

export const navigation = [...new Set(screens.map(s => s.group))]
  .filter(group => group !== null)
  .map(group => ({
    group,
    items: screens.filter(s => s.group === group).map(s => [s.id, s.title] as const),
  }));

export function isDashboardScreen(value: string): value is DashboardScreenId {
  return screens.some(s => s.id === value);
}

export function supportsDashboardDetail(value: string): value is DashboardScreenId {
  return screens.some(s => s.id === value && s.detail);
}

export function dashboardTitle(value: string) {
  return screens.find(s => s.id === value)?.title ?? "Unavailable";
}
