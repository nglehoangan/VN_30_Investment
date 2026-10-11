/** Exact issuer API attachments for frozen historical windows, with no age rule. */
export function mwgHistoricalVersions({read,sha,qualified,documents,cutoff,base}){
 const results=[];
 const frontendFile=base+'targeted-indexes/MWG-public-report-dependency-7.js',frontend=read(frontendFile,true).toString();
 if(!frontend.includes('51071:')||!frontend.includes('https://cdnv2-tmdt.tgdd.vn/mwgvn/ir')||!frontend.includes('function l(t)'))throw Error('MWG_OWN_ATTACHMENT_RESOLUTION_CONTRACT_MISSING');
 const boundReceipt=(file,receipt)=>receipt.httpStatus==='200'&&receipt.curlExit===0&&sha(read(file,true))===receipt.bodySha256&&Number.isFinite(Date.parse(receipt.retrievedAt))&&Date.parse(receipt.retrievedAt)<=Date.parse(cutoff);
 const frontendReceipt=read(frontendFile.replace(/\.js$/,'.json'));
 if(!boundReceipt(frontendFile,frontendReceipt))throw Error('MWG_FRONTEND_RECEIPT_NOT_BOUND');
 const rootFile=base+'targeted-indexes/MWG-public-report-year-categories.body',rootReceipt=read(rootFile.replace(/\.body$/,'.json')),root=read(rootFile);
 if(!boundReceipt(rootFile,rootReceipt)||root.code!==0||!Array.isArray(root.data)||root.data.length>=50)throw Error('MWG_YEAR_CATEGORY_NOT_BOUND');
 for(const year of ['2022','2023','2024']){
  const file=base+'targeted-indexes/MWG-public-financial-category-'+year+'.body',receipt=read(file.replace(/\.body$/,'.json')),bytes=read(file,true),packet=JSON.parse(bytes);
  if(receipt.httpStatus!=='200'||receipt.curlExit!==0||sha(bytes)!==receipt.bodySha256||!Number.isFinite(Date.parse(receipt.retrievedAt))||!Number.isFinite(Date.parse(cutoff))||Date.parse(receipt.retrievedAt)>Date.parse(cutoff)||packet.code!==0||!Array.isArray(packet.data)||packet.data.length>=50)throw Error('MWG_HISTORICAL_INVENTORY_NOT_BOUND');
  const url=new URL(receipt.url);
  if(url.origin!=='https://api.mwgshop.vn'||url.pathname!=='/gw/ir-api/api/PostAPI'||url.searchParams.get('pageIndex')!=='1'||url.searchParams.get('pageSize')!=='50'||url.searchParams.get('langID')!=='vi-VN'||url.searchParams.get('condition')!=='-1')throw Error('MWG_HISTORICAL_INVENTORY_CONTRACT_MISMATCH');
  const entries=packet.data.filter(r=>r.isActived&&!r.isDeleted);
  if(entries.some(r=>String(r.categoryID)!==url.searchParams.get('categoryID')))throw Error('MWG_HISTORICAL_INVENTORY_CATEGORY_MISMATCH');
  const categoryFile=base+'targeted-indexes/MWG-public-report-'+year+'-categories.body',categoryBytes=read(categoryFile,true),categoryReceipt=read(categoryFile.replace(/\.body$/,'.json'));
  if(!boundReceipt(categoryFile,categoryReceipt)||JSON.parse(categoryBytes).code!==0)throw Error('MWG_HISTORICAL_CATEGORY_NOT_BOUND');
  const yearCategory=root.data.filter(c=>c.isActived&&c.categoryName===year),categoryUrl=new URL(categoryReceipt.url);
  if(yearCategory.length!==1||categoryUrl.origin!=='https://api.mwgshop.vn'||categoryUrl.pathname!=='/gw/ir-api/api/CategoryAPI'||categoryUrl.searchParams.get('parentID')!==String(yearCategory[0].categoryID)||categoryUrl.searchParams.get('langID')!=='vi-VN'||categoryUrl.searchParams.get('pageIndex')!=='1'||categoryUrl.searchParams.get('pageSize')!=='50')throw Error('MWG_YEAR_PARENT_CONTRACT_MISMATCH');
  const category=JSON.parse(categoryBytes).data.find(c=>c.isActived&&c.categoryName==='Báo cáo tài chính, quản trị, thường niên');
  if(!category||String(category.categoryID)!==url.searchParams.get('categoryID'))throw Error('MWG_HISTORICAL_FINANCIAL_CATEGORY_MISMATCH');
  const relevant=entries.filter(r=>r.title===`Báo Cáo Tài Chính Hợp Nhất Kiểm Toán Năm ${year}`);
  // An advertised correction/restatement needs its own separate exact review.
  if(relevant.length!==1||entries.some(r=>/đính chính|điều chỉnh|trình bày lại/i.test(r.title)))continue;
  const row=relevant[0],attachment=row.fileLink.startsWith('https://')?row.fileLink:'https://cdnv2-tmdt.tgdd.vn/mwgvn/ir/'+row.fileLink.replace(/^\//,'');
  const document=documents.find(d=>d.ticker==='MWG'&&d.originalPublicUrl===attachment);
  const q=qualified.find(q=>q.bodyHash===document?.bodyHash&&q.ticker==='MWG'&&q.status==='TECHNICALLY_QUALIFIED_REVIEW_CANDIDATE'&&q.scope==='CONSOLIDATED'&&q.auditStatus==='AUDITED'&&q.accountingBasis==='VAS'&&q.period?.type==='ANNUAL'&&q.period.end===year+'-12-31');
  if(!q)continue;
  results.push({ticker:'MWG',securityId:q.securityId,bodyHash:q.bodyHash,documentId:q.documentId,reportingScope:q.scope,periodStart:q.period.start,periodEnd:q.period.end,inventoryVerifiedThrough:receipt.retrievedAt,inventoryFile:file,inventorySha256:receipt.bodySha256,inventoryUrl:receipt.url,attachmentUrl:attachment,postId:row.postID,publicationDate:row.publishDate,sourceProofs:[{file:rootFile,sha256:sha(read(rootFile,true))},{file:rootFile.replace(/\.body$/,'.json'),sha256:sha(read(rootFile.replace(/\.body$/,'.json'),true))},{file:frontendFile.replace(/\.js$/,'.json'),sha256:sha(read(frontendFile.replace(/\.js$/,'.json'),true))},{file:categoryFile.replace(/\.body$/,'.json'),sha256:sha(read(categoryFile.replace(/\.body$/,'.json'),true))},{file:categoryFile,sha256:sha(categoryBytes)},{file:frontendFile,sha256:sha(read(frontendFile,true))}],status:'EXACT_ISSUER_REQUIRED_HISTORICAL_VERSION_REVIEW_CANDIDATE',correctionReview:'NO_CORRECTION_ADVERTISED_IN_COMPLETE_BOUNDED_CATEGORY_RESPONSE',historicalPublicationTimeAsserted:false,knowledgeBackdated:false});
 }
 return results;
}
export function requiredHistoricalVersionWindow(observation,bodyHash,versions,qualified,cells,windows){
 const requirement=windows.find(w=>w.securityId===observation.securityId&&w.itemId===observation.itemId&&w.reportingScope===observation.reportingScope&&w.periodStart===observation.periodStart&&w.periodEnd===observation.periodEnd);
 if(!requirement)return null;
 const version=versions.find(v=>v.status==='EXACT_ISSUER_REQUIRED_HISTORICAL_VERSION_REVIEW_CANDIDATE'&&v.securityId===observation.securityId&&v.ticker===observation.ticker&&v.bodyHash===bodyHash&&v.reportingScope===observation.reportingScope&&v.periodEnd===observation.periodEnd&&(observation.periodType==='INSTANT'||v.periodStart===observation.periodStart));
 if(!version)return null;
 const document=qualified.find(q=>q.documentId===version.documentId&&q.bodyHash===bodyHash&&q.status==='TECHNICALLY_QUALIFIED_REVIEW_CANDIDATE'&&q.scope===observation.reportingScope&&q.period?.end===observation.periodEnd);
 if(!document)return null;
 const proofs=cells.filter(c=>c.documentId===document.documentId&&c.bodyHash===bodyHash&&c.securityId===observation.securityId&&c.itemId===observation.itemId&&c.scope===observation.reportingScope&&c.periodType===observation.periodType&&c.period.end===observation.periodEnd&&(c.periodType==='INSTANT'?c.period.end:c.period.start)===observation.periodStart&&c.normalizedCanonicalValue===observation.normalized.value&&c.status==='VERIFIED_TRANSCRIPTION_REVIEW_CANDIDATE'&&c.sourcePageEvidenceHashes?.length>=2);
 return proofs.length?{kind:'EXACT_REQUIRED_HISTORICAL_ISSUER_VERSION',requiredPeriodOrVersion:observation.periodEnd,requiredWindow:requirement,version,documentId:document.documentId,bodyHash,proofs}:null;
}
