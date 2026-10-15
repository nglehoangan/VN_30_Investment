import type { PortfolioEngine } from "@/application/portfolio/engine";
import type { ReconciliationEvidence } from "@/domain/portfolio/reconciliation";
import type { PortfolioIntegrity } from "@/domain/ranking/rank";
import type { ScoringPortfolioRead } from "@/ports/scoring";
import { check } from "@/domain/scoring/validation";
type DerivedSnapshot = Awaited<ReturnType<PortfolioEngine["snapshot"]>>;
/** Receives existing reconstruction only. Never replays, writes, or calculates a balance. */
export function scopedIntegrity(s:DerivedSnapshot,e:ReconciliationEvidence|null,current:boolean):PortfolioIntegrity {
  const reasons:string[]=[];
  if(!current||s.status==="STALE")reasons.push("STALE_PORTFOLIO");
  if(s.inception.status!=="VALID")reasons.push("UNSUPPORTED_INCEPTION");
  if(s.valuation.status!=="VALID")reasons.push("INVALID_VALUATION");
  if(s.reference.some(r=>r.sector===null||r.membership==="UNKNOWN_OR_UNSUPPORTED"))reasons.push("INVALID_REFERENCE");
  const r=s.reconciliation;
  if(!e||!e.sourceReference.trim()||e.id!==r.evidenceId||e.portfolioId!==s.portfolioId||e.asOf!==s.asOf||e.receivedAt>s.calculatedAt||r.referenceAsOf!==s.asOf)reasons.push("MISSING_OR_INCOMPARABLE_RECONCILIATION");
  if(e?.unresolvedDiscrepancy||r.unresolvedDiscrepancy)reasons.push("UNRESOLVED_RECONCILIATION");
  if(e&&(e.receivables===null||e.payables===null))reasons.push("MISSING_OBLIGATION_EVIDENCE");
  if(r.differences.some(d=>d.material&&d.field!=="openCost"))reasons.push("QUANTITY_CASH_RECONCILIATION_BLOCKED");
  if(r.status==="NOT_COMPARABLE")reasons.push("RECONCILIATION_NOT_COMPARABLE");
  // Missing evidence is exempt only when all missing fields are explicitly cost fields.
  if(r.status==="MISSING_EVIDENCE"&&!(e&&e.positions.some(p=>p.openCost===null)&&e.receivables!==null&&e.payables!==null&&r.differences.length>0))reasons.push("MISSING_RECONCILIATION_EVIDENCE");
  const costBlocked=!e||e.positions.some(p=>p.openCost===null)||r.differences.some(d=>d.material&&d.field==="openCost");
  return {snapshotId:`${s.portfolioId}:${s.ledgerWatermark}:${s.asOf}`,portfolioId:s.portfolioId,asOf:s.asOf,ledgerWatermark:s.ledgerWatermark,
    reconstructionMethod:s.state.accountingMethod,referenceVersion:s.referenceVersion,priceVersion:s.valuation.inputVersion,evidenceId:r.evidenceId,
    status:reasons.length?"BLOCKED":"PASS",costStatus:costBlocked?"BLOCKED":"PASS",reasons};
}
export class DerivedScoringPortfolioRead implements ScoringPortfolioRead {
  constructor(private readonly readSnapshot:(asOf:string)=>Promise<{snapshot:DerivedSnapshot;evidence:ReconciliationEvidence|null;current:boolean}>){}
  async read(asOf:string){const {snapshot,evidence,current}=await this.readSnapshot(asOf);check(snapshot.asOf===asOf,"PORTFOLIO_ASOF_MISMATCH");return scopedIntegrity(snapshot,evidence,current);}
}
