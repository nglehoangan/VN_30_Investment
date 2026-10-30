"""Source-image-checked dimensions and transcription ledger; original OCR remains separate."""
import copy
import datetime
from decimal import Decimal
import hashlib
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-29/b6-integration-r1'
BASE = ROOT / 'data/manual-extracted-pdf/supplements/2026-10-29-b6-r1'


def load(p):
    return json.loads(p.read_text())


def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


def main():
    assert not (OUT / 'checked-source-ledger.json').exists()
    processing = load(BASE / 'manifest.json')
    annual = load(OUT.parent / 'annual-download-r1/download-manifest.json')
    retry = load(OUT.parent / 'document-retry-r1/download-manifest.json')
    at = datetime.datetime.now(datetime.timezone.utc).isoformat().replace('+00:00', 'Z')
    docs = {t: next(d for d in processing['documents'] if d['ticker'] == t and ('bao_cao_tai_chinh' in d['sourcePath'] if t in ['SSI', 'TCX'] else True)) for t in ['SSI', 'TCX', 'CTG', 'HDB', 'MBB', 'SHB', 'VIB']}
    transcriptions = [
        ('CTG', 'BANK_REPORTED_CAR', '10.10', 4, '2026-06-30', 'CONSOLIDATED', 'TT41_2016_STANDARDIZED', 'Tỷ lệ an toàn vốn; cột Hợp nhất'),
        ('HDB', 'BANK_REPORTED_CAR', '14.27', 5, '2026-06-30', 'CONSOLIDATED', 'TT41_2016_STANDARDIZED', 'Tỷ lệ an toàn vốn CAR; 30/06/2026 Hợp nhất'),
        ('MBB', 'BANK_REPORTED_CAR', '11.02', 5, '2025-12-31', 'CONSOLIDATED', 'TT41_2016_STANDARDIZED', 'Tỷ lệ an toàn vốn; Hợp nhất'),
        ('SHB', 'BANK_REPORTED_CAR', '11.81', 5, '2026-06-30', 'CONSOLIDATED', 'TT41_2016_STANDARDIZED', 'Tỷ lệ an toàn vốn A/B; Hợp nhất'),
        ('VIB', 'BANK_REPORTED_CAR', '11.8', 6, '2026-06-30', 'CONSOLIDATED', 'TT14_2025_STANDARDIZED', 'Tỷ lệ an toàn vốn bao gồm CCB; hợp nhất; cột VIB'),
        ('VIB', 'BANK_REPORTED_CET1', '10.0', 6, '2026-06-30', 'CONSOLIDATED', 'TT14_2025_STANDARDIZED', 'Tỷ lệ vốn lõi cấp 1 bao gồm CCB; hợp nhất; cột VIB'),
        ('SSI', 'TOTAL_ASSETS', '94049979396183', 11, '2025-12-31', 'CONSOLIDATED', None, 'Tổng cộng tài sản; Số cuối năm'),
        ('SSI', 'TOTAL_EQUITY', '32066318460762', 12, '2025-12-31', 'CONSOLIDATED', None, 'D. Vốn chủ sở hữu; Số cuối năm'),
        ('SSI', 'NET_INCOME', '4106880733899', 17, '2025-12-31', 'CONSOLIDATED', None, 'XI. Lợi nhuận kế toán sau thuế TNDN; Năm nay'),
        ('SSI', 'CASH_AND_EQUIVALENTS', '3646492763118', 10, '2025-12-31', 'CONSOLIDATED', None, 'Tiền và các khoản tương đương tiền; Số cuối năm'),
        ('SSI', 'FINANCIAL_DEBT', '60160501864584', 12, '2025-12-31', 'CONSOLIDATED', None, 'Vay và nợ thuê tài sản tài chính ngắn hạn; no long financing line in current statement'),
        ('SSI', 'SECURITIES_MARGIN_LOANS', '38616232016646', 50, '2025-12-31', 'CONSOLIDATED', None, '7.4 Cho vay hoạt động ký quỹ; Số cuối năm Giá trị ghi sổ; excludes advance receivables and fair value'),
        ('SSI', 'NET_INCOME_ATTRIBUTABLE_PARENT', '4106090416749', 17, '2025-12-31', 'CONSOLIDATED', None, 'Lợi nhuận sau thuế phân bổ cho chủ sở hữu; Năm nay'),
        ('TCX', 'TOTAL_ASSETS', '80632256999009', 8, '2025-12-31', 'SEPARATE_STANDALONE', None, 'Tổng cộng tài sản; Số cuối năm'),
        ('TCX', 'TOTAL_EQUITY', '44099580183375', 9, '2025-12-31', 'SEPARATE_STANDALONE', None, 'D. Vốn chủ sở hữu; Số cuối năm'),
        ('TCX', 'NET_INCOME', '5683331855108', 13, '2025-12-31', 'SEPARATE_STANDALONE', None, 'X. Lợi nhuận kế toán sau thuế TNDN; Năm nay; distinct from total common-share income'),
        ('TCX', 'CASH_AND_EQUIVALENTS', '3108078221717', 8, '2025-12-31', 'SEPARATE_STANDALONE', None, 'Tiền và các khoản tương đương tiền; Số cuối năm'),
        ('TCX', 'SECURITIES_MARGIN_LOANS', '43162734820966', 36, '2025-12-31', 'SEPARATE_STANDALONE', None, '7.4 Cho vay hoạt động ký quỹ; Số cuối năm Giá gốc; excludes advances and fair value'),
    ]
    facts = []
    for ticker, item, raw, page, end, scope, framework, caption in transcriptions:
        doc = docs[ticker]
        ratio = item in ['BANK_REPORTED_CAR', 'BANK_REPORTED_CET1']
        value = format(Decimal(raw) * (Decimal('.01') if ratio else Decimal('1')), 'f')
        value = value.rstrip('0').rstrip('.') if '.' in value else value
        facts.append({'id': 'checked-' + hashlib.sha256((doc['sourceSha256'] + item + end).encode()).hexdigest()[:32],
                      'ticker': ticker, 'itemId': item, 'value': value, 'rawValue': raw, 'rawUnit': 'PERCENT' if ratio else 'CURRENCY',
                      'multiplier': '0.01' if ratio else '1', 'unit': 'RATIO' if ratio else 'CURRENCY', 'currency': None if ratio else 'VND',
                      'period': {'start': end[:4] + '-01-01' if item in ['NET_INCOME', 'NET_INCOME_ATTRIBUTABLE_PARENT'] else end, 'end': end},
                      'reportingScope': scope, 'bankCapitalFramework': framework, 'captionAndColumn': caption,
                      'sourcePdfPath': doc['sourcePath'], 'sourceHash': doc['sourceSha256'], 'page': page,
                      'href': doc['sourcePath'] + '#page=' + str(page), 'method': 'CHATGPT_SOURCE_IMAGE_REVIEWED_TRANSCRIPTION',
                      'reviewedAt': at, 'sourceCaptureReceipt': str((OUT.parent / ('annual-download-r1' if ticker in ['SSI', 'TCX'] else 'document-retry-r1') / 'download-manifest.json').relative_to(ROOT)),
                      'scopeBasis': 'OWNER_ACCEPTED_ENTITY_ANNUAL_AS_PRESENTED' if ticker == 'TCX' else 'EXPLICIT_REPORT_OR_REGULATORY_COLUMN',
                      'productionAdmissible': False})
    # Current securities financing is an explicit component aggregate, never represented as a printed single cell.
    facts.append({'id': 'checked-tcx-financing-2025-components', 'ticker': 'TCX', 'itemId': 'FINANCIAL_DEBT',
                  'value': str(31079695096211 + 1504310847194 + 1509970833337), 'rawValue': None, 'rawUnit': 'CURRENCY',
                  'multiplier': '1', 'unit': 'CURRENCY', 'currency': 'VND', 'period': {'start': '2025-12-31', 'end': '2025-12-31'},
                  'reportingScope': 'SEPARATE_STANDALONE', 'sourcePdfPath': docs['TCX']['sourcePath'], 'sourceHash': docs['TCX']['sourceSha256'],
                  'page': 9, 'href': docs['TCX']['sourcePath'] + '#page=9', 'method': 'REVIEWED_SECURITIES_FINANCING_COMPONENT_SUM',
                  'operands': [{'caption': 'Vay và nợ thuê tài chính ngắn hạn', 'value': '31079695096211'}, {'caption': 'Trái phiếu phát hành ngắn hạn', 'value': '1504310847194'}, {'caption': 'Trái phiếu phát hành dài hạn', 'value': '1509970833337'}],
                  'reviewedAt': at, 'scopeBasis': 'OWNER_ACCEPTED_ENTITY_ANNUAL_AS_PRESENTED', 'productionAdmissible': False})
    tcx_letter = next(d for d in processing['documents'] if d['ticker'] == 'TCX' and 'cong_van' in d['sourcePath'])
    publications = [{'ticker': 'SSI', 'sourceHash': docs['SSI']['sourceSha256'], 'publicationDate': '2026-03-27',
                     'evidencePdf': docs['SSI']['sourcePath'], 'evidenceHash': docs['SSI']['sourceSha256'], 'page': 2},
                    {'ticker': 'TCX', 'sourceHash': docs['TCX']['sourceSha256'], 'publicationDate': '2026-03-06',
                     'evidencePdf': tcx_letter['sourcePath'], 'evidenceHash': tcx_letter['sourceSha256'], 'page': 1}]
    for p in publications:
        p.update({'precision': 'DATE_ONLY', 'timezone': 'Asia/Ho_Chi_Minh', 'evidenceClass': 'ISSUER_DECLARATION_READ_ON_VIETSTOCK_MIRRORED_PDF',
                  'externalWebsitePublicationIndependentlyVerified': False, 'reviewedAt': at})
    ledger = {'contract': 'b6-checked-source-facts-v1', 'reviewedAt': at, 'facts': facts, 'publications': publications,
              'MBB_2026_H1': 'OWNER_DEFERRED_NOT_UPDATED', 'notAllExtractedAmountsVisuallyReviewed': True}
    (OUT / 'checked-source-ledger.json').write_text(json.dumps(ledger, ensure_ascii=False, indent=2) + '\n')
    display = load(ROOT / 'data/manual-extracted-pdf/display-manifest.json'); combined_manifest = load(ROOT / 'data/combine/manifest.json')
    changes = []
    for ticker in ['SSI', 'TCX']:
        pp = ROOT / f'data/manual-extracted-pdf/{ticker}.json'; cp = ROOT / f'data/combine/{ticker}.json'
        pdf, combined = load(pp), load(cp); target_hash = docs[ticker]['sourceSha256']; moved = []
        notes = {p['page']: p['text'] for p in load(ROOT / docs[ticker]['path'])['notes']}
        for rk in ['can-doi-ke-toan', 'ket-qua-kinh-doanh', 'luu-chuyen-tien-te']:
            if rk not in pdf['reports']:
                continue
            for pk, period in list(pdf['reports'][rk]['periods'].items()):
                keep = []
                for v in period['variants']:
                    page = v['source'].get('page') or next((row.get('pdfEvidence', {}).get('page') for g in v['groups'] for row in g['rows'] if row.get('pdfEvidence', {}).get('page')), None)
                    if v['source'].get('payloadHash') != target_hash or not pk.startswith('UNRESOLVED') or page is None:
                        keep.append(v); continue
                    text = notes[page][:1600]
                    current_prior = ('Số cuối năm' in text and 'Số đầu năm' in text) if rk == 'can-doi-ke-toan' else ('Năm nay' in text and 'Năm trước' in text)
                    col = int(v['id'].rsplit(':c', 1)[1])
                    if not current_prior or col not in [0, 1]:
                        keep.append(v); continue
                    new = copy.deepcopy(v)
                    if rk == 'can-doi-ke-toan':
                        key = '2025-12-31' if col == 0 else '2025-01-01'
                        dims = {'periodKey': key, 'year': 2025, 'quarter': None, 'periodType': 'INSTANT', 'asOf': key}
                    else:
                        key = '2025' if col == 0 else '2024'
                        dims = {'periodKey': key, 'year': int(key), 'quarter': None, 'periodType': 'ANNUAL', 'asOf': None}
                    new.update(dims); new['dimensionReview'] = {'method': 'EXPLICIT_CURRENT_PRIOR_HEADINGS_PLUS_CHECKED_ANNUAL_DOCUMENT', 'reviewedAt': at, 'sourcePage': page}
                    new['reportingScope'] = 'CONSOLIDATED' if ticker == 'SSI' else 'SEPARATE_STANDALONE'
                    new['scopeStatus'] = 'EXPLICIT_REPORT_HEADER' if ticker == 'SSI' else 'OWNER_ACCEPTED_ENTITY_ANNUAL'
                    for g in new['groups']:
                        for row in g['rows']:
                            row['reportingScope'] = new['reportingScope']
                    moved.append((rk, pk, key, new))
                period['variants'] = keep
        for rk, old_key, key, variant in moved:
            p = pdf['reports'][rk]['periods'].setdefault(key, {'year': variant['year'], 'quarter': None, 'periodType': variant['periodType'], 'asOf': variant['asOf'], 'variants': []})
            p['variants'].append(variant)
            # Remove only this new variant from old combined group; all pre-supplement variants remain unchanged.
            combined['reports'][rk]['periods'][old_key]['variants'] = [v for v in combined['reports'][rk]['periods'][old_key]['variants'] if v['id'] != variant['id']]
        pointers = {}
        for rk, r in pdf['reports'].items():
            for pk, p in r['periods'].items():
                for vi, v in enumerate(p['variants']):
                    if v['source'].get('payloadHash') != target_hash:
                        continue
                    for gi, g in enumerate(v['groups']):
                        for ri, row in enumerate(g['rows']):
                            row['pdfEvidence']['jsonPointer'] = f'/reports/{rk}/periods/{pk}/variants/{vi}/groups/{gi}/rows/{ri}'
                    pointers[v['id']] = v
        for rk, _, key, variant in moved:
            p = combined['reports'][rk]['periods'].setdefault(key, {'year': variant['year'], 'quarter': None, 'periodType': variant['periodType'], 'asOf': variant['asOf'], 'variants': []})
            p['variants'].append(copy.deepcopy(pointers[variant['id']]))
        # Unmoved new variants may have shifted ordinal pointers after removals.
        for r in combined['reports'].values():
            for p in r['periods'].values():
                for i, v in enumerate(p['variants']):
                    if v['id'] in pointers:
                        p['variants'][i] = copy.deepcopy(pointers[v['id']])
        for path, data in [(pp, pdf), (cp, combined)]:
            path.write_text(json.dumps(data, ensure_ascii=True, separators=(',', ':')) + '\n')
        next(f for f in display['files'] if f['ticker'] == ticker)['sha256'] = sha(pp)
        next(f for f in combined_manifest['files'] if f['ticker'] == ticker)['sha256'] = sha(cp)
        changes.append({'ticker': ticker, 'reviewedPrimaryVariantsWithResolvedRelativeColumns': len(moved)})
    (ROOT / 'data/manual-extracted-pdf/display-manifest.json').write_text(json.dumps(display, ensure_ascii=True, separators=(',', ':')) + '\n')
    (ROOT / 'data/combine/manifest.json').write_text(json.dumps(combined_manifest, ensure_ascii=True, separators=(',', ':')) + '\n')
    (OUT / 'checked-dimension-changes.json').write_text(json.dumps({'changes': changes, 'originalOcrSupplementUnchanged': True, 'valuesUnchanged': True, 'openingBalanceKeptSeparate': True}, indent=2) + '\n')
    print(json.dumps({'checkedFacts': len(facts), 'publicationDeclarations': len(publications), 'dimensionChanges': changes}))


if __name__ == '__main__':
    main()
