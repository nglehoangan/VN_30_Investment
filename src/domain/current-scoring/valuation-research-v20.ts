import { valuationIds, type Assumption } from "./valuation-research";
import { evaluateBoundedReturn, type BoundedReturn } from "./valuation-research-v12";
import { evaluateValuationV11, type ValuationReviewV11 } from "./valuation-research-v11";

export const VAL_V20_METHODOLOGY = "wp5-value-investing-analysis-v2.0.0";
type Id = typeof valuationIds[number];
type Estimate = Omit<Assumption, "qualification" | "classification"> & {
  classification: "ANALYST_ESTIMATE"; alternatives: string; historicalAnchor: string; externalAnchor: string | null;
};
type Model = NonNullable<ValuationReviewV11["routes"]["A"][Id]>;
type Proposal = {
  freeze: string; revision: 0 | 1; previousProposal?: string;
  cutoff: string; ticker: string; terminal: string;
  market: ValuationReviewV11["market"];
  confidence: ValuationReviewV11["confidence"];
  estimates: Estimate[];
  returnBasis?: {
    shareBasis: string; proRataNeutral: boolean; noDoubleDilution: boolean;
    terminalExtension: string; cashTiming: string; refs: string[];
  };
  boundedReturn?: BoundedReturn;
  models: ValuationReviewV11["routes"]["A"];
};
type Dimension = {
  id: string; challenge: string; effect: string; materiality: string; refs: string[];
  verdict: "SUPPORTED" | "LIMITATION" | "OPTIONAL_ABSENT" | "BLOCKING";
};
type Assessment = {
  disposition: "ACCEPTED" | "ACCEPTED_WITH_LIMITATIONS" | "REVISION_REQUIRED" | "REJECTED";
  dimensions: Dimension[]; limits: string; dependencies: string[];
  blockers: { code: string; dependency: string; detail: string; simplerModel: string; range: string }[];
};
type Review = {
  proposal: string; freeze: string; revision: 0 | 1;
  assessments: Record<Id, Assessment>;
};
export type AnalystValuationPacket = {
  freeze: string; initial: Proposal; initialReview: Review; revision?: Proposal; finalReview: Review;
};
const dimensions = ["RV01", "RV02", "RV03", "RV04", "RV05", "RV06"];
const filled = (fields: string[]) => fields.every(field => typeof field === "string" && field.trim().length > 0);

export function evaluateAnalystValuation(baseline: ValuationReviewV11, packet: AnalystValuationPacket,
  digest: (product: Proposal) => string, usable: (ref: string, cutoff: string) => boolean, synthetic = false) {
  const { initial, initialReview, finalReview, revision, freeze } = packet;
  const proposal = revision ?? initial;
  const { cutoff, market } = baseline;
  const proposalBound = (product: Proposal, review: Review) =>
    product.ticker === baseline.ticker && product.cutoff === cutoff &&
    product.freeze === freeze && review.freeze === freeze && review.proposal === digest(product) &&
    review.revision === product.revision && Object.keys(review.assessments).length === valuationIds.length &&
    JSON.stringify(product.market) === JSON.stringify(market);
  const revisionsRequired = valuationIds.filter(id => initialReview.assessments[id]?.disposition === "REVISION_REQUIRED");
  const terminal = new Date(cutoff + "T00:00:00Z");
  terminal.setUTCFullYear(terminal.getUTCFullYear() + 5);
  const common = [
    ...(!/^[a-f0-9]{64}$/.test(freeze) || !proposalBound(initial, initialReview) || !proposalBound(proposal, finalReview) ?
      ["DATA_FREEZE_OR_PROPOSAL_REVIEW_BINDING"] : []),
    ...(initial.revision !== 0 || initial.previousProposal ||
      (revision ? revision.revision !== 1 || revision.previousProposal !== digest(initial) || !revisionsRequired.length
        : revisionsRequired.length > 0 || JSON.stringify(initialReview) !== JSON.stringify(finalReview)) ?
      ["ONE_REVISION_CONTRACT"] : []),
    ...(!Number.isFinite(terminal.getTime()) || terminal.toISOString().slice(0, 10) !== proposal.terminal ?
      ["FIVE_YEAR_HORIZON_REQUIRED"] : []),
    ...(valuationIds.some(id => {
      const ids = proposal.estimates.filter(row => row.rubrics.includes(id)).map(row => row.id);
      return new Set(ids).size !== ids.length;
    }) ||
      proposal.estimates.some(row => baseline.assumptions.some(source => source.id === row.id && source.classification === "FACT")) ?
      ["DUPLICATE_ESTIMATE_OR_FACT_OVERRIDE"] : []),
  ];
  const assessed = (review: Review, product: Proposal, id: Id, initialPass: boolean) => {
    const entry = review.assessments[id];
    const dependencies = product.models[id]?.dependencies ?? [];
    if (!entry || !filled([entry.limits]) || entry.dimensions.length !== dimensions.length ||
      new Set(entry.dependencies).size !== entry.dependencies.length ||
      dependencies.length !== entry.dependencies.length || dependencies.some(key => !entry.dependencies.includes(key)) ||
      !["ACCEPTED", "ACCEPTED_WITH_LIMITATIONS", "REVISION_REQUIRED", "REJECTED"].includes(entry.disposition) ||
      dimensions.some(key => !entry.dimensions.some(row => row.id === key)) ||
      entry.dimensions.some(row => !filled([row.challenge, row.effect, row.materiality]) ||
        !["SUPPORTED", "LIMITATION", "OPTIONAL_ABSENT", "BLOCKING"].includes(row.verdict) ||
        (row.verdict === "OPTIONAL_ABSENT" ? row.id !== "RV02" || row.refs.length !== 0 :
          !row.refs.length || !row.refs.every(ref => usable(ref, cutoff))) ||
        (row.verdict === "BLOCKING" && !entry.blockers.length)) ||
      entry.blockers.some(row => !/^RB0[1-5]$/.test(row.code) ||
        !entry.dependencies.includes(row.dependency) || !filled([row.dependency, row.detail, row.simplerModel, row.range])))
      return ["REASONABLENESS_REVIEW_INCOMPLETE"];
    if (initialPass && ["REVISION_REQUIRED", "REJECTED"].includes(entry.disposition) && entry.blockers.length)
      return [];
    if (!["ACCEPTED", "ACCEPTED_WITH_LIMITATIONS"].includes(entry.disposition) || entry.blockers.length ||
      (entry.disposition === "ACCEPTED_WITH_LIMITATIONS" && !entry.dimensions.some(row => row.verdict === "LIMITATION")) ||
      entry.dimensions.some(row => row.verdict === "BLOCKING"))
      return ["REASONABLENESS_REVIEW_BLOCKS", ...entry.blockers.map(row => row.code + ":" + row.dependency)];
    return [];
  };
  return valuationIds.map(id => {
    const m: Model | undefined = proposal.models[id];
    const estimateIds = new Set(proposal.estimates.filter(row => row.rubrics.includes(id)).map(row => row.id));
    const estimates = proposal.estimates.filter(row => row.rubrics.includes(id));
    const validEstimates = estimates.every(row => row.classification === "ANALYST_ESTIMATE" && row.cutoff === cutoff &&
      filled([row.alternatives, row.historicalAnchor]) && (row.externalAnchor === null || usable(row.externalAnchor, cutoff)));
    const changedWithoutReview = revision && !revisionsRequired.includes(id) &&
      (JSON.stringify(initial.models[id]) !== JSON.stringify(m) ||
        JSON.stringify(initial.estimates.filter(row => row.rubrics.includes(id))) !== JSON.stringify(estimates));
    const returnBasis = proposal.returnBasis;
    const invalidReturnBasis = id === "VAL-RET" && (!returnBasis || returnBasis.shareBasis !== market.shareBasis ||
      !returnBasis.proRataNeutral || !returnBasis.noDoubleDilution || !filled([returnBasis.terminalExtension, returnBasis.cashTiming]) ||
      !returnBasis.refs.length || !returnBasis.refs.every(ref => usable(ref, cutoff)));
    const gaps = [...common, ...assessed(initialReview, initial, id, true), ...assessed(finalReview, proposal, id, false),
      ...(changedWithoutReview ? ["UNREQUESTED_MODEL_REVISION"] : []),
      ...(invalidReturnBasis ? ["INVESTOR_ENTITLEMENT_OR_TERMINAL_BASIS_UNQUALIFIED"] : []), ...(!validEstimates ? ["ANALYST_ESTIMATE_LINEAGE"] : []),
      ...(!m || !m.dependencies.every(key => estimateIds.has(key) ||
        baseline.assumptions.some(row => row.id === key && row.classification === "FACT")) ? ["MODEL_DEPENDENCIES_UNBOUND"] : []),
      ...(m?.method === "NORMALIZED_EARNINGS" && (m.valueRange || m.conservativeValue !== undefined) ?
        ["NORMALIZED_EARNINGS_OUTPUT_MUST_BE_CALCULATED"] : [])];
    const converted: Assumption[] = estimates.map(row => ({ ...row, classification: "ESTIMATE",
      qualification: typeof row.value === "number" ? "QUALIFIED_ESTIMATE" : "BOUNDED_ESTIMATE" }));
    const qualified = !gaps.length ? m : undefined;
    const candidate = { ...baseline, confidence: proposal.confidence,
      assumptions: [...baseline.assumptions.filter(row => !estimateIds.has(row.id)), ...converted],
      routes: { B: {}, A: { [id]: qualified } } };
    const a = evaluateValuationV11(candidate, usable, synthetic).find(row => row.id === id)!;
    const bounded = id === "VAL-RET" && qualified && proposal.boundedReturn ?
      evaluateBoundedReturn(candidate, proposal.boundedReturn, usable, synthetic) : null;
    const fallback = bounded && a.points === null && bounded.points !== null ? bounded : a;
    const b = evaluateValuationV11({ ...baseline, routes: { A: {}, B: baseline.routes.B } },
      usable, synthetic).find(row => row.id === id)!;
    const adverseCheck = evaluateValuationV11({ ...baseline,
      routes: { B: baseline.routes.B, A: { [id]: qualified } } }, usable, synthetic).find(row => row.id === id)!.routes.A;
    const veto = adverseCheck.adverseVeto;
    const selected = b.points !== null ? b : fallback;
    const chosen = veto && b.points === null ? { ...a, points: null, validity: "N/R", basis: null,
      routeQualification: { ...a.routeQualification, route: null, model: null } } : selected;
    return { ...chosen, financialPeriod: estimates[0]?.period ?? chosen.financialPeriod,
      routeQualification: { ...chosen.routeQualification, methodology: VAL_V20_METHODOLOGY, freeze,
        proposal: finalReview.proposal, disposition: finalReview.assessments[id]?.disposition ?? null },
      routes: { B: b.routes.B, A: { ...fallback.routes.A, adverseVeto: veto,
        ...(veto ? { points: null, band: null } : {}),
        ...(bounded ? { boundedReturn: bounded.boundedReturn } : {}),
        gaps: [...fallback.routes.A.gaps, ...gaps, ...(veto ? ["MATERIAL_COMMON_DEPENDENCY_ADVERSE_VETO"] : [])] } },
    };
  });
}
