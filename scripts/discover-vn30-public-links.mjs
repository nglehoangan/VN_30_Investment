import './lib/ts-runtime.mjs';
import {chromium} from '@playwright/test';
import {readFileSync,mkdirSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,isAbsolute,join} from 'node:path';
import {createHash} from 'node:crypto';
const {issuerResource,discoverIssuerLinks}=await import('../src/infrastructure/fundamentals/issuer-documents.ts');
const root=resolve(import.meta.dirname,'..'),sha=b=>createHash('sha256').update(b).digest('hex');
const args=process.argv.slice(2),opts={};for(let i=0;i<args.length;i+=2){if(!['--output','--tickers'].includes(args[i])||!args[i+1]||opts[args[i]])throw new Error('INVALID_ARGUMENTS');opts[args[i]]=args[i+1];}
if(!isAbsolute(opts['--output']??'')||existsSync(opts['--output']))throw new Error('NEW_ABSOLUTE_OUTPUT_REQUIRED');
const catalogBytes=readFileSync(join(root,'docs/fundamental-data-engine/issuer-sources.json')),rows=JSON.parse(catalogBytes).sources.filter(r=>r.scope==='research_basket'),selected=opts['--tickers']?.split(',')??rows.map(r=>r.ticker);if(selected.some(t=>!rows.some(r=>r.ticker===t)))throw new Error('INVALID_TICKERS');
mkdirSync(opts['--output'],{mode:0o700});const browser=await chromium.launch({headless:true}),seeds={},results=[];
try{for(const row of rows.filter(r=>selected.includes(r.ticker))){const context=await browser.newContext({acceptDownloads:true}),page=await context.newPage(),events=new Set(),snapshots=[];let failure=null;
 context.on('request',r=>{if(/\.pdf|download|GetFile/i.test(r.url())){try{events.add(issuerResource(r.url()));}catch{/* Unapproved routing/credentials are withheld. */}}});page.on('download',async d=>{try{events.add(issuerResource(d.url()));}catch{}await d.cancel();});
 try{await page.goto(issuerResource(row.discoveryUrl),{waitUntil:'domcontentloaded',timeout:25000});await page.waitForTimeout(5000);
 if(row.ticker==='ACB')await page.getByText('Từ chối',{exact:true}).click({timeout:1000}).catch(()=>{});
 for(const year of ['2026','2025']){if(row.ticker==='MBB')await page.locator('select').first().selectOption({label:year},{timeout:2000}).catch(()=>{});else if(row.ticker==='ACB')await page.getByText('Báo cáo tài chính '+year,{exact:true}).first().click({timeout:2000}).catch(()=>{});else if(row.ticker==='VPB')await page.getByText(year,{exact:true}).first().click({timeout:2000}).catch(()=>{});
 await page.waitForTimeout(1500);const data=await page.evaluate(()=>({title:document.title,links:Array.from(document.querySelectorAll('a[href]')).map(a=>{let e=a,label=a.innerText;for(let i=0;i<4&&e.parentElement;i++){e=e.parentElement;const text=e.innerText;if(text.length>2500)break;label=text;}return {url:a.href,label};})}));snapshots.push({requestedYear:year,url:page.url(),recordedAt:new Date().toISOString(),...data});
 for(const link of data.links){const discovered=discoverIssuerLinks('<a href="'+link.url.replaceAll('&','&amp;').replaceAll('"','&quot;')+'">'+link.label.replaceAll('<','&lt;')+'</a>',row.discoveryUrl);discovered.pdfs.forEach(url=>events.add(url));}
 const buttons=row.ticker==='MBB'?page.locator('.btn-invertor-download'):row.ticker==='ACB'?page.getByText('Tải xuống',{exact:true}):null;
 if(buttons)for(let i=0,n=Math.min(12,await buttons.count());i<n;i++){await buttons.nth(i).click({timeout:2000}).catch(()=>{});await page.waitForTimeout(500);}
 }
 }catch{failure='PUBLIC_PAGE_DISCOVERY_INCOMPLETE';}
 const body=JSON.stringify({ticker:row.ticker,discoveryUrl:row.discoveryUrl,kind:'PUBLIC_BROWSER_DISCOVERY_NOT_RAW_HTTP_OR_QUALIFICATION',catalogHash:sha(catalogBytes),recordedAt:new Date().toISOString(),failure,snapshots,documentUrls:[...events].sort()});writeFileSync(join(opts['--output'],row.ticker+'.json'),body,{flag:'wx',mode:0o600});writeFileSync(join(opts['--output'],row.ticker+'.sha256'),sha(body),{flag:'wx',mode:0o600});seeds[row.ticker]=[...events].sort().slice(0,40);results.push({ticker:row.ticker,links:seeds[row.ticker].length,failure});console.log(row.ticker+': '+seeds[row.ticker].length+' candidate links');await context.close();}
 writeFileSync(join(opts['--output'],'seeds.json'),JSON.stringify(seeds,null,2)+'\n',{flag:'wx',mode:0o600});writeFileSync(join(opts['--output'],'summary.json'),JSON.stringify({catalogHash:sha(catalogBytes),results},null,2)+'\n',{flag:'wx',mode:0o600});
}finally{await browser.close();}
