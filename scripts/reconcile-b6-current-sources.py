"""Build caption/dimension-led source candidates. Amount equality never selects a row."""
import collections
from decimal import Decimal
import hashlib
import json
from pathlib import Path
import re
import unicodedata

ROOT = Path(__file__).resolve().parents[1]
OLD = ROOT / 'docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-29/b6-integration-r1'
OUT = ROOT / 'docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-30/b6-close-inputs-r1'


def fold(value):
    text = ''.join(c for c in unicodedata.normalize('NFD', (value or '').lower().replace('đ', 'd')) if unicodedata.category(c) != 'Mn')
    text = re.sub(r'^[\W\dIVXivx!|]+\s*', '', text)
    return re.sub(r'\s+', ' ', text).strip()


PATTERNS = {
    'TOTAL_ASSETS': r'^(tong (cong )?tai san|tong tai san)',
    'TOTAL_EQUITY': r'^(tong )?von chu so huu',
    'NET_INCOME': r'^(loi nhuan (thuan )?sau thue|loi nhuan ke toan sau thue|tong loi nhuan sau thue)',
    'NET_INCOME_ATTRIBUTABLE_PARENT': r'^loi nhuan sau thue (cua cong ty me|thuoc ve co dong cua cong ty me|cua co dong cong ty me|cua chu so huu)',
    'REVENUE': r'^(doanh thu thuan|cac khoan giam tru doanh thu doanh thu thuan)',
    'GROSS_PROFIT': r'^loi nhuan gop',
    'OPERATING_PROFIT': r'^loi nhuan thuan tu hoat dong kinh doanh',
    'CURRENT_ASSETS': r'^tai san ngan han',
    'CURRENT_LIABILITIES': r'^no ngan han',
    'INVENTORY': r'^hang ton kho',
    'RECEIVABLES': r'^(cac khoan )?phai thu ngan han',
    'CASH_AND_EQUIVALENTS': r'^tien va (cac )?khoan tuong duong tien',
    'SHORT_TERM_FINANCIAL_BORROWINGS': r'^(vay( va no thue tai chinh)? ngan han|vay va no (thue )?tai chinh ngan han)',
    'LONG_TERM_FINANCIAL_BORROWINGS': r'^(vay( va no thue tai chinh)? dai han|vay va no (thue )?tai chinh dai han)',
    'CFO': r'^luu chuyen tien thuan tu hoat dong kinh doanh',
    'CASH_CAPEX_REPORTED': r'^tien chi (de )?(mua|dau tu|xay dung)',
    'BASIC_EPS': r'^(lai( co ban)? tren co phieu|lai co ban tren co phieu)',
    'BANK_CUSTOMER_DEPOSITS': r'^tien gui cua khach hang$',
    'BANK_GROSS_CUSTOMER_LOANS': r'^cho vay khach hang$',
    'BANK_NET_INTEREST_INCOME': r'^thu nhap lai thuan',
}
REPORTS = {'can-doi-ke-toan', 'ket-qua-kinh-doanh', 'luu-chuyen-tien-te'}


def main():
    source = json.loads((OLD / 'native-review-sources.json').read_text())
    observations = {o['id']: o for o in source['observations']}
    captures = {r['id']: json.loads(r['payload'])['originalCanonicalRecord'] for r in source['rawReferenceCaptures']}
    recovered = json.loads((OUT / 'archive-recovery-network.json').read_text())
    members = {m['sha256']: {**m, 'archive': r} for r in recovered['records'] for m in r['members']}
    tickers = {o['ticker'] for o in source['observations']}
    displays = {t: json.loads((ROOT / f'data/manual-extracted-pdf/{t}.json').read_text()) for t in tickers}
    results = []
    for ctx in source['contexts']:
        if ctx['sourceRetained']:
            continue
        o = observations[ctx['observationId']]
        fact = captures[o['rawCaptureId']]
        result = {'observationId': o['id'], 'canonicalId': ctx['canonicalId'], 'ticker': o['ticker'], 'itemId': o['itemId'],
                  'periodStart': o['periodStart'], 'periodEnd': o['periodEnd'], 'scope': o['reportingScope'],
                  'oldValue': o['normalized']['value'], 'oldSourceHash': ctx['sourceHash'],
                  'originalAuthority': fact.get('authority'), 'candidates': [], 'productionAdmissible': False}
        if ctx['sourceHash'] in members:
            result.update(status='EXACT_PDF_BYTES_RECOVERED', recovered=members[ctx['sourceHash']])
            results.append(result)
            continue
        pattern = PATTERNS.get(o['itemId'])
        if not pattern:
            result.update(status='NEEDS_POPULATION_OR_CAPITAL_NOTE_REVIEW')
            results.append(result)
            continue
        for rk, report in displays[o['ticker']]['reports'].items():
            if rk not in REPORTS or (o['statementType'] == 'BALANCE' and rk != 'can-doi-ke-toan') or (o['statementType'] == 'INCOME' and rk != 'ket-qua-kinh-doanh') or (o['statementType'] == 'CASH_FLOW' and rk != 'luu-chuyen-tien-te'):
                continue
            for pk, period in report['periods'].items():
                for vi, v in enumerate(period['variants']):
                    if v.get('reportingScope') != o['reportingScope']:
                        continue
                    # Only dimensionally assigned columns. Unknown relative headers remain review work.
                    end = v.get('asOf') if v.get('periodType') == 'INSTANT' else f"{v.get('year')}-12-31" if v.get('periodType') == 'ANNUAL' else f"{v.get('year')}-06-30" if v.get('periodType') == 'YTD' and v.get('quarter') == 2 else None
                    if end != o['periodEnd']:
                        continue
                    if o['periodType'] in ['ANNUAL', 'YTD'] and v.get('periodType') != o['periodType']:
                        continue
                    for gi, g in enumerate(v['groups']):
                        for ri, row in enumerate(g['rows']):
                            label = fold(row.get('label'))
                            if not re.search(pattern, label):
                                continue
                            if o['itemId'] == 'NET_INCOME' and any(word in label for word in ['cong ty me', 'khong kiem', 'co dong', 'chu so huu']):
                                continue
                            if o['itemId'] == 'CASH_CAPEX_REPORTED' and not any(w in label for w in ['tscd', 'tai san co dinh', 'tai san dai han']):
                                continue
                            if row.get('value') is None or row.get('scale') is None:
                                continue
                            if o['itemId'] == 'BASIC_EPS':
                                # Generic statement scaling cannot establish a per-share amount.
                                continue
                            amount = format(Decimal(row['value']) * Decimal(row['scale']), 'f')
                            result['candidates'].append({'path': v['source']['pdfPath'], 'sha256': v['source']['payloadHash'],
                                'page': g['sourcePage'], 'caption': row['label'], 'code': row.get('code'), 'value': amount,
                                'rawValue': row['value'], 'scale': row['scale'], 'unit': row.get('unit'), 'currency': row.get('currency'),
                                'periodKey': pk, 'periodType': v.get('periodType'), 'columnLabel': v.get('label'),
                                'pointer': f'/reports/{rk}/periods/{pk}/variants/{vi}/groups/{gi}/rows/{ri}',
                                'boxes': row.get('boxes', []), 'headerEvidence': g.get('columnHeader'),
                                'valueComparisonAfterSemanticSelection': 'MATCH' if Decimal(amount) == Decimal(result['oldValue']) else 'DIFFERENT'})
        # Prefer explicit total-equity/total-inventory captions/codes, never matching amounts.
        for item, codes in [('TOTAL_EQUITY', {'400'}), ('INVENTORY', {'140'})]:
            if o['itemId'] == item and any(str(c['code']) in codes for c in result['candidates']):
                result['candidates'] = [c for c in result['candidates'] if str(c['code']) in codes]
        unique = {(c['sha256'], c['page'], c['pointer']): c for c in result['candidates']}
        result['candidates'] = list(unique.values())
        result['status'] = 'SOURCE_IMAGE_REVIEW_PENDING' if unique else 'NO_DIMENSION_QUALIFIED_CAPTION_CANDIDATE'
        results.append(result)
    report = {'contract': 'b6-caption-dimension-source-reconciliation-v1', 'selectionUsesAmounts': False,
              'counts': dict(collections.Counter(r['status'] for r in results)), 'rows': results}
    (OUT / 'source-reconciliation-candidates.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(report['counts']))


if __name__ == '__main__':
    main()
