import { compoundRatios, economicTransfer, parentCashBridge, resolveCapitalEffective } from "./capital-allocation-research";

type Result = Parameters<typeof resolveCapitalEffective>[0];
type Status = "UPDATE_PENDING" | "MATERIAL_REVIEW_PENDING" | "INVALIDATED";
type Review = {
  status: Status;
  reviewedAt: string;
  reviewThrough: string;
  validUntil: string;
  refs: string[];
  rationale: string;
  applicable: boolean;
  events: { date: string; ref: string; impact: "BOUNDED" | "UNRESOLVED" | "INVALIDATING"; reason: string }[];
};

/** Research can retain an eligible assessment while a current materiality review is pending. */
export function resolveBoundedCapitalEffective(current: Result, historical: Result, latest: Result, review: Review,
  usable: (id: string) => boolean) {
  const badAssessment = (row: Result) => Object.values(row.routes).some(route =>
    route.gaps.some(gap => ["FREEZE_OR_REVIEW_BINDING", "REVIEW_LINEAGE"].includes(gap)));
  const status = review.events.some(event => event.impact === "INVALIDATING") ? "INVALIDATED"
    : review.events.some(event => event.impact === "UNRESOLVED") ? "MATERIAL_REVIEW_PENDING" : "UPDATE_PENDING";
  const reviewed = review.reviewThrough === current.reviewCutoff && review.reviewedAt >= current.reviewCutoff &&
    review.status === status && !!review.rationale.trim() && review.refs.length > 0 && review.refs.every(usable) &&
    review.events.every(event => event.date >= latest.reviewCutoff && event.date <= current.reviewCutoff &&
      usable(event.ref) && !!event.reason.trim());
  const sameBasis = latest.routeQualification.researchOnly && !latest.routeQualification.synthetic &&
    latest.validity === "CONFIRMED_CURRENT" && !badAssessment(latest);
  const eligible = reviewed && sameBasis && review.applicable && status !== "INVALIDATED" && !badAssessment(current);
  const result = resolveCapitalEffective(current, latest, eligible ? {
    validUntil: review.validUntil, unaffected: true,
    reviewed: true, rationale: review.rationale,
  } : undefined);
  const { inheritance: inherited, ...score } = result;
  return { ...score, historicalAssessmentPoints: historical.points, latestEligiblePoints: latest.points,
    latestEligibleCutoff: latest.points === null ? null : latest.reviewCutoff,
    updateStatus: current.points !== null ? "UPDATED" : !reviewed ? "REVIEW_UNQUALIFIED" : latest.points === null ? "NOT_RATED" : status,
    inheritance: inherited ? { ...review, historicalRoute: latest.routeQualification } : null,
    currentRoutes: current.routes, currentConfidence: current.confidence, applicabilityReview: review };
}

type Link = { decision: string; deployed: string; outcome: string; counterevidence: string;
  material: boolean; attribution: "SUPPORTED" | "UNRESOLVED"; refs: string[] };

export function portfolioLinkage(groups: readonly Link[], usable: (id: string) => boolean) {
  const material = groups.filter(group => group.material);
  return material.length > 0 && material.every(group => group.attribution === "SUPPORTED" &&
    [group.decision, group.deployed, group.outcome, group.counterevidence].every(value => !!value.trim()) &&
    group.refs.length > 0 && group.refs.every(usable));
}

export function ownershipBridge(annualEps: number, cutoffEps: number, annualShares: number, employeeShares: number,
  proRataShares: number, cutoffShares: number) {
  const beforeProRata = annualShares + employeeShares;
  if ([annualEps, cutoffEps, annualShares, employeeShares, proRataShares, cutoffShares].some(value => !Number.isFinite(value)) ||
      annualEps <= 0 || cutoffEps <= 0 || annualShares <= 0 || employeeShares < 0 || proRataShares < 0 ||
      beforeProRata + proRataShares !== cutoffShares) throw Error("UNRECONCILED_SHARE_BASIS");
  const proRataFactor = cutoffShares / beforeProRata;
  const annualOnProRataBasis = annualEps / proRataFactor;
  const annualRestatedDenominatorOnly = annualEps * annualShares / cutoffShares;
  return { annualEps, cutoffEps, proRataFactor, annualOnProRataBasis, annualRestatedDenominatorOnly,
    employeeOwnershipFactor: annualShares / beforeProRata, scopeUnadjustedChange: cutoffEps / annualOnProRataBasis - 1 };
}

export function reviewParentCash(row: Parameters<typeof parentCashBridge>[0] & {
  lendingRecovered: number; lendingOut: number; borrowed: number; repaid: number;
  openingCash: number; closingCash: number; shareCash: number; assetDisposals: number; fx: number;
}) {
  const bridge = parentCashBridge(row);
  const netLending = row.lendingRecovered - row.lendingOut;
  const netBorrowing = row.borrowed - row.repaid;
  const reconstructed = row.openingCash + bridge.residual + netLending + netBorrowing + row.shareCash + row.assetDisposals + row.fx;
  return { ...bridge, netLending, netBorrowing, reconstructed, reconciles: reconstructed === row.closingCash };
}

export function eventValueAssessment(event: {
  before: number; issued: number; valueRange: number[]; eventDate: string | null; valueKnownBy: string | null;
  comparabilityVerified: boolean; grossProceeds: number | null; netProceeds: number | null;
  netProceedsBounds?: readonly [number, number];
  benefitsBounded: boolean; materialityReason: string;
}) {
  const proceedsBounds = event.netProceedsBounds;
  const qualifiedProceeds = event.netProceeds !== null && Number.isFinite(event.netProceeds) ||
    !!proceedsBounds && proceedsBounds.every(Number.isFinite) && proceedsBounds[0] <= proceedsBounds[1];
  const qualifiedValue = event.eventDate !== null && event.valueKnownBy !== null &&
    event.valueKnownBy <= event.eventDate && event.comparabilityVerified && event.valueRange.length > 0;
  const sensitivities = event.valueRange.map(value => economicTransfer({ before: event.before, issued: event.issued,
    value, netProceeds: event.netProceeds ?? event.grossProceeds ?? 0, incrementalBenefit: 0 }));
  const boundedProceedsCases = qualifiedProceeds && proceedsBounds ? event.valueRange.flatMap(value =>
    proceedsBounds.map(netProceeds => economicTransfer({ before: event.before, issued: event.issued,
      value, netProceeds, incrementalBenefit: 0 }))) : [];
  return { qualifiedValue, sensitivities, boundedProceedsCases, proceedsBasis: event.netProceeds !== null ? "NET"
    : event.grossProceeds !== null ? "GROSS_SENSITIVITY" : "ZERO_PROCEEDS_SENSITIVITY",
    economicConclusionEligible: qualifiedValue && qualifiedProceeds && event.benefitsBounded &&
      !!event.materialityReason.trim() };
}

export const sequentialTransfer = (losses: readonly number[]) => 1 - compoundRatios(losses.map(loss => 1 - loss)).factor;
