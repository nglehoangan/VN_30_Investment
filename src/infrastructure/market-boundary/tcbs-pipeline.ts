import { readFileSync, realpathSync } from 'node:fs';
import { resolve, relative, sep } from 'node:path';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import type { Capability, Evidence, Initialization, RawSource } from '@/domain/market-boundary/contracts';
import { seal, reference, requireBoundary, same } from '@/domain/market-boundary/validation';
import { marketFreshness } from '@/domain/market-boundary/freshness';
import { eodPolicy, HOSE_HOLIDAYS_2026, type HoseCalendar } from '@/domain/market-boundary/hose-calendar';
import { normalizeTcbsEod, parseTcbsIdentity, object, array, numeric, TCBS_EOD_VERSION, type TcbsEodProfile } from '@/domain/market-boundary/tcbs-eod';
import { manualStatementFreshness, type ManualStatement } from '@/domain/fundamentals/manual-first';
import { canonicalJson } from '@/domain/fundamentals/snapshot';
import { snapshotHash } from '@/infrastructure/fundamentals/snapshot-hash';
import type { Level1DispositionRelease } from '@/domain/fundamentals/level1-disposition';
import { validateLevel1Disposition } from '@/domain/fundamentals/level1-disposition';
import { exactJson } from './exact-json';
import type { QualifiedMarketAdapter } from '@/infrastructure/market-boundary-authority';
export const PIPELINE_VERSION='tcbs-vn30-eod-pipeline-v1';
export const RELEASE_PATH='docs/fundamental-data-engine/evidence/2026-10-19-level1-promotion-partition-closure/RELEASE.json';
const RECONSTRUCTION='docs/fundamental-data-engine/evidence/2026-10-17-data-initialization-final-acceptance/ACCOUNTING_RECONSTRUCTION.json';
const SOURCE_POLICY='docs/08_CONTINUOUS_IMPROVEMENT/MANUAL_FUNDAMENTALS_ARCHITECTURE.md';
export const hashBytes=(b:Uint8Array|string)=>createHash('sha256').update(b).digest('hex');
export interface FilePin {readonly path:string;readonly sha256:string}
export interface CaptureRequest {readonly apiId:string;readonly ticker?:string;readonly securityId?:string;readonly rawPath:string;readonly sha256:string;readonly retrievedAt:string;readonly startedAt:string;readonly providerAt?:string|null;readonly providerHttpDate?:string|null;readonly httpStatus:number;readonly method:string;readonly url:string;readonly parameters:Readonly<Record<string,string>>}
interface Capture {readonly version:string;readonly state:string;readonly requests:readonly CaptureRequest[]}
export class PinnedFiles {
 readonly pins=new Map<string,string>();
 constructor(readonly root:string){}
 read(path:string,expected?:string){const file=realpathSync(resolve(this.root,path)),root=realpathSync(this.root);requireBoundary(file.startsWith(root+sep),'SOURCE_PATH_ESCAPE');const bytes=readFileSync(file);requireBoundary(bytes.length<=32_000_000,'SOURCE_FILE_LIMIT');const hash=hashBytes(bytes);requireBoundary(!expected||hash===expected,'SOURCE_HASH_MISMATCH:'+path);const rel=relative(root,file);requireBoundary(!this.pins.has(rel)||this.pins.get(rel)===hash,'SOURCE_CHANGED_DURING_BUILD');this.pins.set(rel,hash);return bytes;}
 json<T>(path:string,expected?:string){return JSON.parse(this.read(path,expected).toString('utf8')) as T;}
 evidence(path:string,at:string):Evidence {const b=this.read(path);return {id:path,hash:hashBytes(b),knownAt:at,effectiveAt:at};}
 all():readonly FilePin[]{return [...this.pins].map(([path,sha256])=>({path,sha256})).sort((a,b)=>a.path.localeCompare(b.path));}
}
function ev(id:string,value:unknown,at:string):Evidence{return {id,hash:snapshotHash(value),knownAt:at,effectiveAt:at};}
function captured(files:PinnedFiles,folder:string,row:CaptureRequest){requireBoundary(row.httpStatus===200&&row.method==='GET'&&/^\d{4}-\d\d-\d\dT/.test(row.retrievedAt)&&row.startedAt<=row.retrievedAt,'SUCCESSFUL_CAPTURE_REQUIRED');requireBoundary(!row.rawPath.includes('/')&&!row.rawPath.includes('\\'),'RAW_BASENAME');return exactJson(files.read(folder+'/'+row.rawPath,row.sha256).toString('utf8'));}
export function createTcbsEodAdapter(profile:TcbsEodProfile):QualifiedMarketAdapter {
 return {sourceId:'TCBS_OPENAPI_EOD',schemaVersion:'tcbs-bars-long-term-v1',normalizerVersion:TCBS_EOD_VERSION,
  identityVersion:snapshotHash(profile.identities),semanticsVersion:'VND_PER_SHARE_RAW_LATEST_EOD_MULTIPLIER_1',identities:profile.identities.map(i=>({securityId:i.securityId,ticker:i.ticker,exchange:i.exchange,from:profile.tradingDate,to:null,knownAt:i.knownAt})),field:'CLOSE',adjustment:'RAW',
  normalize:(bytes,source)=>normalizeTcbsEod(exactJson(new TextDecoder('utf-8',{fatal:true}).decode(bytes)),source,profile)};
}
export interface PipelineBuildInput {readonly captureFolder:string;readonly boardFolder:string;readonly builtAt:string}
/** All input folders are explicit pins, never a latest-wins import. No network or mutable accounting operation. */
export function buildTcbsPipeline(root:string,input:PipelineBuildInput){
 const files=new PinnedFiles(root);for(const path of ['src/domain/market-boundary/tcbs-eod.ts','src/domain/market-boundary/hose-calendar.ts','src/domain/market-boundary/contracts.ts','src/domain/market-boundary/validation.ts','src/domain/market-boundary/freshness.ts','src/domain/portfolio/values.ts','src/domain/fundamentals/manual-first.ts','src/domain/fundamentals/level1-disposition.ts','src/domain/fundamentals/snapshot.ts','src/infrastructure/fundamentals/snapshot-hash.ts','src/shared/time.ts','src/infrastructure/market-boundary/exact-json.ts','src/infrastructure/market-boundary/tcbs-pipeline.ts'])files.read(path);const at=input.builtAt,release=files.json<Level1DispositionRelease>(RELEASE_PATH);validateLevel1Disposition(release,snapshotHash);
 const active=files.json<{id:string;bodyHash:string;approvalHash:string}>('src/infrastructure/fundamentals/active-level1-release.json');requireBoundary(active.id===release.id&&active.bodyHash===snapshotHash(release)&&active.approvalHash===release.approvalHash,'ACTIVE_LEVEL1_RELEASE_BINDING');
 const capture=files.json<Capture>(input.captureFolder+'/manifest.json');requireBoundary(((capture.version==='tcbs-vn30-source-capture-v1'&&capture.requests.length===60)||(capture.version==='tcbs-vn30-source-capture-v2'&&capture.requests.length===61))&&capture.state==='CAPTURED_NOT_QUALIFIED','FULL30_CAPTURE_REQUIRED');
 const boardCapture=files.json<Capture>(input.boardFolder+'/manifest.json'),boardRequests=boardCapture.requests.filter(r=>r.apiId==='5.3');requireBoundary(['tcbs-5x-bounded-review-v1','tcbs-vn30-source-capture-v2'].includes(boardCapture.version)&&boardRequests.length===1,'BOARD_CAPTURE_REQUIRED');
 const br=boardRequests[0];requireBoundary(br.url==='https://openapi.tcbs.com.vn/tartarus/v1/tickerSnaps'&&same(br.parameters,{index:'2'}),'BOARD_REQUEST_BINDING');
 const boardBody=object(captured(files,input.boardFolder,br)),rawDate=boardBody.tradingDate;requireBoundary(typeof rawDate==='string'&&/^\d\d\/\d\d\/\d{4}$/.test(rawDate),'FULL_TRADING_DATE_REQUIRED');
 const tradingDate=rawDate.slice(6)+'-'+rawDate.slice(3,5)+'-'+rawDate.slice(0,2),board=array(boardBody.data).map(x=>{const row=object(x);requireBoundary(typeof row.symbol==='string','BOARD_SYMBOL');requireBoundary(row.matchPrice!==undefined&&row.matchPrice!==null,'BOARD_COMPLETED_CLOSE_UNAVAILABLE:PREOPEN_OR_NO_TRADE');return {ticker:row.symbol,value:numeric(row.matchPrice)};});
 requireBoundary(board.length===30&&new Set(board.map(r=>r.ticker)).size===30&&release.partition.members.every(m=>board.some(r=>r.ticker===m.ticker)),'BOARD_CERTIFIED_FULL30');
 const identities=release.partition.members.map(member=>{
  const matches=capture.requests.filter(r=>r.apiId==='5.11'&&r.ticker===member.ticker&&r.securityId===member.securityId);requireBoundary(matches.length===1,'IDENTITY_CAPTURE_REQUIRED');const r=matches[0];
  requireBoundary(r.url==='https://openapi.tcbs.com.vn/ananke/v1/securities'&&same(r.parameters,{fields:'all',filter:'symbol='+member.ticker}),'IDENTITY_REQUEST_BINDING');
  return parseTcbsIdentity(captured(files,input.captureFolder,r),member,r.retrievedAt);
 });
 requireBoundary(new Set(identities.map(i=>i.isin)).size===30&&new Set(identities.map(i=>i.codeId)).size===30,'UNIQUE_ISIN_CODEID');
 const corporateActions=ev('tcbs-raw-latest-eod-policy-v1',{adjustment:'NO_BACK_ADJUSTMENT',scope:'LATEST_COMPLETED_BAR_ONLY',boardMatch:'REQUIRED',historicalTotalReturn:'UNSUPPORTED',shareAccounting:'EXISTING_LEDGER_ONLY'},at);
 const calendarBody={version:'hose-calendar-2026-v1',validFrom:'2026-01-01',validThrough:'2026-12-31',holidays:HOSE_HOLIDAYS_2026,sources:['https://www.hsx.vn/vi/tin-tuc/hose-thong-bao-lich-nghi-giao-dich-nam-2026/2437411','https://staticfile.hsx.vn/Uploads/UploadDocuments/2453338/HTGD_Quy%20dinh%20can%20biet%20khi%20GDCK%20tren%20HOSE_T2.2026.pdf'],closeCutoff:'15:00 Asia/Ho_Chi_Minh (conservative full-session bound, not exchange event timestamp)',qualification:'TECHNICAL_POLICY_CANDIDATE_NOT_INDEPENDENT_ACCEPTANCE'};
 const calendar:HoseCalendar={version:'hose-calendar-2026-v1',validFrom:'2026-01-01',validThrough:'2026-12-31',holidayDates:HOSE_HOLIDAYS_2026,evidence:ev('hose-calendar-2026-v1',calendarBody,at)};
 let policy=eodPolicy(tradingDate,calendar,ev('tcbs-eod-valuation-session-v1',{},at));const {id:_id,hash:_hash,...policyBody}=policy;void _id;void _hash;policy={...policy,hash:snapshotHash(policyBody)};
 const profile:TcbsEodProfile={contractVersion:TCBS_EOD_VERSION,currency:'VND',unit:'VND_PER_SHARE',multiplier:'1',tradingDate,session:'HOSE_DAILY_COMPLETED',barEnd:tradingDate+'T08:00:00.000Z',adjustment:'RAW_LATEST_CLOSE_MATCHED_TO_BOARD',corporateActions,identities,board};
 const adapter=createTcbsEodAdapter(profile),samples:RawSource[]=release.partition.members.map(member=>{
  const matches=capture.requests.filter(r=>r.apiId==='5.13'&&r.ticker===member.ticker&&r.securityId===member.securityId);requireBoundary(matches.length===1,'DAILY_BAR_CAPTURE_REQUIRED');const r=matches[0];
  requireBoundary(r.url==='https://openapi.tcbs.com.vn/nyx/v2/stock/bars-long-term'&&r.parameters.ticker===member.ticker&&r.parameters.type==='stock'&&r.parameters.resolution==='D'&&r.parameters.countBack==='2','BAR_REQUEST_BINDING');
  captured(files,input.captureFolder,r);requireBoundary(r.retrievedAt<=at,'FUTURE_SOURCE_CAPTURE');
  // Capture manifests retain HTTP Date in providerAt; it is an HTTP server clock, not a quote event timestamp.
  const providerAt=null;
  return {id:'tcbs-eod-'+member.ticker+'-'+r.sha256.slice(0,16),hash:r.sha256,sourceId:adapter.sourceId,request:ev('tcbs-request-'+member.ticker,r,r.retrievedAt),rawPath:input.captureFolder+'/'+r.rawPath,retrievedAt:r.retrievedAt,providerAt,schemaVersion:adapter.schemaVersion,origin:'REAL_SOURCE'};
 });
 const observations=samples.flatMap(s=>adapter.normalize(files.read(s.rawPath,s.hash),s));
 requireBoundary(observations.length===30&&new Set(observations.map(o=>o.securityId)).size===30,'NORMALIZED_FULL30');
 const sourceContract=ev('tcbs-source-contract-v1',{profile,sourceId:adapter.sourceId,normalizerVersion:adapter.normalizerVersion,unitBasis:'Current HOSE common-share quote values are kept as returned, multiplier1; tradeUnit is never a scaling instruction',scope:'CURRENT_KNOWLEDGE_LATEST_COMPLETED_EOD_VALUATION_ONLY',metadataPins:files.all(),calendarBody},at);
 const negativeValidation=ev('tcbs-eod-negative-suite-v1',{implementation:'tests/unit/tcbs-pipeline.test.ts; tests/integration/tcbs-pipeline.test.ts',requiredCases:['missingRaw','hashMismatch','wrongIdentity','unit','adjustment','duplicate','conflict','future','stale','holiday','unknownCalendar','acceptanceBypass'],acceptance:'INDEPENDENT_REVIEW_PENDING'},at);
 const capabilityBody:Capability={sourceContract,sourceId:adapter.sourceId,sourceSchema:adapter.schemaVersion,normalizerVersion:adapter.normalizerVersion,identityVersion:adapter.identityVersion,semanticsVersion:adapter.semanticsVersion,corporateActionPolicy:corporateActions,freshnessPolicy:{id:policy.id,hash:policy.hash,knownAt:policy.knownAt,effectiveAt:policy.effectiveAt},calendar:calendar.evidence,rawSamples:samples,normalizedSampleHash:snapshotHash(observations),negativeValidation,missingBehavior:'BLOCK',duplicateBehavior:'BLOCK_CONFLICT'};
 const capability=seal('CAPABILITY','tcbs-capability-'+snapshotHash(capabilityBody).slice(0,24),at,at,capabilityBody,snapshotHash);
 // Retained canonical rows are read only; neither PDF extraction nor accounting admission is re-run here.
 const db=new DatabaseSync(resolve(root,'data/vn30.sqlite'),{readOnly:true});const canonicalDocuments=new Map<string,{period:{end:string};evidenceReference?:string;sourceHash?:string}[]>();
 let canonical:{id:string;bodyHash:string;ticker:string;latestPeriod:string}[];
 try{const rows=db.prepare('SELECT id,body,body_hash FROM fundamental_admission_run ORDER BY id').all() as {id:string;body:string;body_hash:string}[];canonical=rows.filter(row=>release.dispositions.some(d=>d.canonicalRunId===row.id)).map(row=>{requireBoundary(hashBytes(row.body)===row.body_hash,'CANONICAL_BODY_CHECKSUM');const d=JSON.parse(row.body) as {canonicalFacts:{ticker:string;period:{end:string};evidenceReference?:string;sourceHash?:string}[]};canonicalDocuments.set(d.canonicalFacts[0]?.ticker,d.canonicalFacts);requireBoundary(d.canonicalFacts.length>0,'EMPTY_CANONICAL_RUN');return {id:row.id,bodyHash:row.body_hash,ticker:d.canonicalFacts[0].ticker,latestPeriod:d.canonicalFacts.map(f=>f.period.end).sort().at(-1)!};});}finally{db.close();}
 requireBoundary(canonical.length===30&&new Set(canonical.map(r=>r.ticker)).size===30&&release.dispositions.every(d=>canonical.some(c=>c.id===d.canonicalRunId&&c.ticker===d.ticker)),'CURRENT_CANONICAL_SET');
 const reconstruction=files.json<{status:string;rows:{ticker:string;securityId:string;sector:string;inputPath:string;inputSHA256:string}[]}>(RECONSTRUCTION);requireBoundary(reconstruction.status==='PASS'&&reconstruction.rows.length===30,'RETAINED_SECTOR_RECONSTRUCTION');
 const sectors=reconstruction.rows.map(row=>{requireBoundary(release.partition.members.some(m=>m.ticker===row.ticker&&m.securityId===row.securityId),'SECTOR_SECURITY_BINDING');return {ticker:row.ticker,securityId:row.securityId,sector:row.sector};});
 const financialFreshness=reconstruction.rows.map(row=>{const input=files.json<{statements:ManualStatement[]}>(row.inputPath,row.inputSHA256);let latest=input.statements.filter(s=>s.ticker===row.ticker&&s.reviewStatus==='QUALIFIED').sort((a,b)=>b.reportingPeriod.end.localeCompare(a.reportingPeriod.end))[0]??null;
  const canonicalEnd=canonical.find(c=>c.ticker===row.ticker)!.latestPeriod;
  // A later approved source review can supersede the older reconstruction metadata; never infer a period from a price/API.
  if(latest&&canonicalEnd>latest.reportingPeriod.end){
   const context=object(release.accountingContext)[row.ticker] as {asOf?:string;sourceHash?:string;scope?:string;status?:string}|undefined;
   requireBoundary(context?.asOf===canonicalEnd&&context.status==='REVIEWED'&&context.scope==='CONSOLIDATED','LATER_STATEMENT_APPROVAL_REQUIRED');
   const fact=canonicalDocuments.get(row.ticker)!.find(f=>f.period.end===canonicalEnd&&f.sourceHash===context.sourceHash&&f.evidenceReference);
   requireBoundary(fact?.evidenceReference,'LATER_STATEMENT_PROVENANCE');
   const review=files.json<{source:{sha256:string;periodStart:string;periodEnd:string;scope:string;path:string;reviewConclusion:string}}>(fact.evidenceReference),source=review.source;
   requireBoundary(source.sha256===context.sourceHash&&source.periodEnd===canonicalEnd&&source.scope==='CONSOLIDATED'&&source.reviewConclusion==='UNMODIFIED_REVIEW_CONCLUSION','LATER_STATEMENT_SOURCE_BINDING');
   latest={...latest,documentId:fact.evidenceReference,SHA256:source.sha256,verifiedHash:source.sha256,reportingPeriod:{start:source.periodStart,end:source.periodEnd},retainedPath:source.path,reviewReference:fact.evidenceReference};
  }
  return {ticker:row.ticker,latestPeriod:latest?.reportingPeriod.end??null,status:manualStatementFreshness(latest,at,latest?.fiscalYearEndMonth??12)};});
 const durablePolicy=files.evidence(SOURCE_POLICY,at),universeReference=object(release.partition.universe.reference);requireBoundary(typeof universeReference.version==='string','UNIVERSE_VERSION');const universe=ev(universeReference.version,release.partition.universe,at);
 const body:Initialization={universe,members:release.partition.members.map(m=>({securityId:m.securityId,ticker:m.ticker,exchange:'HOSE',state:m.state})),securityMaster:ev('tcbs-security-master-v1',identities,at),sectorMaster:ev('retained-sector-master-v1',sectors,at),fundamentals:ev('canonical-admission-set-v1',canonical,at),qualifications:ev('retained-level1-qualifications-v1',release.dispositions,at),dispositions:ev(release.id,release.dispositions,at),partition:ev('level1-policy-b-partition',release.partition,at),exceptions:release.exceptions.map(e=>({...ev(e.ownerDecisionReference,e,at),securityId:release.partition.members.find(m=>m.ticker===e.ticker)!.securityId,status:'ACTIVE',classification:'OWNER_ANALYTICAL_EXCEPTION',amountVnd:e.ketVangVnd})),provenanceContract:sourceContract,capability:reference(capability),dataClassPolicy:durablePolicy,softwareVersion:PIPELINE_VERSION,schemaVersion:'initialization-manifest-v1'};
 const initialization=seal('INITIALIZATION','tcbs-initialization-'+snapshotHash(body).slice(0,24),at,at,body,snapshotHash);
 const marketBody={capability:reference(capability),universe,requestedAsOf:at,purpose:'VALUATION' as const,acceptedTradingDate:tradingDate,session:profile.session,observations,sources:samples,normalizationVersion:adapter.normalizerVersion,freshnessPolicy:capabilityBody.freshnessPolicy,calendar:calendar.evidence};
 const market=seal('MARKET','tcbs-market-'+snapshotHash(marketBody).slice(0,24),at,at,marketBody,snapshotHash);
 const freshness=marketFreshness(market,capability,policy,{mode:'LIVE',requestedAt:at,knownAt:at,now:at,purpose:'VALUATION',securityIds:observations.map(o=>o.securityId),universe},snapshotHash);
 return {version:PIPELINE_VERSION,input,capability,initialization,market,policy,calendarBody,profile,canonical,sectors,financialFreshness,freshness,sourcePins:files.all(),technicalCapability:'PASS_CANDIDATE' as const,initializationCandidate:financialFreshness.filter(f=>release.partition.members.find(m=>m.ticker===f.ticker)?.state==='SCORABLE').every(f=>f.status==='CURRENT')?'PASS_CANDIDATE' as const:'BLOCKED' as const,independentAcceptance:'PENDING_INDEPENDENT_REVIEW' as const,readyForScoring:false as const,decisionReady:false as const};
}
export type TcbsPipelineCandidate=ReturnType<typeof buildTcbsPipeline>;
/** Replay accepted runtime contracts only after an independently pinned approval, never a request boolean. */
export function requireTcbsIndependentAcceptance(candidate:TcbsPipelineCandidate,approvedHashes:readonly string[]){requireBoundary(approvedHashes.includes(snapshotHash({capability:reference(candidate.capability),initialization:reference(candidate.initialization),policy:candidate.policy})),'TCBS_INDEPENDENT_ACCEPTANCE_REQUIRED');}
export function replayTcbsPipeline(root:string,candidate:TcbsPipelineCandidate){requireBoundary(candidate.version===PIPELINE_VERSION,'UNSUPPORTED_TCBS_PIPELINE');for(const pin of candidate.sourcePins)new PinnedFiles(root).read(pin.path,pin.sha256);const rebuilt=buildTcbsPipeline(root,candidate.input);requireBoundary(canonicalJson(rebuilt)===canonicalJson(candidate),'TCBS_PIPELINE_REPLAY_MISMATCH');return rebuilt;}
