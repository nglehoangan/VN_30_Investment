import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { evaluateBoundedReturn, type BoundedReturn } from "@/domain/current-scoring/valuation-research-v12";
import type { ValuationReviewV11 } from "@/domain/current-scoring/valuation-research-v11";

const dir = "docs/fundamental-data-engine/fpt-valuation-forward-return";
const read = (path: string) => JSON.parse(readFileSync(`${dir}/${path}`, "utf8"));
const packet = read("v1.2/FPT_BOUNDED_RETURN_ASSESSMENT.json");
const retained = read("v1.1/FPT_VALUATION_RESULT.json");
const command = ["tools/scoring/validate_fpt_bounded_return.mjs", "--ticker", "FPT"];
function fixture(lo: number, mid: number, hi: number, points: number, band: string) {
  const assessment = structuredClone(packet.boundedAssessment.current) as BoundedReturn;
  const input = {
    ...structuredClone(packet.stages.current),
    market: { ...retained.financialEvidence.markets.current, evidence: "SYNTHETIC_TEST" },
  } as ValuationReviewV11;
  input.routes.A["VAL-RET"]!.qualifiedScope = true;
  for (const row of Object.values(assessment.dependencies)) if (row.material) row.status = "QUALIFIED";
  assessment.dependencies.growth.bounds = [-.5, .6];
  const path = (id: string, role: BoundedReturn["paths"][number]["role"], irr: number, multipleFactor: number) => ({
    id, role, multipleFactor, terminalFactor: 1, equivalentDps: [0, 0, 0, 0, 0],
    years: Array.from({ length: 5 }, () => ({ growth: (1 + irr) / multipleFactor ** .2 - 1, dilution: 0 })),
  });
  assessment.paths = [path("low", "LOWER", lo, .8), path("mid", "INTERIOR", mid, 1), path("high", "UPPER", hi, 1)];
  assessment.counter.status = "QUALIFIED";
  assessment.uncertainty.status = "QUALIFIED";
  assessment.uncertainty.complete = true;
  assessment.uncertainty.excluded = [];
  assessment.investorEntitlement.comparableBasis = true;
  assessment.proposal = { points, band, basisPrice: assessment.marketPrice, basisShares: assessment.shares,
    rationale: "Supported synthetic test", higher: "Higher unsupported", lower: "Lower unrepresentative", strongerEvidence: false };
  return { input, assessment };
}
const score = ({ input, assessment }: ReturnType<typeof fixture>) => evaluateBoundedReturn(input, assessment, () => true, true);

it.each([
  [.03, .05, .07, 0, "Below 8%"],
  [-.15, -.08, -.02, 0, "Below 8%"],
  [.09, .10, .11, 2, "8% to below 12%"],
  [.125, .135, .145, 4, "12% to below 15%"],
  [.16, .17, .175, 6, "15% to below 18%"],
  [.20, .21, .215, 6, "15% to below 18%"],
] as const)("scores a qualified range %s–%s independently of investor hurdle", (lo, mid, hi, points, band) => {
  const row = score(fixture(lo, mid, hi, points, band));
  expect(row).toMatchObject({ points, validity: "CONFIRMED_CURRENT", boundedReturn: { qualification: "QUALIFIED_IRR_RANGE" } });
  expect(row.boundedReturn.qualifiedRange?.[0]).toBeCloseTo(lo);
  expect(row.boundedReturn.qualifiedRange?.[1]).toBeCloseTo(hi);
});

it("keeps a crossing range N/R unless an independently supported conservative case qualifies", () => {
  const f = fixture(.04, .09, .13, 2, "8% to below 12%");
  expect(score(f).points).toBeNull();
  f.assessment.conservativeCase = { scenarioId: "mid", independentlySupported: false,
    status: "QUALIFIED", refs: ["test"], rationale: "Numerical midpoint is not economic qualification" };
  expect(score(f).points).toBeNull();
  f.assessment.conservativeCase.independentlySupported = true;
  expect(score(f)).toMatchObject({ points: 2, boundedReturn: { qualification: "QUALIFIED_CONSERVATIVE_CASE" } });
  f.assessment.conservativeCase.scenarioId = "low";
  expect(score(f).points).toBeNull();
});

it("requires material qualification and completeness while leaving nonmaterial CoE unresolved", () => {
  const f = fixture(.03, .05, .07, 0, "Below 8%");
  expect(score(f).points).toBe(0);
  f.assessment.uncertainty.excluded = [{ scenario: "distribution", material: true, reason: "Not reviewed" }];
  expect(score(f).boundedReturn.gaps).toContain("ECONOMIC_UNCERTAINTY_SET_UNQUALIFIED");
  f.assessment.uncertainty.excluded = [];
  f.assessment.dependencies.growth.status = "SENSITIVITY_ONLY";
  expect(score(f).points).toBeNull();
  expect(score(f).boundedReturn.gaps).toContain("BOUNDED_DEPENDENCY_UNQUALIFIED:growth");
});

it("checks zero-credit, exact horizon, comparable entitlements and terminal economics", () => {
  const f = fixture(.03, .05, .07, 0, "Below 8%");
  f.assessment.paths[1].equivalentDps[0] = 100;
  expect(score(f).boundedReturn.gaps).toContain("RETURN_PATHS_OR_BOUNDARIES_UNQUALIFIED");
  f.assessment.terminal = "2030-12-31";
  f.assessment.investorEntitlement.noDoubleDilution = false;
  f.assessment.dependencies.terminal_stub.status = "UNBOUNDED";
  expect(score(f).boundedReturn.gaps).toEqual(expect.arrayContaining(["FIVE_YEAR_HORIZON_REQUIRED",
    "INVESTOR_ENTITLEMENT_OR_DILUTION_UNALIGNED", "BOUNDED_DEPENDENCY_UNQUALIFIED:terminal_stub"]));
});

it("rejects a stale price proposal and propagates only relevant adverse evidence", () => {
  const f = fixture(.03, .05, .07, 0, "Below 8%");
  f.input.market.price += 100;
  expect(score(f).points).toBeNull();
  f.input.market.price -= 100;
  const counter = f.input.routes.B["VAL-PRIMARY"]!.counterevidence;
  counter.disposition = "MATERIAL_CONTRADICTION";
  counter.commonDependency = "discount_rate";
  expect(score(f).points).toBe(0);
  counter.commonDependency = "funding_downside";
  expect(score(f).boundedReturn.gaps).toContain("MATERIAL_COMMON_DEPENDENCY_ADVERSE_VETO");
});

it("replays actual FPT and leaves the other valuation rubrics byte-identical", () => {
  const out = execFileSync(process.execPath, command, { encoding: "utf8" });
  expect(out).toBe(readFileSync(`${dir}/v1.2/FPT_VALUATION_RESULT.json`, "utf8"));
  const r = JSON.parse(out);
  for (const period of ["annual", "current"]) {
    expect(r.valuation[period][0]).toEqual(retained.valuation[period][0]);
    expect(r.valuation[period][2]).toEqual(retained.valuation[period][2]);
    expect(r.valuation[period][1].points).toBeNull();
  }
  expect(r.valuation.current[1].boundedReturn).toMatchObject({ qualification: "SENSITIVITY_ONLY_RANGE",
    coveredBands: ["Below 8%", "8% to below 12%"], qualifiedRange: null });
  expect(r.aggregation).toMatchObject({ assessedPoints: 34, ratedWeight: 65, formalScore: null });
  expect(r.investmentDecisionInput.formalDecisionAuthorized).toBe(false);
  expect(spawnSync(process.execPath, [...command, "--publish"]).status).toBe(1);
});

it.each([[.08, 2, "8% to below 12%"], [.12, 4, "12% to below 15%"], [.15, 6, "15% to below 18%"]] as const)
("assigns the exact lower boundary %s to its canonical band", (lo, points, band) => {
  expect(score(fixture(lo, lo + .005, lo + .01, points, band)).points).toBe(points);
});
