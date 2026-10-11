/** Exact retained 2026 issuer indexes for required Q1 operands; no URL/title-only winner. */
export function retainedQ1Versions({read,sha,qualified,documents,cutoff,base}){
 const manifestFile=base+'retained-public-index-manifest.json',manifest=read(manifestFile),out=[];
 if(!Number.isFinite(Date.parse(cutoff)))throw Error('Q1_VERSION_CUTOFF_REQUIRED');
 const specs=[
  {ticker:'VNM',indexHash:'f510b5a811052c7f3265286090b5191b89101da88af891738293dc143cd30e36',indexUrl:'https://www.vinamilk.com.vn/investor/reports/financial',bodyHash:'aa9e9d9a18fbbf05cc23c35b71a5dbae7a0a858a81727ff2e0d1c8ad047cb451',url:'https://d8um25gjecm9v.cloudfront.net/cms/20260429_VNM_BCTC_DA_SOAT_XET_Q1_2026_HOP_NHAT_VN_d44326741a.pdf',audit:'REVIEWED'},
  {ticker:'VRE',indexHash:'5959b1dc7664a3460758b27811878f7141b2f1bd3171e443b0c5bd7f600a8946',indexUrl:'https://ir.vincom.com.vn/bao-cao-tai-chinh-va-tom-tat-ket-qua-kinh-doanh/',bodyHash:'81fd8c18b29a256b57232895ca0deb4bad9106745aa347a751ef3ba9f8297dcc',url:'https://ir.vincom.com.vn/wp-content/uploads/2026/04/Bao-cao-tai-chinh-hop-nhat-Quy-1.2026.pdf',audit:'UNKNOWN'},
 ];
 const text=s=>s.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
 for(const spec of specs){
  const receipt=manifest.records.find(r=>r.bodySha256===spec.indexHash);
  if(!receipt||receipt.url!==spec.indexUrl||receipt.httpStatus!==200||receipt.publicResponseBound!==true||receipt.error!==null||!Number.isFinite(Date.parse(receipt.retrievedAt))||Date.parse(receipt.retrievedAt)>Date.parse(cutoff))throw Error('Q1_OWN_PUBLIC_INDEX_RECEIPT_REQUIRED');
  const bytes=read(receipt.bodyFile,true);if(sha(bytes)!==spec.indexHash||bytes.length!==receipt.bytes)throw Error('Q1_INDEX_COMPLETE_BODY_CHANGED');
  const html=bytes.toString();
  if(spec.ticker==='VNM'){
   const cards=[...html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)].map(m=>({url:m[1],text:text(m[2])}));
   const q1=cards.filter(c=>/\b2026 Q1\b/.test(c.text));
   if(q1.some(c=>/đính chính|điều chỉnh|thay thế|trình bày lại/i.test(c.text)))return[];
   const consolidated=q1.filter(c=>c.text.includes('Báo cáo tài chính hợp nhất'));
   if(consolidated.length!==1||consolidated[0].url!==spec.url||!consolidated[0].text.includes('29/04/2026')||!consolidated[0].text.includes('Đã soát xét/kiểm toán'))throw Error('VNM_EXACT_Q1_REVIEWED_CARD_REQUIRED');
  }else{
   const tables=[...html.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/g)].map(m=>m[1]).filter(t=>t.includes(spec.url));
   if(tables.length!==1)throw Error('VRE_EXACT_Q1_TABLE_REQUIRED');
   const table=tables[0],headers=[...table.matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/g)].map(m=>text(m[1]));
   if(JSON.stringify(headers)!==JSON.stringify(['','Q1','Q2','Q3','Q4'])||/đính chính|điều chỉnh|thay thế/i.test(text(table)))throw Error('VRE_Q1_COLUMN_OR_CORRECTION_AMBIGUOUS');
   const rows=[...table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)].map(m=>[...m[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/g)].map(c=>c[1]));
   const original=rows.filter(r=>text(r[0]??'')==='Báo Cáo Hợp Nhất'),reviewed=rows.filter(r=>text(r[0]??'')==='Báo Cáo Hợp Nhất Kiểm Toán/Soát Xét');
   if(original.length!==1||reviewed.length!==1||original[0].length!==5||reviewed[0].length!==5||text(reviewed[0][1])!==''||!original[0][1].includes('href="'+spec.url+'"')||text(original[0][1])!=='PDF 24/04/2026')throw Error('VRE_Q1_ORIGINAL_AND_EMPTY_REVIEWED_CELL_REQUIRED');
  }
  const q=qualified.find(q=>q.ticker===spec.ticker&&q.bodyHash===spec.bodyHash&&q.status==='TECHNICALLY_QUALIFIED_REVIEW_CANDIDATE'&&q.scope==='CONSOLIDATED'&&q.accountingBasis==='VAS'&&q.auditStatus===spec.audit&&q.period?.start==='2026-01-01'&&q.period.end==='2026-03-31'&&q.period.type==='QUARTER');
  // Qualification pins the preserved receipt identity; other receipts are not replaced.
  const doc=documents.find(d=>d.ticker===spec.ticker&&d.bodyHash===spec.bodyHash&&d.originalPublicUrl===spec.url&&d.documentId===q?.documentId);
  if(!doc)throw Error('Q1_QUALIFICATION_RECEIPT_IDENTITY_REQUIRED');
  if(!q)throw Error('Q1_QUALIFIED_EXACT_SOURCE_PERIOD_REQUIRED');
  out.push({ticker:spec.ticker,securityId:q.securityId,bodyHash:q.bodyHash,documentId:q.documentId,reportingScope:q.scope,periodStart:q.period.start,periodEnd:q.period.end,inventoryVerifiedThrough:receipt.retrievedAt,inventoryFile:receipt.bodyFile,inventorySha256:spec.indexHash,inventoryUrl:spec.indexUrl,attachmentUrl:spec.url,sourceProofs:[{file:manifestFile,sha256:sha(read(manifestFile,true))},{file:receipt.bodyFile,sha256:spec.indexHash}],status:'EXACT_ISSUER_REQUIRED_HISTORICAL_VERSION_REVIEW_CANDIDATE',correctionReview:spec.ticker==='VNM'?'ONE_EXACT_RENDERED_2026_Q1_CONSOLIDATED_REVIEWED_CARD_NO_CORRECTION_CARD':'EXACT_Q1_CONSOLIDATED_COLUMN_WITH_EMPTY_REVIEWED_Q1_CELL_NO_CORRECTION_ROW',historicalPublicationTimeAsserted:false,knowledgeBackdated:false});
 }
 return out;
}
