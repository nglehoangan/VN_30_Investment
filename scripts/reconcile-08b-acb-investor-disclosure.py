"""Exact consolidated ACB current ratios; approximate money and CAR stay excluded."""
import decimal, hashlib, json, pathlib, runpy

B = pathlib.Path('data/initialization-08b-remediation-work')
BODY = 'a3bbb3ebdd84c4a128b08d5f8197742cf41ebb8bc2f7f5a572909e603ab9b170'
RULES = {
    'BANK_REPORTED_CREDIT_GROWTH': ('8,6%', 'Đến cuối Q2/2026, quy mô tín dụng đạt gần 748 nghìn tỷ, tăng 8,6% so với đầu năm', 'Year-to-date credit growth from beginning of 2026; issuer credit perimeter, not an independently calculated customer-loan growth.'),
    'BANK_REPORTED_LDR': ('81,4%', 'Tỷ lệ LDR đạt mức 81,4%', 'Reported regulatory LDR; not an unrestricted loans/accounting customer-deposits division.'),
}

def validate(cell, page, reader):
    try:
        if cell['bodyHash'] != BODY or page['bodyHash'] != BODY:
            return False
        if cell['page'] != 2 or page['page'] != 2 or cell['itemId'] not in RULES:
            return False
        lexical, caption, basis = RULES[cell['itemId']]
        if (cell['ticker'] != 'ACB' or cell['scope'] != 'CONSOLIDATED' or cell['periodType'] != 'INSTANT'
                or cell['period']['start'] != '2026-06-30' or cell['period']['end'] != '2026-06-30'
                or cell['unit'] != 'PERCENT' or cell['currency'] is not None
                or cell['lexicalValue'] != lexical or cell['verificationLexicalValue'] != lexical
                or cell['reportedMetricBasis'] != basis or cell['sourceCaption'] != caption
                or cell['verifiedCanonicalInteger'] != str(decimal.Decimal(lexical.rstrip('%').replace(',', '.')))
                or cell['extractionMethod'] != page['engineA']
                or cell['verificationMethod'] != page['engineB']):
            return False
        if page['engineA'] != 'PYMUPDF_NATIVE_GLYPH_COORDINATES' or page['engineB'] != 'PDFPLUMBER_NATIVE_WORD_COORDINATES':
            return False
        for key in ['passA', 'passB']:
            text = reader['compact'](reader['full_text'](page, key))
            if reader['compact']('II/ PHẦN TRÌNH BÀY KQKD ACB 6TĐN 2026 (số hợp nhất)') not in text or reader['compact'](caption) not in text:
                return False
            tokens = [w for w in page[key] if w['text'].rstrip(',') == lexical and w['confidence'] >= .8
                      and abs(w['x'] - cell['columnX']) < .005 and abs(w['y'] + w['height']/2 - cell['rowY']) < .005]
            if len(tokens) != 1:
                return False
            if cell['sourceLexicalTokens'][key] != tokens[0]['text']:
                return False
        return True
    except (KeyError, TypeError, ValueError):
        return False

def main():
    reader = runpy.run_path('scripts/reconcile-08b-extraction.py')
    source = next(d for d in json.loads((B/'acb-required-current-bank-disclosure-recovery.json').read_text())['documents'] if d['bodyHash'] == BODY)
    assert hashlib.sha256((B/source['file']).read_bytes()).hexdigest() == BODY
    pages = {n: json.loads((B/'ocr'/f'{BODY}-p{n}.json').read_text()) for n in [1, 2]}
    for key in ['passA', 'passB']:
        t = reader['compact'](reader['full_text'](pages[1], key))
        assert reader['compact']('TÓM TẮT NỘI DUNG HỘI NGHỊ NHÀ ĐẦU TƯ') in t
        assert reader['compact']('ACB') in t and reader['compact']('6 THÁNG ĐẦU NĂM (6TĐN) 2026') in t
    identity = next(i for i in json.loads(pathlib.Path('docs/fundamental-data-engine/evidence/2026-10-10-di123-identities.json').read_text())['identities'] if i['ticker'] == 'ACB')
    period = {'start':'2026-06-30','end':'2026-06-30','type':'INSTANT','fiscalYear':2026,'fiscalQuarter':None,'calendarReference':'SOURCE_EXPLICIT_ISSUER_Q2_END_DATE'}
    q = {**source, 'securityId':identity['securityId'], 'status':'TECHNICALLY_QUALIFIED_REVIEW_CANDIDATE', 'documentType':'FINANCIAL_DISCLOSURE', 'scope':'CONSOLIDATED', 'period':period, 'accountingBasis':'UNKNOWN', 'auditStatus':'UNKNOWN', 'evidencePages':[1,2], 'contentEvidencePages':{'ISSUER_IDENTITY':[1,2],'DOCUMENT_TYPE':[1],'REPORTING_PERIOD':[1,2],'REPORTING_SCOPE':[2]}}
    p = pages[2]
    hashes = [hashlib.sha256(json.dumps(p[k],sort_keys=True,ensure_ascii=False).encode()).hexdigest() for k in ['passA','passB']]
    cells = []
    for item, (lexical, caption, basis) in RULES.items():
        token = next(w for w in p['passA'] if w['text'].rstrip(',') == lexical)
        cell = {'ticker':'ACB','securityId':identity['securityId'],'documentId':source['documentId'],'bodyHash':BODY,'page':2,'itemId':item,'sourceCaption':caption,'captionAlternative':'EXACT_CURRENT_CONSOLIDATED_INVESTOR_NARRATIVE','lexicalValue':lexical,'verificationLexicalValue':lexical,'verifiedCanonicalInteger':str(decimal.Decimal(lexical.rstrip('%').replace(',','.'))),'unit':'PERCENT','currency':None,'scope':'CONSOLIDATED','period':period,'periodType':'INSTANT','columnX':token['x'],'rowY':token['y']+token['height']/2,'extractionMethod':p['engineA'],'verificationMethod':p['engineB'],'renderSha256':p['renderSha256'],'sourcePageEvidenceHashes':hashes,'status':'VERIFIED_TRANSCRIPTION_REVIEW_CANDIDATE','comparativeColumn':False,'reportedMetricBasis':basis,'exactInvestorDisclosureProof':True}
        cell['sourceLexicalTokens'] = {key:next(w['text'] for w in p[key] if w['text'].rstrip(',')==lexical) for key in ['passA','passB']}
        assert validate(cell,p,reader)
        cells.append(cell)
    for name, rows in [('acb-investor-disclosure-qualifications.json',[q]),('acb-investor-disclosure-cells.json',cells)]:
        (B/name).write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'issuer':'ACB','verifiedReportedRatios':len(cells),'excluded':['APPROXIMATE_748_TRILLION_CREDIT','FUNDING_NOT_CUSTOMER_DEPOSITS','APPROXIMATE_CAR','QUARTER_NIM_NOT_LTM']}))

if __name__ == '__main__':
    main()
