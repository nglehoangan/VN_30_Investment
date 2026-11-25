import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CATEGORY_MAXIMA, RUBRICS } from "@/domain/scoring/methodology";
import { scoreEconomicQuality, type EconomicQualityAssessment } from "@/domain/current-scoring/bq-eq-research";

const evidence = { required: ["checked"], supporting: [], rationale: "Reviewed and reconciled." };
const valid: EconomicQualityAssessment = {
  attempts: [{ route: "A", status: "SUPPORTED", rationale: "Normalized operating return." }],
  returns: { ...evidence, hurdle: "WACC", measure: "ROIC", comparable: true, leverageReviewed: true, relativeToHurdleEstablished: true },
  persistence: { ...evidence, fiscalYears: [2022, 2023, 2024, 2025], comparable: true },
  cost: { ...evidence, low: .12, high: .12, method: "WACC", assumptions: "Capital weights and risk inputs", sensitivity: "Stress tested", limitations: "Estimate" },
  margins: { ...evidence, material: true, contradictionResolved: true },
  counter: evidence,
  proposed: { band: "Good economics", points: 5, strongerEvidence: "", exceptionalJustification: "", durableSuperior: false },
};
const score = (patch: Partial<EconomicQualityAssessment> = {}, sector = "TECHNOLOGY") =>
  scoreEconomicQuality({ ...valid, ...patch }, sector, ref => ref === "checked");
const missed = {
  returns: { ...valid.returns, required: [] },
  persistence: { ...valid.persistence, fiscalYears: [2024, 2025] },
  cost: { ...valid.cost, assumptions: " " },
  margins: { ...valid.margins, contradictionResolved: false },
};
const unavailable = (route: "A" | "B" | "C") =>
  ({ route, status: "UNAVAILABLE", rationale: "Attempt reviewed" } as const);
const supported = (route: "B" | "C" | "D") =>
  ({ route, status: "SUPPORTED", rationale: "Attempt reviewed" } as const);
const command = ["tools/scoring/validate_fpt_bq_eq.mjs", "--ticker", "FPT"];

describe("BQ-EQ approved research baseline", () => {
  it("uses the registry weights and bands including the lower point", () => {
    expect(RUBRICS).toHaveLength(23);
    expect(Object.values(CATEGORY_MAXIMA).reduce((sum, value) => sum + value, 0)).toBe(100);
    expect(RUBRICS.find(row => row.id === "BQ-EQ")?.bands.map(row => [row.min, row.max]))
      .toEqual([[0, 0], [1, 2], [3, 4], [5, 6], [7, 8]]);
    expect(score()).toMatchObject({ points: 5, maxPoints: 8, route: "A", totalScore: null });
  });
  it("allows missing non-material margin support and a cost range", () => {
    expect(score({
      cost: { ...valid.cost, high: .15 },
      margins: { ...valid.margins, required: [], supporting: ["future"], material: false },
    }).points).toBe(5);
    expect(score({ margins: { ...valid.margins, required: [] } }).gaps).toContain("MARGINS");
  });
  it("supports sector equivalent, conservative range and combined returns", () => {
    expect(score({
      attempts: [unavailable("A"), supported("B")],
      returns: { ...valid.returns, measure: "ROE_ROTE", hurdle: "COST_OF_EQUITY" },
    }, "BANK").route).toBe("B");
    expect(score({
      attempts: [unavailable("A"), unavailable("B"), supported("C")],
      cost: { ...valid.cost, high: .15 },
    }).route).toBe("C");
    const attempts = [unavailable("A"), unavailable("B"), unavailable("C"), supported("D")];
    expect(score({ attempts, returns: { ...valid.returns, measure: "COMBINED" } }).route).toBe("D");
    expect(score({
      attempts, returns: { ...valid.returns, measure: "COMBINED", relativeToHurdleEstablished: false },
    }).points).toBeNull();
  });
  it.each(Object.entries(missed))("requires applicable %s", (key, value) => {
    expect(score({ [key]: value }).points).toBeNull();
  });
  it("rejects mismatched scope, leverage-driven ROE and unusable required or counter evidence", () => {
    expect(score({ returns: { ...valid.returns, comparable: false } }).points).toBeNull();
    expect(score({ returns: { ...valid.returns, measure: "ROE_ROTE", hurdle: "COST_OF_EQUITY" } }).points).toBeNull();
    expect(score({ returns: { ...valid.returns, leverageReviewed: false } }).points).toBeNull();
    expect(score({ returns: { ...valid.returns, required: ["checked", "future"] } }).points).toBeNull();
    expect(score({ counter: { ...evidence, required: ["future"] } }).points).toBeNull();
  });
  it("requires stronger evidence for upper points and exceptional durable economics for eight", () => {
    expect(score({ proposed: { ...valid.proposed!, points: 6 } }).gaps).toContain("UPPER_POINT_SUPPORT");
    expect(score({ proposed: { ...valid.proposed!, points: 8, band: "Consistently superior economics" } }).gaps)
      .toContain("MAXIMUM_PREREQUISITES");
  });
  it("allows eligible later evidence with still-comparable history", () => {
    const assessment = { ...valid, returns: { ...valid.returns, required: ["checked", "eligibleInterim"] } };
    expect(scoreEconomicQuality(assessment, "TECHNOLOGY", ref => ["checked", "eligibleInterim"].includes(ref)).points).toBe(5);
  });
  it("executes actual FPT evidence, replays the retained output and refuses publication flags", () => {
    const output = execFileSync(process.execPath, command, { encoding: "utf8" });
    expect(output).toBe(readFileSync("docs/fundamental-data-engine/fpt-bq-eq/2026-11-25/FPT_BQ_EQ_RESULT.json", "utf8"));
    const parsed = JSON.parse(output);
    expect(parsed.scope).toBe("REAL_ISSUER_RESEARCH");
    expect(parsed.results.map((stage: { executable: { points: number | null } }) => stage.executable.points)).toEqual([5, null]);
    expect(parsed.decisionEligible).toBe(false);
    expect(spawnSync(process.execPath, [...command, "--publish"]).status).toBe(1);
  });
});
