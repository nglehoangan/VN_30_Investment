"""Readable typed values and candidate debt review from retained VNM notes.

Preserves sealed OCR/source JSON. Integers are JSON numbers only within JavaScript
safe-integer range; decimals/large integers retain exact strings. Canonical data,
policy and readiness are never written by this builder.
"""
import collections
import hashlib
import importlib.util
import json
import pathlib
import re
from decimal import Decimal

ROOT = pathlib.Path(__file__).resolve().parents[1]
RAW = ROOT / 'data/manual-extracted/notes-v1/VNM/2026-10-19'
OUT = ROOT / 'data/comparisons/VN30/VNM/notes-readable-v1'
SPEC = importlib.util.spec_from_file_location('vnm_notes', ROOT / 'scripts/extract-vnm-notes.py')
EXTRACT = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(EXTRACT)
SAFE = 9007199254740991
PINS = {}


def rel(p):
    return str(p.relative_to(ROOT))


def load(p):
    body = p.read_bytes()
    PINS[rel(p)] = hashlib.sha256(body).hexdigest()
    return json.loads(body)


def save(name, value):
    p = OUT / name
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def typed(exact):
    if exact is None:
        return None
    if re.fullmatch(r'-?\d+', exact) and abs(int(exact)) <= SAFE:
        return int(exact)
    return exact


def formatted(exact):
    if exact is None:
        return '—'
    if re.fullmatch(r'-?\d+', exact):
        return f'{int(exact):,}'.replace(',', '.')
    return exact


# Verified directly against the newly rendered FY2025 PDF page 50 (printed 49).
# This changes only the readable layer, never the original OCR.
CORRECTIONS = {
    ('FY2025', 50, '/observations/22'): {'original': '58.472.984.36', 'corrected': '68.472.984.360', 'valueExact': '68472984360', 'label': 'Chi phí lãi vay'},
    ('FY2025', 50, '/observations/23'): {'original': '2.063.370.80', 'corrected': '52.063.370.805', 'valueExact': '52063370805', 'label': 'Chi phí thuê kệ trưng bày'},
}


def convert_cell(cell, period, page, raw_path):
    raw_text = cell['text']
    source = {'rawPath': raw_path, 'rawLocator': cell['rawLocator'], 'bbox': cell['bbox'],
              'bboxPrecision': 'ORIGINAL_OCR_CHUNK_NOT_INDIVIDUAL_TOKEN'}
    correction = CORRECTIONS.get((period, page, cell['rawLocator']))
    if correction:
        assert raw_text == correction['original']
        return [{'value': typed(correction['valueExact']), 'valueExact': correction['valueExact'],
                 'valueType': 'NUMBER', 'displayValue': correction['corrected'], 'rawText': raw_text,
                 'status': 'VISUALLY_TRANSCRIBED_CORRECTION', 'source': source,
                 'unit': 'VND', 'column': '31/12/2025', 'periodEnd': '2025-12-31'}]
    tokens = cell['numericCandidates']
    # A date, list caption or sentence stays text. Convert only chunks made of
    # numeric tokens/dashes; do not interpret numbers embedded in prose as amounts.
    remaining = list(raw_text)
    for token in tokens:
        a, b = token['characterSpan']
        remaining[a:b] = [' '] * (b - a)
    covered = bool(tokens) and not ''.join(remaining).strip()
    if re.fullmatch(r'\(\d{1,2}\)', raw_text.strip()):
        covered = False  # May be a footnote number, not a negative amount.
    if not covered:
        return [{'value': raw_text, 'valueType': 'TEXT', 'rawText': raw_text, 'status': 'OCR_TEXT_CANDIDATE',
                 'source': source, 'numericTokensInText': tokens}]
    values = []
    for token in tokens:
        exact = token['value']
        dash = token['status'] == 'EXPLICIT_DASH_NOT_ZERO'
        unknown = exact is None and not dash
        values.append({'value': token['lexicalValue'] if unknown else typed(exact),
                       'valueExact': exact, 'valueType': 'UNPARSED_NUMERIC_TEXT' if unknown else 'DASH' if dash else 'NUMBER' if isinstance(typed(exact), int) else 'EXACT_DECIMAL_TEXT',
                       'displayValue': token['lexicalValue'], 'rawText': raw_text, 'status': token['status'],
                       'unit': token.get('unit', 'UNASSIGNED'), 'column': None, 'periodEnd': None,
                       'role': 'UNASSIGNED_NUMERIC_TOKEN_NOT_AUTOMATICALLY_CURRENCY',
                       'source': {**source, 'characterSpan': token['characterSpan']}})
    return values


DEBT = {
    'FY2022': {'pages': [47, 48], 'short': '4867129839103', 'shortExCurrent': '4848264489103', 'current': '18865350000', 'longGross': '84894075000', 'long': '66028725000'},
    'FY2023': {'pages': [46, 47], 'short': '8217757172267', 'shortExCurrent': '8058096403967', 'current': '159660768300', 'longGross': '398136842400', 'long': '238476074100'},
    'FY2024': {'pages': [47, 48], 'short': '9115435107250', 'current': None, 'long': '157903902450',
               'shortMovement': ['8217757172267', '18454373109005', '183157263872', '-17751443377504', '11590939610', '9115435107250'],
               'longMovement': ['238476074100', '93029702629', '-183157263872', '9555389593', '157903902450']},
    'FY2025': {'pages': [47, 48], 'short': '9393736731992', 'current': None, 'long': '62907826150',
               'shortMovement': ['9115435107250', '26015644844895', '20750493750', '-25761149313776', '3055599873', '9393736731992'],
               'longMovement': ['157903902450', None, '-20750493750', '-79137000000', '4891417450', '62907826150']},
    '6M2026': {'pages': [52, 53], 'short': '8323441876837', 'current': None, 'long': '131430000000',
               'shortMovement': ['9393736731992', '10362570293768', '10401978750', '-11458539477010', '15272349337', '8323441876837'],
               'longMovement': ['62907826150', '131325000000', '-10401978750', '-52007374250', '-393473150', '131430000000']},
}


def source_tokens(period, page, expected):
    path = RAW / 'raw' / period / f'p{page:04}.json'
    raw = load(path)
    matches = []
    for i, obs in enumerate(raw['observations']):
        for token in EXTRACT.numeric_candidates(obs['text']):
            if token['value'] == expected:
                matches.append({'rawPath': rel(path), 'rawLocator': f'/observations/{i}',
                                'characterSpan': token['characterSpan'], 'rawText': obs['text'],
                                'bbox': {k: obs[k] for k in ['x', 'y', 'width', 'height']}})
    return matches


def debt_amount(period, page, label, exact, role, date):
    pointers = source_tokens(period, page, exact) if exact is not None else []
    if exact is not None:
        assert pointers, (period, page, label, exact, 'NO_RAW_TOKEN')
    return {'label': label, 'value': typed(exact), 'valueExact': exact,
            'displayValue': formatted(exact), 'unit': 'VND', 'scope': 'CONSOLIDATED',
            'periodEnd': date, 'semantic': role, 'sourcePage': page,
            'status': 'VISUALLY_CHECKED_SOURCE_COMPONENT' if exact is not None else 'NOT_SEPARATELY_DISCLOSED_IN_REVIEWED_TABLE',
            'sourceMatches': pointers, 'sourceBindingBasis': 'Visually reviewed row/column definition; token equality locates the transcription only, not concept mapping.'}


def debt_tables(period, source, presentation=None):
    data = DEBT[period]
    short_page, long_page = data['pages']
    date = source['periodEnd']
    components = [debt_amount(period, short_page, 'Vay ngắn hạn — số dư được trình bày trên BCTC', data['short'], 'CLOSING_SHORT_REPORTED', date),
                  debt_amount(period, long_page, 'Vay dài hạn — số dư không ngắn hạn trên BCTC', data['long'], 'CLOSING_NONCURRENT_REPORTED', date)]
    if data['current'] is not None:
        components.extend([debt_amount(period, short_page, 'Vay ngắn hạn chưa gồm phần dài hạn đến hạn trả', data['shortExCurrent'], 'CLOSING_SHORT_EX_CURRENT', date),
                           debt_amount(period, short_page, 'Vay dài hạn đến hạn trả — số dư cuối kỳ', data['current'], 'CLOSING_CURRENT_PORTION', date),
                           debt_amount(period, long_page, 'Vay dài hạn trước trừ phần đến hạn trả', data['longGross'], 'CLOSING_LONG_GROSS_OF_CURRENT', date)])
    else:
        components.append(debt_amount(period, short_page, 'Vay dài hạn đến hạn trả — số dư cuối kỳ tách riêng', None, 'CLOSING_CURRENT_PORTION', date))
    movements = []
    for which, page in [('short', short_page), ('long', long_page)]:
        vals = data.get(which + 'Movement')
        if not vals:
            continue
        labels = ['Số dư đầu kỳ', 'Vay thêm', 'Phân loại lại trong kỳ', 'Hoàn trả', 'Chênh lệch quy đổi tiền tệ', 'Số dư cuối kỳ']
        if period == 'FY2024' and which == 'long':
            labels.remove('Hoàn trả')  # No repayment column in original table; do not fabricate a zero.
        entries = []
        for label, value in zip(labels, vals):
            matches = source_tokens(period, page, value) if value is not None else []
            assert matches or value is None, (period, which, label, value)
            entries.append({'label': label, 'value': typed(value), 'valueExact': value,
                            'displayValue': '—' if value is None else formatted(value),
                            'status': 'EXPLICIT_DASH_NOT_ZERO' if value is None else 'VISUALLY_CHECKED_SOURCE_COMPONENT',
                            'semantic': 'CLOSING_BALANCE' if label == 'Số dư cuối kỳ' else 'OPENING_BALANCE' if label == 'Số dư đầu kỳ' else 'PERIOD_MOVEMENT',
                            'sourceMatches': matches, 'unit': 'VND'})
        numeric = [Decimal(v) for v in vals[:-1] if v is not None]
        residual = Decimal(vals[-1]) - sum(numeric)
        assert residual == 0, (period, which, residual)
        movements.append({'label': 'Biến động vay ngắn hạn' if which == 'short' else 'Biến động vay dài hạn',
                          'sourcePage': page, 'columns': entries,
                          'numericReconciliation': {'sumKnownOpeningAndMovements': str(sum(numeric)), 'closing': vals[-1], 'residual': str(residual),
                                                    'dashTreatment': 'Preserved null; not asserted as a reported zero.'}})
    subtotal = str(int(data['short']) + int(data['long']))
    current = data['current']
    if presentation is not None:
        assert current is None
        assert presentation['status'] == 'INCLUDED_IN_SHORT_NOT_SEPARATELY_DISCLOSED'
        assert presentation['ticker'] == 'VNM' and presentation['periodEnd'] == date
        assert presentation['scope'] == 'CONSOLIDATED' and presentation['currency'] == 'VND'
        assert presentation['shortValue'] == data['short'] and presentation['longValue'] == data['long']
        assert presentation['sourceHash'] == source['sha256']
        assert hashlib.sha256((ROOT / presentation['sourcePath']).read_bytes()).hexdigest() == presentation['sourceHash']
        load(ROOT / presentation['evidenceReference'])
        assert PINS[presentation['evidenceReference']] == presentation['evidenceHash']
        body = {k: v for k, v in presentation.items() if k != 'bodyHash'}
        assert hashlib.sha256(json.dumps(body, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()).hexdigest() == presentation['bodyHash']
    if current is not None:
        assert int(data['shortExCurrent']) + int(current) == int(data['short'])
        assert int(data['longGross']) - int(current) == int(data['long'])
    return {'periodEnd': date, 'scope': 'CONSOLIDATED', 'unit': 'VND', 'source': {k: v for k, v in source.items() if k != 'sha256'},
            'note': '15. Vay', 'components': components, 'movements': movements,
            'reportedBorrowingSubtotal': {'value': int(subtotal), 'valueExact': subtotal,
                                         'displayValue': formatted(subtotal), 'formula': 'CLOSING_SHORT_REPORTED + CLOSING_NONCURRENT_REPORTED',
                                         'classification': 'DERIVED_REPORTED_SUBTOTAL_NOT_COMPREHENSIVE_DEBT',
                                         'currentPortionAddedAgain': False},
            'currentPortionReview': {'closingSeparateValue': typed(current), 'closingSeparateValueExact': current,
                                     'closingSplitStatus': 'RESOLVED' if current is not None else 'NOT_SEPARATELY_IDENTIFIABLE',
                                     'shortIncludesCurrentPortion': 'EXPLICIT_COMPONENT_SUM' if current is not None else 'AGGREGATED_PRESENTATION_RECLASSIFICATION_SHOWN',
                                     'movementIsNotClosingStock': True,
                                     'numericCurrentPortionAvailable': current is not None,
                                     'presentationConditionStatus': 'RESOLVED' if current is not None or presentation else 'STILL_BLOCKED',
                                     'presentationEvidence': presentation,
                                     'exactReceiptInputAvailable': current is not None or presentation is not None},
            'legacyFINANCIAL_DEBT': {'status': 'PARTIALLY_RESOLVED', 'qualifiedValue': None},
            'strictComprehensiveDebt': {'status': 'STILL_BLOCKED', 'qualifiedValue': None,
                                         'reason': 'Separate verified presence/absence proof for every financing class has not been established; no unknown class is replaced with zero.'},
            'reportedSourceComponents': 'RESOLVED',
            'reportedReceiptAssessment': 'SOURCE_COMPONENTS_AND_CURRENT_SPLIT_AVAILABLE_REVIEW_RECEIPT_NOT_CREATED' if current is not None else 'CURRENT_PORTION_PRESENTATION_RESOLVED_FULL_RECEIPT_NOT_CREATED' if presentation else 'BLOCKED_BY_EXACT_CLOSING_CURRENT_PORTION_INPUT',
            'LEVEL1_PROMOTION_CANDIDATE': False, 'productionAdmissible': False}


def search_financing():
    results = []
    patterns = {'CURRENT_PORTION': r'den han tra|phan no dai han den han', 'FINANCE_LEASE': r'thue tai chinh|finance lease', 'BOND': r'trai phieu|\bbond',
                'FINANCING_WORDING': r'vay|lai vay|chi phi di vay', 'OTHER_PAYABLE': r'phai tra khac',
                'OPERATING_LEASE': r'thue hoat dong', 'RELATED_PARTY': r'ben lien quan',
                'GUARANTEE_COMMITMENT': r'bao lanh|cam ket'}
    for period in DEBT:
        hits = collections.defaultdict(list)
        paths = sorted((RAW / 'raw' / period).glob('*.json'))
        for path in paths:
            raw = load(path)
            for i, obs in enumerate(raw['observations']):
                for kind, pattern in patterns.items():
                    if re.search(pattern, EXTRACT.normalized(obs['text'])):
                        hits[kind].append({'page': raw['physicalPage'], 'text': obs['text'], 'rawPath': rel(path), 'rawLocator': f'/observations/{i}'})
        results.append({'period': period, 'physicalPagesSearched': len(paths), 'hits': dict(hits),
                        'negativeSearchIsNotVerifiedAbsence': True})
    return results


def main():
    full = load(RAW / 'VNM.json')
    source_manifest = load(RAW / 'manifest.json')
    load(ROOT / 'src/domain/fundamentals/debt-contract-v2.json')
    load(ROOT / 'src/domain/fundamentals/manual-fundamental-evidence-requirements-v2.json')
    load(ROOT / 'src/domain/fundamentals/current-portion-presentation-v1.json')
    witness_path = ROOT / 'docs/fundamental-data-engine/evidence/2026-10-19-included-current-portion/VNM_CURRENT_PORTION_PRESENTATIONS.json'
    presentations = {p['periodEnd']: p for p in load(witness_path)['witnesses']} if witness_path.exists() else {}
    PINS['src/domain/fundamentals/debt-contract.ts'] = hashlib.sha256((ROOT / 'src/domain/fundamentals/debt-contract.ts').read_bytes()).hexdigest()
    mapped, reviews, inventory = {}, {}, []
    for key, period in full['reports']['thuyet-minh']['periods'].items():
        original = period['variants'][0]
        tag = original['source']['periodKey']
        groups = []
        counts = collections.Counter()
        for gi, group in enumerate(original['groups']):
            rows = []
            for ri, row in enumerate(group['rows']):
                cells = []
                for cell in row['cells']:
                    values = convert_cell(cell, tag, row['sourcePage'], row['rawPath'])
                    cells.extend(values)
                    counts.update(v['valueType'] for v in values)
                labels = [c['value'] for c in cells if c['valueType'] == 'TEXT']
                data_cells = [c for c in cells if c['valueType'] != 'TEXT']
                row_value = row['label'] if not data_cells else data_cells[0]['value'] if len(data_cells) == 1 else [c['value'] for c in data_cells]
                rows.append({'id': row['id'], 'label': ' '.join(labels) if labels else row['label'],
                             'value': row_value, 'valueType': 'TEXT' if not data_cells else 'MULTICOLUMN_VALUES' if len(data_cells) > 1 else data_cells[0]['valueType'],
                             'rawText': row['label'], 'sourcePage': row['sourcePage'], 'cells': cells,
                             'unitEvidence': row['pageUnitEvidence'], 'columnAssignment': 'UNREVIEWED_PRESERVE_SOURCE_HEADER_ROWS',
                             'reviewStatus': 'UNREVIEWED_OCR_EXCEPT_EXPLICIT_CORRECTIONS',
                             'originPointer': f'/reports/thuyet-minh/periods/{key}/variants/0/groups/{gi}/rows/{ri}'})
            groups.append({k: v for k, v in group.items() if k != 'rows'} | {'rows': rows})
        mapped[key] = {'periodType': period['periodType'], 'asOf': period['asOf'], 'variants': [
            {'id': original['id'] + '-readable-v1', 'reportingScope': 'CONSOLIDATED',
             'sourcePeriod': tag, 'sourceManifest': rel(RAW / 'manifest.json'), 'groups': groups}]}
        reviewed = debt_tables(tag, original['source'], presentations.get(original['source']['periodEnd']))
        reviews[key] = reviewed
        single = {'schemaVersion': 'vnm-readable-notes-v1', 'ticker': 'VNM', 'productionAdmissible': False,
                  'reports': {'thuyet-minh': {'periods': {key: mapped[key]}}}, 'reviewedBorrowingTables': reviewed}
        save(f'{tag}.json', single)
        inventory.append({'period': key, 'sourcePeriod': tag, 'rows': sum(len(g['rows']) for g in groups),
                          'cellTypes': dict(counts), 'file': rel(OUT / f'{tag}.json')})
    save('VNM.json', {'schemaVersion': 'vnm-readable-notes-v1', 'ticker': 'VNM', 'productionAdmissible': False,
                      'reports': {'thuyet-minh': {'periods': mapped}}, 'reviewedBorrowingTables': reviews})
    corrections = [{'sourcePeriod': k[0], 'physicalPage': k[1], 'rawLocator': k[2], **v,
                    'reviewBasis': 'Visual source PDF page inspection 2026-10-19; sealed raw unchanged.'} for k, v in CORRECTIONS.items()]
    save('OCR_CORRECTIONS.json', corrections)
    survey = search_financing()
    save('FINANCING_SOURCE_SURVEY.json', {'schemaVersion': 'vnm-financing-source-survey-v1', 'periods': survey,
                                        'surveyType': 'Full-page semantic search plus targeted visual inspection; not exhaustive semantic certification.',
                                        'operatingLeaseTreatment': 'Issuer-described operating commitments are not automatically finance leases or capitalized debt.',
                                        'miscellaneousLiabilityTreatment': 'Unknown financing content is retained unknown; not automatically debt or zero. Not a new Level1 requirement to prove all opaque payables contain zero financing.'})
    summary = []
    for key, review in reviews.items():
        missing = []
        if not review['currentPortionReview']['exactReceiptInputAvailable']:
            missing.append('Current portion is neither separately quantified nor supported by an approved included-in-short/noncurrent-long presentation witness.')
        missing.append('Comprehensive financing class proof is unqualified: no verified exhaustive presence/absence evidence for bonds, finance leases, other financing and applicable sector financing. This blocks comprehensive/legacy strict certification, not automatically the reported-debt alternative.')
        summary.append({'period': key, 'periodEnd': review['periodEnd'], 'scope': review['scope'],
                        'reportedSubtotal': review['reportedBorrowingSubtotal'], 'currentPortionReview': review['currentPortionReview'],
                        'status': 'PARTIALLY_RESOLVED', 'missing': missing,
                        'level1Boundary': 'Approved v2 allows REPORTED_BORROWINGS OR COMPREHENSIVE_FINANCIAL_DEBT. Exhaustive certification is not imposed on reported borrowing availability.',
                        'reportedReceiptAssessment': review['reportedReceiptAssessment']})
    review = {'ticker': 'VNM', 'reviewDate': '2026-10-19', 'overallStatus': 'PARTIALLY_RESOLVED',
              'currentPortionPresentationBlocker': 'RESOLVED' if all(r['currentPortionReview']['exactReceiptInputAvailable'] for r in reviews.values()) else 'STILL_BLOCKED',
              'sourceComponentsResolved': True, 'canonicalAdmissionPerformed': False,
              'legacyFinancialDebtAutomaticallyAliased': False, 'periods': summary,
              'qualification': {'QUALIFIED_FINANCIAL_DEBT': None, 'LEVEL1_PROMOTION_CANDIDATE': False,
                                'reportedReceiptCreated': False, 'comprehensiveProofCreated': False},
              'notMissingLevel1': ['normalized EBITDA', 'unrestricted cash', 'cycle-adjusted earnings', 'market price/volume'],
              'contractAuthority': ['src/domain/fundamentals/debt-contract-v2.json', 'src/domain/fundamentals/current-portion-presentation-v1.json', 'src/domain/fundamentals/debt-contract.ts', 'src/domain/fundamentals/manual-fundamental-evidence-requirements-v2.json'],
              'importantDistinction': 'The approved included-current presentation resolves the separate-amount prerequisite for reported debt; it does not establish exhaustive financing or perform admission.'}
    save('FINANCIAL_DEBT_REVIEW.json', review)
    save('manifest.json', {'schemaVersion': 'vnm-readable-notes-index-v1', 'ticker': 'VNM', 'productionAdmissible': False,
                           'rawManifest': rel(RAW / 'manifest.json'), 'periods': inventory,
                           'numericPolicy': 'Safe integers: JSON number + valueExact string; fractional/large numbers: exact string; never binary float conversion. Original decimal strings remain in sealed source.',
                           'textPolicy': 'Narrative value is text; table values are typed scalars with original text and coordinates. Unreviewed columns are not guessed.',
                           'correctionLedger': rel(OUT / 'OCR_CORRECTIONS.json'), 'debtReview': rel(OUT / 'FINANCIAL_DEBT_REVIEW.json')})
    save('provenance.json', {'inputSha256': PINS, 'sourcePdfSha256': {d['period']: d['document']['sha256'] for d in source_manifest['documents']},
                            'rawInput': rel(RAW / 'VNM.json'), 'sourcePointers': 'Cells carry rawPath/rawLocator/characterSpan/bbox; readable rows carry originPointer in rawInput.',
                            'visualReviewScope': 'Note15 for all 5 reports; liability balance sheets and notes17/18 plus annual operating commitments for FY2024/FY2025; notes17/18 for6M2026. All other OCR rows remain unreviewed.'})
    # Human-readable debt summary and selected typed cells.
    md = '# VNM — thuyết minh dễ đọc và kiểm tra nợ vay\n\n'
    md += 'JSON: `VNM.json`; bảng vay đã đối chiếu nằm ở `reviewedBorrowingTables`. Mọi số tiền trong bảng dưới là VND.\n\n'
    md += '| Kỳ | Vay ngắn hạn | Vay dài hạn không ngắn hạn | Tổng vay theo BCTC | Phần đến hạn trả cuối kỳ tách riêng |\n|---|---:|---:|---:|---:|\n'
    for key, r in reviews.items():
        c = r['components']
        cp = r['currentPortionReview']['closingSeparateValueExact']
        md += f"| {key} | {c[0]['displayValue']} | {c[1]['displayValue']} | {r['reportedBorrowingSubtotal']['displayValue']} | {formatted(cp) if cp is not None else 'Chưa tách được từ bảng đã xem'} |\n"
    md += '\n**Kết luận: PARTIALLY_RESOLVED.** Đã có số dư và tổng vay báo cáo cho cả 5 kỳ; chưa xác nhận tổng này là FINANCIAL_DEBT đầy đủ.\n\n'
    md += 'FY2022/FY2023 có dòng vay dài hạn đến hạn trả, được tính một lần trong vay ngắn hạn và trừ khỏi vay dài hạn gộp. FY2024/FY2025/6M2026 trình bày gộp, có chuyển phân loại đối ứng nhưng không tách số dư current portion cuối kỳ. Không lấy 183.157.263.872 / 20.750.493.750 / 10.401.978.750 đồng chuyển trong kỳ để thay số dư cuối kỳ.\n\n'
    md += 'Đã áp dụng quy tắc chủ sở hữu cho phép ngày 19/10/2026: currentPortion giữ null khi đã có chứng cứ xác nhận bao gồm trong vay ngắn hạn và loại khỏi vay dài hạn không ngắn hạn. Ba kỳ trình bày gộp đã có presentation witness, do đó điều kiện current portion cho reported receipt đã RESOLVED. Không tạo số 0, không cộng/trừ khoản chưa biết. Các điều kiện full receipt, phạm vi tài trợ và admission vẫn độc lập. Hợp đồng v2 cho phép REPORTED_BORROWINGS hoặc COMPREHENSIVE_FINANCIAL_DEBT; không đặt yêu cầu comprehensive lên reported alternative.\n\n'
    md += 'Đối với comprehensive/legacy strict, chưa có chứng cứ riêng xác nhận đầy đủ từng lớp tài trợ. Tìm kiếm không thấy một nhãn không chứng minh số dư bằng 0. Cam kết thuê hoạt động được báo cáo không tự chuyển thành nợ thuê tài chính. Các khoản phải trả/chi phí khác không tự cộng thành nợ vay.\n\n'
    md += 'Đã sửa có lưu vết 2 ô OCR FY2025 trang PDF50: Chi phí lãi vay 68.472.984.360; Chi phí thuê kệ trưng bày 52.063.370.805. Đây là số đọc trực tiếp từ ảnh, không tự cộng vào vay báo cáo. Raw OCR được giữ nguyên.\n\n'
    md += 'Các cột/nhãn OCR chưa duyệt giữ trạng thái ứng viên. Không cập nhật canonical, blocker, Policy B hoặc scoreability; không chạy scoring.\n'
    (OUT / 'README.md').write_text(md)
    pins = {rel(p): hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(OUT.iterdir()) if p.name != 'ARTIFACT_HASHES.json'}
    pins['scripts/build-vnm-readable-notes.py'] = hashlib.sha256(pathlib.Path(__file__).read_bytes()).hexdigest()
    save('ARTIFACT_HASHES.json', {'algorithm': 'SHA-256', 'selfExcluded': True, 'files': pins})
    print(json.dumps({'periods': inventory, 'overallFinancialDebtStatus': 'PARTIALLY_RESOLVED', 'output': rel(OUT)}, ensure_ascii=False))


if __name__ == '__main__':
    main()
