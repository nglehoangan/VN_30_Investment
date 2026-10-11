/** Exact HDB annual editions from the complete observed public category response. */
import {createDecipheriv} from 'node:crypto';
const compact=t=>t.normalize('NFD').replace(/\p{M}/gu,'').replace(/[đĐ]/g,'d').toLowerCase().replace(/[^a-z0-9]/g,'');
export function hdbHistoricalVersions({read,sha,qualified,documents,cutoff,base}){
 if(!Number.isFinite(Date.parse(cutoff)))throw Error('HDB_HISTORICAL_CUTOFF_REQUIRED');
 const sources=[],load=(file,url)=>{
  const bytes=read(file,true),receiptFile=file.replace(/\.(body|js)$/,'.json'),receipt=read(receiptFile);
  if(receipt.url!==url||receipt.httpStatus!=='200'||receipt.curlExit!==0||sha(bytes)!==receipt.bodySha256||!Number.isFinite(Date.parse(receipt.retrievedAt))||Date.parse(receipt.retrievedAt)>Date.parse(cutoff))throw Error('HDB_HISTORICAL_SOURCE_NOT_BOUND');
  sources.push({file,sha256:sha(bytes)},{file:receiptFile,sha256:sha(read(receiptFile,true))});return {bytes,receipt};
 };
 const categoryFile=base+'targeted-indexes/HDB-public-financial-category.body',categoryUrl='https://hdbank.com.vn/api/investors/thong-tin-nha-dau-tu/bao-cao-tai-chinh',category=load(categoryFile,categoryUrl);
 const frontendFile=base+'targeted-indexes/HDB-public-report-dependency-0.js',frontend=load(frontendFile,'https://hdbank.com.vn/_next/static/chunks/pages/_app-8f1dd5f2a8d8a8ad.js').bytes.toString();
 const start=frontend.indexOf('74904:function'),end=frontend.indexOf('43210:function',start),decoderModule=frontend.slice(start,end),key=decoderModule.match(/Utf8.parse\("([^\"]+)"\)/)?.[1];
 if(start<0||end<=start||!key||!decoderModule.includes('AES.decrypt(t,e')||!decoderModule.includes('mode.ECB')||!decoderModule.includes('pad.Pkcs7')||!frontend.includes('/investors/'))throw Error('HDB_OBSERVED_PUBLIC_DECODER_REQUIRED');
 const decoder=createDecipheriv('aes-192-ecb',Buffer.from(key),null),decoded=JSON.parse(Buffer.concat([decoder.update(Buffer.from(category.bytes.toString(),'base64')),decoder.final()]).toString());
 const decodedFile=base+'targeted-indexes/HDB-public-financial-category-decoded.json',proofFile=decodedFile.replace('.json','.receipt.json'),proof=read(proofFile);
 if(proof.method!=='EXACT_PUBLIC_FRONTEND_RESPONSE_DECODER'||proof.sourceBodySha256!==sha(category.bytes)||proof.decoderSourceSha256!==sha(read(frontendFile,true))||proof.decodedBodySha256!==sha(read(decodedFile,true))||JSON.stringify(decoded)!==JSON.stringify(read(decodedFile))||proof.authenticationUsed!==false||proof.accessControlBypassed!==false)throw Error('HDB_PUBLIC_DECODER_REPLAY_REQUIRED');
 sources.push({file:decodedFile,sha256:sha(read(decodedFile,true))},{file:proofFile,sha256:sha(read(proofFile,true))});
 if(!Array.isArray(decoded.menuList)||!decoded.menuList.length||new Set(decoded.menuList.map(e=>e.name)).size!==decoded.menuList.length||decoded.menuList.some(e=>typeof e.content!=='string'))throw Error('HDB_COMPLETE_CATEGORY_REQUIRED');
 const results=[];
 for(const year of [2022,2023,2024]){
  const entry=decoded.menuList.find(e=>e.name===String(year));if(!entry)continue;
  const attachments=[...entry.content.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gs)].map(m=>({url:m[1].replaceAll('&amp;','&'),title:compact(m[2].replace(/<[^>]+>/g,'').replace(/&nbsp;|&#160;|&#xA0;/gi,' '))}));
  const matches=attachments.filter(a=>a.title.includes('baocaotaichinhhopnhatnam'+year)&&a.title.includes('kiemtoan'));
  if(matches.length!==1||/dinhchinh|dieuchinh|thaythe|trinhbaylai/.test(compact(entry.content)))continue;
  const attachment=matches[0].url;if(new URL(attachment).origin!=='https://cdn.hdbank.com.vn')throw Error('HDB_ISSUER_ANNUAL_ATTACHMENT_REQUIRED');
  let doc=documents.find(d=>d.ticker==='HDB'&&d.originalPublicUrl===attachment),correspondence=null,editionSources=[];
  if(year===2024){
   const file=base+'hdb-annual-2024-edition-correspondence.json';correspondence=read(file);
   if(correspondence.status!=='EXACT_AUDITOR_EDITION_CORRESPONDENCE_REVIEW_CANDIDATE'||correspondence.ticker!=='HDB'||correspondence.periodStart!=='2024-01-01'||correspondence.periodEnd!=='2024-12-31'||correspondence.scope!=='CONSOLIDATED'||correspondence.auditReportNumber!=='HCM16978'||correspondence.issuerAttachmentUrl!==attachment||correspondence.oversizedIssuerDocumentAdmitted!==false||correspondence.historicalPublicationTimestampAsserted!==false||correspondence.independentHumanApproval!==null||!Number.isFinite(Date.parse(correspondence.recordedAt))||Date.parse(correspondence.recordedAt)>Date.parse(cutoff))throw Error('HDB_EXACT_EDITION_CORRESPONDENCE_REQUIRED');
   for(const p of correspondence.sourceProofs)if(sha(read(p.file,true))!==p.sha256)throw Error('HDB_EDITION_SOURCE_CHANGED');
   const requiredProofs=['hdb-annual-four-large-binary-exception.json',correspondence.providerBodyHash+'.pdf',...['5','6','10','11','12'].flatMap(n=>['json','png'].map(ext=>'hdb-issuer-support/ocr/'+correspondence.issuerBodyHash+'-p'+n+'.'+ext)),...['5','6'].flatMap(n=>['json','png'].map(ext=>'ocr/'+correspondence.providerBodyHash+'-p'+n+'.'+ext))];
   if(requiredProofs.some(f=>!correspondence.sourceProofs.some(p=>p.file===base+f)))throw Error('HDB_EDITION_PROOF_DEPENDENCIES_REQUIRED');
   const markers=['HCM16978','0849-2023-006-1','4166-2022-006-1','31 tháng 12 năm 2024','31 tháng 3 năm 2025','PwC','hợp nhất','Chuẩn mực Kế toán Việt Nam'];
   for(const [body,dir] of [[correspondence.issuerBodyHash,'hdb-issuer-support/ocr/'],[correspondence.providerBodyHash,'ocr/']]){
    const p=read(base+dir+body+'-p6.json');if(p.bodyHash!==body||p.page!==6||p.engineA===p.engineB)throw Error('HDB_AUDIT_PAGE_BINDING_REQUIRED');
    for(const key of ['passA','passB'])if(markers.some(m=>!compact(p[key].map(w=>w.text).join(' ')).includes(compact(m))))throw Error('HDB_AUDITOR_EDITION_IDENTIFIERS_DIFFER');
   }
   const expected={BANK_NET_INTEREST_INCOME:[10,'30857076'],BANK_OPERATING_EXPENSES:[10,'-11980755'],NET_INCOME_ATTRIBUTABLE_COMMON:[10,'12762953'],CFO:[11,'8742393'],CFI_SUPPORTING:[12,'-1180084'],CFF_SUPPORTING:[12,'-2712550'],NET_CASH_CHANGE_SUPPORTING:[12,'4849759']};
   const numeric=s=>/^\(?[\d.]+\)?$/.test(s)?(s.startsWith('(')?'-':'')+s.replace(/[().]/g,''):null;
   if(correspondence.currentColumnCheckpoints.length!==7||new Set(correspondence.currentColumnCheckpoints.map(c=>c.itemId)).size!==7)throw Error('HDB_EDITION_CHECKPOINTS_REQUIRED');
   for(const c of correspondence.currentColumnCheckpoints){const spec=expected[c.itemId];if(!spec||c.issuerPage!==spec[0]||c.providerPage!==spec[0]||c.value!==spec[1])throw Error('HDB_EDITION_CHECKPOINT_CHANGED');const p=read(base+'hdb-issuer-support/ocr/'+correspondence.issuerBodyHash+'-p'+c.issuerPage+'.json');for(const k of ['passA','passB'])if(p[k].filter(w=>w.x>.69&&w.x<.81&&w.confidence>=.8&&numeric(w.text)===c.value).length!==1)throw Error('HDB_EDITION_CURRENT_COLUMN_NOT_VERIFIED');}
   doc=documents.find(d=>d.ticker==='HDB'&&d.bodyHash===correspondence.providerBodyHash&&new URL(d.originalPublicUrl).hostname==='static2.vietstock.vn');
   editionSources=[{file,sha256:sha(read(file,true))},...correspondence.sourceProofs];
  }
  const q=qualified.find(q=>q.bodyHash===doc?.bodyHash&&q.ticker==='HDB'&&q.status==='TECHNICALLY_QUALIFIED_REVIEW_CANDIDATE'&&q.scope==='CONSOLIDATED'&&q.auditStatus==='AUDITED'&&q.accountingBasis==='VAS'&&q.period?.type==='ANNUAL'&&q.period.start===year+'-01-01'&&q.period.end===year+'-12-31');
  if(!q)continue;
  results.push({ticker:'HDB',securityId:q.securityId,bodyHash:q.bodyHash,documentId:q.documentId,reportingScope:q.scope,periodStart:q.period.start,periodEnd:q.period.end,inventoryVerifiedThrough:category.receipt.retrievedAt,inventoryFile:categoryFile,inventorySha256:sha(category.bytes),inventoryUrl:categoryUrl,attachmentUrl:doc.originalPublicUrl,issuerAttachmentUrl:attachment,sourceProofs:[...sources,...editionSources],status:'EXACT_ISSUER_REQUIRED_HISTORICAL_VERSION_REVIEW_CANDIDATE',correctionReview:'NO_CORRECTION_ADVERTISED_IN_COMPLETE_EXACT_YEAR_CATEGORY',historicalPublicationTimeAsserted:false,knowledgeBackdated:false});
 }
 return results;
}
