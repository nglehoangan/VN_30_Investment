import { Decimal, decimal, requireRule, ACCOUNTING_METHOD } from "@/domain/portfolio/values";
import { deepFreeze } from "@/domain/portfolio/transaction";
import { ValidationError } from "@/shared/errors";
import type { PortfolioState } from "@/domain/portfolio/reconstruct";
import { NAV_VERSION, NAV_PROFILE, NAV_CALCULATION, type CurrentNavRequestV1, type CurrentNavPlanV1, type CurrentNavResultV1, type NavCalculationContextV1, type NavQualificationAssessmentV1 } from "./contracts";
import { observeNav, assessNavAuthority } from "./qualification";
const order=(a:string,b:string)=>a<b?-1:a>b?1:0;
const clone=<T>(v:T):T=>JSON.parse(JSON.stringify(v)) as T;
/** Pure financial expression only; does not assert ledger/authority validity or permit margin. */
export function sumNavComponents(cash:string,securities:string,receivables:string,liabilities:string):string {
  const amounts=[cash,securities,receivables,liabilities].map(decimal);requireRule(amounts.every(x=>!x.negative),"NEGATIVE_NAV_COMPONENT");
  const result=amounts[0].add(amounts[1]).add(amounts[2]).sub(amounts[3]);decimal(result.toString());return result.toString();
}
function sortedPlan(p:CurrentNavPlanV1):CurrentNavPlanV1 {
  return {...p,components:[...p.components].sort((a,b)=>order(a.kind,b.kind)),positions:p.positions.map(x=>({...x,units:[...x.units].sort((a,b)=>order(a.unitId,b.unitId))})).sort((a,b)=>order(a.securityId,b.securityId)),prices:[...p.prices].sort((a,b)=>order(JSON.stringify([a.securityId,a.unitId,a.id,a.revision,a.source.reference]),JSON.stringify([b.securityId,b.unitId,b.id,b.revision,b.source.reference]))),sourcePins:[...p.sourcePins].sort((a,b)=>order(a.reference,b.reference))};
}
function finish(r:CurrentNavRequestV1,state:PortfolioState|null,plan:CurrentNavPlanV1|null,c:NavCalculationContextV1,input:unknown,inputHash:string,assessment:NavQualificationAssessmentV1,fields:{cash:string|null;securitiesMarketValue:string|null;receivables:string|null;liabilities:string|null;totalNav:string|null;indicativeValue:string|null;navState:CurrentNavResultV1["navState"];securitiesSubtotal:CurrentNavResultV1["securitiesSubtotal"]},reasons:readonly string[],limitations:readonly string[]):CurrentNavResultV1 {
  const blockingReasons=[...new Set(reasons)].sort();
  const permissions={productionAuthorized:false,officialUseEligible:false,performanceAuthorized:false,riskAuthorized:false,investmentActionabilityAuthorized:false,scoringAuthorized:false,representsCurrentAccountNow:false,snapshotPersisted:false} as const;
  const nonpositiveNav=fields.totalNav!==null?!decimal(fields.totalNav).positive:fields.indicativeValue!==null?!decimal(fields.indicativeValue).positive:false;
  const content={version:NAV_VERSION,origin:c.origin,portfolioId:r.portfolioId,valuationAt:plan?.valuationAt??null,requestedAt:r.requestedAt,knowledgeCutoff:r.knowledgeCutoff,ledgerRevision:r.ledgerRevision,accountingMethod:ACCOUNTING_METHOD,calculationVersion:NAV_CALCULATION,...fields,qualification:assessment,blockingReasons,limitations,legacyReconciliation:plan?.legacyReconciliation??null,nonpositiveNav,...permissions};
  const resultHash=c.hash({inputHash,...content});
  return deepFreeze({...content,requestedAt:r.requestedAt,calculatedAt:c.calculatedAt,knowledgeCutoff:r.knowledgeCutoff,
    manifest:{version:"current-nav-evidence-manifest-v1",calculationVersion:NAV_CALCULATION,origin:c.origin,portfolioId:r.portfolioId,ledgerRevision:r.ledgerRevision,ledgerStateHash:state?c.hash(state):null,valuationAt:plan?.valuationAt??null,knowledgeCutoff:r.knowledgeCutoff,inputHash,input,qualification:assessment,blockingReasons,resultHash},
    runHash:c.hash({resultHash,calculatedAt:c.calculatedAt})});
}
export function unavailableCurrentNav(request:CurrentNavRequestV1,c:NavCalculationContextV1,reason:string):CurrentNavResultV1 {
  const r=clone(request),input={request:r,unavailable:reason,origin:c.origin};
  const assessment:NavQualificationAssessmentV1={version:"nav-qualification-assessment-v1",profile:NAV_PROFILE,economicReasons:[reason],authorityReasons:[],dimensions:null,authorityProofs:[],qualified:false,completeObservedPerimeter:false};
  return finish(r,null,null,c,input,c.hash(input),assessment,{cash:null,securitiesMarketValue:null,receivables:null,liabilities:null,totalNav:null,indicativeValue:null,navState:"NAV_BLOCKED",securitiesSubtotal:null},[reason],["ISOLATED_FEATURE_NOT_OPERATIONALLY_AUTHORIZED"]);
}
/** Pure isolated calculation. No input flag, legacy VALID/PASS or test proof grants operational use. */
export function calculateCurrentNav(request:CurrentNavRequestV1,stateInput:PortfolioState,planInput:CurrentNavPlanV1,c:NavCalculationContextV1,extraBlockingReasons:readonly string[]=[]):CurrentNavResultV1 {
  const r=clone(request),state=clone(stateInput);
  try{
    const plan=sortedPlan(clone(planInput));
    const input=deepFreeze({request:r,ledgerState:state,ledgerFactsHash:c.ledgerFactsHash??null,plan,origin:c.origin,calculationVersion:NAV_CALCULATION});
    const inputHash=c.hash(input),observed=observeNav(r,state,plan,c);
    const economicReasons=[...new Set([...observed.reasons,...extraBlockingReasons])].sort();
    const assessment=assessNavAuthority(r,plan,c,inputHash,observed.units,economicReasons);
    const held=state.positions.filter(p=>decimal(p.quantity).positive);
    const subtotal=observed.units.reduce((sum,u)=>sum.add(decimal(u.marketValue)),Decimal.zero);decimal(subtotal.toString());
    const mv=observed.excluded.length||observed.units.length===0&&held.length>0?null:subtotal.toString();
    const cash=observed.components.get("CASH")??null,claims=observed.components.get("RECEIVABLES")??null,liabs=observed.components.get("LIABILITIES")??null;
    const possible=economicReasons.length===0&&mv!==null&&cash!==null&&claims!==null&&liabs!==null;
    const amount=possible?sumNavComponents(cash!,mv!,claims!,liabs!):null;
    const hardAuthority=assessment.authorityReasons.filter(x=>!x.endsWith("_MISSING")&&!x.startsWith("ACCEPTANCE_INCOMPLETE:"));
    const indicative=possible&&hardAuthority.length===0&&r.resultScope==="OBSERVED_FULL_PORTFOLIO"&&r.allowIndicative;
    const qualified=possible&&assessment.qualified;
    // A research-only request never acquires qualified/official semantics just because proofs exist.
    const navState:CurrentNavResultV1["navState"]=r.resultScope==="QUALIFIED_ONLY"&&qualified?"QUALIFIED_NAV":indicative?"INDICATIVE_NAV":"NAV_BLOCKED";
    const blocked=navState==="NAV_BLOCKED"?[...economicReasons,...assessment.authorityReasons]:[];
    const research=r.includeSecuritiesSubtotal&&(observed.units.length>0||held.length===0)?{label:"SECURITIES_SUBTOTAL — NOT NAV" as const,value:subtotal.toString(),includedUnits:observed.units.map(u=>u.unitId),excludedUnits:observed.excluded}:null;
    return finish(r,state,plan,c,input,inputHash,assessment,{cash,securitiesMarketValue:mv,receivables:claims,liabilities:liabs,totalNav:navState==="QUALIFIED_NAV"?amount:null,indicativeValue:navState==="INDICATIVE_NAV"?amount:null,navState,securitiesSubtotal:research},blocked,["ISOLATED_FEATURE_NOT_OPERATIONALLY_AUTHORIZED","LATEST_COMPLETED_EOD_NOT_CURRENT_ACCOUNT_NOW",...(navState==="INDICATIVE_NAV"?["RESEARCH_ONLY_NOT_OFFICIAL_NAV_PERFORMANCE_OR_RISK"]:[]),...(plan.completeness.costBasis.state!=="COMPLETE"?["COST_BASIS_NOT_USED_PNL_REMAINS_GATED"]:[])]);
  }catch(error){
    const reason=error instanceof ValidationError?error.issues[0]?.reason??"INVALID_NAV_INPUT":"INVALID_NAV_INPUT";
    return unavailableCurrentNav(r,c,reason);
  }
}
