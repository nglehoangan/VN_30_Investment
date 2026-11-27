import { RUBRICS } from "@/domain/scoring/methodology";

export const VAL_METHODOLOGY = "wp5-valuation-forward-return-v1.0.0";
export const VAL_EXECUTABLE = "valuation-route-research-v1.0.0";
export const valuationMethods = {
  TECHNOLOGY: ["DCF", "SOTP", "OWNER_EARNINGS", "NORMALIZED_EARNINGS", "EV_EBIT"],
  BANK: ["RESIDUAL_INCOME", "JUSTIFIED_PB", "NORMALIZED_EARNINGS"],
  REAL_ESTATE: ["RNAV", "PROJECT_CASH_FLOW"],
  RETAIL: ["NORMALIZED_EARNINGS", "DCF", "OWNER_EARNINGS", "EV_EBIT"],
  CONSUMER: ["NORMALIZED_EARNINGS", "DCF", "OWNER_EARNINGS", "EV_EBIT"],
  MATERIALS: ["MID_CYCLE_EV_EBIT", "MID_CYCLE_EARNINGS"],
  UTILITIES: ["DCF", "REGULATED_CASH_FLOW", "EV_EBIT"],
  SECURITIES: ["JUSTIFIED_PB", "NORMALIZED_EARNINGS"],
  CONGLOMERATE: ["SOTP", "NAV"],
} as const;

export const valuationIds = ["VAL-PRIMARY", "VAL-RET", "VAL-MOS"] as const;
type Id = typeof valuationIds[number];
type Status = "FACTUAL" | "QUALIFIED_ESTIMATE" | "BOUNDED_ESTIMATE" | "SENSITIVITY_ONLY" | "UNSUPPORTED" | "INVALIDATED";
export type Assumption = {
  id: string; value: number | readonly [number, number] | null; unit: string;
  period: string; cutoff: string; classification: "FACT" | "DERIVED" | "ESTIMATE" | "ASSUMPTION"; qualification: Status;
  refs: string[]; rationale: string; derivation: string; materiality: string; downside: string; counterevidence: string;
  sensitivity: string; scope: string; commonDependency: string; limitations: string; fresh: boolean;
  models: string[]; rubrics: Id[];
};
type Proposal = { basisPrice: number; basisShares: number; points: number; band: string; rationale: string; higher: string; lower: string; strongerEvidence: boolean };
type Scenario = { eps: number; growth: number; dilution: number; payout: number; exitMultiple: number };
type Candidate = {
  id: string; method: string; dependencies: string[]; qualifiedScope: boolean; crossCheckResolved: boolean;
  counterevidence: { refs: string[]; disposition: "RESOLVED" | "BOUNDED_LIMITATION" | "MATERIAL_CONTRADICTION" | "INVALIDATED"; rationale: string };
  scenarios?: { base: Scenario; downside: Scenario; upside: Scenario };
  valueRange?: readonly [number, number, number];
  conservativeValue?: number; impairmentReviewed: boolean; maximumSupported: boolean;
  proposals: Partial<Record<Id, Proposal>>;
};
type Market = {
  ticker: string; exchange: string; date: string; price: number; shares: number; evidence: "RETAINED_RAW_CLOSE" | "SYNTHETIC_TEST";
  rawField: string; verifiedPrice: boolean; verifiedShares: boolean; shareBasis: string;
};
export type ValuationReview = {
  ticker: string; exchange: string; cutoff: string; sector: keyof typeof valuationMethods;
  market: Market; assumptions: Assumption[]; routes: { B: Candidate; A: Candidate };
  modelFresh: boolean; financialChange: boolean; corporateAction: boolean;
  confidence: { dimensions: readonly [number, number, number, number, number]; rationale: string };
};
const accepted = new Set<Status>(["FACTUAL", "QUALIFIED_ESTIMATE", "BOUNDED_ESTIMATE"]);
const ceilings = { "VAL-PRIMARY": 6, "VAL-RET": 6, "VAL-MOS": 3 };

export function shareholderFlows(s: Scenario) {
  if (![s.eps, s.growth, s.dilution, s.payout, s.exitMultiple].every(Number.isFinite) ||
      s.eps <= 0 || s.growth <= -1 || s.dilution < 0 || s.payout < 0 || s.payout > 1 || s.exitMultiple <= 0) return null;
  return Array.from({ length: 5 }, (_, i) => {
    const eps = s.eps * ((1 + s.growth) / (1 + s.dilution)) ** (i + 1);
    return eps * (s.payout + (i === 4 ? s.exitMultiple : 0));
  });
}

export function shareholderIrr(price: number, scenario: Scenario) {
  const flows = shareholderFlows(scenario);
  if (!flows || !Number.isFinite(price) || price <= 0) return null;
  const npv = (r: number) => flows.reduce((n, cash, i) => n + cash / (1 + r) ** (i + 1), -price);
  let low = -0.999999, high = 1;
  while (npv(high) > 0 && high < 1e6) high *= 2;
  if (npv(high) > 0 || npv(low) < 0) return null;
  for (let i = 0; i < 90; i++) {
    const mid = (low + high) / 2;
    if (npv(mid) > 0) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

export function reverseGrowth(price: number, target: number, scenario: Scenario) {
  let low = -0.99, high = 2;
  const test = (growth: number) => shareholderIrr(price, { ...scenario, growth });
  const lower = test(low), upper = test(high);
  if (lower === null || upper === null || lower > target || upper < target) return null;
  for (let i = 0; i < 70; i++) {
    const mid = (low + high) / 2;
    if ((test(mid) ?? -Infinity) < target) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

export function ownerEarningsDcf(s: Pick<Scenario, "eps" | "growth" | "dilution">, conversion: number,
  discount: number, terminalGrowth: number) {
  if (![s.eps, s.growth, s.dilution, conversion, discount, terminalGrowth].every(Number.isFinite) ||
      s.eps <= 0 || s.growth <= -1 || s.dilution < 0 || conversion < 0 || conversion > 1 ||
      terminalGrowth <= -1 || discount <= terminalGrowth || discount <= 0) return null;
  const flows = Array.from({ length: 5 }, (_, i) =>
    s.eps * conversion * ((1 + s.growth) / (1 + s.dilution)) ** (i + 1));
  const terminal = flows[4] * (1 + terminalGrowth) / (discount - terminalGrowth) / (1 + discount) ** 5;
  return { value: flows.reduce((v, f, i) => v + f / (1 + discount) ** (i + 1), terminal), terminal };
}

export const marginOfSafety = (price: number, value: number) =>
  Number.isFinite(price) && price > 0 && Number.isFinite(value) && value > 0 ? 1 - price / value : null;

export function returnBand(irr: number) {
  if (!Number.isFinite(irr)) return null;
  const thresholds = [0.08, 0.12, 0.15, 0.18, 0.22];
  const index = thresholds.findIndex(t => irr < t);
  return RUBRICS.find(r => r.id === "VAL-RET")!.bands[index < 0 ? thresholds.length : index];
}

export function evaluateValuation(input: ValuationReview, usable: (ref: string, cutoff: string) => boolean,
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
        !a.rubrics.includes(id) || !a.refs.length || !a.refs.every(ref => usable(ref, cutoff)) || a.value === null ||
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
      const m = input.routes[route];
      const p = m.proposals[id];
      const required = [...new Set([...m.dependencies, ...(
        id === "VAL-RET" ? ["normalized_eps", "growth", "payout", "dilution", "exit_pe"] :
        m.method === "NORMALIZED_EARNINGS" ? ["normalized_eps", "fair_pe"] : ["cash_basis", "discount_rate", "terminal_growth"]
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
      const scenarioBound = (key: string, value: number) => {
        const bound = bounds(key);
        return !!bound && value >= bound[0] && value <= bound[1];
      };
      const scenarioBindings = scenarios && Object.values(scenarios).every(s =>
        scenarioBound("normalized_eps", s.eps) && scenarioBound("growth", s.growth) &&
        scenarioBound("payout", s.payout) && scenarioBound("dilution", s.dilution) && scenarioBound("exit_pe", s.exitMultiple));
      const irr = scenarios ? shareholderIrr(market.price, scenarios.base) : null;
      const downside = scenarios ? shareholderIrr(market.price, scenarios.downside) : null;
      const noRerating = scenarios ? shareholderIrr(market.price, { ...scenarios.base,
        exitMultiple: market.price / scenarios.base.eps }) : null;
      const conservativeValue = m.method === "NORMALIZED_EARNINGS" ? valueRange?.[0] : m.conservativeValue;
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
        ...(!m.crossCheckResolved ? ["MODEL_CROSS_CHECK_UNRESOLVED"] : []),
        ...(!m.counterevidence.rationale.trim() || !m.counterevidence.refs.length ||
          !m.counterevidence.refs.every(ref => usable(ref, cutoff)) ||
          !["RESOLVED", "BOUNDED_LIMITATION"].includes(m.counterevidence.disposition) ? ["COUNTEREVIDENCE_BLOCKS"] : []),
        ...(id === "VAL-PRIMARY" && (!valueRange || !valueRange.every(v => Number.isFinite(v) && v > 0) ||
          valueRange[0] > valueRange[1] || valueRange[1] > valueRange[2]) ? ["QUALIFIED_VALUE_RANGE_REQUIRED"] : []),
        ...(id === "VAL-RET" && (!scenarios || !scenarioBindings || irr === null || downside === null || noRerating === null ||
          shareholderIrr(market.price, scenarios.upside) === null || downside > irr ||
          (p && p.points >= 6 && noRerating < 0.15)) ? ["QUALIFIED_RETURN_SCENARIOS_REQUIRED"] : []),
        ...(id === "VAL-MOS" && (mos === null || !m.impairmentReviewed) ? ["CONSERVATIVE_VALUE_AND_IMPAIRMENT_REVIEW_REQUIRED"] : []),
        ...(!p ? ["NO_ANALYST_BAND_PROPOSED"] : []), ...(invalidProposal ? ["CANONICAL_BAND_OR_CEILING"] : []),
      ];
      return { model: m.id, method: m.method, points: p && !gaps.length ? p.points : null,
        band: p && !gaps.length ? p.band : null, valueRange: valueRange ?? null, conservativeValue: conservativeValue ?? null, proposal: p ?? null, gaps, irr, downside, noRerating, mos,
        unconstrainedReturnBand: inferred?.label ?? null, ceiling: max };
    };
    const B = check("B"), A = check("A");
    const priorAdverse = input.routes.B.counterevidence.disposition === "INVALIDATED" ||
      input.routes.B.counterevidence.disposition === "MATERIAL_CONTRADICTION";
    const route = B.points !== null ? "B" : A.points !== null && !priorAdverse ? "A" : null;
    const selected = route === "B" ? B : route === "A" ? A : null;
    const quality = { ...confidence, total: confidence.dimensions.reduce((sum, d) => sum + d, 0) };
    return { id, points: selected?.points ?? null, validity: selected ? "CONFIRMED_CURRENT" : "N/R",
      basis: selected ? "RECALCULATED_AT_CUTOFF" : null, reviewCutoff: cutoff, financialPeriod: input.assumptions[0]?.period ?? null,
      confidence: quality, routeQualification: { route, methodology: VAL_METHODOLOGY, model: selected?.model ?? null,
        researchOnly: true, synthetic, marketDate: market.date, shareBasis: market.shareBasis }, routes: { B, A } };
  });
}
