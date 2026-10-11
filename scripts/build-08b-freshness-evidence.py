"""Bind inspected current issuer disclosure surfaces; unproved listings stay UNKNOWN."""
import pathlib,json,hashlib,re,datetime,html
B=pathlib.Path('data/initialization-08b-remediation-work');out=[]
for ticker in ['FPT','CTG','TCB','GAS','GVR','HPG','SSB','SAB','VJC','ACB','BID','LPB']:
 basename='LPB-current-investor' if ticker=='LPB' else 'BID-current-reports' if ticker=='BID' else 'TCB-current-live' if ticker=='TCB' else 'SAB-current-2026' if ticker=='SAB' else 'ACB-current-2026' if ticker=='ACB' else ticker
 receipt=json.loads((B/'targeted-indexes'/f'{basename}.json').read_text());file=B/'targeted-indexes'/f'{basename}.body';body=file.read_bytes()
 if hashlib.sha256(body).hexdigest()!=receipt['bodySha256']:raise ValueError('INDEX_BYTES_CHANGED')
 text=html.unescape(body.decode('utf8'));proof=None
 if ticker=='LPB':
  label='Báo cáo tài chính bán niên 2026 đã được soát xét'
  english='LPBank Reviewed Interim Financial Statements for 6 months period ended 30 June 2026'
  if label in text and english in text:proof={'method':'ISSUER_EXPLICIT_CURRENT_INTERIM_REPORT_LIST','exactSourceLabel':label,'corroboratingSourceLabel':english,'sourceDisplayedDate':'14/08/2026','versionBindingRequirement':'Exact reviewed source-period and standalone filing-scope evidence; listing has no static attachment href.'}
 if ticker=='BID':
  label='Báo cáo tài chính hợp nhất giữa niên độ đã được soát xét cho kỳ hoạt động 6 tháng kết thúc ngày 30/06/2026'
  match=re.search(r"title: formatTitle\('"+re.escape(label)+r"'\),\s*publishdate: '([^']+)',\s*file_title: formatTitle\('([^']+)'\)",text)
  if match:proof={'method':'ISSUER_EXPLICIT_REPORT_LIST_DATA_OBJECT','exactSourceLabel':label,'observedDocumentHref':match.group(2),'sourceDisplayedDate':match.group(1),'dateUse':'INVENTORY_ONLY_NOT_HISTORICAL_AVAILABILITY_OVERRIDE'}
 if ticker=='FPT':
  match=re.search(r'<a\b[^>]*href="([^"]+)"[^>]*>Báo cáo tài chính hợp nhất quý 2 năm 2026</a>',text)
  if match:proof={'method':'ISSUER_DESIGNATED_CURRENT_FINANCIAL_REPORT_CARD','exactSourceLabel':'Báo cáo tài chính hợp nhất quý 2 năm 2026','observedDocumentHref':match.group(1)}
 if ticker=='CTG':
  match=re.search(r'href="([^"]*cbtt-bao-cao-tai-chinh-6-thang-dau-nam-2026-rieng-le-hop-nhat-da-duoc-soat-xet-va-giai-trinh-bien-dong-loi-nhuan[^"]*)"',text)
  if match:proof={'method':'OFFICIAL_REVERSE_CHRONOLOGICAL_PERIODIC_DISCLOSURE_LIST','exactSourceLabel':'CBTT báo cáo tài chính 6 tháng đầu năm 2026 riêng lẻ, hợp nhất đã được soát xét và giải trình biến động lợi nhuận','observedDocumentHref':match.group(1)}
 if ticker=='TCB':
  section=text.split('Latest Financials</h2>',1)[1].split('Credit Ratings',1)[0] if 'Latest Financials</h2>' in text else ''
  match=re.search(r'href="([^"]*2q26-press-release-eng.pdf)"',section)
  label='6M26 Press Release – 22/07/2026'
  if match and label in section and 'Techcombank 6M26 Financial Statements' in section:proof={'method':'ISSUER_DESIGNATED_LATEST_FINANCIALS_CARDS','exactSourceLabel':label,'observedDocumentHref':match.group(1),'publicationMetadataLimitation':'CMS June timestamp differs from July display; not used as historical publication authority.'}
  if re.search(r'3Q26|9M26|3q26|9m26',section):proof=None
 if ticker in ['GAS','GVR','HPG','SSB']:
  labels={'GAS':('Báo cáo tài chính hợp nhất đã soát xét cho 6 tháng đầu năm 2026','bao-cao-tai-chinh-hop-nhat-da-soat-xet-cho-6-thang-dau-nam-2026'),'GVR':('Báo cáo tài chính hợp nhất bán niên năm 2026 kèm Giải trình','20260828-GVR-Bao-cao-tai-chinh-hop-nhat-ban-nien-2026-kem-Giai-trinh.pdf'),'HPG':('Báo cáo tài chính hợp nhất soát xét 6 tháng 2026','20260828-hpg-bctc-hop-nhat-soat-xet-6-thang-2026-va-giai-trinh-1-2.pdf'),'SSB':('Báo cáo tài chính Hợp nhất soát xét bán niên 2026','bao-cao-tai-chinh-hop-nhat-soat-xet-ban-nien-2026')}
  label,fragment=labels[ticker];match=re.search(r'href="([^"]*'+re.escape(fragment)+r'[^"]*)"',text)
  if label in text and match:proof={'method':'ISSUER_CURRENT_FINANCIAL_REPORT_DISCLOSURE_LIST','exactSourceLabel':label,'observedDocumentHref':match.group(1),'inventoryScope':'Current issuer financial-report listing; current required cycle only. Source version conflicts independently reconciled.'}
 if ticker=='SAB':
  label='Báo cáo tài chính hợp nhất soát xét giữa niên độ cho giai đoạn 6 tháng kết thúc ngày 30/6/2026'
  match=re.search(r'href="([^"]*1H26FS-CONSO-VN.pdf)"',text)
  if label in text and match:proof={'method':'ISSUER_CURRENT_YEAR_REPORTING_CYCLE_LIST','exactSourceLabel':label,'observedDocumentHref':match.group(1)}
 if ticker=='VJC':
  label='Báo cáo tài chính Hợp nhất Quý 2/2026'
  match=re.search(r'href="([^"]*20260730 - VJC - BCTC Hop nhat Q2-26.pdf)"',text)
  if label in text and match:proof={'method':'ISSUER_CURRENT_REVERSE_CHRONOLOGICAL_REPORT_LIST','exactSourceLabel':label,'observedDocumentHref':match.group(1)}
 if ticker=='ACB':
  label='Báo cáo tài chính hợp nhất bán niên 2026 đã soát xét (Bản tra cứu)'
  match=re.search(r'href="([^"]*bao-cao-tai-chinh-hop-nhat-ban-nien-2026-da-soat-xet-ban-tra-cuu)"',text)
  if label in text and match:proof={'method':'ISSUER_EXPLICIT_CURRENT_YEAR_REPORT_DISCLOSURES','exactSourceLabel':label,'observedDocumentHref':match.group(1)}
 # Do not infer an absent Q3 filing from the PDF filename or system calendar.
 later=re.search(r'(?:báo cáo tài chính|BCTC)[^<>]{0,100}(?:quý III|quý 3|9 tháng)[^<>]{0,30}2026',text,re.I)
 out.append({'ticker':ticker,'requiredPeriod':'2026-06-30' if proof and not later else None,'publicInventoryReceipt':receipt,'bodyFile':str(file),'bodySha256':receipt['bodySha256'],'sourceEvidence':proof,'status':'VERIFIED_REQUIRED_CURRENT_PUBLIC_PERIOD' if proof and not later else 'UNKNOWN','limitations':['Current required reporting-period evidence only; not reconstructed historical publication or proof of every original revision.']})
# Additional exact issuer listings retained in the read-only origin capture set.
manifest=json.loads((B/'retained-public-index-manifest.json').read_text())
extra={
 'BSR':('BSR - Báo cáo tài chính Hợp nhất giữa niên độ đã được soát xét','3ec59439-d7ac-cf8c-b807-77e2bf138d01'),
 'SSI':('Báo cáo tài chính hợp nhất soát xét bán niên 2026',''),
 'VNM':('Báo cáo tài chính hợp nhất','20260730_VNM_BCTC_da_soat_xet_Q2_2026_Hop_nhat_76ef2e29c1.pdf'),
 'VRE':('','Bao-cao-tai-chinh-hop-nhat-ban-nien-soat-xet-2026.pdf')}
for ticker,(label,fragment) in extra.items():
 candidates=[r for r in manifest['records'] if 'issuer-'+ticker.lower()+'-' in r['sourceVersionId'] and r['publicResponseBound']]
 proof=None;record=None
 for receipt in sorted(candidates,key=lambda r:r['retrievedAt'],reverse=True):
  file=pathlib.Path(receipt['bodyFile']);body=file.read_bytes()
  if hashlib.sha256(body).hexdigest()!=receipt['bodySha256']:raise ValueError('RETAINED_INDEX_BYTES_CHANGED')
  text=re.sub(r'\s+',' ',html.unescape(body.decode('utf8',errors='replace')))
  if ticker=='BSR':
   q=next((q for q in json.loads((B/'qualifications.json').read_text()) if q['ticker']=='BSR' and q['status']=='TECHNICALLY_QUALIFIED_REVIEW_CANDIDATE' and q['auditStatus']=='REVIEWED' and q['period']['end']=='2026-06-30' and fragment in q['originalPublicUrl']),None)
   rows=re.findall(r'<tr[^>]*>([\s\S]*?)</tr>',text)
   if not q or not any(label in row and fragment in row and '27/8/2026' in row for row in rows):continue
  if label in text and (not fragment or fragment in text) and not re.search(r'(?:báo cáo tài chính|BCTC)[^<>]{0,80}(?:quý III|quý 3|9 tháng)[^<>]{0,30}2026',text,re.I):
   # VNM's literal Q2/year badges are read in the same current report card.
   if ticker=='VNM' and not re.search(r'href="[^"]*'+re.escape(fragment)+r'[^"]*"[\s\S]{0,2200}2026[\s\S]{0,100}Q2',text):continue
   proof={'method':'RETAINED_OFFICIAL_CURRENT_FINANCIAL_DISCLOSURE_LIST','exactSourceLabel':label,'observedDocumentHrefFragment':fragment,'originCaptureId':receipt['captureId'],'captureBodyHash':receipt['captureBodyHash']}
   record={'ticker':ticker,'requiredPeriod':'2026-06-30','publicInventoryReceipt':receipt,'bodyFile':str(file),'bodySha256':receipt['bodySha256'],'sourceEvidence':proof,'status':'VERIFIED_REQUIRED_CURRENT_PUBLIC_PERIOD','limitations':['Current required reporting cycle only; revisions and economic conflicts are reconciled independently.']};break
 if record:out.append(record)
# Exact public VIB component chain retained from the issuer's own script.
vibfile=B/'targeted-indexes/VIB-current-quarter-two.body'
vibreceipt=json.loads((B/'targeted-indexes/VIB-current-quarter-two.json').read_text())
vibtext=vibfile.read_text()
assert hashlib.sha256(vibfile.read_bytes()).hexdigest()==vibreceipt['bodySha256']
viblabel='BCTC hợp nhất soát xét bán niên 2026'
vibhref=re.search(r'href="([^"]+)"[^>]*><u>'+re.escape(viblabel)+r'</u>',vibtext)
if vibhref:
 out.append({'ticker':'VIB','requiredPeriod':'2026-06-30','publicInventoryReceipt':vibreceipt,'bodyFile':str(vibfile),'bodySha256':vibreceipt['bodySha256'],'sourceEvidence':{'method':'ISSUER_EXACT_PUBLIC_REPORT_COMPONENT_CHAIN','exactSourceLabel':viblabel,'observedDocumentHref':html.unescape(vibhref.group(1)),'sourceDisplayedDate':'06/08/2026','versionBindingRequirement':'Reviewed consolidated edition required; the original Q2 edition remains retained.'},'status':'VERIFIED_REQUIRED_CURRENT_PUBLIC_PERIOD','limitations':['Not proof of a historical timestamp timezone; initial-live knowledge boundary remains actual retrieval/review.']})
# Vingroup's public primary table is available through normalized web retrieval.
# Do not pretend it is retained raw HTML or a successful local HTTP response.
vicfile=B/'vic-publication-web-receipt.json'
vicreceipt=json.loads(vicfile.read_text())
assert vicreceipt['rawHttpResponseRetained'] is False
if '29/8/2026' in vicreceipt['inventoryResult'] and 'Báo Cáo Hợp Nhất Kiểm Toán/Soát Xét' in vicreceipt['inventoryResult']:
 out.append({'ticker':'VIC','requiredPeriod':'2026-06-30','publicInventoryReceipt':{'method':vicreceipt['method'],'retrievedAt':vicreceipt['retrievedAt'],'rawHttpResponseRetained':False},'bodyFile':str(vicfile),'bodySha256':hashlib.sha256(vicfile.read_bytes()).hexdigest(),'sourceEvidence':{'method':'NORMALIZED_PRIMARY_ISSUER_REPORT_INVENTORY','exactSourceLabel':'Báo Cáo Hợp Nhất Kiểm Toán/Soát Xét','sourceDisplayedDate':'29/8/2026','versionBindingRequirement':'Exact reviewed interim body and retained viewer URL; Q3 and Q4 slots are empty in this observed current-year table.'},'status':'VERIFIED_REQUIRED_CURRENT_PUBLIC_PERIOD','limitations':['Normalized tool receipt, not original issuer HTML; no historical knowledge reconstruction.']})
vhmfile=B/'vhm-publication-web-receipt.json'
vhmreceipt=json.loads(vhmfile.read_text())
assert vhmreceipt['rawHttpResponseRetained'] is False
inventory=json.dumps(vhmreceipt['inventoryResult'],ensure_ascii=False)
if 'Báo cáo tài chính Hợp nhất soát xét giữa niên độ 2026' in inventory and '29/08/2026' in inventory:
 out.append({'ticker':'VHM','requiredPeriod':'2026-06-30','publicInventoryReceipt':{'method':vhmreceipt['method'],'retrievedAt':vhmreceipt['retrievedAt'],'rawHttpResponseRetained':False},'bodyFile':str(vhmfile),'bodySha256':hashlib.sha256(vhmfile.read_bytes()).hexdigest(),'sourceEvidence':{'method':'NORMALIZED_PRIMARY_ISSUER_REPORT_INVENTORY','exactSourceLabel':'Báo cáo tài chính Hợp nhất soát xét giữa niên độ 2026','sourceDisplayedDate':'29/08/2026','versionBindingRequirement':'Independently qualified consolidated reviewed source body; source table Q3/Q4 slots are empty.'},'status':'VERIFIED_REQUIRED_CURRENT_PUBLIC_PERIOD','limitations':['Normalized web receipt only; no assertion of retained raw HTTP or historical timestamp authority.']})
# Exact normalized issuer inventories; distinguish these receipts from raw HTTP.
additional={
 'MCH':('Báo cáo tài chính bán niên 2026 hợp nhất đã được soát xét','07/08/2026'),
 'MSN':('Báo cáo tài chính bán niên 2026 hợp nhất được soát xét','07/08/2026'),
 'SHB':('Báo cáo Tài chính Kiểm toán 6 tháng đầu năm 2026','28-08-2026'),
 'VPL':('Báo cáo tài chính hợp nhất giữa niên độ soát xét Q2.2026','28/08/2026'),
}
for ticker,(label,displayDate) in additional.items():
 file=B/'targeted-indexes'/f'{ticker}-remaining-cycle-web-receipt.json'
 receipt=json.loads(file.read_text());text=receipt['result']
 assert receipt['rawHttpResponseRetained'] is False and receipt['ticker']==ticker
 if not isinstance(text,str) or label not in text or displayDate not in text:continue
 if re.search(r'(?:báo cáo tài chính|BCTC)[^<>\n]{0,100}(?:quý III|quý 3|9 tháng|Q3)[^<>\n]{0,30}2026',text,re.I):continue
 out.append({'ticker':ticker,'requiredPeriod':'2026-06-30','publicInventoryReceipt':{'method':receipt['method'],'retrievedAt':receipt['observedAt'],'url':receipt['url'],'rawHttpResponseRetained':False},'bodyFile':str(file),'bodySha256':hashlib.sha256(file.read_bytes()).hexdigest(),'sourceEvidence':{'method':'NORMALIZED_PRIMARY_ISSUER_CURRENT_REPORT_INVENTORY','exactSourceLabel':label,'sourceDisplayedDate':displayDate,'versionBindingRequirement':'Reviewed consolidated interim report required; independent body/scope/period qualification and conflict resolution remain separate.'},'status':'VERIFIED_REQUIRED_CURRENT_PUBLIC_PERIOD','limitations':['Normalized web receipt only; no assertion of retained original HTML or exact historical timestamp.']})
# Exact public client GET response; total equals retained rows, so this is a
# complete observed 2026 VAS listing rather than an empty dynamic HTML shell.
vpbFile=B/'targeted-indexes/VPB-public-financial-2026.body'
if vpbFile.exists():
 receipt=json.loads(vpbFile.with_suffix('.json').read_text());body=vpbFile.read_bytes()
 assert receipt['httpStatus']=='200' and receipt['curlExit']==0 and hashlib.sha256(body).hexdigest()==receipt['bodySha256']
 listing=json.loads(body);rows=listing['data']
 assert listing['total']==len(rows) and listing['pageIndex']==1
 latest=max(rows,key=lambda r:r['publishDate'])
 label='Báo cáo tài chính soát xét giữa niên độ 2026'
 if latest['title']==label:
  href=next(i['url'] for i in latest['itemList'] if i['title']=='1. BCTC hợp nhất')
  out.append({'ticker':'VPB','requiredPeriod':'2026-06-30','publicInventoryReceipt':receipt,'bodyFile':str(vpbFile),'bodySha256':receipt['bodySha256'],'sourceEvidence':{'method':'ISSUER_PUBLIC_CLIENT_COMPLETE_CURRENT_YEAR_VAS_LIST','exactSourceLabel':label,'observedDocumentHref':'https://www.vpbank.com.vn'+href,'sourceDisplayedDate':latest['publishDate'],'versionBindingRequirement':'Exact consolidated reviewed edition from this own-source itemList; prior Q2 and Q1 editions retained separately.'},'status':'VERIFIED_REQUIRED_CURRENT_PUBLIC_PERIOD','limitations':['Observed complete public 2026 VAS listing only; no claim of historical system knowledge.']})
stbFile=B/'targeted-indexes/STB-public-financial-list.body'
if stbFile.exists():
 receipt=json.loads(stbFile.with_suffix('.json').read_text());body=stbFile.read_bytes()
 assert receipt['httpStatus']=='200' and receipt['curlExit']==0 and hashlib.sha256(body).hexdigest()==receipt['bodySha256']
 listing=json.loads(body);label='BCTC Hợp nhất bán niên đã soát xét 2026'
 assert listing['statusCode']==200 and listing['date']=='2026'
 latest=listing['data'][0]
 if latest['title']=='Bán niên năm 2026':
  doc=next(d for d in latest['documents'] if d['reportTitle']==label)
  out.append({'ticker':'STB','requiredPeriod':'2026-06-30','publicInventoryReceipt':receipt,'bodyFile':str(stbFile),'bodySha256':receipt['bodySha256'],'sourceEvidence':{'method':'ISSUER_EXPLICIT_CURRENT_FINANCIAL_TAB_JSON_LIST','exactSourceLabel':label,'observedDocumentHref':'https://www.sacombank.com.vn'+doc['urlFinancialReportStatements'],'versionBindingRequirement':'Exact consolidated reviewed edition from first current-year interim entry; Q2/Q1 originals retained.'},'status':'VERIFIED_REQUIRED_CURRENT_PUBLIC_PERIOD','limitations':['Observed own public current-year financial tab; does not reconstruct historical public knowledge.']})
hdbFile=B/'targeted-indexes/HDB-public-financial-category-decoded.json'
if hdbFile.exists():
 decoder=json.loads(hdbFile.with_suffix('.receipt.json').read_text())
 for file,key in [(hdbFile,'decodedBodySha256'),(pathlib.Path(decoder['sourceBodyFile']),'sourceBodySha256'),(pathlib.Path(decoder['decoderSourceFile']),'decoderSourceSha256')]:
  assert hashlib.sha256(file.read_bytes()).hexdigest()==decoder[key]
 source=pathlib.Path(decoder['sourceBodyFile']);receipt=json.loads(source.with_suffix('.json').read_text())
 assert receipt['httpStatus']=='200' and receipt['curlExit']==0 and receipt['bodySha256']==decoder['sourceBodySha256']
 listing=json.loads(hdbFile.read_text());current=next(m for m in listing['menuList'] if m['name']=='2026')['content']
 label='Báo cáo tài chính hợp nhất soát xét bán niên 2026'
 match=re.search(r'<a\b[^>]*href="([^"]+)"[^>]*>[\s\S]*?'+re.escape(label)+r'</span></a>',current)
 if match and not re.search(r'(?:quý 3|quý III|9 tháng)',current,re.I):
  out.append({'ticker':'HDB','requiredPeriod':'2026-06-30','publicInventoryReceipt':receipt,'bodyFile':str(hdbFile),'bodySha256':decoder['decodedBodySha256'],'sourceEvidence':{'method':'ISSUER_CURRENT_YEAR_FINANCIAL_CATEGORY_PUBLIC_FRONTEND_DECODED_RESPONSE','exactSourceLabel':label,'observedDocumentHref':html.unescape(match[1]),'sourceDisplayedDate':'24/08/2026 17:00:00','decoderReceiptFile':str(hdbFile.with_suffix('.receipt.json')),'decoderReceiptSha256':hashlib.sha256(hdbFile.with_suffix('.receipt.json').read_bytes()).hexdigest(),'versionBindingRequirement':'Exact consolidated reviewed interim edition on own current-year menu; public decoder source and original transport bytes retained.'},'status':'VERIFIED_REQUIRED_CURRENT_PUBLIC_PERIOD','limitations':['Decoded public transport response, not original plain JSON HTTP bytes; no authentication used or historical system-knowledge inference.']})
mwgFile=B/'targeted-indexes/MWG-public-financial-category-2026.body'
if mwgFile.exists():
 receipt=json.loads(mwgFile.with_suffix('.json').read_text());body=mwgFile.read_bytes()
 assert receipt['httpStatus']=='200' and receipt['curlExit']==0 and hashlib.sha256(body).hexdigest()==receipt['bodySha256']
 listing=json.loads(body);assert listing['code']==0
 rows=[r for r in listing['data'] if r['isActived'] and not r['isDeleted'] and 'Tài Chính Hợp Nhất' in r['title']]
 latest=max(rows,key=lambda r:r['publishDate']);label='Báo Cáo Tài Chính Hợp Nhất Soát Xét Bán Niên Năm 2026'
 if latest['title']==label:
  out.append({'ticker':'MWG','requiredPeriod':'2026-06-30','publicInventoryReceipt':receipt,'bodyFile':str(mwgFile),'bodySha256':receipt['bodySha256'],'sourceEvidence':{'method':'ISSUER_PUBLIC_CLIENT_CURRENT_YEAR_FINANCIAL_CATEGORY_LIST','exactSourceLabel':label,'observedDocumentHref':latest['fileLink'],'sourceDisplayedDate':latest['publishDate'],'versionBindingRequirement':'Exact consolidated reviewed edition from the own financial category; unrelated investor webinar category explicitly excluded.'},'status':'VERIFIED_REQUIRED_CURRENT_PUBLIC_PERIOD','limitations':['Observed current-year issuer reporting list; CMS activation/update clocks are not substituted for historical publication knowledge.']})
vcbFile=B/'targeted-indexes/VCB-public-periodic-reports.body'
if vcbFile.exists():
 receipt=json.loads(vcbFile.with_suffix('.json').read_text());body=vcbFile.read_bytes()
 assert receipt['httpStatus']=='200' and receipt['curlExit']==0 and hashlib.sha256(body).hexdigest()==receipt['bodySha256']
 listing=json.loads(body)
 financial=[r for r in listing['Results'] if '/Bao cao dinh ky/BC tai chinh/' in r['Path']]
 reviewed=next((r for r in financial if r['Path'].endswith('/2026 BCTC Hop nhat ban nien co soat xet')),None)
 if reviewed and not any('2026' in r['Path'] and re.search(r'Q3|Quy III|9 thang',r['Path'],re.I) for r in financial):
  href=html.unescape(re.search(r'data-download-url="([^"]+)"',reviewed['Html'])[1])
  out.append({'ticker':'VCB','requiredPeriod':'2026-06-30','publicInventoryReceipt':receipt,'bodyFile':str(vcbFile),'bodySha256':receipt['bodySha256'],'sourceEvidence':{'method':'ISSUER_PUBLIC_PERIODIC_REPORTS_EXPLICIT_FINANCIAL_PATH_LIST','exactSourceLabel':'BCTC 2026 bán niên Hợp nhất','observedDocumentHref':'https://www.vietcombank.com.vn'+href,'sourceContentPath':reviewed['Path'],'versionBindingRequirement':'Exact current consolidated reviewed body; official interim URL recovered separately. Source list ordered by its explicit Updated Date Sort,Descending contract, without treating update time as publication.'},'status':'VERIFIED_REQUIRED_CURRENT_PUBLIC_PERIOD','limitations':['Observed primary periodic listing; older entries outside this page are not asserted absent. Retained entries contain reviewed H1, Q2 and Q1 2026 financial filings.']})
mbbFile=B/'targeted-indexes/MBB-public-financial-session-list.body'
if mbbFile.exists():
 receipt=json.loads(mbbFile.with_suffix('.json').read_text());body=mbbFile.read_bytes()
 assert receipt['httpStatus']=='200' and receipt['curlExit']==0 and hashlib.sha256(body).hexdigest()==receipt['bodySha256']
 listing=json.loads(body);financial=[r for r in listing['lst'] if r['attachment_category_id']==7]
 label='Báo cáo tài chính hợp nhất soát xét bán niên năm 2026'
 latest=max(financial,key=lambda r:r['last_Save_Date'])
 if latest['title']==label and latest['year']==2026:
  out.append({'ticker':'MBB','requiredPeriod':'2026-06-30','publicInventoryReceipt':receipt,'bodyFile':str(mbbFile),'bodySha256':receipt['bodySha256'],'sourceEvidence':{'method':'ISSUER_PUBLIC_FINANCIAL_CONTROLLER_ANONYMOUS_SESSION_LIST','exactSourceLabel':label,'observedDocumentHref':'https://www.mbbank.com.vn'+latest['file_path'],'sourceDisplayedDate':latest['last_Save_Date'],'dateUse':'SOURCE_LIST_LAST_SAVE_CLOCK_ONLY_NOT_HISTORICAL_PUBLICATION','versionBindingRequirement':'Exact reviewed consolidated attachment id1514; public category id7 verified independently. Original Q2/Q1 remain retained.'},'status':'VERIFIED_REQUIRED_CURRENT_PUBLIC_PERIOD','limitations':['Own anonymous session/form-token request as shipped by issuer controller; no login or challenge bypass. Last-save date is not automatically public availability.']})
tcxFile=B/'tcx-current-financial-table-web-receipt.json'
if tcxFile.exists():
 receipt=json.loads(tcxFile.read_text());text=receipt['evidence']
 url='https://www.tcbs.com.vn/wp-content/uploads/2026/08/Bao-cao-tai-chinh-ban-nien-2026-da-duoc-soat-xet.pdf'
 current=text.split('L41: 2026',1)[1].split('L75:',1)[0]
 assert 'Báo cáo tài chính kiểm toán' in current and '10/08/2026' in current
 assert 'L69: _{10/08/2026}  |  |' in current and url in receipt['latestReviewedLinks']
 out.append({'ticker':'TCX','requiredPeriod':'2026-06-30','publicInventoryReceipt':{'url':receipt['sourceUrl'],'retrievedAt':receipt['retrievedAt'],'method':receipt['method'],'rawHttpEvidence':False},'bodyFile':str(tcxFile),'bodySha256':hashlib.sha256(tcxFile.read_bytes()).hexdigest(),'sourceEvidence':{'method':'NORMALIZED_PRIMARY_ISSUER_YEAR_QUARTER_FINANCIAL_TABLE','exactSourceLabel':'Báo cáo tài chính kiểm toán','observedDocumentHref':url,'sourceDisplayedDate':'10/08/2026','versionBindingRequirement':'Exact issuer Q2 reviewed table attachment; original July and later rehosted copies are not automatically the same body.'},'status':'VERIFIED_REQUIRED_CURRENT_PUBLIC_PERIOD','limitations':receipt['limitations']})
(B/'current-cycle-source-evidence.json').write_text(json.dumps({'recordedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'records':out},indent=2,ensure_ascii=False)+'\n')
print([(r['ticker'],r['status']) for r in out])
