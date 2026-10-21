import './lib/ts-runtime.mjs';
import {mkdirSync,writeFileSync,readFileSync,existsSync,renameSync} from 'node:fs';
import {resolve,relative} from 'node:path';
const {buildTcbsPipeline,replayTcbsPipeline,PIPELINE_VERSION}=await import('../src/infrastructure/market-boundary/tcbs-pipeline.ts');
const {canonicalJson}=await import('../src/domain/fundamentals/snapshot.ts');
const {snapshotHash}=await import('../src/infrastructure/fundamentals/snapshot-hash.ts');
const {latestCompletedHoseSession}=await import('../src/domain/market-boundary/completed-session.ts');
const {HOSE_HOLIDAYS_2026}=await import('../src/domain/market-boundary/hose-calendar.ts');
const {instant}=await import('../src/shared/time.ts');
const root=process.cwd(),arg=name=>process.argv.find(a=>a.startsWith('--'+name+'='))?.slice(name.length+3);
if(arg('replay')){
 const c=JSON.parse(readFileSync(resolve(root,arg('replay')),'utf8'));replayTcbsPipeline(root,c);console.log(JSON.stringify({status:'PASS_REPLAY',version:PIPELINE_VERSION,capability:c.technicalCapability,initialization:c.initializationCandidate,independentAcceptance:c.independentAcceptance}));
}else{
 if(!arg('capture')||!arg('board'))throw Error('Explicit --capture= and --board= required; no latest-wins selection');
 const builtAt=new Date().toISOString();
 const target=latestCompletedHoseSession(builtAt,{version:'hose-calendar-2026-v1',validFrom:'2026-01-01',validThrough:'2026-12-31',holidayDates:HOSE_HOLIDAYS_2026});
 const boardManifest=JSON.parse(readFileSync(resolve(root,arg('board'),'manifest.json'),'utf8'));
 const requests=boardManifest.requests.filter(r=>r.apiId==='5.3');
 if(requests.length!==1||!requests[0].rawPath||/[/\\]/.test(requests[0].rawPath))throw Error('MARKET_BOUNDARY:BOARD_CAPTURE_REQUIRED');
 const request=requests[0],board=JSON.parse(readFileSync(resolve(root,arg('board'),request.rawPath),'utf8'));
 instant(request.startedAt);instant(request.retrievedAt);
 if(board.tradingDate!==target.split('-').reverse().join('/'))throw Error('MARKET_BOUNDARY:COMPLETED_SESSION_BOARD_EVIDENCE_MISSING:'+target);
 if(request.startedAt<target+'T08:00:00.000Z'||request.retrievedAt<request.startedAt||request.retrievedAt>builtAt)throw Error('MARKET_BOUNDARY:BOARD_NOT_CAPTURED_AFTER_SESSION_COMPLETION');
 const candidate=buildTcbsPipeline(root,{captureFolder:arg('capture'),boardFolder:arg('board'),builtAt});
 replayTcbsPipeline(root,candidate);
 const folder=resolve(root,'data/market-boundary/candidates',snapshotHash(candidate));mkdirSync(folder,{recursive:true,mode:0o700});
 const path=resolve(folder,'candidate.json'),text=canonicalJson(candidate)+'\n';if(existsSync(path)){if(readFileSync(path,'utf8')!==text)throw Error('IMMUTABLE_CANDIDATE_CONFLICT');}else writeFileSync(path,text,{flag:'wx',mode:0o600});
 if(process.argv.includes('--bind-candidate')){
  const binding={version:'tcbs-active-candidate-v1',path:relative(root,path),sha256:snapshotHash(candidate),independentAcceptance:'PENDING_INDEPENDENT_REVIEW'};
  const target=resolve(root,'data/market-boundary/active-candidate.json'),temp=target+'.tmp';writeFileSync(temp,JSON.stringify(binding,null,2)+'\n',{mode:0o600});renameSync(temp,target);
 }
 console.log(JSON.stringify({status:'PASS_BUILD_AND_REPLAY',path:relative(root,path),sourceFiles:candidate.sourcePins.length,observations:candidate.market.body.observations.length,capability:candidate.technicalCapability,initialization:candidate.initializationCandidate,financialFreshness:candidate.financialFreshness.filter(f=>f.status!=='CURRENT'),marketFreshnessCandidate:candidate.freshness.status,independentAcceptance:candidate.independentAcceptance,readyForScoring:false}));
}
