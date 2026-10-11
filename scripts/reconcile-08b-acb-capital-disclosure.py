"""Exact ACB TT14 reported ratios; percent scale bound to the official regulation."""
import decimal, hashlib, json, os, pathlib, runpy

B = pathlib.Path('data/initialization-08b-remediation-work')
BODY = 'a438d4491ebafde55dac4781f901b38efed802b1113421e5469dc2333b7a1dc0'
REG = '458d7b4a193be781bcb5ab94e7fb1b54f9ea18860f4e580eb6665841cab4bc24'
ROWS = {'BANK_REPORTED_CAR': ('Tỷ lệ ATV', '11,8', .79),
        'BANK_REPORTED_CET1': ('Tỷ lệ vốn lõi cấp 1', '11,5', .69)}
sha = lambda p: hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()
read = lambda p: json.loads(pathlib.Path(p).read_text())


def validate(c, p, R):
    try:
        if (c['bodyHash'] != BODY or c['ticker'] != 'ACB' or c['page'] != 4
                or c['itemId'] not in ROWS or c['scope'] != 'CONSOLIDATED'
                or c['unit'] != 'PERCENT' or c['currency'] is not None
                or c['periodType'] != 'INSTANT' or c['comparativeColumn']
                or c['period']['start'] != '2026-06-30'
                or c['period']['end'] != '2026-06-30'
                or c['independentHumanApproval'] is not None): return False
        caption, lex, y = ROWS[c['itemId']]
        if (c['sourceCaption'] != caption or c['lexicalValue'] != lex
                or c['verificationLexicalValue'] != lex
                or decimal.Decimal(lex.replace(',', '.')) != decimal.Decimal(c['verifiedCanonicalInteger'])): return False
        if (sha(B/(BODY+'.pdf')) != BODY or p['bodyHash'] != BODY or p['page'] != 4
                or p['engineA'] != c['extractionMethod'] or p['engineB'] != c['verificationMethod']
                or p['engineA'] != 'APPLE_VISION_ACCURATE_IMAGE_OCR'
                or p['engineB'] != 'TESSERACT_5.5.3_VIE_ENG_PSM6_IMAGE_OCR'
                or p['renderSha256'] != c['renderSha256']
                or sha(B/'ocr'/f'{BODY}-p4.png') != p['renderSha256']): return False
        unit_file = B/'targeted-indexes/NHNN-TT14-2025-official-part1.pdf'
        receipt = read(unit_file.with_suffix('.json'))
        if (sha(unit_file) != REG or receipt['bodySha256'] != REG
                or receipt['httpStatus'] != '200' or receipt['curlExit'] != 0
                or receipt['authority'] != 'OFFICIAL_GOVERNMENT_GAZETTE_REGULATORY_DEFINITION_ONLY'
                or receipt['historicalAvailabilityAsserted']): return False
        regulatory_page = read(B/'ocr'/f'{REG}-p11.json')
        if (regulatory_page['bodyHash'] != REG or regulatory_page['page'] != 11
                or regulatory_page['renderSha256'] != sha(B/'ocr'/f'{REG}-p11.png')
                or regulatory_page['engineA'] == regulatory_page['engineB']): return False
        proof = c['regulatoryUnitDefinitionProof']
        if proof != {'regulation': '14/2025/TT-NHNN', 'bodyHash': REG, 'page': 11,
                     'ocrSha256': sha(B/'ocr'/f'{REG}-p11.json'),
                     'receiptSha256': sha(unit_file.with_suffix('.json')),
                     'scale': 'PERCENT', 'method': 'TWO_DISTINCT_REGULATORY_DEFINITION_READERS'}: return False
        for key in ['passA', 'passB']:
            text = R['fold'](R['full_text'](p, key))
            if '30/06/2026' not in text or '14/2025/tt-nhnn' not in text or 'a chau (acb)' not in text: return False
            groups = R['lines'](p[key])
            row = [g for g in groups if abs(g['cy']-y)<.025
                   and R['compact'](' '.join(w['text'] for w in g['words'] if w['x']<.5))
                   == R['compact'](caption)]
            if len(row) != 1 or abs(row[0]['cy']-c['rowY'])>.015: return False
            nums = [w for w in row[0]['words'] if .6<w['x']<.74 and w['text']==lex]
            if len(nums)!=1 or nums[0]['confidence']<.8: return False
            # Literal column labels, folded for diacritics only; numeric placement
            # binds the consolidated value and rejects the separate 10.0/10.5.
            header = [g for g in groups if .62<g['cy']<.66]
            left = R['compact'](' '.join(w['text'] for g in header for w in g['words'] if .55<w['x']<.72))
            right = R['compact'](' '.join(w['text'] for g in header for w in g['words'] if .74<w['x']<.9))
            if left != 'hopnhat' or right != 'riengle': return False
            definition = ' '.join(R['fold'](R['full_text'](regulatory_page, key)).split())
            if ('ty le von loi cap 1 toi thieu la 4,5%' not in definition
                    or 'ty le an toan von toi thieu la 8%' not in definition): return False
        return True
    except (KeyError, OSError, ValueError, decimal.InvalidOperation): return False


def main():
    os.environ['VN30_EVIDENCE_WORK'] = str(B)
    R = runpy.run_path('scripts/reconcile-08b-extraction.py')
    d = read(B/'acb-required-capital-recovery.json')['documents'][0]
    assert d['bodyHash'] == BODY
    p = read(B/'ocr'/f'{BODY}-p4.json')
    identity = next(i for i in read('docs/fundamental-data-engine/evidence/2026-10-10-di123-identities.json')['identities'] if i['ticker']=='ACB')
    period = {'start':'2026-06-30','end':'2026-06-30','type':'INSTANT',
              'fiscalYear':2026,'fiscalQuarter':None,'calendarReference':'SOURCE_EXPLICIT_REGULATORY_AS_OF_DATE'}
    q = {**d, 'securityId':identity['securityId'], 'status':'TECHNICALLY_QUALIFIED_REVIEW_CANDIDATE',
         'documentType':'FINANCIAL_DISCLOSURE','scope':'CONSOLIDATED','period':period,
         'auditStatus':'UNKNOWN','accountingBasis':'UNKNOWN',
         'qualificationMethod':'TWO_INDEPENDENT_EXACT_TT14_REGULATORY_DISCLOSURE_READERS',
         'evidencePages':[1,4,5], 'contentEvidencePages':{'ISSUER_IDENTITY':[1,4],
         'DOCUMENT_TYPE':[1,4],'REPORTING_PERIOD':[4,5],'REPORTING_SCOPE':[4,5]}}
    cells = []
    for item, (caption, lex, y) in ROWS.items():
        group = next(g for g in R['lines'](p['passA']) if abs(g['cy']-y)<.025
                     and R['compact'](' '.join(w['text'] for w in g['words'] if w['x']<.5))==R['compact'](caption))
        num = next(w for w in group['words'] if .6<w['x']<.74 and w['text']==lex)
        c = {'ticker':'ACB','securityId':identity['securityId'],'documentId':d['documentId'],
             'bodyHash':BODY,'page':4,'itemId':item,'sourceCaption':caption,
             'captionAlternative':R['fold'](caption),'sourceRowCode':None,
             'lexicalValue':lex,'verificationLexicalValue':lex,
             'verifiedCanonicalInteger':str(decimal.Decimal(lex.replace(',','.'))),
             'unit':'PERCENT','currency':None,'scope':'CONSOLIDATED','period':period,
             'periodType':'INSTANT','columnX':num['x'],'rowY':group['cy'],
             'extractionMethod':p['engineA'],'verificationMethod':p['engineB'],
             'renderSha256':p['renderSha256'],'status':'VERIFIED_TRANSCRIPTION_REVIEW_CANDIDATE',
             'comparativeColumn':False,'independentHumanApproval':None,'exactAcbCapitalDisclosure':True,
             'regulatoryUnitDefinitionProof':{'regulation':'14/2025/TT-NHNN','bodyHash':REG,'page':11,
               'ocrSha256':sha(B/'ocr'/f'{REG}-p11.json'),
               'receiptSha256':sha(B/'targeted-indexes/NHNN-TT14-2025-official-part1.json'),
               'scale':'PERCENT','method':'TWO_DISTINCT_REGULATORY_DEFINITION_READERS'},
             'definitionEvidence':'TT14 reported total CAR / explicit core tier-one ratio; tier-one ratio is a separate row. Original lexical numbers have no percent suffix; scale comes from the cited official regulation, not magnitude inference.',
             'sourcePageEvidenceHashes':[
               *[hashlib.sha256(json.dumps(p[k],sort_keys=True,ensure_ascii=False).encode()).hexdigest() for k in ['passA','passB']],
               sha(B/'ocr'/f'{REG}-p11.json'),
               sha(B/'targeted-indexes/NHNN-TT14-2025-official-part1.json')]}
        assert validate(c,p,R), item
        cells.append(c)
    for name, rows in [('acb-capital-disclosure-qualifications.json',[q]),('acb-capital-disclosure-cells.json',cells)]:
        (B/name).write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'qualifiedDisclosures':1,'verifiedCells':len(cells),'scope':'CONSOLIDATED','humanApprovalAsserted':False}))


if __name__ == '__main__': main()
