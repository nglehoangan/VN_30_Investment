import {readFileSync,realpathSync} from 'node:fs';
import {resolve,relative,isAbsolute} from 'node:path';
import {createHash} from 'node:crypto';
import {normalizeStructuredResponse,type StructuredRawResponse} from './structured-normalization';
import {CAFEF_ACTIVE_MODES,type CafeFNamespace} from './cafef';
import type {HybridInput,FinancialVerification,FinancialFrame} from '@/domain/fundamentals/hybrid-admission';
import type {ManualStatement,CurrentAnalysisSnapshot,ManualFact} from '@/domain/fundamentals/manual-first';
import {canonicalJson} from '@/domain/fundamentals/snapshot';
import {requireFundamental} from '@/domain/fundamentals/validation';
import {decimal} from '@/domain/portfolio/values';
export const financialHash=(v:unknown)=>createHash('sha256').update(canonicalJson(v)).digest('hex');
const sha=(v:Uint8Array)=>createHash('sha256').update(v).digest('hex');
interface ReviewedFact extends ManualFact {retainedReaderProof?:{path:string;sha256:string;renderSha256:string}}
interface SampleCell {authority?:'AUDITED_PDF'|'REVIEWED_PDF'|'ISSUER_DISCLOSURE';ticker:string;itemId:string;value:string;period:{start:string;end:string};scope:'CONSOLIDATED'|'STANDALONE';unit:string;currency:string;sourceHash:string;sourceDocumentId:string;sourcePath:string;evidenceLocator:string;declaredUnit:string;retainedReaderProof:{path:string;sha256:string;renderSha256:string};derivation:{operands:string[]}|null;fiscalYear?:number;reportPeriodType?:FinancialFrame;reviewedAt?:string;zeroVerified?:boolean;independentReview?:string;revisionStatus?:'ORIGINAL'|'RESTATED'|'RESTATED_COMPARATIVE'|'SOURCE_REPORTED'|'ORIGINAL_COMPARATIVE';revisionContext?:string;supersedesFactId?:string|null;revisionEvidence?:string|null;debtPopulationEvidence?:string}
export function loadHybridInput(root:string,analysisAt:string,snapshotId:string,mode:HybridInput['mode']='CURRENT_ANALYSIS',options:{selectiveEvidencePath?:string;requestsPath?:string;selectiveEvidencePaths?:string[];includeBorrowings?:boolean;historicalCafeFReplay?:boolean;ticker?:string}={}){
 const sourceBindings:{path:string;sha256:string}[]=[],checked=new Set<string>();
 const retained=(path:string)=>{const target=realpathSync(resolve(root,path)),within=relative(realpathSync(root),target);requireFundamental(!within.startsWith('..')&&!isAbsolute(within),'FINANCIAL_RETAINED_PATH');const bytes=readFileSync(target);if(!checked.has(path)){sourceBindings.push({path:within,sha256:sha(bytes)});checked.add(path);}return bytes;};
 const json=<T>(path:string):T=>JSON.parse(retained(path).toString('utf8')) as T;
 const manual=json<CurrentAnalysisSnapshot>('docs/fundamental-data-engine/evidence/2026-10-13-physical-corpus-reconciliation/CURRENT_ANALYSIS_SNAPSHOT.json');
 const namespace=(ticker:string):CafeFNamespace=>{const sector=manual.readiness.find(r=>r.ticker===ticker)?.sector;return sector==='BANK'?'BANK':sector==='SECURITIES'?'SECURITIES':sector==='REAL_ESTATE'||ticker==='VIC'?'REAL_ESTATE':sector==='CONGLOMERATE'?'OTHER_SPECIAL':'STANDARD_CORPORATE';};
 const requests=json<StructuredRawResponse[]>(options.requestsPath??'data/providers/cafef/poc-2026-10-13/requests.json').filter(r=>(!options.ticker||r.symbol===options.ticker)&&(options.historicalCafeFReplay||CAFEF_ACTIVE_MODES.some(mode=>mode===r.TypeTime))),events=[],failures=[];
 const candidates=[];
 for(const r of [...new Map(requests.map(r=>[r.requestFingerprint,r])).values()]){
  if(r.error||r.httpStatus!==200){failures.push(r);continue;}
  const body=retained(r.rawPayloadLocation);requireFundamental(sha(body)===r.payloadHash,'CAFEF_RETAINED_RAW_HASH');
  try{const result=normalizeStructuredResponse(body.toString('utf8'),r,namespace(r.symbol),options.includeBorrowings??false);candidates.push(...result.facts);events.push(...result.events);}catch(e){failures.push({...r,error:e instanceof Error?e.message:'SCHEMA_INVALID'});}
 }
 const documentCache=new Map<string,boolean>();
 function qualified(doc:ManualStatement|undefined){if(!doc||doc.reviewStatus!=='QUALIFIED')return false;if(documentCache.has(doc.SHA256))return documentCache.get(doc.SHA256)!;const body=retained(doc.retainedPath);requireFundamental(sha(body)===doc.SHA256&&body.subarray(0,5).toString()==='%PDF-','ISSUER_BODY_HASH');documentCache.set(doc.SHA256,true);return true;}
 function reader(proof:SampleCell['retainedReaderProof']|undefined,doc:ManualStatement){if(!proof)return false;const bytes=retained(proof.path);requireFundamental(sha(bytes)===proof.sha256,'RETAINED_REVIEW_READER_HASH');const data=JSON.parse(bytes.toString('utf8'));requireFundamental(data.bodyHash===doc.SHA256&&data.renderSha256===proof.renderSha256,'RETAINED_REVIEW_RENDER_HASH');return true;}
 const verifications:FinancialVerification[]=[];
 function frame(period:{start:string;end:string},doc:ManualStatement):FinancialFrame{if(period.start===period.end)return doc.fiscalQuarter===null?'ANNUAL':doc.reportingPeriod.start.endsWith('-01-01')?'YTD':'QUARTER';if(period.start.endsWith('-01-01')&&period.end.endsWith('-12-31'))return 'ANNUAL';if(period.start.endsWith('-01-01'))return 'YTD';return 'QUARTER';}
 for(const group of manual.canonicalFacts.filter(f=>f.status==='AVAILABLE'&&(!options.ticker||f.facts.some(row=>row.ticker===options.ticker))))for(const row of group.facts.filter(f=>group.selectedFactIds.includes(f.id)&&(!options.ticker||f.ticker===options.ticker)) as ReviewedFact[]){
  const doc=manual.statements.find(s=>s.documentId===row.sourceDocumentId);if(!qualified(doc)||!doc||!reader(row.retainedReaderProof,doc))continue;
  const reportPeriodType=frame(row.period,doc);const fiscalQuarter=reportPeriodType==='ANNUAL'?null:Math.ceil(Number(row.period.end.slice(5,7))/3);
  const reserve=row.itemId==='BANK_LOAN_LOSS_RESERVES';const value=reserve&&decimal(group.value!).negative?decimal(group.value!).neg().toString():group.value!;
  verifications.push({...row,value,reportPeriodType,fiscalYear:Number(row.period.end.slice(0,4)),fiscalQuarter,authority:'MANUAL_VERIFIED',qualified:true,evidenceReference:row.reviewReference,reviewedAt:row.reviewedAt,publishedAt:doc.publishedAt,historicalAvailability:doc.historicalAvailability,definitionVerified:!(reportPeriodType==='QUARTER'&&['CFO','CASH_CAPEX_REPORTED'].includes(row.itemId)),valueVerified:true,zeroVerified:row.value==='0'&&row.reviewStatus==='REVIEWED',provenanceVerified:true,origin:'RETAINED_REVIEWED_FACT',revisionStatus:row.revisionStatus,supersedesFactId:row.supersedesFactId,revisionEvidence:row.revisionEvidence});
 }
 const pocContext=json<{calculatedAt:string}>('docs/fundamental-data-engine/evidence/2026-10-13-cafef-structured-poc/cafef_run_context.json');
 const samples=json<{observations:SampleCell[]}>('docs/fundamental-data-engine/evidence/2026-10-13-cafef-structured-poc/cafef_pdf_sample_cell_observations.json').observations;
 // Additional selective calibration uses identical, hash-bound per-cell shape.
 const extraPath=options.selectiveEvidencePath??'docs/fundamental-data-engine/evidence/2026-10-13-cafef-production-admission/SELECTIVE_ISSUER_CELL_EVIDENCE.json';
 try{for(const path of options.selectiveEvidencePaths??[extraPath])samples.push(...json<{observations:SampleCell[]}>(path).observations);}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}
 for(const cell of samples){
  if(options.ticker&&cell.ticker!==options.ticker)continue;
  if(cell.independentReview==='PENDING'||(cell.revisionContext?.includes('RESTATED')||cell.revisionStatus?.includes('RESTATED'))&&!cell.supersedesFactId)continue;
  const doc=manual.statements.find(s=>s.SHA256===cell.sourceHash);if(!qualified(doc)||!doc||!reader(cell.retainedReaderProof,doc))continue;
  const add=(itemId:string,value:string,suffix:string)=>{const reportPeriodType=cell.reportPeriodType??frame(cell.period,doc);verifications.push({id:'issuer-cell:'+financialHash({cell,itemId,suffix}),ticker:cell.ticker,itemId,value,...cell.debtPopulationEvidence?{debtPopulationEvidence:cell.debtPopulationEvidence}:{},period:cell.period,scope:cell.scope,unit:cell.unit,currency:cell.currency,sourceDocumentId:doc.documentId,sourceHash:cell.sourceHash,reportPeriodType,fiscalYear:Number(cell.period.end.slice(0,4)),fiscalQuarter:reportPeriodType==='ANNUAL'?null:Math.ceil(Number(cell.period.end.slice(5,7))/3),authority:cell.authority??'AUDITED_PDF',qualified:true,evidenceReference:cell.evidenceLocator+' / selective-issuer-cell-v1',reviewedAt:cell.reviewedAt??pocContext.calculatedAt,publishedAt:doc.publishedAt,historicalAvailability:doc.historicalAvailability,definitionVerified:true,valueVerified:true,zeroVerified:cell.value==='0'&&cell.zeroVerified===true,provenanceVerified:true,origin:'SELECTIVE_PDF_SAMPLE',revisionStatus:cell.revisionStatus==='RESTATED'||cell.revisionStatus==='RESTATED_COMPARATIVE'?'RESTATED':'ORIGINAL',supersedesFactId:cell.supersedesFactId??null,revisionEvidence:cell.revisionEvidence??null});};
  if(cell.derivation&&cell.itemId==='FINANCIAL_DEBT'){
   const multiplier=cell.declaredUnit==='MILLION_CURRENCY'?'1000000':'1';add('SHORT_TERM_FINANCIAL_BORROWINGS',decimal(cell.derivation.operands[0]).mul(decimal(multiplier)).toString(),'short');add('LONG_TERM_FINANCIAL_BORROWINGS',decimal(cell.derivation.operands[1]).mul(decimal(multiplier)).toString(),'long');
  }else add(cell.itemId,cell.value,'reported');
 }
 const input:HybridInput={snapshotId,analysisAt,systemKnownAt:analysisAt,mode,candidates:[...new Map(candidates.map(c=>[c.id,c])).values()],verifications:[...new Map(verifications.map(v=>[v.id,v])).values()],certificates:[],universe:manual.readiness.filter(r=>!options.ticker||r.ticker===options.ticker).map(r=>({ticker:r.ticker,sector:r.sector})),statements:manual.statements,sourceBindings};
 return {input,manual,events,failures,rawRequests:requests};
}
