import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import {
  evaluateRiskGovernance, resolveRiskEffectiveScore, thesisSensitivity, type RiskPacket,
} from "@/domain/current-scoring/risk-governance-research";

const dir = "docs/fundamental-data-engine/fpt-risk-governance/v1.0";
const read = (name: string) => JSON.parse(readFileSync(`${dir}/${name}.json`, "utf8"));
const digest = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const inputs = { downside: { eps: 8, growth: .03, dilution: .02, payout: 0, exitMultiple: 8 },
  base: { eps: 10, growth: .08, dilution: .01, payout: .15, exitMultiple: 10 },
  upside: { eps: 13, growth: .12, dilution: 0, payout: .25, exitMultiple: 14 } };
function fixture(period = "ANNUAL") {
  const freeze = read(`DATA_FREEZE_${period}`);
  freeze.sha256 = createHash("sha256").update(readFileSync(`${dir}/DATA_FREEZE_${period}.json`)).digest("hex");
  const packet: RiskPacket = { initial: read(`ANALYST_ASSESSMENT_${period}`), initialReview: read(`INITIAL_REVIEW_${period}`),
    finalReview: read(`FINAL_REVIEW_${period}`), ...(period === "CURRENT" ? { revision: read("ANALYST_REVISION_CURRENT") } : {}) };
  return { freeze, packet, sensitivity: thesisSensitivity(100, inputs) };
}
const run = ({ freeze, packet, sensitivity }: ReturnType<typeof fixture>) =>
  evaluateRiskGovernance(freeze, packet, sensitivity, digest, () => true);
function bind({ packet }: ReturnType<typeof fixture>) {
  packet.initialReview.proposal = digest(packet.initial);
  if (packet.revision) packet.revision.previous = packet.initialReview.proposal;
  packet.finalReview.proposal = digest(packet.revision ?? packet.initial);
}

it("executes a bounded public governance profile without an external governance score", () => {
  const f = fixture();
  expect(run(f).map(row => row.points)).toEqual([3,2,0]);
  const gov = f.packet.initial.candidates["RG-GOV"]!.A!;
  gov.topics.related_parties = ["supervision"];
  bind(f);
  expect(run(f)[0].routes.A.gaps).toContain("GOVERNANCE_FACTUAL_BASIS_REQUIRED");
  gov.topics.related_parties = ["rpt"];
  gov.points = 4;
  gov.band = "Strong disclosure/alignment/minority treatment";
  bind(f);
  expect(run(f)[0].routes.A.gaps).toEqual(expect.arrayContaining(["CANONICAL_BAND_OR_CEILING","MAXIMUM_PREREQUISITE"]));
});

it("rejects unsupported absence and fairness as governance facts", () => {
  const f = fixture();
  for (const kind of ["SANCTIONS_ABSENT", "RPT_FAIRNESS_ASSUMED"]) {
    const last = f.freeze.facts.at(-1);
    Object.assign(last, { kind, state: "OBSERVED", evidence: "PRIMARY" });
    expect(run(f)[0].points).toBeNull();
  }
});

it("flags reporting reliability without clearing or simulating a formal veto", () => {
  const f = fixture();
  f.packet.initial.candidates["RG-GOV"]!.A!.findings = [
    { type: "REPORTING_RELIABILITY", fact: "audit", policy: "§11.2", rationale: "Synthetic potential adverse trigger." },
  ];
  bind(f);
  expect(run(f)[0]).toMatchObject({ points: null, policyEscalationRequired: true,
    routeQualification: { formalResidualRisk: "NOT_RATED", researchOnly: true } });
});

it("requires dated evidence of effectiveness and rejects a repeated loss channel", () => {
  const f = fixture();
  const m = f.packet.initial.candidates["RG-RISK"]!.A!;
  expect(run(f)[1]).toMatchObject({ points: 2, routeQualification: { researchResidualRisk: "ELEVATED_CONTROLLED",
    formalResidualRisk: "NOT_RATED" } });
  m.channels![0].control.stage = "IMPLEMENTED";
  bind(f);
  expect(run(f)[1].routes.A.gaps).toContain("RESIDUAL_CONTROL_EFFECTIVENESS_UNQUALIFIED");
  m.channels![0].control.stage = "EVIDENCED_EFFECTIVE";
  m.channels![0].control.through = "2024-12-31";
  bind(f);
  expect(run(f)[1].routes.A.gaps).toContain("RISK_CHANNEL_OWNERSHIP_OR_CONTROL_UNQUALIFIED");
  m.channels![0].control.through = f.freeze.cutoff;
  m.channels![0].consequenceType = "ROLLOVER_SHORTFALL";
  bind(f);
  expect(run(f)[1].points).toBeNull();
});

it("rejects unacceptable risk outside compensating arithmetic and enforces the A ceiling", () => {
  const f = fixture();
  const m = f.packet.initial.candidates["RG-RISK"]!.A!;
  Object.assign(m, { points: 4, band: "LOW", researchStatus: "LOW" });
  bind(f);
  expect(run(f)[1].routes.A.gaps).toContain("CANONICAL_BAND_OR_CEILING");
  m.researchStatus = "UNACCEPTABLE";
  bind(f);
  expect(run(f)[1]).toMatchObject({ points: null, policyEscalationRequired: true });
});

it("keeps high-confidence numeric zero separate from missing sensitivity or artificially narrow cases", () => {
  const f = fixture();
  expect(run(f)[2]).toMatchObject({ points: 0, confidence: { total: 8 } });
  const m = f.packet.initial.candidates["RG-UNC"]!.A!;
  m.confidence = [1,1,1,1,1];
  bind(f);
  expect(run(f)[2].points).toBe(0);
  f.sensitivity.rows.pop();
  expect(run(f)[2].points).toBeNull();
  f.sensitivity = thesisSensitivity(200, { downside: inputs.base, base: inputs.base, upside: inputs.base });
  expect(run(f)[2].points).toBeNull();
  m.thesis!.artificialRange = true;
  bind(f);
  expect(run(f)[2].points).toBeNull();
});

it("permits a supported narrow range with canonical maximum and prefers eligible B", () => {
  const f = fixture();
  const models = f.packet.initial.candidates["RG-UNC"]!;
  const m = models.A!;
  Object.assign(m, { points: 2, band: "Narrow supported range",
    maximum: { prerequisite: "Narrow supported range; shared assumptions identified", disconfirmingRefs: ["cash"] } });
  m.thesis!.classification = "NARROW";
  f.sensitivity = thesisSensitivity(100, { downside: { ...inputs.base, growth: .078 }, base: inputs.base,
    upside: { ...inputs.base, growth: .082 } });
  models.B = { ...structuredClone(m), route: "B", detailedRefs: ["audit","fy25fx"] };
  bind(f);
  expect(run(f)[2]).toMatchObject({ points: 2, routeQualification: { route: "B" } });
  m.thesis!.shared = ["exit"];
  models.B!.thesis!.shared = ["exit"];
  bind(f);
  expect(run(f)[2].points).toBeNull();
});

it("binds the (single) requested revision and rejects future facts and drift", () => {
  const f = fixture("CURRENT");
  expect(run(f).map(row => row.points)).toEqual([3,1,0]);
  f.packet.revision!.previous = "wrong";
  expect(run(f).map(row => row.points)).toEqual([null,null,null]);
  bind(f);
  f.freeze.facts[0].publicBy = "2026-11-14";
  expect(run(f)[0].points).toBeNull();
  f.freeze.facts[0].publicBy = "2026-03-19";
  Object.assign(f.packet.revision!, { revision: 2 });
  bind(f);
  expect(run(f)[1].points).toBeNull();
});

it("preserves current N/R separately from conditional provisional carry and blocks material invalidation", () => {
  const f = fixture("CURRENT");
  const prior = run(fixture())[1];
  delete f.packet.initial.candidates["RG-RISK"];
  delete f.packet.revision!.candidates["RG-RISK"];
  bind(f);
  const current = run(f)[1];
  const carry = { validUntil: "2026-11-30", materialEvent: false, applicabilityReviewed: true,
    coverage: "RETAINED_ONLY" as const, rationale: "Synthetic eligible carry." };
  expect(resolveRiskEffectiveScore(current,prior,carry)).toMatchObject({ validity: "PROVISIONAL",
    points: 2, currentReassessmentPoints: null, lifecycle: "PROVISIONAL_INHERITED" });
  expect(resolveRiskEffectiveScore(current,prior,{ ...carry, materialEvent: true }).points).toBeNull();
});

it("replays live retained artifacts deterministically and rejects formal or multi-ticker entry", () => {
  const cmd = ["tools/scoring/validate_fpt_risk_governance.mjs","--ticker","FPT"];
  const result = execFileSync(process.execPath,cmd,{ encoding: "utf8" });
  expect(result).toEqual(readFileSync(`${dir}/FPT_RISK_GOVERNANCE_RESULT.json`,"utf8"));
  expect(JSON.parse(result)).toMatchObject({ formalResidualRisk: "NOT_RATED", researchResidualRisk: "ELEVATED_WEAK",
    decisionEligible: false, aggregation: { assessedPoints: 43, ratedWeight: 95, formalScore: null } });
  expect(spawnSync(process.execPath,[...cmd,"--publish"]).status).not.toBe(0);
});
