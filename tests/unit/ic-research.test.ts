import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { scoreIndustry, scoreIncrementalIndustry, reviewIndustryOwnership, type IndustryAssessment } from "@/domain/current-scoring/ic-research";
import { PUBLIC_PROXY_REVIEW_OBSERVATION } from "@/domain/current-scoring/public-proxy-review";

const dir = "docs/fundamental-data-engine/fpt-industry-competitive-position/v1.0";
const dossier = JSON.parse(readFileSync(`${dir}/FPT_INDUSTRY_ASSESSMENT.json`, "utf8"));
const assign = (id: IndustryAssessment["id"]): IndustryAssessment =>
  structuredClone(dossier.cases[id].baseline.assessment);
const score = (a: IndustryAssessment) => scoreIndustry(a, "TECHNOLOGY",
  r => Object.hasOwn(dossier.evidence, r) || r === "px03");
const command = ["tools/scoring/validate_fpt_industry_position.mjs", "--ticker", "FPT"];

it("requires evidence outside the assessed issuer for the industry profile", () => {
  const a = assign("IC-IND");
  expect(score(a)).toMatchObject({ points: 2, route: "A_PROFILE" });
  a.evidenceFamilies.cmc.origin = "ISSUER";
  expect(score(a).gaps).toContain("EXTERNAL_INDUSTRY_EVIDENCE_REQUIRED");
});

it("prioritizes a qualified canonical industry result even if it is lower", () => {
  const a = assign("IC-IND");
  a.direct.proposal = { points: 1, band: "Structurally difficult", rationale: "Qualified adverse evidence",
    higher: "Bounded", lower: "Rejected" };
  a.direct.evidence = Object.fromEntries(["barriers", "competition", "demand", "disruption", "pricing",
    "bargaining", "capital", "industry_profitability", "regulation"].map(topic =>
    [topic, { refs: ["cmc"], rationale: "Synthetic evidence for precedence" }]));
  expect(score(a)).toMatchObject({ points: 1, route: "B_DIRECT" });
  a.direct.proposal.points = 4;
  a.direct.proposal.band = "Structurally attractive/rational/durable";
  expect(score(a).gaps).toContain("CANONICAL_BAND_OR_MAXIMUM");
});

it.each([["IC-IND", 4], ["IC-POS", 4], ["IC-CYCLE", 2]] as const)("enforces %s alternative ceiling", (id, points) => {
  const a = assign(id);
  a.profile.proposal!.points = points;
  expect(score(a)).toMatchObject({ points: null, gaps: expect.arrayContaining(["PROFILE_CEILING"]) });
});

it("does not infer competitive capability from scale or a single evidence family", () => {
  const a = assign("IC-POS");
  expect(score(a)).toMatchObject({ points: 2, routes: { PX03: { points: null } } });
  Object.values(a.profile.evidence).forEach(n => { n.refs = ["fy_segment"]; });
  expect(score(a).gaps).toContain("INDEPENDENT_CAPABILITY_CORROBORATION_REQUIRED");
  delete a.profile.evidence.delivery;
  expect(score(a).points).toBeNull();
});

it("preserves PX03 and prioritizes canonical comparable evidence", () => {
  const a = assign("IC-POS");
  const proxy = (checks: string[]) => ({ id: "px03", observation: PUBLIC_PROXY_REVIEW_OBSERVATION,
    classification: "ESTIMATE", unit: "TEXT", value: JSON.stringify({ proxy: "PX03", mode: "CONSERVATIVE",
      economicScope: "CONSOLIDATED_OUTCOMES", materialDependency: "RESOLVED", checks, counterReview: "Reviewed synthetic",
      routeReview: { rubricId: "IC-POS", route: "PROXY", improvementRounds: 0, originalSearchContinued: false,
        originalSearchAfterSufficientEvidence: false, reason: "Reviewed matched population" } }) });
  const checks = ["DEFINED_POPULATION", "MATCHED_POSITION", "INDEPENDENT_COST", "DISTRIBUTION"];
  a.proxy = { assessment: { subcategory: "IC-POS", sector: "TECHNOLOGY", selectedPoints: 1, assessment: "Weak",
    evidence: ["share", "cost_position", "distribution"].map(topic => ({ topic, refs: ["cmc", "px03"] })),
    disconfirmingEvidence: ["cmc"] }, input: { metrics: [], evidence: [proxy(checks)] } } as unknown as IndustryAssessment["proxy"];
  expect(score(a)).toMatchObject({ points: 1, route: "PX03" });
  const evidence = a.proxy!.input.evidence as unknown[];
  evidence[0] = proxy(checks.filter(k => k !== "INDEPENDENT_COST"));
  expect(score(a)).toMatchObject({ points: 2, route: "A_PROFILE" });
  a.direct.knownAdverse = true;
  expect(score(a).points).toBeNull();
});

it("requires independent upside, downside and channel ownership for a mixed cycle profile", () => {
  const a = assign("IC-CYCLE");
  expect(score(a)).toMatchObject({ points: 1, route: "A_PROFILE" });
  delete a.profile.evidence.cycle_downside;
  expect(score(a).gaps).toContain("TWO_SIDED_CYCLE_EVIDENCE_REQUIRED");
  a.ownership = [];
  expect(score(a).gaps).toContain("ECONOMIC_CHANNEL_UNQUALIFIED");
});

it("keeps advance indications outside the earlier information set and respects counterevidence", () => {
  const { historical, ...base } = structuredClone(dossier.cases["IC-IND"]);
  base.baseline.assessment.profile.evidence.demand.refs = ["gartner"];
  const packet = { ...base, sector: dossier.sector, evidence: dossier.evidence };
  expect(scoreIncrementalIndustry(packet, historical).baseline?.points).toBeNull();
  base.reassessment.assessment.counter[0].disposition = "CONFIRMED_INVALIDATION";
  expect(scoreIncrementalIndustry(packet, historical).effectiveScore.points).toBeNull();
});

it("does not carry an unavailable cycle profile through a stale or affected current review", () => {
  const { historical, ...base } = structuredClone(dossier.cases["IC-CYCLE"]);
  base.reassessment.assessment.profile.proposal = null;
  base.review.continuedApplicability = { established: true, refs: ["q3"], rationale: "Synthetic carry review" };
  base.review.changes[0].status = "MATERIAL_IMPACT_UNRESOLVED";
  const packet = { ...base, sector: dossier.sector, evidence: dossier.evidence };
  expect(scoreIncrementalIndustry(packet, { ...historical, eligible: true }).effectiveScore.points).toBeNull();
  expect(scoreIncrementalIndustry(packet, { ...historical, eligible: true, usableThrough: "2026-11-01" })
    .effectiveScore.points).toBeNull();
});

it("replays actual cumulative FPT results with no comparable rank or formal authority", () => {
  const raw = execFileSync(process.execPath, command, { encoding: "utf8" });
  expect(raw).toBe(readFileSync(`${dir}/FPT_INDUSTRY_RESULT.json`, "utf8"));
  const result = JSON.parse(raw);
  expect(result.aggregation).toMatchObject({ assessedPoints: 34, ratedWeight: 65, formalScore: null,
    coverage: { effective: { count: 13 }, genuineNR: { count: 0 }, outsideRollout: { count: 10 } } });
  expect(result.financialEvidence.comparator.qualifiedRank).toBeNull();
  expect(result.financialEvidence.current.marginTrendComparable).toBe(false);
  expect(result.researchRanking[0].rank).toBeNull();
  expect(result.investmentDecisionInput).toMatchObject({ investmentActionable: false, formalDecisionAuthorized: false,
    gates: { financialHealth: "NOT_ASSESSED", valuation: "NOT_ASSESSED" } });
  expect(spawnSync(process.execPath, [...command, "--publish"]).status).toBe(1);
});

it("checks shared observations for repeated economic credit", () => {
  const industry = assign("IC-IND"), capability = assign("IC-POS"), cycle = assign("IC-CYCLE");
  expect(reviewIndustryOwnership([industry, capability, cycle])).toBe(true);
  capability.ownership.find(o => o.family === "cmc")!.channel =
    industry.ownership.find(o => o.family === "cmc")!.channel;
  expect(reviewIndustryOwnership([industry, capability, cycle])).toBe(false);
});

it("rejects an undefined market or known adverse contradiction", () => {
  const a = assign("IC-POS");
  a.scope.geography = "";
  expect(score(a).gaps).toContain("MARKET_SCOPE_OR_SECTOR_UNQUALIFIED");
  a.scope.geography = "Defined market";
  a.counter[0].disposition = "MATERIAL_CONTRADICTION";
  expect(score(a).gaps).toContain("COUNTEREVIDENCE_BLOCKS");
});

it("preserves canonical detailed cycle maximum prerequisites", () => {
  const a = assign("IC-CYCLE");
  const evidence = { refs: ["fy_cycle"], rationale: "Qualified synthetic" };
  a.direct.evidence = Object.fromEntries(["cycle", "forward_asymmetry", "survivability", "normalization", "downside", "recovery"]
    .map(k => [k, evidence]));
  a.direct.proposal = { points: 2, band: "Favorable normalized forward asymmetry", rationale: "Synthetic",
    higher: "Ceiling", lower: "Established favorable asymmetry", maximumJustification: evidence };
  expect(score(a).points).toBeNull();
  a.direct.evidence.favorable_asymmetry = evidence;
  expect(score(a)).toMatchObject({ points: 2, route: "B_DIRECT" });
});

it("requires independently corroborated findings for strong industry and capability bands", () => {
  const industry = assign("IC-IND");
  industry.profile.proposal = { ...industry.profile.proposal!, points: 3, band: "ATTRACTIVE_PUBLIC_INDUSTRY_PROFILE" };
  industry.profile.evidence.durable_industry_economics = { refs: ["fy_segment"], rationale: "Issuer-only claim" };
  expect(score(industry).gaps).toContain("INDEPENDENT_DURABLE_INDUSTRY_ECONOMICS_REQUIRED");
  const capability = assign("IC-POS");
  capability.profile.proposal = { ...capability.profile.proposal!, points: 3, band: "STRONG_COMPETITIVE_CAPABILITY_PROFILE" };
  capability.profile.evidence.relative_strength = { refs: ["fy_segment"], rationale: "Absolute margin alone" };
  expect(score(capability).gaps).toContain("RELATIVE_CAPABILITY_CORROBORATION_REQUIRED");
});

it("retains an eligible historical cycle profile only as provisional", () => {
  const { historical, ...base } = structuredClone(dossier.cases["IC-CYCLE"]);
  base.reassessment.assessment.profile.proposal = null;
  base.review.continuedApplicability = { established: true, refs: ["q3"], rationale: "Synthetic review supports continuing relevance." };
  const packet = { ...base, sector: dossier.sector, evidence: dossier.evidence };
  expect(scoreIncrementalIndustry(packet, { ...historical, eligible: true }).effectiveScore).toMatchObject({
    points: 1, validity: "PROVISIONAL", financialPeriod: "2025-12-31", routeQualification: {
      assessmentMethod: "A_PROFILE", economicChannels: expect.any(Array),
    },
  });
});
