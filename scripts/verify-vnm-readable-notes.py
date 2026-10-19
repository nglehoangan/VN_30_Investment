"""Check typed readable values, original evidence, corrections and debt reconciliation."""
import collections
import hashlib
import importlib.util
import json
import pathlib
from decimal import Decimal

ROOT = pathlib.Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location('vnm_readable', ROOT / 'scripts/build-vnm-readable-notes.py')
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)
OUT, RAW = MODULE.OUT, MODULE.RAW


def read(path):
    return json.loads(path.read_text())


def pointer(value, locator):
    for key in locator.strip('/').split('/'):
        value = value[int(key)] if isinstance(value, list) else value[key]
    return value


def main():
    original = read(RAW / 'VNM.json')
    readable = read(OUT / 'VNM.json')
    assert readable['productionAdmissible'] is False
    original_periods = original['reports']['thuyet-minh']['periods']
    periods = readable['reports']['thuyet-minh']['periods']
    assert set(original_periods) == set(periods)
    cached = {}
    rows_total = 0
    fixed_cells = 0
    scalar_numbers = 0
    for key, period in periods.items():
        source_period = original_periods[key]
        variant = period['variants'][0]
        tag = variant['sourcePeriod']
        single = read(OUT / f'{tag}.json')
        assert single['reports']['thuyet-minh']['periods'][key] == period
        assert period['periodType'] == source_period['periodType']
        assert period['asOf'] == source_period['asOf']
        raw_groups = source_period['variants'][0]['groups']
        assert len(variant['groups']) == len(raw_groups)
        for group, old_group in zip(variant['groups'], raw_groups):
            assert group['id'] == old_group['id']
            assert len(group['rows']) == len(old_group['rows'])
            for row, old_row in zip(group['rows'], old_group['rows']):
                rows_total += 1
                assert row['rawText'] == old_row['label']
                assert pointer(original, row['originPointer']) == old_row
                old_sources = {(old_row['rawPath'], c['rawLocator']) for c in old_row['cells']}
                new_sources = {(c['source']['rawPath'], c['source']['rawLocator']) for c in row['cells']}
                assert old_sources == new_sources, (key, row['id'], 'DROPPED_OCR_CHUNK')
                for cell in row['cells']:
                    s = cell['source']
                    if s['rawPath'] not in cached:
                        cached[s['rawPath']] = read(ROOT / s['rawPath'])
                    raw_cell = pointer(cached[s['rawPath']], s['rawLocator'])
                    assert cell['rawText'] == raw_cell['text']
                    assert cell['source']['bbox'] == {k: raw_cell[k] for k in ['x', 'y', 'width', 'height']}
                    value = cell['value']
                    assert not isinstance(value, float)
                    if isinstance(value, int):
                        scalar_numbers += 1
                        assert abs(value) <= MODULE.SAFE
                        assert Decimal(str(value)) == Decimal(cell['valueExact'])
                    if cell['valueType'] == 'DASH':
                        assert value is None
                    if cell['status'] == 'VISUALLY_TRANSCRIBED_CORRECTION':
                        fixed_cells += 1
                        expected = MODULE.CORRECTIONS[(tag, row['sourcePage'], s['rawLocator'])]
                        assert str(value) == expected['valueExact']
                    elif 'characterSpan' in s:
                        a, b = s['characterSpan']
                        assert raw_cell['text'][a:b].strip() == cell['displayValue'].strip()
        debt = readable['reviewedBorrowingTables'][key]
        assert debt == single['reviewedBorrowingTables']
        assert debt['reportedBorrowingSubtotal']['value'] == sum(c['value'] for c in debt['components'][:2])
        assert debt['reportedBorrowingSubtotal']['currentPortionAddedAgain'] is False
        assert debt['strictComprehensiveDebt']['qualifiedValue'] is None
        assert debt['legacyFINANCIAL_DEBT']['qualifiedValue'] is None
        if key in ['2024', '2025', '2026-YTD2']:
            assert debt['currentPortionReview']['closingSeparateValue'] is None
            assert debt['currentPortionReview']['numericCurrentPortionAvailable'] is False
            presentation = debt['currentPortionReview']['presentationEvidence']
            assert presentation['status'] == 'INCLUDED_IN_SHORT_NOT_SEPARATELY_DISCLOSED'
            assert debt['currentPortionReview']['exactReceiptInputAvailable'] is True
            assert debt['currentPortionReview']['presentationConditionStatus'] == 'RESOLVED'
            assert debt['movements'][0]['columns'][2]['semantic'] == 'PERIOD_MOVEMENT'
        else:
            current = debt['currentPortionReview']['closingSeparateValue']
            short_ex = debt['components'][2]['value']
            gross = debt['components'][4]['value']
            assert short_ex + current == debt['components'][0]['value']
            assert gross - current == debt['components'][1]['value']
    assert rows_total == 8820
    assert fixed_cells == 2
    assert MODULE.typed('9007199254740992') == '9007199254740992'
    assert MODULE.typed('9007199254740991') == 9007199254740991
    assert MODULE.typed('0.12345678901234567890123456789') == '0.12345678901234567890123456789'
    review = read(OUT / 'FINANCIAL_DEBT_REVIEW.json')
    assert not review['canonicalAdmissionPerformed']
    assert not review['qualification']['LEVEL1_PROMOTION_CANDIDATE']
    pins = read(OUT / 'provenance.json')['inputSha256']
    for path, digest in pins.items():
        assert hashlib.sha256((ROOT / path).read_bytes()).hexdigest() == digest, path
    for path, digest in read(OUT / 'ARTIFACT_HASHES.json')['files'].items():
        assert hashlib.sha256((ROOT / path).read_bytes()).hexdigest() == digest, path
    print(json.dumps({'status': 'PASS', 'periods': len(periods), 'rows': rows_total,
                      'numericScalars': scalar_numbers, 'visualCorrections': fixed_cells,
                      'sourcePointersAndCoordinates': 'PASS', 'rawSourceHashesUnchanged': True,
                      'debtClosingVsMovementAndDoubleCountGuards': 'PASS',
                      'currentPortionPresentationStatus': review['currentPortionPresentationBlocker'],
                      'overallFinancialDebtStatus': review['overallStatus']}, indent=2))


if __name__ == '__main__':
    main()
