import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { positiveDenominatorRatio, runFinancialStress, scoreFinancialHealth, timedLiquidity,
  type FinancialHealthAssessment } from "@/domain/current-scoring/fh-research";
import { scoreIncrementalFinancialHealth } from "@/domain/current-scoring/fh-incremental";

const root = "docs/fundamental-data-engine/fpt-financial-health/v1.0";
const command = ["tools/scoring/validate_fpt_financial_health.mjs", "--ticker", "FPT"];
const good = { refs: ["ok"], rationale: "Qualified evidence" };
const usable = (key: string) => key === "ok";
function assessment(id: FinancialHealthAssessment["id"]): FinancialHealthAssessment {
  return { id, topics: Object.fromEntries(["capital", "asset_quality", "funding", "leverage_context",
    "obligations", "liquidity", "maturities", "covenants", "scenario", "funding_response", "capital_response",
    "sensitivity"].map(name => [name, good])),
    method: "NONFINANCIAL", materialFunding: false, covenant: "NONDISCLOSURE_BOUNDED", timedCoverageEstablished: true,
    capitalConclusionEstablished: true, maximumSupported: false, exceptionalJustification: "", counter: { ...good, resolved: true },
    proposed: id === "FH-BS" ? { band: "Adequate", points: 3, strongerEvidence: false }
      : id === "FH-LIQ" ? { band: "Adequate with material refinancing dependence", points: 2, strongerEvidence: false }
      : { band: "Survives with material constraints", points: 3, strongerEvidence: false },
  };
}

it("keeps unusable EBITDA and interest denominators null", () => {
  expect(positiveDenominatorRatio(12, 6, true)).toBe(2);
  for (const denominator of [null, 0, -1]) expect(positiveDenominatorRatio(12, denominator, true)).toBeNull();
  expect(positiveDenominatorRatio(12, .01, false)).toBeNull();
});
it("requires asset quality and sector-specific funding rather than all optional topics", () => {
  const a = assessment("FH-BS");
  delete a.topics.funding;
  expect(scoreFinancialHealth(a, "TECHNOLOGY", usable).points).toBe(3);
  expect(scoreFinancialHealth(a, "BANK", usable).gaps).toContain("SECTOR_METHOD");
  a.method = "BANK";
  expect(scoreFinancialHealth(a, "BANK", usable).gaps).toContain("FUNDING");
  a.topics.funding = good;
  expect(scoreFinancialHealth(a, "BANK", usable).points).toBe(3);
  delete a.topics.asset_quality;
  expect(scoreFinancialHealth(a, "BANK", usable).points).toBeNull();
  a.proposed = { points: 6, band: "Strong", strongerEvidence: true };
  expect(scoreFinancialHealth(a, "BANK", usable).gaps).toContain("MAXIMUM_PREREQUISITES");
});
it("matches resources by timing, excludes restricted and uncommitted assets, and rejects overlaps", () => {
  const debts = [{ id: "early", amount: 8, month: 2 }, { id: "later", amount: 2, month: 12 }];
  const sources = [{ id: "free", amount: 5, month: 0, kind: "AVAILABLE" },
    { id: "line", amount: 8, month: 6, kind: "COMMITTED" },
    { id: "free2", amount: 99, month: 0, kind: "RESTRICTED" },
    { id: "refinance", amount: 99, month: 0, kind: "UNCOMMITTED" },
    { id: "book", amount: 99, month: 0, kind: "UNVERIFIED" }] as const;
  expect(timedLiquidity(debts, sources)).toMatchObject([{ month: 2, surplus: -3 }, { month: 12, surplus: 3 }]);
  expect(() => timedLiquidity(debts, [...sources, sources[0]])).toThrow("INVALID_OR_OVERLAPPING_LIQUIDITY_ITEM");
});
it("accepts bounded covenant nondisclosure through PX01 for a lower band and blocks breach or maximum", () => {
  const a = assessment("FH-LIQ");
  expect(scoreFinancialHealth(a, "TECHNOLOGY", usable)).toMatchObject({ points: 2, route: "PX01" });
  a.proposed = { points: 4, band: "Resilient liquidity and diversified funding", strongerEvidence: true };
  a.maximumSupported = true;
  a.exceptionalJustification = "Otherwise strong";
  expect(scoreFinancialHealth(a, "TECHNOLOGY", usable).gaps).toContain("PX01_NOT_ELIGIBLE");
  a.covenant = "BREACH_RISK";
  a.timedCoverageEstablished = false;
  expect(scoreFinancialHealth(a, "TECHNOLOGY", usable).gaps)
    .toEqual(expect.arrayContaining(["MATCHED_TIMING_UNRESOLVED", "COVENANT_DISPOSITION_UNRESOLVED"]));
});
it("replays a severe analyst scenario with funding sensitivity, and requires a capital conclusion", () => {
  const x = { revenue: 100, contraction: .25, margin: .1, tax: .2, workingCapitalRate: .05, interest: 2,
    debt: 20, rateShock: .03, capex: 3, principal: 10, operatingLease: 1, openingLiquidity: 12, committedFunding: 0 };
  const outcome = runFinancialStress(x);
  expect(outcome).toMatchObject({ stressedRevenue: 75, ebit: 7.5, stressedInterest: 2.6, workingCapital: 3.75 });
  expect(outcome.surplus).toBeLessThan(0);
  expect(runFinancialStress({ ...x, committedFunding: 5 }).surplus).toBeGreaterThan(0);
  const a = assessment("FH-STRESS");
  expect(scoreFinancialHealth(a, "TECHNOLOGY", usable).points).toBe(3);
  a.capitalConclusionEstablished = false;
  a.proposed = { points: 5, band: "Robust survival without distressed capital actions", strongerEvidence: true };
  expect(scoreFinancialHealth(a, "TECHNOLOGY", usable).gaps).toEqual(
    expect.arrayContaining(["CAPITAL_CONCLUSION_UNRESOLVED", "MAXIMUM_PREREQUISITES"]));
});
it("does not use a historical funding assessment after rollover, expiry or covenant warnings", () => {
  const packet = JSON.parse(readFileSync(`${root}/FPT_FH_INPUT.json`, "utf8"));
  const input: Parameters<typeof scoreIncrementalFinancialHealth>[0] = { ...packet.cases[0].assessment, evidence: packet.evidence };
  input.reassessment.assessment.proposed = null;
  const options = { historicalUsableThrough: null, nearTermFundingUnrepresentative: false, reason: "Scoped" };
  const provisional = scoreIncrementalFinancialHealth(input, options);
  expect(provisional.effectiveScore).toMatchObject({ points: 3, validity: "PROVISIONAL" });
  expect(scoreIncrementalFinancialHealth(input, { ...options, historicalUsableThrough: "2026-10-01" }).effectiveScore.points).toBeNull();
  expect(scoreIncrementalFinancialHealth(input, { ...options, nearTermFundingUnrepresentative: true }).effectiveScore.points).toBeNull();
  input.reassessment.assessment.covenant = "BREACH_RISK";
  expect(scoreIncrementalFinancialHealth(input, options).effectiveScore.points).toBeNull();
  input.baseline!.economicCutoff = "2026-11-14";
  expect(scoreIncrementalFinancialHealth(input, options).latestValidAssessment).toBeNull();
});
it("replays the exact real FPT result, preserves incomplete FH and declines publication", () => {
  const stdout = execFileSync(process.execPath, command, { encoding: "utf8" });
  expect(stdout).toBe(readFileSync(`${root}/FPT_FH_RESULT.json`, "utf8"));
  const result = JSON.parse(stdout);
  expect(result.fh.map((row: { baseline: { points: number | null }; current: { points: number | null }; effectiveScore: { points: number | null } }) =>
    [row.baseline.points, row.current.points, row.effectiveScore.points])).toEqual([[3, 3, 3], [null, null, null], [null, null, null]]);
  expect(result.aggregation).toMatchObject({ assessedPoints: 17, ratedWeight: 31, theoreticalMaximum: 100,
    formalScore: null, provisionalInvestmentScore: null, genuineNrInScope: ["FH-LIQ", "FH-STRESS"] });
  expect(result.aggregation.outsideRollout).toHaveLength(16);
  expect(result.financials.current).toMatchObject({ restrictedCash: null, qualifiedNetDebt: null });
  expect(spawnSync(process.execPath, [...command, "--publish"]).status).toBe(1);
});

it("accepts lower-band economically matched maturity buckets without exact intra-bucket dates", () => {
  const a = assessment("FH-LIQ");
  a.topics.maturities = { ...good, rationale: "Disclosed buckets with matched conservative resource position" };
  a.topics.covenants = { ...good, rationale: "Nondisclosure immaterial under the conservatively supported funding case" };
  expect(scoreFinancialHealth(a, "TECHNOLOGY", usable)).toMatchObject({ points: 2, route: "PX01" });
  a.timedCoverageEstablished = false;
  expect(scoreFinancialHealth(a, "TECHNOLOGY", usable)).toMatchObject({ points: null, gaps: ["MATCHED_TIMING_UNRESOLVED"] });
});

it("allows evidenced severe vulnerability without proving successful funding or a robust capital response", () => {
  const a = assessment("FH-STRESS");
  a.proposed = { band: "Severe stress vulnerability", points: 2, strongerEvidence: false };
  a.topics.capital_response = { ...good, rationale: "Qualified constrained funding and independently established material capital pressure" };
  a.topics.funding_response = { ...good, rationale: "Supported funding deficit across defensible resource range" };
  delete a.topics.sensitivity;
  expect(scoreFinancialHealth(a, "TECHNOLOGY", usable).points).toBe(2);
  a.capitalConclusionEstablished = false;
  expect(scoreFinancialHealth(a, "TECHNOLOGY", usable)).toMatchObject({ points: null, gaps: ["CAPITAL_CONCLUSION_UNRESOLVED"] });
});
