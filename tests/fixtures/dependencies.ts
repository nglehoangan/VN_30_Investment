import {readFileSync} from 'node:fs';
import {retainedDependencyBootstrap} from '@/infrastructure/dependency-catalog';
import {snapshotHash as hash} from '@/infrastructure/fundamentals/snapshot-hash';
import {seal,reference,same,requireBoundary} from '@/domain/market-boundary/validation';
import {marketFreshness} from '@/domain/market-boundary/freshness';
import {boundary,head} from '@/domain/dependencies/validation';
import type {Head,Resolution} from '@/domain/dependencies/contracts';
import type {TcbsPipelineCandidate} from '@/infrastructure/market-boundary/tcbs-pipeline';
import type {AcceptedDependencyCatalog} from '@/ports/dependencies';
import type {SessionPolicy,Sealed} from '@/domain/market-boundary/contracts';
/** Real retained identity/partition corpus plus explicitly SYNTHETIC methodology authority for tests only. */
export function dependencyFixture(){
 const binding=JSON.parse(readFileSync('data/market-boundary/active-candidate.json','utf8')),c=JSON.parse(readFileSync(binding.path,'utf8')) as TcbsPipelineCandidate;
 const at=c.input.builtAt,heads:Head[]=retainedDependencyBootstrap(process.cwd()).heads.filter(h=>h.type!=='DECISION_ENGINE');
 const add=(type:Head['type'],content:unknown,requires:Head['requires']=[],contract='synthetic-test-v1')=>{const h:Head={type,pin:{id:'synthetic-'+type,hash:hash(content)},contract,content,scheme:'JSON',effectiveFrom:at,recordedAt:at,status:'ACCEPTED',sourceReference:'SYNTHETIC_TEST_ONLY',authorityReference:'SYNTHETIC_TEST_ONLY',requires};heads.push(h);return h;};
 const policy=add('POLICY','synthetic-policy'),model=add('SCORING_MODEL',{requiredCanonicalItems:['TOTAL_ASSETS'],implementationIdentity:'synthetic-analysis-engine-v1'},[{type:'POLICY',pin:policy.pin}]);add('DECISION_ENGINE','synthetic-engine',[{type:'POLICY',pin:policy.pin}],'synthetic-engine-v1');const risk=add('RISK_POLICY','synthetic-risk',[{type:'POLICY',pin:policy.pin}]);add('RISK_STATE','synthetic-risk-state',[{type:'RISK_POLICY',pin:risk.pin}]);
 heads.push({type:'MARKET',pin:reference(c.market),contract:c.market.contractVersion,content:c.market,scheme:'BOUNDARY',effectiveFrom:at,recordedAt:at,status:'ACCEPTED',sourceReference:'RETAINED_REAL_CAPTURE_TEST_BINDING',authorityReference:'SYNTHETIC_TEST_ONLY',requires:[]});
 let active=heads,now=at,beforeValidate=async()=>{};
 const clock={now:()=>now as ReturnType<import('@/ports/runtime').Clock['now']>};
 const catalog:AcceptedDependencyCatalog={readAccepted:async()=>active,assertCurrent:async h=>{requireBoundary(same([...h].sort((a,b)=>a.type.localeCompare(b.type)),[...active].sort((a,b)=>a.type.localeCompare(b.type))),'AUTHORITATIVE_HEAD_SUPERSEDED');},validateAnalysis:async a=>{await beforeValidate();return a;},validateDecision:async d=>{await beforeValidate();return d;}};
 function analysis(resolution:Resolution,id='synthetic-analysis'){
  const i=boundary(resolution.heads,'INITIALIZATION','INITIALIZATION',hash),market=boundary(resolution.heads,'MARKET','MARKET',hash),p=head(resolution.heads,'SESSION_POLICY').content as SessionPolicy;
  const ev=(h:Head)=>({...h.pin,knownAt:at,effectiveAt:at});
  const request={mode:'LIVE' as const,now,requestedAt:now,knownAt:now,purpose:resolution.purpose,securityIds:i.body.members.filter(m=>m.state==='SCORABLE').map(m=>m.securityId),universe:i.body.universe};
  return seal('ANALYSIS',id,now,now,{initialization:reference(i),fundamentals:i.body.fundamentals,universe:i.body.universe,market:reference(market),marketRequirement:'REQUIRED',purpose:resolution.purpose,analysisTimestamp:now,members:i.body.members,exceptions:i.body.exceptions,sourceHashes:market.body.sources.map(s=>({id:s.id,hash:s.hash})),inputArtifacts:[],freshness:marketFreshness(market,c.capability,p,request,hash),policy:ev(policy),scoringModel:ev(model),engineVersion:'synthetic-analysis-engine-v1',prerequisiteProof:ev(risk)},hash);
 }
 return {c,heads,catalog,clock,at,setHeads:(h:Head[])=>{active=h;},setNow:(n:string)=>{now=n;},beforeValidate:(fn:()=>Promise<void>)=>{beforeValidate=fn;},analysis};
}
export function portfolioHead(f:ReturnType<typeof dependencyFixture>,ownerId:string,watermark='0'):Head {
 const p=seal('PORTFOLIO','synthetic-portfolio-'+watermark,f.at,f.at,{portfolioSnapshotId:'synthetic-snapshot-'+watermark,portfolioAsOf:f.at,ledgerWatermark:watermark,cash:'0',positionsHash:hash([]),costBasisHash:hash([]),pendingTransactionsHash:hash([]),navInputs:[],accountingVersion:'test-only'},hash);
 return {type:'PORTFOLIO',pin:reference(p),content:p,scheme:'BOUNDARY',contract:p.contractVersion,ownerId,effectiveFrom:f.at,recordedAt:f.at,status:'ACCEPTED',sourceReference:'SYNTHETIC_TEST_ONLY',authorityReference:'SYNTHETIC_TEST_ONLY',requires:[]};
}
export function changedFundamentalHeads(heads:readonly Head[],at:string){
 const next=structuredClone(heads) as Head[],f=head(next,'FUNDAMENTALS'),content=structuredClone(f.content) as {id:string}[];content[0].id+=':synthetic-new-run';const nf={...f,pin:{id:f.pin.id+':next',hash:hash(content)},content};next[next.indexOf(f)]=nf;
 const l=head(next,'LEVEL1_RELEASE'),level=structuredClone(l.content) as {id:string;dispositions:{canonicalRunId:string}[]};level.id+=':synthetic-next';level.dispositions=level.dispositions.map(d=>d.canonicalRunId===(f.content as {id:string}[])[0].id?{...d,canonicalRunId:content[0].id}:d);const nl={...l,pin:{id:level.id,hash:hash(level)},content:level};next[next.indexOf(l)]=nl;
 const i=head(next,'INITIALIZATION'),old=i.content as Sealed<'INITIALIZATION'>,init=seal('INITIALIZATION',old.id+':next',at,at,{...old.body,fundamentals:{...old.body.fundamentals,...nf.pin},dispositions:{...old.body.dispositions,id:level.id,hash:hash(level.dispositions)}},hash);next[next.indexOf(i)]={...i,pin:reference(init),content:init};return next;
}
