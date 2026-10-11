/** ACB's complete two-page 2025 category binds the exact required H1 edition. */
export function acbPriorVersions({read,sha,qualified,documents,cutoff,base}){
 if(!Number.isFinite(Date.parse(cutoff)))throw Error('ACB_PRIOR_CUTOFF_REQUIRED');
 const sources=[],load=(file,url)=>{
  const bytes=read(file,true),receiptFile=file.replace(/\.(body|js)$/,'.json'),receipt=read(receiptFile);
  if(receipt.url!==url||receipt.httpStatus!=='200'||receipt.curlExit!==0||sha(bytes)!==receipt.bodySha256||!Number.isFinite(Date.parse(receipt.retrievedAt))||Date.parse(receipt.retrievedAt)>Date.parse(cutoff))throw Error('ACB_PRIOR_SOURCE_NOT_BOUND');
  sources.push({file,sha256:sha(bytes)},{file:receiptFile,sha256:sha(read(receiptFile,true))});return{bytes,receipt};
 };
 const firstFile=base+'targeted-indexes/ACB-required-half-year-2025.body',first=load(firstFile,'https://acb.com.vn/vi/nha-dau-tu/bao-cao-tai-chinh-2025');
 const script=first.bytes.toString().match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s);
 if(!script)throw Error('ACB_OWN_CATEGORY_DATA_REQUIRED');
 const blocks=[],walk=v=>{if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object'){if(v.type==='category'&&v.category?.some(c=>c.id===1541)&&v.default_data?.meta)blocks.push(v);Object.values(v).forEach(walk);}};walk(JSON.parse(script[1]));
 if(blocks.length!==1||blocks[0].limit!=='9'||blocks[0].category.length!==1||blocks[0].category[0].slug!=='bao-cao-tai-chinh-2025')throw Error('ACB_EXACT_YEAR_CATEGORY_REQUIRED');
 const secondFile=base+'targeted-indexes/ACB-required-half-year-2025-category-page2.body',secondReceipt=read(secondFile.replace('.body','.json')),u=new URL(secondReceipt.url);
 const required={'limit':'9','search[categories.category_id:in]':'1541','search[is_active:in]':'1','search_type':'and','search[type:not]':'notification','page':'2'};
 if(u.origin!=='https://acb.com.vn'||u.pathname!=='/api/front/v1/posts'||u.searchParams.size!==6||Object.entries(required).some(([k,v])=>u.searchParams.get(k)!==v))throw Error('ACB_OWN_CATEGORY_REQUEST_REQUIRED');
 const second=load(secondFile,u.href),pages=[blocks[0].default_data,JSON.parse(second.bytes)];
 if(pages.some((p,i)=>p.meta.current_page!==i+1||p.meta.last_page!==2||p.meta.total!==16||p.meta.per_page!==9||p.data.length!==(i?7:9)))throw Error('ACB_COMPLETE_TWO_PAGE_CATEGORY_REQUIRED');
 const frontendFile=base+'targeted-indexes/ACB-required-history-app.js',frontendRoute=first.bytes.toString().match(/<script src="([^"]+\/pages\/_app-[^"]+\.js)"/);
 if(!frontendRoute)throw Error('ACB_OWN_FRONTEND_REQUIRED');
 const frontend=load(frontendFile,'https://acb.com.vn'+frontendRoute[1]).bytes.toString();
 if(!frontend.includes('32695:function')||!frontend.includes('getPostByParams')||!frontend.includes('search[categories.category_id:in]')||!frontend.includes('"https://acb.com.vn"')||!frontend.includes('"front/v1"'))throw Error('ACB_OWN_FRONTEND_CONTRACT_REQUIRED');
 const entries=pages.flatMap(p=>p.data);
 if(new Set(entries.map(e=>e.id)).size!==16||entries.some(e=>!e.categories?.some(c=>c.id===1541)))throw Error('ACB_YEAR_ENTRIES_NOT_CLOSED');
 if(entries.some(e=>/đính chính|điều chỉnh|thay thế|trình bày lại/i.test(e.title)))return[];
 const matches=entries.filter(e=>e.title==='Báo cáo tài chính hợp nhất bán niên 2025');if(matches.length!==1)return[];
 const attachment=matches[0].featured_image?.path;if(!attachment?.startsWith('https://acb.com.vn/acbwebsite/files/'))throw Error('ACB_OWN_ATTACHMENT_REQUIRED');
 const url=encodeURI(attachment),doc=documents.find(d=>d.ticker==='ACB'&&d.originalPublicUrl===url),q=qualified.find(q=>q.bodyHash===doc?.bodyHash&&q.ticker==='ACB'&&q.status==='TECHNICALLY_QUALIFIED_REVIEW_CANDIDATE'&&q.scope==='CONSOLIDATED'&&q.auditStatus==='REVIEWED'&&q.accountingBasis==='VAS'&&q.period?.type==='YTD'&&q.period.start==='2025-01-01'&&q.period.end==='2025-06-30');
 if(!q)return[];
 return[{ticker:'ACB',securityId:q.securityId,bodyHash:q.bodyHash,documentId:q.documentId,reportingScope:q.scope,periodStart:q.period.start,periodEnd:q.period.end,inventoryVerifiedThrough:second.receipt.retrievedAt,inventoryFile:secondFile,inventorySha256:second.receipt.bodySha256,inventoryUrl:second.receipt.url,attachmentUrl:url,sourceProofs:sources,status:'EXACT_ISSUER_REQUIRED_HISTORICAL_VERSION_REVIEW_CANDIDATE',correctionReview:'NO_CORRECTION_ADVERTISED_IN_COMPLETE_TWO_PAGE_2025_CATEGORY',historicalPublicationTimeAsserted:false,knowledgeBackdated:false}];
}
