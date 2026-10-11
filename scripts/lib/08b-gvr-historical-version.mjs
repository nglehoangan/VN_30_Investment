/** Exact issuer annual inventories; advertised corrections require source-bound scope. */
export function gvrHistoricalVersions({read,sha,qualified,documents,cutoff,base}){
 if(!Number.isFinite(Date.parse(cutoff)))throw Error('GVR_HISTORICAL_CUTOFF_REQUIRED');
 const results=[];
 const bound=(file,url)=>{
  const bytes=read(file,true),receiptFile=file.replace(/\.body$/,'.json'),receipt=read(receiptFile);
  if(receipt.url!==url||receipt.httpStatus!=='200'||receipt.curlExit!==0||sha(bytes)!==receipt.bodySha256||!Number.isFinite(Date.parse(receipt.retrievedAt))||Date.parse(receipt.retrievedAt)>Date.parse(cutoff))throw Error('GVR_ISSUER_INVENTORY_NOT_BOUND');
  return {bytes,receipt,receiptFile};
 };
 for(const year of ['2023','2024']){
  const archiveYear=String(Number(year)+1),url=`https://vrg.vn/quan-he-co-dong/bao-cao-tai-chinh/${archiveYear}-bao-cao-tai-chinh/`;
  const sources=[],cards=[];
  for(const suffix of year==='2024'?['','-page2']:['']){
   const file=`${base}targeted-indexes/GVR-required-history-${archiveYear}${suffix}.body`,p=bound(file,url+(suffix?'page/2/':'')),html=p.bytes.toString();
   const pages=[...html.matchAll(/href="([^"]+\/page\/\d+\/)"/g)].map(m=>m[1]);
   if(pages.some(u=>u!==url+'page/2/'&&u!==url+'page/1/')||year==='2023'&&pages.length||year==='2024'&&!suffix&&!pages.includes(url+'page/2/'))throw Error('GVR_COMPLETE_BOUNDED_CATEGORY_REQUIRED');
   for(const card of html.split('<div data-elementor-type="loop-item"').slice(1)){
    const title=card.match(/<h3[^>]*>\s*<a href="([^"]+)">([^<]+)<\/a>/);
    if(title)cards.push({url:title[1].replaceAll('&amp;','&'),title:title[2],date:card.match(/elementor-icon-list-text">(\d{2}\/\d{2}\/\d{4})/)?.[1],file,...p});
   }
   sources.push({file,sha256:sha(p.bytes)},{file:p.receiptFile,sha256:sha(read(p.receiptFile,true))});
  }
  const corrections=cards.filter(c=>/đính chính|điều chỉnh|thay thế|trình bày lại/i.test(c.title));
  if(corrections.length){
   if(year!=='2023'||corrections.length!==1||corrections[0].title!=='Đính chính Báo cáo tài chính hợp nhất quý 3 năm 2024')continue;
   const doc=documents.find(d=>d.ticker==='GVR'&&d.originalPublicUrl===corrections[0].url);
   if(doc?.bodyHash!=='2866be3afe93f177144bff76e941b0489bc7202d9241ce4d761cda51e9b762e5')throw Error('GVR_CORRECTION_BODY_REQUIRED');
   const pdfFile=base+doc.file;
   if(sha(read(pdfFile,true))!==doc.bodyHash||!Number.isFinite(Date.parse(doc.retrievedAt))||Date.parse(doc.retrievedAt)>Date.parse(cutoff))throw Error('GVR_CORRECTION_BODY_NOT_BOUND');
   const file=base+'ocr/'+doc.bodyHash+'-p1.json',bytes=read(file,true),page=JSON.parse(bytes),imageFile=file.replace(/\.json$/,'.png');
   if(page.bodyHash!==doc.bodyHash||page.page!==1||page.renderSha256!==sha(read(imageFile,true))||page.engineA!=='APPLE_VISION_ACCURATE_IMAGE_OCR'||!page.engineB.startsWith('TESSERACT_'))throw Error('GVR_CORRECTION_READERS_NOT_BOUND');
   const fold=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replaceAll('đ','d').replaceAll('Đ','D').toLowerCase();
   for(const stream of ['passA','passB']){
    const text=fold(page[stream].map(w=>w.text).join(' '));
    if(!text.includes('hop nhat quy 3 nam 2024')||!text.includes('30/9/2024')||!text.includes('155')||!text.includes('tai san ngan han khac')||!text.includes('203.781.556')||!text.includes('khong lam thay doi ket qua kinh doanh')||!text.includes('chi tieu khac tren bang can doi ke toan'))throw Error('GVR_CORRECTION_SCOPE_NOT_VERIFIED');
   }
   sources.push({file:pdfFile,sha256:doc.bodyHash},{file,sha256:sha(bytes)},{file:imageFile,sha256:page.renderSha256});
  }
  const matches=cards.filter(c=>year==='2023'?c.title.startsWith('Báo cáo tài chính hợp nhất năm 2023 của Tập đoàn Công nghiệp Cao su Việt Nam'):c.title==='Báo cáo tài chính hợp nhất năm 2024 (kèm Giải trình)');
  if(matches.length!==1)continue;
  const card=matches[0],doc=documents.find(d=>d.ticker==='GVR'&&d.originalPublicUrl===card.url),q=qualified.find(q=>q.bodyHash===doc?.bodyHash&&q.ticker==='GVR'&&q.status==='TECHNICALLY_QUALIFIED_REVIEW_CANDIDATE'&&q.scope==='CONSOLIDATED'&&q.auditStatus==='AUDITED'&&q.accountingBasis==='VAS'&&q.period?.type==='ANNUAL'&&q.period.start===year+'-01-01'&&q.period.end===year+'-12-31');
  if(!q||!card.date)continue;
  results.push({ticker:'GVR',securityId:q.securityId,bodyHash:q.bodyHash,documentId:q.documentId,reportingScope:q.scope,periodStart:q.period.start,periodEnd:q.period.end,inventoryVerifiedThrough:card.receipt.retrievedAt,inventoryFile:card.file,inventorySha256:card.receipt.bodySha256,inventoryUrl:card.receipt.url,attachmentUrl:card.url,publicationDate:card.date,sourceProofs:sources,status:'EXACT_ISSUER_REQUIRED_HISTORICAL_VERSION_REVIEW_CANDIDATE',correctionReview:corrections.length?'EXACT_Q3_2024_CODE_155_CORRECTION_OUTSIDE_FY2023_REQUIRED_WINDOW':'NO_CORRECTION_ADVERTISED_IN_COMPLETE_TWO_PAGE_CATEGORY',historicalPublicationTimeAsserted:false,knowledgeBackdated:false});
 }
 return results;
}
