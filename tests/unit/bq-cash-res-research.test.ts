import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { cumulativeCashConversion, scoreBusinessResilience, scoreCashRealization,
  type CashAssessment, type ResilienceAssessment } from "@/domain/current-scoring/bq-cash-res-research";
import { scoreIncrementalCashRealization } from "@/domain/current-scoring/bq-cash-res-incremental";

const dir = "docs/fundamental-data-engine/fpt-business-quality/v1.0";
const command = ["tools/scoring/validate_fpt_business_quality.mjs", "--ticker", "FPT"];
const obs = { refs: ["good"], rationale: "Qualified scoped evidence" };
const active = { ...obs, material: true, resolved: true };
const optional = { refs: [], rationale: "Immaterial at selected band", material: false, resolved: false };
const usable = (ref: string) => ref === "good";
const choose = (band: string, points: number) => ({
  band, points, strongerEvidence: false, maximumPrerequisitesMet: false, exceptionalJustification: "",
});
const cash: CashAssessment = {
  realization: { ...obs, route: "CASH_FLOW", comparable: true },
  recognition: obs, oneOffs: active, workingCapital: active, capex: { ...optional, splitAvailable: false },
  exceptional: { refs: [], rationale: "Unavailable" }, counter: { ...obs, resolved: true },
  proposed: choose("Adequate realization with material qualifications", 3),
};
const res: ResilienceAssessment = {
  concentration: { ...obs, basis: "QUALIFIED_ALTERNATIVE", customerShare: null, mitigation: obs },
  cyclicality: obs, pricing: optional,
  stress: { ...obs, basis: "UNAVAILABLE", severePlausible: false, franchiseProtected: false, noDistressedCapital: false },
  proposed: choose("Balanced resilience", 3), counter: { ...obs, resolved: true },
};

it("calculates cumulative conversion from sum of earnings and cash flows using total CAPEX", () => {
  const a = { period: "2024", cashScope: "consolidated", earningsScope: "consolidated",
    cfo: 120, capex: 20, earnings: 100, meaningfulEarnings: true };
  const b = { ...a, period: "2025", cfo: 60, capex: 30, earnings: 80 };
  expect(cumulativeCashConversion([a, b])).toMatchObject({ cfo: 180, capex: 50, earnings: 180, fcf: 130, cfoConversion: 1 });
  for (const invalid of [
    { ...b, earningsScope: "parent" }, { ...b, cashScope: "post", earningsScope: "post" },
    { ...b, earnings: -2 }, { ...b, earnings: 0 }, { ...b, earnings: 1, meaningfulEarnings: false }, { ...b, earnings: null },
  ]) expect(cumulativeCashConversion([a, invalid])).toBeNull();
});

it("scores qualified lower-band cash evidence without a CAPEX split or immaterial optional detail", () => {
  expect(scoreCashRealization({ ...cash, oneOffs: optional }, "TECHNOLOGY", usable).points).toBe(3);
  expect(scoreCashRealization({ ...cash, capex: { ...active, splitAvailable: false } }, "TECHNOLOGY", usable).gaps).toContain("CAPEX");
});

it("rejects incompatible cash and earnings scopes, unresolved working capital and abnormal recognition", () => {
  expect(scoreCashRealization({ ...cash, realization: { ...cash.realization, comparable: false },
    recognition: { ...obs, refs: [] }, oneOffs: { ...active, resolved: false }, workingCapital: { ...active, resolved: false },
  }, "TECHNOLOGY", usable)).toMatchObject({ points: null, gaps: ["REALIZATION", "RECOGNITION", "ONE_OFFS", "WORKING_CAPITAL"] });
});

it.each([["BANK", "BANK_RECOGNITION"], ["REAL_ESTATE", "PROPERTY_COLLECTIONS"]] as const)(
  "accepts appropriate %s recognition or collection evidence", (sector, route) => {
    expect(scoreCashRealization(cash, sector, usable).points).toBeNull();
    expect(scoreCashRealization({ ...cash, realization: { ...cash.realization, route } }, sector, usable).points).toBe(3);
  },
);

it("requires within-band evidence and exceptional support for a cash maximum", () => {
  expect(scoreCashRealization({ ...cash, proposed: choose("Strong recurring realization and adjustment quality", 6) },
    "TECHNOLOGY", usable).gaps).toEqual(["STRONGER_EVIDENCE_REQUIRED", "MAXIMUM_PREREQUISITES", "EXCEPTIONAL_REALIZATION"]);
});

it("uses disclosed alternative concentration and observed cyclical evidence without maximum stress requirements", () => {
  expect(scoreBusinessResilience(res, "TECHNOLOGY", usable).points).toBe(3);
  expect(scoreBusinessResilience({ ...res, proposed: choose("Material vulnerabilities", 2) }, "TECHNOLOGY", usable).points).toBe(2);
  expect(scoreBusinessResilience({ ...res, concentration: { ...res.concentration, customerShare: 0 } },
    "TECHNOLOGY", usable).gaps).toContain("CONCENTRATION");
  expect(scoreBusinessResilience({ ...res, concentration: { ...res.concentration, basis: "UNDISCLOSED" } },
    "TECHNOLOGY", usable).points).toBeNull();
});

it("keeps material client concentration and pricing pressure in the score gate", () => {
  const concentration = { ...res.concentration, basis: "REVENUE_DISCLOSED" as const, customerShare: .32,
    mitigation: { ...obs, refs: [] } };
  const pricing = { ...active, resolved: false };
  expect(scoreBusinessResilience({ ...res, concentration, pricing }, "TECHNOLOGY", usable))
    .toMatchObject({ points: null, gaps: ["CONCENTRATION_MITIGATION", "PRICING"] });
  expect(scoreBusinessResilience({ ...res, concentration, proposed: choose("Material vulnerabilities", 2) },
    "TECHNOLOGY", usable).points).toBe(2);
});

it("requires severe-stress franchise protection, no distressed capital and counterevidence for a resilience maximum", () => {
  expect(scoreBusinessResilience({ ...res, proposed: choose("Proven stress-resilient franchise", 5),
    counter: { ...obs, resolved: false } }, "TECHNOLOGY", usable).gaps)
    .toEqual(["COUNTEREVIDENCE", "MAXIMUM_PREREQUISITES", "STRESS", "SEVERE_STRESS_PROTECTION"]);
});

it("uses the shared lifecycle for a valid current cash update and confirmed adverse invalidation", () => {
  const packet = JSON.parse(readFileSync(`${dir}/FPT_BUSINESS_QUALITY_INPUT.json`, "utf8"));
  const input: Parameters<typeof scoreIncrementalCashRealization>[0] = { ...packet.cash, evidence: packet.sourceBindings };
  expect(scoreIncrementalCashRealization(input)).toMatchObject({
    baseline: { points: 3 }, current: { points: null, updateStatus: "MATERIAL_REVIEW_PENDING" },
    effectiveScore: { points: 3, validity: "PROVISIONAL" },
  });
  input.review.changes = input.review.changes.map(row => row.topic === "returns"
    ? { ...row, status: "MATERIAL_INVALIDATING" } : row);
  expect(scoreIncrementalCashRealization(input).effectiveScore.points).toBeNull();
  input.reassessment.assessment = { ...input.baseline!.assessment,
    realization: { ...input.baseline!.assessment.realization, refs: ["q3"] },
    counter: { refs: ["q3"], rationale: "Current adverse causes addressed", resolved: true },
    proposed: choose("Weak realization with recurring adverse adjustments", 1),
  };
  expect(scoreIncrementalCashRealization(input)).toMatchObject({
    current: { points: 1, updateStatus: "UPDATED" }, effectiveScore: { points: 1, validity: "CONFIRMED_CURRENT" },
  });
});

it("executes both FPT rubrics and forwards all four Effective Scores without production authority", () => {
  const output = execFileSync(process.execPath, command, { encoding: "utf8" });
  expect(output).toBe(readFileSync(`${dir}/FPT_BUSINESS_QUALITY_RESULT.json`, "utf8"));
  const result = JSON.parse(output);
  const ids = [{ id: "BQ-EQ", points: 5 }, { id: "BQ-MOAT", points: 3 }, { id: "BQ-CASH", points: 3 }, { id: "BQ-RES", points: 3 }];
  expect(result).toMatchObject({
    scope: "REAL_ISSUER_RESEARCH", cash: { baseline: { points: 3 }, current: { points: null } },
    resilience: { baseline: { points: 3 }, current: { points: null } },
    aggregation: { theoreticalMaximum: 100, provisionalInvestmentScore: null, formalScore: null,
      businessQuality: { points: 14, max: 25, ratedWeight: 25, validity: "PROVISIONAL", effectiveRubricCount: 4 },
      coverage: { effective: { count: 4, weight: 25 }, confirmedCurrent: { count: 1, weight: 6 },
        provisional: { count: 3, weight: 19 }, genuineNR: { count: 19, weight: 75 } } },
    researchRanking: [{ rank: null, effectiveScores: ids }],
    investmentDecisionInput: { effectiveScores: ids, effectiveBusinessQuality: { points: 14, validity: "PROVISIONAL" },
      gates: { stage0: "UNKNOWN", hardVeto: "PENDING", residualRisk: "NOT_RATED" }, formalDecisionAuthorized: false },
    publicationAuthorized: false,
  });
  expect(result.financials.current).toMatchObject({ reportedNpat: 7776442470351, normalizedNpat: null, fcf: -1076823273213 });
  const html = execFileSync(process.execPath, [...command, "--html"], { encoding: "utf8" });
  for (const value of ["Business Quality 14/25", "Coverage 4/23", "BQ-CASH", "BQ-RES", "PROVISIONAL", "Current reassessment N/R"])
    expect(html).toContain(value);
  expect(spawnSync(process.execPath, [...command, "--publish"]).status).toBe(1);
}, 25000);
