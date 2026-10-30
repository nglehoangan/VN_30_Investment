import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { writeFileSync } from 'node:fs';
import { chromium, expect } from '@playwright/test';
const output='docs/fundamental-data-engine/evidence/2026-10-28-b1-b5-runtime-integration/';
if (!process.env.VN30_OWNER_VALIDATION_DB) throw Error('EXPLICIT_VALIDATION_COPY_REQUIRED');
const probe=createServer();probe.listen(0,'127.0.0.1');await once(probe,'listening');const port=probe.address().port;await new Promise(r=>probe.close(r));
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],{stdio:['ignore','pipe','pipe'],env:{...process.env,DATABASE_URL:'file:'+process.env.VN30_OWNER_VALIDATION_DB,NEXT_TELEMETRY_DISABLED:'1',VN30_MARKET_CANDIDATE_ENABLED:'0',VN30_BROKER_SNAPSHOT_FILE:'',VN30_CURRENT_SOURCE_FILE:'/private/tmp/vn30-owner-b1-b5/no-current-source.json'}});
// No raw server diagnostics or private page text is written to evidence.
child.stdout.on('data',()=>{});child.stderr.on('data',()=>{});
let browser;
try {
 const url=`http://127.0.0.1:${port}`;let ready=false;
 for(let i=0;i<120;i++){try{if((await fetch(url+'/holdings')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,500));}
 if(!ready)throw Error('LOCAL_VALIDATION_START_FAILED');
 browser=await chromium.launch({headless:true});const page=await browser.newPage();const results=[];
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:1000});await page.goto(url+'/holdings');
  const section=page.getByRole('region',{name:'Danh mục cá nhân · dữ liệu đã xác nhận'});
  // Panel is a named section and therefore an accessible region.
  await section.waitFor();const text=await section.innerText();
  for(const expected of ['327.420','475.000','12.479.752','420','2026-10-28','16.065.060'])if(!text.includes(expected))throw Error('OWNER_VALUE_NOT_RENDERED');
  if(await section.getByRole('row').count()!==12)throw Error('OWNER_HOLDINGS_COUNT');
  const fpt=section.getByRole('row').filter({has:page.getByRole('cell',{name:'FPT',exact:true})});const cells=await fpt.getByRole('cell').allTextContents();if(cells[2]!=='220'||cells[3]!=='200'||cells[4]!=='20')throw Error('FPT_SPLIT_NOT_PRESERVED');
  if(await page.getByRole('heading',{name:'Authoritative holdings',exact:true}).count())throw Error('STALE_LEDGER_AS_CURRENT');
  await page.screenshot({path:`/private/tmp/vn30-owner-b1-b5/holdings-${width}.png`,fullPage:true});results.push({width,status:'PASS',holdings:11,fptOwned:'220',fptTradable:'200',fptPending:'20'});
 }
 await page.goto(url+'/holdings/FPT');const details=page.getByRole('region',{name:'Danh mục cá nhân · dữ liệu đã xác nhận'});await expect(details.getByRole('row')).toHaveCount(2);
 writeFileSync(output+'BROWSER_OWNER_RESULT.json',JSON.stringify({status:'PASS',scope:'Actual account data on private SQLite backup; read-only browser navigation',viewports:results,holdingDetail:'PASS',privateScreenshots:'Temporary only; do not commit or publish',productionActionabilityGranted:false},null,2));console.log('PASS owner holdings1440/390 and FPT detail; no postings or original database access by server.');
}finally{await browser?.close();child.kill('SIGTERM');await once(child,'exit');}
