import {sourceBytes,sha,type SourcePin,type SourceMaterial,type SourceAdmissionTrust,type StandingFinancialVerification} from './registry';
import {snapshotHash as hash} from '@/infrastructure/fundamentals/snapshot-hash';
import {normalizeLexical} from '@/domain/fundamentals/normalization';
import {UNIFIED_SOURCE_POLICY} from '@/domain/fundamentals/standing-source-policy';
import {instant,dateOnly} from '@/shared/time';
import type {FinancialIngestPlan,RetainedFinancialCell} from './financial';
import type {Candidate,StandingTrust} from '@/infrastructure/market-boundary/cafef-standing';
export type SourceTrust='APPROVED_STANDING_SOURCE'|'VERIFIED_NEW_SOURCE_PENDING_AUTHORITY'|'UNVERIFIED_SOURCE'|'REJECTED_SOURCE';
export interface VersionAuthority {id:string;version:string;domain:'F1'|'F2';status:'APPROVED'|'REVOKED';provider:string;schemaVersion:string;adapterVersion:string;normalizerVersion:string;policyVersion:string;origins:readonly string[];sourceRoles:readonly string[];code:readonly SourcePin[]}
export interface VersionRegistry {contract:'standing-source-authority-per-version-v1';version:string;recordedAt:string;ownerDecision:SourcePin;legacyAuthorizations:{F1:SourcePin;F2:SourcePin};authorities:readonly VersionAuthority[]}
export interface VersionAuthorityBindings {
 /** Trusted composition supplies this pointer, never URL/file request parameters. */
 registry():SourcePin|null;
 /** Trusted collector/extractor inventories are data, not per-material approval receipts. */
 catalogs:{cafef:readonly SourcePin[];pdfReceipts:readonly SourcePin[];apiReceipts:readonly SourcePin[];pdfExtractions:readonly SourcePin[];financialSemantics:readonly SourcePin[]};
 marketReferences:{membership:SourcePin;identities:SourcePin;unitSource:SourcePin;unitReceipt:SourcePin;calendarSources:readonly SourcePin[]};
}
function must(v:unknown,reason:string):asserts v{if(!v)throw Error(reason);}
const same=(a:unknown,b:unknown)=>hash(a)===hash(b);
const canonical=(s:string)=>s.normalize('NFC').replace(/\s+/g,' ').trim();
function utc(s:string){must(typeof s==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,9})?(?:Z|\+00:00)$/.test(s),'INVALID_SOURCE_RECEIPT');dateOnly(s.slice(0,10));must(Number(s.slice(11,13))<24&&Number(s.slice(14,16))<60&&Number(s.slice(17,19))<60,'INVALID_SOURCE_RECEIPT');const n=Date.parse(s);must(Number.isFinite(n),'INVALID_SOURCE_RECEIPT');const frac=/\.(\d+)/.exec(s)?.[1]??'';return new Date(n+(frac.slice(3).split('').some(c=>c!=='0')?1:0)).toISOString();}
function pointer(value:unknown,path:string):unknown {must(path.startsWith('/'),'EXACT_POINTER_REQUIRED');return path.slice(1).split('/').reduce<unknown>((v,k)=>{const key=k.replace(/~1/g,'/').replace(/~0/g,'~');must(v!==null&&typeof v==='object'&&Object.hasOwn(v,key),'SOURCE_POINTER_MISSING');return (v as Record<string,unknown>)[key];},value);}
/** Owner amendment replaces the material-receipt gate, not source-content verification. */
export class VersionStandingAuthority implements SourceAdmissionTrust {
 private readonly catalogs:VersionAuthorityBindings['catalogs'];private readonly references:VersionAuthorityBindings['marketReferences'];
 constructor(private readonly root:string,private readonly registryPointer:VersionAuthorityBindings['registry'],bindings:Omit<VersionAuthorityBindings,'registry'>){this.catalogs=structuredClone(bindings.catalogs);this.references=structuredClone(bindings.marketReferences);}
 private json(pin:SourcePin):unknown{return JSON.parse(sourceBytes(this.root,pin).toString());}
 private registry(){const pin=this.registryPointer();must(pin,'STANDING_AUTHORITY_UNAVAILABLE');const r=this.json(pin) as VersionRegistry;instant(r.recordedAt);must(r.contract==='standing-source-authority-per-version-v1','UNKNOWN_AUTHORITY_REGISTRY');const decision=sourceBytes(this.root,r.ownerDecision).toString();must(decision.includes('Owner Decision — APPROVED')&&decision.includes('Replace per-material independent acceptance with:')&&decision.includes('explicit owner-approved amendment to the U1 governance model'),'OWNER_AUTHORITY_AMENDMENT_REQUIRED');return r;}
 private authority(domain:'F1'|'F2',knownAt?:string){const r=this.registry(),matches=r.authorities.filter(a=>a.domain===domain);must(matches.length===1,'UNKNOWN_OR_AMBIGUOUS_AUTHORITY');const a=matches[0];must(a.status==='APPROVED','STANDING_AUTHORITY_REVOKED');if(knownAt){instant(knownAt);must(r.recordedAt<=knownAt,'AUTHORITY_NOT_YET_KNOWN');}
  const expected=domain==='F1'?{schema:'cafef-price-history-v1',adapter:'cafef-retained-collection-adapter-v1',normalizer:'cafef-raw-close-only-v1',policy:UNIFIED_SOURCE_POLICY.market.policyVersion}:{schema:'unified-current-financial-plan-v1',adapter:'retained-qualified-extraction-v1',normalizer:'financial-normalize-lexical-v1',policy:UNIFIED_SOURCE_POLICY.financial.version};
  must(a.schemaVersion===expected.schema&&a.adapterVersion===expected.adapter&&a.normalizerVersion===expected.normalizer&&a.policyVersion===expected.policy,'STANDING_VERSION_REQUALIFICATION_REQUIRED');
  const permitted=domain==='F1'?['https://cafef.vn']:['https://finance.vietstock.vn','https://static2.vietstock.vn','https://apiweb.cafef.vn'];must(a.origins.every(o=>permitted.includes(o)),'NEW_SOURCE_AUTHORITY_REQUIRES_AMENDMENT');
  must(a.origins.length>0&&a.origins.every(o=>{const u=new URL(o);return u.protocol==='https:'&&u.origin===o&&!u.username&&!u.password;}),'INVALID_AUTHORITY_ORIGINS');
  const roles=domain==='F1'?['RAW_CLOSE']:[...UNIFIED_SOURCE_POLICY.financial.roles,'CAFEF_STRUCTURED'];must(same(a.sourceRoles,roles),'SOURCE_ROLE_SCOPE_CHANGED');
  for(const p of a.code)sourceBytes(this.root,p);return a;
 }
 activeAuthorization(){return {...this.registry().legacyAuthorizations.F2};}
 independentAcceptance(_hash:string){return null;}
 verifyStandingMaterial(m:SourceMaterial,knownAt:string){const a=this.authority('F2',knownAt);must(same(m.standingAuthority?.registry,this.registryPointer()),'UNAPPROVED_REGISTRY_REFERENCE');must(m.standingAuthority?.id===a.id&&m.standingAuthority.version===a.version,'UNAPPROVED_FINANCIAL_AUTHORITY_VERSION');must(same(m.code,a.code),'FINANCIAL_ADAPTER_CODE_CHANGED');must(same(m.authorization,this.registry().legacyAuthorizations.F2),'FINANCIAL_SOURCE_AUTHORIZATION_CHANGED');must(same(m.identities,this.references.identities),'FINANCIAL_SECURITY_REFERENCE_UNTRUSTED');return {id:a.id,version:a.version};}
 private receiptRows(){const rows:Record<string,unknown>[]=[];for(const p of [...this.catalogs.pdfReceipts,...this.catalogs.apiReceipts]){const v=this.json(p) as {requests?:Record<string,unknown>[]}|Record<string,unknown>[];const list=Array.isArray(v)?v:v.requests??[];rows.push(...list.map((r,i)=>({...r,sourceReceiptCatalog:p,sourceReceiptPointer:(Array.isArray(v)?'':'/requests')+'/'+i})));}return rows;}

 classifyEvidence(input:{bytes:Uint8Array;url?:string;claimedHash?:string;domain:'F1'|'F2';knownAt:string}):{classification:SourceTrust;reason:string;url?:string;receipt?:Record<string,unknown>}{
  const actual=sha(input.bytes);if(input.claimedHash&&input.claimedHash!==actual)return {classification:'REJECTED_SOURCE',reason:'RAW_HASH_CHANGED'};
  let u:URL|undefined;try{if(input.url){u=new URL(input.url);if(u.protocol!=='https:'||u.username||u.password||u.port||u.hostname.endsWith('.')||/%(?:2f|5c)/i.test(u.pathname))return {classification:'REJECTED_SOURCE',reason:'UNTRUSTED_URL_SHAPE'};}}catch{return {classification:'REJECTED_SOURCE',reason:'INVALID_SOURCE_URL'};}
  const a=this.authority(input.domain,input.knownAt),origins=a.origins;
  if(u&&origins.some(o=>u!.hostname!==new URL(o).hostname&&u!.hostname.includes(new URL(o).hostname)))return {classification:'REJECTED_SOURCE',reason:'SOURCE_DOMAIN_SPOOF'};
  if(input.domain==='F1'){
   const captures=this.catalogs.cafef.filter(p=>p.sha256===actual);if(!captures.length)return {classification:'UNVERIFIED_SOURCE',reason:'NO_TRUSTED_CAFEF_CAPTURE'};
   try{const c=JSON.parse(Buffer.from(input.bytes).toString()) as {provider:string;schemaVersion:number;requests:{url:string;httpStatus:number;receivedAt:string;sha256:string;rawResponse:string}[]};
    if(c.provider!=='CAFEF'||c.schemaVersion!==1)return {classification:'REJECTED_SOURCE',reason:'CAFEF_SCHEMA_OR_PROVIDER_SPOOF'};
    const q=c.requests.find(r=>(!input.url||r.url===input.url)&&r.httpStatus===200&&sha(r.rawResponse)===r.sha256&&utc(r.receivedAt)<=input.knownAt);
    if(!q)return {classification:'REJECTED_SOURCE',reason:'CAFEF_REQUEST_INTEGRITY'};const url=new URL(q.url);if(!origins.includes(url.origin)||url.pathname!=='/du-lieu/Ajax/PageNew/DataHistory/PriceHistory.ashx'||url.username||url.password)return {classification:'REJECTED_SOURCE',reason:'CAFEF_API_IDENTITY'};
    return {classification:'APPROVED_STANDING_SOURCE',reason:'EXACT_RETAINED_CAFEF_CAPTURE_AND_API_VERSION',url:q.url};
   }catch{return {classification:'REJECTED_SOURCE',reason:'CAFEF_CAPTURE_INVALID'};}
  }
  const matching=this.receiptRows().filter(r=>(r.sha256??r.payloadHash)===actual&&r.httpStatus===200&&(!input.url||r.url===input.url));
  if(!matching.length)return {classification:'UNVERIFIED_SOURCE',reason:'NO_TRUSTED_CAPTURE_RECEIPT'};
  for(const r of matching){try{const uri=new URL(String(r.url));if(uri.protocol!=='https:'||uri.username||uri.password||uri.port)continue;const redirects=r.redirects as string[]|undefined;if(redirects&&(!Array.isArray(redirects)||redirects.some(url=>!origins.includes(new URL(url).origin))))continue;if(utc(String(r.retrievedAt))>input.knownAt)continue;
   if(!origins.includes(uri.origin))return {classification:'VERIFIED_NEW_SOURCE_PENDING_AUTHORITY',reason:'VERIFIED_CAPTURE_OUTSIDE_AUTHORIZED_ORIGIN',url:uri.href,receipt:r};
   return {classification:'APPROVED_STANDING_SOURCE',reason:'EXACT_CAPTURE_HASH_URL_RECEIPT_AND_STANDING_VERSION',url:uri.href,receipt:r};
  }catch{continue;}}
  return {classification:'REJECTED_SOURCE',reason:'CAPTURE_RECEIPT_OR_REDIRECT_INVALID'};
 }
 marketTrust():StandingTrust{return {standingAuthority:()=>{const a=this.authority('F1');return {id:a.id,version:a.version,registry:{...this.registryPointer()!}};},currentAuthorization:()=>({...this.registry().legacyAuthorizations.F1}),independentMaterialAcceptance:()=>null,capturedSource:()=>null,verifyStandingCandidate:c=>{
  const a=this.authority('F1',c.spec.knownAt);must(a.provider==='CAFEF'&&same(c.profile.code,a.code),'MARKET_ADAPTER_CODE_CHANGED');
  must(same(c.profile.membership.path,this.references.membership.path)&&c.profile.membership.sha256===this.references.membership.sha256&&same(c.profile.membership.identitySource,this.references.identities)&&same(c.profile.unitSource,this.references.unitSource)&&same(c.profile.unitReceipt,this.references.unitReceipt)&&same(c.profile.calendarSources,this.references.calendarSources),'UNTRUSTED_MARKET_REFERENCE');
  for(const pin of [this.references.membership,this.references.identities,this.references.unitSource,this.references.unitReceipt,...this.references.calendarSources])sourceBytes(this.root,pin);
  must(this.catalogs.cafef.some(p=>p.sha256===c.spec.raw.sha256&&sha(c.rawText)===c.spec.raw.sha256),'UNVERIFIED_CAFEF_CAPTURE');
  const sourceTrust=this.classifyEvidence({bytes:Buffer.from(c.rawText),claimedHash:c.spec.raw.sha256,url:c.provenance.sourceUrl,domain:'F1',knownAt:c.spec.knownAt});must(sourceTrust.classification==='APPROVED_STANDING_SOURCE','MARKET_SOURCE_TRUST:'+sourceTrust.classification);
  const url=new URL(c.provenance.sourceUrl);must(a.origins.includes(url.origin)&&url.pathname==='/du-lieu/Ajax/PageNew/DataHistory/PriceHistory.ashx'&&!url.username&&!url.password,'MARKET_SOURCE_SPOOF');
  must(c.provenance.provider==='CAFEF_PRICE_HISTORY'&&c.provenance.sourceSchemaVersion===a.schemaVersion&&c.provenance.adapterVersion===a.adapterVersion&&c.provenance.normalizerVersion===a.normalizerVersion,'MARKET_OBSERVATION_VERSION_MISMATCH');
 }};}
 verifyFinancialPlan(plan:FinancialIngestPlan):StandingFinancialVerification{const q=plan.request,a=this.authority('F2',q.knownAt);this.verifyStandingMaterial(q.material,q.knownAt);must(!plan.quarantine.length&&plan.evidence.length>0,'UNQUALIFIED_FINANCIAL_OBSERVATIONS');
  // VNM17 actions remain outside this financial-statement adapter; no pending proposal is promoted.
  must(!q.reviewedActions&&plan.evidence.every(e=>e.family==='FINANCIAL'),'ACTION_ADAPTER_NOT_QUALIFIED_UNDER_THIS_VERSION');
  const cells=this.json(q.extractions) as RetainedFinancialCell[],input=this.json(q.input) as {statements:Record<string,unknown>[];verifications:Record<string,unknown>[]};
  const semanticInputs=this.catalogs.financialSemantics.map(p=>this.json(p) as {verifications:Record<string,unknown>[];statements:Record<string,unknown>[]});
  const displays=this.catalogs.pdfExtractions.map(p=>{const d=this.json(p) as Record<string,unknown>;must(d.schemaVersion==='manual-display-v1','PDF_EXTRACTION_SCHEMA_REQUALIFICATION_REQUIRED');return d;});
  const walk=(v:unknown,visit:(v:Record<string,unknown>)=>void)=>{if(v&&typeof v==='object'){if(!Array.isArray(v))visit(v as Record<string,unknown>);for(const x of Object.values(v))walk(x,visit);}};
  const verified:StandingFinancialVerification['facts'][number][]=[];
  for(const f of plan.hybrid.canonicalFacts){const e=plan.evidence.find(e=>e.observation===f.itemId&&e.periodStart===f.period.start&&e.periodEnd===f.period.end);must(e,'FINANCIAL_EVIDENCE_LINK_MISSING');must(a.sourceRoles.includes(f.authority),'UNAPPROVED_FINANCIAL_SOURCE_ROLE');
   const raw=q.material.sourceBindings.find(p=>p.sha256===f.sourceHash);must(raw,'FINANCIAL_RAW_MISSING');const supplied=q.sourceInputs?.filter(s=>s.rawHash===f.sourceHash)??[];must(supplied.length<=1,'AMBIGUOUS_USER_SOURCE_URL');
   const result=this.classifyEvidence({bytes:sourceBytes(this.root,raw),claimedHash:f.sourceHash,url:supplied[0]?.url,domain:'F2',knownAt:q.knownAt});must(result.classification==='APPROVED_STANDING_SOURCE','FINANCIAL_SOURCE_TRUST:'+result.classification+':'+result.reason);must(result.receipt?.ticker===q.ticker||result.receipt?.symbol===q.ticker,'CAPTURE_ISSUER_MISMATCH');
   const witness=semanticInputs.flatMap(s=>s.verifications).filter(v=>v.ticker===q.ticker&&v.itemId===f.itemId&&v.sourceHash===f.sourceHash&&same(v.period,f.period)&&v.scope===f.scope&&v.unit===f.unit&&v.value===f.value&&v.publishedAt===f.publishedAt&&v.authority===f.authority&&v.qualified===true&&v.definitionVerified===true&&v.valueVerified===true&&v.provenanceVerified===true);must(witness.length>0,'UNVERIFIED_FINANCIAL_SEMANTICS');const submittedReview=input.verifications.find(v=>f.verificationIds.includes(String(v.id)));must(submittedReview&&witness.some(v=>v.reviewedAt===submittedReview.reviewedAt),'ORIGINAL_FINANCIAL_REVIEW_TIME_CHANGED');
   const originalDoc=semanticInputs.flatMap(s=>s.statements).find(s=>s.SHA256===f.sourceHash&&s.ticker===q.ticker&&s.reportingScope===f.scope&&s.reviewStatus==='QUALIFIED');const submittedDoc=input.statements.find(s=>s.SHA256===f.sourceHash);must(originalDoc&&submittedDoc&&submittedDoc.importedAt===originalDoc.importedAt&&submittedDoc.documentType===originalDoc.documentType&&submittedDoc.issuer===originalDoc.issuer&&same(submittedDoc.reportingPeriod,originalDoc.reportingPeriod)&&submittedDoc.reportingScope===originalDoc.reportingScope,'DOCUMENT_IDENTITY_OR_RECEIPT_SPOOF');
   const native=cells.filter(c=>c.ticker===q.ticker&&c.itemId===f.itemId&&c.raw.sha256===f.sourceHash&&c.periodStart===f.period.start&&c.periodEnd===f.period.end&&c.scope===f.scope);must(native.length===1,'NATIVE_IDENTITY_AMBIGUOUS');const c=native[0];must(c.locator.mode==='DIRECT_PDF','UNSUPPORTED_FINANCIAL_EXTRACTION_ADAPTER');
   const matches:Record<string,unknown>[]=[];for(const display of displays){if(display.ticker!==q.ticker)continue;walk(display,v=>{const source=v.source as {payloadHash?:string}|undefined;if(source?.payloadHash!==f.sourceHash||v.reportingScope!==f.scope||v.asOf!==f.period.end)return;walk(v,row=>{const pe=row.cellEvidence as {page?:number;boxes?:{x:number;y:number;width:number;height:number}[]}|undefined;if(row.lexicalValue!==c.nativeValue||row.value!==f.value||row.unit!==c.nativeUnit||pe?.page!==(c.locator as {page:number}).page||row.sourcePage!==pe.page)return;const boxes=pe.boxes??[];if(boxes.some(b=>same([b.x,b.y,b.x+b.width,b.y+b.height],(c.locator as {box:readonly number[]}).box)))matches.push(row);});});}
   must(matches.length>0,'NATIVE_PDF_PROVENANCE_NOT_IN_TRUSTED_EXTRACTION');
   // Concept is established by the retained qualified semantic artifact AND the native caption, not value equality.
   const labels:Record<string,readonly string[]>={TOTAL_ASSETS:['TỔNG TÀI SẢN (280 = 100 + 200)','TỔNG CỘNG TÀI SẢN','TỔNG TÀI SẢN']};
   must(labels[f.itemId]?.some(label=>matches.some(row=>canonical(String(row.label)).toUpperCase()===canonical(label).toUpperCase())),'UNSUPPORTED_OR_CONFLICTING_NATIVE_CAPTION');
   const normalized=normalizeLexical(c.nativeValue,{format:c.format,unit:c.nativeUnit,sign:'IDENTITY',missingTokens:[]});must(normalized.value===f.value,'NATIVE_RECONCILIATION_FAILED');must(result.url&&result.receipt,'VERIFIED_SOURCE_RECEIPT_REQUIRED');verified.push({factId:f.id,rawHash:f.sourceHash,url:result.url,receipt:result.receipt,semanticCatalogs:this.catalogs.financialSemantics,extractionCatalogs:this.catalogs.pdfExtractions});
  }
  return {authority:{id:a.id,version:a.version,registry:{...this.registryPointer()!}},sourceTrust:'APPROVED_STANDING_SOURCE',facts:verified};
 }
}
