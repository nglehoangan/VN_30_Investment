import type {Prisma,PrismaClient} from '@/infrastructure/db/generated/client';
import type {PreScoringContext} from '@/ports/pre-scoring-datasets';
import {dateOnly, instant} from '@/shared/time';
import {decimal} from '@/domain/portfolio/values';
import {reportedBankCapital} from '@/domain/fundamentals/bank-contract';
import {UNIFIED_SOURCE_POLICY} from '@/domain/fundamentals/standing-source-policy';
import {validateEvidence, type CurrentValuationEvidence} from '@/domain/scoring/evidence';
import {canonicalJson} from '@/domain/fundamentals/snapshot';
import {snapshotHash as hash} from '@/infrastructure/fundamentals/snapshot-hash';
import {assertNotRevoked} from '@/infrastructure/repositories/unified-admission';
import {checkedBody,currentReceiptTime,exactPointer} from './current-financial';
import {sha,sourceBytes,type SourcePin} from './registry';

export const BANK_ADMISSION_RUNTIME = [
 'src/infrastructure/source-admission/current-bank-admission.ts',
 'src/infrastructure/source-admission/current-financial.ts',
 'src/infrastructure/source-admission/current-dataset.ts',
 'src/infrastructure/source-admission/current-bank-scoring.ts',
 'src/infrastructure/source-admission/registry.ts',
 'src/infrastructure/repositories/unified-admission.ts',
 'src/infrastructure/fundamentals/snapshot-hash.ts',
 'src/domain/fundamentals/bank-contract.ts',
 'src/domain/fundamentals/snapshot.ts',
 'src/domain/fundamentals/standing-source-policy.ts',
 'src/domain/scoring/evidence.ts',
 'src/domain/scoring/validation.ts',
 'src/domain/portfolio/values.ts',
 'src/shared/time.ts',
 'prisma/proposals/current-financial-dataset-v1.sql',
 'prisma/proposals/current-financial-enrichment-v1.sql',
 'prisma/proposals/current-scoring-data-acceptance-v1.sql',
] as const;
type Subject = {ticker:string;securityId:string;exchange:string;sector:'BANK';referenceDate:string;
 universe:{version:string;registryEntryHash:string;profile:SourcePin}};
type Document = SourcePin & {id:string;role:string;end:string;url:string;receiptPath:string;
 receiptHash:string;receiptPointer:string;originalRetrievedAt:string;sourceRole:string};
type Cell = {concept:string;doc:string;start:string;end:string;native:string;unit:string;
 page:number;locator:string;scope:string;framework?:string};
type Catalog = {contract:string;status:string;subject:Subject;documents:Document[];facts:Cell[]};
type Version = {contract:string;status:string;id:string;policyVersion:string;recordedAt:string;
 subject:Subject;catalog:SourcePin;standingPolicy:SourcePin;code:SourcePin[];
 outstandingPermissions:false;ownerSource?:SourcePin};
type BodyRow = {body:string;body_hash:string};
const CAPITAL = new Set(['BANK_REPORTED_CAR','BANK_REPORTED_CET1']);

function requireBank(condition:unknown,code:string):asserts condition {
 if(!condition)throw Error(code);
}
export function bankVersionApprovalHash(version:Version){
 const {status:_status,ownerSource:_owner,recordedAt:_recordedAt,...scope}=version;
 return hash(scope);
}

/** Separate approved F2 BANK version. Historical VNM authority and replay remain untouched. */
export class GovernedBankAdmissions {
 constructor(private readonly db:PrismaClient,private readonly root:string,
  private readonly registry:()=>SourcePin,private readonly clock:{now():string}){}

 private authorize(context:PreScoringContext){
  instant(context.knownAt);instant(this.clock.now());dateOnly(context.economicCutoff);
  requireBank(context.purpose==='CURRENT_FORMAL_VALUATION'&&context.knownAt<=this.clock.now(),
   'BANK_ADMISSION_TIME_OR_PURPOSE');
  const pin=this.registry(),version=JSON.parse(sourceBytes(this.root,pin).toString()) as Version;
  requireBank(version.contract==='standing-bank-financial-admission-version-v1'&&version.status==='APPROVED'&&
   version.ownerSource&&version.outstandingPermissions===false&&version.policyVersion===UNIFIED_SOURCE_POLICY.financial.version,
   'BANK_VERSION_AUTHORIZATION_REQUIRED');
  instant(version.recordedAt);
  const subject=version.subject;
  requireBank(version.recordedAt<=context.knownAt&&subject.sector==='BANK'&&subject.ticker===context.ticker&&
   subject.securityId===context.securityId&&subject.referenceDate===context.economicCutoff,'BANK_VERSION_CONTEXT_MISMATCH');
  const approvalHash=bankVersionApprovalHash(version);
  const statement='Approve exact BANK admission version '+approvalHash+' for '+subject.ticker+' at '+subject.referenceDate;
  requireBank(sourceBytes(this.root,version.ownerSource).toString().split(/\r?\n/).includes(statement),
   'BANK_VERSION_OWNER_SOURCE_REQUIRED');
  const policy=JSON.parse(sourceBytes(this.root,version.standingPolicy).toString());
  requireBank(policy.currentFinancialPrincipleAuthorized===true&&policy.standingPolicyVersion===UNIFIED_SOURCE_POLICY.version&&
   policy.productionActivationGranted===false&&currentReceiptTime(policy.recordedAt)<=context.knownAt&&
   sourceBytes(this.root,policy.source).toString().includes(
    'Standing Financial Source Approval and Automated Financial Evidence Admission for Current Valuation.'),
   'BANK_STANDING_POLICY_REQUIRED');
  const paths=new Set(version.code.map(p=>p.path));
  requireBank(paths.size===version.code.length&&BANK_ADMISSION_RUNTIME.every(p=>paths.has(p)),
   'BANK_VERSION_CODE_INCOMPLETE');
  for(const p of version.code)sourceBytes(this.root,p);
  const profile=JSON.parse(sourceBytes(this.root,subject.universe.profile).toString());
  const m=profile.membership;
  requireBank(m.from<=context.economicCutoff&&m.through>=context.economicCutoff&&
   m.members.filter((row:Subject)=>row.ticker===subject.ticker&&row.securityId===subject.securityId&&
    row.exchange===subject.exchange).length===1,'BANK_UNIVERSE_IDENTITY');
  return {pin,version,approvalHash};
 }

 private plan(context:PreScoringContext){
  const {pin,version,approvalHash}=this.authorize(context);
  const catalog=JSON.parse(sourceBytes(this.root,version.catalog).toString()) as Catalog;
  const {subject}=version;
  requireBank(catalog.contract==='bank-admission-review-catalog-v1'&&
   ['ticker','securityId','exchange','sector','referenceDate'].every(key=>
    catalog.subject[key as keyof Subject]===subject[key as keyof Subject])&&
   hash(catalog.subject.universe)===hash(subject.universe),'BANK_CATALOG_IDENTITY');
  const documents=new Map(catalog.documents.map(doc=>{
   const receiptPin={path:doc.receiptPath,sha256:doc.receiptHash};
   const receipt=exactPointer(JSON.parse(sourceBytes(this.root,receiptPin).toString()),doc.receiptPointer) as
    {ticker:string;documentId:number;sha256:string;sourceUrl:string;retrievedAt:string;sourceRole:string;status:string};
   const url=new URL(doc.url);
   const originalReceivedAt=currentReceiptTime(doc.originalRetrievedAt);
   requireBank(receipt.ticker===subject.ticker&&String(receipt.documentId)===doc.id&&receipt.sha256===doc.sha256&&
    receipt.sourceUrl===doc.url&&receipt.retrievedAt===doc.originalRetrievedAt&&receipt.sourceRole===doc.sourceRole&&
    doc.sourceRole==='VIETSTOCK_MIRROR_NOT_ORIGINAL_PUBLICATION'&&['RETAINED','CAPTURED'].includes(receipt.status)&&
    url.origin==='https://static2.vietstock.vn'&&!url.username&&!url.password&&originalReceivedAt<=context.knownAt,
    'BANK_DOCUMENT_SOURCE_MISMATCH');
   const bytes=sourceBytes(this.root,doc);
   requireBank(bytes.subarray(0,5).toString()==='%PDF-','BANK_PDF_ROLE_REQUIRED');
   return [doc.id,{doc,bytes,originalReceivedAt}] as const;
  }));
  requireBank(documents.size===catalog.documents.length,'BANK_DUPLICATE_DOCUMENT');
  const asOf=context.economicCutoff+'T23:59:59.999Z';
  const facts=catalog.facts.map((cell,index)=>{
   const d=documents.get(cell.doc);
   dateOnly(cell.start);dateOnly(cell.end);
   requireBank(d&&cell.start<=cell.end&&cell.end===d.doc.end&&cell.end<=context.economicCutoff&&
    Number.isSafeInteger(cell.page)&&cell.page>0&&cell.locator,'BANK_CELL_DIMENSIONS');
   const capital=CAPITAL.has(cell.concept);
   let value:string;
   if(capital){
    requireBank(d.doc.role==='REGULATORY_CAPITAL_DISCLOSURE'&&cell.scope==='REGULATORY_CONSOLIDATED'&&
     cell.unit==='PERCENT'&&cell.start===cell.end,'BANK_CAPITAL_ROLE');
    const normalized=decimal(cell.native).div(decimal('100')).toString();
    const result=reportedBankCapital({metric:cell.concept==='BANK_REPORTED_CAR'?'CAR':'CET1',
     value:normalized,method:'REPORTED',framework:cell.framework??'',scope:'CONSOLIDATED',
     end:cell.end,sourceHash:d.doc.sha256,locator:cell.locator});
    requireBank(result.status==='AVAILABLE','BANK_CAPITAL_RATIO');
    value=result.value;
   }else{
    requireBank(d.doc.role==='INTERIM_CONSOLIDATED_STATEMENT'&&cell.scope==='CONSOLIDATED'&&
     cell.unit==='MILLION_VND'&&/^-?\d+$/.test(cell.native)&&cell.concept!=='BANK_LOAN_LOSS_RESERVES',
     'BANK_STATEMENT_ROLE_OR_UNIT');
    value=decimal(cell.native).mul(decimal('1000000')).toString();
   }
   const period={start:cell.start,end:cell.end},raw={path:d.doc.path,sha256:d.doc.sha256};
   const identity={ticker:context.ticker,itemId:cell.concept,scope:cell.scope,period,
    vintage:d.doc.role+':'+d.doc.id,rawHash:raw.sha256};
   const id='bank-current-fact:'+hash({identity,approvalHash});
   const qualificationReference=version.catalog.path+'#/facts/'+index;
   const evidence:CurrentValuationEvidence={id,version:version.policyVersion,securityId:context.securityId,
    observation:cell.concept,value,unit:capital?'RATIO':'VND',classification:'FACT',source:d.doc.role,
    periodStart:cell.start,periodEnd:cell.end,asOf,publishedAt:null,receivedAt:context.knownAt,
    validThrough:asOf,critical:true,quality:'VALID',family:'FINANCIAL',
    time:{contract:'current-formal-evidence-time-v1',purpose:'CURRENT_FORMAL_VALUATION',
     policyVersion:'standing-financial-current-v1',policyHash:hash(UNIFIED_SOURCE_POLICY),
     authorizationReference:pin.path,rawHash:raw.sha256,qualificationReference,
     originalReceivedAt:d.originalReceivedAt,reviewedAt:version.recordedAt,ingestedAt:context.knownAt,
     availableAt:context.knownAt}};
   return {id,...identity,raw,value,evidence,retainedProvenance:{cell,qualificationReference},
    derivation:null as null|{formula:string;operandIds:string[]}};
  });
  requireBank(new Set(facts.map(f=>f.id)).size===facts.length,'BANK_DUPLICATE_FACT');
  const reserveOperands=['BANK_RESERVE_GENERAL','BANK_RESERVE_SPECIFIC'].map(item=>{
   const matches=facts.filter(f=>f.itemId===item);
   requireBank(matches.length===1,'BANK_RESERVE_OPERAND_REQUIRED');
   return matches[0];
  });
  const [general,specific]=reserveOperands;
  requireBank(hash(general.period)===hash(specific.period)&&general.rawHash===specific.rawHash&&
   general.period.start===general.period.end&&general.scope===specific.scope&&
   reserveOperands.every(f=>!decimal(f.value).negative),'BANK_RESERVE_OPERANDS_MISMATCH');
  const reserves=decimal(general.value).add(decimal(specific.value)).toString();
  const derivedId='bank-current-fact:'+hash({item:'BANK_LOAN_LOSS_RESERVES',ids:reserveOperands.map(f=>f.id)});
  facts.push({...general,id:derivedId,itemId:'BANK_LOAN_LOSS_RESERVES',value:reserves,
   evidence:{...general.evidence,id:derivedId,observation:'BANK_LOAN_LOSS_RESERVES',value:reserves,family:'FINANCIAL_DERIVED'},
   derivation:{formula:'GENERAL_PLUS_SPECIFIC_EXCLUDING_MARGIN_LENDING',operandIds:reserveOperands.map(f=>f.id)}});
  requireBank(!validateEvidence(facts.map(f=>f.evidence),context.securityId,asOf,context.knownAt,
   'CURRENT_FORMAL_VALUATION').length,'BANK_UNQUALIFIED_EVIDENCE');
  return {documents,plan:{contract:'governed-bank-current-admission-v1',context:{...context},
   registry:pin,versionId:version.id,approvalHash,catalog:version.catalog,facts}};
 }

 async ingest(context:PreScoringContext){
  const {documents,plan}=this.plan(context);
  const id=this.admissionId(plan),body=canonicalJson(plan);
  return this.db.$transaction(async tx=>{
   for(const key of [id,plan.versionId,plan.approvalHash,...plan.facts.map(f=>f.id)])await assertNotRevoked(tx,key);
   const [old]=await tx.$queryRawUnsafe<BodyRow[]>('SELECT body,body_hash FROM current_financial_admission WHERE id=?',id);
   if(old){
    await this.consumeWith(tx,id,context);
    return {id,duplicate:true};
   }
   await tx.$executeRawUnsafe('INSERT INTO current_financial_admission VALUES(?,?,?,?,?,?,?)',
    id,context.ticker,context.securityId,context.economicCutoff,context.knownAt,body,sha(body));
   for(const {doc,bytes} of documents.values()){
    await tx.$executeRawUnsafe('INSERT OR IGNORE INTO current_financial_raw VALUES(?,?,?)',doc.sha256,doc.path,bytes);
    const [stored]=await tx.$queryRawUnsafe<{payload:Uint8Array}[]>('SELECT payload FROM current_financial_raw WHERE hash=?',doc.sha256);
    requireBank(stored&&sha(stored.payload)===doc.sha256,'BANK_STORED_RAW_INTEGRITY');
   }
   for(const fact of plan.facts){
    const text=canonicalJson(fact);
    await tx.$executeRawUnsafe('INSERT INTO current_financial_fact VALUES(?,?,?,?,?)',
     fact.id,id,fact.rawHash,text,sha(text));
   }
   return {id,duplicate:false};
  });
 }

 private admissionId(plan:ReturnType<GovernedBankAdmissions['plan']>['plan']){
  const {ticker,securityId,economicCutoff}=plan.context;
  return 'current-bank-admission:'+hash({ticker,securityId,economicCutoff,registry:plan.registry});
 }

 async consume(id:string,context:PreScoringContext){
  return this.consumeWith(this.db,id,context);
 }

 private async consumeWith(db:PrismaClient|Prisma.TransactionClient,id:string,context:PreScoringContext){
  const current=this.authorize(context);
  const [row]=await db.$queryRawUnsafe<BodyRow[]>('SELECT body,body_hash FROM current_financial_admission WHERE id=?',id);
  type Plan=ReturnType<GovernedBankAdmissions['plan']>['plan'];
  const stored=checkedBody<Plan>(row),original=stored.context;
  requireBank(stored.contract==='governed-bank-current-admission-v1'&&original.ticker===context.ticker&&
   original.securityId===context.securityId&&original.economicCutoff===context.economicCutoff&&
   original.knownAt<=context.knownAt&&hash(stored.registry)===hash(current.pin),'BANK_CONSUMPTION_SCOPE');
  const replay=this.plan(original);
  requireBank(id===this.admissionId(stored)&&hash(replay.plan)===hash(stored),'BANK_PLAN_REPLAY_MISMATCH');
  for(const key of [id,stored.versionId,stored.approvalHash,...stored.facts.map(f=>f.id)])await assertNotRevoked(db,key);
  for(const {doc} of replay.documents.values()){
   const [raw]=await db.$queryRawUnsafe<{payload:Uint8Array}[]>('SELECT payload FROM current_financial_raw WHERE hash=?',doc.sha256);
   requireBank(raw&&sha(raw.payload)===doc.sha256,'BANK_STORED_RAW_INTEGRITY');
  }
  const rows=await db.$queryRawUnsafe<BodyRow[]>('SELECT body,body_hash FROM current_financial_fact WHERE admission_id=?',id);
  const actual=new Map(rows.map(row=>{const fact=checkedBody<Plan['facts'][number]>(row);return [fact.id,hash(fact)];}));
  requireBank(actual.size===stored.facts.length&&stored.facts.every(f=>actual.get(f.id)===hash(f)),'BANK_STORED_FACT_INTEGRITY');
  return {id,plan:stored,facts:stored.facts};
 }
}
