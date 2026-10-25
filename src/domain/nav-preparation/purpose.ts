import {decimal} from '@/domain/portfolio/values';
import type {Digest,NavEnvelope,NavPayload,PriceBinding,EligibilityRequest,NavUnavailable,AuthorityKind,AuthorityPlaceholder} from './contracts';
import {fields,text,hash,time,day,uuid,list,evidence,dimension,known,requireNav,contentHash,immutable,exactQuantity,exactPrice,NavContractError} from './validation';
import {readBridge,resolveBridge} from './identity';
const KINDS:readonly AuthorityKind[]=['SOURCE_AUTHORITY','INDEPENDENT_ACCEPTANCE','OWNER_APPROVAL','IDENTITY_BRIDGE_ACCEPTANCE','CALENDAR_POLICY_ACCEPTANCE'];
function priceBinding(raw:unknown):asserts raw is PriceBinding {
 fields(raw,'ledgerSecurityId bridgeRowId marketSecurityId providerInstrumentCode isin venue securityClass quantity price currency unit multiplier tradingDate observedAt receivedAt validThrough source');const p=raw as unknown as PriceBinding;
 [p.ledgerSecurityId,p.bridgeRowId,p.providerInstrumentCode].forEach(text);uuid(p.marketSecurityId);dimension(p.venue,p.securityClass);if(p.isin!==null)requireNav(typeof p.isin==='string'&&/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(p.isin),'INVALID_ISIN');
 exactQuantity(p.quantity);exactPrice(p.price);requireNav(p.currency==='VND'&&p.unit==='VND_PER_SHARE'&&p.multiplier==='1','PRICE_UNIT_CONTRACT');day(p.tradingDate);[p.observedAt,p.receivedAt,p.validThrough].forEach(time);evidence(p.source);
 requireNav(p.observedAt<=p.receivedAt&&p.observedAt<=p.validThrough&&p.observedAt<=p.source.knownAt&&p.source.knownAt<=p.receivedAt,'INVALID_PRICE_TIMELINE');
 try{decimal(p.quantity).mul(decimal(p.price));}catch{throw new NavContractError('PRODUCT_EXCEEDS_ACCOUNTING_PRECISION');}
}
function payload(raw:unknown):asserts raw is NavPayload {
 fields(raw,'contractVersion mode origin purpose sourceId sourceSchema normalizerVersion portfolioId ledgerNamespace marketNamespace ledgerWatermark ledgerStateHash bridgeHash createdAt valuationAt session prices');const b=raw as unknown as NavPayload;
 requireNav(b.contractVersion==='nav-source-preparation-v1'&&b.mode==='OFFLINE_PREPARATION','UNSUPPORTED_NAV_CONTRACT');requireNav(b.purpose==='PORTFOLIO_NAV','WRONG_PURPOSE');requireNav(['SYNTHETIC_TEST','RETAINED_PREPARATION'].includes(b.origin),'UNSUPPORTED_ORIGIN');
 requireNav(b.sourceId==='TCBS_OPENAPI_EOD'&&b.sourceSchema==='tcbs-bars-long-term-v1'&&b.normalizerVersion==='tcbs-latest-eod-close-v1','UNSUPPORTED_SOURCE_CONTRACT');[b.portfolioId,b.ledgerNamespace,b.marketNamespace].forEach(text);requireNav(typeof b.ledgerWatermark==='string'&&/^(0|[1-9]\d*)$/.test(b.ledgerWatermark),'INVALID_LEDGER_WATERMARK');hash(b.ledgerStateHash);hash(b.bridgeHash);time(b.createdAt);time(b.valuationAt);requireNav(b.valuationAt<=b.createdAt,'FUTURE_VALUATION');
 fields(b.session,'status tradingDate completedAt eligibleFrom eligibleThrough nextCompletedAt calendarFrom calendarThrough timezone purpose field adjustment calendar policy');const s=b.session;
 requireNav(s.status==='CANDIDATE'&&s.purpose==='PORTFOLIO_NAV'&&s.timezone==='Asia/Ho_Chi_Minh'&&s.field==='CLOSE'&&s.adjustment==='RAW','NAV_SESSION_PROOF_REQUIRED');[s.tradingDate,s.calendarFrom,s.calendarThrough].forEach(day);[s.completedAt,s.eligibleFrom,s.eligibleThrough,s.nextCompletedAt].forEach(time);[s.calendar,s.policy].forEach(evidence);
 requireNav(s.calendarFrom<=s.tradingDate&&s.tradingDate<=s.calendarThrough&&s.nextCompletedAt.slice(0,10)<=s.calendarThrough,'CALENDAR_OUTSIDE_RANGE');
 requireNav(s.completedAt===b.valuationAt&&s.completedAt.slice(0,10)===s.tradingDate&&s.eligibleFrom===s.completedAt&&s.nextCompletedAt>s.completedAt&&s.nextCompletedAt.slice(0,10)>s.tradingDate&&new Date(Date.parse(s.nextCompletedAt)-1).toISOString()===s.eligibleThrough,'INVALID_SESSION_WINDOW');
 known(s.calendar,b.createdAt);known(s.policy,b.createdAt);list(b.prices,true);b.prices.forEach(priceBinding);for(const p of b.prices)requireNav(p.receivedAt<=b.createdAt,'FUTURE_CAPTURE');
}
export function prepareNavEnvelope(raw:unknown,digest:Digest):NavEnvelope {payload(raw);return readNavEnvelope({...raw,contentHash:contentHash(raw,digest)},digest);}
export function readNavEnvelope(raw:unknown,digest:Digest):NavEnvelope {
 fields(raw,'contractVersion mode origin purpose sourceId sourceSchema normalizerVersion portfolioId ledgerNamespace marketNamespace ledgerWatermark ledgerStateHash bridgeHash createdAt valuationAt session prices contentHash');hash(raw.contentHash);const {contentHash:expected,...body}=raw;payload(body);requireNav(contentHash(body,digest)===expected,'NAV_ENVELOPE_HASH_MISMATCH');return immutable(raw as unknown as NavEnvelope);
}
function request(raw:unknown):asserts raw is EligibilityRequest {
 fields(raw,'purpose portfolioId ledgerNamespace marketNamespace ledgerWatermark ledgerStateHash bridgeHash tradingDate valuationAt knowledgeCutoff now held sourcePins authorities');const r=raw as unknown as EligibilityRequest;
 requireNav(r.purpose==='PORTFOLIO_NAV','WRONG_PURPOSE');[r.portfolioId,r.ledgerNamespace,r.marketNamespace,r.ledgerWatermark].forEach(text);[r.ledgerStateHash,r.bridgeHash].forEach(hash);day(r.tradingDate);time(r.valuationAt);requireNav(r.knowledgeCutoff!==null&&r.knowledgeCutoff!==undefined,'UNKNOWN_KNOWLEDGE_CUTOFF');time(r.knowledgeCutoff);time(r.now);requireNav(r.valuationAt<=r.knowledgeCutoff&&r.knowledgeCutoff<=r.now,'FUTURE_REQUEST');
 list(r.held);for(const h of r.held){fields(h,'ledgerSecurityId quantity');text(h.ledgerSecurityId);exactQuantity(h.quantity);}requireNav(new Set(r.held.map(h=>h.ledgerSecurityId)).size===r.held.length,'DUPLICATE_HELD_IDENTITY');
 list(r.sourcePins,true);for(const p of r.sourcePins){fields(p,'reference sha256');text(p.reference);hash(p.sha256);}requireNav(new Set(r.sourcePins.map(p=>p.reference)).size===r.sourcePins.length,'AMBIGUOUS_SOURCE_PIN');
 list(r.authorities,true);for(const a of r.authorities){
  fields(a,'kind status subjectHash evidence expiresAt revokedAt');requireNav(KINDS.includes(a.kind),'UNKNOWN_AUTHORITY_KIND');requireNav(['MISSING','PENDING','PRESENT_UNVERIFIED','EXPIRED','REVOKED'].includes(a.status),'UNSUPPORTED_AUTHORITY_STATUS');hash(a.subjectHash);
  if(a.evidence!==null)evidence(a.evidence);if(a.expiresAt!==null)time(a.expiresAt);if(a.revokedAt!==null)time(a.revokedAt);
  requireNav(a.status!=='PRESENT_UNVERIFIED'||a.evidence!==null,'MISSING_AUTHORITY_EVIDENCE');
 }
 requireNav(new Set(r.authorities.map(a=>a.kind)).size===r.authorities.length,'AMBIGUOUS_AUTHORITY');
}
function unavailable(reasons:string[],technicalStatus:'PASS'|'BLOCKED',allHeldCovered:boolean):NavUnavailable {
 return immutable({contractVersion:'nav-only-unavailable-v1',mode:'OFFLINE_PREPARATION',purpose:'PORTFOLIO_NAV',status:'UNAVAILABLE',nav:null,reasons:[...new Set(reasons)],technicalStatus,allHeldCovered,productionAuthorized:false,acceptedMapping:false,investmentActionabilityAuthorized:false,scoringAuthorized:false});
}
function authorityReason(a:AuthorityPlaceholder,expected:string,r:EligibilityRequest):string {
 if(a.subjectHash!==expected)return a.kind+'_SCOPE_MISMATCH';
 if(a.revokedAt!==null||a.status==='REVOKED')return a.kind+'_REVOKED';
 if(a.status==='EXPIRED'||(a.expiresAt!==null&&a.expiresAt<=r.now))return a.kind+'_EXPIRED';
 if(a.evidence&&a.evidence.knownAt>r.knowledgeCutoff)return a.kind+'_FUTURE_EVIDENCE';
 return a.kind+'_'+(a.status==='PRESENT_UNVERIFIED'?'UNVERIFIED':a.status);
}
/** No authority implementation is provided. Even a technically complete envelope returns null NAV. */
export function assessNavPreparation(bridgeRaw:unknown,envelopeRaw:unknown,requestRaw:unknown,digest:Digest):NavUnavailable {
 try{
  request(requestRaw);const r=requestRaw,b=readBridge(bridgeRaw,digest),n=readNavEnvelope(envelopeRaw,digest),reasons:string[]=[];
  requireNav(b.contentHash===r.bridgeHash&&n.bridgeHash===b.contentHash,'BRIDGE_BINDING_MISMATCH');
  requireNav(n.portfolioId===r.portfolioId&&n.ledgerNamespace===r.ledgerNamespace&&n.marketNamespace===r.marketNamespace,'NAV_PORTFOLIO_NAMESPACE_MISMATCH');
  requireNav(n.ledgerWatermark===r.ledgerWatermark&&n.ledgerStateHash===r.ledgerStateHash,'LEDGER_BINDING_MISMATCH');
  requireNav(n.valuationAt===r.valuationAt&&n.session.tradingDate===r.tradingDate,'VALUATION_SESSION_MISMATCH');
  requireNav(n.createdAt<=r.knowledgeCutoff,'ENVELOPE_NOT_KNOWN');known(n.session.calendar,r.knowledgeCutoff);known(n.session.policy,r.knowledgeCutoff);
  if(r.now<n.session.eligibleFrom||r.now>n.session.eligibleThrough)reasons.push('SESSION_EXPIRED_OR_NOT_YET_ELIGIBLE');
  const covered=new Set<string>();
  for(const h of r.held){
   const prices=n.prices.filter(p=>p.ledgerSecurityId===h.ledgerSecurityId);if(prices.length!==1){reasons.push(prices.length?'DUPLICATE_PRICE:'+h.ledgerSecurityId:'MISSING_PRICE:'+h.ledgerSecurityId);continue;}
   const p=prices[0];requireNav(p.quantity===h.quantity,'EXACT_QUANTITY_BINDING_MISMATCH');
   requireNav(p.venue==='HOSE'&&p.securityClass==='COMMON_SHARE','UNSUPPORTED_NAV_VENUE_CLASS');
   const resolved=resolveBridge(b,{portfolioId:r.portfolioId,ledgerNamespace:r.ledgerNamespace,ledgerSecurityId:h.ledgerSecurityId,marketNamespace:r.marketNamespace,provider:'TCBS',venue:p.venue,securityClass:p.securityClass,tradingDate:r.tradingDate,knowledgeCutoff:r.knowledgeCutoff,now:r.now},digest);
   const row=resolved.row;requireNav(row.id===p.bridgeRowId&&row.marketSecurityId===p.marketSecurityId&&row.providerInstrumentCode===p.providerInstrumentCode&&row.isin===p.isin,'PRICE_IDENTITY_BINDING_MISMATCH');
   requireNav(p.tradingDate===r.tradingDate&&p.observedAt===r.valuationAt,'PRICE_SESSION_MISMATCH');
   requireNav(p.receivedAt<=r.knowledgeCutoff&&p.observedAt<=r.valuationAt,'FUTURE_PRICE_INFORMATION');known(p.source,r.knowledgeCutoff);
   requireNav(p.validThrough===n.session.eligibleThrough,'PRICE_POLICY_WINDOW_MISMATCH');
   if(p.validThrough<r.now)reasons.push('PRICE_EXPIRED:'+h.ledgerSecurityId);
   const pins=r.sourcePins.filter(s=>s.reference===p.source.reference);requireNav(pins.length===1&&pins[0].sha256===p.source.sha256,'SOURCE_HASH_BINDING_MISMATCH');covered.add(h.ledgerSecurityId);
  }
  requireNav(n.prices.every(p=>r.held.some(h=>h.ledgerSecurityId===p.ledgerSecurityId)),'UNEXPECTED_PRICE_IDENTITY');
  requireNav(new Set(n.prices.map(p=>p.marketSecurityId)).size===n.prices.length,'DUPLICATE_MARKET_IDENTITY');
  const technical=reasons.length?'BLOCKED':'PASS',authorityReasons:string[]=[];
  for(const kind of KINDS){const a=r.authorities.find(a=>a.kind===kind),subject=kind==='IDENTITY_BRIDGE_ACCEPTANCE'?b.contentHash:kind==='CALENDAR_POLICY_ACCEPTANCE'?n.session.policy.sha256:n.contentHash;authorityReasons.push(a?authorityReason(a,subject,r):kind+'_MISSING');}
  return unavailable([...reasons,...authorityReasons,'OPERATIONAL_AUTHORITY_NOT_IMPLEMENTED'],technical,covered.size===r.held.length);
 }catch(e){return unavailable([e instanceof NavContractError?e.reason:'INVALID_NAV_PREPARATION'],'BLOCKED',false);}
}
