/** Complete, bounded own issuer year inventories for exact frozen annual windows. */
export function hpgHistoricalVersions({read,sha,qualified,documents,cutoff,base}){
 const results=[];
 if(!Number.isFinite(Date.parse(cutoff)))throw Error('HPG_HISTORICAL_CUTOFF_REQUIRED');
 for(const [year,title] of [['2022','Báo cáo tài chính hợp nhất năm 2022'],['2023','Báo cáo tài chính hợp nhất năm 2023 sau kiểm toán'],['2024','Báo cáo tài chính hợp nhất năm 2024']]){
  const publicationYear=String(Number(year)+1),sources=[],cards=[];
  for(const suffix of ['','-page2']){
   const file=base+'targeted-indexes/HPG-required-history-'+publicationYear+suffix+'.body',bytes=read(file,true),receiptFile=file.replace(/\.body$/,'.json'),receipt=read(receiptFile);
   const expected='https://www.hoaphat.com.vn/quan-he-co-dong/bao-cao-tai-chinh?sort_year='+publicationYear+(suffix?'&page=2':'');
   if(receipt.httpStatus!=='200'||receipt.curlExit!==0||sha(bytes)!==receipt.bodySha256||receipt.url!==expected||!Number.isFinite(Date.parse(receipt.retrievedAt))||Date.parse(receipt.retrievedAt)>Date.parse(cutoff))throw Error('HPG_HISTORICAL_INVENTORY_NOT_BOUND');
   const html=bytes.toString(),links=[...html.matchAll(/href="([^"]+\bpage=[^"]+)"/g)].map(m=>m[1].replaceAll('&amp;','&'));
   const allowed=new Set([expected.replace(/&page=2$/,''),expected.replace(/&page=2$/,'')+'&page=1',expected.replace(/&page=2$/,'')+'&page=2']);
   if(!html.includes('<h1 class="title">Báo cáo tài chính</h1>')||links.some(u=>!allowed.has(u))||!suffix&&!links.includes(expected+'&page=2'))throw Error('HPG_COMPLETE_BOUNDED_YEAR_CATEGORY_REQUIRED');
   for(const card of html.split(/(?=<div class="item )/).slice(1)){
    const match=card.match(/<a\s+[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/);
    if(match)cards.push({url:match[1].replaceAll('&amp;','&'),title:match[2].trim(),file,receiptFile,receipt,date:card.match(/<div class="time">\s*(\d{2}\/\d{2}\/\d{4})/)?.[1]});
   }
   sources.push({file,sha256:sha(bytes)},{file:receiptFile,sha256:sha(read(receiptFile,true))});
  }
  const matches=cards.filter(c=>c.title===title);
  // Any advertised correction needs an exact separate version review.
  if(matches.length!==1||cards.some(c=>/đính chính|điều chỉnh|thay thế|trình bày lại/i.test(c.title)))continue;
  const card=matches[0],document=documents.find(d=>d.ticker==='HPG'&&d.originalPublicUrl===card.url);
  const q=qualified.find(q=>q.ticker==='HPG'&&q.bodyHash===document?.bodyHash&&q.status==='TECHNICALLY_QUALIFIED_REVIEW_CANDIDATE'&&q.scope==='CONSOLIDATED'&&q.accountingBasis==='VAS'&&q.auditStatus==='AUDITED'&&q.period?.type==='ANNUAL'&&q.period.start===year+'-01-01'&&q.period.end===year+'-12-31');
  if(!q||!card.date)continue;
  results.push({ticker:'HPG',securityId:q.securityId,bodyHash:q.bodyHash,documentId:q.documentId,reportingScope:q.scope,periodStart:q.period.start,periodEnd:q.period.end,inventoryVerifiedThrough:card.receipt.retrievedAt,inventoryFile:card.file,inventorySha256:card.receipt.bodySha256,inventoryUrl:card.receipt.url,attachmentUrl:card.url,publicationDate:card.date,sourceProofs:sources,status:'EXACT_ISSUER_REQUIRED_HISTORICAL_VERSION_REVIEW_CANDIDATE',correctionReview:'NO_CORRECTION_ADVERTISED_IN_COMPLETE_TWO_PAGE_ISSUER_YEAR_CATEGORY',historicalPublicationTimeAsserted:false,knowledgeBackdated:false});
 }
 return results;
}
