import type {PrismaClient} from '@/infrastructure/db/generated/client';
import {sourceBytes,sha,type SourcePin} from './registry';
import {RetainedFinancialAdmissionAdapter,type RetainedAdmissionRequest} from './retained-mapping';
import {verifyRetainedAdapterAuthority} from './retained-authority-gate';
import {snapshotHash as hash} from '@/infrastructure/fundamentals/snapshot-hash';
import {canonicalJson} from '@/domain/fundamentals/snapshot';
import {UNIFIED_SOURCE_POLICY} from '@/domain/fundamentals/standing-source-policy';
import {validateEvidence,type CurrentValuationEvidence} from '@/domain/scoring/evidence';
import {instant,dateOnly} from '@/shared/time';
import {admissionEvent,assertNotRevoked} from '@/infrastructure/repositories/unified-admission';

export const CURRENT_FINANCIAL_CODE=[
 'src/infrastructure/source-admission/current-financial.ts',
 'src/infrastructure/source-admission/current-dataset.ts',
 'src/infrastructure/source-admission/retained-mapping.ts',
 'src/infrastructure/source-admission/retained-authority-gate.ts',
 'prisma/proposals/current-financial-dataset-v1.sql',
 'src/domain/fundamentals/normalization.ts','src/domain/scoring/evidence.ts',
 'src/infrastructure/source-admission/registry.ts','src/infrastructure/fundamentals/snapshot-hash.ts',
 'src/domain/fundamentals/snapshot.ts','src/domain/fundamentals/standing-source-policy.ts',
 'src/domain/fundamentals/source-authority.ts','src/infrastructure/repositories/unified-admission.ts',
 'src/domain/portfolio/values.ts','src/shared/time.ts',
] as const;
interface Ref extends SourcePin {pointer:string}
export interface DocumentBinding {
 raw:SourcePin;ticker:string;scope:string;reportEnd:string;
 receipt:Ref;review:Ref;title:Ref;
}
export interface CurrentFinancialComposition {
 /** Trusted host configuration; these references never come from an observation request. */
 registry():SourcePin;mapping:SourcePin;documents:SourcePin;identities:SourcePin;clock?:{now():string};
}
function must(v:unknown,reason:string):asserts v{if(!v)throw Error(reason);}
export function exactPointer(value:unknown,path:string):unknown{
 if(!path.startsWith('/'))throw Error('EXACT_POINTER_REQUIRED');
 return path.slice(1).split('/').reduce<unknown>((v,k)=>{
  const key=k.replace(/~1/g,'/').replace(/~0/g,'~');
  if(v===null||typeof v!=='object'||!Object.hasOwn(v,key))throw Error('SOURCE_POINTER_MISSING');
  return (v as Record<string,unknown>)[key];
 },value);
}
/** Conservative millisecond ceiling for retained UTC receipts; original precision is retained. */
export function currentReceiptTime(value:string){
 if(!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,9})?(?:Z|\+00:00)$/.test(value)||!Number.isFinite(Date.parse(value)))throw Error('INVALID_ORIGINAL_SOURCE_TIME');
 dateOnly(value.slice(0,10));
 if(Number(value.slice(11,13))>23||Number(value.slice(14,16))>59||Number(value.slice(17,19))>59)throw Error('INVALID_ORIGINAL_SOURCE_TIME');
 const tail=/\.(\d+)/.exec(value)?.[1]?.slice(3)??'';
 const normalized=new Date(Date.parse(value)+(tail.split('').some(c=>c!=='0')?1:0)).toISOString();instant(normalized);return normalized;
}
export type QualifiedCurrentFact={id:string;mappingIds:string[];ticker:string;scope:string;itemId:string;
 period:{start:string;end:string};vintage:string;value:string;unit:'CURRENCY';currency:'VND';
 raw:SourcePin;receipt:Ref;review:Ref;title:Ref;evidence:CurrentValuationEvidence;
 retainedProvenance:unknown;sourceClocks:{receivedAt:string;reviewedAt:string;normalization:'CEILING_MILLISECONDS_PRESERVE_ORIGINAL'}};
type DbRow={body:string;body_hash:string};
export function checkedBody<T>(row:DbRow|undefined):T{
 if(!row||sha(row.body)!==row.body_hash)throw Error('CURRENT_STORED_BODY_INTEGRITY');
 return JSON.parse(row.body) as T;
}
/** Qualified native facts, no implicit assumption adoption and no VNM17 proposal promotion. */
export class CurrentFinancialAdmissions {
 private readonly adapter:RetainedFinancialAdmissionAdapter;
 constructor(private readonly db:PrismaClient,private readonly root:string,private readonly composition:CurrentFinancialComposition){
  this.adapter=new RetainedFinancialAdmissionAdapter(root,composition.mapping);
 }
 private authority(knownAt:string){
  const pin=this.composition.registry(),a=verifyRetainedAdapterAuthority(this.root,pin,knownAt);
  const r=JSON.parse(sourceBytes(this.root,pin).toString());
  const entry=r.authorities.find((v:{domain:string})=>v.domain==='F2');
  must(entry.provider==='APPROVED_FINANCIAL_ROLES','CURRENT_FINANCIAL_PROVIDER_SCOPE');
  must(Array.isArray(entry.sourceRoles)&&entry.sourceRoles.includes('REVIEWED_PDF'),'CURRENT_REVIEWED_SOURCE_ROLE_NOT_AUTHORIZED');
  must(Array.isArray(entry.origins)&&entry.origins.length>0,'CURRENT_PROVIDER_ORIGINS_REQUIRED');
  for(const path of CURRENT_FINANCIAL_CODE){
   if(!entry.code.some((p:SourcePin)=>p.path===path))throw Error('CURRENT_ADAPTER_CODE_NOT_BOUND:'+path);
  }
  // Mapping and metadata catalogs are version-bound data, not observation-supplied approval flags.
  for(const pin of [this.composition.mapping,this.composition.documents,this.composition.identities]){
   if(!entry.retainedCatalogs?.some((p:SourcePin)=>p.path===pin.path&&p.sha256===pin.sha256))throw Error('CURRENT_CATALOG_NOT_BOUND');
   sourceBytes(this.root,pin);
  }
  const auth=JSON.parse(sourceBytes(this.root,r.legacyAuthorizations.F2).toString());
  if(!auth.currentFinancialPrincipleAuthorized||auth.standingPolicyVersion!==UNIFIED_SOURCE_POLICY.version||auth.productionActivationGranted!==false)throw Error('CURRENT_SOURCE_POLICY_AUTHORIZATION_REQUIRED');
  must(currentReceiptTime(auth.recordedAt)<=knownAt,'SOURCE_AUTHORIZATION_NOT_YET_KNOWN');
  const ownerText=sourceBytes(this.root,auth.source).toString();
  must(ownerText.includes('Standing Financial Source Approval and Automated Financial Evidence Admission for Current Valuation.'),'EXPLICIT_SOURCE_POLICY_OWNER_DECISION_REQUIRED');
  const versionPin=entry.versionImplementationAuthorization as SourcePin|undefined;
  must(versionPin,'EXPLICIT_VERSION_IMPLEMENTATION_AUTHORIZATION_REQUIRED');
  const version=JSON.parse(sourceBytes(this.root,versionPin).toString());
  must(version.schemaVersion==='owner-authorized-adapter-version-implementation-v1'&&version.versionImplementationAuthorized===true&&version.scope==='CURRENT_FINANCIAL_ADMISSION_AND_PRE_SCORING_DATASET'&&version.productionActivationGranted===false&&version.scoringApprovalGranted===false&&version.DIApprovalGranted===false,'VERSION_IMPLEMENTATION_SCOPE');
  instant(version.recordedAt);must(version.recordedAt<=knownAt,'VERSION_AUTHORIZATION_NOT_YET_KNOWN');
  must(sourceBytes(this.root,version.source).toString().includes('Hoàn thiện phiên bản adapter/schema/code binding theo Standing Authority hiện có.'),'EXPLICIT_VERSION_BINDING_INSTRUCTION_REQUIRED');
  return {...a,authorization:r.legacyAuthorizations.F2 as SourcePin,versionImplementationAuthorization:versionPin,origins:entry.origins as string[],sourceRoles:entry.sourceRoles as string[]};
 }
 plan(q:RetainedAdmissionRequest,securityId:string,requestedKnownAt=q.knownAt){
  const authority=this.authority(q.knownAt);
  const identities=JSON.parse(sourceBytes(this.root,this.composition.identities).toString());
  const matches=identities.effectiveMembers?.filter((m:{ticker:string;securityId:string})=>m.ticker===q.ticker&&m.securityId===securityId);
  must(matches?.length===1&&identities.effectiveMembers.filter((m:{ticker:string})=>m.ticker===q.ticker).length===1,'CURRENT_SECURITY_IDENTITY_MISMATCH');
  const mapped=this.adapter.plan(q);
  const catalog=JSON.parse(sourceBytes(this.root,this.composition.documents).toString()) as {contract:string;documents:DocumentBinding[]};
  must(catalog.contract==='retained-current-document-bindings-v1','CURRENT_DOCUMENT_CATALOG_SCHEMA');
  const quarantine=[...mapped.quarantine],facts:QualifiedCurrentFact[]=[];
  const read=(r:Ref)=>exactPointer(JSON.parse(sourceBytes(this.root,r).toString()),r.pointer);
  for(const f of mapped.accepted){try{
   must(f.classification==='REPORTED','DERIVED_REQUIRES_EXPLICIT_FORMULA');
   const rawHash=f.provenance.rawHash;
   const docs=catalog.documents.filter(d=>d.raw.sha256===rawHash&&d.ticker===f.ticker&&d.scope===f.scope);
   must(docs.length===1,'UNIQUE_DOCUMENT_METADATA_REQUIRED');const d=docs[0];
   must(f.period.end<=d.reportEnd,'DOCUMENT_PERIOD_MISMATCH');
   const receipt=read(d.receipt) as Record<string,unknown>,reviewed=read(d.review),title=read(d.title);
   const receiptClock=receipt.retrievedAt??receipt.receivedAt;
   must(typeof receiptClock==='string'&&typeof reviewed==='string','ORIGINAL_RECEIPT_AND_REVIEW_REQUIRED');
   const originalReceivedAt=currentReceiptTime(receiptClock),reviewedAt=currentReceiptTime(reviewed);
   must(receipt.sha256===d.raw.sha256&&(receipt.ticker===f.ticker||receipt.symbol===f.ticker),'RECEIPT_DOCUMENT_IDENTITY');
   must(receipt.httpStatus===200||receipt.status==='RETAINED','SUCCESSFUL_SOURCE_RECEIPT_REQUIRED');
   const sourceUrl=String(receipt.sourceUrl??receipt.url),u=new URL(sourceUrl);
   must(u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&['finance.vietstock.vn','static2.vietstock.vn'].includes(u.hostname),'FINANCIAL_SOURCE_ORIGIN');
   must(authority.origins.includes(u.origin),'SOURCE_OUTSIDE_ACTIVE_AUTHORITY_ORIGINS');
   if(receipt.finalUrl)must(new URL(String(receipt.finalUrl)).origin===u.origin,'UNVERIFIED_SOURCE_REDIRECT');
   must(typeof title==='string'&&/soát\s*xét/i.test(title),'QUALIFIED_DOCUMENT_ROLE_NOT_SUPPORTED');
   const sourceRole='REVIEWED_PDF';
   must(sourceBytes(this.root,d.raw).subarray(0,5).toString()==='%PDF-','RAW_PDF_REQUIRED');
   // The native cell was rechecked against the pinned reviewed mapping before adding metadata.
   const availableAt=[originalReceivedAt,reviewedAt,q.knownAt].sort().at(-1)!;
   const identity={ticker:f.ticker,itemId:f.itemId,scope:f.scope,period:f.period,vintage:f.vintage,rawHash:d.raw.sha256};
   const id='current-fact:'+hash(identity);
   const evidence:CurrentValuationEvidence={id,version:'standing-financial-current-v1',securityId,observation:f.itemId,
    value:f.value,unit:'VND',classification:'FACT',source:sourceRole,periodStart:f.period.start,periodEnd:f.period.end,
    asOf:q.economicCutoff+'T23:59:59.999Z',publishedAt:null,receivedAt:availableAt,validThrough:q.economicCutoff+'T23:59:59.999Z',critical:true,quality:'VALID',family:'FINANCIAL',
    time:{contract:'current-formal-evidence-time-v1',purpose:'CURRENT_FORMAL_VALUATION',policyVersion:'standing-financial-current-v1',policyHash:hash(UNIFIED_SOURCE_POLICY),authorizationReference:authority.authorization.path,rawHash:d.raw.sha256,qualificationReference:f.provenance.retainedCell.path+'#'+f.provenance.retainedCell.pointer,originalReceivedAt,reviewedAt,ingestedAt:q.knownAt,availableAt}};
   validateEvidence([evidence],securityId,evidence.asOf,q.knownAt,'CURRENT_FORMAL_VALUATION');
   const previous=facts.find(x=>x.id===id);
   if(previous){must(previous.value===f.value,'CONFLICTING_FINANCIAL_FACT');previous.mappingIds.push(f.mappingId);}
   else facts.push({id,mappingIds:[f.mappingId],...identity,unit:'CURRENCY',currency:'VND',value:f.value,raw:d.raw,receipt:d.receipt,review:d.review,title:d.title,evidence,retainedProvenance:f.provenance,sourceClocks:{receivedAt:receiptClock,reviewedAt:reviewed,normalization:'CEILING_MILLISECONDS_PRESERVE_ORIGINAL'}});
  }catch(e){quarantine.push({id:f.mappingId,reason:e instanceof Error?e.message:String(e)});}}
  // Cross-vintage revisions remain explicit. Consumers select a specific vintage; they cannot mix both.
  const groupKey=(f:QualifiedCurrentFact)=>hash({ticker:f.ticker,itemId:f.itemId,scope:f.scope,period:f.period,vintage:f.vintage});
  const conflicting=new Set(facts.filter(f=>facts.some(g=>groupKey(f)===groupKey(g)&&f.value!==g.value)).map(f=>f.id));
  for(const id of conflicting)quarantine.push({id,reason:'CONFLICTING_FINANCIAL_FACT'});
  const proofs=new Map<string,SourcePin>();
  const bind=(p:SourcePin)=>{proofs.set(p.sha256,{path:p.path,sha256:p.sha256});};
  [this.composition.mapping,this.composition.documents,this.composition.identities].forEach(bind);
  for(const f of facts){[f.raw,f.receipt,f.review,f.title].forEach(bind);
   const provenance=f.retainedProvenance as {retainedCell:SourcePin;source?:{path?:string;sha256?:string}};bind(provenance.retainedCell);
   if(provenance.source?.path&&provenance.source.sha256)bind({path:provenance.source.path,sha256:provenance.source.sha256});
  }
  return {contract:'governed-current-financial-admission-v1' as const,request:q,requestedKnownAt,securityId,authority,
   mapping:this.composition.mapping,documents:this.composition.documents,proofs:[...proofs.values()].sort((a,b)=>a.path.localeCompare(b.path)),facts:facts.filter(f=>!conflicting.has(f.id)).map(f=>({...f,mappingIds:f.mappingIds.sort()})).sort((a,b)=>a.id.localeCompare(b.id)),quarantine:quarantine.sort((a,b)=>a.id.localeCompare(b.id)),
   readyForScoring:false as const,historicalPitGranted:false as const};
 }
 async ingest(q:RetainedAdmissionRequest,securityId:string){
  const now=this.composition.clock?.now()??new Date().toISOString();instant(now);
  try{
   instant(q.knownAt);must(q.knownAt<=now,'FUTURE_OPERATIONAL_KNOWLEDGE');
   const plan=this.plan({...q,knownAt:now},securityId,q.knownAt);
   must(plan.facts.length>0,'NO_QUALIFIED_CURRENT_FINANCIAL_FACTS');
   const id='current-admission:'+hash({securityId,ticker:q.ticker,cutoff:q.economicCutoff,authority:plan.authority,mapping:plan.mapping,documents:plan.documents,facts:plan.facts.map(f=>({id:f.id,value:f.value}))});
   return await this.db.$transaction(async tx=>{
    await assertNotRevoked(tx,id);
    const existing=await tx.$queryRawUnsafe<DbRow[]>('SELECT body,body_hash FROM current_financial_admission WHERE id=?',id);
    if(existing.length){const old=checkedBody<CurrentAdmissionRecord>(existing[0]);must(old.id===id,'CURRENT_ADMISSION_ID_MISMATCH');return {id,duplicate:true,plan:old.plan};}
    const oldRows=await tx.$queryRawUnsafe<DbRow[]>('SELECT f.body,f.body_hash FROM current_financial_fact f JOIN current_financial_admission a ON a.id=f.admission_id WHERE a.ticker=?',q.ticker);
    for(const row of oldRows){const old=checkedBody<QualifiedCurrentFact>(row);if(plan.facts.some(f=>groupKeyForStored(f)===groupKeyForStored(old)&&f.value!==old.value))throw Error('CONFLICT_WITH_ADMITTED_CURRENT_FACT');}
    const record={id,plan};const body=canonicalJson(record);
    await tx.$executeRawUnsafe('INSERT INTO current_financial_admission VALUES(?,?,?,?,?,?,?)',id,q.ticker,securityId,q.economicCutoff,plan.request.knownAt,body,sha(body));
    for(const pin of plan.proofs){const bytes=sourceBytes(this.root,pin);await tx.$executeRawUnsafe('INSERT OR IGNORE INTO current_financial_raw VALUES(?,?,?)',pin.sha256,pin.path,bytes);}
    for(const f of plan.facts){
     const factBody=canonicalJson(f);
     // A fact identity includes its source hash; same source/dimensions cannot acquire another value.
     const duplicate=await tx.$queryRawUnsafe<DbRow[]>('SELECT body,body_hash FROM current_financial_fact WHERE id=?',f.id);
     if(duplicate.length){must(checkedBody<QualifiedCurrentFact>(duplicate[0]).value===f.value,'CURRENT_FACT_ID_REUSE');continue;}
     await tx.$executeRawUnsafe('INSERT INTO current_financial_fact VALUES(?,?,?,?,?)',f.id,id,f.raw.sha256,factBody,sha(factBody));
    }
    return {id,duplicate:false,plan};
   });
  }catch(e){await admissionEvent(this.db,'QUARANTINE','current-request:'+hash({q,securityId}),now,{reason:String(e)});throw e;}
 }
 async consume(id:string,context:{ticker:string;securityId:string;economicCutoff:string;knownAt:string;purpose:string}){
  must(context.purpose==='CURRENT_FORMAL_VALUATION','CURRENT_ONLY_NOT_PIT');instant(context.knownAt);
  must(context.knownAt<=(this.composition.clock?.now()??new Date().toISOString()),'FUTURE_OPERATIONAL_KNOWLEDGE');
  await assertNotRevoked(this.db,id);
  const rows=await this.db.$queryRawUnsafe<DbRow[]>('SELECT body,body_hash FROM current_financial_admission WHERE id=?',id);
  const stored=checkedBody<CurrentAdmissionRecord>(rows[0]),p=stored.plan,q=p.request;
  must(stored.id===id&&q.ticker===context.ticker&&p.securityId===context.securityId&&q.economicCutoff===context.economicCutoff&&q.knownAt<=context.knownAt,'CURRENT_FINANCIAL_CONSUMPTION_SCOPE');
  must(hash(this.authority(context.knownAt))===hash(p.authority),'CURRENT_AUTHORITY_SUPERSEDED');
  must(hash(this.plan(q,p.securityId,p.requestedKnownAt))===hash(p),'CURRENT_FINANCIAL_REPLAY_MISMATCH');
  for(const pin of p.proofs){
   const raw=await this.db.$queryRawUnsafe<{payload:Uint8Array}[]>('SELECT payload FROM current_financial_raw WHERE hash=?',pin.sha256);
   must(raw.length===1&&sha(raw[0].payload)===pin.sha256,'STORED_CURRENT_RAW_HASH_MISMATCH');
  }
  for(const f of p.facts){
   await assertNotRevoked(this.db,f.id);
   const row=await this.db.$queryRawUnsafe<DbRow[]>('SELECT body,body_hash FROM current_financial_fact WHERE id=?',f.id);
   const fact=checkedBody<QualifiedCurrentFact>(row[0]);must(fact.id===f.id&&fact.value===f.value&&fact.raw.sha256===f.raw.sha256,'STORED_CURRENT_FACT_MISMATCH');
  }
  return {id,plan:p,facts:p.facts,evidence:p.facts.map(f=>f.evidence),readyForScoring:false as const,historicalPitGranted:false as const};
 }
 async revoke(id:string,reason:string,knownAt:string){must(reason.trim(),'REVOCATION_REASON_REQUIRED');instant(knownAt);return admissionEvent(this.db,'REVOCATION',id,knownAt,{reason});}
}
function groupKeyForStored(f:QualifiedCurrentFact){return hash({ticker:f.ticker,itemId:f.itemId,scope:f.scope,period:f.period,vintage:f.vintage});}
export type CurrentFinancialPlan=ReturnType<CurrentFinancialAdmissions['plan']>;
type CurrentAdmissionRecord={id:string;plan:CurrentFinancialPlan};
