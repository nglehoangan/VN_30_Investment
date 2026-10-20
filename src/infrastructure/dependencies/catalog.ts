import {readFileSync,realpathSync} from 'node:fs';
import {resolve,sep} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import type {AcceptedDependencyCatalog} from '@/ports/dependencies';
import type {BoundaryStore} from '@/ports/market-boundary';
import type {Head,Resolution} from '@/domain/dependencies/contracts';
import {STATIC_CLASSES} from '@/domain/dependencies/contracts';
import {head,validateHeads} from '@/domain/dependencies/validation';
import type {Consumption,Sealed} from '@/domain/market-boundary/contracts';
import {requireBoundary as check,same} from '@/domain/market-boundary/validation';
import {snapshotHash as hash} from '@/infrastructure/fundamentals/snapshot-hash';
import {hashBytes} from '@/infrastructure/market-boundary/tcbs-pipeline';
import {retainedDependencyBootstrap} from '@/infrastructure/dependency-catalog';
import {verifyProductionAuthorityBundle,authorityBytes,type FilePin} from './production-authority';
/** Port-shaped staged validator: composition supplies existing lifecycle, not a client-request PASS function. */
export interface StagedLifecycle {
 analyze(a:Sealed<'ANALYSIS'>,r:Consumption):Promise<Sealed<'ANALYSIS'>>;
 publish(d:Sealed<'DECISION'>,r:Consumption):Promise<Sealed<'DECISION'>>;
}
export class LocalAcceptedDependencyCatalog implements AcceptedDependencyCatalog {
 constructor(private readonly root:string,private readonly originalStore:BoundaryStore,private readonly lifecycle:(stage:BoundaryStore)=>StagedLifecycle){}
 async readAccepted(){
  const config=JSON.parse(readFileSync(resolve(this.root,'src/infrastructure/dependencies/active-authorities.json'),'utf8')) as {version:string;bindings:{path:string;sha256:string}[];authorityBundle?:FilePin};check(config.version==='production-head-authorities-v1','AUTHORITY_CONFIG_VERSION');
  const authority=config.authorityBundle?verifyProductionAuthorityBundle(this.root,config.authorityBundle):null;
  const configured:Head[]=[];
  for(const binding of config.bindings){const file=realpathSync(resolve(this.root,binding.path));check(file.startsWith(realpathSync(this.root)+sep),'AUTHORITY_PATH_ESCAPE');const bytes=readFileSync(file);check(bytes.length<=4_000_000&&hashBytes(bytes)===binding.sha256,'AUTHORITY_RECEIPT_HASH');configured.push(JSON.parse(bytes.toString('utf8')) as Head);}
  check(new Set(configured.map(h=>h.type)).size===configured.length,'AMBIGUOUS_AUTHORITY_BINDING');
  const heads:Head[]=STATIC_CLASSES.every(type=>configured.some(h=>h.type===type))?[]:[...retainedDependencyBootstrap(this.root).heads];
  for(const h of configured){const index=heads.findIndex(old=>old.type===h.type);if(index<0)heads.push(h);else heads[index]=h;}
  if(authority){
   const bundlePin={id:authority.bundle.id,hash:authority.bundle.contentHash};
   for(const type of ['POLICY','RISK_POLICY','SCORING_MODEL'] as const)check(same((head(heads,type).content as {authorityBundle:unknown}).authorityBundle,bundlePin),'AUTHORITY_BUNDLE_HEAD_BINDING');
   const model=head(heads,'SCORING_MODEL').content as {methodology:unknown;implementationIdentity:string;executableAuthority:unknown;requirements:FilePin;requiredCanonicalItems:string[]};
   check(same(model.methodology,authority.methodology)&&model.implementationIdentity===authority.manifest.implementationId&&same(model.executableAuthority,{id:authority.executable.id,hash:authority.executable.contentHash})&&same(model.requirements,authority.bundle.requirements),'SCORING_MODEL_EXECUTABLE_INCOMPATIBLE');
   const requirements=JSON.parse(authorityBytes(this.root,model.requirements).toString('utf8')) as {sectors:Record<string,{CORE:{anyOf:string[]}[]}>};const routes=Object.values(requirements.sectors);
   const common=routes[0].CORE.filter(g=>g.anyOf.length===1&&routes.every(r=>r.CORE.some(h=>h.anyOf.length===1&&h.anyOf[0]===g.anyOf[0]))).map(g=>g.anyOf[0]);check(same(common,model.requiredCanonicalItems),'SCORING_MODEL_CANONICAL_REQUIREMENTS_INCOMPATIBLE');
  }
  const missing=STATIC_CLASSES.filter(t=>!heads.some(h=>h.type===t));check(!missing.length,'REQUIRES_AUTHORITY_RESOLUTION:'+missing.join(','));validateHeads(heads,hash);return heads;
 }
 async assertCurrent(heads:readonly Head[],at:string){
  check(same([...(await this.readAccepted())].sort((a,b)=>a.type.localeCompare(b.type)),[...heads].sort((a,b)=>a.type.localeCompare(b.type))),'AUTHORITATIVE_HEAD_SUPERSEDED');
  const active=JSON.parse(readFileSync(resolve(this.root,'src/infrastructure/fundamentals/active-level1-release.json'),'utf8')) as {id:string;bodyHash:string};
  check(same(head(heads,'LEVEL1_RELEASE').pin,{id:active.id,hash:active.bodyHash}),'AUTHORITATIVE_FUNDAMENTAL_RELEASE_SUPERSEDED');
  check(heads.every(h=>h.effectiveFrom<=at&&h.recordedAt<=at),'PIT_HEAD_UNAVAILABLE');
  const db=new DatabaseSync(resolve(this.root,'data/vn30.sqlite'),{readOnly:true});
  try{
   const runs=head(heads,'FUNDAMENTALS').content as {id:string;bodyHash:string;ticker:string}[];
   const model=head(heads,'SCORING_MODEL').content as {requiredCanonicalItems?:string[];requiredDerivedMetrics?:string[];requirements?:FilePin};
   const requirements=model.requirements?JSON.parse(authorityBytes(this.root,model.requirements).toString('utf8')) as {sectors:Record<string,{CORE:{anyOf:string[]}[];SECTOR_CORE:{anyOf:string[]}[]}>}:null;
   const sectors=(head(heads,'REFERENCE_DATA').content as {sectors:{ticker:string;sector:string}[]}).sectors;
   check(Array.isArray(model.requiredCanonicalItems)&&model.requiredCanonicalItems.length>0,'MISSING_APPROVED_MODEL_REQUIREMENTS');
   const level=head(heads,'LEVEL1_RELEASE').content as {partition:{members:{ticker:string;state:string}[]}};
   for(const run of runs){const row=db.prepare('SELECT body,body_hash FROM fundamental_admission_run WHERE id=?').get(run.id) as {body:string;body_hash:string}|undefined;check(row&&row.body_hash===run.bodyHash&&hashBytes(row.body)===run.bodyHash,'FUNDAMENTAL_HEAD_HASH_MISMATCH');
    if(level.partition.members.find(m=>m.ticker===run.ticker)?.state==='SCORABLE'){
     const d=JSON.parse(row.body) as {canonicalFacts:{itemId:string;value:string|null}[];derivedMetrics:{metric:string;status:string}[]};
     if(requirements){const sector=sectors.find(s=>s.ticker===run.ticker)?.sector,route=sector?requirements.sectors[sector]:null;check(route&&[...route.CORE,...route.SECTOR_CORE].every(g=>g.anyOf.some(item=>d.canonicalFacts.some(f=>f.itemId===item&&f.value!==null))),'SCORING_MODEL_SECTOR_REQUIREMENTS_INCOMPATIBLE');}
     check(model.requiredCanonicalItems.every(item=>d.canonicalFacts.some(f=>f.itemId===item&&f.value!==null))&&(model.requiredDerivedMetrics??[]).every(metric=>d.derivedMetrics.some(m=>m.metric===metric&&m.status==='AVAILABLE')),'SCORING_MODEL_CANONICAL_REQUIREMENTS_INCOMPATIBLE');
    }
   }
   const portfolio=heads.find(h=>h.type==='PORTFOLIO');if(portfolio){const p=portfolio.content as Sealed<'PORTFOLIO'>;check(portfolio.ownerId,'MISSING_PORTFOLIO_OWNER');const row=db.prepare('SELECT revision FROM portfolio WHERE id=?').get(portfolio.ownerId) as {revision:string}|undefined;check(row?.revision===p.body.ledgerWatermark,'PORTFOLIO_CHANGED');}
  }finally{db.close();}
 }
 private stage(){const captured=new Map<string,Sealed>();const store:BoundaryStore={find:(p,k)=>this.originalStore.find(p,k),append:async r=>{check(r.kind==='ANALYSIS','UNEXPECTED_STAGED_WRITE');captured.set(r.id,r);},sealDecision:async r=>{captured.set(r.id,r);},sealRanking:async()=>{throw Error('RANKING_NOT_ENABLED');}};return {store,captured};}
 async validateAnalysis(a:Sealed<'ANALYSIS'>,_r:Resolution,request:Consumption){const stage=this.stage(),result=await this.lifecycle(stage.store).analyze(a,request);check(stage.captured.has(result.id),'LIFECYCLE_DID_NOT_VALIDATE');return result;}
 async validateDecision(d:Sealed<'DECISION'>,_r:Resolution,request:Consumption){const stage=this.stage(),result=await this.lifecycle(stage.store).publish(d,request);check(stage.captured.has(result.id),'LIFECYCLE_DID_NOT_VALIDATE');return result;}
}
