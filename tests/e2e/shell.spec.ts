import { test, expect } from "@playwright/test";
test("production dashboard shows its isolated synthetic state without external requests or browser errors", async ({ page, baseURL }) => {
  const external: string[] = [], errors: string[] = [];
  page.on("pageerror", error => errors.push(error.name));
  await page.route("**/*", route => {
    if (new URL(route.request().url()).origin !== baseURL) {
      external.push("external request"); return route.abort();
    }
    return route.continue();
  });
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "VN30 Value Investing OS", exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "Attention needed" })).toBeVisible();
  await expect(page.getByText(/SYNTHETIC TEST ONLY — not a real portfolio/)).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "VN30 Value Investing OS", exact: true })).toBeVisible();
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});
