import {normalizeStandingAction,type ReviewedStandingAction} from '@/domain/fundamentals/standing-actions';
import {buildHybridAdmission,type HybridInput,type HybridAdmissionSnapshot} from '@/domain/fundamentals/hybrid-admission';
import {normalizeLexical,DECLARED_UNITS} from '@/domain/fundamentals/normalization';
import {validateEvidence,type CurrentValuationEvidence} from '@/domain/scoring/evidence';
import {UNIFIED_SOURCE_POLICY} from '@/domain/fundamentals/standing-source-policy';
import {snapshotHash as hash} from '@/infrastructure/fundamentals/snapshot-hash';
import {instant,dateOnly} from '@/shared/time';
import {sourceBytes,assertSourceMaterial,sha,type SourceMaterial,type SourcePin,type SourceAdmissionTrust} from './registry';
import {exactJson} from '@/infrastructure/market-boundary/exact-json';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
export interface FinancialIngestRequest {input:SourcePin;extractions:SourcePin;reviewedActions?:SourcePin;material:SourceMaterial;ticker:string;securityId:string;economicAsOf:string;knownAt:string;ingestedAt:string;previousManualSnapshotId:string;sourceInputs?:readonly {rawHash:string;url?:string}[]}
export function financialIdentity(q:FinancialIngestRequest){const {knownAt:unusedKnown,ingestedAt:unusedIngest,...scope}=q;return hash(scope);}
export interface FinancialTransform {factId:string;rawHash:string;retainedRawPath:string;nativeValue:string;nativeUnit:string;sourcePointer:string;normalizedValue:string;originalReceivedAt:string;reviewedAt:string;sourceRole:string;documentType:string}
export const FINANCIAL_CODE_PATHS=[
 'src/domain/fundamentals/standing-actions.ts','src/domain/fundamentals/standing-source-policy.ts','src/domain/fundamentals/hybrid-admission.ts','src/domain/fundamentals/source-authority.ts',
 'src/domain/fundamentals/debt-contract.ts','src/domain/fundamentals/current-qualification.ts','src/domain/fundamentals/securities-contract.ts','src/domain/fundamentals/bank-contract.ts','src/domain/fundamentals/document-qualification.ts','src/domain/fundamentals/validation.ts','src/domain/fundamentals/snapshot.ts','src/domain/scoring/validation.ts','src/domain/portfolio/transaction.ts','src/infrastructure/fundamentals/snapshot-hash.ts','src/domain/fundamentals/normalization.ts','src/domain/fundamentals/structured-certification.ts','src/domain/fundamentals/manual-first.ts','src/domain/scoring/evidence.ts',
 'src/shared/time.ts','src/domain/portfolio/values.ts','src/infrastructure/source-admission/versioned-authority.ts','src/infrastructure/source-admission/registry.ts','src/infrastructure/source-admission/financial.ts',
 'src/infrastructure/repositories/unified-admission.ts','app/server/unified-admission-services.ts',
 'src/infrastructure/repositories/fundamental-admission.ts','src/infrastructure/repositories/fundamentals.ts',
 'prisma/schema.prisma','prisma/migrations/202611120002_unified_admission/migration.sql',
] as const;
export const financialCodePins=(root:string)=>FINANCIAL_CODE_PATHS.map(path=>({path,sha256:sha(readFileSync(resolve(root,path)))}));
function requireValue(ok:unknown,reason:string):asserts ok{if(!ok)throw Error(reason);}
function dimensions(unit:string){return unit==='CURRENCY'?'VND':unit==='CURRENCY_PER_SHARE'?'VND_PER_SHARE':unit==='SHARES'?'SHARES':unit==='RATIO'?'RATIO':null;}
export interface RetainedFinancialCell {ticker:string;itemId:string;periodStart:string;periodEnd:string;scope:string;raw:SourcePin;nativeValue:string;nativeUnit:string;format:'CANONICAL'|'EN'|'VI';locator:{mode:'JSON_POINTER';pointer:string}|{mode:'DIRECT_PDF';page:number;box:readonly number[];review:SourcePin;pointer:string}}
function pointer(value:unknown,path:string):unknown {requireValue(path.startsWith('/'),'EXACT_FINANCIAL_POINTER_REQUIRED');return path.slice(1).split('/').reduce<unknown>((v,k)=>{requireValue(v!==null&&typeof v==='object'&&Object.hasOwn(v,k.replace(/~1/g,'/').replace(/~0/g,'~')),'FINANCIAL_POINTER_MISSING');return (v as Record<string,unknown>)[k.replace(/~1/g,'/').replace(/~0/g,'~')];},value);}
/** Only sources actually consumed by this ticker's selected candidates/verification inputs are mandatory. */
export function financialRequiredBindings(input:HybridInput){
 const hashes=new Set([...input.candidates.map(c=>c.sourceHash),...input.verifications.map(v=>v.sourceHash)]);
 const certificatePaths=new Set(input.certificates.map(c=>c.certificateReference));
 return input.sourceBindings.filter(p=>hashes.has(p.sha256)||certificatePaths.has(p.path));
}
/** Existing reviewed inputs are reused, not re-extracted. Their approval flags alone never authorize storage. */
export function planFinancialIngest(root:string,request:FinancialIngestRequest){
 const q=request;[q.knownAt,q.ingestedAt].forEach(instant);dateOnly(q.economicAsOf);
 requireValue(q.ingestedAt<=q.knownAt&&q.economicAsOf<=q.knownAt.slice(0,10),'FUTURE_INGEST_OR_ECONOMIC_DATE');
 requireValue(/^[A-Z0-9]{2,8}$/.test(q.ticker)&&q.securityId.length>0,'INVALID_FINANCIAL_IDENTITY');
 const identities=JSON.parse(sourceBytes(root,q.material.identities).toString()) as {effectiveMembers:{ticker:string;securityId:string}[]};
 requireValue(Array.isArray(identities.effectiveMembers)&&identities.effectiveMembers.filter(m=>m.ticker===q.ticker&&m.securityId===q.securityId).length===1&&identities.effectiveMembers.filter(m=>m.ticker===q.ticker).length===1&&identities.effectiveMembers.filter(m=>m.securityId===q.securityId).length===1,'FINANCIAL_TICKER_SECURITY_BINDING');
 requireValue(hash([...q.material.code].sort((a,b)=>a.path.localeCompare(b.path)))===hash(financialCodePins(root).sort((a,b)=>a.path.localeCompare(b.path))),'FINANCIAL_CODE_REQUALIFICATION_REQUIRED');
 requireValue(q.material.sourceBindings.some(p=>p.path===q.input.path&&p.sha256===q.input.sha256),'INPUT_NOT_BOUND_TO_MATERIAL');
 requireValue(q.material.sourceBindings.some(p=>p.path===q.extractions.path&&p.sha256===q.extractions.sha256),'EXTRACTIONS_NOT_BOUND_TO_MATERIAL');
 const cells=JSON.parse(sourceBytes(root,q.extractions).toString()) as RetainedFinancialCell[];requireValue(Array.isArray(cells),'FINANCIAL_CELLS_REQUIRED');
 const original=JSON.parse(sourceBytes(root,q.input).toString()) as HybridInput;
 requireValue(original.universe.length===1&&original.universe[0].ticker===q.ticker&&original.candidates.every(c=>c.ticker===q.ticker)&&original.verifications.every(v=>v.ticker===q.ticker),'CROSS_TICKER_FINANCIAL_INPUT');
 requireValue(original.candidates.every(c=>c.periodEnd<=q.economicAsOf)&&original.verifications.every(v=>v.period.end<=q.economicAsOf),'POST_ECONOMIC_CUTOFF_FACT');
 for(const p of financialRequiredBindings(original)){const retained=q.material.sourceBindings.filter(b=>b.sha256===p.sha256).sort((a,b)=>a.path.localeCompare(b.path))[0];requireValue(retained,'UNBOUND_FINANCIAL_SOURCE:'+p.path);sourceBytes(root,retained);}
 // Current knowledge can be later than the economic valuation date. Original input/receipts stay unchanged.
 const input:HybridInput={...original,snapshotId:'standing-current:'+financialIdentity(q),analysisAt:q.knownAt,systemKnownAt:q.knownAt,mode:'CURRENT_ANALYSIS'};
 const hybrid=buildHybridAdmission(input,hash);
 const transforms:FinancialTransform[]=[],evidence:CurrentValuationEvidence[]=[],quarantine:{id:string;reason:string}[]=[];
 for(const f of hybrid.canonicalFacts){try{
  requireValue(f.ticker===q.ticker,'CROSS_TICKER_CANONICAL');
  const bound=q.material.sourceBindings.find(p=>p.sha256===f.sourceHash);requireValue(bound,'CANONICAL_RAW_SOURCE_MISSING');
  const candidate=f.candidateIds.map(id=>input.candidates.find(c=>c.id===id)).find(c=>c?.sourceHash===f.sourceHash);
  const verification=f.verificationIds.map(id=>input.verifications.find(v=>v.id===id)).find(v=>v?.sourceHash===f.sourceHash);
  requireValue(f.authority==='CAFEF_STRUCTURED'?candidate&&f.verificationState==='AUTOMATED_VALIDATED':UNIFIED_SOURCE_POLICY.financial.roles.includes(f.authority as never)&&verification,'QUALIFIED_SOURCE_ROLE_REQUIRED');
  const doc=input.statements.find(s=>s.documentId===f.sourceDocumentId);
  const sourceRole=f.authority,documentType=doc?.documentType??'STRUCTURED_FINANCIAL_STATEMENT';
  const received=candidate?.retrievedAt??doc?.importedAt;requireValue(received,'ORIGINAL_RECEIPT_REQUIRED');instant(received);
  let reviewed=verification?.reviewedAt??original.systemKnownAt;instant(reviewed);
  // Identity matches exact dimensions, never amounts. Native scaling is rerun with the existing normalizer.
  const matches=cells.filter(c=>c.ticker===f.ticker&&c.itemId===f.itemId&&c.periodStart===f.period.start&&c.periodEnd===f.period.end&&c.scope===f.scope&&c.raw.sha256===f.sourceHash);
  requireValue(matches.length===1,'UNIQUE_RETAINED_NATIVE_EXTRACTION_REQUIRED');const cell=matches[0];
  const nativePin=q.material.sourceBindings.filter(p=>p.sha256===cell.raw.sha256).sort((a,b)=>a.path.localeCompare(b.path))[0];requireValue(nativePin,'UNBOUND_NATIVE_SOURCE');
  const nativeBytes=sourceBytes(root,nativePin);
  if(cell.locator.mode==='JSON_POINTER')requireValue(pointer(exactJson(nativeBytes.toString()),cell.locator.pointer)===cell.nativeValue,'RAW_FINANCIAL_CELL_MISMATCH');
  else {
   const l=cell.locator;requireValue(nativeBytes.subarray(0,5).toString()==='%PDF-'&&Number.isInteger(l.page)&&l.page>0&&l.box.length===4&&l.box.every(x=>Number.isFinite(x)&&x>=0&&x<=1)&&l.box[0]<l.box[2]&&l.box[1]<l.box[3],'DIRECT_PDF_CELL_GEOMETRY_REQUIRED');
   requireValue(q.material.sourceBindings.some(p=>p.path===l.review.path&&p.sha256===l.review.sha256),'PDF_REVIEW_NOT_BOUND');
   const review=pointer(JSON.parse(sourceBytes(root,l.review).toString()),l.pointer) as Record<string,unknown>;
   instant(review.reviewedAt as string);requireValue((review.reviewedAt as string)<=q.knownAt,'FUTURE_PDF_WITNESS_REVIEW');reviewed=[reviewed,review.reviewedAt as string].sort().at(-1)!;
   requireValue(review.status==='REVIEWED'&&review.sourceHash===f.sourceHash&&review.ticker===f.ticker&&review.itemId===f.itemId&&review.nativeValue===cell.nativeValue&&review.nativeUnit===cell.nativeUnit&&review.normalizedValue===f.value&&review.periodStart===f.period.start&&review.periodEnd===f.period.end&&review.scope===f.scope&&review.page===l.page&&hash(review.box)===hash(l.box),'QUALIFIED_PDF_NATIVE_CELL_REQUIRED');
  }
  requireValue(DECLARED_UNITS[cell.nativeUnit]?.[0]===f.unit,'FINANCIAL_UNIT_DIMENSION_MISMATCH');
  const unit=cell.nativeUnit,normalized=normalizeLexical(cell.nativeValue,{format:cell.format,unit,sign:'IDENTITY',missingTokens:[]});
  requireValue(normalized.state==='AVAILABLE'&&normalized.value===f.value,'NORMALIZATION_REPLAY_MISMATCH');
  const targetUnit=dimensions(f.unit);requireValue(targetUnit,'UNSUPPORTED_EVIDENCE_UNIT');
  const availableAt=[received,reviewed,q.ingestedAt].sort().at(-1)!;
  const e:CurrentValuationEvidence={id:'standing:'+hash({material:hash(q.material),fact:f.id,knownAt:q.knownAt}),version:UNIFIED_SOURCE_POLICY.financial.version,securityId:q.securityId,
   observation:f.itemId,value:normalized.value!,unit:targetUnit,classification:'FACT',source:f.authority,periodStart:f.period.start,periodEnd:f.period.end,
   asOf:q.economicAsOf+'T23:59:59.999Z',publishedAt:f.publishedAt,receivedAt:availableAt,validThrough:q.economicAsOf+'T23:59:59.999Z',critical:true,quality:'VALID',family:'FINANCIAL',
   time:{contract:'current-formal-evidence-time-v1',purpose:'CURRENT_FORMAL_VALUATION',policyVersion:'standing-financial-current-v1',policyHash:hash(UNIFIED_SOURCE_POLICY),authorizationReference:q.material.authorization.path,rawHash:f.sourceHash,qualificationReference:q.input.path+'#/canonical/'+f.id,originalReceivedAt:received,reviewedAt:reviewed,ingestedAt:q.ingestedAt,availableAt}};
  validateEvidence([e],q.securityId,e.asOf,q.knownAt,'CURRENT_FORMAL_VALUATION');
  evidence.push(e);transforms.push({factId:f.id,rawHash:f.sourceHash,retainedRawPath:nativePin.path,nativeValue:cell.nativeValue,nativeUnit:unit,sourcePointer:cell.locator.mode==='JSON_POINTER'?cell.locator.pointer:nativePin.path+'#page='+cell.locator.page,normalizedValue:normalized.value!,originalReceivedAt:received,reviewedAt:reviewed,sourceRole,documentType});
 }catch(err){quarantine.push({id:f.id,reason:String(err)});}}
 if(q.reviewedActions){
  requireValue(q.material.sourceBindings.some(p=>p.path===q.reviewedActions!.path&&p.sha256===q.reviewedActions!.sha256),'ACTION_REVIEW_NOT_BOUND');
  const actions=JSON.parse(sourceBytes(root,q.reviewedActions).toString()) as ReviewedStandingAction[];requireValue(Array.isArray(actions),'ACTION_ARRAY_REQUIRED');
  for(const action of actions){try{
   const normalized=normalizeStandingAction(action,q.ticker,q.economicAsOf,q.knownAt);
   const native=cells.filter(c=>c.ticker===action.ticker&&c.itemId===action.id&&c.raw.sha256===action.sourceHash);
   requireValue(native.length===1,'UNIQUE_ACTION_NATIVE_CELL_REQUIRED');const cell=native[0];
   const actionRaw=q.material.sourceBindings.find(p=>p.sha256===cell.raw.sha256);requireValue(actionRaw,'ACTION_RAW_NOT_BOUND');
   requireValue(cell.nativeValue===action.nativeValue&&cell.nativeUnit===action.nativeUnit&&cell.format===action.format,'ACTION_NATIVE_IDENTITY_MISMATCH');
   const bytes=sourceBytes(root,actionRaw);
   if(cell.locator.mode==='JSON_POINTER'){
    requireValue(cell.locator.pointer===action.sourcePointer&&pointer(exactJson(bytes.toString()),cell.locator.pointer)===cell.nativeValue,'ACTION_RAW_VALUE_MISMATCH');
   }else{
    const l=cell.locator;requireValue(bytes.subarray(0,5).toString()==='%PDF-'&&Number.isInteger(l.page)&&l.page>0&&l.box.length===4&&l.box.every(x=>Number.isFinite(x)&&x>=0&&x<=1)&&l.box[0]<l.box[2]&&l.box[1]<l.box[3],'ACTION_PDF_GEOMETRY');
    requireValue(q.material.sourceBindings.some(p=>p.path===l.review.path&&p.sha256===l.review.sha256),'ACTION_PDF_REVIEW_NOT_BOUND');
    const review=pointer(JSON.parse(sourceBytes(root,l.review).toString()),l.pointer) as Record<string,unknown>;
    instant(review.reviewedAt as string);requireValue((review.reviewedAt as string)<=q.knownAt,'FUTURE_ACTION_PDF_WITNESS_REVIEW');
    requireValue(review.status==='REVIEWED'&&review.sourceHash===action.sourceHash&&review.ticker===action.ticker&&review.itemId===action.id&&review.eventId===action.eventId&&review.kind===action.kind&&review.economicDate===action.economicDate&&review.nativeValue===action.nativeValue&&review.nativeUnit===action.nativeUnit&&review.normalizedValue===normalized.value&&review.page===l.page&&hash(review.box)===hash(l.box)&&action.sourcePointer.endsWith('#page='+l.page),'QUALIFIED_ACTION_PDF_NATIVE_CELL_REQUIRED');
   }
   const availableAt=[action.originalReceivedAt,action.reviewedAt,q.ingestedAt].sort().at(-1)!;
   evidence.push({id:'standing-action:'+hash({material:hash(q.material),action:action.id}),version:UNIFIED_SOURCE_POLICY.financial.version,securityId:q.securityId,observation:action.kind==='CASH_DIVIDEND'?'CASH_DIVIDEND:'+action.eventId:'OUTSTANDING_SHARES',value:normalized.value,unit:normalized.unit,classification:'FACT',source:action.sourceRole,periodStart:action.economicDate,periodEnd:action.economicDate,asOf:q.economicAsOf+'T23:59:59.999Z',publishedAt:null,receivedAt:availableAt,validThrough:q.economicAsOf+'T23:59:59.999Z',critical:true,quality:'VALID',family:'CORPORATE_ACTION',time:{contract:'current-formal-evidence-time-v1',purpose:'CURRENT_FORMAL_VALUATION',policyVersion:'standing-financial-current-v1',policyHash:hash(UNIFIED_SOURCE_POLICY),authorizationReference:q.material.authorization.path,rawHash:action.sourceHash,qualificationReference:q.reviewedActions.path+'#'+action.id,originalReceivedAt:action.originalReceivedAt,reviewedAt:action.reviewedAt,ingestedAt:q.ingestedAt,availableAt}});
  }catch(error){quarantine.push({id:action.id,reason:String(error)});}}
 }
 for(const id of hybrid.unresolvedIssuerConflicts)quarantine.push({id,reason:'UNRESOLVED_ISSUER_CONFLICT'});
 const conflicts=validateEvidence(evidence,q.securityId,q.economicAsOf+'T23:59:59.999Z',q.knownAt,'CURRENT_FORMAL_VALUATION');
 const conflictSet=new Set(conflicts);for(const id of conflicts)quarantine.push({id,reason:'CONFLICTING_FINANCIAL_FACT'});
 const accepted=evidence.filter(e=>!conflictSet.has(e.id));
 return {contract:'unified-current-financial-plan-v1' as const,request:q,inputOriginalHash:q.input.sha256,hybrid,evidence:accepted,transforms,quarantine,materialHash:hash(q.material),readyForScoring:false as const,historicalPitGranted:false as const};
}
export type FinancialIngestPlan=ReturnType<typeof planFinancialIngest>;
export function qualifyFinancialPlan(root:string,q:FinancialIngestRequest,trust:SourceAdmissionTrust){
 assertSourceMaterial(root,q.material,trust,q.knownAt);const first=planFinancialIngest(root,q),second=planFinancialIngest(root,q);
 requireValue(hash(first)===hash(second),'FINANCIAL_REPLAY_MISMATCH');if(trust.verifyStandingMaterial){const verified=trust.verifyFinancialPlan!(first);if(verified)return {...first,standingVerification:verified};}return first;
}
