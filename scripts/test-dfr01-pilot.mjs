import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {rowDisposition,parentCapital,dependentStatus,requireResearchMode,clusteredZeros,losslessJson,PILOT} from './lib/dfr01.mjs';
const OUT='docs/fundamental-data-engine/dfr-01/2026-11-04';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const row={value:'0',source:'PDF_REPORTED',reasons:[],unit:'CURRENCY',currency:'VND',scale:'1',reportingScope:'CONSOLIDATED'};
test('explicit PDF zero survives as reference; missing is not zero',()=>{
 assert.equal(rowDisposition(row,{periodType:'ANNUAL'}).status,'REFERENCE_ONLY');
 assert.equal(rowDisposition({...row,value:null},{periodType:'ANNUAL'}).status,'MISSING');
});
test('equal values cannot authorize caption/period/unit mapping',()=>{
 const r=rowDisposition({...row,source:'CAFEF_REFERENCE',unit:null},{periodType:'YTD'});
 assert.equal(r.status,'REFERENCE_ONLY');assert.ok(r.reasons.includes('UNIT_NOT_QUALIFIED'));assert.ok(r.reasons.includes('ANNUAL_BINDING_NOT_QUALIFIED'));
});
test('conflicts propagate only through declared dependencies',()=>{
 assert.equal(rowDisposition(row,{periodType:'ANNUAL'},{conflicts:[{value:'12'}]}).status,'CONFLICT');
 assert.equal(dependentStatus([{status:'SUPPORTED'},{status:'CONFLICT'}]),'CONFLICT');
 assert.equal(dependentStatus([{status:'SUPPORTED'}]),'SUPPORTED');
 assert.equal(dependentStatus([{status:'SUPPORTED'},{status:'MISSING'}]),'MISSING');
 assert.equal(dependentStatus([{status:'REFERENCE_ONLY'}]),'REFERENCE_ONLY');
});
test('HPG-style clustered zero fixture is quarantined for review; isolated zero retained',()=>{
 assert.equal(clusteredZeros(Array.from({length:8},()=>({value:'0'}))),true);
 assert.equal(clusteredZeros([{value:'0'}]),false);
 assert.equal(clusteredZeros([...Array.from({length:8},()=>({value:'0'})),{value:'1'}]),false);
});
const capital={periodEnd:'2025-12-31',sourceColumn:'FY2025_CLOSING',reviewMode:'FULL_SOURCE_PAGE_IMAGE_INSPECTED_BY_CHATGPT',nativeCurrency:'VND',nativeUnit:'MILLION_VND',multiplier:'1000000',selectedEquitySubtotalNative:'249216707',nciNative:'11137640',sourceScope:'CONSOLIDATED'};
test('VHM checked native operands replay without extraction magnitude error',()=>assert.equal(parentCapital(capital).value,'238079067000000'));
test('missing NCI on consolidated scope is not silently zero',()=>assert.throws(()=>parentCapital({...capital,nciNative:null}),/NCI_MISSING/));
test('standalone NCI inapplicability and large decimal strings preserve precision',()=>assert.equal(parentCapital({...capital,sourceScope:'STANDALONE',nciNative:null,multiplier:'1',nativeUnit:'VND',selectedEquitySubtotalNative:'9007199254740993123'}).value,'9007199254740993123'));
test('wrong period, opening column, unknown unit and malformed numeric operands rejected',()=>{
 for(const delta of [{periodEnd:'2024-12-31'},{sourceColumn:'OPENING'},{multiplier:null},{selectedEquitySubtotalNative:'1e9'},{selectedEquitySubtotalNative:123},{nciNative:'999999999'}])assert.throws(()=>parentCapital({...capital,...delta}));
});
test('AS_KNOWN cannot be inferred from hash or capture time',()=>{requireResearchMode('AS_REVISED');assert.throws(()=>requireResearchMode('AS_KNOWN'));});
test('actual pilot files and all input/output pins replay',()=>{
 const m=read(`${OUT}/manifest.json`),snapshot=read(`${OUT}/input-snapshot.json`);
 for(const [p,h] of Object.entries(m.outputs))assert.equal(sha(`${OUT}/${p}`),h,p);
 for(const [p,h] of Object.entries(snapshot.pins))assert.equal(sha(p),h,p);
 assert.equal(read(`${OUT}/inventory.json`).universe.length,30);
});
test('six dossiers carry exact 138 rubric dispositions, one reused judgment and no aggregate',()=>{
 let rated=0,unrated=0;
 for(const t of PILOT){const d=read(`${OUT}/issuers/${t}.json`);assert.equal(d.productionAdmissible,false);assert.equal(d.scoringAuthorized,false);assert.equal(d.totalScore,null);assert.equal(d.ranking,null);assert.equal(d.currentSignal,null);assert.equal(d.rubrics.length,23);assert.ok(d.rows.length>0);
  for(const r of d.rubrics){if(r.status==='SUPPORTED'){rated++;assert.equal(t,'VIC');assert.equal(r.rubric,'RG-UNC');assert.equal(r.points,0);}else{unrated++;assert.equal(r.points,null);assert.equal(r.status,'NOT_RATED');}}
  assert.equal(d.inheritedResearch.perShareValue,null);assert.equal(d.inheritedResearch.marginOfSafety,null);
 }
 assert.equal(rated,1);assert.equal(unrated,137);
});
test('actual bank, securities and real-estate capital golden references',()=>{
 for(const [t,value] of Object.entries({BID:'167988959000000',TCX:'44099580183375',VIC:'147566342000000',VHM:'238079067000000'})){
  const m=read(`${OUT}/issuers/${t}.json`).metrics.find(x=>x.metric==='parentAccountingCapitalReference');assert.equal(m.value,value);assert.equal(m.status,'SUPPORTED');assert.ok(existsSync(m.pdfEvidence.pdfPath));assert.equal(sha(m.pdfEvidence.pdfPath),m.pdfEvidence.sha256);
 }
});
test('TCX date key, VHM exception and HPG zero clusters remain explicit',()=>{
 assert.ok(read(`${OUT}/issuers/TCX.json`).rows.some(r=>r.period==='2025-12-31'));
 const ex=read(`${OUT}/exceptions.json`).items;
 assert.ok(ex.some(x=>x.ticker==='VHM'&&x.reasons.includes('EXTRACTED_NCI_MAGNITUDE_AND_UNRESOLVED_CLOSING_COLUMN')));
 assert.ok(read(`${OUT}/exception-probes.json`).hpg.zeroClusters.length);
});
test('protected application, sealed M1–M8 and database bytes unchanged',()=>{
 const b=read(`${OUT}/boundary-verification.json`);assert.deepEqual(b.protectedBefore,b.protectedAfter);
 for(const [p,h] of Object.entries(b.protectedBefore))assert.equal(sha(p),h,p);
 assert.equal(b.formalDIRejected,true);assert.equal(b.formalAIReviewRejected,true);
});

test('raw API replay preserves exact large numeric tokens and escaped string contents',()=>{
 const raw=losslessJson('{"value":9007199254740993.125,"caption":"2025 unit 1","nil":null,"ok":true}');
 assert.equal(raw.value,'9007199254740993.125');assert.equal(raw.caption,'2025 unit 1');assert.equal(raw.nil,null);assert.equal(raw.ok,true);
 const probes=read(`${OUT}/api-replay.json`).probes;assert.ok(probes.length>=6);
 for(const p of probes)assert.equal(sha(p.rawBinding.path),p.rawBinding.sha256);
});
