import type { PortfolioEngine } from "@/application/portfolio/engine";
import { decimal } from "@/domain/portfolio/values";
import type { PriceObservation } from "@/domain/portfolio/valuation";
import { instant } from "@/shared/time";
import { check, text } from "@/domain/scoring/validation";
import type { PortfolioIntegrity } from "@/domain/ranking/rank";
/** M3 Ranking §§19–20 display only; consumes M6.3 cash/prices, never changes scores or posts a trade. */
export function lotContext(snapshot:Awaited<ReturnType<PortfolioEngine["snapshot"]>>,integrity:PortfolioIntegrity,observation:PriceObservation,estimatedCosts:string|null,limitBlocked:boolean){
  check(snapshot.asOf===integrity.asOf&&snapshot.ledgerWatermark===integrity.ledgerWatermark&&snapshot.portfolioId===integrity.portfolioId,"EXECUTION_CONTEXT_MISMATCH");
  [observation.observedAt,observation.receivedAt,observation.validThrough].forEach(instant);text(observation.sourceReference);
  check(observation.currency==="VND"&&observation.observedAt<=snapshot.asOf&&observation.receivedAt<=snapshot.calculatedAt&&observation.validThrough>=snapshot.asOf,"CURRENT_DATED_PRICE_REQUIRED");
  const price=decimal(observation.price);check(price.positive,"POSITIVE_PRICE_REQUIRED");
  if(integrity.status!=="PASS"||estimatedCosts===null)return {status:"NOT ASSESSED",snapshotId:integrity.snapshotId};
  const costs=decimal(estimatedCosts);check(!costs.negative,"NONNEGATIVE_ESTIMATED_COSTS_REQUIRED");
  const required=price.mul(decimal("100")).add(costs);
  return {status:limitBlocked?"BLOCKED BY PORTFOLIO LIMIT":required.units>decimal(snapshot.state.cash).units?"REQUIRES CASH ACCUMULATION":"EXECUTABLE NOW",snapshotId:integrity.snapshotId,requiredCash:required.toString(),priceEvidenceId:observation.id};
}
