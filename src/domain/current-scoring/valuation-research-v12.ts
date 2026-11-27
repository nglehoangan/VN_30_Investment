import { returnBand } from "./valuation-research";
import { evaluateValuationV11, relativeShareholderIrr, type ValuationReviewV11 } from "./valuation-research-v11";

export const VAL_V12_METHODOLOGY = "wp5-bounded-irr-v1.2.0";
export const VAL_V12_EXECUTABLE = "valuation-bounded-irr-research-v1.2.0";
const keys = ["foundation", "growth", "entitlement", "dilution", "distribution", "relative_multiple", "terminal_stub", "funding_downside"] as const;
type Key = typeof keys[number];
type Evidence = { status: "QUALIFIED" | "UNBOUNDED" | "SENSITIVITY_ONLY"; refs: string[]; rationale: string };
type Interval = readonly [number, number];
type Path = { id: string; years: { growth: number; dilution: number }[]; multipleFactor: number; equivalentDps: number[];
  terminalFactor: number; role: "LOWER" | "INTERIOR" | "UPPER" };
type Dependency = Evidence & { material: boolean; bounds?: Interval };
type Proposal = { points: number; band: string; basisPrice: number; basisShares: number;
  rationale: string; higher: string; lower: string; strongerEvidence: boolean };
export type BoundedReturn = {
  issuer: string; cutoff: string; informationCutoff: string; model: string; terminal: string;
  marketPrice: number; shares: number; shareBasis: string;
  distribution: "ZERO_CREDIT" | "QUALIFIED_DISTRIBUTIONS";
  dependencies: Record<Key, Dependency> & Record<string, Dependency>;
  uncertainty: Evidence & { complete: boolean; boundaryLogic: string; coherence: string; excluded: { scenario: string; reason: string; material: boolean }[] };
  investorEntitlement: { comparableBasis: boolean; noDoubleDilution: boolean; rationale: string };
  counter: Evidence & { materialContradiction: boolean };
  paths: Path[];
  conservativeCase?: Evidence & { scenarioId: string; independentlySupported: boolean };
  proposal: Proposal | null;
};

function calculatePath(price: number, path: Path) {
  if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(path.terminalFactor) || path.terminalFactor <= 0 ||
      path.equivalentDps.length !== 5 || path.equivalentDps.some(d => !Number.isFinite(d) || d < 0)) return null;
  const zero = relativeShareholderIrr({ years: path.years, multipleFactor: path.multipleFactor * path.terminalFactor });
  if (zero === null || !Number.isFinite(zero)) return null;
  if (path.equivalentDps.every(d => d === 0)) return zero;
  const terminal = price * (1 + zero) ** 5;
  const npv = (rate: number) => path.equivalentDps.reduce((sum, cash, i) =>
    sum + (cash + (i === 4 ? terminal : 0)) / (1 + rate) ** (i + 1), -price);
  let low = -.999999, high = 1;
  while (npv(high) > 0 && high < 1e6) high *= 2;
  if (npv(low) < 0 || npv(high) > 0) return null;
  for (let i = 0; i < 90; i++) {
    const mid = (low + high) / 2;
    if (npv(mid) > 0) low = mid; else high = mid;
  }
  return (low + high) / 2;
}

export function evaluateBoundedReturn(input: ValuationReviewV11, assessment: BoundedReturn,
  usable: (ref: string, cutoff: string, assumptionId?: string) => boolean, synthetic = false) {
  const legacy = evaluateValuationV11({ ...input, routes: {
    B: { "VAL-RET": input.routes.B["VAL-RET"] },
    A: { "VAL-RET": input.routes.A["VAL-RET"] },
  } }, usable, synthetic).find(row => row.id === "VAL-RET")!;
  const { cutoff, market } = input;
  const A = input.routes.A["VAL-RET"];
  const gaps = legacy.routes.A.gaps.filter(g => !g.startsWith("ASSUMPTION_UNQUALIFIED:") &&
    !["QUALIFIED_RETURN_SCENARIOS_REQUIRED", "NO_ANALYST_BAND_PROPOSED", "CANONICAL_BAND_OR_CEILING"].includes(g));
  const supported = (entry?: Evidence) => !!entry && entry.status === "QUALIFIED" && !!entry.rationale.trim() &&
    entry.refs.length > 0 && entry.refs.every(ref => usable(ref, cutoff));
  const expiry = new Date(`${cutoff}T00:00:00Z`);
  expiry.setUTCFullYear(expiry.getUTCFullYear() + 5);
  if (!Number.isFinite(expiry.getTime()) || assessment.terminal !== expiry.toISOString().slice(0, 10))
    gaps.push("FIVE_YEAR_HORIZON_REQUIRED");
  if (assessment.issuer !== input.ticker || assessment.cutoff !== cutoff || assessment.model !== A?.id ||
      assessment.marketPrice !== market.price || assessment.shares !== market.shares || assessment.shareBasis !== market.shareBasis ||
      !/^\d{4}-\d{2}-\d{2}$/.test(assessment.informationCutoff) || assessment.informationCutoff < cutoff)
    gaps.push("BOUNDED_MODEL_OR_MARKET_BINDING");
  const rows = assessment.dependencies;
  const required = new Set<string>([...keys, ...(A?.dependencies ?? [])]);
  for (const key of required) {
    const row = rows[key];
    if (!row?.material || !supported(row)) gaps.push(`BOUNDED_DEPENDENCY_UNQUALIFIED:${key}`);
  }
  for (const [key, row] of Object.entries(rows)) {
    if (required.has(key)) continue;
    if (row.material && !supported(row)) gaps.push(`BOUNDED_DEPENDENCY_UNQUALIFIED:${key}`);
    if (!row.rationale.trim()) gaps.push(`DEPENDENCY_MATERIALITY_UNEXPLAINED:${key}`);
  }
  if (!assessment.investorEntitlement.comparableBasis || !assessment.investorEntitlement.noDoubleDilution ||
      !assessment.investorEntitlement.rationale.trim()) gaps.push("INVESTOR_ENTITLEMENT_OR_DILUTION_UNALIGNED");
  const crossCheckAdverse = Object.values(input.routes.B).find(model => {
    const e = model.counterevidence;
    return model.cutoff === cutoff && model.route === "B" && e.commonDependency &&
      (required.has(e.commonDependency) || rows[e.commonDependency]?.material) &&
      ["MATERIAL_CONTRADICTION", "INVALIDATED"].includes(e.disposition) &&
      e.refs.length > 0 && e.refs.every(ref => usable(ref, cutoff));
  })?.counterevidence;
  if (crossCheckAdverse) gaps.push("MATERIAL_COMMON_DEPENDENCY_ADVERSE_VETO");
  if (!supported(assessment.counter) || assessment.counter.materialContradiction) gaps.push("BOUNDED_COUNTEREVIDENCE_UNRESOLVED");
  if (!supported(assessment.uncertainty) || !assessment.uncertainty.complete || !assessment.uncertainty.coherence.trim() ||
      !assessment.uncertainty.boundaryLogic.trim() ||
      assessment.uncertainty.excluded.some(x => x.material || !x.reason.trim() || !x.scenario.trim()))
    gaps.push("ECONOMIC_UNCERTAINTY_SET_UNQUALIFIED");

  const within = (key: Key, n: number) => {
    const bound = rows[key]?.bounds;
    return !!bound && bound.every(Number.isFinite) && bound[0] <= n && n <= bound[1];
  };
  const paths = assessment.paths.map(path => ({ ...path, irr: calculatePath(market.price, path) }));
  const boundedPaths = paths.every(path => path.irr !== null && path.years.every(y =>
    within("growth", y.growth) && within("dilution", y.dilution)) &&
    within("relative_multiple", path.multipleFactor) && within("terminal_stub", path.terminalFactor) &&
    path.equivalentDps.every(d => assessment.distribution === "ZERO_CREDIT" ? d === 0 : within("distribution", d)));
  const lower = paths.filter(p => p.role === "LOWER");
  const upper = paths.filter(p => p.role === "UPPER");
  if (lower.length !== 1 || upper.length !== 1 || !paths.some(p => p.role === "INTERIOR") ||
      new Set(paths.map(p => p.id)).size !== paths.length || !boundedPaths ||
      !paths.some(p => p.multipleFactor === 1) || !paths.some(p => p.multipleFactor < 1) ||
      lower[0]?.irr === null || upper[0]?.irr === null ||
      paths.some(p => (p.irr ?? Infinity) < (lower[0]?.irr ?? -Infinity) || (p.irr ?? -Infinity) > (upper[0]?.irr ?? Infinity)))
    gaps.push("RETURN_PATHS_OR_BOUNDARIES_UNQUALIFIED");

  const irrs = paths.flatMap(p => p.irr === null ? [] : [p.irr]);
  const interval = irrs.length ? [Math.min(...irrs), Math.max(...irrs)] : null;
  // Normalize only floating-point noise around canonical decimal cutoffs.
  const canonical = (irr: number) => returnBand(Math.round(irr * 1e14) / 1e14);
  const lowBand = interval ? canonical(interval[0]) : null;
  const highBand = interval ? canonical(interval[1]) : null;
  const bandCandidates = [returnBand(-1), returnBand(.08), returnBand(.12), returnBand(.15), returnBand(.18), returnBand(.22)];
  const coveredBands = bandCandidates.filter(b => b && lowBand && highBand && b.min >= lowBand.min && b.max <= highBand.max).map(b => b!.label);
  const base = assessment.conservativeCase;
  const basePath = base && paths.find(p => p.id === base.scenarioId);
  const qualifiedBase = supported(base) && base?.independentlySupported && basePath &&
    basePath.role === "INTERIOR" ? basePath.irr : null;
  const withinOne = !!lowBand && lowBand.label === highBand?.label;
  const chosen = withinOne ? lowBand : qualifiedBase === null ? null : canonical(qualifiedBase);
  const economicGaps = [...gaps];
  if (!chosen) gaps.push("NO_DEFENSIBLE_RETURN_CONCLUSION");
  const proposal = assessment.proposal;
  const expected = chosen && Math.min(chosen.min, 6);
  const maximum = chosen && Math.min(chosen.max, 6);
  const proposalBand = chosen && (chosen.min >= 7 ? returnBand(.15) : chosen);
  if (!proposal) gaps.push("NO_ANALYST_BAND_PROPOSED");
  else if (!chosen || proposal.basisPrice !== market.price || proposal.basisShares !== market.shares ||
      !Number.isInteger(proposal.points) || proposal.points > 6 || proposal.points < expected! ||
      proposal.points > maximum! || proposal.band !== proposalBand?.label ||
      (proposal.points > expected! && !proposal.strongerEvidence) ||
      ![proposal.rationale, proposal.higher, proposal.lower].every(t => t.trim()))
    gaps.push("CANONICAL_BAND_OR_CEILING");
  const boundedPoints = proposal && !gaps.length ? proposal.points : null;
  const useBounded = legacy.points === null && boundedPoints !== null;
  const qualification = economicGaps.length ? "SENSITIVITY_ONLY_RANGE" : withinOne ? "QUALIFIED_IRR_RANGE" :
    qualifiedBase !== null ? "QUALIFIED_CONSERVATIVE_CASE" : "NO_DEFENSIBLE_RETURN_CONCLUSION";
  const diagnostic = { qualification, paths, sensitivityRange: interval, coveredBands,
    qualifiedRange: economicGaps.length ? null : interval, qualifiedBase: economicGaps.length ? null : qualifiedBase,
    proposal, gaps, adverseVeto: crossCheckAdverse ?? null };
  // The bounded candidate is an additional Method A assessment. A valid existing
  // point or conservative-model candidate remains independently available.
  return { ...legacy, ...(useBounded ? { points: boundedPoints, validity: "CONFIRMED_CURRENT", basis: "RECALCULATED_AT_CUTOFF" } : {}),
    routeQualification: { ...legacy.routeQualification, methodology: VAL_V12_METHODOLOGY,
      ...(useBounded ? { route: "A", model: assessment.model } : {}), boundedReturnStatus: qualification },
    routes: { ...legacy.routes, A: useBounded ? { ...legacy.routes.A, points: boundedPoints, band: proposal!.band,
      gaps: [] } : { ...legacy.routes.A, gaps: legacy.routes.A.points === null ? [...new Set([...legacy.routes.A.gaps, ...gaps])] : [] } },
    boundedReturn: diagnostic };
}
