import type {PrismaClient} from '@/infrastructure/db/generated/client';
import type {PreScoringContext} from '@/ports/pre-scoring-datasets';
import type {CurrentMarketValue,CurrentShareValue} from './current-dataset';
import type {GovernedBankAdmissions} from './current-bank-admission';
import {checkedBody} from './current-financial';
import {sourceBytes,sha,type SourcePin} from './registry';
import {decimal} from '@/domain/portfolio/values';
import {canonicalJson} from '@/domain/fundamentals/snapshot';
import {snapshotHash as hash} from '@/infrastructure/fundamentals/snapshot-hash';
import {assertNotRevoked} from '@/infrastructure/repositories/unified-admission';

type Requirement={itemId:string;scope:'CONSOLIDATED'|'REGULATORY_CONSOLIDATED';
 start:string;end:string;vintage:string;unit:'VND'|'RATIO'};
interface BankDependencies {
 requirements:SourcePin;
 market(context:PreScoringContext):Promise<CurrentMarketValue>;
 shares(context:PreScoringContext):Promise<CurrentShareValue>;
}
function requireBank(condition:unknown,reason:string):asserts condition {
 if(!condition)throw Error(reason);
}

/** BANK composition for the existing immutable current financial dataset table. */
export class CurrentBankFinancialDatasets {
 constructor(private readonly db:PrismaClient,private readonly root:string,
  private readonly admission:Pick<GovernedBankAdmissions,'consume'>,private readonly inputs:BankDependencies){}
 private async assemble(admissionId:string,context:PreScoringContext){
  const {facts,plan}=await this.admission.consume(admissionId,context);
  const requirements=JSON.parse(sourceBytes(this.root,this.inputs.requirements).toString()) as {
   contract:string;ticker:string;securityId:string;cutoff:string;financial:Requirement[];
  };
  requireBank(requirements.contract==='current-bank-dataset-requirements-v1'&&requirements.ticker===context.ticker&&
   requirements.securityId===context.securityId&&requirements.cutoff===context.economicCutoff&&
   requirements.financial.length>0&&new Set(requirements.financial.map(hash)).size===requirements.financial.length,
   'BANK_REQUIREMENTS_SCOPE');
  const capital=['BANK_REPORTED_CAR','BANK_REPORTED_CET1'];
  requireBank(capital.every(item=>requirements.financial.some(r=>r.itemId===item)),'BANK_CAPITAL_REQUIREMENTS_MISSING');
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
  const core=['TOTAL_ASSETS','TOTAL_EQUITY','NET_INCOME','BANK_GROSS_CUSTOMER_LOANS',
   'BANK_CUSTOMER_DEPOSITS','BANK_LOAN_LOSS_RESERVES'];
  const balanceDate=selected.filter(f=>f.itemId==='TOTAL_ASSETS').map(f=>f.period.end).sort().at(-1);
  requireBank(balanceDate&&core.every(item=>selected.some(f=>f.itemId===item&&f.period.end===balanceDate)),
   'BANK_DATASET_CORE_MISSING');
  const price=await this.inputs.market(context),shares=await this.inputs.shares(context);
  for(const value of [price,shares])requireBank(value.ticker===context.ticker&&
   value.securityId===context.securityId,'BANK_S4_IDENTITY');
  requireBank(price.date===context.economicCutoff&&price.field==='GiaDongCua'&&
   price.unit==='VND_PER_SHARE'&&decimal(price.value).positive,'BANK_S4_PRICE');
  requireBank(shares.asOf===context.economicCutoff&&shares.unit==='SHARES'&&
   shares.status==='CARRIED_FORWARD_NO_CHANGE_FOUND_IN_REVIEWED_DOCUMENTS'&&
   /^\d+$/.test(shares.value)&&decimal(shares.value).positive,'BANK_S4_SHARES');
  return {admissionVersion:plan.versionId,approvalHash:plan.approvalHash,manifest:{contract:'current-bank-financial-dataset-binding-v1',...context,admissionId,
   admissionPlanHash:hash(plan),requirements:this.inputs.requirements,coverage,
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
  type Manifest=Awaited<ReturnType<CurrentBankFinancialDatasets['assemble']>>['manifest'];
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
