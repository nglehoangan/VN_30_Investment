import { economicTransfer } from "./capital-allocation-research";

export function managementAllocation(growth: number, tsr: number, outstanding: number) {
  const profitPart = growth >= .10 ? Math.min(.00175, .002 * .70 * growth / .20) : 0;
  const tsrPart = tsr > 0 ? Math.min(.00075, .002 * .30 * tsr / .10) : 0;
  return { profitPart, tsrPart, nominalShares: outstanding * (profitPart + tsrPart) };
}

export function reverseAnnualBenefit(presentValue: number, duration: number, discount: number) {
  if (!Number.isFinite(presentValue) || !Number.isInteger(duration) || duration < 1 ||
    !Number.isFinite(discount) || discount < 0) throw Error("INVALID_BENEFIT_OPERANDS");
  const annuityFactor = Array.from({ length: duration }, (_, i) => 1 / (1 + discount) ** (i + 1))
    .reduce((total, factor) => total + factor, 0);
  return presentValue / annuityFactor;
}

export function evaluateOperatingLink(row: {
  sameProject: boolean; capitalBasis: "DEPLOYED" | "CWIP_ONLY" | "UNKNOWN";
  commercialOutcome: boolean; sameEconomicScope: boolean; attribution: string;
}) {
  return row.sameProject && row.capitalBasis === "DEPLOYED" && row.commercialOutcome &&
    row.sameEconomicScope && row.attribution.trim().length > 0;
}

export function issueSensitivity(before: number, shares: number, quote: number, gross: number, expenses: number, benefit: number) {
  if (![gross, expenses, benefit].every(Number.isFinite) || gross < 0 || expenses < 0)
    throw Error("INVALID_ISSUE_PROCEEDS");
  return { gross, expenses, assumedBenefit: benefit, ownershipDilution: shares / (before + shares),
    ...economicTransfer({ before, issued: shares, value: quote, netProceeds: gross - expenses, incrementalBenefit: benefit }) };
}
