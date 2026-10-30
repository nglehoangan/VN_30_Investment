import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { chromium, expect } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
const server=createServer();server.listen(0,'127.0.0.1');await once(server,'listening');const port=server.address().port;await new Promise(r=>server.close(r));
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],{stdio:['ignore','pipe','pipe'],env:{...process.env,DATABASE_URL:'file:'+path.resolve('data/vn30.sqlite'),NEXT_TELEMETRY_DISABLED:'1',VN30_MARKET_CANDIDATE_ENABLED:'0'}});child.stdout.on('data',()=>{});child.stderr.on('data',()=>{});
let browser;
try{const url='http://127.0.0.1:'+port;let ready=false;for(let i=0;i<100;i++){try{if((await fetch(url+'/holdings')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,500));}if(!ready)throw Error('START_FAILED');
 browser=await chromium.launch({headless:true});const page=await browser.newPage();const checks=[];
 for(const width of [1440,390]){await page.setViewportSize({width,height:1000});await page.goto(url+'/holdings');const region=page.getByRole('region',{name:'Danh mục cá nhân · dữ liệu đã xác nhận'});await expect(region.getByRole('row')).toHaveCount(12);const fpt=region.getByRole('row').filter({has:page.getByRole('cell',{name:'FPT',exact:true})});const cells=await fpt.getByRole('cell').allTextContents();if(cells[6]!=='2026-10-28'||cells[7]!=='54.000'||cells[9]!=='-4.185.060')throw Error('FRESH_PRICE_OR_IMPORTED_BASIS_PNL_MISSING');checks.push({width,status:'PASS',tradingDate:cells[6],fptPrice:cells[7]});}
 await page.goto(url+'/dashboard');const board=page.getByRole('region',{name:'Bảng giá VN30 từ TCBS'});await expect(board).toContainText('2026-10-28');await expect(board).toContainText('54.000');
 writeFileSync('docs/fundamental-data-engine/evidence/2026-10-29-direct-api-dashboard/BROWSER_RESULT.json',JSON.stringify({status:'PASS',checks,marketBoard:'PASS',dataFilesOrScreenshotsWritten:0,operations:'read-only navigation; no broker network or posting'},null,2));console.log('PASS direct SQLite prices on holdings desktop/mobile and dashboard board.');
}finally{await browser?.close();child.kill('SIGTERM');await once(child,'exit');}
