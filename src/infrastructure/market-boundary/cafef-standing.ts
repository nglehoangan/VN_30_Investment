import { readFileSync, realpathSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { createHash } from 'node:crypto';
import policy from '@/domain/market-boundary/cafef-standing-policy-v1.json';
import type { Evidence, RawSource, Sealed, SessionPolicy, Consumption } from '@/domain/market-boundary/contracts';
import type { BoundaryStore } from '@/ports/market-boundary';
import { normalizeCafefRawClose, CAFE_F_RAW_CLOSE_POLICY } from '@/domain/market-boundary/cafef-raw-close';
import { eodPolicy, isHoseSession, type HoseCalendar } from '@/domain/market-boundary/hose-calendar';
import { seal, reference, readSealed, requireBoundary, same } from '@/domain/market-boundary/validation';
import { instant, dateOnly } from '@/shared/time';
import { marketFreshness } from '@/domain/market-boundary/freshness';
import { snapshotHash as hash } from '@/infrastructure/fundamentals/snapshot-hash';
import { RetainedMarketAuthority, type QualifiedMarketAdapter } from '@/infrastructure/market-boundary-authority';
import { systemClock } from '@/infrastructure/runtime';
import type { Clock } from '@/ports/runtime';
import { exactJson } from './exact-json';
export const CAFE_F_STANDING_POLICY = policy;
export const POLICY_HASH = hash(policy);
export const bytesHash=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex');
export interface FilePin {path:string;sha256:string}
export interface Membership extends FilePin {identitySource:FilePin;from:string;through:string;knownAt:string;members:readonly {ticker:string;exchange:string;securityId:string}[]}
export interface StandingProfile {
 authorization:FilePin; policyFile:FilePin; code:readonly FilePin[];
 membership:Membership; calendar:HoseCalendar; calendarSources:readonly FilePin[];
 unitSource:FilePin; unitReceipt:FilePin; knownAt:string;
}
export interface IngestSpec {raw:FilePin;ticker:string;exchange:string;date:string;knownAt:string}
export interface StandingTrust {
 verifyStandingCandidate?(candidate:Candidate):void;
 standingAuthority?():{id:string;version:string;registry:FilePin};
 /** Server/host-configured registry, not request parameters or submitted PASS flags. */
 currentAuthorization(): FilePin | null;
 capturedSource(raw:FilePin,requestHash:string): {rawHash:string;requestHash:string;collectorHash:string;origin:'TRUSTED_CAPTURE_HANDOFF'} | null;
 independentMaterialAcceptance(materialHash:string): {materialHash:string;knownAt:string;reference:FilePin} | null;
}
export interface Candidate {
 spec:IngestSpec;profile:StandingProfile;materialHash:string;rawText:string;
 capability:Sealed<'CAPABILITY'>;market:Sealed<'MARKET'>;policy:SessionPolicy;
 provenance:{provider:string;sourceSchemaVersion:string;adapterVersion:string;normalizerVersion:string;knownAt:string;originalReceivedAt:string;canonicalAvailability:string;canonicalization:string;originalUnits:unknown;unitSource:FilePin;unitReceipt:FilePin;responseSha256:string;sourceUrl:string;providerTimestamp:null;observationTimeConvention:string;policyVersion:string;materialHash:string;requestIndex:number;rowIndex:number};
}
export function retained(root:string,pin:FilePin) {
 const base=realpathSync(root),path=realpathSync(resolve(base,pin.path));requireBoundary(path.startsWith(base+sep),'SOURCE_PATH_ESCAPE');
 const bytes=readFileSync(path);requireBoundary(bytesHash(bytes)===pin.sha256,'SOURCE_HASH_MISMATCH:'+pin.path);return bytes;
}
function evidence(id:string,body:unknown,at:string):Evidence{return {id,hash:hash(body),knownAt:at,effectiveAt:at};}
/** Ceil fractional milliseconds, preserving original text separately: never make receipt earlier. */
export function availability(original:string):string {
 requireBoundary(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,9})?(?:Z|\+00:00)$/.test(original),'ORIGINAL_RECEIPT_FORMAT');
 dateOnly(original.slice(0,10));requireBoundary(Number(original.slice(11,13))<24&&Number(original.slice(14,16))<60&&Number(original.slice(17,19))<60,'ORIGINAL_RECEIPT_INVALID');
 const parsed=Date.parse(original);requireBoundary(Number.isFinite(parsed),'ORIGINAL_RECEIPT_INVALID');
 const fraction=/\.(\d+)/.exec(original)?.[1]??'';
 return new Date(parsed+(fraction.slice(3).split('').some(c=>c!=='0')?1:0)).toISOString();
}
const REQUIRED_CODE=[
 'src/domain/fundamentals/normalization.ts','src/domain/fundamentals/validation.ts',
 'src/infrastructure/source-admission/versioned-authority.ts',
 'src/infrastructure/source-admission/registry.ts','src/domain/fundamentals/standing-source-policy.ts','src/domain/fundamentals/source-authority.ts','src/domain/portfolio/transaction.ts',
 'src/domain/market-boundary/cafef-standing-policy-v1.json','src/domain/market-boundary/cafef-raw-close-policy.json',
 'src/domain/market-boundary/cafef-raw-close.ts','src/domain/market-boundary/contracts.ts','src/domain/market-boundary/validation.ts',
 'src/domain/market-boundary/hose-calendar.ts','src/domain/market-boundary/freshness.ts','src/domain/portfolio/values.ts',
 'src/domain/fundamentals/snapshot.ts','src/shared/time.ts','src/ports/market-boundary.ts','src/infrastructure/fundamentals/snapshot-hash.ts',
 'src/infrastructure/market-boundary/exact-json.ts','src/infrastructure/market-boundary/cafef-standing.ts','app/server/cafef-standing-services.ts','src/infrastructure/runtime.ts','src/ports/runtime.ts','skills/fetch-cafef-price-history/scripts/fetch.py','prisma/schema.prisma','scripts/cafef-standing.mjs','skills/vn30-market-price-corporate-actions/scripts/runtime.mjs',
 'src/infrastructure/market-boundary-authority.ts','src/application/market-boundary/lifecycle.ts',
 'src/infrastructure/repositories/market-boundary.ts','src/infrastructure/repositories/market-ingest.ts',
 'prisma/migrations/202611120001_market_ingest/migration.sql',
] as const;
export function implementationPins(root:string):FilePin[]{return REQUIRED_CODE.map(path=>({path,sha256:bytesHash(readFileSync(resolve(root,path)))}));}
export function checkProfile(root:string,p:StandingProfile) {
 instant(p.knownAt);instant(p.membership.knownAt);dateOnly(p.membership.from);dateOnly(p.membership.through);
 requireBoundary(p.membership.from<=p.membership.through&&p.membership.knownAt<=p.knownAt,'MEMBERSHIP_EVIDENCE_TIME');
 const member=JSON.parse(retained(root,p.membership).toString('utf8'));
 // The retained certified snapshot is bound to its actual reviewed-through date; no null-end extrapolation.
 requireBoundary(member.status==='CERTIFIED'&&member.historyComplete===true&&member.effectiveDate===p.membership.from&&member.asOf===p.membership.through,'MEMBERSHIP_COVERAGE_BINDING');
 requireBoundary(member.composition.length===30&&new Set(member.composition).size===30&&p.membership.members.length===30,'VN30_COVERAGE');
 const identity=JSON.parse(retained(root,p.membership.identitySource).toString('utf8'));
 requireBoundary(identity.asOf===p.membership.through&&Array.isArray(identity.effectiveMembers)&&p.membership.members.every(m=>identity.effectiveMembers.some((r:{ticker:string;exchange:string;securityId:string;evidenceHash:string})=>r.ticker===m.ticker&&r.exchange===m.exchange&&r.securityId===m.securityId&&r.evidenceHash===member.originalPDF.sha256)),'VN30_SECURITY_MASTER_SOURCE_BINDING');
 requireBoundary(new Set(p.membership.members.map(m=>m.securityId)).size===30,'SECURITY_ID_COLLISION');
 requireBoundary(p.membership.members.every(m=>member.composition.includes(m.ticker)&&m.exchange==='HOSE'&&m.securityId.trim())&&new Set(p.membership.members.map(m=>m.ticker)).size===30,'MEMBERSHIP_IDENTITY_BINDING');
 requireBoundary(p.code.length===REQUIRED_CODE.length&&REQUIRED_CODE.every(path=>p.code.some(pin=>pin.path===path)),'IMPLEMENTATION_MANIFEST_INCOMPLETE');
 for(const pin of [...p.code,p.unitSource,...p.calendarSources])retained(root,pin);
 requireBoundary(CAFE_F_RAW_CLOSE_POLICY.version===policy.normalizerVersion&&CAFE_F_RAW_CLOSE_POLICY.eligibleCloseField===policy.field&&CAFE_F_RAW_CLOSE_POLICY.sourceUnit===policy.sourceUnit&&CAFE_F_RAW_CLOSE_POLICY.normalizedUnit===policy.unit&&CAFE_F_RAW_CLOSE_POLICY.multiplier===policy.multiplier&&CAFE_F_RAW_CLOSE_POLICY.adjustedPriceSeries==='EXCLUDED_BY_OWNER_POLICY','NORMALIZER_STANDING_SEMANTICS_MISMATCH');
 requireBoundary(same(JSON.parse(retained(root,p.code.find(pin=>pin.path==='src/domain/market-boundary/cafef-raw-close-policy.json')!).toString('utf8')),CAFE_F_RAW_CLOSE_POLICY),'NORMALIZER_VERSION_RESTART_OR_REQUALIFICATION_REQUIRED');
 const unitRecord=JSON.parse(retained(root,p.unitReceipt).toString('utf8'));
 requireBoundary(unitRecord.provider==='CAFEF'&&unitRecord.httpStatus===200&&unitRecord.path===p.unitSource.path&&unitRecord.sha256===p.unitSource.sha256&&new URL(unitRecord.url).origin===policy.apiOrigin&&availability(unitRecord.receivedAt)<=p.knownAt,'UNIT_DECLARATION_RECEIPT_BINDING');
 requireBoundary(retained(root,p.unitSource).toString('utf8').includes('Giá (nghìn VNĐ)'), 'PROVIDER_UNIT_DECLARATION_REQUIRED');
 requireBoundary(p.calendarSources.length>0&&p.calendar.evidence.hash===hash(p.calendarSources),'CALENDAR_SOURCE_BINDING');
 const originalPolicy=JSON.parse(retained(root,p.policyFile).toString('utf8'));requireBoundary(same(originalPolicy,policy),'STANDING_POLICY_VERSION_MISMATCH');
 const auth=JSON.parse(retained(root,p.authorization).toString('utf8'));
 requireBoundary(auth.contract==='owner-standing-market-source-principle-authorization-v1'&&auth.authorizedPrinciple===true&&auth.codeAcceptanceGranted===false,'EXPLICIT_STANDING_AUTHORIZATION_REQUIRED');
 retained(root,auth.source);const sourceText=retained(root,auth.source).toString('utf8');
 requireBoundary(sourceText.includes(auth.ownerStatement)&&auth.ownerStatement==='Standing Source Approval for CaféF Raw Close across the VN30 universe, with automated Capability/Market Validation, deterministic replay, and transformation during ingestion.','OWNER_STATEMENT_BINDING');
 requireBoundary(same(auth.scope,{provider:'CAFEF',field:'GiaDongCua',semantic:'RAW_CLOSE',currency:'VND',purpose:'VALUATION',universe:'VN30_EFFECTIVE_ON_OBSERVATION_DATE'})&&same(auth.versionedPolicyProposal,p.policyFile),'STANDING_AUTHORIZATION_SCOPE');
 requireBoundary(Date.parse(auth.recordedAt)<=Date.parse(p.knownAt),'POLICY_NOT_YET_AUTHORIZED');
 return hash({policy:POLICY_HASH,code:p.code,membership:p.membership,calendar:p.calendar,calendarSources:p.calendarSources,unitSource:p.unitSource,unitReceipt:p.unitReceipt,authorization:p.authorization});
}
function rawSelection(rawText:string,spec:IngestSpec) {
 const collection=exactJson(rawText) as {schemaVersion:string;provider:string;symbol:string;exchange:string;units:unknown;prices:Record<string,unknown>[];requests:Record<string,unknown>[]};
 requireBoundary(collection.schemaVersion===policy.collectionSchemaVersion&&collection.provider==='CAFEF','SCHEMA_VERSION_MISMATCH');
 requireBoundary(collection.symbol===spec.ticker&&collection.exchange===spec.exchange&&spec.exchange===policy.exchange,'COLLECTION_IDENTITY');
 requireBoundary(collection.units===null||collection.units==='THOUSAND_VND_PER_SHARE','ORIGINAL_UNITS_CONTRADICT_STANDING_CONTRACT');
 requireBoundary(Array.isArray(collection.prices)&&Array.isArray(collection.requests),'COLLECTION_SCHEMA');
 const indexed=collection.prices.map((r,i)=>({r,i})).filter(({r})=>r.date===spec.date);requireBoundary(indexed.length===1,'MISSING_OR_DUPLICATE_PRICE_DATE');
 const {r,i}=indexed[0];const qi=collection.requests.findIndex(q=>q.sha256===r.responseSha256&&q.url===r.sourceUrl&&q.receivedAt===r.receivedAt);
 requireBoundary(qi>=0,'ORIGINAL_REQUEST_MISSING');const q=collection.requests[qi];
 requireBoundary(q.httpStatus==='200'&&typeof q.rawResponse==='string'&&bytesHash(q.rawResponse)===q.sha256,'RAW_RESPONSE_HASH_OR_STATUS');
 const url=new URL(String(q.url)),params=q.parameters as Record<string,string>;
 requireBoundary(url.origin===policy.apiOrigin&&url.pathname===policy.apiPath&&!url.username&&!url.password&&url.searchParams.getAll('Symbol').length===1&&url.searchParams.getAll('ExchangeType').length===1,'API_IDENTITY_MISMATCH');
 requireBoundary(params.Symbol===spec.ticker&&params.ExchangeType===spec.exchange&&url.searchParams.get('Symbol')===spec.ticker&&url.searchParams.get('ExchangeType')===spec.exchange,'REQUEST_TICKER_EXCHANGE');
 requireBoundary(Object.keys(params).sort().join('|')==='EndDate|ExchangeType|PageIndex|PageSize|StartDate|Symbol'&&Object.entries(params).every(([k,v])=>String(v)===url.searchParams.get(k))&&[...url.searchParams.keys()].length===6,'REQUEST_SCHEMA_MISMATCH');
 requireBoundary(/^[1-9]\d*$/.test(String(params.PageIndex))&&String(params.PageSize)==='30','REQUEST_PAGINATION_SCHEMA');
 const us=(v:string)=>{const parts=/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(v);requireBoundary(parts,'REQUEST_DATE_FORMAT');return dateOnly(parts[3]+'-'+parts[1].padStart(2,'0')+'-'+parts[2].padStart(2,'0'));};
 const start=us(params.StartDate),end=us(params.EndDate);requireBoundary(start<=spec.date&&spec.date<=end&&Date.parse(end)-Date.parse(start)<=366*86400000,'REQUEST_DATE_SCOPE');
 const body=exactJson(q.rawResponse) as {Data:{Data:Record<string,unknown>[]}};requireBoundary(body&&body.Data&&Array.isArray(body.Data.Data),'PRICE_RESPONSE_SCHEMA');
 const rows=body.Data.Data.filter(row=>row.Ngay===spec.date.slice(8)+'/'+spec.date.slice(5,7)+'/'+spec.date.slice(0,4));
 requireBoundary(rows.length===1&&rows[0].Symbol===spec.ticker,'RAW_TICKER_DATE');
 // The source pointer addresses the retained collector row; selected field must agree with original body.
 requireBoundary(policy.requiredRowFields.every(k=>Object.hasOwn(rows[0],k)),'MISSING_REQUIRED_RAW_CLOSE_FIELDS');
 requireBoundary(Object.keys(rows[0]).every(k=>policy.allowedRowFields.includes(k)),'ROW_SCHEMA_CHANGE_SUSPEND');
 const display=r.raw as Record<string,unknown>;requireBoundary(display&&same(display,rows[0]),'COLLECTOR_ROW_RAW_MISMATCH');
 return {collection,q,qi,row:rows[0],index:i};
}
export function createCafefAdapter(profile:StandingProfile,spec:IngestSpec):QualifiedMarketAdapter {
 const identities=profile.membership.members.map(m=>({...m,from:profile.membership.from,to:nextDate(profile.membership.through),knownAt:profile.membership.knownAt}));
 return {sourceId:policy.sourceId,schemaVersion:policy.schemaVersion,normalizerVersion:policy.normalizerVersion,identityVersion:hash(profile.membership),semanticsVersion:policy.normalizerVersion,identities,field:'CLOSE',adjustment:'RAW',
 normalize:(bytes,source)=>{
  dateOnly(spec.date);instant(spec.knownAt);
  requireBoundary(source.sourceId===policy.sourceId&&source.schemaVersion===policy.schemaVersion&&source.rawPath===spec.raw.path&&source.hash===bytesHash(bytes),'RAW_SOURCE_SCOPE');
  const matches=identities.filter(m=>m.ticker===spec.ticker&&m.exchange===spec.exchange&&m.from<=spec.date&&spec.date<m.to);requireBoundary(matches.length===1,'VN30_MEMBERSHIP_OUTSIDE_VERIFIED_INTERVAL');
  requireBoundary(isHoseSession(spec.date,profile.calendar),'NON_TRADING_DATE');
  const selected=rawSelection(new TextDecoder('utf-8',{fatal:true}).decode(bytes),spec),available=availability(String(selected.q.receivedAt));
  requireBoundary(available<=spec.knownAt&&source.retrievedAt===available,'LATER_KNOWLEDGE_NOT_AVAILABLE');
  const units=evidence('cafef-history-unit-declaration',profile.unitSource,profile.knownAt);
  const actions=evidence('cafef-raw-only-no-action-adjustment',policy,profile.knownAt);
  return [normalizeCafefRawClose(selected.row,source,{securityId:matches[0].securityId,ticker:spec.ticker,exchange:spec.exchange,tradingDate:spec.date,observedAt:spec.date+'T08:00:00.000Z',session:'HOSE_DAILY_COMPLETED',sourceUnit:policy.sourceUnit as 'THOUSAND_VND_PER_SHARE',unitEvidence:units,corporateActionPolicy:actions,rowPointer:'/prices/'+selected.index+'/raw'})];
 }};
}
function nextDate(date:string){return new Date(Date.parse(date+'T00:00:00.000Z')+86400000).toISOString().slice(0,10);}
export function buildCafefCandidateFromBytes(root:string,profile:StandingProfile,spec:IngestSpec,bytes:Uint8Array):Candidate {
 const materialHash=checkProfile(root,profile);instant(spec.knownAt);dateOnly(spec.date);requireBoundary(profile.knownAt<=spec.knownAt,'MATERIAL_KNOWLEDGE');
 requireBoundary(bytesHash(bytes)===spec.raw.sha256,'RAW_HASH_MISMATCH');requireBoundary(bytes.length<=4_000_000,'RAW_SIZE_LIMIT');const rawText=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
 const selected=rawSelection(rawText,spec),available=availability(String(selected.q.receivedAt));
 const request=evidence('cafef-request:'+hash(selected.q),selected.q,spec.knownAt);
 const source:RawSource={id:'cafef-raw:'+spec.raw.sha256,hash:spec.raw.sha256,sourceId:policy.sourceId,request,rawPath:spec.raw.path,retrievedAt:available,providerAt:null,schemaVersion:policy.schemaVersion,origin:'REAL_SOURCE'};
 const adapter=createCafefAdapter(profile,spec),rows=adapter.normalize(bytes,source),at=spec.knownAt;
 const body=eodPolicy(spec.date,profile.calendar,evidence('cafef-hose-session:'+spec.date,{},at));
 const {id:_id,hash:_hash,...policyBody}=body;const sessionPolicy={...body,hash:hash(policyBody)};void _id;void _hash;
 const calendar=profile.calendar.evidence,sourceContract=evidence(policy.version,{policy:POLICY_HASH,authorization:profile.authorization,materialHash},at);
 const capability=seal('CAPABILITY','cafef-cap:'+hash({materialHash,date:spec.date,raw:spec.raw,request,at}),at,at,{sourceContract,sourceId:policy.sourceId,sourceSchema:policy.schemaVersion,normalizerVersion:policy.normalizerVersion,identityVersion:adapter.identityVersion,semanticsVersion:adapter.semanticsVersion,corporateActionPolicy:rows[0].corporateActions,freshnessPolicy:{id:sessionPolicy.id,hash:sessionPolicy.hash,knownAt:at,effectiveAt:at},calendar,rawSamples:[source],normalizedSampleHash:hash(rows),negativeValidation:evidence('cafef-negative-cases:'+materialHash,materialHash,at),missingBehavior:'BLOCK',duplicateBehavior:'BLOCK_CONFLICT'},hash);
 const universe=evidence('vn30-membership:'+hash(profile.membership),profile.membership,at);
 const market=seal('MARKET','cafef-market:'+hash({capability:reference(capability),rows}),at,at,{capability:reference(capability),universe,requestedAsOf:spec.date+'T08:00:00.000Z',purpose:'VALUATION',acceptedTradingDate:spec.date,session:'HOSE_DAILY_COMPLETED',observations:rows,sources:[source],normalizationVersion:policy.normalizerVersion,freshnessPolicy:capability.body.freshnessPolicy,calendar},hash);
 return {spec,profile,materialHash,rawText,capability,market,policy:sessionPolicy,provenance:{provider:policy.sourceId,sourceSchemaVersion:policy.schemaVersion,adapterVersion:policy.adapterVersion,normalizerVersion:policy.normalizerVersion,knownAt:at,originalReceivedAt:String(selected.q.receivedAt),canonicalAvailability:available,canonicalization:'CEIL_TO_MILLISECOND_FOR_DOMAIN_CONTRACT_ORIGINAL_TEXT_PRESERVED',originalUnits:selected.collection.units,unitSource:profile.unitSource,unitReceipt:profile.unitReceipt,responseSha256:String(selected.q.sha256),sourceUrl:String(selected.q.url),providerTimestamp:null,observationTimeConvention:policy.observationTimeConvention,policyVersion:policy.version,materialHash,requestIndex:selected.qi,rowIndex:selected.index}};
}
export function buildCafefCandidate(root:string,profile:StandingProfile,spec:IngestSpec):Candidate {return buildCafefCandidateFromBytes(root,profile,spec,retained(root,spec.raw));}
export function assertStandingTrust(root:string,c:Candidate,trust:StandingTrust,rawBytes?:Uint8Array) {
 const material=checkProfile(root,c.profile);requireBoundary(material===c.materialHash,'MATERIAL_CHANGED_REQUALIFICATION_REQUIRED');
 requireBoundary(same(trust.currentAuthorization(),c.profile.authorization),'STANDING_AUTHORIZATION_MISSING_OR_SUPERSEDED');
 if(trust.verifyStandingCandidate){trust.verifyStandingCandidate(c);const replay=rawBytes?buildCafefCandidateFromBytes(root,c.profile,c.spec,rawBytes):buildCafefCandidate(root,c.profile,c.spec);requireBoundary(same(replay,c),'CANDIDATE_REPLAY_MISMATCH');return;}
 const acceptance=trust.independentMaterialAcceptance(material);
 requireBoundary(acceptance&&acceptance.materialHash===material,'CAFEF_INDEPENDENT_MATERIAL_ACCEPTANCE_REQUIRED');
 instant(acceptance.knownAt);requireBoundary(acceptance.knownAt<=c.spec.knownAt,'INDEPENDENT_ACCEPTANCE_NOT_YET_KNOWN');
 const proof=JSON.parse(retained(root,acceptance.reference).toString('utf8'));
 requireBoundary(proof.decision==='ACCEPTED'&&proof.materialHash===material&&proof.knownAt===acceptance.knownAt&&typeof proof.reviewer==='string'&&proof.reviewer.trim()&&proof.superseded===false,'INDEPENDENT_ACCEPTANCE_RECORD_BINDING');
 const capture=trust.capturedSource(c.spec.raw,c.market.body.sources[0].request.hash);
 requireBoundary(capture&&capture.origin==='TRUSTED_CAPTURE_HANDOFF'&&capture.rawHash===c.spec.raw.sha256&&capture.requestHash===c.market.body.sources[0].request.hash&&capture.collectorHash===c.profile.code.find(p=>p.path==='skills/fetch-cafef-price-history/scripts/fetch.py')?.sha256,'UNTRUSTED_CAPTURE_EVIDENCE');
 // Candidate is untrusted data: reconstruct sealed results from actual retained bytes before admitting it.
 const replay=rawBytes?buildCafefCandidateFromBytes(root,c.profile,c.spec,rawBytes):buildCafefCandidate(root,c.profile,c.spec);requireBoundary(same(replay,c),'CANDIDATE_REPLAY_MISMATCH');
}
export async function cafefAuthority(root:string,c:Candidate,trust:StandingTrust,reader?:(source:RawSource)=>Promise<Uint8Array>) {
 assertStandingTrust(root,c,trust,reader?await reader(c.market.body.sources[0]):undefined);
 const b=c.capability.body;const approvals=[b.sourceContract,b.corporateActionPolicy,b.freshnessPolicy,b.calendar,b.negativeValidation,...b.rawSamples.map(r=>r.request),c.market.body.universe];
 return new RetainedMarketAuthority(root,{approvals,policies:[c.policy],adapters:[createCafefAdapter(c.profile,c.spec)],retainedRawReader:reader,
  marketCurrent:async()=>{throw Error('CAFEF_NOT_LIVE_PRODUCTION_ACTIVATED');},initializationCurrent:async()=>{throw Error('F2_INITIALIZATION_AUTHORITY_NOT_GRANTED');},portfolioCurrent:async()=>{throw Error('PORTFOLIO_AUTHORITY_NOT_GRANTED');},prerequisite:async()=>{throw Error('ANALYSIS_PREREQUISITE_NOT_GRANTED');},currentDependencies:async()=>{throw Error('PRODUCTION_DEPENDENCY_AUTHORITY_NOT_GRANTED');}});
}
export function cafefIngestIdentity(c:Candidate) {return hash({provider:'CAFEF_PRICE_HISTORY',policy:POLICY_HASH,material:c.materialHash,ticker:c.spec.ticker,exchange:c.spec.exchange,date:c.spec.date,field:'CLOSE',adjustment:'RAW'});}
export interface CafefAcceptedMarketStore extends BoundaryStore {
 retainedRaw(source:RawSource):Promise<Uint8Array>;
 marketIngestBinding(identityKey:string):Promise<{marketId:string;rawHash:string;revoked:boolean}|null>;
}
/** Market-input consumption only. Full valuation/scoring still requires existing F2/analysis contracts. */
export async function consumeCafefValuation(root:string,c:Candidate,trust:StandingTrust,store:CafefAcceptedMarketStore,request:Consumption,clock:Clock=systemClock) {
 requireBoundary(request.mode==='HISTORICAL'&&request.purpose==='VALUATION'&&request.securityIds.length===1&&request.securityIds[0]===c.market.body.observations[0].securityId,'CAFEF_VALUATION_PURPOSE_SCOPE');
 const link=await store.marketIngestBinding(cafefIngestIdentity(c));
 requireBoundary(link&&link.marketId===c.market.id&&link.rawHash===c.spec.raw.sha256,'ACCEPTED_RAW_NORMALIZED_LINK_REQUIRED');
 requireBoundary(!link.revoked,'MARKET_INGEST_REVOKED');const a=await cafefAuthority(root,c,trust,s=>store.retainedRaw(s));
 const cap=await store.find(reference(c.capability),'CAPABILITY'),m=await store.find(reference(c.market),'MARKET');
 readSealed(m,'MARKET',hash);await a.replayCapability(cap);await a.replayMarket(m);
 const freshness=marketFreshness(m,cap,c.policy,{...request,now:clock.now()},hash);requireBoundary(freshness.status==='PASS','CAFEF_VALUATION_FRESHNESS:'+freshness.reasons.join(','));return {observation:m.body.observations[0],freshness,financialEvidenceAdmission:'F2_OPEN',historicalPIT:false};
}
