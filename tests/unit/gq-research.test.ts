import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { incrementalReturn, pairedGrowth, projectGrowth, scoreGrowth, scoreIncrementalGrowth,
  type GrowthAssessment } from "@/domain/current-scoring/gq-research";
import { PUBLIC_PROXY_REVIEW_OBSERVATION } from "@/domain/current-scoring/public-proxy-review";

const dir = "docs/fundamental-data-engine/fpt-growth-quality/v1.0";
const input = JSON.parse(readFileSync(`${dir}/FPT_GROWTH_ASSESSMENT.json`, "utf8"));
const note = { refs: ["annual"], rationale: "Qualified synthetic finding for a route test." };
const usable = (ref: string) => ref === "px02" || Object.hasOwn(input.evidence, ref);
const fixture = (id: GrowthAssessment["id"]): GrowthAssessment =>
  structuredClone(input.cases[id].baseline.assessment);
const score = (a: GrowthAssessment) => scoreGrowth(a, "TECHNOLOGY", usable);
const command = ["tools/scoring/validate_fpt_growth_quality.mjs", "--ticker", "FPT"];

it("chains compatible adjusted pairs without implying that economic dilution is resolved", () => {
  const result = pairedGrowth([[4661, 3847], [4944, 4052], [5216, 4292]]);
  expect(result?.cumulative).toBeCloseTo(0.7966, 4);
  expect(result?.cagr).toBeCloseTo(0.2157, 4);
  expect(pairedGrowth([[100, 0]])).toBeNull();
  expect(score(fixture("GQ-HIST"))).toMatchObject({ points: 3, route: "A_PROFILE" });
});

it.each(["base_effects", "acquisitions", "per_share", "meaningful_growth"])("requires a documented HIST %s finding", key => {
  const a = fixture("GQ-HIST");
  delete a.profile.evidence[key];
  expect(score(a).points).toBeNull();
});

it("prefers a qualified lower canonical B score", () => {
  const a = fixture("GQ-HIST");
  a.direct.proposal = { band: "Weak normalized trend", points: 1, rationale: "Supported", higher: "Bounded", lower: "Rejected" };
  a.direct.evidence = Object.fromEntries(["trend", "acquisitions", "base_effects", "per_share", "normalization"].map(k => [k, note]));
  expect(score(a)).toMatchObject({ points: 1, route: "B_DIRECT" });
  a.scopeAligned = false;
  expect(score(a).routes.B.gaps).toContain("DIRECT_SCOPE_UNALIGNED");
});

it.each([["GQ-HIST", 5], ["GQ-FWD", 5], ["GQ-INC", 4]] as const)("caps the %s public route", (id, points) => {
  const a = fixture(id);
  a.profile.proposal!.points = points;
  expect(score(a)).toMatchObject({ points: null, routes: { A: { gaps: expect.arrayContaining(["PROFILE_CEILING"]) } } });
});

it("accepts FWD sensitivity with financing qualifications and validates scenario horizon and source", () => {
  const a = fixture("GQ-FWD");
  expect(score(a)).toMatchObject({ points: 3, route: "A_PROFILE" });
  const s = a.scenarios![0];
  expect(projectGrowth(s)?.years).toHaveLength(5);
  expect(projectGrowth({ ...s, years: 2 })).toBeNull();
  s.refs = ["missing"];
  expect(score(a).gaps).toContain("SCENARIO_CONTRACT");
});

it("uses a qualified detailed outlook ahead of the public profile and protects maximum prerequisites", () => {
  const a = fixture("GQ-FWD");
  a.direct.evidence = Object.fromEntries(["runway", "reinvestment", "funding", "execution", "conversion", "downside"].map(k => [k, note]));
  a.direct.proposal = { band: "Moderate visibility", points: 3, rationale: "Supported", higher: "Bounded", lower: "Rejected" };
  expect(score(a).route).toBe("B_DIRECT");
  a.direct.proposal = { ...a.direct.proposal, band: "High-confidence attractive multi-year runway", points: 5 };
  expect(score(a).gaps).toContain("CANONICAL_BAND_OR_MAXIMUM");
});

it("requires incremental capital and rejects negative or immaterial denominators", () => {
  expect(incrementalReturn(10, 100, 1)).toBe(0.1);
  expect(incrementalReturn(10, -100, 1)).toBeNull();
  expect(incrementalReturn(10, 0.5, 1)).toBeNull();
  const a = fixture("GQ-INC");
  expect(score(a).route).toBe("A_PROFILE");
  delete a.profile.evidence.deployment;
  expect(score(a).points).toBeNull();
});

it("routes direct before unchanged PX02, then A, preserving adverse and maximum controls", () => {
  const a = fixture("GQ-INC");
  const checks = ["ALIGNED_OPERANDS", "PERSISTENCE", "SCOPE_BRIDGE", "INDEPENDENT_CORROBORATION", "GRANULARITY_REVIEW"];
  const proxyRow = (passed: string[]) => ({
    id: "px02", classification: "ESTIMATE", observation: PUBLIC_PROXY_REVIEW_OBSERVATION, unit: "TEXT",
    value: JSON.stringify({ proxy: "PX02", mode: "CONSERVATIVE", economicScope: "CONSOLIDATED_OUTCOMES",
      materialDependency: "RESOLVED", counterReview: "Reviewed",
      checks: passed, routeReview: { rubricId: "GQ-INC", route: "PROXY", improvementRounds: 0,
        originalSearchContinued: false, originalSearchAfterSufficientEvidence: false, reason: "Supported" } }),
  });
  a.proxy = { assessment: {
    subcategory: "GQ-INC", sector: "TECHNOLOGY", assessment: "Acceptable incremental economics", selectedPoints: 3,
    evidence: ["incremental_return", "denominator", "unit_economics"].map(topic => ({ topic, refs: ["annual", "px02"] })),
    disconfirmingEvidence: ["annual"],
  }, input: { evidence: [proxyRow(checks)], metrics: [] } } as unknown as GrowthAssessment["proxy"];
  expect(score(a)).toMatchObject({ points: 3, route: "PX02" });
  a.direct.proposal = { band: "Weak incremental economics", points: 1, rationale: "Supported", higher: "Bounded", lower: "Rejected" };
  a.direct.evidence = Object.fromEntries(["incremental_return", "denominator", "unit_economics", "cost", "deployment", "classification"].map(k => [k, note]));
  a.directDeployment = [2, 3].map(years => ({ years, nopatDelta: 1, capitalDelta: 100, minimumMeaningfulCapital: 10, support: note }));
  expect(score(a)).toMatchObject({ points: 1, route: "B_DIRECT" });
  a.directDeployment[0].capitalDelta = 0;
  expect(score(a).points).toBeNull();
  a.direct.proposal = null;
  const evidence = a.proxy!.input.evidence as unknown[];
  evidence[0] = proxyRow(checks.slice(1));
  expect(score(a)).toMatchObject({ points: 2, route: "A_PROFILE", routes: { PX02: { points: null } } });
  a.direct.knownAdverse = true;
  expect(score(a).points).toBeNull();
});

it("protects counterevidence and distinguishes no proposal from missing evidence", () => {
  const a = fixture("GQ-HIST");
  a.profile.proposal = null;
  a.profile.reason = "";
  expect(score(a).gaps).toContain("NO_PROFILE_ANALYST_PROPOSAL");
  a.counter[0].disposition = "MATERIAL_CONTRADICTION";
  expect(score(a).gaps).toContain("COUNTEREVIDENCE_BLOCKS");
});

it("qualifies historical INC independently, blocks expiry and invalidation, and excludes future evidence", () => {
  const make = () => {
    const { historical, ...caseData } = structuredClone(input.cases["GQ-INC"]);
    return { historical, packet: { ...caseData, sector: input.sector, evidence: structuredClone(input.evidence) } };
  };
  const { historical, packet } = make();
  expect(scoreIncrementalGrowth(packet, historical)).toMatchObject({
    baseline: { points: 2 }, current: { points: null }, effectiveScore: { points: 2, validity: "PROVISIONAL",
      routeQualification: { confidence: { total: 6 } } },
  });
  expect(scoreIncrementalGrowth(packet, { ...historical, usableThrough: "2026-10-31" }).effectiveScore.points).toBeNull();
  const changed = make();
  changed.packet.reassessment.assessment.counter[0].disposition = "CONFIRMED_INVALIDATION";
  expect(scoreIncrementalGrowth(changed.packet, historical).effectiveScore.points).toBeNull();
  const future = make();
  future.packet.evidence.inc_history.publicBy = "2026-11-14";
  expect(scoreIncrementalGrowth(future.packet, historical)).toMatchObject({ baseline: { points: null }, effectiveScore: { points: null } });
});

it("replays actual cumulative FPT scores and rejects publication", () => {
  const raw = execFileSync(process.execPath, command, { encoding: "utf8" });
  expect(raw).toBe(readFileSync(`${dir}/FPT_GROWTH_RESULT.json`, "utf8"));
  const result = JSON.parse(raw);
  expect(result.aggregation).toMatchObject({ assessedPoints: 29, ratedWeight: 55, formalScore: null,
    coverage: { effective: { count: 10 }, genuineNR: { count: 0 }, outsideRollout: { count: 13 } } });
  expect(result.researchRanking[0].rank).toBeNull();
  expect(result.investmentDecisionInput).toMatchObject({ investmentActionable: false, formalDecisionAuthorized: false,
    gates: { financialHealth: "NOT_ASSESSED", valuation: "NOT_ASSESSED" } });
  expect(spawnSync(process.execPath, [...command, "--publish"]).status).toBe(1);
});

it("does not bypass a direct blocker that is unrelated to detailed evidence", () => {
  const a = fixture("GQ-HIST");
  a.direct.detailGap = "EVIDENCE_INTEGRITY_FAILURE";
  expect(score(a)).toMatchObject({ points: null, routes: { A: { evaluated: false } },
    gaps: expect.arrayContaining(["DIRECT_FALLBACK_REASON_UNQUALIFIED"]) });
});

it("keeps lending and property normalization distinct from nonfinancial assumptions", () => {
  const a = fixture("GQ-INC");
  expect(scoreGrowth(a, "BANK", usable).gaps).toContain("SECTOR_NORMALIZATION");
  expect(scoreGrowth(a, "REAL_ESTATE", usable).gaps).toContain("SECTOR_NORMALIZATION");
});

it("keeps forecast sensitivity and confidence separate from band points", () => {
  const { historical, ...entry } = structuredClone(input.cases["GQ-FWD"]);
  const packet = { ...entry, sector: input.sector, evidence: input.evidence };
  packet.review.confidence.dimensions = [0, 0, 0, 0, 0];
  expect(scoreIncrementalGrowth(packet, historical).effectiveScore).toMatchObject({
    points: 3, validity: "CONFIRMED_CURRENT", routeQualification: { confidence: { total: 0 } },
  });
  const [lower, , upper] = packet.reassessment.assessment.scenarios;
  expect(projectGrowth(lower)?.years[2].revenue).toBeLessThan(projectGrowth(upper)!.years[2].revenue);
});
