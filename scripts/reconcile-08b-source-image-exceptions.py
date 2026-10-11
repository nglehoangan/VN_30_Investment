"""Exact exception reconciliation against separately retained machine image readings.

Never alters OCR streams or asserts independent human approval. Only explicitly
inspected cells matching a separate OCR reader become review candidates.
"""
import hashlib, json, pathlib, runpy, re

B = pathlib.Path('data/initialization-08b-remediation-work')
R = runpy.run_path('scripts/reconcile-08b-extraction.py')
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
proof_file = B / 'gvr-source-image-reader-proof.json'
proof = json.loads(proof_file.read_text())
assert proof['method'] == 'CODEX_ASSISTANT_SOURCE_IMAGE_READING'
assert proof['governanceStatus'] == 'REVIEW_CANDIDATE' and proof['independentHumanApproval'] is None
qualifications = json.loads((B / 'qualifications.json').read_text())
cells = []
for row in proof['rows']:
    q = next(q for q in qualifications if q['bodyHash'] == row['bodyHash'])
    assert q['status'] == 'TECHNICALLY_QUALIFIED_REVIEW_CANDIDATE'
    assert q['scope'] == row['scope'] and q['period']['end'] == row['periodEnd']
    assert sha(B / (row['bodyHash'] + '.pdf')) == row['bodyHash']
    render = pathlib.Path(row['renderFile'])
    assert sha(render) == row['renderSha256']
    file = B / 'ocr' / f"{row['bodyHash']}-p{row['page']}.json"
    page = json.loads(file.read_text())
    assert page['renderSha256'] == row['renderSha256']
    assert page['engineA'] == 'APPLE_VISION_ACCURATE_IMAGE_OCR'
    groups = R['lines'](page['passA'])
    matching = [g for g in groups if R['compact'](row['caption']) in R['compact'](g['text'])
                and re.search(r'(?<!\d)' + row['rowCode'] + r'(?!\d)', g['text'])]
    assert len(matching) == 1
    group = matching[0]
    values = [w for w in group['words'] if w['text'] in [row['currentLexical'], row['priorLexical']]]
    assert len(values) == 2 and values[0]['x'] < values[1]['x']
    assert all(w['confidence'] >= .8 for w in values)
    text = R['fold'](R['full_text'](page, 'passA'))
    if row['periodType'] == 'INSTANT':
        assert row['currentHeader'] in text and row['priorHeader'] in text
    else:
        # The page's literal reporting range and isolated year tokens provide
        # the OCR period/column evidence when words such as "tháng" are damaged.
        assert '01/01/2026' in text and '30/06/2026' in text
        def year_tokens(g):
            return [w for w in g['words'] if w['x'] > .6 and w['width'] < .18
                    and re.search(r'(?<!\d)202[56]$', w['text'])]
        headers = [g for g in groups if g['cy'] < group['cy'] and
                   [re.search(r'202[56]$', w['text'])[0] for w in year_tokens(g)] == ['2026', '2025']]
        assert len(headers) == 1
        year_words = year_tokens(headers[0])
        assert abs(values[0]['x'] - year_words[0]['x']) < .08 and abs(values[1]['x'] - year_words[1]['x']) < .08
    assert 'hop nhat' in text and R['declared_unit'](groups, group['cy'])[1] == row['unit']
    period = {**q['period'], 'start': row['periodStart'], 'end': row['periodEnd']}
    cells.append({'ticker': q['ticker'], 'securityId': q['securityId'], 'documentId': q['documentId'],
                  'bodyHash': row['bodyHash'], 'page': row['page'], 'itemId': row['itemId'],
                  'sourceCaption': group['text'], 'captionAlternative': R['fold'](row['caption']),
                  'sourceRowCode': row['rowCode'], 'lexicalValue': values[0]['text'],
                  'verificationLexicalValue': row['currentLexical'],
                  'verifiedCanonicalInteger': R['numeric_value'](row['currentLexical']),
                  'unit': row['unit'], 'currency': row['currency'], 'scope': row['scope'],
                  'period': period, 'periodType': row['periodType'], 'columnX': values[0]['x'],
                  'rowY': group['cy'], 'extractionMethod': page['engineA'],
                  'verificationMethod': proof['method'], 'verificationGeometry': 'SOURCE_IMAGE_LITERAL_ROW_CODE_AND_EXPLICIT_ORDERED_DATE_COLUMNS',
                  'renderSha256': row['renderSha256'],
                  'sourcePageEvidenceHashes': [sha(file), sha(proof_file)],
                  'sourceImageProofFile': str(proof_file), 'sourceOcrProofFile': str(file),
                  'status': 'VERIFIED_TRANSCRIPTION_REVIEW_CANDIDATE', 'comparativeColumn': False,
                  'independentHumanApproval': None})
(B / 'source-image-verified-cells.json').write_text(json.dumps(cells, indent=2, ensure_ascii=False) + '\n')
print(json.dumps({'verifiedSourceImageExceptionCells': len(cells), 'humanApprovalAsserted': False}))
