import { readFileSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { expect, it } from "vitest";
import { evaluateValuationV11, relativeShareholderIrr, type ValuationReviewV11 } from "@/domain/current-scoring/valuation-research-v11";

const dir = "docs/fundamental-data-engine/fpt-valuation-forward-return/v1.1";
const read = (name: string) => JSON.parse(readFileSync(`${dir}/${name}`, "utf8"));
const raw = ["tools/scoring/validate_fpt_valuation_v11.mjs", "--ticker", "FPT"];
const path = (growth: number, multipleFactor = 1) => ({
  years: Array.from({ length: 5 }, () => ({ growth, dilution: .007 })), multipleFactor,
});

function fixture(price = 50000) {
  const review = structuredClone(read("FPT_VALUATION_ASSESSMENT.json").stages.current) as ValuationReviewV11;
  review.market = { ticker: "FPT", exchange: "HOSE", date: review.cutoff, price, shares: 1885727648,
    rawField: "GiaDongCua", shareBasis: "TEST", verifiedPrice: true, verifiedShares: true, evidence: "SYNTHETIC_TEST" };
  const model = review.routes.A["VAL-RET"]!;
  model.qualifiedScope = true;
  model.scaleFree = { base: path(.10), moderate: path(.08, .90), downside: path(.05, .80), upside: path(.11),
    foundation: { comparable: true, description: "Synthetic same-scope earnings basis", refs: ["synthetic"] } };
  model.proposal = { basisPrice: price, basisShares: review.market.shares, points: 2, band: "8% to below 12%",
    rationale: "Synthetic zero dividend credit", higher: "Not warranted", lower: "Base exceeds 8%", strongerEvidence: false };
  for (const row of review.assumptions) {
    if (["growth", "dilution", "relative_multiple"].includes(row.id)) row.qualification = "BOUNDED_ESTIMATE";
  }
  return review;
}
const score = (x: ValuationReviewV11) => evaluateValuationV11(x, () => true, true);
it("reproduces the scale-free identity and orders relative contraction", () => {
  expect(relativeShareholderIrr(path(.10))).toBeCloseTo(.0923535253, 9);
  expect(relativeShareholderIrr(path(.10, .8))!).toBeLessThan(relativeShareholderIrr(path(.10, .9))!);
  expect(relativeShareholderIrr({ ...path(.10), years: [] })).toBeNull();
});
it("scores zero-credit RET independently without EPS, payout, CoE or DCF", () => {
  const x = fixture();
  x.routes.B["VAL-PRIMARY"]!.crossCheck.status = "MATERIAL_CONTRADICTION";
  expect(score(x).map(r => r.points)).toEqual([null, 2, null]);
  expect(evaluateValuationV11(x, () => true).every(r => r.points === null)).toBe(true);
});
it("requires eligible foundation, variable path, relative bounds and matched price proposal", () => {
  const x = fixture();
  const model = x.routes.A["VAL-RET"]!;
  expect(score(x)[1].points).toBe(2);
  model.scaleFree!.foundation.comparable = false;
  expect(score(x)[1].points).toBeNull();
  model.scaleFree!.foundation.comparable = true;
  model.scaleFree!.downside.multipleFactor = .7;
  expect(score(x)[1].points).toBeNull();
  x.market.price = 45000;
  expect(score(x)[1].routes.A.gaps).toContain("CANONICAL_BAND_OR_CEILING");
  expect(score(fixture(45000))[1].routes.A.irr).toEqual(score(fixture())[1].routes.A.irr);
});
it("propagates a material identified common dependency and exposes its adverse disposition", () => {
  const x = fixture();
  const counter = x.routes.B["VAL-PRIMARY"]!.counterevidence;
  counter.disposition = "MATERIAL_CONTRADICTION";
  counter.commonDependency = "discount_rate";
  expect(score(x)[1].points).toBe(2);
  counter.commonDependency = "growth";
  expect(score(x)[1]).toMatchObject({ points: null, routes: { A: { adverseVeto: {
    rubric: "VAL-RET", affectedRoute: "A", commonDependency: "growth",
  } } } });
});
it("rejects unqualifiable assumption refs and protects current market basis", () => {
  const x = fixture();
  x.assumptions.find(a => a.id === "growth")!.refs = ["future"];
  expect(evaluateValuationV11(x, ref => ref !== "future", true)[1].routes.A.gaps)
    .toContain("ASSUMPTION_UNQUALIFIED:growth");
  x.corporateAction = true;
  expect(score(x)[1].routes.A.gaps).toContain("MODEL_REASSESSMENT_REQUIRED");
});
it("replays exact real FPT with revised horizon and independent genuine N/R", () => {
  const result = execFileSync(process.execPath, raw, { encoding: "utf8" });
  expect(result).toBe(readFileSync(`${dir}/FPT_VALUATION_RESULT.json`, "utf8"));
  const r = JSON.parse(result);
  expect(r.aggregation).toMatchObject({ assessedPoints: 34, ratedWeight: 65, formalScore: null,
    coverage: { genuineNR: { count: 3, weight: 20 } } });
  expect(r.valuation.current[1].routes.B.gaps.join()).not.toMatch(/cash_basis|discount_rate|terminal_growth|associate_value/);
  expect(r.valuation.current[1].routes.A.gaps.join()).not.toMatch(/normalized_eps|payout/);
  const diagnostics = r.financialEvidence.researchDiagnostics;
  expect(diagnostics.annualExternalEligible).toEqual(["ERE04", "ERE06"]);
  expect(diagnostics.horizon.every((s: { terminal: string; qualified: boolean }) =>
    s.terminal === "2031-11-13" && !s.qualified)).toBe(true);
  expect(r.investmentDecisionInput.formalDecisionAuthorized).toBe(false);
  expect(spawnSync(process.execPath, [...raw, "--publish"]).status).toBe(1);
});
