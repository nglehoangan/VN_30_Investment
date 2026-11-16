import type {PrismaClient} from '@/infrastructure/db/generated/client';
import {CurrentFinancialAdmissions,checkedBody} from './current-financial';
import {sourceBytes,type SourcePin} from './registry';
import {snapshotHash as hash} from '@/infrastructure/fundamentals/snapshot-hash';
import {canonicalJson} from '@/domain/fundamentals/snapshot';
import {sha} from './registry';
import {instant,dateOnly} from '@/shared/time';
import {assertNotRevoked,admissionEvent} from '@/infrastructure/repositories/unified-admission';
import {decimal} from '@/domain/portfolio/values';
export interface CurrentDatasetContext {ticker:string;securityId:string;economicCutoff:string;knownAt:string;purpose:string}
export interface CurrentDatasetRequirements {contract:'current-financial-dataset-requirements-v1';version:string;
 /** Pinned assembly requirements, not a substitute for approved M3 scoring requirements. */
 fullM3CoverageCertified:false;financial:readonly {itemId:string;scope:string;start:string;end:string;vintage:string}[];
 requirePrice:true;requireShares:true;policyReferences:readonly SourcePin[]}
export interface CurrentMarketValue {ticker:string;securityId:string;date:string;value:string;unit:'VND_PER_SHARE';field:'GiaDongCua';lineage:unknown}
export interface CurrentShareValue {ticker:string;securityId:string;asOf:string;value:string;unit:'SHARES';status:'CARRIED_FORWARD_NO_CHANGE_FOUND_IN_REVIEWED_DOCUMENTS';lineage:unknown}
export interface CurrentDatasetComposition {
 requirements:SourcePin;
 /** Trusted application dependencies revalidate approved F1 and carry-forward evidence at consumption. */
 market(context:CurrentDatasetContext):Promise<CurrentMarketValue>;
 shares(context:CurrentDatasetContext):Promise<CurrentShareValue>;
}
function must(v:unknown,reason:string):asserts v{if(!v)throw Error(reason);}
export class CurrentFinancialDatasets {
 constructor(private readonly db:PrismaClient,private readonly root:string,private readonly financial:CurrentFinancialAdmissions,private readonly composition:CurrentDatasetComposition){}
 private requirements(){
  const r=JSON.parse(sourceBytes(this.root,this.composition.requirements).toString()) as CurrentDatasetRequirements;
  must(r.contract==='current-financial-dataset-requirements-v1'&&r.fullM3CoverageCertified===false&&r.requirePrice===true&&r.requireShares===true&&r.financial.length>0,'CURRENT_DATASET_REQUIREMENTS_SCHEMA');
  for(const p of r.policyReferences)sourceBytes(this.root,p);
  must(new Set(r.financial.map(f=>hash(f))).size===r.financial.length,'DUPLICATE_COVERAGE_REQUIREMENT');
  for(const f of r.financial){dateOnly(f.start);dateOnly(f.end);must(f.start<=f.end&&['CONSOLIDATED','STANDALONE'].includes(f.scope),'CURRENT_DATASET_REQUIREMENT_DIMENSIONS');}
  return r;
 }
 private async assemble(admissionId:string,context:CurrentDatasetContext){
  must(context.purpose==='CURRENT_FORMAL_VALUATION','CURRENT_ONLY_NOT_PIT');instant(context.knownAt);dateOnly(context.economicCutoff);
  const source=await this.financial.consume(admissionId,context),requirements=this.requirements();
  const coverage=requirements.financial.map(r=>{
   const matches=source.facts.filter(f=>f.itemId===r.itemId&&f.scope===r.scope&&f.period.start===r.start&&f.period.end===r.end&&f.vintage===r.vintage);
   return {requirement:r,status:matches.length===1?'AVAILABLE':'MISSING_OR_AMBIGUOUS',factIds:matches.map(f=>f.id)};
  });
  const price=await this.composition.market(context),shares=await this.composition.shares(context);
  must(price.ticker===context.ticker&&price.securityId===context.securityId&&price.date===context.economicCutoff&&price.field==='GiaDongCua'&&price.unit==='VND_PER_SHARE'&&decimal(price.value).positive,'CURRENT_DATASET_RAW_PRICE_SCOPE');
  must(shares.ticker===context.ticker&&shares.securityId===context.securityId&&shares.asOf===context.economicCutoff&&shares.unit==='SHARES'&&shares.status==='CARRIED_FORWARD_NO_CHANGE_FOUND_IN_REVIEWED_DOCUMENTS'&&/^\d+$/.test(shares.value)&&decimal(shares.value).positive,'CURRENT_DATASET_SHARE_SCOPE');
  const selectedIds=new Set(coverage.flatMap(c=>c.factIds));
  const facts=source.facts.filter(f=>selectedIds.has(f.id));
  return {contract:'current-financial-dataset-binding-v1' as const,purpose:'CURRENT_FORMAL_VALUATION' as const,
   ticker:context.ticker,securityId:context.securityId,economicCutoff:context.economicCutoff,knownAt:context.knownAt,
   admissionId,admissionPlanHash:hash(source.plan),requirements:this.composition.requirements,
   coverage,facts:facts.map(f=>({id:f.id,hash:hash(f)})),price,shares,
   financialCoverageComplete:coverage.every(c=>c.status==='AVAILABLE'),fullM3CoverageCertified:false as const,
   gates:{DI:'NOT_GRANTED',assessment:'NOT_GRANTED',M1:'NOT_GRANTED',confidence:'NOT_GRANTED',scoringAuthorization:'NOT_GRANTED'},
   readyForScoring:false as const,historicalPitGranted:false as const};
 }
 /** Pre-scoring dataset binding. Does not create legacy DI acceptance or a scorecard. */
 async bind(admissionId:string,context:CurrentDatasetContext){
  const manifest=await this.assemble(admissionId,context);
  if(!manifest.financialCoverageComplete)throw Error('CURRENT_DATASET_MISSING_DEPENDENCIES:'+canonicalJson(manifest.coverage.filter(c=>c.status!=='AVAILABLE')));
  const id='current-dataset:'+hash(manifest),body=canonicalJson({id,manifest});
  return this.db.$transaction(async tx=>{
   await assertNotRevoked(tx,id);
   const rows=await tx.$queryRawUnsafe<{body:string;body_hash:string}[]>('SELECT body,body_hash FROM current_financial_dataset WHERE id=?',id);
   if(rows.length){must(rows[0].body===body&&rows[0].body_hash===sha(body),'CURRENT_DATASET_ID_REUSE');return {id,duplicate:true,manifest};}
   await tx.$executeRawUnsafe('INSERT INTO current_financial_dataset VALUES(?,?,?,?,?,?,?)',id,context.ticker,context.securityId,context.economicCutoff,context.knownAt,body,sha(body));
   return {id,duplicate:false,manifest};
  });
 }
 async consume(id:string,context:CurrentDatasetContext){
  must(context.purpose==='CURRENT_FORMAL_VALUATION','CURRENT_ONLY_NOT_PIT');
  await assertNotRevoked(this.db,id);
  const rows=await this.db.$queryRawUnsafe<{body:string;body_hash:string}[]>('SELECT body,body_hash FROM current_financial_dataset WHERE id=?',id);
  const stored=checkedBody<{id:string;manifest:Awaited<ReturnType<CurrentFinancialDatasets['assemble']>>}>(rows[0]),m=stored.manifest;
  must(stored.id===id&&m.ticker===context.ticker&&m.securityId===context.securityId&&m.economicCutoff===context.economicCutoff&&m.knownAt<=context.knownAt,'CURRENT_DATASET_CONSUMPTION_SCOPE');
  // Replay the original binding knowledge clock; newer consumption must not rewrite its manifest.
  const replay=await this.assemble(m.admissionId,{...context,knownAt:m.knownAt});
  must(hash(replay)===hash(m),'CURRENT_DATASET_REPLAY_MISMATCH');
  // Also check authority revocation and knowledge at the actual consumer context.
  const source=await this.financial.consume(m.admissionId,context),ids=new Set(m.facts.map(f=>f.id));
  const facts=source.facts.filter(f=>ids.has(f.id));
  must(facts.length===m.facts.length&&facts.every(f=>m.facts.some(x=>x.id===f.id&&x.hash===hash(f))),'CURRENT_DATASET_FACT_INTEGRITY');
  return {id,manifest:m,facts,evidence:facts.map(f=>f.evidence),price:m.price,shares:m.shares,
   financialCoverageComplete:m.financialCoverageComplete,readyForScoring:false as const,historicalPitGranted:false as const};
 }
 async revoke(id:string,reason:string,knownAt:string){must(reason.trim(),'REVOCATION_REASON_REQUIRED');instant(knownAt);return admissionEvent(this.db,'REVOCATION',id,knownAt,{reason});}
}
