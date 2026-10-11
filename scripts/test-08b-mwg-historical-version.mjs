import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mwgHistoricalVersions,requiredHistoricalVersionWindow as route} from './lib/08b-mwg-historical-version.mjs';
import {createHash} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');
const o={securityId:'security',ticker:'MWG',itemId:'REVENUE',reportingScope:'CONSOLIDATED',periodType:'ANNUAL',periodStart:'2024-01-01',periodEnd:'2024-12-31',normalized:{value:'123'}};
const q={...o,documentId:'doc',bodyHash:'body',scope:o.reportingScope,period:{start:o.periodStart,end:o.periodEnd,type:'ANNUAL'},status:'TECHNICALLY_QUALIFIED_REVIEW_CANDIDATE',auditStatus:'AUDITED',accountingBasis:'VAS'};
const w={...o};const c={...o,scope:o.reportingScope,documentId:'doc',bodyHash:'body',period:q.period,normalizedCanonicalValue:'123',status:'VERIFIED_TRANSCRIPTION_REVIEW_CANDIDATE',sourcePageEvidenceHashes:['a','b']};
const v={...o,bodyHash:'body',documentId:'doc',status:'EXACT_ISSUER_REQUIRED_HISTORICAL_VERSION_REVIEW_CANDIDATE'};
test('exact required historical issuer version selects only its own verified window',()=>assert.equal(route(o,'body',[v],[q],[c],[w]).kind,'EXACT_REQUIRED_HISTORICAL_ISSUER_VERSION'));
test('unrequired history, wrong body, scope, definition or value cannot pass',()=>{
 assert.equal(route(o,'body',[v],[q],[c],[]),null);
 for(const change of [{bodyHash:'other'},{periodEnd:'2023-12-31'},{securityId:'other'},{reportingScope:'SEPARATE_STANDALONE'}])assert.equal(route(o,'body',[{...v,...change}],[q],[c],[w]),null);
 for(const change of [{itemId:'GROSS_PROFIT'},{normalizedCanonicalValue:'999'},{sourcePageEvidenceHashes:['one']},{scope:'SEPARATE_STANDALONE'}])assert.equal(route(o,'body',[v],[q],[{...c,...change}],[w]),null);
});
function fixture(){
 const files=new Map();const put=(f,d)=>files.set(f,Buffer.from(typeof d==='string'?d:JSON.stringify(d)));put('targeted-indexes/MWG-public-report-dependency-7.js','51071: https://cdnv2-tmdt.tgdd.vn/mwgvn/ir function l(t)');
 const receipt=(file,url)=>({httpStatus:'200',curlExit:0,bodySha256:sha(files.get(file)),retrievedAt:'2026-10-10T20:00:00.000Z',url});
 put('targeted-indexes/MWG-public-report-dependency-7.json',receipt('targeted-indexes/MWG-public-report-dependency-7.js','https://mwg.vn/frontend.js'));
 const root='targeted-indexes/MWG-public-report-year-categories.body';put(root,{code:0,data:['2022','2023','2024'].map(year=>({isActived:true,categoryName:year,categoryID:year}))});put(root.replace('.body','.json'),receipt(root,'https://api.mwgshop.vn/gw/ir-api/api/CategoryAPI'));
 for(const year of ['2022','2023','2024']){
  const f=`targeted-indexes/MWG-public-financial-category-${year}.body`,category=`targeted-indexes/MWG-public-report-${year}-categories.body`;
  put(f,{code:0,data:[{title:`Báo Cáo Tài Chính Hợp Nhất Kiểm Toán Năm ${year}`,isActived:true,isDeleted:false,categoryID:7,fileLink:`${year}.pdf`,postID:year,publishDate:`${+year+1}-03-01T00:00:00`}]});put(category,{code:0,data:[{isActived:true,categoryName:'Báo cáo tài chính, quản trị, thường niên',categoryID:7}]});
  put(f.replace('.body','.json'),{httpStatus:'200',curlExit:0,bodySha256:sha(files.get(f)),retrievedAt:'2026-10-10T20:00:00.000Z',url:'https://api.mwgshop.vn/gw/ir-api/api/PostAPI?categoryID=7&pageIndex=1&pageSize=50&langID=vi-VN&condition=-1'});put(category.replace('.body','.json'),receipt(category,`https://api.mwgshop.vn/gw/ir-api/api/CategoryAPI?parentID=${year}&langID=vi-VN&pageIndex=1&pageSize=50`));
 }
 const args={read:(f,raw=false)=>raw?files.get(f):JSON.parse(files.get(f)),sha,qualified:[q],documents:[{ticker:'MWG',bodyHash:'body',originalPublicUrl:'https://cdnv2-tmdt.tgdd.vn/mwgvn/ir/2024.pdf'}],cutoff:'2026-10-10T21:00:00.000Z',base:''};return {files,args,put};
}
test('actual attachment, audited VAS qualification and complete issuer category bind historical version',()=>assert.equal(mwgHistoricalVersions(fixture().args).length,1));
test('changed source bytes or future inventory fails closed',()=>{
 const {args,put}=fixture();put('targeted-indexes/MWG-public-financial-category-2024.body',{code:0,data:[]});assert.throws(()=>mwgHistoricalVersions(args),/NOT_BOUND/);
 const other=fixture();other.args.cutoff='2026-10-09T21:00:00.000Z';assert.throws(()=>mwgHistoricalVersions(other.args),/NOT_BOUND/);
});
test('advertised correction or unqualified accounting basis prevents historical selection',()=>{
 const f=fixture();f.args.qualified=[{...q,accountingBasis:'IFRS'}];assert.equal(mwgHistoricalVersions(f.args).length,0);
 const x=fixture(),file='targeted-indexes/MWG-public-financial-category-2024.body',packet=JSON.parse(x.files.get(file));packet.data.push({...packet.data[0],title:'Đính chính báo cáo 2024'});x.put(file,packet);const receipt=JSON.parse(x.files.get(file.replace('.body','.json')));receipt.bodySha256=sha(x.files.get(file));x.put(file.replace('.body','.json'),receipt);assert.equal(mwgHistoricalVersions(x.args).length,0);
});

test('year parent, language and frontend receipt must match the actual own contract',()=>{
 for(const change of ['parent','language','frontend']){
  const f=fixture(),file='targeted-indexes/MWG-public-report-2024-categories.json';
  if(change==='frontend'){const p='targeted-indexes/MWG-public-report-dependency-7.json',r=JSON.parse(f.files.get(p));r.bodySha256='changed';f.put(p,r);}
  else{const r=JSON.parse(f.files.get(file));r.url=r.url.replace(change==='parent'?'parentID=2024':'langID=vi-VN',change==='parent'?'parentID=2023':'langID=en-US');f.put(file,r);}
  assert.throws(()=>mwgHistoricalVersions(f.args),/CONTRACT_MISMATCH|RECEIPT_NOT_BOUND/);
 }
});
