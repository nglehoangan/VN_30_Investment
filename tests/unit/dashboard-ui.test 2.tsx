import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DashboardScreen, DecisionView, RankingView, ProposalView, ReviewView } from "@/ui/dashboard";
import { TransactionForm } from "@/ui/transaction-form";
import { emptyDashboard } from "@/application/dashboard/model";
import { decide } from "@/domain/decision/engine";
import { STATES } from "@/domain/decision/contracts";
import { monotonicDecision } from "../fixtures/decision";
import { rankingFixture } from "../fixtures/scoring";
import { rankScorecards } from "@/domain/ranking/rank";
import { workflowFixture } from "../fixtures/workflow";
import { sections } from "../fixtures/workflow";
import { createReview, WEEKLY_AREAS } from "@/domain/workflow/reviews";
import { reconstructPortfolio } from "@/domain/portfolio/reconstruct";
import { P, NOW, W0, history, deposit, at } from "../fixtures/portfolio/history";

describe("M6.7 authority-preserving UI", () => {
  it("renders authoritative exact accounting strings and distinct cash concepts", () => {
    const m = emptyDashboard(); m.state = reconstructPortfolio(P, history([deposit("one", "123456789.123456789012")]), NOW, W0, at(1));
    render(<DashboardScreen model={m} screen="holdings" />);
    expect(screen.getByText("123456789.123456789012")).toBeVisible();
    for (const name of ["Ledger cash (VND)", "Available cash", "Reserved / proposed cash", "Unallocated cash"]) expect(screen.getByText(name)).toBeVisible();
    expect(screen.getByText("No holdings recorded yet.")).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent("BLOCKED");
  });
  it("prominently blocks corrupt data without fabricated balances", () => {
    render(<DashboardScreen model={{ ...emptyDashboard(), status: "BLOCKED", message: "Integrity unavailable" }} />);
    expect(screen.getByRole("status")).toHaveTextContent("BLOCKED — integrity");
    expect(screen.getByRole("alert")).toHaveTextContent("Integrity unavailable");
  });
  it("uses exactly seven economic states", () => {
    expect(STATES).toEqual(["STRONG BUY", "BUY", "ACCUMULATE", "HOLD", "REDUCE", "SELL", "AVOID"]);
  });
  it("BUY remains BUY when execution requires cash accumulation", () => {
    const i = monotonicDecision(); i.portfolio.executableCash = "1";
    const d = decide(i); expect(d.decisionState).toBe("BUY");
    render(<DecisionView decision={d} />);
    expect(screen.getByText("BUY", { exact: true })).toBeVisible();
    expect(screen.getByText("REQUIRES CASH ACCUMULATION", { exact: true })).toBeVisible();
    expect(screen.getAllByRole("link", { name: d.lineage.scorecardId })[0]).toHaveAttribute("href", `/scoring/${d.lineage.scorecardId}`);
    expect(screen.getByRole("heading", { name: "Evidence & lineage" })).toBeVisible();
  });
  it("shows ranking exclusions, confidence, quality and near ties without trade control", () => {
    render(<RankingView ranking={rankScorecards(rankingFixture())} />);
    expect(screen.getByText(/Top 10 ≠ Buy list/)).toBeVisible();
    expect(screen.getByRole("columnheader", { name: "Confidence" })).toBeVisible();
    expect(screen.getByRole("columnheader", { name: "Data quality" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Near-tie information" })).toBeVisible();
    expect(screen.getAllByText("LOW_CONFIDENCE").length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /buy/i })).not.toBeInTheDocument();
  });
  it("HOLD CASH is successful and proposal remains distinct from execution", () => {
    const f = workflowFixture(1, i => { i.assessment.valuation.expectedReturn = "0.10"; i.assessment.valuation.lowerReturn = "0.08"; });
    const r = createReview(f); expect(r.proposal?.outcome).toBe("HOLD CASH");
    render(<ProposalView proposal={r.proposal!} />);
    expect(screen.getByText("HOLD CASH", { exact: true })).toBeVisible();
    expect(screen.getByText(/Holding cash is valid/)).toBeVisible();
    expect(screen.getByText(/Proposal ≠ Executed Transaction/)).toBeVisible();
    expect(screen.getByText("Residual / unallocated cash (VND)")).toBeVisible();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
  it("weekly NO ACTION is normal and annual review never mutates policy", () => {
    const f = workflowFixture(); f.command.type = "WEEKLY"; f.command.sections = sections(WEEKLY_AREAS); f.command.decisionIds = []; f.decisions = []; f.command.rankingId = null; f.ranking = null;
    const r = createReview(f); render(<ReviewView review={r} />);
    expect(screen.getByText(/NO ACTION is a normal/)).toBeVisible();
    expect(screen.getByText(/Annual review does not change policy/)).toBeVisible();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
  it("validates required manual input without invoking server", async () => {
    const action = vi.fn(); render(<TransactionForm action={action} />);
    fireEvent.click(screen.getByRole("button", { name: /Preview authoritative/ }));
    await waitFor(() => expect(screen.getByText(/Unique source.*required/)).toBeVisible());
    expect(action).not.toHaveBeenCalled();
  });
  it("prevents concurrent submits and safely displays server rejection", async () => {
    let resolve!: (value: { status: "ERROR"; message: string }) => void;
    const action = vi.fn(() => new Promise<{ status: "ERROR"; message: string }>(r => { resolve = r; }));
    const { container } = render(<TransactionForm action={action} />);
    fireEvent.change(screen.getByLabelText(/Occurred date/), { target: { value: "2026-01-01" } });
    fireEvent.change(screen.getByLabelText(/Unique source/), { target: { value: "source-1" } });
    fireEvent.change(screen.getByLabelText("Amount (VND)"), { target: { value: "100" } });
    fireEvent.click(screen.getByRole("button", { name: /Preview authoritative/ }));
    fireEvent.submit(container.querySelector("form")!);
    fireEvent.submit(container.querySelector("form")!);
    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("button", { name: "Validating…" })).toBeDisabled();
    resolve({ status: "ERROR", message: "Authoritative validation rejected this fact." });
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Authoritative validation rejected"));
  });
  it.each(["dashboard", "holdings", "vn30", "ranking", "scoring", "decisions", "dca", "reviews", "journal", "transactions", "audit", "data", "risk", "performance", "settings", "imports"])("%s handles empty state without purchase authorization", route => {
    render(<DashboardScreen model={emptyDashboard()} screen={route} />);
    expect(screen.getByRole("heading", { level: 1 })).toBeVisible();
    expect(screen.queryByRole("button", { name: /buy|execute|invest/i })).not.toBeInTheDocument();
  });
});

it("renders marginal authorization, stop reasons and substitution policy with supporting evidence", async () => {
  const { marginalFrame, marginalCommand, prefer, substitutionEvidence } = await import("../fixtures/marginal");
  const { assessMarginalAllocation } = await import("@/domain/decision/marginal");
  const f = workflowFixture(2, (i, n) => { i.portfolio.executableCash = "3000000"; if (n === 0) i.assessment.sizing.price = "40000"; });
  const frame = prefer(f, marginalFrame(f), 0); frame.substitutionEvidence = [substitutionEvidence(f)];
  const marginal = assessMarginalAllocation(marginalCommand(f, [frame, prefer(f, marginalFrame(f, [1]), 0)]), f.decisions, f.recordedAt);
  const r = createReview({ ...f, command: { ...f.command, marginalAllocationId: marginal.id }, marginalAllocation: marginal });
  render(<ProposalView proposal={r.proposal!} />);
  expect(screen.getByRole("heading", { name: "Step 0 · AUTHORIZED" })).toBeVisible();
  expect(screen.getByRole("heading", { name: "Step 1 · HOLD CASH" })).toBeVisible();
  expect(screen.getAllByText("Preferred candidate").length).toBe(2);
  const summaries = screen.getAllByText("Inspect substitution"); fireEvent.click(summaries[0]);
  await waitFor(() => expect(screen.getAllByText(marginal.steps[0].substitution!.policy)[0]).toBeVisible());
  expect(screen.getAllByText("Inspect supportingEvidence")[0]).toBeVisible();
});

it.each(["QUARTERLY", "ANNUAL", "EVENT_DRIVEN"] as const)("%s remains review authority without trade or policy control", type => {
  const f = workflowFixture(); f.command.type = type;
  if (type === "ANNUAL") f.command.governance = "POLICY REVIEW PROPOSAL REQUIRED";
  if (type === "EVENT_DRIVEN") f.command.triggers = [{ id: "event-1", category: "COMPANY", priority: "HARD RISK / SOLVENCY / GOVERNANCE", severity: "T4", effectiveAt: f.command.asOf, evidenceRefs: ["decision-evidence"], verified: true, decisionReady: true, governingRule: "Synthetic M5 event rule", affectedSecurityId: f.decisions[0].securityId, requiredEvidence: "Decision refresh", rationale: "Verified synthetic material event" }];
  const r = createReview(f); render(<ReviewView review={r} />);
  if (type === "EVENT_DRIVEN") expect(screen.getByText("ESCALATED", { exact: true })).toBeVisible();
  expect(screen.getByText(/Review Outcome ≠ Decision State/)).toBeVisible();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});
