// Standalone SQLite rehearsal. Source authority and F1/share ports are fixture-only.
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {execFileSync} from 'node:child_process';
import {registerHooks} from 'node:module';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {existsSync,mkdtempSync,readFileSync,statSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
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
  if(url.startsWith(pathToFileURL(resolve('src')+'/').href)&&url.endsWith('.json')&&!context.importAttributes?.type&&!(statSync(new URL(url)).st_flags&0x40000000)){
   return {format:'module',source:'export default '+readFileSync(new URL(url),'utf8'),shortCircuit:true};
  }
  return next(url,context);
 },
});
const load=p=>import(pathToFileURL(resolve(p)));
const {CurrentBankScoringConsumer}=await load('src/infrastructure/source-admission/current-bank-scoring.ts');
const {CurrentFinancialDatasets}=await load('src/infrastructure/source-admission/current-dataset.ts');
const dir=mkdtempSync(join(tmpdir(),'acb-bank-rehearsal-'));
const conn=new DatabaseSync(join(dir,'test.sqlite'));
try {
 const db={
  $queryRawUnsafe:async (sql,...args)=>conn.prepare(sql).all(...args),
  $executeRawUnsafe:async (sql,...args)=>conn.prepare(sql).run(...args),
  $transaction:async callback=>{conn.exec('BEGIN');try{const result=await callback(db);conn.exec('COMMIT');return result;}catch(error){conn.exec('ROLLBACK');throw error;}}
 };
 for (const name of ['current-financial-dataset-v1','current-financial-enrichment-v1','current-scoring-data-acceptance-v1','current-scoring-artifact-v1'])
 {
  const path='prisma/proposals/'+name+'.sql';
  const placeholder=(statSync(path).st_flags??0)&0x40000000;
  conn.exec(placeholder?execFileSync('git',['show','HEAD:'+path],{encoding:'utf8'}):readFileSync(path,'utf8'));
 }
 conn.exec('CREATE TABLE source_admission_event (id TEXT,kind TEXT,target_id TEXT); CREATE TABLE protected_nav (value INTEGER); INSERT INTO protected_nav VALUES(1)');
 const context={ticker:'ACB',securityId:'658fafbe-65b3-4176-999f-d4d32e1bd838',economicCutoff:'2026-10-30',knownAt:'2026-11-19T05:00:00.000Z',purpose:'CURRENT_FORMAL_VALUATION'};
 const handoff=JSON.parse(readFileSync('docs/fundamental-data-engine/acb-scoring-readiness/2026-11-19/remediation/ACB_BANK_HANDOFF.json','utf8'));
 const pin={path:'bank-requirements.json',sha256:''};
 const chosen=handoff.q3.facts.filter(f=>f.periodStart!=='2026-07-01');
 const sourceRows=[...chosen,{concept:'BANK_REPORTED_CAR',periodStart:'2026-06-30',periodEnd:'2026-06-30',valueVnd:'0.118'}];
 const scope='CONSOLIDATED',vintage='ISOLATED_ACB_FIXTURE',sha='a'.repeat(64),asOf='2026-10-30T23:59:59.999Z';
 const facts=sourceRows.map((f,i)=>{
  const id='test-fact:'+i,itemId=f.concept,period={start:f.periodStart,end:f.periodEnd};
  return {id,itemId,ticker:'ACB',period,scope,vintage,unit:itemId==='BANK_REPORTED_CAR'?'RATIO':'VND',value:f.valueVnd,raw:{path:'isolated',sha256:sha},
   evidence:{id,version:'standing-financial-current-v1',securityId:context.securityId,observation:itemId,value:f.valueVnd,unit:itemId==='BANK_REPORTED_CAR'?'RATIO':'VND',classification:'FACT',source:'Isolated pre-admitted fixture',
    periodStart:period.start,periodEnd:period.end,asOf,publishedAt:null,receivedAt:context.knownAt,validThrough:asOf,critical:true,quality:'VALID',family:'FINANCIAL',
    time:{contract:'current-formal-evidence-time-v1',purpose:context.purpose,policyVersion:'standing-financial-current-v1',policyHash:sha,authorizationReference:'test',rawHash:sha,qualificationReference:'test',originalReceivedAt:context.knownAt,reviewedAt:context.knownAt,ingestedAt:context.knownAt,availableAt:context.knownAt}}};
 });
 const id='fixture-admission';
 conn.prepare('INSERT INTO current_financial_admission VALUES(?,?,?,?,?,?,?)').run(id,'ACB',context.securityId,context.economicCutoff,context.knownAt,'{}',sha);
 const body=JSON.stringify({contract:'current-financial-dataset-requirements-v1',version:'isolated',fullM3CoverageCertified:false,requirePrice:true,requireShares:true,policyReferences:[],financial:facts.map(({itemId,period})=>({itemId,scope,vintage,...period}))});
 pin.sha256=createHash('sha256').update(body).digest('hex');
 writeFileSync(join(dir,pin.path),body);
 const admission={consume:async (key,c)=>{assert.equal(key,id);assert.equal(c.ticker,'ACB');return {plan:{isolated:true},facts};}};
 const price={ticker:'ACB',securityId:context.securityId,date:context.economicCutoff,field:'GiaDongCua',unit:'VND_PER_SHARE',value:'21000',lineage:{fixture:true}};
 const shares={ticker:'ACB',securityId:context.securityId,asOf:context.economicCutoff,unit:'SHARES',status:'CARRIED_FORWARD_NO_CHANGE_FOUND_IN_REVIEWED_DOCUMENTS',value:'5804421957',lineage:{fixture:true}};
 const native=new CurrentFinancialDatasets(db,dir,admission,{requirements:pin,market:async()=>price,shares:async()=>shares});
 const consumer=new CurrentBankScoringConsumer(db,native,{...context,sector:'BANK',cutoff:context.economicCutoff});
 const first=await native.bind(id,context);
 assert.equal((await native.bind(id,context)).duplicate,true);
 const ref=await consumer.bind(first.id,context);
 assert.deepEqual(ref,await consumer.bind(first.id,context));
 await assert.rejects(consumer.resolve(ref,context),/BANK_DATA_ACCEPTANCE_REQUIRED/);
 const materialized=await consumer.materialize(ref,context);
 assert.deepEqual(materialized,await consumer.materialize(ref,context));
 assert.deepEqual(materialized,await consumer.resolve(ref,context));
 assert.equal(materialized.readyForScoring,false);
 assert.deepEqual(materialized.facts.map(f=>f.itemId),facts.map(f=>f.itemId));
 for (const changed of [{ticker:'VNM'},{securityId:'foreign'},{economicCutoff:'2026-10-29'}])
  await assert.rejects(consumer.resolve(ref,{...context,...changed}),/BANK_DATASET_IDENTITY/);
 assert.equal(conn.prepare('SELECT count(*) as n FROM current_scoring_data_acceptance').get().n,1);
 assert.equal(conn.prepare('SELECT count(*) as n FROM current_score_artifact').get().n,0);
 assert.equal(conn.prepare('SELECT value FROM protected_nav').get().value,1);
 conn.prepare('INSERT INTO source_admission_event VALUES(?,?,?)').run('revoke','REVOCATION',ref.bindingId);
 await assert.rejects(consumer.resolve(ref,context),/FINANCIAL_ADMISSION_REVOKED/);
 console.log('PASS native dataset binding, BANK acceptance, idempotency, readback, cross-scope rejection, revocation and protected NAV');
} finally {conn.close();rmSync(dir,{recursive:true,force:true});}
