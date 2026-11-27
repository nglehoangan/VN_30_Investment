import { RUBRICS } from "@/domain/scoring/methodology";
import { shareholderIrr, returnBand, marginOfSafety, valuationMethods, valuationIds,
  type Assumption, type ValuationReview } from "./valuation-research";

export const VAL_V11_METHODOLOGY = "wp5-valuation-forward-return-v1.1.0";
export const VAL_V11_EXECUTABLE = "valuation-independent-research-v1.1.0";
type Id = typeof valuationIds[number];
type Original = ValuationReview["routes"]["A"];
type Path = { years: { growth: number; dilution: number }[]; multipleFactor: number };
type Model = Omit<Original, "crossCheckResolved" | "proposals" | "counterevidence"> & {
  rubric: Id; route: "A" | "B"; cutoff: string;
  proposal?: NonNullable<Original["proposals"][Id]>;
  crossCheck: { rubric: Id; model: string; status: "RESOLVED" | "NOT_MATERIAL" | "MATERIAL_CONTRADICTION";
    refs: string[]; reason: string; commonAssumptions?: string[] };
  counterevidence: Original["counterevidence"] & { commonDependency?: string };
  dividendCredit?: "ZERO_CREDIT" | "QUALIFIED_DISTRIBUTIONS";
  returnForm?: "ORDINARY" | "SCALE_FREE_ZERO_CREDIT";
  scaleFree?: { foundation: { comparable: boolean; description: string; refs: string[] };
    base: Path; moderate: Path; downside: Path; upside: Path };
};
export type ValuationReviewV11 = Omit<ValuationReview, "routes"> & { routes: Record<"A" | "B", Partial<Record<Id, Model>>> };
const accepted = new Set(["FACTUAL", "QUALIFIED_ESTIMATE", "BOUNDED_ESTIMATE"]);
const ceilings = { "VAL-PRIMARY": 6, "VAL-RET": 6, "VAL-MOS": 3 };

export function relativeShareholderIrr(path: Path) {
  if (path.years.length !== 5 || !Number.isFinite(path.multipleFactor) || path.multipleFactor <= 0 ||
    path.years.some(y => !Number.isFinite(y.growth) || y.growth <= -1 || !Number.isFinite(y.dilution) || y.dilution < 0)) return null;
  return (path.years.reduce((f, y) => f * (1 + y.growth) / (1 + y.dilution), path.multipleFactor)) ** 0.2 - 1;
}

export function evaluateValuationV11(input: ValuationReviewV11, usable: (ref: string, cutoff: string, assumptionId?: string) => boolean,
  synthetic = false) {
  const { market, cutoff, confidence } = input;
  const marketOk = market.ticker === input.ticker && market.exchange === input.exchange && market.date === cutoff && market.verifiedPrice &&
    market.verifiedShares && market.rawField === "GiaDongCua" && market.shareBasis.trim() &&
    Number.isFinite(market.price) && market.price > 0 && Number.isSafeInteger(market.shares) && market.shares > 0 &&
    market.evidence === (synthetic ? "SYNTHETIC_TEST" : "RETAINED_RAW_CLOSE");
  const fresh = input.modelFresh && !input.financialChange && !input.corporateAction;
  const confidenceOk = confidence.dimensions.length === 5 && confidence.dimensions.every(d => [0, 1, 2].includes(d)) &&
    !!confidence.rationale.trim();
  const dependency = new Map(input.assumptions.map(a => [a.id, a]));
  const documented = (a: Assumption | undefined, model: string, id: Id) => {
    if (!a || !accepted.has(a.qualification) || !a.fresh || a.cutoff > cutoff || !a.models.includes(model) ||
        !a.rubrics.includes(id) || !a.refs.length || !a.refs.every(ref => usable(ref, cutoff, a.id)) || a.value === null ||
        ![a.unit, a.period, a.rationale, a.derivation, a.materiality, a.downside, a.counterevidence, a.sensitivity,
          a.scope, a.commonDependency, a.limitations].every(value => value.trim())) return false;
    return typeof a.value === "number" ? Number.isFinite(a.value) :
      a.value.length === 2 && a.value.every(Number.isFinite) && a.value[0] <= a.value[1];
  };
  const commonGaps = [
    ...(!marketOk ? ["PRICE_OR_SHARE_BASIS_UNQUALIFIED"] : []),
    ...(!fresh ? ["MODEL_REASSESSMENT_REQUIRED"] : []),
    ...(!confidenceOk ? ["CONFIDENCE_UNQUALIFIED"] : []),
    ...(dependency.size !== input.assumptions.length ? ["DUPLICATE_ASSUMPTION_ID"] : []),
  ];
  return valuationIds.map(id => {
    const rubric = RUBRICS.find(r => r.id === id)!;
    const check = (route: "A" | "B") => {
      const m = input.routes[route][id];
      if (!m) return { model: null, method: null, points: null, band: null, proposal: null,
        gaps: ["NO_INDEPENDENT_MODEL"], irr: null, downside: null, noRerating: null, mos: null,
        valueRange: null, conservativeValue: null, ceiling: route === "A" ? ceilings[id] : rubric.max,
        unconstrainedReturnBand: null, adverseVeto: null };
      const p = m.proposal;
      const scaleFree = id === "VAL-RET" && m.returnForm === "SCALE_FREE_ZERO_CREDIT";
      const zeroCredit = scaleFree || (id === "VAL-RET" && m.dividendCredit === "ZERO_CREDIT");
      const scoped = m.cutoff === cutoff && m.rubric === id && m.route === route;
      const required = [...new Set([...m.dependencies, ...(
        id === "VAL-RET" ? scaleFree ? ["growth", "dilution", "relative_multiple"]
          : ["normalized_eps", "growth", "dilution", "exit_pe", ...(zeroCredit ? [] : ["payout"])]
        : m.method === "NORMALIZED_EARNINGS" ? ["normalized_eps", "fair_pe"]
          : ["cash_basis", "discount_rate", "terminal_growth"]
      )])];
      const unmet = required.filter(key => !documented(dependency.get(key), m.id, id));
      const bounds = (key: string): readonly [number, number] | null => {
        const value = dependency.get(key)?.value;
        return typeof value === "number" ? [value, value] : value ?? null;
      };
      const eps = bounds("normalized_eps"), multiple = bounds("fair_pe");
      const valueRange = m.method === "NORMALIZED_EARNINGS" && eps && multiple && eps[0] > 0 && multiple[0] > 0
        ? [eps[0] * multiple[0], ((eps[0] + eps[1]) / 2) * ((multiple[0] + multiple[1]) / 2), eps[1] * multiple[1]]
        : m.valueRange;
      const scenarios = m.scenarios;
      const scale = m.scaleFree;
      const foundation = scale?.foundation;
      const foundationOk = !!foundation && foundation.comparable && !!foundation.description.trim() &&
        foundation.refs.length > 0 && foundation.refs.every(ref => usable(ref, cutoff));
      const paths = scale ? [scale.base, scale.moderate, scale.downside, scale.upside] : [];
      const scenarioBound = (key: string, value: number) => {
        const bound = bounds(key);
        return !!bound && value >= bound[0] && value <= bound[1];
      };
      const scenarioBindings = scenarios && Object.values(scenarios).every(s =>
        scenarioBound("normalized_eps", s.eps) && scenarioBound("growth", s.growth) &&
        (zeroCredit ? s.payout === 0 : scenarioBound("payout", s.payout)) && scenarioBound("dilution", s.dilution) && scenarioBound("exit_pe", s.exitMultiple));
      const scaleBound = paths.length === 4 && foundationOk && scale?.base.multipleFactor === 1 &&
        scale.moderate.multipleFactor < 1 && scale.downside.multipleFactor < scale.moderate.multipleFactor && paths.every(path =>
          scenarioBound("relative_multiple", path.multipleFactor) && path.years.every(year =>
            scenarioBound("growth", year.growth) && scenarioBound("dilution", year.dilution)));
      const irr = scaleFree ? scale ? relativeShareholderIrr(scale.base) : null :
        scenarios ? shareholderIrr(market.price, scenarios.base) : null;
      const downside = scaleFree ? scale ? relativeShareholderIrr(scale.downside) : null :
        scenarios ? shareholderIrr(market.price, scenarios.downside) : null;
      const upside = scaleFree ? scale ? relativeShareholderIrr(scale.upside) : null :
        scenarios ? shareholderIrr(market.price, scenarios.upside) : null;
      const noRerating = scaleFree ? irr : scenarios ? shareholderIrr(market.price, { ...scenarios.base,
        exitMultiple: market.price / scenarios.base.eps }) : null;
      const conservativeValue = m.conservativeValue ?? (m.method === "NORMALIZED_EARNINGS" ? valueRange?.[0] : undefined);
      const mos = conservativeValue === undefined ? null : marginOfSafety(market.price, conservativeValue);
      const max = route === "A" ? ceilings[id] : rubric.max;
      const inferred = irr !== null ? returnBand(irr) : null;
      const band = p && rubric.bands.find(b => b.label === p.band && p.points >= b.min && p.points <= b.max);
      const bandCap = id === "VAL-RET" && inferred ? Math.min(inferred.max, max) : max;
      const invalidProposal = p && (p.basisPrice !== market.price || p.basisShares !== market.shares || !Number.isInteger(p.points) || !band || p.points > max ||
        ![p.rationale, p.higher, p.lower].every(s => s.trim()) ||
        (p.points === rubric.max && (!m.maximumSupported || !p.strongerEvidence)) ||
        (id === "VAL-RET" && (!inferred || p.points < Math.min(inferred.min, max) || p.points > bandCap ||
          (inferred.min !== inferred.max && p.points === inferred.max && !p.strongerEvidence))));
      const gaps = [...commonGaps, ...unmet.map(k => `ASSUMPTION_UNQUALIFIED:${k}`),
        ...(!valuationMethods[input.sector]?.some(method => method === m.method) || !m.qualifiedScope ? ["SECTOR_OR_MODEL_SCOPE_UNQUALIFIED"] : []),
        ...((!scoped || m.crossCheck.rubric !== id || m.crossCheck.model !== m.id ||
          m.crossCheck.status === "MATERIAL_CONTRADICTION" || !m.crossCheck.reason.trim() ||
          !m.crossCheck.refs.every(ref => usable(ref, cutoff))) ? ["MODEL_CROSS_CHECK_UNRESOLVED"] : []),
        ...(!m.counterevidence.rationale.trim() || !m.counterevidence.refs.length ||
          !m.counterevidence.refs.every(ref => usable(ref, cutoff)) ||
          !["RESOLVED", "BOUNDED_LIMITATION"].includes(m.counterevidence.disposition) ? ["COUNTEREVIDENCE_BLOCKS"] : []),
        ...(id === "VAL-PRIMARY" && (!valueRange || !valueRange.every(v => Number.isFinite(v) && v > 0) ||
          valueRange[0] > valueRange[1] || valueRange[1] > valueRange[2]) ? ["QUALIFIED_VALUE_RANGE_REQUIRED"] : []),
        ...(id === "VAL-RET" && (!(scaleFree ? scaleBound : scenarioBindings) || irr === null || downside === null || noRerating === null ||
          upside === null || downside > irr ||
          (p && p.points >= 6 && noRerating < 0.15)) ? ["QUALIFIED_RETURN_SCENARIOS_REQUIRED"] : []),
        ...(id === "VAL-MOS" && (mos === null || !m.impairmentReviewed) ? ["CONSERVATIVE_VALUE_AND_IMPAIRMENT_REVIEW_REQUIRED"] : []),
        ...(!p ? ["NO_ANALYST_BAND_PROPOSED"] : []), ...(invalidProposal ? ["CANONICAL_BAND_OR_CEILING"] : []),
      ];
      return { model: m.id, method: m.method, points: p && !gaps.length ? p.points : null,
        band: p && !gaps.length ? p.band : null, valueRange: valueRange ?? null, conservativeValue: conservativeValue ?? null, proposal: p ?? null, gaps, irr, downside, noRerating, mos,
        unconstrainedReturnBand: inferred?.label ?? null, ceiling: max, adverseVeto: null };
    };
    const B = check("B"), A = check("A");
    const fallback = input.routes.A[id];
    const adverse = fallback && Object.values(input.routes.B).find(model => {
      const counter = model.counterevidence;
      return model.cutoff === cutoff && model.route === "B" &&
        ["INVALIDATED", "MATERIAL_CONTRADICTION"].includes(counter.disposition) &&
        !!counter.commonDependency && fallback.dependencies.includes(counter.commonDependency) &&
        !!counter.rationale.trim() && counter.refs.length > 0 && counter.refs.every(ref => usable(ref, cutoff));
    })?.counterevidence;
    const veto = adverse
      ? { rubric: id, affectedRoute: "A", refs: adverse.refs, commonDependency: adverse.commonDependency,
          reason: adverse.rationale, disposition: adverse.disposition } : null;
    const qualifiedA = veto ? { ...A, points: null, band: null, adverseVeto: veto,
      gaps: [...A.gaps, "MATERIAL_COMMON_DEPENDENCY_ADVERSE_VETO"] } : A;
    const route = B.points !== null ? "B" : qualifiedA.points !== null ? "A" : null;
    const selected = route === "B" ? B : route === "A" ? qualifiedA : null;
    const quality = { ...confidence, total: confidence.dimensions.reduce((sum, d) => sum + d, 0) };
    return { id, points: selected?.points ?? null, validity: selected ? "CONFIRMED_CURRENT" : "N/R",
      basis: selected ? "RECALCULATED_AT_CUTOFF" : null, reviewCutoff: cutoff, financialPeriod: input.assumptions[0]?.period ?? null,
      confidence: quality, routeQualification: { route, methodology: VAL_V11_METHODOLOGY, model: selected?.model ?? null,
        researchOnly: true, synthetic, marketDate: market.date, shareBasis: market.shareBasis }, routes: { B, A: qualifiedA } };
  });
}
