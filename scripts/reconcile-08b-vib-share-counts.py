"""Read the exact issuer share-count table; never substitutes weighted EPS shares."""
import json, pathlib, hashlib, runpy, re

B = pathlib.Path('data/initialization-08b-remediation-work')
R = runpy.run_path('scripts/reconcile-08b-extraction.py')
body = '0d7f9ab03feb69bd5cb64310308782731ec6b45569a502c5ab0ba0a4922d693a'
q = next(q for q in json.loads((B / 'qualifications.json').read_text()) if q['bodyHash'] == body)
assert q['status'] == 'TECHNICALLY_QUALIFIED_REVIEW_CANDIDATE' and q['scope'] == 'CONSOLIDATED'
file = B / 'ocr' / (body + '-p44.json')
p = json.loads(file.read_text())
assert p['sourceRenderRotation'] == 90 and p['engineA'] != p['engineB']
assert hashlib.sha256((B / (body + '.pdf')).read_bytes()).hexdigest() == body
assert hashlib.sha256((B / 'ocr' / (body + '-p44.png')).read_bytes()).hexdigest() == p['renderSha256']
verified = []
for key in ['passA', 'passB']:
    groups = R['lines'](p[key]); text = R['fold'](R['full_text'](p, key))
    assert 'von co phan' in text and 'so luong co phieu dang luu hanh' in text
    assert 'co phieu pho thong' in text and 'hop nhat' in text
    # The ordinary outstanding subrow lies beneath the exact outstanding label.
    titles = [g for g in groups if 'so luong co phieu dang luu hanh' in R['fold'](g['text'])]
    assert len(titles) == 1
    title = titles[0]
    rows = [g for g in groups if title['cy'] <= g['cy'] < title['cy'] + .04 and
            'co phieu pho thong' in R['fold'](g['text'])]
    assert len(rows) == 1
    row = rows[0]
    headers = [g for g in groups if .63 < g['cy'] < row['cy'] and
               '30/06/2026' in g['text'] and '31/12/2025' in g['text']]
    assert len(headers) == 1
    date_words = [w for w in headers[0]['words'] if w['text'] in ['30/06/2026', '31/12/2025']]
    assert len(date_words) == 2 and date_words[0]['x'] < date_words[1]['x']
    values = [w for w in row['words'] if R['numeric_value'](w['text']) == '3404005710']
    assert len(values) == 2 and all(w['confidence'] >= .8 for w in values)
    assert all(abs(v['x'] - h['x']) < .065 for v, h in zip(values, date_words))
    # The adjacent 34,040,057 values are nominal capital in million VND,
    # not shares; count units follow the explicit outstanding-share caption.
    verified.append((row, values))
assert [w['text'] for w in verified[0][1]] == [w['text'] for w in verified[1][1]]
cells = []
for index, end in enumerate(['2026-06-30', '2025-12-31']):
    year = int(end[:4]); row, values = verified[0]; value = values[index]
    cells.append({'ticker': 'VIB', 'securityId': q['securityId'], 'documentId': q['documentId'],
                  'bodyHash': body, 'page': 44, 'itemId': 'ORDINARY_SHARES_OUTSTANDING',
                  'sourceCaption': 'Số lượng cổ phiếu đang lưu hành - Cổ phiếu phổ thông',
                  'captionAlternative': 'EXPLICIT_ORDINARY_OUTSTANDING_SHARE_SUBROW',
                  'lexicalValue': value['text'], 'verificationLexicalValue': verified[1][1][index]['text'],
                  'verifiedCanonicalInteger': R['numeric_value'](value['text']),
                  'unit': 'SHARES', 'currency': None, 'scope': q['scope'],
                  'period': {'start': end, 'end': end, 'type': 'ANNUAL' if index else 'YTD',
                             'fiscalYear': year, 'fiscalQuarter': None if index else 2,
                             'calendarReference': 'SOURCE_EXPLICIT_ORDINARY_OUTSTANDING_SHARE_DATE'},
                  'periodType': 'INSTANT', 'columnX': value['x'], 'rowY': row['cy'],
                  'extractionMethod': p['engineA'], 'verificationMethod': p['engineB'],
                  'renderSha256': p['renderSha256'], 'sourceRenderRotation': p['sourceRenderRotation'],
                  'sourcePageEvidenceHashes': [hashlib.sha256(json.dumps(p[k], sort_keys=True, ensure_ascii=False).encode()).hexdigest() for k in ['passA','passB']],
                  'status': 'VERIFIED_TRANSCRIPTION_REVIEW_CANDIDATE', 'comparativeColumn': bool(index),
                  'unitEvidence': 'Exact outstanding-share/ordinary-share caption, distinct from adjacent nominal capital columns; no weighted-average EPS denominator or share adjustment inferred.'})
(B / 'vib-share-count-cells.json').write_text(json.dumps(cells, indent=2, ensure_ascii=False) + '\n')
print(json.dumps({'verifiedOrdinaryShareCells':len(cells),'weightedAverageSubstitution':False}))
