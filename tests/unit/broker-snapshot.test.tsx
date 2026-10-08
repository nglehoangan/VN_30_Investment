import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { parseBrokerSnapshot } from "@/infrastructure/config/broker-snapshot";
import { BrokerSnapshotView, DashboardScreen } from "@/ui/dashboard";
import { emptyDashboard } from "@/application/dashboard/model";
import { brokerSnapshotFixture } from "../fixtures/broker-snapshot";

describe("imported broker observations", () => {
  it("retains restricted shares and separates receivable from cash", () => {
    const s = parseBrokerSnapshot(brokerSnapshotFixture());
    render(<BrokerSnapshotView snapshot={s} />);
    expect(screen.getByText("AAA_WFT")).toBeVisible();
    expect(screen.getByText("Chờ về", { exact: true })).toBeVisible();
    expect(screen.getByText(/Cổ tức chờ về là khoản phải thu/)).toBeVisible();
    expect(screen.getByText(s.holdingsAsOf)).toBeVisible();
    expect(screen.getByText(s.cashAsOf)).toBeVisible();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
  it("does not declare a current NAV or actionable portfolio when only a broker snapshot exists", () => {
    render(<DashboardScreen model={{ ...emptyDashboard(), status: "SUCCESS", brokerSnapshot: brokerSnapshotFixture() }} />);
    expect(screen.getByRole("heading", { name: "Dữ liệu danh mục Example Broker" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Chưa có dữ liệu đầu tư" })).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("BLOCKED / Unavailable");
    expect(screen.getByText(/chưa có NAV hiện tại/)).toBeVisible();
  });
  it("rejects double counting, altered totals, fractional shares and executable cash inflated by dividends", () => {
    const s = brokerSnapshotFixture();
    expect(() => parseBrokerSnapshot({ ...s, positions: [...s.positions, s.positions[0]] })).toThrow();
    expect(() => parseBrokerSnapshot({ ...s, cash: { ...s.cash, total: "701" } })).toThrow();
    expect(() => parseBrokerSnapshot({ ...s, cash: { ...s.cash, withdrawable: "700" } })).toThrow();
    expect(() => parseBrokerSnapshot({ ...s, positions: [{ ...s.positions[0], quantity: "100.5" }] })).toThrow();
    expect(() => parseBrokerSnapshot({ ...s, totals: { ...s.totals, tradeableQuantity: "110" } })).toThrow();
  });
});
