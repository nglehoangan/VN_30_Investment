import type {PrismaClient} from '@/infrastructure/db/generated/client';
import type {PreScoringContext} from '@/ports/pre-scoring-datasets';
import type {CurrentMarketValue} from './current-dataset';
import type {GovernedBankAdmissions} from './current-bank-admission';
import {checkedBody} from './current-financial';
import {sourceBytes,sha,type SourcePin} from './registry';
import {instant} from '@/shared/time';
import {decimal} from '@/domain/portfolio/values';
import {canonicalJson} from '@/domain/fundamentals/snapshot';
import {snapshotHash as hash} from '@/infrastructure/fundamentals/snapshot-hash';
import {assertNotRevoked} from '@/infrastructure/repositories/unified-admission';

// The original BANK dataset module is hash-pinned by the approved ACB executable.
const CAPITAL_REQUIREMENTS: SourcePin = {
 path:'docs/fundamental-data-engine/tcb-scoring-readiness/2026-11-22/exec-c636021bde64b53de84eb66e/TCB_BANK_CAPITAL_REQUIREMENTS_V2.json',
 sha256:'a99e577f2a829dc24ce966f6dcb56a1a554c715595e7bc0224cae6a0a887a6f2',
};
const SHARE_CHANGE: SourcePin = {
 path:'docs/fundamental-data-engine/tcb-scoring-readiness/2026-11-22/exec-c636021bde64b53de84eb66e/TCB_VERIFIED_SHARE_CHANGE.json',
 sha256:'7b18350ca78b17f06be909e8b86b2ff942bd8d072c3f0d31a1e854bb4bd2a691',
};
type VerifiedShareChange = {
 ticker:string;securityId:string;effectiveDate:string;reportSignedDate:string;publicationDate:string;
 publicationBasis:string;retrievedAt:string;availableAt:string;outstandingBefore:string;
 sharesIssued:string;outstandingAfter:string;source:SourcePin;sourceUrl:string;locator:string;
};

type CapitalRequirements = {
 ticker:string;securityId:string;cutoff:string;periodEnd:string;scope:string;
 sourceSha256:string;car:string;tier1:string;cet1:null;
};

type Requirement={itemId:string;scope:'CONSOLIDATED'|'REGULATORY_CONSOLIDATED';
 start:string;end:string;vintage:string;unit:'VND'|'RATIO'};
interface BankDependencies {
 requirements:SourcePin;
 market(context:PreScoringContext):Promise<CurrentMarketValue>;
}
function requireBank(condition:unknown,reason:string):asserts condition {
 if(!condition)throw Error(reason);
}

/** TCB successor. Retain the existing ACB executable and its replay bytes. */
export class TcbBankFinancialDatasets {
 constructor(private readonly db:PrismaClient,private readonly root:string,
  private readonly admission:Pick<GovernedBankAdmissions,'consume'>,private readonly inputs:BankDependencies){}
 private async assemble(admissionId:string,context:PreScoringContext){
  const policy=JSON.parse(sourceBytes(this.root,CAPITAL_REQUIREMENTS).toString()) as CapitalRequirements;
  requireBank(context.ticker===policy.ticker&&context.securityId===policy.securityId&&
   context.economicCutoff===policy.cutoff&&context.purpose==='CURRENT_FORMAL_VALUATION',
   'TCB_BANK_CAPITAL_REQUIREMENT_SCOPE');
  const {facts,plan}=await this.admission.consume(admissionId,context);
  const requirements=JSON.parse(sourceBytes(this.root,this.inputs.requirements).toString()) as {
   contract:string;ticker:string;securityId:string;cutoff:string;financial:Requirement[];
  };
  requireBank(requirements.contract==='current-bank-dataset-requirements-v1'&&requirements.ticker===context.ticker&&
   requirements.securityId===context.securityId&&requirements.cutoff===context.economicCutoff&&
   requirements.financial.length>0&&new Set(requirements.financial.map(hash)).size===requirements.financial.length,
   'BANK_REQUIREMENTS_SCOPE');
  const capital=['BANK_REPORTED_CAR','BANK_REPORTED_CET1'];
  const carRequirements=requirements.financial.filter(r=>r.itemId==='BANK_REPORTED_CAR');
  requireBank(carRequirements.length===1&&carRequirements[0].end===policy.periodEnd&&
   !requirements.financial.some(r=>r.itemId==='BANK_REPORTED_CET1'),
   'TCB_BANK_CAPITAL_REQUIREMENTS_MISMATCH');
  const ids=new Set<string>();
  const coverage=requirements.financial.map(requirement=>{
   const r=requirement,regulatory=capital.includes(r.itemId);
   requireBank(r.scope===(regulatory?'REGULATORY_CONSOLIDATED':'CONSOLIDATED')&&r.unit===(regulatory?'RATIO':'VND')&&
    (!regulatory||r.start===r.end),'BANK_REQUIREMENT_SCOPE_OR_UNIT');
   const matches=facts.filter(f=>f.itemId===r.itemId&&f.scope===r.scope&&f.period.start===r.start&&
    f.period.end===r.end&&f.vintage===r.vintage&&f.evidence.unit===r.unit);
   requireBank(matches.length===1,'BANK_DATASET_MISSING_OR_AMBIGUOUS:'+r.itemId);
   ids.add(matches[0].id);
   return {requirement,status:'AVAILABLE' as const,factIds:[matches[0].id]};
  });
  const selected=facts.filter(f=>ids.has(f.id));
  const car=selected.find(f=>f.itemId==='BANK_REPORTED_CAR');
  requireBank(car&&car.ticker===context.ticker&&car.evidence.securityId===context.securityId&&
   car.value===policy.car&&car.evidence.value===policy.car&&car.rawHash===policy.sourceSha256&&
   car.scope===policy.scope&&car.evidence.quality==='VALID',
   'TCB_BANK_CAR_EVIDENCE_MISMATCH');
  const core=['TOTAL_ASSETS','TOTAL_EQUITY','NET_INCOME','BANK_GROSS_CUSTOMER_LOANS',
   'BANK_CUSTOMER_DEPOSITS','BANK_LOAN_LOSS_RESERVES'];
  const balanceDate=selected.filter(f=>f.itemId==='TOTAL_ASSETS').map(f=>f.period.end).sort().at(-1);
  requireBank(balanceDate&&core.every(item=>selected.some(f=>f.itemId===item&&f.period.end===balanceDate)),
   'BANK_DATASET_CORE_MISSING');
  const change=JSON.parse(sourceBytes(this.root,SHARE_CHANGE).toString()) as VerifiedShareChange;
  requireBank(change.ticker===context.ticker&&change.securityId===context.securityId&&
   change.effectiveDate===context.economicCutoff&&
   change.effectiveDate<=change.reportSignedDate&&change.reportSignedDate<=change.publicationDate&&
   change.publicationDate<=change.availableAt.slice(0,10)&&
   instant(change.availableAt)<=instant(context.knownAt),
   'TCB_BANK_SHARE_CHANGE_SCOPE_OR_TIME');
  requireBank(BigInt(change.outstandingBefore)+BigInt(change.sharesIssued)===BigInt(change.outstandingAfter)&&
   decimal(change.outstandingAfter).positive,'TCB_BANK_SHARE_CHANGE_ARITHMETIC');
  sourceBytes(this.root,change.source);
  const shares={
   ticker:change.ticker,securityId:change.securityId,asOf:change.effectiveDate,
   value:change.outstandingAfter,unit:'SHARES' as const,status:'VERIFIED_EFFECTIVE_CHANGE' as const,
   lineage:{review:SHARE_CHANGE,source:change.source,sourceUrl:change.sourceUrl,locator:change.locator,
    effectiveDate:change.effectiveDate,reportSignedDate:change.reportSignedDate,
    publicationDate:change.publicationDate,publicationBasis:change.publicationBasis,
    retrievedAt:change.retrievedAt,availableAt:change.availableAt},
  };
  const price=await this.inputs.market(context);
  requireBank(price.ticker===context.ticker&&price.securityId===context.securityId,'BANK_S4_IDENTITY');
  requireBank(price.date===context.economicCutoff&&price.field==='GiaDongCua'&&
   price.unit==='VND_PER_SHARE'&&decimal(price.value).positive,'BANK_S4_PRICE');
  return {admissionVersion:plan.versionId,approvalHash:plan.approvalHash,manifest:{contract:'current-bank-financial-dataset-binding-v1',...context,admissionId,
   admissionPlanHash:hash(plan),requirements:this.inputs.requirements,coverage,
   capitalRequirements:CAPITAL_REQUIREMENTS,
   capitalDispositions:{car:policy.car,tier1:policy.tier1,cet1:policy.cet1},
   facts:selected.map(f=>({id:f.id,hash:hash(f)})),price,shares,financialCoverageComplete:true,
   readyForScoring:false,historicalPitGranted:false},facts:selected};
 }
 async bind(admissionId:string,context:PreScoringContext){
  const {manifest,admissionVersion,approvalHash}=await this.assemble(admissionId,context),datasetHash=hash(manifest);
  const id='current-bank-dataset:'+datasetHash,body=canonicalJson({id,manifest});
  return this.db.$transaction(async tx=>{
   for(const key of [admissionId,id,admissionVersion,approvalHash,...manifest.facts.map(f=>f.id)])await assertNotRevoked(tx,key);
   const [row]=await tx.$queryRawUnsafe<{body:string;body_hash:string}[]>(
    'SELECT body,body_hash FROM current_financial_dataset WHERE id=?',id);
   if(row)requireBank(row.body===body&&row.body_hash===sha(body),'BANK_DATASET_CONFLICT');
   else await tx.$executeRawUnsafe('INSERT INTO current_financial_dataset VALUES(?,?,?,?,?,?,?)',
    id,context.ticker,context.securityId,context.economicCutoff,context.knownAt,body,sha(body));
   return {id,datasetHash,duplicate:!!row,manifest};
  });
 }
 async consume(id:string,context:PreScoringContext){
  await assertNotRevoked(this.db,id);
  const [row]=await this.db.$queryRawUnsafe<{body:string;body_hash:string}[]>(
   'SELECT body,body_hash FROM current_financial_dataset WHERE id=?',id);
  type Manifest=Awaited<ReturnType<TcbBankFinancialDatasets['assemble']>>['manifest'];
  const {id:storedId,manifest}=checkedBody<{id:string;manifest:Manifest}>(row);
  requireBank(storedId===id&&manifest.ticker===context.ticker&&manifest.securityId===context.securityId&&
   manifest.economicCutoff===context.economicCutoff&&manifest.purpose===context.purpose&&
   manifest.knownAt<=context.knownAt,'BANK_DATASET_CONSUMPTION_SCOPE');
  // Recheck dynamic authority and risks at the actual read clock, then replay the original binding.
  await this.admission.consume(manifest.admissionId,context);
  const result=await this.assemble(manifest.admissionId,{...context,knownAt:manifest.knownAt});
  const datasetHash=hash(result.manifest);
  requireBank(id==='current-bank-dataset:'+datasetHash&&hash(manifest)===datasetHash,'BANK_DATASET_REPLAY_MISMATCH');
  return {...result,id,datasetHash,price:manifest.price,shares:manifest.shares,
   financialCoverageComplete:true as const};
 }
}
