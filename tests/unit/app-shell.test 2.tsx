import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { emptyDashboard } from "@/application/dashboard/model";
vi.mock("../../app/server/dashboard", async () => {
  const { emptyDashboard } = await import("@/application/dashboard/model");
  return { loadDashboard: vi.fn(async () => emptyDashboard()) };
});
import Home from "../../app/page";
import { loadDashboard } from "../../app/server/dashboard";
describe("application shell server-page boundary", () => {
  it("identifies the product and clearly shows that investment data is absent", async () => {
    vi.mocked(loadDashboard).mockResolvedValueOnce(emptyDashboard());
    render(await Home());
    expect(screen.getByRole("heading", { level: 1, name: "VN30 Value Investing OS" })).toBeVisible();
    expect(screen.getByRole("region", { name: "Chưa có dữ liệu đầu tư" })).toBeVisible();
  });
  it("renders a blocked authoritative read without leaking diagnostic details", async () => {
    vi.mocked(loadDashboard).mockResolvedValueOnce({ ...emptyDashboard(), status: "BLOCKED", message: "Integrity could not be verified." });
    render(await Home());
    expect(screen.getByRole("status")).toHaveTextContent("BLOCKED — integrity");
    expect(screen.getByRole("alert")).toHaveTextContent("Integrity could not be verified.");
    expect(screen.queryByText(/sqlite|password|SQL/)).not.toBeInTheDocument();
  });
});
