"""VNM FY2025 pilot: inline values, caption-based crosswalk, separate hash ledger.

No source captures, corpus display files or accounting records are overwritten.
Numeric agreement is observational; CafeF amount units/scope remain undeclared.
"""
import hashlib
import json
import pathlib
import re
import sys
import unicodedata
from collections import Counter
from decimal import Decimal

sys.path.insert(0, str(pathlib.Path(__file__).parent / 'lib'))
from manual_display import normalize_number

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / 'data/comparisons/VNM/FY2025'
PDF = 'data/manual-fundamentals/VNM/VNM_Baocaotaichinh_2025_Kiemtoan_Hopnhat.pdf'
TRANSCRIPT = 'docs/fundamental-data-engine/VNM_FY2025_PDF_TRANSCRIPTION.txt'
MANUAL = 'data/manual-extracted/display-v1/VNM.json'
CAFEF = 'data/providers/cafef/display-v1/VNM.json'
INPUTS = 'docs/fundamental-data-engine/VNM_FY2025_COMPARISON_INPUTS.json'
REPORTS = {'can-doi-ke-toan':'Cân đối kế toán', 'ket-qua-kinh-doanh':'Kết quả kinh doanh', 'luu-chuyen-tien-te':'Lưu chuyển tiền tệ'}
GROUPS = {'tai-san':'Tài sản', 'nguon-von':'Nguồn vốn', 'ket-qua-kinh-doanh':'Kết quả kinh doanh',
          'hoat-dong-kinh-doanh':'Hoạt động kinh doanh', 'hoat-dong-dau-tu':'Hoạt động đầu tư',
          'hoat-dong-tai-chinh':'Hoạt động tài chính và biến động tiền'}


def read(path):
    return json.loads((ROOT / path).read_text())


def sha(path):
    return hashlib.sha256((ROOT / path).read_bytes()).hexdigest()


def slug(text):
    text = ''.join(c for c in unicodedata.normalize('NFD', text.lower().replace('đ','d')) if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9]+', '-', text).strip('-')


def report_for(page):
    return 'can-doi-ke-toan' if page < 10 else 'ket-qua-kinh-doanh' if page < 12 else 'luu-chuyen-tien-te'


def group_for(page, code):
    if page < 10:
        return 'nguon-von' if page == 9 else 'tai-san'
    if page < 12:
        return 'ket-qua-kinh-doanh'
    if page == 12:
        return 'hoat-dong-kinh-doanh'
    return 'hoat-dong-dau-tu' if page == 13 and int(code) <= 30 else 'hoat-dong-tai-chinh'


def provider_mapping(report, code):
    """Explicit caption/code crosswalk, NEVER matching on equal amounts."""
    if report == 'can-doi-ke-toan':
        return {'136':'135', '137':'136', '216':'215'}.get(code, code)
    if report == 'ket-qua-kinh-doanh':
        return {'01':'1', '02':'2', '21':'22', '22':'23', '23':'24', '24':'27'}.get(code, code)
    return {
        '01':'HDKD_2', '02a':'HDKD_4', '02b':None, '03':'HDKD_5', '04':'HDKD_6',
        '05a':'HDKD_7', '05b':None, '06':'HDKD_8', '08':'HDKD_10', '09':'HDKD_11',
        '10':'HDKD_12', '11':'HDKD_13', '12':'HDKD_14', '14':'HDKD_16', '15':'HDKD_17', '17':'HDKD_19', '20':'HDKD_20',
        '21':'HDDT_22', '22':'HDDT_23', '23':'HDDT_24', '24':'HDDT_25', '25':'HDDT_26', '26':'HDDT_27',
        '27':'HDDT_28', '30':'HDDT_29', '31':'HDTC_37', '33':'HDTC_33', '34':'HDTC_34', '36':'HDTC_36', '40':'HDTC_38',
        '50':'HDTC_39', '60':'HDTC_40', '61':None, '62':None, '70':'HDTC_42',
    }[code]


def shape(provider):
    return {'schemaVersion':'readable-financial-report-v1', 'ticker':'VNM', 'period':'2025', 'provider':provider,
            'selection':'FY2025 annual current-year column only; named source chosen explicitly',
            'productionAdmissible':False, 'provenanceFile':'provenance.json',
            'reports':{k:{'label':v, 'periods':{'2025':{'groups':{}}}} for k,v in REPORTS.items()}}


def put(document, report, group, key, row):
    groups = document['reports'][report]['periods']['2025']['groups']
    items = groups.setdefault(group, {'label':GROUPS[group], 'items':{}})['items']
    assert key not in items, ('DUPLICATE_READABLE_KEY', report, group, key)
    items[key] = row


def flat(document):
    return {(report, group, key):row for report,r in document['reports'].items()
            for group,g in r['periods']['2025']['groups'].items() for key,row in g['items'].items()}


def compare_values(pdf_value, provider_value, pdf_status):
    if pdf_status == 'DASH':
        return ('DASH_VS_ZERO' if provider_value is not None and Decimal(provider_value) == 0 else 'MISSING_OR_NONNUMERIC'), None
    if pdf_value is None or provider_value is None:
        return 'MISSING_OR_NONNUMERIC', None
    delta = Decimal(pdf_value)-Decimal(provider_value)
    return ('MATCH_VALUE_OBSERVED' if delta == 0 else 'DIFFERENT_VALUE_OBSERVED'), format(delta, 'f')


def build():
    for path, expected in read(INPUTS)['files'].items():
        assert sha(path) == expected, 'PINNED_PILOT_INPUT_CHANGED: '+path
    original_manual, original_cafef = read(MANUAL), read(CAFEF)
    manual, cafef = shape('PDF'), shape('CAFEF')
    manual['sourceFile'] = PDF
    manual['scope'] = 'CONSOLIDATED'
    manual['amountUnit'] = 'VND'
    manual['checkStatus'] = 'SOURCE_IMAGES_CHECKED_BY_ASSISTANT_FOR_THIS_PILOT_ONLY'
    cafef['sourceFile'] = CAFEF
    cafef['scope'] = None
    cafef['amountUnit'] = None
    cafef['unitStatus'] = 'PROVIDER_UNDECLARED'
    provenance = {'schemaVersion':'vnm-fy2025-readable-provenance-v1', 'files':{
        p:{'sha256':sha(p)} for p in [PDF, TRANSCRIPT, MANUAL, CAFEF, INPUTS]}, 'pdfRows':{}, 'cafefRows':{},
        'excludedPresentationDuplicates':[{'pdfPage':11, 'code':'60', 'reason':'Carry-forward of profit after tax from page 10, not a second economic fact.'}]}
    selected = {}
    for report in REPORTS:
        variants = original_manual['reports'][report]['periods']['2025']['variants']
        matches = [v for v in variants if v['source']['retainedPath'] == PDF and v['reportingScope'] == 'CONSOLIDATED']
        assert len(matches) == 1, 'EXPLICIT_PDF_SELECTION_AMBIGUOUS'
        selected[report] = matches[0]
        assert matches[0]['source']['payloadHash'] == sha(PDF), 'PDF_HASH_CHANGED'
    old_by_page = {g['sourcePage']:[r for r in g['rows'] if not (g['sourcePage']==11 and r['code']=='60')]
                   for variant in selected.values() for g in variant['groups']}
    page_positions, crosswalk, by_pdf_code, extraction_changes = Counter(), {}, {}, []
    for line in (ROOT / TRANSCRIPT).read_text().splitlines():
        if not line or line.startswith('#'):
            continue
        p, code, label, lexical = line.split('|')
        page = int(p)
        report, group, key = report_for(page), group_for(page, code), slug(label)
        value, status = normalize_number(lexical)
        old_index = page_positions[page]
        old = old_by_page[page][old_index]
        page_positions[page] += 1
        printed_code = code[:-1] if report == 'luu-chuyen-tien-te' and code in {'02a','02b','05a','05b'} else code
        ref = f'PDF/{report}/{group}/{key}'
        row = {'label':label, 'value':value, 'unit':'VND_PER_SHARE' if report=='ket-qua-kinh-doanh' and code=='70' else 'VND',
               'status':status, 'sourceCode':printed_code, 'sourceOccurrenceKey':code, 'sourcePage':page,
               'lexicalValue':lexical, 'originRef':ref}
        put(manual, report, group, key, row)
        by_pdf_code[(report, code)] = (group, key, row)
        provider_code = provider_mapping(report, code)
        if provider_code is not None:
            assert (report, provider_code) not in crosswalk
            crosswalk[(report, provider_code)] = (group, key, label)
        provenance['pdfRows'][ref] = {'pdf':PDF, 'pdfPage':page, 'printedPage':page-1,
                                    'sourceColumn':'31/12/2025' if page<10 else '2025',
                                    'priorExtractionRow':old['id'], 'cellEvidence':old['cellEvidence'],
                                    'transcriptionLine':line, 'basis':'SOURCE_IMAGE_CHECKED_PILOT_TRANSCRIPTION'}
        if old['value'] != value or old['code'] != printed_code or old['label'] != label:
            extraction_changes.append({'report':report, 'key':key, 'page':page,
                                       'old':{k:old[k] for k in ['code','label','value','status']},
                                       'pilot':{k:row[k] for k in ['sourceCode','label','value','status']}})
    assert all(page_positions[p] == len(rows) for p,rows in old_by_page.items()), 'TRANSCRIPTION_COVERAGE'

    aggregates = [
        {'key':'cac-dieu-chinh-khac', 'label':'Các điều chỉnh khác', 'providerCode':'HDKD_9', 'group':'hoat-dong-kinh-doanh',
         'operands':['02b','05b'], 'note':'CafeF gộp phân bổ lợi thế thương mại và điều chỉnh lỗ/lãi công ty liên kết trong mẫu này.'},
        {'key':'anh-huong-ty-gia-va-quy-doi-tien-te', 'label':'Ảnh hưởng tỷ giá và quy đổi tiền tệ', 'providerCode':'HDTC_41',
         'group':'hoat-dong-tai-chinh', 'operands':['61','62'], 'note':'PDF tách ảnh hưởng tỷ giá và chênh lệch quy đổi; đối chiếu tổng hai dòng, không đổi hai dòng gốc.'},
    ]
    for aggregate in aggregates:
        crosswalk[('luu-chuyen-tien-te', aggregate['providerCode'])] = (aggregate['group'], aggregate['key'], aggregate['label'])
    selected_cafef = {}
    for report in REPORTS:
        variants = [v for v in original_cafef['reports'][report]['periods']['2025']['variants'] if v['requestMode']=='NAM' and not v['modeMismatch']]
        assert len(variants)==1, 'EXPLICIT_CAFEF_SELECTION_AMBIGUOUS'
        selected_cafef[report] = variants[0]
        assert variants[0]['source']['providerUnit'] is None, 'REVIEW_UNIT_MAPPING_IF_PROVIDER_CHANGED'
        raw_path = variants[0]['source']['rawPayloadLocation']
        assert sha(raw_path) == variants[0]['source']['payloadHash'], 'CAFEF_RAW_HASH_CHANGED'
        provenance['files'][raw_path] = {'sha256':sha(raw_path), 'retrievedAt':variants[0]['source']['retrievedAt']}
        for g in variants[0]['groups']:
            for source in g['rows']:
                mapped = crosswalk.get((report, source['code']))
                group = {'TN':'tai-san', 'NV':'nguon-von', '__ungrouped':'ket-qua-kinh-doanh', 'HDKD':'hoat-dong-kinh-doanh',
                         'HDDT':'hoat-dong-dau-tu', 'HDTC':'hoat-dong-tai-chinh'}[g['id']]
                if mapped:
                    target_group, key, label = mapped
                    assert group==target_group
                else:
                    label = source['label']
                    key = 'cafef-only-'+slug(label)+'-'+(source['code'] or 'heading')
                ref = f'CAFEF/{report}/{group}/{key}'
                row = {'label':label, 'sourceLabel':source['label'], 'sourceCode':source['code'], 'value':source['value'],
                       'unit':'VND_PER_SHARE' if report=='ket-qua-kinh-doanh' and source['static'] and 'cổ phiếu' in source['label'] else None,
                       'status':source['status'], 'kind':'HEADING' if not source['code'] else 'DATA',
                       'keyBasis':'EXPLICIT_CAPTION_CROSSWALK' if mapped else 'PROVIDER_CAPTION', 'originRef':ref}
                put(cafef, report, group, key, row)
                provenance['cafefRows'][ref] = {'rawPayloadPath':raw_path, 'rawLocator':source['rawLocator'],
                                              'providerGroupLabel':g['label'], 'templateLabel':source['label']}

    rows = []
    manual_flat, cafef_flat = flat(manual), flat(cafef)
    used = set()
    operand_codes = {code for aggregate in aggregates for code in aggregate['operands']}
    for (report,group,key), pdf_row in manual_flat.items():
        cf = cafef_flat.get((report,group,key))
        status, delta = compare_values(pdf_row['value'], cf['value'], pdf_row['status']) if cf else ('PDF_COMPONENT_OF_AGGREGATE' if report=='luu-chuyen-tien-te' and pdf_row['sourceOccurrenceKey'] in operand_codes else 'PDF_ONLY', None)
        notes = []
        if cf:
            used.add((report,group,key))
        if report=='luu-chuyen-tien-te' and pdf_row['sourceOccurrenceKey'] in {'23','24'}:
            notes.append('BROADER_PROVIDER_CATEGORY: tiền gửi có kỳ hạn trong PDF so với khoản cho vay/công cụ nợ trong template CafeF; cần xét phân loại.')
        if report=='can-doi-ke-toan' and pdf_row['sourceCode'] in {'400','410','440'}:
            notes.append('BASIS_REVIEW: chênh lệch bằng lợi ích cổ đông không kiểm soát; không coi phạm vi sở hữu đã tương đồng.')
        rows.append({'report':report,'group':group,'key':key,'label':pdf_row['label'], 'pdf':pdf_row,'cafef':cf,
                     'status':status,'rawDeltaPdfMinusCafeF':delta, 'notes':notes,
                     'strictDimensionsVerified':bool(cf and cf['unit']==pdf_row['unit'] and cafef['scope']==manual['scope'])})
    for aggregate in aggregates:
        report = 'luu-chuyen-tien-te'
        operands = [by_pdf_code[(report,code)][2] for code in aggregate['operands']]
        value = format(sum((Decimal(row['value']) for row in operands), Decimal(0)), 'f')
        cf = cafef_flat[(report,aggregate['group'],aggregate['key'])]
        status, delta = compare_values(value, cf['value'], 'VALUE')
        used.add((report,aggregate['group'],aggregate['key']))
        rows.append({'report':report,'group':aggregate['group'],'key':aggregate['key'],'label':aggregate['label'],
                     'pdf':{'value':value,'unit':'VND','kind':'EXPLICIT_DISPLAY_AGGREGATE','formula':' + '.join(r['originRef'] for r in operands),'operands':operands},
                     'cafef':cf, 'status':'AGGREGATED_MATCH_OBSERVED' if delta=='0' else status,
                     'rawDeltaPdfMinusCafeF':delta, 'notes':[aggregate['note']], 'strictDimensionsVerified':False})
    remaining = [{'report':r, 'group':g, 'key':k, **row} for (r,g,k),row in cafef_flat.items() if (r,g,k) not in used]
    comparison = {'schemaVersion':'vnm-readable-comparison-v1','ticker':'VNM','period':'2025','productionAdmissible':False,
                  'comparisonBasis':'Compare explicit FY2025 captions/crosswalk and raw decimal strings. Never select mappings because values happen to match.',
                  'limitations':['CafeF API payloads do not declare monetary unit or consolidation scope. Numeric matches are observations, not fully certified accounting equivalence.',
                                 'Saved CafeF captures from 2026-10-13; no new fetch and no claim about the current live website.',
                                 'PDF pilot source-image checking does not promote the full-corpus OCR dataset or production accounting facts.'],
                  'summary':dict(Counter(row['status'] for row in rows)), 'items':{}, 'cafefOnlyRows':remaining,
                  'extractionChanges':extraction_changes,
                  'extractionValueChanges':[c for c in extraction_changes if c['old']['value'] != c['pilot']['value']]}
    for row in rows:
        comparison['items'].setdefault(row['report'],{}).setdefault('2025',{})[row['key']] = row
    structure = {'sameOuterHierarchy':True,'rawHierarchy':['reports','periods','variants','groups','rows'],
                 'rawReportKeys':{'pdf':list(original_manual['reports']), 'cafef':list(original_cafef['reports'])},
                 'pilotHierarchy':['reports','periods','groups','items'],
                 'pilotSimplification':'One explicitly selected annual variant; keys are readable captions, actual values inline; hashes only in provenance.json.',
                 'differences':['PDF groups follow pages; CafeF groups follow provider sections.',
                                'Source codes are not universal semantic identifiers; caption-aware crosswalk is required.',
                                'PDF contains opening balances and notes; CafeF has a separate summary report and many zero-valued template rows.',
                                'Some PDF lines must be aggregated to compare with provider lines; missing/dash is distinct from zero.',
                                'CafeF unit and consolidation scope are undeclared; identical values alone cannot certify dimensional equivalence.'], 'reports':[]}
    for report in REPORTS:
        mv, cv = selected[report], selected_cafef[report]
        structure['reports'].append({'key':report,'pdfRawGroups':len(mv['groups']), 'cafefRawGroups':len(cv['groups']),
                                     'pdfRawRows':sum(len(g['rows']) for g in mv['groups']),
                                     'pdfPilotRows':sum(r==report for r,g,k in manual_flat),
                                     'cafefRawRows':sum(len(g['rows']) for g in cv['groups'])})
    def fields(left,right):
        return {'shared':sorted(left & right),'pdfOnly':sorted(left-right),'cafefOnly':sorted(right-left)}
    structure['fieldComparison'] = {'root':fields(set(original_manual),set(original_cafef)),
        'variants':fields(set().union(*(set(v) for v in selected.values())),set().union(*(set(v) for v in selected_cafef.values()))),
        'rows':fields(set().union(*(set(row) for v in selected.values() for g in v['groups'] for row in g['rows'])),
                      set().union(*(set(row) for v in selected_cafef.values() for g in v['groups'] for row in g['rows'])))}
    return manual, cafef, comparison, provenance, structure


def format_value(value):
    return '—' if value is None else format(Decimal(value), ',f').replace(',', '.')


def main():
    manual,cafef,comparison,provenance,structure = build()
    OUT.mkdir(parents=True,exist_ok=True)
    for name,data in [('manual.json',manual),('cafef.json',cafef),('comparison.json',comparison),('provenance.json',provenance),('structure.json',structure)]:
        (OUT/name).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
    values = {'ticker':'VNM', 'year':2025, 'pdfAmountUnit':'VND', 'cafefAmountUnit':None,
              'note':'Raw value comparison; CafeF monetary unit/scope undeclared. EPS uses VND_PER_SHARE. Details/formulas in comparison.json; hashes in provenance.json.',
              'reports':{}}
    for report,periods in comparison['items'].items():
        items = values['reports'].setdefault(report,{}).setdefault('2025',{})
        for key,row in periods['2025'].items():
            items[key] = {'label':row['label'],'pdf':row['pdf']['value'],
                          'cafef':row['cafef']['value'] if row['cafef'] else None,
                          'difference':row['rawDeltaPdfMinusCafeF'], 'status':row['status'],
                          'pdfUnit':row['pdf']['unit'], 'pdfComputed':row['pdf'].get('kind')=='EXPLICIT_DISPLAY_AGGREGATE'}
    for row in comparison['cafefOnlyRows']:
        values['reports'][row['report']]['2025'][row['key']] = {
            'label':row['sourceLabel'], 'pdf':None,'cafef':row['value'],'difference':None,'status':'CAFEF_ONLY',
            'cafefKind':row['kind']}
    (OUT/'values.json').write_text(json.dumps(values,ensure_ascii=False,indent=2)+'\n')
    summary = comparison['summary']
    lines = ['# VNM — đối chiếu PDF và CafeF, năm 2025','',
             'Mở [values.json](values.json) để xem ngay `pdf`, `cafef`, `difference` dưới từng chỉ tiêu. Hai nguồn riêng ở [manual.json](manual.json) và [cafef.json](cafef.json), cùng schema và cùng khóa chỉ tiêu được mapping rõ ràng. Hash tách sang [provenance.json](provenance.json).', '',
             'Đây là phép so sánh giá trị thô trong bản CafeF đã lưu ngày 13/10/2026 với cột 2025 của BCTC hợp nhất kiểm toán. API không khai báo đơn vị tiền và phạm vi hợp nhất; khớp số chưa chứng minh hai nguồn có cùng mọi chiều kế toán. Không sửa payload CafeF, bộ OCR toàn kho hoặc dữ liệu kế toán chính thức.', '',
             '## Cấu trúc','', '| Báo cáo | Nhóm PDF gốc / CafeF | Dòng PDF gốc / pilot / CafeF |','|---|---:|---:|']
    lines += [f"| {REPORTS[r['key']]} | {r['pdfRawGroups']} / {r['cafefRawGroups']} | {r['pdfRawRows']} / {r['pdfPilotRows']} / {r['cafefRawRows']} |" for r in structure['reports']]
    lines += ['', 'Khung gốc cùng `reports → periods → variants → groups → rows`, nhưng nội dung chưa ghép trực tiếp được theo mã. Pilot chọn đúng một năm/một bản báo cáo, dùng `groups → items` với khóa có nghĩa. Nhãn CafeF gốc được giữ trong `sourceLabel`; `label` là tên chung của crosswalk.', '',
              '## Kết quả','',*['- '+status+': '+str(count) for status,count in summary.items()],
              '',f"Có {len(comparison['cafefOnlyRows'])} dòng CafeF chưa ghép với dòng PDF riêng lẻ (kể cả tiêu đề/ô mẫu bằng 0). Không tự lấp dòng PDF vắng mặt bằng 0.", '',
              'Khác biệt đáng chú ý: doanh thu tài chính/chi phí tài chính/lãi vay/công ty liên kết có lệch nhãn-mã giữa template CafeF và PDF; tổng tài sản chênh 30.000.000; chênh vốn chủ sở hữu bằng lợi ích cổ đông không kiểm soát, cần xét cơ sở trình bày. Một số dòng tiền được CafeF gộp, nên phải so tổng có công thức. Những quan sát này không xác định nguyên nhân phía nhà cung cấp.', '',
              '## Chi tiết','', '| Báo cáo / chỉ tiêu | Mã PDF / CafeF | PDF (nguyên đơn vị) | CafeF (giá trị thô) | Chênh PDF − CafeF | Kết quả |', '|---|---|---:|---:|---:|---|']
    for report,periods in comparison['items'].items():
        for row in periods['2025'].values():
            pdf,cf = row['pdf'],row['cafef']
            lines.append(f"| {REPORTS[report]} / {row['label']} | {pdf.get('sourceCode','Tổng có công thức')} / {cf['sourceCode'] if cf else '—'} | {format_value(pdf['value'])} | {format_value(cf['value']) if cf else '—'} | {format_value(row['rawDeltaPdfMinusCafeF'])} | {row['status']} |")
    lines += ['', '## Kiểm tra và truy vết','',
              'PDF được xem trực tiếp tại các trang vật lý 7–14. [Bản chép có giá trị rõ ràng](../../../../docs/fundamental-data-engine/VNM_FY2025_PDF_TRANSCRIPTION.txt) giữ dấu gạch, số âm và dòng trùng mã. Dòng lợi nhuận sau thuế mang sang trang 11 là dòng lặp trình bày, đã loại khỏi số dòng pilot.', '',
              f"Số ô được bổ sung/sửa giá trị so với OCR ban đầu: {len(comparison['extractionValueChanges'])}. Chi tiết ở `extractionValueChanges` trong [comparison.json](comparison.json). Các thay đổi nhãn/mã được ghi riêng, không ghi đè bản trích xuất trước.", '',
              'Dùng [structure.json](structure.json) để kiểm tra khác biệt schema; [comparison.json](comparison.json) chứa toàn bộ cặp giá trị, công thức gộp, dòng chưa ghép và ghi chú. Đơn vị EPS là đồng/cổ phiếu, tách khỏi các khoản tiền.']
    (OUT/'report.md').write_text('\n'.join(lines)+'\n')
    print(json.dumps({'output':str(OUT.relative_to(ROOT)), 'manualRows':len(flat(manual)), 'cafefRows':len(flat(cafef)),
                      'summary':summary,'valueCorrections':comparison['extractionValueChanges']},ensure_ascii=False))


if __name__ == '__main__':
    main()
