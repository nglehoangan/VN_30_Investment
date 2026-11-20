// Isolated integration test. The owner receipt exists only inside the disposable test root.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {registerHooks} from 'node:module';
import {createHash} from 'node:crypto';
import {existsSync,mkdirSync,mkdtempSync,readFileSync,rmSync,statSync,writeFileSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {DatabaseSync} from 'node:sqlite';
import {fileURLToPath,pathToFileURL} from 'node:url';

registerHooks({
 resolve(specifier,context,next){
  const url=specifier.startsWith('@/')?pathToFileURL(resolve('src',specifier.slice(2))):
   specifier.startsWith('.')&&context.parentURL?new URL(specifier,context.parentURL):null;
  if(url?.protocol==='file:'){
   for(const suffix of ['.ts','/index.ts'])if(existsSync(fileURLToPath(url)+suffix))return next(url.href+suffix,context);
  }
  return next(specifier,context);
 },
 load(url,context,next){
  if(url.startsWith(pathToFileURL(resolve('src')+'/').href)&&url.endsWith('.json')&&
    !context.importAttributes?.type&&!(statSync(new URL(url)).st_flags&0x40000000)){
   return {format:'module',source:'export default '+readFileSync(new URL(url),'utf8'),shortCircuit:true};
  }
  return next(url,context);
 },
});
const {GovernedBankAdmissions,bankVersionApprovalHash}=await import('../../src/infrastructure/source-admission/current-bank-admission.ts');
const {CurrentBankFinancialDatasets}=await import('../../src/infrastructure/source-admission/current-bank-dataset.ts');
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const root=mkdtempSync(join(tmpdir(),'acb-bank-governed-'));
const conn=new DatabaseSync(join(root,'test.sqlite'));
const read=(p)=>{
 if(statSync(p).st_flags&0x40000000){
  try{return execFileSync('git',['show','HEAD:'+p],{stdio:['ignore','pipe','ignore']});}catch{}
 }
 return readFileSync(p);
};

try {
 const db={
  $queryRawUnsafe:async (sql,...args)=>conn.prepare(sql).all(...args),
  $executeRawUnsafe:async (sql,...args)=>conn.prepare(sql).run(...args),
  $transaction:async callback=>{
   conn.exec('BEGIN');
   try{const result=await callback(db);conn.exec('COMMIT');return result;}
   catch(error){conn.exec('ROLLBACK');throw error;}
  },
 };
 const schema='prisma/proposals/current-financial-dataset-v1.sql';
 conn.exec(read(schema).toString());
 conn.exec('CREATE TABLE source_admission_event(id TEXT,kind TEXT,target_id TEXT); CREATE TABLE protected_nav(value INTEGER); INSERT INTO protected_nav VALUES(1)');
 const put=(path,body)=>{
  const bytes=Buffer.isBuffer(body)?body:Buffer.from(typeof body==='string'?body:JSON.stringify(body));
  const file=join(root,path);mkdirSync(dirname(file),{recursive:true});writeFileSync(file,bytes);
  return {path,sha256:digest(bytes)};
 };
 const copy=(pin,path=pin.path)=>assert.deepEqual(put(pin.path,read(path)),pin);
 const folder='docs/fundamental-data-engine/acb-scoring-readiness/2026-11-19/bank-admission';
 const proposal=JSON.parse(read(folder+'/BANK_VERSION_PROPOSED.json'));
 const catalog=JSON.parse(read(proposal.catalog.path));
 const policy=JSON.parse(read(proposal.standingPolicy.path));
 for(const pin of [proposal.catalog,proposal.standingPolicy,policy.source,proposal.subject.universe.profile,...proposal.code])copy(pin);
 for(const d of catalog.documents){
  copy({path:d.receiptPath,sha256:d.receiptHash});
  copy({path:d.path,sha256:d.sha256},d.id==='564804'&&process.argv[2]?process.argv[2]:d.path);
 }
 const recordedAt='2026-11-19T07:00:00.000Z';
 const context={ticker:proposal.subject.ticker,securityId:proposal.subject.securityId,
  economicCutoff:proposal.subject.referenceDate,knownAt:recordedAt,purpose:'CURRENT_FORMAL_VALUATION'};
 let registry=put('test-registry.json',proposal);
 const service=new GovernedBankAdmissions(db,root,()=>registry,{now:()=> '2026-11-19T08:00:00.000Z'});
 await assert.rejects(service.ingest(context),/BANK_VERSION_AUTHORIZATION_REQUIRED/);
 const approvalHash=bankVersionApprovalHash(proposal);
 const ownerSource=put('SYNTHETIC_TEST_ONLY.txt',
  'Approve exact BANK admission version '+approvalHash+' for ACB at 2026-10-30');
 const version={...proposal,status:'APPROVED',recordedAt,ownerSource};
 registry=put('test-registry.json',{...version,ownerSource:put('wrong.txt','Unrelated approval')});
 await assert.rejects(service.ingest(context),/BANK_VERSION_OWNER_SOURCE_REQUIRED/);
 registry=put('test-registry.json',version);
 for(const change of [{ticker:'VNM'},{securityId:'different'},{economicCutoff:'2026-10-29'}])
  await assert.rejects(service.ingest({...context,...change}),/BANK_VERSION_CONTEXT_MISMATCH/);
 const codePin=proposal.code.find(p=>p.path.endsWith('/current-bank-admission.ts'));
 put(codePin.path,'tampered');
 await assert.rejects(service.ingest(context),/SOURCE_HASH_MISMATCH/);
 copy(codePin);
 assert.equal(conn.prepare('SELECT count(*) n FROM current_financial_admission').get().n,0);
 const first=await service.ingest(context);
 assert.equal(first.duplicate,false);
 const later={...context,knownAt:'2026-11-19T07:01:00.000Z'};
 assert.deepEqual(await service.ingest(later),{id:first.id,duplicate:true});
 conn.exec('PRAGMA query_only=ON');
 const saved=await service.consume(first.id,later);
 assert.deepEqual(saved.plan.context,context);
 assert.equal(saved.facts.length,14);
 const metric=(key)=>saved.facts.find(f=>f.itemId===key);
 assert.equal(metric('BANK_REPORTED_CAR').value,'0.118');
 assert.equal(metric('BANK_REPORTED_CET1').value,'0.115');
 assert.equal(metric('BANK_LOAN_LOSS_RESERVES').value,'8153076000000');
 assert.equal(conn.prepare('SELECT value FROM protected_nav').get().value,1);
 conn.exec('PRAGMA query_only=OFF');
 for(const target of [proposal.id,approvalHash,first.id,metric('BANK_REPORTED_CAR').id]){
  conn.prepare('INSERT INTO source_admission_event VALUES(?,?,?)').run('test','REVOCATION',target);
  await assert.rejects(service.consume(first.id,context),/FINANCIAL_ADMISSION_REVOKED/);
  await assert.rejects(service.ingest(context),/FINANCIAL_ADMISSION_REVOKED/);
  conn.exec('DELETE FROM source_admission_event');
 }
 const bindingPath=folder.replace(/bank-admission$/,'dataset-binding');
 const requirementsPath=bindingPath+'/BANK_REQUIREMENTS_CANDIDATE.json';
 const requirements=put(requirementsPath,read(requirementsPath));
 const f1Path=bindingPath+'/F1_ISOLATED_RECEIPT.json';
 const f1=JSON.parse(read(f1Path));
 const f1Pin=put(f1Path,read(f1Path));
 copy(f1.raw);
 const sharesPath=folder+'/S4_ACB.json';
 const reviewPin=put(sharesPath,read(sharesPath));
 const shareReview=JSON.parse(read(sharesPath));
 for(const pin of [...shareReview.inventoryPins,...shareReview.reviewedPotentialEvents]){
  const {path,sha256}=pin;
  copy({path,sha256});
 }
 assert.equal(shareReview.shares.anchorEvidence.pdfSha256,catalog.documents.find(d=>d.id==='564804').sha256);
 assert.equal(shareReview.shares.anchorEvidence.outstandingCommonShares,shareReview.shares.value);
 assert.equal(f1.status,'PASS_F1_ADMITTED_CONSUMED_ISOLATED');
 const bindingContext={...context,knownAt:'2026-11-19T07:40:00.000Z'};
 assert.ok(f1.knownAt<=bindingContext.knownAt);
 assert.equal(f1.ticker,context.ticker);assert.equal(f1.securityId,context.securityId);
 assert.equal(shareReview.ticker,context.ticker);assert.equal(shareReview.cutoff,context.economicCutoff);
 const dependencies={
  requirements,
  market:async()=>({ticker:f1.ticker,securityId:f1.securityId,date:f1.date,
   value:f1.value,unit:f1.unit,field:'GiaDongCua',lineage:{receipt:f1Pin,raw:f1.raw,marketHash:f1.marketHash}}),
  shares:async()=>({ticker:shareReview.ticker,securityId:context.securityId,asOf:shareReview.cutoff,
   value:shareReview.shares.value,unit:'SHARES',status:shareReview.shares.status,
   lineage:{review:reviewPin,coverageComplete:shareReview.shares.coverageComplete,formalAdmission:false}}),
 };
 const binding=new CurrentBankFinancialDatasets(db,root,service,dependencies);
 const invalidCapital=JSON.parse(read(requirementsPath));
 invalidCapital.financial.find(f=>f.itemId==='BANK_REPORTED_CAR').scope='CONSOLIDATED';
 const invalidBinder=new CurrentBankFinancialDatasets(db,root,service,
  {...dependencies,requirements:put('wrong-capital-scope.json',invalidCapital)});
 await assert.rejects(invalidBinder.bind(first.id,bindingContext),/BANK_REQUIREMENT_SCOPE_OR_UNIT/);
 const wrongDateBinder=new CurrentBankFinancialDatasets(db,root,service,
  {...dependencies,shares:async()=>({...await dependencies.shares(),asOf:'2026-09-30'})});
 await assert.rejects(wrongDateBinder.bind(first.id,bindingContext),/BANK_S4_SHARES/);
 assert.equal(conn.prepare('SELECT count(*) n FROM current_financial_dataset').get().n,0);
 const dataset=await binding.bind(first.id,bindingContext);
 assert.equal(dataset.duplicate,false);
 assert.equal((await binding.bind(first.id,bindingContext)).duplicate,true);
 conn.exec('PRAGMA query_only=ON');
 const consumed=await binding.consume(dataset.id,bindingContext);
 assert.equal(consumed.datasetHash,dataset.datasetHash);
 assert.equal(consumed.facts.length,14);
 assert.equal(consumed.shares.value,'5804421957');
 assert.equal(consumed.price.value,'21000');
 for(const item of ['BANK_REPORTED_CAR','BANK_REPORTED_CET1']){
  const f=consumed.facts.find(f=>f.itemId===item);
  assert.equal(f.scope,'REGULATORY_CONSOLIDATED');
  assert.equal(f.period.end,'2026-06-30');
  assert.equal(f.evidence.unit,'RATIO');
 }
 await assert.rejects(binding.consume(dataset.id,{...bindingContext,ticker:'VNM'}),/BANK_DATASET_CONSUMPTION_SCOPE/);
 conn.exec('PRAGMA query_only=OFF');
 conn.prepare('INSERT INTO source_admission_event VALUES(?,?,?)').run('test','REVOCATION',first.id);
 await assert.rejects(binding.consume(dataset.id,bindingContext),/FINANCIAL_ADMISSION_REVOKED/);
 conn.exec('DELETE FROM source_admission_event');
 console.log(JSON.stringify({status:'PASS_ISOLATED_GOVERNED_BANK',approvalHash,admissionId:first.id,
  facts:saved.facts.length,rawCount:conn.prepare('SELECT count(*) n FROM current_financial_raw').get().n,
  checks:['proposed authorization rejected','wrong owner receipt rejected','ticker/security/cutoff rejected',
   'code tamper rejected','later retry retained initial clock','query-only readback','version/receipt/admission/fact revocation'],
  ownerReceipt:'SYNTHETIC_TEST_ONLY',productionAdmission:false,scoring:false,
  isolatedDataset:{id:dataset.id,datasetHash:dataset.datasetHash,manifest:dataset.manifest,
   readback:'PASS_QUERY_ONLY',datasetRevocationPropagation:true,officialDatasetHash:null}},null,2));
} finally{conn.close();rmSync(root,{recursive:true,force:true});}
