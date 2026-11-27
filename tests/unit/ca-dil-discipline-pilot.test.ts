import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolveDisciplinePilot, summarizeDisciplineCandidate, validateDisciplinePilot,
  type DisciplineProposal, type DisciplineReview } from "@/domain/current-scoring/ca-dil-discipline-pilot";
import { managementAllocation } from "@/domain/current-scoring/capital-allocation-targeted-evidence";

const folder = "docs/fundamental-data-engine/fpt-capital-allocation/";
const pilot = folder + "ca-dil-discipline-pilot-v1.0/";
const json = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const prior = json(folder + "targeted-evidence-update-2026-11-27/FPT_TARGETED_RESULT.json");
const proposals = json(pilot + "ANALYST_PROPOSAL.json");
const reviews = json(pilot + "REASONABLENESS_REVIEW.json").periods;
const canonical = (period: string) => prior.capital[period].find((row: { id: string }) => row.id === "CA-DIL");
const refs = (proposal: DisciplineProposal) => new Set(Object.values(proposal.groups).flatMap(group => group.refs));
const positive = (): DisciplineProposal => ({
  ...structuredClone(proposals.current), band: "DISCIPLINED_WITH_LIMITATIONS", exposure: "CONTROLLED",
  judgment: "Synthetic review: retained price, observed cash response and a checked employee buyback demonstrate bounded transfer across the programme, even on adverse assumptions.",
});
const accepted: DisciplineReview = { ...reviews.current, blockers: [] };
const validate = (proposal: DisciplineProposal, review = accepted) => validateDisciplinePilot(proposal, review, refs(proposal));

describe("isolated economic-discipline pilot", () => {
  it.each(["controlled issuance", "lock-up", "KPI", "EPS growth", "absence of proven harm"])(
    "does not award a point for %s alone", reason => {
      const oneFact = positive();
      oneFact.judgment = reason;
      oneFact.exposure = "UNRESOLVED";
      expect(validate(oneFact)).toMatchObject({ points: null, gaps: ["BAND_NOT_SUPPORTED"] });
    },
  );
  it("accepts a reviewed holistic positive or affirmatively adverse conclusion on the binary scale", () => {
    expect(validate(positive()).points).toBe(1);
    const adverse: DisciplineProposal = { ...positive(), exposure: "MATERIAL_DETRIMENT",
      band: "MATERIAL_VALUE_DESTRUCTION_OR_WEAK_ECONOMIC_DISCIPLINE",
      judgment: "Synthetic review: recurring subsidized awards and realized shareholder detriment are verified despite protections." };
    expect(validate(adverse).points).toBe(0);
    expect(validate({ ...adverse, actualIssuanceAndMaterialTermsSupported: false }).points).toBeNull();
    expect(validate(positive(), { ...accepted, blockers: reviews.current.blockers }).points).toBeNull();
  });
  it("requires review of all four groups and rejects unsupported benefit or causal inferences", () => {
    const proposal = positive();
    proposal.groups.outcome.adverse = [];
    expect(validate(proposal).gaps).toContain("UNQUALIFIED_GROUP_OUTCOME");
    expect(validate({ ...positive(), unknownBenefitTreatment: "ZERO" as never }).gaps).toContain("ECONOMIC_INFERENCE");
    expect(validate({ ...positive(), outcomeAttribution: "CAUSED_BY_ESOP" as never }).gaps).toContain("ECONOMIC_INFERENCE");
  });
  it("retains negative TSR and the unexplained share reconciliation", () => {
    const kpi = managementAllocation(0.1926, -0.2635, 1703507121);
    expect(kpi.tsrPart).toBe(0);
    expect(kpi.profitPart).toBeCloseTo(0.0013482);
    expect(2302000 - kpi.nominalShares).toBeCloseTo(5331.6995);
  });
  it("rejects 2026 references at the annual freeze", () => {
    expect(validateDisciplinePilot(positive(), accepted, new Set(["HIST", "TE08"])).gaps)
      .toContain("UNQUALIFIED_GROUP_ALIGNMENT");
  });
  it("requires an applicable dated review for historical carry and preserves direct zero", () => {
    const current = canonical("current");
    const annual = canonical("annual");
    const history = validate(positive());
    const nr = validate(proposals.current, reviews.current);
    expect(resolveDisciplinePilot(current, annual, nr, history).points).toBeNull();
    const carry = { validUntil: "2026-11-13", unaffected: true, reviewed: true, rationale: "Synthetic dated event review" };
    expect(resolveDisciplinePilot(current, annual, nr, history, carry)).toMatchObject({
      points: 1, validity: "PROVISIONAL", directPoints: null,
    });
    expect(resolveDisciplinePilot(current, annual, nr, history, { ...carry, unaffected: false }).points).toBeNull();
    const adverse = validate({ ...positive(), band: "MATERIAL_VALUE_DESTRUCTION_OR_WEAK_ECONOMIC_DISCIPLINE",
      exposure: "MATERIAL_DETRIMENT" });
    expect(resolveDisciplinePilot(current, annual, adverse, history, carry)).toMatchObject({ points: 0, validity: "CONFIRMED_CURRENT" });
  });
  it("preserves Detailed B and PX05 priority", () => {
    const current = canonical("current");
    const annual = canonical("annual");
    const nr = validate(proposals.annual, reviews.annual);
    for (const route of ["B", "PROXY"]) {
      const higher = { ...current, points: 0, validity: "CONFIRMED_CURRENT",
        routeQualification: { ...current.routeQualification, route } };
      expect(resolveDisciplinePilot(higher, annual, validate(positive()), nr)).toMatchObject({ points: 0, route, band: null });
    }
  });
  it.each([[null, 45, 97, 21], [0, 45, 98, 22], [1, 46, 98, 22]] as const)(
    "aggregates pilot points %s separately from the canonical scorecard", (points, total, weight, count) => {
      const current = canonical("current");
      const annual = canonical("annual");
      const nr = validate(proposals.annual, reviews.annual);
      const direct = points === null ? nr : points === 1 ? validate(positive()) :
        validate({ ...positive(), band: "MATERIAL_VALUE_DESTRUCTION_OR_WEAK_ECONOMIC_DISCIPLINE", exposure: "MATERIAL_DETRIMENT" });
      const result = summarizeDisciplineCandidate(prior.scorecard, resolveDisciplinePilot(current, annual, direct, nr));
      expect(result).toMatchObject({ assessed: { points: total, weight, count }, fullResearchScore: null, formalScore: null });
      expect(result.scorecard.filter(row => row.id !== "CA-DIL"))
        .toEqual(prior.scorecard.filter((row: { id: string }) => row.id !== "CA-DIL"));
      expect(prior.scorecard.find((row: { id: string }) => row.id === "CA-DIL").points).toBeNull();
    },
  );
});

it("rejects the actual pilot methodology at the official executable authority boundary", async () => {
  const { PinnedCurrentExecutableAuthority } = await import("@/infrastructure/source-admission/current-scoring-authority");
  const { manifestDigest } = await import("@/infrastructure/fundamentals/snapshot-hash");
  const path = pilot + "PILOT_METHODOLOGY.json";
  const authority = new PinnedCurrentExecutableAuthority(process.cwd(),
    { path, sha256: manifestDigest(readFileSync(path, "utf8")) }, { now: () => "2026-11-27T00:00:00Z" });
  await expect(authority.verify({} as never)).rejects.toMatchObject({ issues: [{ reason: "CURRENT_EXECUTABLE_APPROVAL_PENDING" }] });
});
