import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";
const evidence = path.resolve("docs/06_DASHBOARD/6.7 Dashboard UI/visual-evidence");
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
  await page.getByRole("link", { name: "Read recomputed holdings" }).click();
  await expect(page.getByText("10500", { exact: true })).toBeVisible();
});
for (const width of [1440, 390]) test(`major screens are usable at ${width}px with visual evidence`, async ({ page }) => {
  test.setTimeout(90000);
  mkdirSync(evidence, { recursive: true });
  await page.setViewportSize({ width, height: 1000 });
  for (const route of ["dashboard", "holdings", "vn30", "ranking", "scoring/score-SYNTHETIC-00", "decisions/workflow-decision-0", "dca/proposal-review", "reviews/hold-cash-review", "reviews/weekly-review", "reviews/quarterly-review", "reviews/annual-review", "reviews/event-review", "journal/hold-cash-review", "transactions", "transactions/new", "audit", "data", "risk", "performance", "settings"]) {
    await page.goto(`/${route}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("status").first()).toContainText("BLOCKED");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: path.join(evidence, `${width}-${route.replaceAll("/", "-")}.png`), fullPage: true });
  }
});
