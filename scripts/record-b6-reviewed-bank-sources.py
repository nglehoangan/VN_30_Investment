"""Transcriptions checked against full source-page images, not amount-based mappings."""
import datetime
from decimal import Decimal
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-30/b6-close-inputs-r1'
# Assets, total equity (including NCI), gross customer loans, customer deposits, NII, total NPAT.
CHECKED = {
    'ACB': ([7, 8, 10, 50], ['1067845075', '99314518', '745759303', '576603602', '14773853', '8612866'], ['5401103', '2546765']),
    'BID': ([8, 9, 11, 37], ['3440840854', '198783286', '2501807043', '2261489130', '33537974', '15173710'], ['18525602', '16169122']),
    'CTG': ([7, 8, 10, 36], ['2962003670', '200214302', '2092707758', '1890809553', '40115615', '20743531'], ['15577491', '18016961']),
    'HDB': ([7, 8, 10, 37], ['1043891774', '90224021', '659000255', '674058701', '18220037', '10697724'], ['4884602', '4312483']),
    'MBB': ([10, 11, 13, 55], ['1733012662', '156762644', '1227554477', '963815357', '31806771', '16148193'], ['9156802', '7506079']),
    'SSB': ([9, 10, 12, 41], ['427107510', '42195287', '253860052', '199777344', '4663413', '2101553'], ['1868671', '1928362']),
    'STB': ([8, 9, 11, 46], ['892048566', '62807249', '636028893', '647939224', '12289285', '2931095'], ['4528734', '22648163']),
    'TCB': ([8, 9, 11, 52], ['1273076923', '188997150', '847335568', '662447730', '20285055', '14676922'], ['5924451', '5587580']),
    'VIB': ([8, 9, 11, 37], ['580998048', '47837834', '397083447', '317451548', '8406535', '4146615'], ['2935061', '2127953']),
}
ITEMS = ['TOTAL_ASSETS', 'TOTAL_EQUITY', 'BANK_GROSS_CUSTOMER_LOANS', 'BANK_CUSTOMER_DEPOSITS', 'BANK_NET_INTEREST_INCOME', 'NET_INCOME']
CAPTIONS = ['Tổng tài sản', 'Tổng vốn chủ sở hữu (bao gồm lợi ích không kiểm soát nếu có)', 'Cho vay khách hàng — giá trị gộp trước dự phòng', 'Tiền gửi của khách hàng', 'Thu nhập lãi thuần', 'Lợi nhuận sau thuế — toàn bộ phạm vi hợp nhất']


def main():
    at = datetime.datetime.now(datetime.timezone.utc).isoformat()
    facts = []
    for ticker, (pages, values, allowance) in CHECKED.items():
        notes = json.loads((ROOT / f'data/manual-extracted-pdf/notes/{ticker}.json').read_text())
        doc = next(d for d in notes['documents'] if '6T_2026_Soatxet_Hopnhat' in d['pdfPaths'][0])
        source = ROOT / doc['pdfPaths'][0]
        assert hashlib.sha256(source.read_bytes()).hexdigest() == doc['sourceHash']
        for i, (item, value) in enumerate(zip(ITEMS, values)):
            page = pages[0 if i in [0, 2] else 1 if i in [1, 3] else 2]
            facts.append({'id': f'checked-bank-{ticker}-{item}-20260630', 'ticker': ticker, 'itemId': item,
                          'value': str(int(value) * 1_000_000), 'rawValue': value, 'rawUnit': 'MILLION_CURRENCY', 'multiplier': '1000000',
                          'sourcePdfPath': str(source.relative_to(ROOT)), 'sourceHash': doc['sourceHash'], 'page': page,
                          'period': {'start': '2026-01-01' if i >= 4 else '2026-06-30', 'end': '2026-06-30'},
                          'reportingScope': 'CONSOLIDATED', 'unit': 'CURRENCY', 'currency': 'VND',
                          'captionAndColumn': CAPTIONS[i] + '; cột 30/06/2026 hoặc kỳ sáu tháng kết thúc cùng ngày',
                          'method': 'CHATGPT_FULL_SOURCE_IMAGE_REVIEW', 'reviewedAt': at})
        facts.append({'id': f'checked-bank-{ticker}-BANK_LOAN_LOSS_RESERVES-20260630', 'ticker': ticker,
                      'itemId': 'BANK_LOAN_LOSS_RESERVES', 'value': str(sum(int(v) for v in allowance) * 1_000_000),
                      'rawValue': str(sum(int(v) for v in allowance)), 'rawUnit': 'MILLION_CURRENCY', 'multiplier': '1000000',
                      'sourcePdfPath': str(source.relative_to(ROOT)), 'sourceHash': doc['sourceHash'], 'page': pages[3],
                      'period': {'start': '2026-06-30', 'end': '2026-06-30'}, 'reportingScope': 'CONSOLIDATED',
                      'unit': 'CURRENCY', 'currency': 'VND', 'captionAndColumn': 'Dự phòng chung + dự phòng cụ thể cho vay khách hàng; số cuối 30/06/2026',
                      'operandsMillion': {'general': allowance[0], 'specific': allowance[1]},
                      'exclusions': 'Separate margin/deferred-LC columns, VAMC, securities, purchased debt, and other credit-risk assets excluded; gross loan population remains issuer-reported.',
                      'separatelyExcludedMillion': '117476' if ticker == 'ACB' else '10254' if ticker == 'TCB' else None,
                      'method': 'CHATGPT_SOURCE_IMAGE_QUALIFIED_COMPONENT_SUM', 'reviewedAt': at})
    old = json.loads((OUT / 'source-reconciliation-candidates.json').read_text())['rows']
    for f in facts:
        prior = [r for r in old if r['ticker'] == f['ticker'] and r['itemId'] == f['itemId'] and r['periodEnd'] == f['period']['end']]
        f['priorObservationIds'] = [r['observationId'] for r in prior]
        f['comparison'] = 'MATCH' if prior and all(Decimal(r['oldValue']) == Decimal(f['value']) for r in prior) else 'CONFLICT' if prior else 'NEW'
    output = {'contract': 'b6-bank-direct-source-review-v1', 'reviewedAt': at, 'facts': facts,
              'allSourceUnitsVisuallyChecked': True, 'allSourcePeriodsAndConsolidatedHeadingsVisuallyChecked': True,
              'amountEqualityUsedToChooseMapping': False, 'productionAdmission': False}
    (OUT / 'checked-bank-sources.json').write_text(json.dumps(output, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'facts': len(facts), 'conflicts': [f['id'] for f in facts if f['comparison'] == 'CONFLICT']}))


if __name__ == '__main__':
    main()
