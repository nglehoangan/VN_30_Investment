import { test, expect } from "@playwright/test";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
const evidence = path.resolve(process.env.VN30_VALIDATION_VISUAL_DIRECTORY ?? "docs/06_DASHBOARD/6.7.1 Current Read Model/visual-evidence");
test("portfolio → holding → decision → score evidence preserves lineage", async ({ page }) => {
  await page.goto("/holdings");
  await expect(page.getByRole("columnheader", { name: "Cost basis (VND)" })).toBeVisible();
  await page.getByRole("link", { name: "SYNTHETIC-00", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Holdings", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "workflow-decision-0", exact: true }).click();
  await expect(page.getByText("BUY", { exact: true })).toBeVisible();
  await expect(page.getByText("REQUIRES CASH ACCUMULATION", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "score-SYNTHETIC-00" }).first().click();
  await expect(page.getByRole("heading", { name: "Category and subcategory scores" })).toBeVisible();
});
test("monthly HOLD CASH and marginal proposal inspection create no transactions", async ({ page }) => {
  await page.goto("/transactions"); const before = await page.locator("tbody tr").count();
  await page.goto("/reviews/hold-cash-review");
  await expect(page.getByText("HOLD CASH", { exact: true })).toBeVisible();
  await expect(page.getByText(/Proposal ≠ Executed Transaction/)).toBeVisible();
  await page.goto("/dca/marginal-review");
  await expect(page.getByRole("heading", { name: /Step 0/ })).toBeVisible();
  await expect(page.getByText("Residual / unallocated cash (VND)")).toBeVisible();
  await page.goto("/dca/proposal-review");
  await expect(page.getByRole("heading", { name: "Proposed lots" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Step 0 · AUTHORIZED" })).toBeVisible();
  await expect(page.getByText(/Proposal ≠ Executed Transaction/)).toBeVisible();
  await page.goto("/transactions"); expect(await page.locator("tbody tr").count()).toBe(before);
});
test("manual contribution → preview → confirm → authoritative ledger and cash", async ({ page }) => {
  mkdirSync(evidence, { recursive: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/transactions/new");
  await page.getByLabel(/Occurred date/).fill("2026-01-03");
  await page.getByLabel(/Unique source/).fill("e2e-manual-contribution");
  await page.getByLabel("Amount (VND)", { exact: true }).fill("500");
  await page.getByRole("button", { name: "Preview authoritative accounting effect" }).click();
  await expect(page.getByRole("heading", { name: "Confirm accounting-changing action" })).toBeVisible();
  await page.screenshot({ path: path.join(evidence, "1440-transaction-confirmation.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 1000 });
  await page.screenshot({ path: path.join(evidence, "390-transaction-confirmation.png"), fullPage: true });
  await page.getByRole("button", { name: "Confirm transaction" }).click();
  await expect(page.getByText(/Transaction recorded/)).toBeVisible();
  const sourceFile = path.join(path.dirname(process.env.VN30_E2E_DATABASE!), "current-source.json");
  const source = JSON.parse(readFileSync(sourceFile, "utf8"));
  source.version = "synthetic-price-2"; source.ledgerWatermark = "3"; source.asOf = new Date().toISOString(); source.receivedAt = source.asOf; source.reconciliation.asOf = source.asOf; source.reconciliation.receivedAt = source.asOf; source.reconciliation.cash = "10500";
  writeFileSync(sourceFile, JSON.stringify(source));
  await page.getByRole("link", { name: "Read recomputed holdings" }).click();
  await expect(page.getByText("10500", { exact: true })).toBeVisible();
});
for (const width of [1440, 390]) test(`major screens are usable at ${width}px with visual evidence`, async ({ page }) => {
  test.setTimeout(90000);
  mkdirSync(evidence, { recursive: true });
  await page.setViewportSize({ width, height: 1000 });
  for (const route of ["dashboard", "holdings", "vn30", "ranking", "scoring/score-SYNTHETIC-00", "decisions/workflow-decision-0", "dca/proposal-review", "reviews/hold-cash-review", "reviews/weekly-review", "reviews/quarterly-review", "reviews/annual-review", "reviews/event-review", "journal/hold-cash-review", "transactions", "transactions/new", "audit", "data", "risk", "performance", "settings", "reviews", "reviews/new"]) {
    await page.goto(`/${route}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("status").first()).toContainText("BLOCKED");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: path.join(evidence, `${width}-${route.replaceAll("/", "-")}.png`), fullPage: true });
  }
});

for (const width of [1440,390]) test(`review readiness fails closed for synthetic sources at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:1000});await page.goto("/reviews/new");
 await page.getByLabel(/Requested date/).fill(new Date().toISOString().slice(0,10));
 await page.getByRole("button",{name:"Preview review readiness"}).click();
 await expect(page.getByRole("heading",{name:"Review readiness · BLOCKED"})).toBeVisible();
 await expect(page.getByRole("button",{name:"Create formal review"})).toHaveCount(0);
 await page.screenshot({path:path.join(evidence,`${width}-review-readiness-blocked.png`),fullPage:true});
});

for (const width of [1440,390]) test(`keyboard and form status remain accessible at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:1000});await page.goto("/transactions/new");await expect(page.locator("#main")).toBeVisible();
 await page.keyboard.press("Tab");const skip=page.getByRole("link",{name:"Skip to content"});await expect(skip).toBeFocused();await expect(skip).toBeVisible();
 const outline=await skip.evaluate(element=>getComputedStyle(element).outlineWidth);expect(outline).toBe("3px");
 await page.keyboard.press("Enter");await expect(page.locator("#main")).toBeFocused();
 const button=page.getByRole("button",{name:"Preview authoritative accounting effect"});await button.focus();await page.keyboard.press("Enter");
 const date=page.getByLabel(/Occurred date/);await expect(date).toHaveAttribute("aria-invalid","true");const description=await date.getAttribute("aria-describedby");expect(description).toBe("date-error");await expect(page.locator("#date-error")).toContainText("required");
 await page.goto("/transactions");const headers=page.getByRole("columnheader");await expect(headers.first()).toBeVisible();expect(await headers.count()).toBeGreaterThan(0);for(const header of await headers.all())await expect(header).toHaveAttribute("scope","col");
 const table=page.locator(".table-scroll").first();await table.focus();await expect(table).toBeFocused();
});
