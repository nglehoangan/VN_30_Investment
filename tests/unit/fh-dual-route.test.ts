import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { scoreDualRouteFinancialHealth, scoreIncrementalDualRouteFinancialHealth,
  type DualFinancialHealth } from "@/domain/current-scoring/fh-dual-route";

const observation = { refs: ["ok"], rationale: "Qualified independent evidence" };
const usable = (ref: string) => ref === "ok";
const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const dir = "docs/fundamental-data-engine/fpt-financial-health/dual-route-v1.1";
const command = ["tools/scoring/validate_fpt_fh_dual_route.mjs", "--ticker", "FPT"];

function fixture(id: DualFinancialHealth["full"]["id"]): DualFinancialHealth {
  return {
    fullDisposition: "INSUFFICIENT_DETAIL",
    full: { id, topics: Object.fromEntries(["obligations","liquidity","maturities","covenants","scenario","funding_response",
      "capital_response"].map(k => [k, { ...observation }])), method: "NONFINANCIAL", materialFunding: true,
      timedCoverageEstablished: false, covenant: "NONDISCLOSURE_BOUNDED", capitalConclusionEstablished: false,
      maximumSupported: false, exceptionalJustification: "", counter: { ...observation, resolved: true }, proposed: null },
    basic: { topics: Object.fromEntries(["resources","obligations","refinancing","restrictionReview","covenantReview",
      "severeScenario","earningsAndInterest","cashAndCapex","bufferAndMaturity","fundingAndCapital"].map(k => [k, { ...observation }])),
      cashBasis: "BOOK_PROXY_REVIEWED", restrictedCashExcluded: true, unsupportedFundingExcluded: true,
      obligationsPreserved: true, materialAdverseEvidenceUnresolved: false,
      conclusion: id === "FH-LIQ" ? "ADEQUATE_DEPENDENT" : "SEVERE_VULNERABILITY",
      demonstratedIndependentOfUnsupportedAssumptions: true, counter: { ...observation, resolved: true },
      proposed: id === "FH-LIQ" ? { band: "Adequate with material refinancing dependence", points: 2 }
        : { band: "Severe stress vulnerability", points: 2 } },
  };
}
const score = (a: DualFinancialHealth) => scoreDualRouteFinancialHealth(a, "TECHNOLOGY", usable);
it("takes a qualified lower B score ahead of a potentially higher A score", () => {
  const a = fixture("FH-LIQ");
  expect(score(a)).toMatchObject({ points: 2, assessmentMethod: "A_BASIC", maximumEligiblePoints: 3 });
  a.full.timedCoverageEstablished = true;
  a.full.proposed = { band: "Severe funding dependence", points: 1, strongerEvidence: false };
  expect(score(a)).toMatchObject({ points: 1, assessmentMethod: "B_FULL", maximumEligiblePoints: 4,
    routes: { A: { evaluated: false } } });
});
it("rejects fallback after adverse B evidence, material covenant risk or invalid evidence", () => {
  const a = fixture("FH-LIQ");
  a.fullDisposition = "KNOWN_ADVERSE";
  expect(score(a).routes.A.evaluated).toBe(false);
  a.fullDisposition = "INSUFFICIENT_DETAIL";
  a.full.covenant = "BREACH_RISK";
  expect(score(a).routes.A.evaluated).toBe(false);
  a.full.covenant = "UNRESOLVED";
  a.full.counter.resolved = false;
  expect(score(a).routes.A.evaluated).toBe(false);
});
it.each([["FH-LIQ", 4, "Resilient liquidity and diversified funding"],
  ["FH-STRESS", 5, "Robust survival without distressed capital actions"]] as const)("enforces the %s Method A ceiling without clipping", (id, points, band) => {
  const a = fixture(id);
  a.basic.proposed = { band, points };
  expect(score(a)).toMatchObject({ points: null, routes: { A: { maximumEligiblePoints: points - 1,
    gaps: expect.arrayContaining(["BASIC_CEILING_EXCEEDED"]) } } });
});
it("rejects restricted cash, unverified funding and speculative stress conclusions", () => {
  const a = fixture("FH-STRESS");
  expect(score(a)).toMatchObject({ points: 2, assessmentMethod: "A_BASIC" });
  a.basic.restrictedCashExcluded = false;
  expect(score(a).gaps).toContain("BASIC_FUNDING_OR_SCOPE_NOT_QUALIFIED");
  a.basic.restrictedCashExcluded = true;
  a.basic.unsupportedFundingExcluded = false;
  expect(score(a).points).toBeNull();
  a.basic.unsupportedFundingExcluded = true;
  a.basic.proposed = { points: 4, band: "Resilient with manageable constraints" };
  expect(score(a).gaps).toContain("BASIC_BAND_CONCLUSION_MISMATCH");
  a.basic.conclusion = "SURVIVAL";
  a.basic.demonstratedIndependentOfUnsupportedAssumptions = false;
  expect(score(a).gaps).toContain("BASIC_ECONOMIC_CONCLUSION_NOT_ESTABLISHED");
});
it("prioritizes an eligible current B replacement after an A baseline and respects historical freshness", () => {
  const packet = read("docs/fundamental-data-engine/fpt-financial-health/v1.0/FPT_FH_INPUT.json");
  const original = packet.cases[1].assessment;
  const a = fixture("FH-LIQ");
  const b = fixture("FH-LIQ");
  const bind = (value: DualFinancialHealth, ref: string) => {
    for (const topic of [...Object.values(value.full.topics), ...Object.values(value.basic.topics),
      value.full.counter, value.basic.counter]) topic.refs = [ref];
    return value;
  };
  b.full.timedCoverageEstablished = true;
  b.full.proposed = { band: "Severe funding dependence", points: 1, strongerEvidence: false };
  const input = { ...original, evidence: packet.evidence,
    baseline: { ...original.baseline, assessment: bind(a, "fyLiq") },
    reassessment: { ...original.reassessment, assessment: bind(b, "q3") },
  };
  const policy = { historicalUsableThrough: null, nearTermFundingUnrepresentative: false, reason: "Qualified review" };
  expect(scoreIncrementalDualRouteFinancialHealth(input, policy)).toMatchObject({
    baseline: { points: 2, assessmentMethod: "A_BASIC" }, current: { points: 1, assessmentMethod: "B_FULL" },
    effectiveScore: { points: 1, validity: "CONFIRMED_CURRENT" },
  });
  b.full.timedCoverageEstablished = false;
  b.full.proposed = null;
  b.basic.proposed = null;
  expect(scoreIncrementalDualRouteFinancialHealth(input, { ...policy, historicalUsableThrough: "2026-10-01" }))
    .toMatchObject({ freshness: { expired: true }, effectiveScore: { points: null } });
});
it("executes retained FPT evidence independently for both windows/route ceilings", () => {
  const result = execFileSync(process.execPath, command, { encoding: "utf8" });
  expect(result).toBe(readFileSync(`${dir}/FPT_FH_DUAL_ROUTE_RESULT.json`, "utf8"));
  const parsed = JSON.parse(result);
  for (const row of parsed.fh.slice(1)) for (const stage of [row.baseline, row.current])
    expect(stage).toMatchObject({ routes: { A: { evaluated: true, points: null }, B: { points: null } },
      assessmentMethod: null });
  expect(parsed.aggregation).toMatchObject({ assessedPoints: 17, ratedWeight: 31, provisionalInvestmentScore: null,
    coverage: { genuineNR: { count: 2, weight: 9 }, outsideRollout: { count: 16, weight: 60 } } });
  expect(spawnSync(process.execPath, [...command, "--publish"]).status).toBe(1);
});
