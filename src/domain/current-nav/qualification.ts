import { instant, dateOnly, vietnamBusinessDate } from "@/shared/time";
import { decimal, price, shareQuantity, ACCOUNTING_METHOD, requireRule, Decimal } from "@/domain/portfolio/values";
import type { PortfolioState } from "@/domain/portfolio/reconstruct";
import { NAV_DIMENSIONS, NAV_PROFILE, type CurrentNavRequestV1, type CurrentNavPlanV1, type CurrentNavPriceV1, type NavEconomicUnitV1, type NavCalculationContextV1, type NavEvidenceRefV1, type NavQualificationAssessmentV1, type NavAuthorityProofV1, type NavAuthorityKind } from "./contracts";
export interface ValuedUnit { readonly securityId: string; readonly unitId: string; readonly quantity: string; readonly price: string; readonly marketValue: string; readonly priceHash: string; readonly unitHash: string }
export const navText = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0 && v.length <= 512;
export const navHash = (v: unknown): v is string => typeof v === "string" && /^[a-f0-9]{64}$/.test(v);
function evidence(e: NavEvidenceRefV1, k: string, pins?: CurrentNavPlanV1["sourcePins"]) { requireRule(navText(e.reference) && navHash(e.sha256) && typeof e.pointer === "string" && e.pointer.startsWith("/"),"INVALID_NAV_EVIDENCE");instant(e.knownAt);requireRule(e.knownAt<=k,"FUTURE_INFORMATION");if(pins)requireRule(pins.some(p=>p.reference===e.reference&&p.sha256===e.sha256),"SOURCE_HASH_MISMATCH"); }
export function requestReasons(r: CurrentNavRequestV1, c: NavCalculationContextV1): string[] {
  const reasons:string[]=[];
  requireRule(["SYNTHETIC_TEST","RETAINED_RESEARCH"].includes(c.origin),"UNSUPPORTED_NAV_ORIGIN");
  const expected="version portfolioId purpose valuationMode knowledgeMode requestedAt knowledgeCutoff resultScope allowIndicative includeSecuritiesSubtotal ledgerRevision".split(" ").sort().join(" ");
  requireRule(r&&Object.keys(r).sort().join(" ")===expected,"NAV_REQUEST_SCHEMA");
  if(r.version!=="current-nav-request-v1")reasons.push("UNSUPPORTED_NAV_REQUEST_VERSION");
  if(r.purpose!=="PORTFOLIO_NAV")reasons.push("WRONG_PURPOSE");
  if(r.valuationMode!=="LATEST_COMPLETED_EOD")reasons.push("UNSUPPORTED_VALUATION_MODE");
  if(r.knowledgeMode!=="RETROSPECTIVE")reasons.push("BITEMPORAL_QUERY_UNSUPPORTED");
  requireRule(navText(r.portfolioId)&&/^\d+$/.test(r.ledgerRevision)&&typeof r.allowIndicative==="boolean"&&typeof r.includeSecuritiesSubtotal==="boolean","NAV_REQUEST_SCHEMA");
  requireRule(["QUALIFIED_ONLY","OBSERVED_FULL_PORTFOLIO"].includes(r.resultScope),"UNSUPPORTED_RESULT_SCOPE");
  instant(r.requestedAt);instant(r.knowledgeCutoff);instant(c.calculatedAt);
  if(r.knowledgeCutoff>c.calculatedAt||r.requestedAt>c.calculatedAt)reasons.push("FUTURE_INFORMATION");
  if(r.resultScope==="OBSERVED_FULL_PORTFOLIO"&&!r.allowIndicative)reasons.push("INDICATIVE_OPT_IN_REQUIRED");
  return reasons;
}
/** Pure structural price assessment, not source acceptance. */
export function priceReasons(p: CurrentNavPriceV1, u: NavEconomicUnitV1, securityId:string, plan:CurrentNavPlanV1, r:CurrentNavRequestV1, c:NavCalculationContextV1): string[] {
  const reasons:string[]=[];const s=plan.session;
  requireRule(navText(p.id)&&navText(p.revision),"PRICE_IDENTITY_REQUIRED");price(p.value);
  if(p.securityId!==securityId||p.unitId!==u.unitId||c.hash(p.identity)!==c.hash(u.identity))reasons.push("PRICE_IDENTITY_MISMATCH");
  if(p.currency!=="VND"||p.unit!=="VND_PER_SHARE"||p.multiplier!=="1")reasons.push("PRICE_UNIT_MISMATCH");
  if(p.adjustment!=="RAW"||p.corporateActionHash!==u.corporateActionHash)reasons.push("CORPORATE_ACTION_MISMATCH");
  if(!["OFFICIAL_CLOSE","PROVIDER_EOD_CLOSE"].includes(p.priceKind)||!s.allowedPriceKinds.includes(p.priceKind))reasons.push("UNSUPPORTED_PRICE_KIND");
  if(p.tradingDate!==s.tradingDate||p.sessionId!==s.id||p.calendarHash!==s.calendar.sha256||p.policyHash!==s.policy.sha256||p.normalizedAt!==plan.valuationAt)reasons.push("PRICE_SESSION_MISMATCH");
  [p.normalizedAt,p.retrievedAt,p.knownAt,p.validUntil].forEach(instant);evidence(p.source,r.knowledgeCutoff,plan.sourcePins);
  if(p.source.knownAt>p.knownAt||p.knownAt>p.retrievedAt||p.retrievedAt>r.knowledgeCutoff||p.normalizedAt>p.knownAt)reasons.push("FUTURE_INFORMATION");
  if(p.validUntil!==s.nextCompletedAt||c.calculatedAt>=p.validUntil||r.requestedAt>=p.validUntil)reasons.push("STALE_PRICE");
  if(p.timestampOrigin==="NORMALIZED_SESSION_BOUNDARY") {if(!s.allowNormalizedBoundary||p.providerAt!==null)reasons.push("PRICE_TIMESTAMP_SEMANTICS");}
  else if(p.timestampOrigin==="PROVIDER_TIMESTAMP") {if(p.providerAt===null)reasons.push("MISSING_PROVIDER_TIMESTAMP");else {instant(p.providerAt);if(p.providerAt>plan.valuationAt||p.providerAt>p.retrievedAt)reasons.push("FUTURE_INFORMATION");}}
  else reasons.push("PRICE_TIMESTAMP_SEMANTICS");
  if(p.revokedAt!==null){instant(p.revokedAt);reasons.push("REVOKED_EVIDENCE");}
  const pins=plan.sourcePins.filter(x=>x.reference===p.source.reference);if(pins.length!==1||pins[0].sha256!==p.source.sha256)reasons.push("SOURCE_HASH_MISMATCH");
  return reasons;
}
export function observeNav(r:CurrentNavRequestV1,state:PortfolioState,plan:CurrentNavPlanV1,c:NavCalculationContextV1) {
  const reasons=requestReasons(r,c),units:ValuedUnit[]=[],excluded:string[]=[];
  requireRule(plan.version==="current-nav-plan-v1"&&plan.profile===NAV_PROFILE&&navText(plan.perimeterId)&&navText(plan.valuationMethodologyId)&&navHash(plan.evidenceHead),"INVALID_NAV_PLAN");
  if(plan.portfolioId!==r.portfolioId||state.portfolioId!==r.portfolioId)reasons.push("PORTFOLIO_MISMATCH");
  if(plan.ledgerRevision!==r.ledgerRevision||state.ledgerWatermark!==r.ledgerRevision)reasons.push("LEDGER_REVISION_MISMATCH");
  if(state.accountingMethod!==ACCOUNTING_METHOD||plan.accountingImplementation!==ACCOUNTING_METHOD)reasons.push("ACCOUNTING_METHOD_MISMATCH");
  instant(plan.valuationAt);const s=plan.session;
  [s.completedAt,s.nextCompletedAt].forEach(instant);[s.tradingDate,s.latestCompletedTradingDate,s.calendarFrom,s.calendarThrough].forEach(dateOnly);
  evidence(s.calendar,r.knowledgeCutoff,plan.sourcePins);evidence(s.policy,r.knowledgeCutoff,plan.sourcePins);
  if(s.timezone!=="Asia/Ho_Chi_Minh"||!s.purposes.includes("PORTFOLIO_NAV")||!navText(s.id))reasons.push("UNKNOWN_SESSION_POLICY");
  if(s.completedAt!==plan.valuationAt||state.asOf!==plan.valuationAt||vietnamBusinessDate(instant(plan.valuationAt))!==s.tradingDate)reasons.push("INCOMPATIBLE_ASOF");
  if(s.tradingDate!==s.latestCompletedTradingDate||s.nextCompletedAt<=s.completedAt||vietnamBusinessDate(instant(s.nextCompletedAt))<=s.tradingDate||r.requestedAt<s.completedAt||r.requestedAt>=s.nextCompletedAt||c.calculatedAt>=s.nextCompletedAt)reasons.push("STALE_SESSION");
  if(plan.valuationAt>r.knowledgeCutoff||s.tradingDate<s.calendarFrom||s.tradingDate>s.calendarThrough||vietnamBusinessDate(instant(s.nextCompletedAt))>s.calendarThrough)reasons.push("UNKNOWN_CALENDAR_OR_FUTURE_TIME");
  if(plan.unresolvedEconomicConflicts.length)reasons.push("SOURCE_CONFLICT");
  requireRule(new Set(plan.sourcePins.map(p=>p.reference)).size===plan.sourcePins.length&&plan.sourcePins.every(p=>navText(p.reference)&&navHash(p.sha256)),"INVALID_SOURCE_PINS");
  const components=new Map<string,string>();
  for(const kind of ["CASH","RECEIVABLES","LIABILITIES"] as const){
    const rows=plan.components.filter(x=>x.kind===kind);const x=rows[0];
    if(rows.length!==1||!x||x.amount===null||!x.complete){reasons.push(kind==="LIABILITIES"?"UNKNOWN_LIABILITY":"MISSING_"+kind);continue;}
    requireRule(x.version==="current-nav-component-v1"&&x.currency==="VND","COMPONENT_SCHEMA");
    if(/^\d{4}-\d{2}-\d{2}$/.test(x.economicAt)){reasons.push("DATE_ONLY_OBSERVATION_UNSUPPORTED");continue;}
    instant(x.economicAt);if(x.economicAt!==plan.valuationAt)reasons.push("INCOMPATIBLE_ASOF");
    if(!x.evidence.length)reasons.push("MISSING_COMPONENT_EVIDENCE");x.evidence.forEach(e=>evidence(e,r.knowledgeCutoff,plan.sourcePins));
    const value=decimal(x.amount);requireRule(!value.negative,"NEGATIVE_COMPONENT_UNSUPPORTED");
    const recorded=kind==="CASH"?state.cash:kind==="RECEIVABLES"?state.receivables:state.payables;
    if(!value.eq(decimal(recorded)))reasons.push("LEDGER_COMPONENT_MISMATCH");components.set(kind,value.toString());
  }
  if(plan.components.some(x=>!["CASH","RECEIVABLES","LIABILITIES"].includes(x.kind)))reasons.push("UNEXPECTED_COMPONENT");
  for(const dimension of NAV_DIMENSIONS){const d=plan.completeness[dimension];requireRule(d&&["COMPLETE","COMPLETE_WITH_LIMITATIONS","PARTIAL","BLOCKED","UNKNOWN"].includes(d.state),"COMPLETENESS_SCHEMA");d.evidence.forEach(e=>evidence(e,r.knowledgeCutoff,plan.sourcePins));
    if(["ledgerReplay","transactions","cash","receivables","liabilities","securitiesQuantity"].includes(dimension)&&(d.state!=="COMPLETE"||!d.evidence.length))reasons.push("ACCOUNTING_INCOMPLETE:"+dimension);
    if(dimension==="tradingAvailability"&&["BLOCKED","PARTIAL"].includes(d.state))reasons.push("ECONOMIC_ENTITLEMENT_UNRESOLVED");
    if(dimension==="costBasis"&&["BLOCKED","UNKNOWN"].includes(d.state))reasons.push("BASIS_SCOPE_UNRESOLVED");
  }
  if(["BLOCKED","UNKNOWN"].includes(plan.completeness.sourceIdentity.state))reasons.push("IDENTITY_UNRESOLVED");
  if(plan.basisEconomicImpact!=="NONE")reasons.push("BASIS_AFFECTS_ECONOMIC_OWNERSHIP");
  const held=state.positions.filter(x=>decimal(x.quantity).positive);const seen=new Set<string>();
  const reverse=new Map<string,string>(),ambiguous=new Set<string>();
  for(const p of plan.positions)for(const u of p.units)if(u.identity){
    const id=u.identity,keys=[["market",id.marketNamespace,id.marketSecurityId],["provider",id.marketNamespace,id.exchange,id.securityClass,id.providerInstrumentCode],...(id.isin?[["isin",id.exchange,id.securityClass,id.isin]]:[])];
    for(const parts of keys){const key=JSON.stringify(parts),old=reverse.get(key);if(old&&old!==p.securityId){ambiguous.add(old);ambiguous.add(p.securityId);}else reverse.set(key,p.securityId);}
  }
  if(ambiguous.size)reasons.push("DUPLICATE_MARKET_IDENTITY");
  if(new Set(plan.positions.map(p=>p.securityId)).size!==plan.positions.length)reasons.push("DUPLICATE_SECURITY_VALUATION");
  for(const p of plan.positions)if(!held.some(h=>h.securityId===p.securityId))reasons.push("UNEXPECTED_SECURITY");
  for(const h of held){
    if(ambiguous.has(h.securityId)){excluded.push(h.securityId);continue;}
    const ps=plan.positions.filter(p=>p.securityId===h.securityId),p=ps[0];
    if(ps.length!==1||!p){reasons.push("MISSING_OR_DUPLICATE_SECURITY:"+h.securityId);excluded.push(h.securityId);continue;}
    if(p.economicAt!==plan.valuationAt){reasons.push("INCOMPATIBLE_ASOF");excluded.push(h.securityId);continue;}
    const sum=p.units.reduce((total,u)=>total.add(shareQuantity(u.quantity)),Decimal.zero);
    if(!sum.eq(decimal(h.quantity))||new Set(p.units.map(u=>u.unitId)).size!==p.units.length){reasons.push("PARTITION_QUANTITY_MISMATCH");excluded.push(h.securityId);continue;}
    for(const u of p.units){
      requireRule(navText(u.unitId)&&navHash(u.corporateActionHash),"UNIT_SCHEMA");
      if(seen.has(u.unitId)){reasons.push("DUPLICATE_ECONOMIC_UNIT");excluded.push(u.unitId);continue;}seen.add(u.unitId);
      if(!shareQuantity(u.quantity).positive)continue;
      const reject=(reason:string)=>{reasons.push(reason+":"+u.unitId);excluded.push(u.unitId);};
      if(!["ORDINARY","TRADE_UNSETTLED_ORDINARY"].includes(u.kind)){reject("PENDING_RIGHTS_UNSUPPORTED");continue;}
      if(u.eligibility!=="ELIGIBLE"||u.corporateActionStatus!=="CLEAR"){reject("CORPORATE_ACTION_UNRESOLVED");continue;}
      const id=u.identity;
      if(!id||![id.marketNamespace,id.marketSecurityId,id.providerInstrumentCode].every(navText)||!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id.marketSecurityId)||!/^\d+$/.test(id.providerInstrumentCode)||!id.evidence.length||id.exchange!=="HOSE"||id.securityClass!=="COMMON_SHARE"||(!id.isin&&!navText(id.alternateIdentityReference))){reject("IDENTITY_UNRESOLVED");continue;}
      if(id.isin!==null&&!/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(id.isin)){reject("IDENTITY_UNRESOLVED");continue;}id.evidence.forEach(e=>evidence(e,r.knowledgeCutoff,plan.sourcePins));
      const prices=plan.prices.filter(x=>x.securityId===h.securityId&&x.unitId===u.unitId);const unique=prices.filter((x,i)=>prices.findIndex(y=>c.hash(y)===c.hash(x))===i);
      if(unique.length!==1){reject(unique.length?"CONFLICTING_PRICES":"MISSING_PRICE");continue;}
      const priceRow=unique[0],bad=priceReasons(priceRow,u,h.securityId,plan,r,c);if(bad.length){for(const reason of bad)reject(reason);continue;}
      const mv=decimal(u.quantity).mul(price(priceRow.value));decimal(mv.toString());
      units.push({securityId:h.securityId,unitId:u.unitId,quantity:u.quantity,price:priceRow.value,marketValue:mv.toString(),priceHash:c.hash(priceRow),unitHash:c.hash({securityId:h.securityId,...u})});
    }
  }
  if(plan.prices.some(p=>!plan.positions.some(pos=>pos.securityId===p.securityId&&pos.units.some(u=>u.unitId===p.unitId))))reasons.push("UNEXPECTED_PRICE");
  if(!held.length&&!s.noHeldMarketNotRequired)reasons.push("MARKET_NOT_REQUIRED_PROOF_MISSING");
  return {reasons:[...new Set(reasons)].sort(),units:units.sort((a,b)=>a.unitId<b.unitId?-1:a.unitId>b.unitId?1:0),excluded:[...new Set(excluded)].sort(),components};
}
export function assessNavAuthority(r:CurrentNavRequestV1,plan:CurrentNavPlanV1,c:NavCalculationContextV1,inputHash:string,units:readonly ValuedUnit[],economicReasons:readonly string[]):NavQualificationAssessmentV1 {
  const reasons:string[]=[],proofs:NavAuthorityProofV1[]=[];
  const requirements:{kind:NavAuthorityKind;subject:string}[]=[...["NAV_PROFILE","METHODOLOGY","ACCOUNTING_SCOPE","INDEPENDENT_NAV_ACCEPTANCE","OWNER_NAV_SCOPE"].map(kind=>({kind:kind as NavAuthorityKind,subject:inputHash})),{kind:"CALENDAR_POLICY",subject:c.hash(plan.session)},...units.flatMap(u=>[{kind:"IDENTITY" as const,subject:u.unitHash},{kind:"PRICE_SOURCE" as const,subject:u.priceHash}])];
  for(const {kind,subject}of requirements){
    const req={kind,subjectHash:subject,portfolioId:r.portfolioId,purpose:"PORTFOLIO_NAV" as const,valuationAt:plan.valuationAt,knowledgeCutoff:r.knowledgeCutoff,calculatedAt:c.calculatedAt};
    let p:NavAuthorityProofV1|null=null;try{p=c.authority?.verify(req)??null;}catch{reasons.push(kind+"_VERIFICATION_FAILED");continue;}
    if(!p){reasons.push(kind+"_MISSING");continue;}
    try{
      const keys="kind subjectHash portfolioId purpose origin reference producer validator knownAt effectiveFrom effectiveUntil expiresAt revokedAt".split(" ").sort().join(" ");
      requireRule(Object.keys(p).sort().join(" ")===keys,"AUTHORITY_PROOF_SCHEMA");
      instant(p.knownAt);instant(p.effectiveFrom);if(p.effectiveUntil!==null)instant(p.effectiveUntil);if(p.expiresAt!==null)instant(p.expiresAt);if(p.revokedAt!==null)instant(p.revokedAt);
      if(p.kind!==kind||p.subjectHash!==subject||p.portfolioId!==r.portfolioId||p.purpose!=="PORTFOLIO_NAV"||p.origin!==c.origin||!navText(p.reference)||!navText(p.producer)||!navText(p.validator)||p.producer===p.validator)reasons.push(kind+"_SCOPE_OR_INDEPENDENCE_MISMATCH");
      else if(p.knownAt>r.knowledgeCutoff||p.effectiveFrom>plan.valuationAt||(p.effectiveUntil!==null&&plan.valuationAt>=p.effectiveUntil))reasons.push(kind+"_TIME_MISMATCH");
      else if(p.revokedAt!==null)reasons.push(kind+"_REVOKED");
      else if(p.expiresAt!==null&&p.expiresAt<=c.calculatedAt)reasons.push(kind+"_EXPIRED");else proofs.push(JSON.parse(JSON.stringify(p)) as NavAuthorityProofV1);
    }catch{reasons.push(kind+"_INVALID_PROOF");}
  }
  for(const dim of ["sourceIdentity","independentValidation"] as const)if(plan.completeness[dim].state!=="COMPLETE"||!plan.completeness[dim].evidence.length)reasons.push("ACCEPTANCE_INCOMPLETE:"+dim);
  return {version:"nav-qualification-assessment-v1",profile:NAV_PROFILE,economicReasons,authorityReasons:[...new Set(reasons)].sort(),dimensions:plan.completeness,authorityProofs:proofs,qualified:economicReasons.length===0&&reasons.length===0,completeObservedPerimeter:economicReasons.length===0};
}
