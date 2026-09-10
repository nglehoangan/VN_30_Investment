import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "../../app/page";
describe("application shell", () => {
  it("identifies the product and clearly shows that investment data is absent", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { level: 1, name: "VN30 Value Investing OS" })).toBeVisible();
    expect(screen.getByRole("region", { name: "Chưa có dữ liệu đầu tư" })).toBeVisible();
  });
});
