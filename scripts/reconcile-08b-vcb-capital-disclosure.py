"""Exact source-image plus Apple Vision reconciliation; keep bad OCR intact."""
import decimal, hashlib, json, pathlib, re, runpy

B = pathlib.Path('data/initialization-08b-remediation-work')
R = runpy.run_path('scripts/reconcile-08b-extraction.py')
proofFile = B / 'vcb-capital-source-image-reader-proof.json'
proof = json.loads(proofFile.read_text())
d = proof['source']
sha = lambda f: hashlib.sha256(f.read_bytes()).hexdigest()
assert sha(B / (d['bodyHash'] + '.pdf')) == d['bodyHash']
pages = {n: json.loads((B / 'ocr' / f'{d["bodyHash"]}-p{n}.json').read_text()) for n in [1, 2]}
for key in ['passA', 'passB']:
    text = R['fold'](R['full_text'](pages[1], key))
    assert re.search(r'30\s+thang\s+0?6\s+nam\s+2026', text)
    assert 'ngoai thuong viet nam' in text
    assert 'ty le an toan von' in text
identity = next(i for i in json.loads(pathlib.Path('docs/fundamental-data-engine/evidence/2026-10-10-di123-identities.json').read_text())['identities'] if i['ticker'] == 'VCB')
period = {'start': '2026-06-30', 'end': '2026-06-30', 'type': 'INSTANT', 'fiscalYear': 2026, 'fiscalQuarter': None, 'calendarReference': 'SOURCE_EXPLICIT_REGULATORY_AS_OF_DATE'}
q = {**d, 'securityId': identity['securityId'], 'status': 'TECHNICALLY_QUALIFIED_REVIEW_CANDIDATE', 'documentType': 'FINANCIAL_DISCLOSURE', 'scope': 'CONSOLIDATED', 'period': period, 'auditStatus': 'UNKNOWN', 'accountingBasis': 'UNKNOWN', 'qualificationMethod': 'TWO_INDEPENDENT_REGULATORY_SOURCE_PAGE_READERS_WITH_EXACT_SOURCE_IMAGE_COLUMN_VERIFICATION', 'evidencePages': [1, 2], 'contentEvidencePages': {'ISSUER_IDENTITY': [1], 'DOCUMENT_TYPE': [1, 2], 'REPORTING_PERIOD': [1], 'REPORTING_SCOPE': [2]}}
cells = []
for row in proof['rows']:
    if row['itemId'] == 'CONTEXT_CET1': row['itemId'] = 'BANK_REPORTED_CET1'
    row.update({'currency': None, 'periodStart': period['start'], 'periodEnd': period['end'], 'periodType': 'INSTANT'})
    p = pages[2]
    assert p['engineA'] == 'APPLE_VISION_ACCURATE_IMAGE_OCR'
    assert p['renderSha256'] == row['renderSha256'] == sha(B / 'ocr' / f'{d["bodyHash"]}-p2.png')
    w = next(w for w in p['passA'] if w['text'] == row['currentLexical'] and abs(w['y'] - row['numericTop']) < .001 and w['x'] > .79)
    assert w['confidence'] >= .8
    assert R['compact'](row['caption']) in R['compact'](R['full_text'](p, 'passA'))
    assert any(w['text'] == 'Hợp nhất' and w['x'] > .78 for w in p['passA'])
    assert '14/2025/TT-NHNN' in R['full_text'](p, 'passA')
    cells.append({'ticker': 'VCB', 'securityId': identity['securityId'], 'documentId': d['documentId'], 'bodyHash': d['bodyHash'], 'page': 2, 'itemId': row['itemId'], 'sourceCaption': row['caption'], 'captionAlternative': R['fold'](row['caption']), 'sourceRowCode': row['rowCode'], 'lexicalValue': row['currentLexical'], 'verificationLexicalValue': row['currentLexical'], 'verifiedCanonicalInteger': str(decimal.Decimal(row['currentLexical'].rstrip('%').replace(',', '.'))), 'unit': 'PERCENT', 'currency': None, 'scope': 'CONSOLIDATED', 'period': period, 'periodType': 'INSTANT', 'columnX': w['x'], 'rowY': w['y'] + w['height']/2, 'extractionMethod': p['engineA'], 'verificationMethod': proof['method'], 'renderSha256': p['renderSha256'], 'sourceImageProofFile': str(proofFile), 'sourceOcrProofFile': str(B / 'ocr' / f'{d["bodyHash"]}-p2.json'), 'status': 'VERIFIED_TRANSCRIPTION_REVIEW_CANDIDATE', 'comparativeColumn': False, 'independentHumanApproval': None})
proof['limitations'] = ['Original disagreeing Tesseract slash/decimal outputs retained. Actual source image reading is distinct from OCR and is not independent human approval.']
proofFile.write_text(json.dumps(proof, ensure_ascii=False, indent=2) + '\n')
for c in cells: c['sourcePageEvidenceHashes'] = [sha(pathlib.Path(c['sourceOcrProofFile'])), sha(proofFile)]
f = B / 'source-image-verified-cells.json'
existing = [c for c in json.loads(f.read_text()) if c['bodyHash'] != d['bodyHash']]
f.write_text(json.dumps(existing + cells, ensure_ascii=False, indent=2) + '\n')
(B / 'vcb-capital-disclosure-qualifications.json').write_text(json.dumps([q], ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'verifiedSourceImageCells': len(cells), 'issuer': 'VCB', 'humanApprovalAsserted': False}))
