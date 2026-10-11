"""Require an exact current inventory attachment-to-body link, not only audit status."""
import base64, datetime, hashlib, html, json, pathlib, re, subprocess, urllib.parse

B = pathlib.Path('data/initialization-08b-remediation-work')
read = lambda name: json.loads((B / name).read_text())
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
qualifications = read('qualifications.json') + read('tcb-disclosure-qualifications.json')
if (B / 'vcb-capital-disclosure-qualifications.json').exists(): qualifications += read('vcb-capital-disclosure-qualifications.json')
if (B / 'lpb-capital-disclosure-qualifications.json').exists(): qualifications += read('lpb-capital-disclosure-qualifications.json')
if (B / 'lpb-capital-vn-disclosure-qualifications.json').exists(): qualifications += read('lpb-capital-vn-disclosure-qualifications.json')
if (B/'acb-investor-disclosure-qualifications.json').exists(): qualifications += read('acb-investor-disclosure-qualifications.json')
if (B/'acb-capital-disclosure-qualifications.json').exists(): qualifications += read('acb-capital-disclosure-qualifications.json')
if (B/'hdb-investor-disclosure-qualifications.json').exists(): qualifications += read('hdb-investor-disclosure-qualifications.json')
additional = []
for name in ['tcx-current-financial-table-recovery.json', 'vib-current-reviewed-version-recovery.json', 'current-attachment-exact-version-recovery.json', 'exact-exchange-and-correction-recovery.json', 'exact-mch-exchange-recovery.json', 'vhm-exact-reviewed-corrected-exchange-recovery.json', 'lpb-current-capital-exact-recovery.json', 'lpb-current-capital-vn-exact-recovery.json']:
    if (B / name).exists(): additional += read(name)['documents']
records = []
for r in read('current-cycle-source-evidence.json')['records']:
    assert sha(pathlib.Path(r['bodyFile'])) == r['bodySha256']
    e = r['sourceEvidence']
    href = e.get('observedDocumentHref')
    targets = []
    evidence = [{'file': r['bodyFile'], 'sha256': r['bodySha256']}]
    for name in ['tcx-current-financial-table-recovery.json', 'vib-current-reviewed-version-recovery.json', 'current-attachment-exact-version-recovery.json', 'exact-exchange-and-correction-recovery.json', 'exact-mch-exchange-recovery.json', 'vhm-exact-reviewed-corrected-exchange-recovery.json', 'lpb-current-capital-exact-recovery.json', 'lpb-current-capital-vn-exact-recovery.json']:
        f = B / name
        if f.exists() and any(d['ticker']==r['ticker'] for d in read(name)['documents']):
            evidence.append({'file':str(f), 'sha256':sha(f)})
    if href:
        # Browser URI resolution/space escaping only; no query removal or URL equivalence.
        targets.append(urllib.parse.urljoin(r['publicInventoryReceipt']['url'], href).replace(' ', '%20'))
    if r['ticker'] in ['CTG','BSR','SSI','VNM','VRE']:
        text = html.unescape(pathlib.Path(r['bodyFile']).read_text())
        links = re.findall(r'(?:href|src)=["\x27]([^"\x27]+)', text)
        targets.extend(urllib.parse.urljoin(r['publicInventoryReceipt']['url'], link).replace(' ', '%20') for link in links)
    if r['ticker'] == 'VRE':
        manifest_file = B / 'retained-public-index-manifest.json'
        manifest = json.loads(manifest_file.read_text())
        receipt = next(row for row in manifest['records'] if row['bodySha256'] == '6a531231158e8c3b85f9d04038a71eab2241c2d27aa779108e3f8826ab7b2017')
        f = pathlib.Path(receipt['bodyFile'])
        assert receipt['publicResponseBound'] and receipt['httpStatus'] == 200 and sha(f) == receipt['bodySha256']
        text = html.unescape(f.read_text())
        attachment = 'https://ir.vincom.com.vn/wp-content/uploads/2026/08/Reviewed-Interim-Consolidated-Financial-Statements.pdf'
        rows = re.findall(r'<tr[^>]*>([\s\S]*?)</tr>', text)
        assert any('Audited/Reviewed Consolidated Financial Statements' in row and attachment in row and '28/08/2026' in row for row in rows)
        assert not re.search(r'(?:3Q2026|9M2026|3Q26|9M26)', text)
        targets.append(attachment)
        evidence.extend([{'file':str(f), 'sha256':sha(f)}, {'file':str(manifest_file), 'sha256':sha(manifest_file)}])
    if r['ticker'] == 'ACB':
        text = pathlib.Path(r['bodyFile']).read_text()
        data = json.loads(re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>',text)[1])
        def posts(v):
            if isinstance(v, dict):
                if v.get('slug') == 'bao-cao-tai-chinh-hop-nhat-ban-nien-2026-da-soat-xet-ban-tra-cuu': yield v
                for x in v.values(): yield from posts(x)
            elif isinstance(v, list):
                for x in v: yield from posts(x)
        post = next(posts(data))
        assert post['title'] == 'Báo cáo tài chính hợp nhất bán niên 2026 đã soát xét (Bản tra cứu)' and post['is_active']==1
        targets.append(post['featured_image']['path'].replace(' ','%20'))
        if (B/'acb-investor-disclosure-qualifications.json').exists():
            receipt_file=B/'targeted-indexes/ACB-required-current-investor-category.json'
            receipt=read('targeted-indexes/ACB-required-current-investor-category.json')
            body=B/'targeted-indexes/ACB-required-current-investor-category.body'
            assert receipt['httpStatus']=='200' and receipt['curlExit']==0 and sha(body)==receipt['bodySha256']
            params=urllib.parse.parse_qs(urllib.parse.urlsplit(receipt['url']).query)
            assert params=={'limit':['9'],'search[categories.category_id:in]':['1657'],'search[is_active:in]':['1'],'search_type':['and'],'search[type:not]':['notification'],'page':['1']}
            listing=json.loads(body.read_text())
            assert listing['meta']['total']==4 and listing['meta']['last_page']==1 and len(listing['data'])==4
            recap=next(row for row in listing['data'] if row['title']=='ACB AM RECAP - 1H26 (VN)')
            assert recap['is_active']==1 and any(cat['id']==1657 for cat in recap['categories'])
            targets.append(urllib.parse.quote(recap['featured_image']['path'],safe='/:'))
            evidence.extend([{'file':str(body),'sha256':sha(body)},{'file':str(receipt_file),'sha256':sha(receipt_file)}])

    if r['ticker']=='ACB' and (B/'acb-capital-disclosure-qualifications.json').exists():
        receipt_file=B/'targeted-indexes/ACB-required-capital-disclosure-exact-search.json'
        receipt=json.loads(receipt_file.read_text())
        body=B/'targeted-indexes/ACB-required-capital-disclosure-exact-search.body'
        assert receipt['httpStatus']==200 and receipt['curlExit']==0 and sha(body)==receipt['bodySha256']
        assert urllib.parse.parse_qs(urllib.parse.urlsplit(receipt['url']).query)=={'search[categories.category_id:in]':['656'],'search[title:like]':['Báo cáo công bố thông tin tỷ lệ an toàn vốn bán niên năm 2026'],'limit':['5'],'page':['1']}
        listing=json.loads(body.read_text())
        report=next(row for row in listing['data'] if row['id']==12331)
        assert report['is_active']==1 and report['slug']=='bao-cao-cong-bo-thong-tin-ty-le-an-toan-von-ban-nien-nam-2026-11092026'
        assert any(cat['id']==656 for cat in report['categories'])
        targets.append(urllib.parse.quote(report['featured_image']['path'],safe='/:'))
        evidence.extend([{'file':str(body),'sha256':sha(body)},{'file':str(receipt_file),'sha256':sha(receipt_file)}])

    if r['ticker'] == 'LPB':
        receipt = read('targeted-indexes/LPB-current-reports-receipt.json')
        body = pathlib.Path(receipt['bodyFile'])
        assert receipt['httpStatus'] == 200 and receipt['curlExit'] == 0 and sha(body) == receipt['bodySha256']
        for proof in receipt['clientEvidence']:
            assert sha(pathlib.Path(proof['file'])) == proof['sha256']
            evidence.append(proof)
        listing = json.loads(body.read_text())
        assert listing['status'] == '200'
        report = next(row for row in listing['data']['content'] if row['title'] == e['exactSourceLabel'])
        assert report['isActive'] and report['status'] == 'ACTIVE'
        links = re.findall(r'href="([^"]+)"', report['content'])
        assert len(links) == 1 and links[0].startswith('https://lpbank.com.vn/api/content-file/public/file/view/')
        targets.extend(links)
        evidence.extend([{'file':str(body), 'sha256':sha(body)},
                         {'file':str(B / 'targeted-indexes/LPB-current-reports-receipt.json'), 'sha256':sha(B / 'targeted-indexes/LPB-current-reports-receipt.json')}])
        if (B / 'lpb-capital-disclosure-qualifications.json').exists():
            capital_receipt_file=B/'targeted-indexes/LPB-current-capital-reports-receipt.json'
            capital_receipt=json.loads(capital_receipt_file.read_text());capital_body=pathlib.Path(capital_receipt['bodyFile'])
            assert capital_receipt['httpStatus']==200 and capital_receipt['curlExit']==0 and sha(capital_body)==capital_receipt['bodySha256']
            assert sha(pathlib.Path(capital_receipt['requestFile']))==capital_receipt['requestSha256'] and sha(pathlib.Path(capital_receipt['clientFile']))==capital_receipt['clientSha256']
            capital_listing=json.loads(capital_body.read_text());assert capital_listing['status']=='200'
            capital=capital_listing['data']['content'];assert len(capital)==1 and capital[0]['isActive'] and capital[0]['status']=='ACTIVE'
            assert capital[0]['title']=='Disclosure of Capital Adequacy Ratio Information in accordance with Circular No. 41/2016/TT-NHNN for the period ended June 30, 2026'
            capital_links=re.findall(r'href="([^"]+)"',capital[0]['content']);assert len(capital_links)==1 and capital_links[0].startswith('https://lpbank.com.vn/api/content-file/public/file/view/')
            targets.extend(capital_links)
            evidence.extend([{'file':str(capital_body),'sha256':sha(capital_body)},{'file':str(capital_receipt_file),'sha256':sha(capital_receipt_file)}])
            if (B/'lpb-capital-vn-disclosure-qualifications.json').exists():
                receipt_file=B/'targeted-indexes/LPB-current-capital-two-reports-receipt.json';pair_receipt=json.loads(receipt_file.read_text());pair_body=pathlib.Path(pair_receipt['bodyFile'])
                assert pair_receipt['httpStatus']==200 and pair_receipt['curlExit']==0 and sha(pair_body)==pair_receipt['bodySha256'] and sha(pathlib.Path(pair_receipt['requestFile']))==pair_receipt['requestSha256']
                listing=json.loads(pair_body.read_text());assert listing['status']=='200' and len(listing['data']['content'])==2
                vn=next(row for row in listing['data']['content'] if row['title']=='Công bố thông tin tỷ lệ an toàn vốn theo thông tư 41/2016/TT-NHNN kỳ 30/06/2026')
                assert vn['isActive'] and vn['status']=='ACTIVE'
                links=re.findall(r'href="([^"]+)"',vn['content']);assert len(links)==1 and links[0].startswith('https://lpbank.com.vn/api/content-file/public/file/view/')
                targets.extend(links);evidence.extend([{'file':str(pair_body),'sha256':sha(pair_body)},{'file':str(receipt_file),'sha256':sha(receipt_file)}])
    if r['ticker'] == 'HDB' and (B/'hdb-investor-disclosure-qualifications.json').exists():
        prefix='targeted-indexes/HDB-required-current-results-exact-section'
        body=B/(prefix+'.body');receipt=read(prefix+'.json')
        assert receipt['httpStatus']=='200' and receipt['curlExit']==0 and sha(body)==receipt['bodySha256']
        assert receipt['url']=='https://hdbank.com.vn/api/investors/thong-tin-nha-dau-tu/tin-tuc-nha-dau-tu/bao-cao-ket-qua-hoat-dong-kinh-doanh-quy'
        client=B/'targeted-indexes/HDB-public-report-dependency-0.js';text=client.read_text()
        clientReceiptFile=client.with_suffix('.json');clientReceipt=json.loads(clientReceiptFile.read_text())
        assert clientReceipt['httpStatus']=='200' and clientReceipt['curlExit']==0 and clientReceipt['bodySha256']==sha(client) and clientReceipt['url']=='https://hdbank.com.vn/_next/static/chunks/pages/_app-8f1dd5f2a8d8a8ad.js'
        decoder=text[text.index('74904:function'):text.index('43210:function',text.index('74904:function'))]
        assert 'AES.decrypt(t,e' in decoder and 'mode.ECB' in decoder and 'pad.Pkcs7' in decoder
        key=re.search(r'Utf8.parse\("([^\"]+)"\)',decoder)[1].encode()
        replay=subprocess.run(['openssl','enc','-d','-aes-192-ecb','-K',key.hex()],input=base64.b64decode(body.read_bytes()),capture_output=True)
        assert replay.returncode==0
        decodedFile=B/(prefix+'-decoded.json');proofFile=B/(prefix+'-decoded.receipt.json');proof=json.loads(proofFile.read_text())
        listing=json.loads(decodedFile.read_text())
        assert json.loads(replay.stdout)==listing and proof['sourceBodySha256']==sha(body) and proof['decoderSourceSha256']==sha(client) and proof['decodedBodySha256']==sha(decodedFile)
        assert proof['method']=='EXACT_PUBLIC_FRONTEND_RESPONSE_DECODER' and proof['decoderModule']==74904 and proof['authenticationUsed'] is False and proof['accessControlBypassed'] is False
        assert len({x['name'] for x in listing['menuList']})==len(listing['menuList'])
        entry=next(x for x in listing['menuList'] if x['name']=='2026')
        links=[(html.unescape(url),html.unescape(re.sub(r'<[^>]+>','',title)).strip()) for url,title in re.findall(r'<a\b[^>]*href="([^"]+)"[^>]*>(.*?)</a>',entry['content'],re.S)]
        labelled=[url for url,title in links if title=='2Q2026 Results Presentation']
        assert len(labelled)==1 and labelled[0]=='https://cdn.hdbank.com.vn/hdbank-file/investor/editor/4uoSb03noUcBQNApg3oh20260828170851/HDBankEarningsPresentation2Q26vFENG_1787911876798.pdf'
        targets.extend(labelled)
        evidence.extend({'file':str(f),'sha256':sha(f)} for f in [body,B/(prefix+'.json'),client,clientReceiptFile,decodedFile,proofFile])
    if r['ticker'] in ['MCH', 'MSN']:
        # The exact signed exchange filing is discovered through a retained
        # secondary link index; actual HOSE response bytes establish identity.
        # The secondary page does not establish historical publication authority.
        prefix = r['ticker'] + '-current-exchange-reference'
        receipt = read('targeted-indexes/' + prefix + '.json')
        f = B / ('targeted-indexes/' + prefix + '.body')
        assert receipt['httpStatus'] == 200 and sha(f) == receipt['bodySha256']
        text = html.unescape(f.read_text())
        label = ('BCTC ban nien 2026 hop nhat duoc soat xet - signed' if r['ticker']=='MCH'
                 else 'Bao cao tai chinh hop nhat soat xet ban nien 2026 - signed')
        assert label in text and '7-8-2026' in text and e['sourceDisplayedDate'] == '07/08/2026'
        links = re.findall(r'href="([^"]+)"', text)
        filings = [link for link in links if link.startswith('https://staticfile.hsx.vn/Uploads/UploadDocuments/')]
        assert len(filings) == 1 and '20260807' in filings[0] and r['ticker'] in filings[0]
        targets.extend(filings)
        evidence.extend([{'file':str(f), 'sha256':sha(f)}, {'file':str(B / ('targeted-indexes/' + prefix + '.json')), 'sha256':sha(B / ('targeted-indexes/' + prefix + '.json'))}])
    if r['ticker'] == 'VHM':
        # A later corrected complete exchange report supersedes the August
        # attachment for current-version selection; retain both source roots.
        prefix = 'VHM-current-exchange-corrected'
        receipt = read('targeted-indexes/' + prefix + '.json')
        f = B / ('targeted-indexes/' + prefix + '.body')
        assert receipt['httpStatus'] == 200 and sha(f) == receipt['bodySha256']
        text = html.unescape(f.read_text())
        assert 'Dinh Chinh Bao cao tai chinh hop nhat soat xet Q2 nam 2026 va giai trinh' in text
        links = re.findall(r'href="([^"]+)"', text)
        filings = [link for link in links if link.startswith('https://staticfile.hsx.vn/Uploads/UploadDocuments/')]
        assert len(filings) == 1 and '20260904' in filings[0] and 'VHM' in filings[0]
        targets = filings
        evidence.extend([{'file':str(f), 'sha256':sha(f)}, {'file':str(B / ('targeted-indexes/' + prefix + '.json')), 'sha256':sha(B / ('targeted-indexes/' + prefix + '.json'))}])
    if r['ticker'] == 'FPT':
        f = B / 'targeted-indexes/FPT-current-public-disclosures.body'
        receipt = read('targeted-indexes/FPT-current-public-disclosures.json')
        assert receipt['httpStatus']==200 and sha(f)==receipt['bodySha256']
        text=html.unescape(f.read_text())
        path='/api/media/20260821_FPT_BCTC_hop_nhat_ban_nien_da_soat_xet_nam_2026_3b1ebb3536.pdf'
        assert path in text
        targets.append(urllib.parse.urljoin(receipt['url'],path))
        evidence.append({'file':str(f),'sha256':sha(f)})
    if r['ticker'] == 'CTG':
        f = B / 'ctg-current-financial-table-web-receipt.json'
        table=read(f.name)
        assert 'Báo cáo tài chính hợp nhất bán niên 2026 đã soát xét' in table['evidence']
        url='https://investor.vietinbank.vn/documents/20126/1706111/BCTC%20hop%20nhat%206%20thang%202026%20da%20soat%20xet_VN.pdf.pdf/2d71d946-e77f-e059-2c94-9d9aea1c4387'
        assert url in table['currentAttachment']
        targets.append(url)
        evidence.append({'file':str(f),'sha256':sha(f)})
    if r['ticker'] == 'VIC':
        viewer = read('vic-publication-web-receipt.json')['viewerResult']
        exact = re.search(r'https://vingroup.net/viewer\.html\?file=([^\s)]+)', viewer)[1]
        path = urllib.parse.parse_qs('file='+exact)['file'][0]
        assert path.startswith('https://ircdn.vingroup.net/storage/Uploads/0_Baocaotaichinh/')
        targets.append(path.replace(' ','%20'))
    if r['ticker'] in ['SHB','VPL']:
        name='shb-current-exact-pdf-web-receipt.json' if r['ticker']=='SHB' else 'shb-vpl-current-exact-attachments-web-receipt.json'
        f=B/name;result=read(name)
        for q in qualifications:
            url=q.get('originalPublicUrl')
            if q['ticker']==r['ticker'] and url and url in result['evidence']: targets.append(url)
        evidence.append({'file':str(f),'sha256':sha(f)})
    if r['ticker'] in ['SSB','GAS']:
        name=r['ticker']+'-current-reviewed'
        f = B / 'targeted-indexes' / (name+'.body')
        receipt = read('targeted-indexes/'+name+'.json')
        assert sha(f) == receipt['bodySha256']
        assert urllib.parse.urljoin(r['publicInventoryReceipt']['url'], href) == receipt['url']
        text = html.unescape(f.read_text())
        targets.extend(urllib.parse.urljoin(receipt['url'], link).replace(' ', '%20') for link in re.findall(r'href=["\x27]([^"\x27]+)', text))
        evidence.append({'file':str(f), 'sha256':sha(f)})
    if r['ticker'] == 'VCB':
        f = B / 'vcb-public-download-routing-evidence.json'
        routing = read(f.name)
        client = B / 'targeted-indexes/VCB-public-investor-client.body'
        assert 'n.substr(0,n.indexOf("?"))' in client.read_text()
        assert href and href.endswith('?ts=00010101000000')
        targets.append(targets[0].split('?', 1)[0])
        listing = read('targeted-indexes/VCB-public-periodic-reports.body')
        car = next(row for row in listing['Results'] if row['Path'].endswith('/Bao cao CBTT Ty le an toan von theo TT14 30062026'))
        carHref = html.unescape(re.search(r'data-download-url="([^"]+)"', car['Html'])[1])
        assert carHref.endswith('?ts=00010101000000')
        targets.append(urllib.parse.urljoin('https://www.vietcombank.com.vn', carHref.split('?',1)[0]))
        evidence.extend([{'file': str(f), 'sha256': sha(f)}, {'file': str(client), 'sha256': sha(client)}])
    if r['ticker'] == 'VPB':
        listing = read('targeted-indexes/VPB-public-financial-2026.body')
        # The issuer supplies its searchable copy in the same current reviewed item.
        searchable = 'https://www.vpbank.com.vn/-/media/vpbank-latest/5nha-dau-tu/bao-cao-tai-chinh/vas/2026/3.-BCTC-hop-nhat--ban-tra-cuu-.pdf'
        # Exact URL must occur in retained actual source; no filename-only alias.
        current = next(row for row in listing['data'] if row['title'] == e['exactSourceLabel'])
        urls = {urllib.parse.urljoin('https://www.vpbank.com.vn', item['url']) for item in current['itemList']}
        assert targets[0] in urls
        if searchable in urls: targets.append(searchable)
        f = B / 'targeted-indexes/VPB-public-financial-2026.body'
        evidence.append({'file':str(f), 'sha256':sha(f)})
    candidates = [q for q in qualifications if q['ticker'] == r['ticker'] and q['status'] == 'TECHNICALLY_QUALIFIED_REVIEW_CANDIDATE' and (q.get('period') or {}).get('end') == r['requiredPeriod']]
    reviewed_exists = any(q.get('auditStatus') == 'REVIEWED' for q in candidates if q.get('documentType') != 'FINANCIAL_DISCLOSURE')
    matched = []
    for q in candidates:
        if reviewed_exists and q.get('documentType') != 'FINANCIAL_DISCLOSURE' and q.get('auditStatus') != 'REVIEWED': continue
        own = q.get('originalPublicUrl', q.get('resourceReference'))
        alias = [d for d in additional if d['ticker'] == r['ticker'] and d['bodyHash'] == q['bodyHash'] and d['originalPublicUrl'] in targets]
        if own not in targets and not alias: continue
        assert sha(B / (q['bodyHash'] + '.pdf')) == q['bodyHash']
        matched.append({'bodyHash': q['bodyHash'], 'documentId': q['documentId'], 'qualifiedPublicUrl': own, 'currentInventoryUrl': own if own in targets else alias[0]['originalPublicUrl'], 'binding': 'EXACT_RETAINED_PUBLIC_URL' if own in targets else 'EXACT_SAME_BODY_NEW_ISSUER_RECEIPT', 'additionalReceiptDocumentIds': [d['documentId'] for d in alias]})
    correction_pending = r['ticker'] == 'VIC' and (B / 'vic-current-correction-discovery.json').exists()
    if correction_pending:
        f = B / 'vic-current-correction-discovery.json'
        evidence.append({'file':str(f), 'sha256':sha(f)})
        scope_file = B / 'vic-correction-scope-evidence.json'
        if scope_file.exists():
            scope = json.loads(scope_file.read_text())
            assert scope['status'] == 'TWO_READER_CORRECTION_SCOPE_REVIEW_CANDIDATE'
            assert scope['correctionKind'] == 'NOTE_COUNTERPARTY_NAME' and scope['canonicalNumericCellChanges'] == []
            assert any(v['bodyHash'] == scope['baseReportBodyHash'] for v in matched)
            for proof in scope['sourceProofs']:
                assert sha(pathlib.Path(proof['file'])) == proof['sha256']
                evidence.append(proof)
            evidence.append({'file':str(scope_file), 'sha256':sha(scope_file)})
            for binding in matched:
                if binding['bodyHash'] == scope['baseReportBodyHash']:
                    binding['subsequentCorrection'] = {'bodyHash':scope['source']['bodyHash'], 'scopeEvidenceHash':sha(scope_file), 'canonicalNumericCellChanges':[]}
            correction_pending = False
    records.append({'ticker': r['ticker'], 'requiredPeriod': r['requiredPeriod'], 'status': 'CURRENT_CORRECTION_SCOPE_REVIEW_REQUIRED' if correction_pending else 'EXACT_CURRENT_ATTACHMENT_BODY_BOUND' if matched else 'CURRENT_PERIOD_KNOWN_VERSION_BINDING_REQUIRED', 'bindings': [] if correction_pending else matched, 'retainedAttachmentBindingsPendingCorrectionReview': matched if correction_pending else [], 'sourceProofs': evidence, 'limitations': ['No source-priority winner or audit-status-only version equivalence. Distinct disclosures require their own current-version evidence.']})
out = {'recordedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'status': 'REVIEW_CANDIDATE', 'independentHumanApproval': None, 'records': records}
(B / 'current-version-body-bindings.json').write_text(json.dumps(out, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'tickers': len(records), 'exactVersionBound': sum(bool(r['bindings']) for r in records), 'pendingExactVersionBindings': [r['ticker'] for r in records if not r['bindings']]}))
