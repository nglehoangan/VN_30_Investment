import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { evaluateValuation, marginOfSafety, ownerEarningsDcf, reverseGrowth, returnBand, shareholderIrr,
  valuationMethods, type ValuationReview } from "@/domain/current-scoring/valuation-research";

const dir = "docs/fundamental-data-engine/fpt-valuation-forward-return/v1.0";
const command = ["tools/scoring/validate_fpt_valuation.mjs", "--ticker", "FPT"];
const read = (name: string) => JSON.parse(readFileSync(`${dir}/${name}`, "utf8"));
const base = { eps: 5000, growth: .10, payout: .20, dilution: .007, exitMultiple: 10 };
const point = (basisPrice: number, points: number, band: string) => ({ basisPrice, basisShares: 1885727648, points, band, strongerEvidence: false,
  rationale: "Synthetic quantitative valuation", higher: "Not supported", lower: "Not supported" });

function fixture(price = 50000): ValuationReview {
  const input = structuredClone(read("FPT_VALUATION_ASSESSMENT.json").stages.current) as ValuationReview;
  input.market = { ticker: "FPT", exchange: "HOSE", date: input.cutoff, price, shares: 1885727648, rawField: "GiaDongCua",
    shareBasis: "SYNTHETIC_UNCHANGED_BASIS", verifiedPrice: true, verifiedShares: true, evidence: "SYNTHETIC_TEST" };
  const values: Record<string, number | [number, number]> = { normalized_eps: 5000, fair_pe: [10, 12],
    growth: [.05, .15], payout: .20, dilution: .007, exit_pe: 10 };
  for (const a of input.assumptions) if (Object.hasOwn(values, a.id)) {
    a.qualification = "BOUNDED_ESTIMATE";
    a.value = values[a.id];
  }
  const A = input.routes.A;
  A.qualifiedScope = true;
  A.crossCheckResolved = true;
  A.impairmentReviewed = true;
  A.scenarios = { base, downside: { ...base, growth: .05 }, upside: { ...base, growth: .15 } };
  const band = returnBand(shareholderIrr(price, base)!)!;
  A.proposals = { "VAL-PRIMARY": point(price, 4, "Fair"),
    "VAL-MOS": price <= 47000 ? point(price, 2, "Balanced/fair") : point(price, 1, "Thin/meaningful downside"),
    "VAL-RET": point(price, band.min, band.label) };
  return input;
}
const score = (input: ValuationReview) => evaluateValuation(input, () => true, true);

it.each([[.07999, 0], [.08, 2], [.12, 4], [.15, 6], [.18, 7], [.22, 8]])("preserves canonical IRR anchor %s", (irr, min) => {
  expect(returnBand(irr)?.min).toBe(min);
});

it("separates owner-earnings DCF and rejects a discount rate below terminal growth", () => {
  expect(ownerEarningsDcf(base, .45, .14, .03)?.value).toBeGreaterThan(0);
  expect(ownerEarningsDcf(base, .45, .03, .03)).toBeNull();
  expect(marginOfSafety(50100, 44000)).toBeCloseTo(-.138636);
  expect(marginOfSafety(50100, 0)).toBeNull();
});

it("solves reverse return assumptions and accounts for dividends and dilution", () => {
  const growth = reverseGrowth(50100, .15, base)!;
  expect(shareholderIrr(50100, { ...base, growth })).toBeCloseTo(.15);
  expect(shareholderIrr(50100, { ...base, payout: 0 })!).toBeLessThan(shareholderIrr(50100, base)!);
  expect(shareholderIrr(50100, { ...base, dilution: .02 })!).toBeLessThan(shareholderIrr(50100, base)!);
});

it("recalculates price-dependent bands on a synthetic alternate price with unchanged eligible model", () => {
  const original = score(fixture());
  const staleProposal = fixture();
  staleProposal.market.price = 46000;
  expect(score(staleProposal).every(r => r.points === null)).toBe(true);
  const revised = score(fixture(46000));
  expect(original.map(r => r.points)).toEqual([4, 2, 1]);
  expect(revised.map(r => r.points)).toEqual([4, 4, 2]);
  expect(revised[1].routes.A.irr!).toBeGreaterThan(original[1].routes.A.irr!);
  expect(revised[2].routes.A.mos!).toBeGreaterThan(original[2].routes.A.mos!);
  expect(revised[1].routeQualification).toMatchObject({ model: original[1].routeQualification.model, synthetic: true });
  expect(evaluateValuation(fixture(), () => true).every(r => r.points === null)).toBe(true);
});

it.each(["corporateAction", "financialChange"] as const)("blocks price-only refresh after %s", key => {
  const review = fixture(46000);
  review[key] = true;
  expect(score(review).every(r => r.points === null && r.routes.A.gaps.includes("MODEL_REASSESSMENT_REQUIRED"))).toBe(true);
});

it("rejects sensitivity-only core inputs, scenario overreach, and adjusted prices", () => {
  const review = fixture();
  review.assumptions.find(a => a.id === "normalized_eps")!.qualification = "SENSITIVITY_ONLY";
  expect(score(review).every(r => r.points === null)).toBe(true);
  review.assumptions.find(a => a.id === "normalized_eps")!.qualification = "BOUNDED_ESTIMATE";
  review.routes.A.scenarios!.base = { ...base, growth: .50 };
  expect(score(review)[1].routes.A.gaps).toContain("QUALIFIED_RETURN_SCENARIOS_REQUIRED");
  review.market.rawField = "GiaDieuChinh";
  expect(score(review).every(r => r.points === null)).toBe(true);
});

it("uses sector-specific models and retains independent conservative MOS blockers", () => {
  expect(valuationMethods.BANK).toContain("RESIDUAL_INCOME");
  expect(valuationMethods.REAL_ESTATE).toContain("RNAV");
  const review = fixture();
  review.routes.A.impairmentReviewed = false;
  expect(score(review).map(r => r.points)).toEqual([4, 2, null]);
  review.routes.B.counterevidence.disposition = "INVALIDATED";
  expect(score(review).every(r => r.points === null)).toBe(true);
});

it("retains accepted predecessor scores and honest actual N/R in both periods", () => {
  const raw = execFileSync(process.execPath, command, { encoding: "utf8" });
  expect(raw).toBe(readFileSync(`${dir}/FPT_VALUATION_RESULT.json`, "utf8"));
  const result = JSON.parse(raw);
  expect(result.financialEvidence.prices.current).toMatchObject({ value: 50100, field: "GiaDongCua", historicalPitAuthority: false });
  for (const period of ["annual", "current"]) expect(result.valuation[period].every((r: { points: null }) => r.points === null)).toBe(true);
  expect(result.aggregation).toMatchObject({ assessedPoints: 34, ratedWeight: 65, formalScore: null,
    coverage: { effective: { count: 13 }, genuineNR: { count: 3, weight: 20 }, outsideRollout: { count: 7 } } });
  expect(result.investmentDecisionInput).toMatchObject({ investmentActionable: false, formalDecisionAuthorized: false,
    gates: { financialHealth: "NOT_ASSESSED", valuation: "NOT_ASSESSED" } });
  expect(spawnSync(process.execPath, [...command, "--publish"]).status).toBe(1);
});
