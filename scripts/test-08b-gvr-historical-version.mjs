import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {gvrHistoricalVersions} from './lib/08b-gvr-historical-version.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
function fixture(){
 const files=new Map(),put=(f,v)=>files.set(f,Buffer.from(typeof v==='string'?v:JSON.stringify(v)));
 const attachment='https://vrg.vn/fy2024.pdf';
 const q={ticker:'GVR',bodyHash:'annual',securityId:'security',documentId:'document',status:'TECHNICALLY_QUALIFIED_REVIEW_CANDIDATE',scope:'CONSOLIDATED',auditStatus:'AUDITED',accountingBasis:'VAS',period:{start:'2024-01-01',end:'2024-12-31',type:'ANNUAL'}};
 for(const [year,suffix] of [['2024',''],['2025',''],['2025','-page2']]){
  const file=`targeted-indexes/GVR-required-history-${year}${suffix}.body`,url=`https://vrg.vn/quan-he-co-dong/bao-cao-tai-chinh/${year}-bao-cao-tai-chinh/`;
  const card=year==='2025'&&!suffix?`<div data-elementor-type="loop-item"><h3><a href="${attachment}">Báo cáo tài chính hợp nhất năm 2024 (kèm Giải trình)</a></h3><span class="elementor-icon-list-text">31/03/2025</span>`:'';
  put(file,card+(year==='2025'?`<a href="${url}page/2/">2</a>`:''));
  put(file.replace('.body','.json'),{url:url+(suffix?'page/2/':''),bodySha256:sha(files.get(file)),httpStatus:'200',curlExit:0,retrievedAt:'2026-10-10T20:00:00.000Z'});
 }
 const change=(f,s)=>{put(f,s);const r=f.replace('.body','.json');put(r,{...JSON.parse(files.get(r)),bodySha256:sha(files.get(f))});};
 const args={read:(f,raw=false)=>raw?files.get(f):JSON.parse(files.get(f)),sha,base:'',cutoff:'2026-10-10T21:00:00.000Z',qualified:[q],documents:[{ticker:'GVR',bodyHash:'annual',originalPublicUrl:attachment}]};
 return {files,put,change,args};
}
test('complete own inventory binds only exact audited annual window',()=>{const v=gvrHistoricalVersions(fixture().args);assert.equal(v.length,1);assert.equal(v[0].periodEnd,'2024-12-31');assert.equal(v[0].sourceProofs.length,4);});
test('unknown cutoff, future receipt, changed response and extra pages fail closed',()=>{
 for(const kind of ['cutoff','future','bytes','pages']){
  const f=fixture(),file='targeted-indexes/GVR-required-history-2025.body';
  if(kind==='cutoff')f.args.cutoff='unknown';
  if(kind==='future'){const r=file.replace('.body','.json');f.put(r,{...JSON.parse(f.files.get(r)),retrievedAt:'2026-10-11T00:00:00.000Z'});}
  if(kind==='bytes')f.put(file,'changed');
  if(kind==='pages')f.change(file,f.files.get(file).toString().replace('page/2/','page/3/'));
  assert.throws(()=>gvrHistoricalVersions(f.args),/REQUIRED|NOT_BOUND/);
 }
});
test('wrong scope, year, basis or audit cannot acquire freshness',()=>{
 for(const patch of [{scope:'SEPARATE_STANDALONE'},{accountingBasis:'IFRS'},{auditStatus:'UNKNOWN'},{period:{start:'2023-01-01',end:'2023-12-31',type:'ANNUAL'}}]){
  const f=fixture();f.args.qualified=[{...f.args.qualified[0],...patch}];assert.deepEqual(gvrHistoricalVersions(f.args),[]);
 }
});
test('advertised annual correction cannot be dismissed as a quarter correction',()=>{
 const f=fixture(),file='targeted-indexes/GVR-required-history-2025.body';f.change(file,f.files.get(file).toString()+'<div data-elementor-type="loop-item"><h3><a href="https://vrg.vn/correction.pdf">Đính chính báo cáo năm 2024</a></h3>');assert.deepEqual(gvrHistoricalVersions(f.args),[]);
});
test('advertised Q3 correction requires the exact recovered body',()=>{
 const f=fixture(),file='targeted-indexes/GVR-required-history-2024.body';f.change(file,'<div data-elementor-type="loop-item"><h3><a href="https://vrg.vn/correction.pdf">Đính chính Báo cáo tài chính hợp nhất quý 3 năm 2024</a></h3>');assert.throws(()=>gvrHistoricalVersions(f.args),/CORRECTION_BODY_REQUIRED/);
});
