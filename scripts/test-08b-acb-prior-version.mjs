import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {acbPriorVersions} from './lib/08b-acb-prior-version.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
function fixture(){
 const files=new Map(),put=(f,v)=>files.set(f,Buffer.from(typeof v==='string'?v:JSON.stringify(v)));
 const attachment='https://acb.com.vn/acbwebsite/files/H1 2025.pdf',q={ticker:'ACB',bodyHash:'annual',securityId:'security',documentId:'document',status:'TECHNICALLY_QUALIFIED_REVIEW_CANDIDATE',scope:'CONSOLIDATED',auditStatus:'REVIEWED',accountingBasis:'VAS',period:{start:'2025-01-01',end:'2025-06-30',type:'YTD'}};
 const entries=Array.from({length:16},(_,i)=>({id:i+1,title:i===10?'Báo cáo tài chính hợp nhất bán niên 2025':'Other report',featured_image:{path:attachment},categories:[{id:1541}]}));
 const pages=[0,1].map(i=>({data:entries.slice(i*9,i*9+9),meta:{current_page:i+1,last_page:2,total:16,per_page:9}}));
 const block={type:'category',limit:'9',category:[{id:1541,slug:'bao-cao-tai-chinh-2025'}],default_data:pages[0]};
 const first='targeted-indexes/ACB-required-half-year-2025.body',second='targeted-indexes/ACB-required-half-year-2025-category-page2.body',app='targeted-indexes/ACB-required-history-app.js';
 const params=new URLSearchParams({'limit':'9','search[categories.category_id:in]':'1541','search[is_active:in]':'1','search_type':'and','search[type:not]':'notification','page':'2'});
 const bound=(file,value,url)=>{put(file,value);put(file.replace(/\.(body|js)$/,'.json'),{url,httpStatus:'200',curlExit:0,bodySha256:sha(files.get(file)),retrievedAt:'2026-10-10T20:00:00.000Z'});};
 bound(first,`<script src="/_next/static/chunks/pages/_app-test.js"></script><script id="__NEXT_DATA__">${JSON.stringify({block})}</script>`,'https://acb.com.vn/vi/nha-dau-tu/bao-cao-tai-chinh-2025');
 bound(second,pages[1],'https://acb.com.vn/api/front/v1/posts?'+params);
 bound(app,'32695:function getPostByParams search[categories.category_id:in] "https://acb.com.vn" "front/v1"','https://acb.com.vn/_next/static/chunks/pages/_app-test.js');
 const change=(f,v)=>{put(f,v);const r=f.replace(/\.(body|js)$/,'.json');put(r,{...JSON.parse(files.get(r)),bodySha256:sha(files.get(f))});};
 const args={read:(f,raw=false)=>raw?files.get(f):JSON.parse(files.get(f)),sha,qualified:[q],documents:[{ticker:'ACB',bodyHash:'annual',originalPublicUrl:encodeURI(attachment)}],cutoff:'2026-10-10T21:00:00.000Z',base:''};
 return {files,put,change,args,first,second,app};
}
test('complete issuer category binds exact reviewed prior H1 source without backdating',()=>{const v=acbPriorVersions(fixture().args);assert.equal(v.length,1);assert.equal(v[0].periodEnd,'2025-06-30');assert.equal(v[0].sourceProofs.length,6);assert.equal(v[0].knowledgeBackdated,false);});
test('incomplete pagination, wrong category, extra request parameter or future receipt fail closed',()=>{
 for(const kind of ['page','category','query','future','bytes','cutoff']){
  const f=fixture(),r=f.second.replace('.body','.json');
  if(kind==='page'){const p=JSON.parse(f.files.get(f.second));p.meta.last_page=3;f.change(f.second,p);}
  if(kind==='category'){const p=JSON.parse(f.files.get(f.second));p.data[0].categories=[{id:1}];f.change(f.second,p);}
  if(kind==='query')f.put(r,{...JSON.parse(f.files.get(r)),url:JSON.parse(f.files.get(r)).url+'&other=1'});
  if(kind==='future')f.put(r,{...JSON.parse(f.files.get(r)),retrievedAt:'2026-10-11T00:00:00.000Z'});
  if(kind==='bytes')f.put(f.second,'changed');if(kind==='cutoff')f.args.cutoff='unknown';
  assert.throws(()=>acbPriorVersions(f.args),/REQUIRED|NOT_BOUND|NOT_CLOSED/);
 }
});
test('an advertised correction or wrong issuer scope, period, basis or audit prevents selection',()=>{
 for(const patch of [{scope:'SEPARATE_STANDALONE'},{auditStatus:'UNKNOWN'},{accountingBasis:'IFRS'},{period:{start:'2026-01-01',end:'2026-06-30',type:'YTD'}}]){const f=fixture();f.args.qualified=[{...f.args.qualified[0],...patch}];assert.deepEqual(acbPriorVersions(f.args),[]);}
 const f=fixture(),p=JSON.parse(f.files.get(f.second));p.data[0].title='Đính chính báo cáo hợp nhất bán niên 2025';f.change(f.second,p);assert.deepEqual(acbPriorVersions(f.args),[]);
});
test('unbound own frontend cannot authorize category or attachment resolution',()=>{const f=fixture();f.change(f.app,'unrelated frontend');assert.throws(()=>acbPriorVersions(f.args),/FRONTEND_CONTRACT_REQUIRED/);});
