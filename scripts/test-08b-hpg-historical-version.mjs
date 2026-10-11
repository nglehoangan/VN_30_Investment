import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {hpgHistoricalVersions} from './lib/08b-hpg-historical-version.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
function fixture(){
 const files=new Map(),put=(f,v)=>files.set(f,Buffer.from(typeof v==='string'?v:JSON.stringify(v)));
 const q={ticker:'HPG',securityId:'security',bodyHash:'body',documentId:'doc',scope:'CONSOLIDATED',accountingBasis:'VAS',auditStatus:'AUDITED',status:'TECHNICALLY_QUALIFIED_REVIEW_CANDIDATE',period:{start:'2024-01-01',end:'2024-12-31',type:'ANNUAL'}};
 const attachment='https://file.hoaphat.com.vn/2024-audited.pdf';
 for(const year of ['2023','2024','2025'])for(const suffix of ['','-page2']){
  const url='https://www.hoaphat.com.vn/quan-he-co-dong/bao-cao-tai-chinh?sort_year='+year;
  const file=`targeted-indexes/HPG-required-history-${year}${suffix}.body`;
  const card=year==='2025'&&suffix?`<div class="item " data-id="1"><a target="_blank" href="${attachment}">Báo cáo tài chính hợp nhất năm 2024</a><div class="time">21/03/2025</div></div>`:'';
  put(file,`<h1 class="title">Báo cáo tài chính</h1>${card}<a href="${url}&amp;page=${suffix?'1':'2'}">page</a>`);
  put(file.replace('.body','.json'),{httpStatus:'200',curlExit:0,bodySha256:sha(files.get(file)),retrievedAt:'2026-10-10T20:00:00.000Z',url:url+(suffix?'&page=2':'')});
 }
 const args={read:(f,raw=false)=>raw?files.get(f):JSON.parse(files.get(f)),sha,qualified:[q],documents:[{ticker:'HPG',bodyHash:'body',originalPublicUrl:attachment}],cutoff:'2026-10-10T21:00:00.000Z',base:''};
 const change=(file,text)=>{put(file,text);const f=file.replace('.body','.json'),r=JSON.parse(files.get(f));put(f,{...r,bodySha256:sha(files.get(file))});};
 return {files,put,change,args};
}
test('two complete issuer pages bind exact audited VAS annual attachment',()=>{
 const versions=hpgHistoricalVersions(fixture().args);assert.equal(versions.length,1);assert.equal(versions[0].periodEnd,'2024-12-31');assert.equal(versions[0].sourceProofs.length,4);
});
test('extra pagination, changed bytes and future receipt fail closed',()=>{
 for(const mutation of ['pages','bytes','future']){
  const f=fixture(),file='targeted-indexes/HPG-required-history-2025.body';
  if(mutation==='pages')f.change(file,f.files.get(file).toString().replace('page=2','page=3'));
  else if(mutation==='bytes')f.put(file,'changed');
  else{const r=file.replace('.body','.json');f.put(r,{...JSON.parse(f.files.get(r)),retrievedAt:'2026-10-11T21:00:00.000Z'});}
  assert.throws(()=>hpgHistoricalVersions(f.args),/REQUIRED|NOT_BOUND/);
 }
});
test('wrong accounting basis, scope, year or an advertised correction prevents version selection',()=>{
 for(const change of [{accountingBasis:'IFRS'},{scope:'SEPARATE_STANDALONE'},{auditStatus:'UNKNOWN'},{period:{start:'2023-01-01',end:'2023-12-31',type:'ANNUAL'}}]){
  const f=fixture();f.args.qualified=f.args.qualified.map(q=>({...q,...change}));assert.deepEqual(hpgHistoricalVersions(f.args),[]);
 }
 const f=fixture(),file='targeted-indexes/HPG-required-history-2025-page2.body';f.change(file,f.files.get(file).toString()+'<div class="item "><a href="https://file.hoaphat.com.vn/correction.pdf">Đính chính báo cáo năm 2024</a></div>');assert.deepEqual(hpgHistoricalVersions(f.args),[]);
});

test('unknown cutoff cannot establish a historical version',()=>{const f=fixture();f.args.cutoff='unknown';assert.throws(()=>hpgHistoricalVersions(f.args),/CUTOFF_REQUIRED/);});
