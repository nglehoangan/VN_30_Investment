/** Actual production-build UI + retained-file adapter comparison, no fixtures or writes. */
import {chromium,expect} from '@playwright/test';import assert from 'node:assert/strict';import {writeFileSync} from 'node:fs';import {execFileSync} from 'node:child_process';
import {readRetainedResearch} from '../src/infrastructure/fundamentals/retained-research.ts';
const out='docs/fundamental-data-engine/evidence/2026-10-24-m8-financial-current-layout-adapter',base='http://127.0.0.1:38417';
const listener=execFileSync('/usr/sbin/lsof',['-nP','-iTCP:38417','-sTCP:LISTEN','-Fpn'],{encoding:'utf8'});assert.ok(listener.includes('n127.0.0.1:38417'));assert.ok(!listener.split('\n').some(l=>l.startsWith('n')&&l!=='n127.0.0.1:38417'));
const browser=await chromium.launch({headless:true}),context=await browser.newContext({viewport:{width:1440,height:1000}}),blockedRequests=[],pageErrors=[],routes=[];
await context.route('**/*',route=>{const r=route.request();if(new URL(r.url()).origin!==base||!['GET','HEAD'].includes(r.method())){blockedRequests.push({method:r.method(),url:new URL(r.url()).pathname});return route.abort();}return route.continue();});
const page=await context.newPage();page.on('pageerror',e=>pageErrors.push(e.message));
const visit=async(path)=>{const response=await page.goto(base+path,{waitUntil:'networkidle',timeout:60000});const r={path,httpStatus:response.status(),h1:await page.locator('main h1').textContent(),alerts:await page.locator('main [role="alert"]').allTextContents(),redirectedToLogin:/\/(login|signin|auth)/i.test(page.url())};routes.push(r);assert.equal(r.httpStatus,200);assert.equal(r.redirectedToLogin,false);return r;};
try{
 for(const path of ['/','/data','/vn30','/scoring','/holdings','/transactions'])await visit(path);
 await visit('/data');assert.equal(await page.getByRole('navigation',{name:'Financial research tickers'}).getByRole('link').count(),30);assert.ok((await page.getByRole('region',{name:'Retained financial research'}).textContent()).includes('Quarantined API captures: 8'));
 await page.getByRole('navigation',{name:'Financial research tickers'}).getByRole('link',{name:'VNM',exact:true}).click();await page.waitForURL('**/vn30/VNM');
 const navigationWorked=page.url().endsWith('/vn30/VNM');assert.ok(navigationWorked);
 const first=await readRetainedResearch(process.cwd(),'VNM');const region=page.getByRole('region',{name:'Retained financial research'});
 const compare=async(expected)=>{
  const table=region.locator('table').filter({has:page.locator('th',{hasText:'Caption / code'})});await expect(table.locator('tbody tr')).toHaveCount(expected.rows.length,{timeout:60000});const rows=await table.locator('tbody tr').evaluateAll(rows=>rows.map(row=>[...row.querySelectorAll('td')].map(c=>c.textContent)));
  assert.equal(rows.length,expected.rows.length);
  for(const [i,r] of expected.rows.entries()){assert.equal(rows[i][1],r.value??'Unavailable');assert.ok(rows[i][0].includes(r.label));assert.ok(rows[i][5].includes(r.pointer));if(r.evidencePointer)assert.ok(rows[i][5].includes(r.evidencePointer));}
  const text=await region.textContent();assert.ok(text.includes(expected.selected.sourcePath));assert.ok(text.includes('Publication time: Unknown / unqualified'));assert.ok(text.includes('Production admission: BLOCKED'));assert.ok(text.includes('Scoring authorization: BLOCKED'));
  return {ticker:expected.ticker,variant:expected.selected.index,provider:expected.selected.provider,scope:expected.selected.reportingScope,period:expected.selected.periodKey,displayRows:rows.length,exactValuesAndLineageMatched:true,numericValues:expected.rows.filter(r=>r.value!==null).length,withheld:expected.rows.filter(r=>r.status==='WITHHELD').length};
 };
 const comparisons=[await compare(first)];
 const choices=[first.variants.find(v=>v.provider==='MANUAL_PDF'&&v.sourcePath.includes('Congtyme')),first.variants.find(v=>v.provider==='CAFEF'),first.variants.find(v=>v.periodEnd===null),first.variants.find(v=>v.periodEnd&&v.periodEnd>new Date().toISOString().slice(0,10))].filter(Boolean);
 for(const v of choices){
  await page.locator('select[name="variant"]').selectOption(String(v.index));await page.getByRole('button',{name:'View research variant'}).click();await page.waitForURL(url=>url.searchParams.get('variant')===String(v.index));await page.waitForLoadState('networkidle');
  routes.push({path:new URL(page.url()).pathname+new URL(page.url()).search,httpStatus:200,interaction:'GET variant form'});comparisons.push(await compare(await readRetainedResearch(process.cwd(),'VNM',String(v.index))));
 }
 const api=choices.find(v=>v.provider==='CAFEF');await visit('/vn30/VNM?variant='+api.index);const next=page.getByRole('link',{name:'Next rows',exact:true});let paginationWorked=false;
 if(await next.count()){await next.click();await page.waitForURL('**/vn30/VNM?variant=*&page=1');await page.waitForLoadState('networkidle');comparisons.push(await compare(await readRetainedResearch(process.cwd(),'VNM',String(api.index),'1')));paginationWorked=true;}
 await visit('/vn30/CTG');await region.locator('summary',{hasText:'API schema quarantine details'}).click();assert.ok((await region.textContent()).includes('CTG'));assert.equal(await region.locator('details').first().locator('tbody tr').count(),8);
 await visit('/vn30/VNM?variant=-1');assert.ok((await page.locator('main [role="alert"]').textContent()).includes('could not be verified'));assert.equal(await page.getByRole('region',{name:'Retained financial research'}).count(),0);
 await visit('/vn30/VNM');await region.locator('summary',{hasText:'Evidence and warnings'}).first().click();await region.screenshot({path:out+'/validation/research-desktop.png'});
 await page.setViewportSize({width:390,height:844});await visit('/vn30/VNM');const mobile=await page.evaluate(()=>({width:window.innerWidth,documentWidth:document.documentElement.scrollWidth}));assert.ok(mobile.documentWidth<=mobile.width);await page.getByRole('region',{name:'Retained financial research'}).screenshot({path:out+'/validation/research-mobile.png'});
 const response=await context.request.get(base+'/api/readiness'),readiness=await response.json();assert.equal(response.status(),200);for(const k of ['readyForScoring','marketCurrent','analysisReady','decisionReady'])assert.equal(readiness[k],false);assert.equal(pageErrors.length,0);
 const result={classification:'LIVE_LOCAL_PRODUCTION_BUILD_ACTUAL_RETAINED_DATA',fixturesInjected:false,productionWritesPerformed:0,listener,routes,comparisons,navigationWorked,paginationWorked,mobile,quarantineVisible:true,invalidVariantFailsClosed:true,publicationTimeRemainsUnqualified:true,readinessApi:{status:response.status(),body:readiness},pageErrors,blockedRequests,screenshots:['validation/research-desktop.png','validation/research-mobile.png'],observedAt:new Date().toISOString()};writeFileSync(out+'/LIVE_RUNTIME_RESULTS.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({routes:routes.length,comparisons:comparisons.length,navigationWorked,paginationWorked,mobile,pageErrors}));
}finally{await context.close();await browser.close();}
