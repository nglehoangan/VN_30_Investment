import { RUBRICS } from "@/domain/scoring/methodology";
import { evaluatePublicProxy, PUBLIC_PROXY_REVIEW_OBSERVATION } from "./public-proxy-review";
import type { Assessment, ScoreInput } from "./scorecard";

export const FH_RESEARCH = "fh-evidence-sufficiency-research-v1.0.0";
export type FhId = "FH-BS" | "FH-LIQ" | "FH-STRESS";
type Topic = { refs: readonly string[]; rationale: string };
export type FinancialHealthAssessment = {
  id: FhId;
  topics: Record<string, Topic>;
  materialFunding: boolean;
  method: "NONFINANCIAL" | "BANK" | "PROPERTY";
  covenant: "COVENANT_TERMS_EVIDENCED" | "COVENANT_ABSENCE_VERIFIED" | "COVENANT_INAPPLICABLE" |
    "NONDISCLOSURE_BOUNDED" | "UNRESOLVED" | "BREACH_RISK";
  timedCoverageEstablished: boolean;
  capitalConclusionEstablished: boolean;
  maximumSupported: boolean;
  exceptionalJustification: string;
  counter: Topic & { resolved: boolean };
  proposed: { band: string; points: number; strongerEvidence: boolean } | null;
};

export function scoreFinancialHealth(a: FinancialHealthAssessment, sector: string, usable: (ref: string) => boolean) {
  const r = RUBRICS.find(row => row.id === a.id)!;
  const gaps: string[] = [];
  const evidence = (topic?: Topic) => !!topic?.rationale.trim() && topic.refs.length > 0 && topic.refs.every(usable);
  const names = a.id === "FH-BS"
    ? ["capital", "asset_quality", "leverage_context", ...(a.materialFunding || sector === "BANK" ? ["funding"] : [])]
    : a.id === "FH-LIQ" ? ["obligations", "liquidity", "maturities"]
    : ["scenario", "funding_response", "capital_response"];
  for (const name of names) if (!evidence(a.topics[name])) gaps.push(name.toUpperCase());
  if (!evidence(a.counter) || !a.counter.resolved) gaps.push("COUNTEREVIDENCE");
  const method = sector === "BANK" ? "BANK" : sector === "REAL_ESTATE" ? "PROPERTY" : "NONFINANCIAL";
  if (a.method !== method) gaps.push("SECTOR_METHOD");
  if (a.id === "FH-STRESS" && !a.capitalConclusionEstablished) gaps.push("CAPITAL_CONCLUSION_UNRESOLVED");
  const p = a.proposed;
  if (p) {
    const band = r.bands.find(row => row.label === p.band);
    if (!band || !Number.isInteger(p.points) || p.points < band.min || p.points > band.max) gaps.push("INVALID_BAND");
    else if (band.min !== band.max && p.points === band.max && !p.strongerEvidence) gaps.push("STRONGER_EVIDENCE_REQUIRED");
    if (a.id === "FH-LIQ" && p.points >= 3 && !evidence(a.topics.funding))
      gaps.push("FUNDING_DIVERSIFICATION_REQUIRED");
    if (a.id === "FH-STRESS" && p.points >= 4 && !evidence(a.topics.sensitivity))
      gaps.push("STRESS_SENSITIVITY_REQUIRED");
    if (p.points === r.max && (!a.maximumSupported || !a.exceptionalJustification.trim())) gaps.push("MAXIMUM_PREREQUISITES");
  }
  if (a.id === "FH-LIQ") {
    if (!a.timedCoverageEstablished) gaps.push("MATCHED_TIMING_UNRESOLVED");
    if (["UNRESOLVED", "BREACH_RISK"].includes(a.covenant) || !evidence(a.topics.covenants))
      gaps.push("COVENANT_DISPOSITION_UNRESOLVED");
    if (p && !gaps.length) {
      // PX01 owns the covenant and proxy declarations. The formal scorer retains its independent validation.
      const declaration = "wp2-px01";
      const observations = [...new Set(Object.values(a.topics).flatMap(topic => topic.refs))]
        .map(id => ({ id, unit: "TEXT" }));
      const proxyInput = {
        metrics: [],
        evidence: [...observations, {
          id: declaration, unit: "TEXT", classification: "ESTIMATE", observation: PUBLIC_PROXY_REVIEW_OBSERVATION,
          value: JSON.stringify({ proxy: "PX01", mode: "CONSERVATIVE", economicScope: "CONSOLIDATED_OUTCOMES",
            materialDependency: "RESOLVED", counterReview: a.counter.rationale,
            checks: ["TIMED_OBLIGATIONS", "USABLE_RESOURCES", "COVENANT_DISPOSITION", "NO_RESOURCE_OVERLAP",
              a.covenant, ...(sector === "BANK" ? ["BANK_FUNDING"] : [])],
            routeReview: { rubricId: "FH-LIQ", route: "PROXY", improvementRounds: 0, originalSearchContinued: false,
              originalSearchAfterSufficientEvidence: false, reason: a.topics.liquidity.rationale } }),
        }],
      } as unknown as Pick<ScoreInput, "metrics" | "evidence">;
      const proxyAssessment = {
        subcategory: a.id, sector, assessment: p.band, selectedPoints: p.points,
        evidence: names.map(topic => ({ topic, refs: [...a.topics[topic].refs, declaration] })),
        disconfirmingEvidence: a.counter.refs, maximumPrerequisitesMet: a.maximumSupported,
        exceptionalJustification: a.exceptionalJustification,
      } as unknown as Assessment;
      if (!evaluatePublicProxy(proxyAssessment, proxyInput, id => id === declaration || usable(id)).eligible)
        gaps.push("PX01_NOT_ELIGIBLE");
    }
  }
  const points = gaps.length ? null : p?.points ?? null;
  return { rubricId: a.id, points, band: points === null ? null : p!.band, maxPoints: r.max,
    route: points === null ? "E" : a.id === "FH-LIQ" ? "PX01" : a.method,
    gaps, totalScore: null, productionEligible: false, publicationAuthorized: false };
}

export function positiveDenominatorRatio(numerator: number, denominator: number | null, meaningful: boolean) {
  return meaningful && Number.isFinite(numerator) && denominator !== null && Number.isFinite(denominator) && denominator > 0 ? numerator / denominator : null;
}

type TimedItem = { id: string; amount: number; month: number };
export function timedLiquidity(obligations: readonly TimedItem[],
  resources: readonly (TimedItem & { kind: "AVAILABLE" | "COMMITTED" | "RESTRICTED" | "UNCOMMITTED" | "UNVERIFIED" })[]) {
  const items = [...obligations, ...resources];
  if (new Set(items.map(row => row.id)).size !== items.length ||
      items.some(row => !Number.isFinite(row.amount) || row.amount < 0 || !Number.isInteger(row.month) || row.month < 0 || row.month > 12))
    throw Error("INVALID_OR_OVERLAPPING_LIQUIDITY_ITEM");
  const qualified = resources.filter(row => row.kind === "AVAILABLE" || row.kind === "COMMITTED");
  return [...new Set(obligations.map(row => row.month))].sort((a, b) => a - b).map(month => {
    const due = obligations.filter(row => row.month <= month).reduce((sum, row) => sum + row.amount, 0);
    const available = qualified.filter(row => row.month <= month).reduce((sum, row) => sum + row.amount, 0);
    return { month, due, available, surplus: available - due, coverage: positiveDenominatorRatio(available, due, true) };
  });
}

export function runFinancialStress(x: {
  revenue: number; contraction: number; margin: number; tax: number; workingCapitalRate: number;
  interest: number; debt: number; rateShock: number; capex: number; principal: number;
  operatingLease: number; openingLiquidity: number; committedFunding: number;
}) {
  if (!Object.values(x).every(Number.isFinite) || x.revenue <= 0 || x.contraction < 0 || x.contraction >= 1 ||
      x.tax < 0 || x.tax > 1 || [x.openingLiquidity, x.committedFunding, x.capex, x.principal, x.operatingLease,
        x.workingCapitalRate, x.interest, x.debt, x.rateShock].some(value => value < 0)) throw Error("INVALID_STRESS_INPUT");
  const revenue = x.revenue * (1 - x.contraction);
  const ebit = revenue * x.margin;
  const interest = x.interest + x.debt * x.rateShock;
  const workingCapital = revenue * x.workingCapitalRate;
  const operatingCashProxy = ebit - interest - Math.max(ebit - interest, 0) * x.tax - workingCapital;
  const surplus = x.openingLiquidity + x.committedFunding + operatingCashProxy - x.capex - x.principal - x.operatingLease;
  return { ...x, stressedRevenue: revenue, ebit, stressedInterest: interest, workingCapital, operatingCashProxy, surplus,
    response: surplus < 0 ? "ADDITIONAL_FUNDING_OR_CAPITAL_RESPONSE_REQUIRED" : "SURPLUS_BEFORE_UNMODELED_OBLIGATIONS" };
}
