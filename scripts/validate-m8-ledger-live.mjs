/** Actual local production-build browser review. GET-only, no fixtures or DB mutations. */
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {chromium} from '@playwright/test';
import {writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const base='http://127.0.0.1:38417';
const out='docs/fundamental-data-engine/evidence/2026-10-24-m8-ledger-compatibility-remediation';
const listener=execFileSync('/usr/sbin/lsof',['-nP','-iTCP:38417','-sTCP:LISTEN','-Fpn'],{encoding:'utf8'});
if(!listener.includes('n127.0.0.1:38417')||listener.split('\n').some(x=>x.startsWith('n')&&x!=='n127.0.0.1:38417'))throw Error('NON_LOOPBACK_LISTENER');
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1050}});
const blockedRequests=[];const pageErrors=[];let rows=[];
await context.route('**/*',async route=>{
 const r=route.request(),u=new URL(r.url());
 if(u.origin!==base||!['GET','HEAD'].includes(r.method())){blockedRequests.push({method:r.method(),external:u.origin!==base});return route.abort();}
 return route.continue();
});
const page=await context.newPage();page.on('pageerror',e=>pageErrors.push(e.message.slice(0,400)));
try{
 for(const path of ['/','/holdings','/transactions','/performance','/vn30','/data','/scoring','/ranking','/decisions','/reviews','/journal','/audit','/dca','/risk','/settings','/imports','/transactions/new','/reviews/new']){
  const response=await page.goto(base+path,{waitUntil:'networkidle',timeout:45000});
  const r=await page.evaluate(()=>({
   h1:document.querySelector('main h1')?.textContent,
   headings:[...document.querySelectorAll('main h2, main h3')].map(x=>x.textContent),
   statuses:[...document.querySelectorAll('main [role="status"]')].map(x=>x.textContent),
   alerts:[...document.querySelectorAll('main [role="alert"]')].map(x=>x.textContent),
   warnings:[...document.querySelectorAll('main p.notice, main p.empty')].map(x=>x.textContent),
   metrics:[...document.querySelectorAll('main dl.metrics > div')].map(x=>({label:x.querySelector('dt')?.textContent,availability:/unavailable|unknown/i.test(x.querySelector('dd')?.textContent??'')?'UNAVAILABLE_OR_UNKNOWN':'DISPLAY_VALUE_PRESENT'})),
   tables:[...document.querySelectorAll('main table')].map(x=>({headers:[...x.querySelectorAll('thead th')].map(h=>h.textContent),rows:x.querySelectorAll('tbody tr').length})),
   loginInputs:document.querySelectorAll('input[type="password"]').length,
   buttons:[...document.querySelectorAll('main button')].map(b=>({label:b.textContent,disabled:b.disabled})),
   navigationLinks:[...document.querySelectorAll('nav[aria-label="Primary navigation"] a')].map(x=>x.getAttribute('href'))
  }));
  rows.push({path,httpStatus:response?.status(),redirectedToLogin:/\/(login|signin|auth)/i.test(page.url()),...r});
  if(path==='/'||path==='/holdings')await page.screenshot({path:out+'/validation/'+(path==='/'?'dashboard':'holdings')+'-redacted.png',fullPage:true,mask:[page.locator('dd'),page.locator('tbody td'),page.locator('header p')],maskColor:'#253044'});
 }
 const db=new DatabaseSync(process.cwd()+'/data/vn30.sqlite',{readOnly:true});
 let expected;
 try{expected=JSON.parse(db.prepare('SELECT payload FROM portfolio_projection').get().payload);}finally{db.close();}
 await page.goto(base+'/holdings',{waitUntil:'networkidle'});
 const cash=await page.locator('dl.metrics > div').filter({has:page.locator('dt',{hasText:/^Ledger cash \(VND\)$/})}).locator('dd').textContent();
 const receivable=await page.locator('dl.metrics > div').filter({has:page.locator('dt',{hasText:/^Receivables$/})}).locator('dd').textContent();
 assert.equal(cash,expected.cash);assert.equal(receivable,expected.receivables);
 const holdings=await page.locator('main table').filter({has:page.locator('th',{hasText:'Cost basis (VND)'})}).locator('tbody tr').evaluateAll(rows=>rows.map(r=>[...r.querySelectorAll('td')].map(c=>c.textContent)));
 assert.equal(holdings.length,11);
 for(const p of expected.positions){const row=holdings.find(r=>r[0]===p.securityId);assert.ok(row);assert.equal(row[1],p.quantity);assert.equal(row[2],p.openCost);assert.equal(row[3],p.averageCost);}
 await page.goto(base+'/transactions',{waitUntil:'networkidle'});
 assert.equal(await page.locator('main tbody tr').count(),12);
 await page.goto(base+'/',{waitUntil:'networkidle'});
 const nav=await page.locator('dl.metrics > div').filter({has:page.locator('dt',{hasText:/^NAV \(VND\)$/})}).locator('dd').textContent();assert.equal(nav,'Unavailable');
 const actualLedgerUI={cashExactMatch:true,nonzeroReceivableExactMatch:true,allElevenQuantityCostAverageCostExactMatch:true,transactionHistoryRows:12,currentNAV:'UNAVAILABLE',comparison:'Actual stored projection, independently matched to full authoritative replay in ACTUAL_DATA_RECONSTRUCTION.json; no fixtures'};
 assert.ok(rows.every(r=>r.httpStatus===200&&!r.redirectedToLogin));assert.equal(pageErrors.length,0);
 const api=await context.request.get(base+'/api/readiness');const readiness=await api.json();
 await page.goto(base+'/holdings',{waitUntil:'networkidle'});
 const detail=await page.locator('main a[href^="/holdings/"]').first().getAttribute('href').catch(()=>null);
 let detailCheck=null;
 if(detail){const response=await page.goto(base+detail,{waitUntil:'networkidle'});detailCheck={path:detail,httpStatus:response.status(),h1:await page.locator('main h1').textContent(),tableRows:await page.locator('main tbody tr').count()};}
 await page.goto(base+'/',{waitUntil:'networkidle'});await page.getByRole('link',{name:'Holdings',exact:true}).click();await page.waitForURL('**/holdings');
 const navigationClickWorked=page.url().endsWith('/holdings');
 await page.setViewportSize({width:390,height:844});await page.goto(base+'/data',{waitUntil:'networkidle'});
 const mobile=await page.evaluate(()=>({h1:document.querySelector('main h1')?.textContent,documentWidth:document.documentElement.scrollWidth,viewport:window.innerWidth,tableScrollContainers:document.querySelectorAll('.table-scroll').length}));
 const cookies=(await context.cookies()).map(c=>({name:c.name,httpOnly:c.httpOnly}));
 const result={actualLedgerUI,classification:'LIVE_PRODUCTION_BUILD_LOCAL_SQLITE_READ_ONLY_BROWSER_REVIEW',baseURL:base,listener,observedAt:new Date().toISOString(),routes:rows,readinessApi:{httpStatus:api.status(),body:readiness},detailCheck,navigationClickWorked,mobileDataScreen:mobile,cookies,pageErrors,blockedRequests,productionWritesPerformed:0,fixturesInjected:false,redactedScreenshots:['validation/dashboard-redacted.png','validation/holdings-redacted.png']};
 writeFileSync(out+'/LIVE_RUNTIME_RESULTS.json',JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({routes:rows.length,httpFailures:rows.filter(r=>r.httpStatus!==200).map(r=>r.path),loginRedirects:rows.filter(r=>r.redirectedToLogin).length,pageErrors,readiness,mobile,navigationClickWorked},null,2));
}finally{await context.close();await browser.close();}
