import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { evaluateAnalystValuation, type AnalystValuationPacket } from "@/domain/current-scoring/valuation-research-v20";
import type { ValuationReviewV11 } from "@/domain/current-scoring/valuation-research-v11";

const dir = "docs/fundamental-data-engine/fpt-valuation-forward-return/v2.0";
const digest = (data: unknown) => createHash("sha256").update(JSON.stringify(data)).digest("hex");
const cutoff = "2025-12-31";
const refs = ["synthetic"];
const reason = "Synthetic documented earnings, constrained cash realization and bounded adverse case.";
type Id = keyof AnalystValuationPacket["initialReview"]["assessments"];

function fixture() {
  const market: ValuationReviewV11["market"] = { ticker: "TEST", exchange: "HOSE", date: cutoff,
    price: 100, shares: 1000, evidence: "SYNTHETIC_TEST", rawField: "GiaDongCua", shareBasis: "TEST",
    verifiedPrice: true, verifiedShares: true };
  const confidence = { dimensions: [2, 1, 2, 1, 1] as const, rationale: reason };
  const input: ValuationReviewV11 = { ticker: "TEST", exchange: "HOSE", cutoff, sector: "TECHNOLOGY",
    market, confidence, assumptions: [], routes: { A: {}, B: {} },
    modelFresh: true, financialChange: false, corporateAction: false };
  const freeze = "a".repeat(64);
  const initial: AnalystValuationPacket["initial"] = { freeze, revision: 0, ticker: input.ticker, cutoff,
    terminal: "2030-12-31", market: { ...market }, confidence, models: {}, estimates: [],
    returnBasis: { shareBasis: market.shareBasis, proRataNeutral: true, noDoubleDilution: true,
      terminalExtension: reason, cashTiming: reason, refs } };
  const assessments = {} as AnalystValuationPacket["initialReview"]["assessments"];
  for (const [id, values, points, band] of [
    ["VAL-PRIMARY", { normalized_eps: 10, fair_pe: [8, 12] }, 4, "Fair"],
    ["VAL-RET", { normalized_eps: 10, growth: [0, .04], dilution: .01, exit_pe: [6, 10] }, 0, "Below 8%"],
    ["VAL-MOS", { normalized_eps: 8, fair_pe: 8 }, 1, "Thin/meaningful downside"],
  ] as const) {
    const model = `synthetic-${id}`;
    initial.models[id] = { id: model, method: "NORMALIZED_EARNINGS", rubric: id, route: "A", cutoff,
      dependencies: Object.keys(values), qualifiedScope: true,
      proposal: { points, band, basisPrice: 100, basisShares: 1000, rationale: reason, higher: reason,
        lower: reason, strongerEvidence: false },
      crossCheck: { rubric: id, model, status: "RESOLVED", refs, reason },
      counterevidence: { refs, disposition: "BOUNDED_LIMITATION", rationale: reason },
      maximumSupported: false, impairmentReviewed: true,
    };
    for (const [key, value] of Object.entries(values)) {
      initial.estimates.push({ id: key, classification: "ANALYST_ESTIMATE", value, unit: "synthetic",
        cutoff, period: "synthetic", refs, rationale: reason, derivation: reason, materiality: reason,
        downside: reason, counterevidence: reason, sensitivity: reason, scope: reason, commonDependency: key,
        limitations: reason, fresh: true, models: [model], rubrics: [id], alternatives: reason,
        historicalAnchor: reason, externalAnchor: null });
    }
    assessments[id] = { disposition: "ACCEPTED_WITH_LIMITATIONS", dependencies: Object.keys(values),
      blockers: [], limits: reason, dimensions: Array.from({ length: 6 }, (_, i) => ({
        id: `RV0${i + 1}`, challenge: reason, effect: reason, materiality: "MATERIAL", refs: i === 1 ? [] : refs,
        verdict: i === 1 ? "OPTIONAL_ABSENT" : i === 4 ? "LIMITATION" : "SUPPORTED",
      })) };
  }
  const scenarios = [0, .02, .04].map((growth, i) => ({ eps: 10, growth, dilution: .01, payout: 0, exitMultiple: 6 + 2 * i }));
  Object.assign(initial.models["VAL-RET"]!, { dividendCredit: "ZERO_CREDIT",
    scenarios: { downside: scenarios[0], base: scenarios[1], upside: scenarios[2] } });
  const review = { proposal: digest(initial), freeze, revision: 0 as const, assessments };
  return { input, packet: { freeze, initial, initialReview: review, finalReview: structuredClone(review) } as AnalystValuationPacket };
}
type Fixture = ReturnType<typeof fixture>;
const run = ({ input, packet }: Fixture, synthetic = true) =>
  evaluateAnalystValuation(input, packet, digest, ref => refs.includes(ref), synthetic);
function rebind({ packet }: Fixture) {
  packet.initialReview.proposal = digest(packet.initial);
  packet.finalReview = structuredClone(packet.initialReview);
}

it("qualifies reasonable estimates with optional external support absent and retains zero and negative IRR", () => {
  const f = fixture();
  const rows = run(f);
  expect(rows.map(row => row.points)).toEqual([4, 0, 1]);
  expect(rows[1].routes.A.irr).toBeLessThan(0);
  expect(rows[1].routes.A.proposal?.points).toBe(0);
  expect(run(f, false).map(row => row.points)).toEqual([null, null, null]);
});

it("binds facts, time-eligible references, review identity and assumption class", () => {
  const f = fixture();
  f.packet.initial.estimates[0].refs = ["outside-freeze"];
  expect(run(f)[0].routes.A.gaps).toContain("DATA_FREEZE_OR_PROPOSAL_REVIEW_BINDING");
  rebind(f);
  expect(run(f).map(row => row.points)).toEqual([null, 0, 1]);
  f.packet.initial.estimates[0].refs = refs;
  Object.assign(f.packet.initial.estimates[0], { classification: "FACT" });
  rebind(f);
  expect(run(f)[0].routes.A.gaps).toContain("ANALYST_ESTIMATE_LINEAGE");
  f.input.market.verifiedPrice = false;
  expect(run(f).map(row => row.points)).toEqual([null, null, null]);
});

it("requires reasoning and rejects incorrect scenario inputs and calculation overrides independently", () => {
  const f = fixture();
  f.packet.initial.estimates[0].rationale = "";
  f.packet.initial.models["VAL-RET"]!.scenarios!.base.growth = .4;
  f.packet.initial.models["VAL-MOS"]!.conservativeValue = 999;
  rebind(f);
  const rows = run(f);
  expect(rows[0].routes.A.gaps).toContain("ASSUMPTION_UNQUALIFIED:normalized_eps");
  expect(rows[1].routes.A.gaps).toContain("QUALIFIED_RETURN_SCENARIOS_REQUIRED");
  expect(rows[2].routes.A.gaps).toContain("NORMALIZED_EARNINGS_OUTPUT_MUST_BE_CALCULATED");
});

it("requires dimension-level challenge and prevents an acceptance label or an unrequested revision from bypassing review", () => {
  const f = fixture();
  f.packet.initialReview.assessments["VAL-PRIMARY"].dimensions.pop();
  f.packet.initialReview.assessments["VAL-MOS"].dimensions[2].verdict = "BLOCKING";
  rebind(f);
  expect(run(f).map(row => row.points)).toEqual([null, 0, null]);
  f.packet.revision = { ...f.packet.initial, revision: 1, previousProposal: digest(f.packet.initial) };
  f.packet.finalReview = { ...f.packet.initialReview, proposal: digest(f.packet.revision), revision: 1 };
  expect(run(f)[1].routes.A.gaps).toContain("ONE_REVISION_CONTRACT");
});

it("allows one requested revision and blocks a second revision", () => {
  const f = fixture();
  const id: Id = "VAL-PRIMARY";
  const challenge = f.packet.initialReview.assessments[id];
  challenge.disposition = "REVISION_REQUIRED";
  challenge.dimensions[4].verdict = "BLOCKING";
  challenge.blockers = [{ code: "RB04", dependency: "fair_pe", detail: reason, simplerModel: reason, range: reason }];
  const revision = structuredClone(f.packet.initial);
  revision.revision = 1;
  revision.previousProposal = digest(f.packet.initial);
  revision.estimates.find(row => row.rubrics.includes(id) && row.id === "fair_pe")!.value = [9, 11];
  f.packet.revision = revision;
  f.packet.finalReview = { ...f.packet.finalReview, revision: 1, proposal: digest(revision) };
  expect(run(f).map(row => row.points)).toEqual([4, 0, 1]);
  Object.assign(revision, { revision: 2 });
  expect(run(f)[0].routes.A.gaps).toContain("ONE_REVISION_CONTRACT");
});

it("prioritizes a qualified Method B, enforces A ceilings, and blocks relevant adverse veto only", () => {
  const f = fixture();
  const model = structuredClone(f.packet.initial.models["VAL-PRIMARY"]!);
  f.input.routes.B["VAL-PRIMARY"] = { ...model, route: "B", proposal: { ...model.proposal!, points: 3, band: "Slightly expensive" } };
  f.input.assumptions = f.packet.initial.estimates.filter(row => row.rubrics.includes("VAL-PRIMARY"))
    .map(row => ({ ...row, classification: "ESTIMATE", qualification: "QUALIFIED_ESTIMATE" }));
  expect(run(f)[0]).toMatchObject({ points: 3, routeQualification: { route: "B" } });
  f.input.routes.B["VAL-PRIMARY"].counterevidence.disposition = "MATERIAL_CONTRADICTION";
  f.input.routes.B["VAL-PRIMARY"].counterevidence.commonDependency = "normalized_eps";
  expect(run(f).map(row => row.points)).toEqual([null, null, null]);
  f.input.routes.B["VAL-PRIMARY"].counterevidence.commonDependency = "discount_rate";
  Object.assign(f.packet.initial.models["VAL-PRIMARY"]!.proposal!, { points: 7, band: "Very attractive" });
  rebind(f);
  expect(run(f)[0].routes.A.gaps).toContain("CANONICAL_BAND_OR_CEILING");
  expect(run(f)[2].points).toBe(1);
});

it("binds share entitlement, terminal stub and pricing refresh, and invalidates on material financial change", () => {
  const f = fixture();
  f.packet.initial.returnBasis!.noDoubleDilution = false;
  rebind(f);
  expect(run(f)[1].routes.A.gaps).toContain("INVESTOR_ENTITLEMENT_OR_TERMINAL_BASIS_UNQUALIFIED");
  f.packet.initial.returnBasis!.noDoubleDilution = true;
  f.packet.initial.terminal = "2030-10-31";
  rebind(f);
  expect(run(f)[1].routes.A.gaps).toContain("FIVE_YEAR_HORIZON_REQUIRED");
  f.packet.initial.terminal = "2030-12-31";
  f.input.market.price = 102;
  rebind(f);
  expect(run(f)[1].points).toBeNull();
  f.packet.initial.market.price = 102;
  for (const row of Object.values(f.packet.initial.models)) row.proposal!.basisPrice = 102;
  rebind(f);
  expect(run(f).map(row => row.points)).toEqual([4, 0, 1]);
  f.input.financialChange = true;
  expect(run(f).map(row => row.points)).toEqual([null, null, null]);
});

it("replays frozen FPT through the real research entrypoint and rejects publication switches", () => {
  const command = ["tools/scoring/validate_fpt_analyst_valuation.mjs", "--ticker", "FPT"];
  const result = execFileSync(process.execPath, command, { encoding: "utf8" });
  expect(result).toBe(readFileSync(`${dir}/FPT_VALUATION_RESULT.json`, "utf8"));
  const data = JSON.parse(result);
  expect(data.aggregation).toMatchObject({ assessedPoints: 39, ratedWeight: 85, formalScore: null,
    coverage: { effective: { count: 16, weight: 85 } } });
  expect(data.aggregation.routeQualifications.filter((row: { id: string }) => row.id.startsWith("VAL-"))
    .map((row: { route: string }) => row.route)).toEqual(["A", "A", "A"]);
  expect(data.investmentDecisionInput.formalDecisionAuthorized).toBe(false);
  expect(Object.keys(JSON.parse(readFileSync(`${dir}/DATA_FREEZE_ANNUAL.json`, "utf8")).researchDocuments))
    .toEqual(["ERE04", "ERE06"]);
  expect(spawnSync(process.execPath, [...command, "--publish"]).status).toBe(1);
});
