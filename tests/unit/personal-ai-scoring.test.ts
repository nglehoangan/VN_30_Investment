// @vitest-environment node
import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { calculateScorecard as human } from "@/domain/scoring/scorecard";
import { calculateScorecard as ai } from "@/domain/personal-ai/scorecard";
import { validateDIAcceptance, evaluateScoringReadiness, bindDIAcceptance } from "@/domain/personal-ai/scoring-readiness";
import { validateDIAcceptance as legacyAcceptance } from "@/domain/fundamentals/scoring-readiness";
import { snapshotHash, manifestDigest } from "@/infrastructure/fundamentals/snapshot-hash";
import { validateAiScoringReview, validateAiPassArtifact } from "@/domain/personal-ai/provenance";
import { fixture, award } from "../fixtures/scoring";
import { reviewedAiInput, signAiInput, personalAiDatasetFixture } from "../fixtures/personal-ai-scoring";
import { SECTORS } from "@/domain/scoring/methodology";
const numerical = (c: ReturnType<typeof human> | ReturnType<typeof ai>) => ({ totalScore: c.totalScore, categories: c.categories, rows: c.subcategories.map(s => ({ id:s.id, max:s.max, points:s.points, status:s.status, missingTopics:s.missingTopics })), metrics: c.metrics, validity:c.validity, confidence:c.confidence, dataQuality:c.dataQuality, missingEvidence:c.missingEvidence, blockingEvidence:c.blockingEvidence });
describe("versioned personal AI financial compatibility", () => {
  it("locks every financial branch to the legacy algorithm with explicit origin-only transformations", () => {
    expect(execFileSync(process.execPath, ["scripts/generate-personal-ai-compatibility.mjs", "--check"], { encoding: "utf8" })).toContain("PARITY_CHECK_PASS");
  });
  it.each(SECTORS)("preserves points, weights, financial gates and missing data in %s", sector => {
    const source = fixture(0, sector), input = reviewedAiInput(source).input, card = ai(input, snapshotHash);
    expect(numerical(card)).toEqual(numerical(human(source)));
    expect(card).toMatchObject({ contract:"personal-ai-scorecard-v1", reviewMode:"OWNER_AUTHORIZED_AI_SELF_REVIEW", independentHumanReviewClaimed:false, operationalAuthorizationGranted:false });
    expect(card.input.assessments.every(a => a.source === "AI")).toBe(true); expect(Object.isFrozen(card.input.review)).toBe(true);
  });
  it("preserves return bands and maximum prerequisites", () => {
    const source = award(fixture(), "VAL-RET", 8);
    expect(() => human(source)).toThrow(); expect(() => ai(reviewedAiInput(source).input, snapshotHash)).toThrow();
    const x = fixture(); const y = { ...x, assessments: x.assessments.map((a,i) => i===0 ? { ...a, selectedPoints: 999 } : a) };
    expect(() => ai(reviewedAiInput(y).input, snapshotHash)).toThrow();
  });
  it("keeps missing evidence, low confidence, risk veto and double-counting gates", () => {
    for (const source of [ { ...fixture(), assessments: [] }, { ...fixture(), criticalMissing: ["missing-proof"] }, { ...fixture(), confidence: { ...fixture().confidence, level:"LOW" as const } }, { ...fixture(), hardVeto: { ...fixture().hardVeto, status:"ACTIVE" as const } }, { ...fixture(), doubleCountReview:{ ...fixture().doubleCountReview, passed:false } } ]) {
      expect(numerical(ai(reviewedAiInput(source).input, snapshotHash))).toEqual(numerical(human(source)));
    }
  });
  it("does not permit HUMAN/AI relabeling through either legacy entry point", () => {
    const input = reviewedAiInput(fixture()).input;
    expect(() => human(input as never)).toThrow();
    const wrong = { ...input, assessments: input.assessments.map(a => ({ ...a, source:"HUMAN" })) };
    expect(() => ai(wrong as never, snapshotHash)).toThrow();
    expect(() => ai({ ...input, productionAuthorized:true } as never, snapshotHash)).toThrow();
  });
});
describe("AI provenance and dataset contract v1", () => {
  it("binds both recorded passes to input, evidence, methodology, rules and each rubric", () => {
    const { input, artifacts } = reviewedAiInput(fixture());
    expect(validateAiScoringReview(input, snapshotHash).independentHumanReviewClaimed).toBe(false);
    artifacts.forEach((a,i) => validateAiPassArtifact(a,input.review.passes[i],input.review));
    expect(() => ai({ ...input, assessments: input.assessments.slice(1) }, snapshotHash)).toThrow();
    expect(() => ai({ ...input, evidence: input.evidence.slice(1) }, snapshotHash)).toThrow();
    expect(() => ai({ ...input, review: { ...input.review, financialRulesHash:"a".repeat(64) } }, snapshotHash)).toThrow();
  });
  it("rejects invented independence, unknown/future timestamps and missing second pass", () => {
    const { input } = reviewedAiInput(fixture());
    for (const review of [ { ...input.review, independentHumanReviewClaimed:true }, { ...input.review, passes:[input.review.passes[0]] }, { ...input.review, passes: input.review.passes.map(p=>({ ...p, at:"2030-01-01T00:00:00.000Z" })) }, { ...input.review, passes: input.review.passes.map(p=>({ ...p, at:null })) } ]) expect(() => ai({ ...input, review } as never, snapshotHash)).toThrow();
  });
  it("rejects changed session/tool results and failed expected-versus-actual checks", () => {
    const { input, artifacts } = reviewedAiInput(fixture()), a = artifacts[1], p=input.review.passes[1];
    expect(() => validateAiPassArtifact({ ...a, sessionReference:"forged-session" },p,input.review)).toThrow();
    expect(() => validateAiPassArtifact({ ...a, toolReferences:["different-tool"] },p,input.review)).toThrow();
    expect(() => validateAiPassArtifact({ ...a, checks: a.checks.map(c=>({ ...c, actualHash:"b".repeat(64) })) },p,input.review)).toThrow();
  });
  it("accepts a fully bound synthetic AI case without claiming human independence", () => {
    const f=personalAiDatasetFixture(); validateDIAcceptance(f.acceptance); bindDIAcceptance(f.acceptance,f.snapshot,snapshotHash,manifestDigest);
    const r=evaluateScoringReadiness(f.acceptance,f.snapshot,f.sources,snapshotHash);
    expect(r).toHaveLength(30); expect(r.filter(t=>t.readyForScoring)).toHaveLength(1);
    expect(() => legacyAcceptance(f.acceptance as never)).toThrow(); expect(() => validateDIAcceptance({ ...f.acceptance, contract:"independent-di-acceptance-v1" } as never)).toThrow();
  });
  it("retains all 15 gates, full universe, unresolved major issue and strict-v2 requirements", () => {
    const f=personalAiDatasetFixture(), a=f.acceptance;
    for(const broken of [ { ...a,gates:a.gates.slice(1) }, { ...a,tickers:a.tickers.slice(1) }, { ...a,issues:[{id:"unresolved",severity:"MAJOR",resolutionReference:null}] }, { ...a,requirements:{ ...a.requirements,algorithm:"strict-canonical-m3-readiness-v1" } } ]) expect(()=>validateDIAcceptance(broken as never)).toThrow();
    const source={ ...f.input,evidence:f.input.evidence.filter(e=>e.observation!=="conservative_value") };
    const changed=signAiInput(source).input;
    expect(evaluateScoringReadiness({ ...a,tickers:a.tickers.map(t=>t.input?{...t,input:changed}:t) },f.snapshot,f.sources,snapshotHash)[0].readyForScoring).toBe(false);
  });
});
