import {it,expect} from 'vitest';
import {mkdtempSync,writeFileSync,readFileSync,rmSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {FptDocumentCollector} from '@/infrastructure/fundamentals/fpt';
const sha=(s:string)=>createHash('sha256').update(s).digest('hex');
it('08B raw stage initializes only an explicit new isolated DB, preserves raw lineage and refuses overwrite',async()=>{
 const dir=mkdtempSync(path.join(tmpdir(),'vn30-08b-raw-test-')),target=path.join(dir,'new.sqlite');try{
  const collector=new FptDocumentCollector({reportUrls:['https://fpt.com/api/media/BCTC_TEST_ONLY.pdf']},{now:()=> '2026-10-10T01:00:00.000Z',sleep:async()=>{},request:async url=>new Response(url.endsWith('.pdf')?'%PDF-1.7 SYNTHETIC TEST ONLY':'<html>synthetic fixture</html>',{headers:{'content-type':url.endsWith('.pdf')?'application/pdf':'text/html'}})}),result=await collector.collect('synthetic-08b-test'),body=JSON.stringify({mode:'PUBLIC_HTTP',...result});
  // PUBLIC_HTTP is transport metadata, never authenticity/qualification authority.
  writeFileSync(path.join(dir,'manifest.json'),body);writeFileSync(path.join(dir,'manifest.sha256'),sha(body));const run=()=>spawnSync(process.execPath,['scripts/initialize-08b-raw.mjs','--database',target,'--manifest-dir',dir],{cwd:process.cwd(),env:{...process.env,DATABASE_URL:'file:/must-not-access-private.sqlite'},encoding:'utf8',timeout:30000});
  const first=run();expect(first.status,first.stderr).toBe(0);const receipt=JSON.parse(first.stdout);expect(receipt.counts).toEqual({sources:1,imports:1,captures:2,observations:0,snapshots:0,acceptances:0});expect(receipt.documents[0].qualification).toBe('NOT_REVIEWED');expect(receipt.diStatus).toBe('NOT_EXECUTED');expect(receipt.requestedReportingWindow.semantics).toBe('REQUESTED_WINDOW_NOT_DOCUMENT_QUALIFICATION');const before=sha(readFileSync(target).toString('base64'));expect(run().status).toBe(1);expect(sha(readFileSync(target).toString('base64'))).toBe(before);
  const originalReceipt=readFileSync(target+'.08b.json','utf8'),second=JSON.stringify({mode:'PUBLIC_HTTP',...await collector.collect('synthetic-08b-test-append')});writeFileSync(path.join(dir,'manifest.json'),second);writeFileSync(path.join(dir,'manifest.sha256'),sha(second));const append=spawnSync(process.execPath,['scripts/initialize-08b-raw.mjs','--database',target,'--manifest-dir',dir,'--append-raw'],{encoding:'utf8',timeout:30000});expect(append.status,append.stderr).toBe(0);expect(JSON.parse(append.stdout).counts).toEqual({sources:1,imports:2,captures:4,observations:0,snapshots:0,acceptances:0});expect(readFileSync(target+'.08b.json','utf8')).toBe(originalReceipt);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
it('invalid capture checksums fail before a target database is created and stderr does not reveal inputs',()=>{
 const dir=mkdtempSync(path.join(tmpdir(),'vn30-08b-invalid-test-')),target=path.join(dir,'PRIVATE-CANARY.sqlite');try{writeFileSync(path.join(dir,'manifest.json'),'PRIVATE-CANARY');writeFileSync(path.join(dir,'manifest.sha256'),'invalid');const r=spawnSync(process.execPath,['scripts/initialize-08b-raw.mjs','--database',target,'--manifest-dir',dir],{encoding:'utf8'});expect(r.status).toBe(1);expect(r.stderr).not.toContain('PRIVATE-CANARY');expect(existsSync(target)).toBe(false);}finally{rmSync(dir,{recursive:true,force:true});}
});
