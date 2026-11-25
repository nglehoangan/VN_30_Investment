import { expect, it } from "vitest";
import { RUBRICS, CATEGORY_MAXIMA } from "@/domain/scoring/methodology";
import { calculatePublicProxyCandidate } from "@/domain/current-scoring/public-proxy-candidate";
import {
  PUBLIC_PROXY_EXECUTABLE, PUBLIC_PROXY_REVIEW_OBSERVATION, PUBLIC_PROXY_VERSION,
  validatePublicRouteReview, type ProxyReview,
} from "@/domain/current-scoring/public-proxy-review";
import { calculateScorecard } from "@/domain/current-scoring/scorecard";
import { AI_SCORING_IMPLEMENTATION } from "@/domain/current-scoring/provenance";
import { snapshotHash } from "@/infrastructure/fundamentals/snapshot-hash";
import { ASOF, award, fixture } from "../fixtures/scoring";
import { reviewedAiInput, signAiInput } from "../fixtures/personal-ai-scoring";

const cases = [
  { id: "FH-LIQ", proxy: "PX01", sector: "BANK", points: 3, sectorCheck: "BANK_FUNDING",
    checks: ["TIMED_OBLIGATIONS", "USABLE_RESOURCES", "COVENANT_DISPOSITION", "NO_RESOURCE_OVERLAP", "COVENANT_TERMS_EVIDENCED", "BANK_FUNDING"] },
  { id: "GQ-INC", proxy: "PX02", sector: "RETAIL", points: 3, sectorCheck: "COHORTS_IMMATERIAL",
    checks: ["ALIGNED_OPERANDS", "PERSISTENCE", "SCOPE_BRIDGE", "INDEPENDENT_CORROBORATION", "GRANULARITY_REVIEW", "COHORTS_IMMATERIAL"] },
  { id: "IC-POS", proxy: "PX03", sector: "TECHNOLOGY", points: 2, sectorCheck: "MATCHED_POSITION",
    checks: ["DEFINED_POPULATION", "MATCHED_POSITION", "INDEPENDENT_COST", "DISTRIBUTION"] },
  { id: "CA-REINV", proxy: "PX04", sector: "INDUSTRIAL", points: 1, sectorCheck: "OPERATING_OUTCOMES",
    checks: ["CASH_CAPEX", "EVENT_COVERAGE", "OPERATING_OUTCOMES", "ALLOCATION_LINK", "ACTION_SCOPE_REVIEW"] },
  { id: "CA-DIL", proxy: "PX05", sector: "BANK", points: 1, sectorCheck: "NO_EVENT_WINDOW_RECONCILED",
    checks: ["EVENT_COVERAGE", "SHAREHOLDER_PROTECTION", "VERIFIED_NO_MATERIAL_DILUTION", "NO_EVENT_WINDOW_RECONCILED"] },
] as const;

function packet(entry: typeof cases[number], changes: Partial<ProxyReview> = {}, options: {
  sector?: Parameters<typeof fixture>[1]; points?: number; actionComparable?: boolean; perShare?: boolean; missingTopic?: boolean; maximumSupport?: boolean; includeProxy?: boolean;
} = {}) {
  const ai = reviewedAiInput(award(fixture(0, options.sector ?? entry.sector), entry.id, options.points ?? entry.points)).input;
  const declaration = {
    ...ai.evidence[0], id: "proxy-review", family: "proxy-review", critical: false,
    observation: PUBLIC_PROXY_REVIEW_OBSERVATION, classification: "ESTIMATE" as const,
    value: JSON.stringify({ proxy: entry.proxy, mode: "CONSERVATIVE", economicScope: "CONSOLIDATED_OUTCOMES",
      materialDependency: "RESOLVED", checks: entry.checks, counterReview: "Reviewed synthetic adverse case",
      routeReview: { rubricId: entry.id, route: "PROXY", improvementRounds: 0, originalSearchContinued: false,
        originalSearchAfterSufficientEvidence: false, reason: "Public evidence sufficiently covers the required topic" }, ...changes }),
  };
  const assessments = ai.assessments.map(a => a.subcategory !== entry.id ? a : {
    ...a, maximumPrerequisitesMet: options.maximumSupport ?? true,
    evidence: a.evidence.flatMap((topic, index) => index === 1 && options.missingTopic ? [] : [{
      ...topic, refs: index === 0 && options.includeProxy !== false ? [...topic.refs, declaration.id] : topic.refs,
    }]),
  });
  const evidence = ai.evidence.map(row => (
    options.perShare && row.id === assessments.find(a => a.subcategory === entry.id)?.evidence[0].refs[0]
      ? { ...row, unit: "VND_PER_SHARE" as const, value: "100" } : row
  ));
  const currentPurpose = {
    contract: "current-scoring-time-v1", purpose: "CURRENT_FORMAL_VALUATION",
    economicCutoff: ASOF.slice(0, 10), evaluatedAt: ASOF,
  } as const;
  const unsigned = { ...ai, currentPurpose, evidence: [...evidence, declaration], assessments,
    methodology: { ...ai.methodology, implementationIdentity: PUBLIC_PROXY_EXECUTABLE, configurationReference: PUBLIC_PROXY_VERSION },
    normalization: { ...ai.normalization, actionComparable: options.actionComparable ?? true } };
  return { ...signAiInput(unsigned).input, currentPurpose };
}

function row(input: ReturnType<typeof packet>, id: string) {
  return calculatePublicProxyCandidate(input, snapshotHash).subcategories.find(item => item.id === id);
}

it.each(cases)("$proxy supports a reviewed public assessment and conservative band minimum", entry => {
  expect(row(packet(entry), entry.id)).toMatchObject({ status: "SCORED", points: entry.points });
  expect(row(packet(entry, { mode: "VERIFIED" }), entry.id)).toMatchObject({ status: "SCORED", points: entry.points });
});

it.each(cases)(" $proxy retains null when topic, sector/control or material dependency is unresolved", entry => {
  const invalids = [
    packet(entry, {}, { missingTopic: true }),
    packet(entry, { checks: [...entry.checks].filter(item => item !== entry.sectorCheck) }),
    packet(entry, { materialDependency: "UNRESOLVED" }),
  ];
  for (const input of invalids) {
    const card = calculatePublicProxyCandidate(input, snapshotHash);
    expect(card.subcategories.find(item => item.id === entry.id)).toMatchObject({ status: "N/R", points: null });
    expect(card.totalScore).toBeNull();
  }
});

it.each(cases)(" $proxy preserves maximum prerequisites", entry => {
  const max = RUBRICS.find(item => item.id === entry.id)!.max;
  expect(() => calculatePublicProxyCandidate(packet(entry, { mode: "VERIFIED" }, {
    points: max, maximumSupport: false,
  }), snapshotHash)).toThrow(expect.objectContaining({ issues: [expect.objectContaining({ reason: "MAXIMUM_PREREQUISITES_REQUIRED" })] }));
});

it("uses bounded nondisclosure only below FH-LIQ maximum and retains the conservative band minimum", () => {
  const entry = cases[0];
  const checks = [...entry.checks].map(item => item === "COVENANT_TERMS_EVIDENCED" ? "NONDISCLOSURE_BOUNDED" : item);
  expect(row(packet(entry, { checks }), entry.id)).toMatchObject({ points: 3 });
  expect(row(packet(entry, { checks }, { points: 4 }), entry.id)).toMatchObject({ points: null });
  expect(row(packet(cases[1], {}, { points: 5 }), "GQ-INC")).toMatchObject({ points: 5 });
});

it("uses BANK capital efficiency and deployment rather than industrial proxies", () => {
  const growth = cases[1];
  expect(row(packet(growth, {}, { sector: "BANK" }), growth.id)).toMatchObject({ points: null });
  expect(row(packet(growth, { checks: [...growth.checks, "BANK_CAPITAL_EFFICIENCY"] }, { sector: "BANK" }), growth.id))
    .toMatchObject({ points: 3 });
  const allocation = cases[3];
  expect(row(packet(allocation, {}, { sector: "BANK" }), allocation.id)).toMatchObject({ points: null });
  const checks = [...allocation.checks].map(item => item === "CASH_CAPEX" ? "BANK_CAPITAL_DEPLOYMENT" : item);
  expect(row(packet(allocation, { checks }, { sector: "BANK" }), allocation.id)).toMatchObject({ points: 1 });
});

it("requires representative market leadership at IC-POS maximum", () => {
  const entry = cases[2];
  expect(row(packet(entry, {}, { points: 4 }), entry.id)).toMatchObject({ points: null });
  expect(row(packet(entry, { checks: [...entry.checks, "REPRESENTATIVE_MARKET_LEADERSHIP"] }, { points: 4 }), entry.id))
    .toMatchObject({ points: 4 });
});

it("relaxes only a reviewed consolidated CA-REINV dependency", () => {
  const entry = cases[3];
  const input = packet(entry, {}, { actionComparable: false });
  const card = calculatePublicProxyCandidate(input, snapshotHash);
  expect(card.subcategories.find(item => item.id === entry.id)).toMatchObject({ points: 1 });
  for (const id of ["GQ-HIST", "VAL-PRIMARY", "VAL-RET", "VAL-MOS", "CA-DIST", "CA-DIL", "CA-PSV"]) {
    expect(card.subcategories.find(item => item.id === id)).toMatchObject({ points: null });
  }
  expect(row(packet(entry, {}, { actionComparable: false, perShare: true }), entry.id)).toMatchObject({ points: null });
  expect(row(packet(entry, {}, { actionComparable: false, includeProxy: false }), entry.id)).toMatchObject({ points: null });
  expect(row(packet(entry, { economicScope: "PER_SHARE_OR_SCOPE_AFFECTED" }, { actionComparable: false }), entry.id))
    .toMatchObject({ points: null });
});

it("distinguishes reviewed CA-DIL absence, evidenced harm and missing coverage", () => {
  const entry = cases[4];
  expect(row(packet(entry, {}, { points: 0 }), entry.id)).toMatchObject({ points: null });
  const checks = ["EVENT_COVERAGE", "SHAREHOLDER_PROTECTION", "MATERIAL_DESTRUCTION", "EVENT_VALUE", "ISSUE_TERMS", "NET_PROCEEDS", "RIGHTS_AND_OFFSETS"];
  expect(row(packet(entry, { checks }, { points: 0 }), entry.id)).toMatchObject({ points: 0 });
  expect(row(packet(entry, { checks }, { points: 1 }), entry.id)).toMatchObject({ points: null });
});

it("enforces bounded discovery and requires an N/R reason and trigger", () => {
  const review = { rubricId: "FH-LIQ", route: "PROXY", improvementRounds: 0, originalSearchContinued: false,
    originalSearchAfterSufficientEvidence: false, reason: "Admitted obligations and covenant review cover the topic" } as const;
  expect(() => validatePublicRouteReview(review)).not.toThrow();
  expect(() => validatePublicRouteReview({ ...review, originalSearchAfterSufficientEvidence: true })).toThrow();
  expect(() => validatePublicRouteReview({ ...review, improvementRounds: 2 as 1 })).toThrow();
  expect(() => validatePublicRouteReview({ ...review, route: "MODEL", originalSearchContinued: true })).toThrow();
  expect(() => validatePublicRouteReview({ ...review, route: "N_R" })).toThrow();
  expect(() => validatePublicRouteReview({ ...review, route: "N_R", improvementRounds: 1, reopeningTrigger: "Exact dated short-term maturity note" })).not.toThrow();
});

it("preserves 23 rubrics, 100 points and legacy results without a proxy declaration", () => {
  const input = packet(cases[0], {}, { includeProxy: false });
  const legacy = { ...signAiInput({ ...input, methodology: {
    ...input.methodology, implementationIdentity: AI_SCORING_IMPLEMENTATION,
  } }).input, currentPurpose: input.currentPurpose };
  const current = calculateScorecard(legacy, snapshotHash);
  const candidate = calculatePublicProxyCandidate(input, snapshotHash);
  expect(candidate.subcategories).toEqual(current.subcategories);
  expect(candidate.totalScore).toBe(current.totalScore);
  expect(RUBRICS).toHaveLength(23);
  expect(RUBRICS.reduce((sum, item) => sum + item.max, 0)).toBe(100);
  expect(Object.keys(CATEGORY_MAXIMA)).toHaveLength(7);
});

it("rejects a formal candidate invocation", () => {
  const input = packet(cases[0]);
  const signed = signAiInput({ ...input, artifactScope: "FORMAL" }).input;
  expect(() => calculatePublicProxyCandidate({ ...signed, currentPurpose: input.currentPurpose }, snapshotHash))
    .toThrow(expect.objectContaining({ issues: [expect.objectContaining({ reason: "PUBLIC_PROXY_CANDIDATE_NOT_ACTIVATED" })] }));
});
