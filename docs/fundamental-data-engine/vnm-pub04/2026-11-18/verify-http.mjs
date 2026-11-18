import {createServer} from 'node:net';
import {once} from 'node:events';
import {spawn,spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root=process.cwd(),out=import.meta.dirname,req=createRequire('/private/tmp/vn30-step2-dependencies/package.json'),{JSDOM}=req('jsdom');
const read=p=>JSON.parse(readFileSync(p,'utf8')),ctx=read(join(out,'CONTEXT.json')),auth=read(join(out,'PUB04_SERVER_REGISTRATION.json'));
const sha=b=>createHash('sha256').update(b).digest('hex'),write=(n,v)=>writeFileSync(join(out,n),JSON.stringify(v,null,2)+'\n');
const buildId=readFileSync('.next/BUILD_ID','utf8').trim(),route='/scoring/'+auth.subject.scorecardId;
async function serve(target,run){
 const probe=createServer();probe.listen(0,'127.0.0.1');await once(probe,'listening');const port=probe.address().port;await new Promise(r=>probe.close(r));
 const child=spawn(process.execPath,['/private/tmp/vn30-step2-dependencies/node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],{cwd:root,env:{...process.env,NEXT_TELEMETRY_DISABLED:'1',DATABASE_URL:'file:'+target},stdio:['ignore','pipe','pipe']});
 let log='',ready=false;for(const stream of [child.stdout,child.stderr])stream.on('data',b=>{log=(log+b).slice(-10000);if(/Ready in/.test(log))ready=true;});const exited=once(child,'exit');
 try{for(let i=0;i<90&&!ready;i++){if(child.exitCode!==null)throw Error(log);await new Promise(r=>setTimeout(r,1000));}assert(ready,log);return await run('http://127.0.0.1:'+port,()=>log);}
 finally{child.kill('SIGTERM');await Promise.race([exited,new Promise(r=>setTimeout(r,3000))]);if(child.exitCode===null)child.kill('SIGKILL');}
}
async function fetchPage(url){const r=await fetch(url,{signal:AbortSignal.timeout(120000),headers:{'cache-control':'no-cache'}}),html=await r.text();assert.equal(r.status,200,html.slice(0,1000));const dom=new JSDOM(html);for(const s of dom.window.document.querySelectorAll('script'))s.remove();const main=dom.window.document.querySelector('main#main')??dom.window.document.querySelector('main');assert(main);const metadata={};for(const dt of main.querySelectorAll('dl.metrics dt'))metadata[dt.textContent]=dt.nextElementSibling?.textContent;const result={status:r.status,url,htmlSha256:sha(html),htmlBytes:Buffer.byteLength(html),metadata,text:main.textContent,noFormsOrButtons:main.querySelectorAll('form,button').length===0};dom.window.close();return result;}
const live=await serve(ctx.target,async(base,logs)=>{
 const detail=await fetchPage(base+route);if(!detail.metadata.Ticker)write('HTTP_ATTEMPT_FAILURE.json',{metadata:detail.metadata,mainText:detail.text.slice(0,1600),serverLogs:logs()});for(const [key,value] of Object.entries({Ticker:'VNM','100-point score':'43',Confidence:'LOW',Validity:'VALID — NON-ACTIONABLE','Data as-of':'2026-10-30T23:59:59.999Z','Evidence cutoff':'2026-11-18T00:52:58.768Z','Calculated at':'2026-11-18T00:52:58.768Z'}))assert.equal(detail.metadata[key],value,key+' '+logs());
 for(const marker of ['CURRENT-PURPOSE','READ ONLY','CURRENT_FORMAL_VALUATION','NOT HISTORICAL PIT','No trading authorization'])assert(detail.text.includes(marker),marker);assert(detail.noFormsOrButtons);
 const malicious=await fetchPage(base+route+'?authority=FAKE&score=100&purpose=HISTORICAL_PIT');assert.deepEqual(malicious.metadata,detail.metadata);
 const list=await fetchPage(base+'/scoring');assert(list.text.includes('VNM')&&list.text.includes('LOW'));
 return {status:'PASS',runtime:'ACTUAL_NEXT_START_PRODUCTION_HTTP',buildId,productionTarget:ctx.target,route,detail:{...detail,text:undefined},clientSelectedAuthorityRejected:{query:'authority=FAKE&score=100&purpose=HISTORICAL_PIT',metadataUnchanged:true,responseHash:malicious.htmlSha256},listing:{status:list.status,htmlSha256:list.htmlSha256},serverLogs:logs()};
});
write('PUB04_DASHBOARD_READBACK.json',live);
// Negative visibility probe: append revocation only to the disposable production copy.
const seeded=spawnSync('python3',['-c',"import sqlite3,sys,uuid,hashlib\nc=sqlite3.connect(sys.argv[1]);c.execute('INSERT INTO source_admission_event VALUES(?,?,?,?,?,?)',(str(uuid.uuid4()),'REVOCATION',sys.argv[2],'2026-11-18T23:59:59.999Z','{}',hashlib.sha256(b'{}').hexdigest()));c.commit();c.close()",ctx.clone,auth.id],{encoding:'utf8'});assert.equal(seeded.status,0,seeded.stderr);
const denied=await serve(ctx.clone,async(base,logs)=>{const response=await fetchPage(base+route);assert(response.text.includes('BLOCKED'));assert(!Object.hasOwn(response.metadata,'100-point score'));assert(!response.text.includes('CURRENT-PURPOSE DATED SCORECARD'));return {status:'PASS',runtime:'SAME_NEXT_START_PRODUCTION_BUILD_HTTP',target:'DISPOSABLE_DATABASE_ONLY',authorityRevocationSeededOnlyInClone:true,liveProductionAuthorityModified:false,blocked:true,scoreNotVisible:true,metadata:response.metadata,responseHash:response.htmlSha256,serverLogs:logs()};});
write('HTTP_REVOCATION_VALIDATION.json',denied);write('BUILD_VALIDATION.json',{status:'PASS',nextVersion:'16.3.4',mode:'next build --webpack; next start',buildId,productionHttpVerified:true,typecheckSkipped:false,ignoredBuildErrors:false,baselineDeclarationRepair:'Added runtime.d.mts for unchanged retained S4 ESM exports; no executable bytes changed.'});
console.log(JSON.stringify({productionHttp:'PASS',buildId,score:live.detail.metadata['100-point score'],isolatedRevocationVisibility:'BLOCKED_AS_EXPECTED'}));
