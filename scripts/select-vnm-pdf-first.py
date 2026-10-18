"""Apply the user's source rule and publish a review list for one explicitly selected VNM year."""
import hashlib
import json
import pathlib
import sys
from collections import Counter
from decimal import Decimal

sys.path.insert(0,str(pathlib.Path(__file__).parent/'lib'))
from report_source_priority import POLICY, choose

ROOT = pathlib.Path(__file__).resolve().parents[1]


def formatted(value):
    return '—' if value is None else format(Decimal(value),',f').replace(',','.')


def main(year="2025"):
    YEAR = str(year)
    BASE = ROOT/f"data/comparisons/VNM/FY{YEAR}"
    comparison = json.loads((BASE/'comparison.json').read_text())
    manual = json.loads((BASE/'manual.json').read_text())
    original_pdf = [r for report in manual['reports'].values() for group in report['periods'][YEAR]['groups'].values() for r in group['items'].values()]
    decisions, excluded = [], []
    previous_review = json.loads((BASE/'review-pdf-first.json').read_text()) if (BASE/'review-pdf-first.json').exists() else {}
    previous_ids = {(r['report'],r['key']):r['reviewId'] for r in previous_review.get('items',[])}
    previous_ids.update({(r['report'],r['key']):r['reviewId'] for r in previous_review.get('excluded',[]) if r.get('reviewId')})
    for report,periods in comparison['items'].items():
        for key,row in periods[YEAR].items():
            pdf = {**row['pdf'],'concept':key,'period':YEAR,'scope':'CONSOLIDATED'}
            if pdf.get('kind')=='EXPLICIT_DISPLAY_AGGREGATE':
                pdf['status']='VALUE'
                pdf['operands']=[{**operand,'period':YEAR,'scope':'CONSOLIDATED'} for operand in pdf['operands']]
            cf = {**row['cafef'],'concept':key,'period':YEAR,'scope':None} if row['cafef'] else None
            decision = choose([pdf],[cf] if cf else [],{'concept':key,'period':YEAR,'scope':'CONSOLIDATED','unit':pdf['unit']})
            decisions.append({'report':report,'group':row['group'],'key':key,'label':row['label'],**decision,
                              'pdfValue':pdf['value'],'cafefValue':cf['value'] if cf else None,
                              'pdfPage':pdf.get('sourcePage'),'pdfCode':pdf.get('sourceCode'),
                              'cafefCode':cf.get('sourceCode') if cf else None,
                              'cafefLabel':cf.get('sourceLabel') if cf else None,
                              'formula':pdf.get('formula'),'notes':row['notes'], 'reviewDecision':'PENDING' if decision['needsReview'] else 'NOT_REQUESTED'})
    for row in comparison['cafefOnlyRows']:
        if row['kind']=='HEADING':
            excluded.append({'report':row['report'],'label':row['sourceLabel'],'reason':'PROVIDER_HEADING_NOT_FINANCIAL_VALUE'})
            continue
        cf = {**row,'concept':row['key'],'period':YEAR,'scope':None}
        decision = choose([],[cf],{'concept':row['key'],'period':YEAR,'scope':'CONSOLIDATED'})
        # User-authorized exclusion of nonzero fallback references only.
        # This does not establish a concept mapping or change either source.
        same_value = [{'label':r['label'],'page':r['sourcePage'],'code':r['sourceCode']} for r in original_pdf
                      if row['value'] not in [None,'0'] and r['value'] is not None and Decimal(r['value'])==Decimal(row['value'])]
        if same_value and POLICY['excludeNonzeroCafeFFallbackMatchingOtherPdfCaption']:
            excluded.append({'report':row['report'],'key':row['key'],'label':row['sourceLabel'],
                             'cafefCode':row['sourceCode'],'cafefValue':row['value'],
                             'reviewId':previous_ids.get((row['report'],row['key'])),
                             'reason':POLICY['duplicateExclusionReason'],
                             'matchingPdfRows':same_value,'status':'EXCLUDED_BY_USER_RULE',
                             'value':None,'productionAdmissible':False})
            continue
        decisions.append({'report':row['report'],'group':row['group'],'key':row['key'],'label':row['sourceLabel'],**decision,
                          'pdfValue':None,'cafefValue':row['value'],'pdfPage':None,'pdfCode':None,
                          'cafefCode':row['sourceCode'],'cafefLabel':row['sourceLabel'],
                          'sameAmountDiagnosticOnly':same_value,'notes':[], 'reviewDecision':'PENDING'})
    counts = dict(Counter(r['source'] for r in decisions))
    review = [r for r in decisions if r['needsReview']]
    review.sort(key=lambda r:(0 if r['source']=='CAFEF_REFERENCE' and r['value'] not in [None,'0'] else 1 if 'PDF_CAFEF_VALUE_DIFFERENCE' in r['reviewReasons'] else 2 if r['source']=='CAFEF_REFERENCE' else 3,r['report'],r['key']))
    used_ids = set(previous_ids.values())
    next_id = max([int(x.rsplit('-',1)[1]) for x in used_ids] or [0])+1
    assigned_ids = set()
    for row in review:
        identity=(row['report'],row['key'])
        if identity in previous_ids and previous_ids[identity] not in assigned_ids:
            row['reviewId']=previous_ids[identity]
        else:
            row['reviewId']=f'VNM-{YEAR}-{next_id:03}'
            next_id+=1
        assigned_ids.add(row['reviewId'])
    selected = {'schemaVersion':'pdf-first-readable-selection-v1','ticker':'VNM','year':int(YEAR),
                'policy':POLICY,'status':'SELECTION_WITH_REFERENCE_REVIEW_PENDING','productionAdmissible':False,
                'scopeNote':f'Only the checked FY{YEAR} primary statement tables. Missing here does not prove absence elsewhere in the PDF notes.',
                'summary':{'selected':len(decisions),'bySource':counts,'needsReview':len(review),'excludedHeadings':sum(r['reason']=='PROVIDER_HEADING_NOT_FINANCIAL_VALUE' for r in excluded),'excludedCafeFDuplicates':sum(r['reason']==POLICY['duplicateExclusionReason'] for r in excluded)}, 'reports':{}}
    for row in decisions:
        selected['reports'].setdefault(row['report'],{}).setdefault(YEAR,{})[row['key']]=row
    review_file = {'schemaVersion':'pdf-first-review-list-v1','ticker':'VNM','year':int(YEAR),'policyVersion':POLICY['version'],
                   'inputSha256':{name:hashlib.sha256((BASE/name).read_bytes()).hexdigest() for name in ['comparison.json','manual.json','cafef.json']},
                   'summary':selected['summary'],'items':review,'excluded':excluded,
                   'action':'Check caption/definition, PDF notes, period, unit, scope and duplicate/classification warnings. Reference values are not approved accounting facts.'}
    (BASE/'excluded-cafef-pdf-duplicates.json').write_text(json.dumps({'policyVersion':POLICY['version'],'ticker':'VNM','year':int(YEAR),'items':[r for r in excluded if r['reason']==POLICY['duplicateExclusionReason']]},ensure_ascii=False,indent=2)+'\n')
    (BASE/'selected-pdf-first.json').write_text(json.dumps(selected,ensure_ascii=False,indent=2)+'\n')
    (BASE/'review-pdf-first.json').write_text(json.dumps(review_file,ensure_ascii=False,indent=2)+'\n')
    lines = [f'# VNM {YEAR} — danh sách kiểm tra theo quy tắc PDF trước','',
             'PDF có giá trị số hợp lệ thì dùng PDF, kể cả 0. PDF thiếu số hoặc chưa đọc được thì mới lấy CafeF làm THAM CHIẾU CẦN KIỂM TRA. Dấu gạch không tự đổi thành 0. Các giá trị dưới đây giữ nguyên đơn vị nguồn; CafeF chưa khai báo đơn vị tiền/phạm vi hợp nhất.', '',
             f'**Phạm vi:** ba bảng chính của VNM {YEAR} đã đối chiếu. Chưa thấy dòng trong bảng chính không chứng minh toàn bộ thuyết minh PDF không có dòng đó.', '',
             f"Tổng {len(decisions)} dòng: {counts}. Có {len(review)} dòng cần kiểm tra; loại {selected['summary']['excludedCafeFDuplicates']} dòng CafeF nghi lệch nhãn và {selected['summary']['excludedHeadings']} tiêu đề.", '',
             'Toàn bộ giá trị đã chọn: [selected-pdf-first.json](selected-pdf-first.json). Danh sách có ID để phản hồi: [review-pdf-first.json](review-pdf-first.json).', '',
             '## CafeF đã bỏ qua theo yêu cầu người dùng','',
             'Các dòng tham chiếu khác 0 trùng số ở nhãn PDF khác đã bị loại khỏi dữ liệu được chọn và hàng đợi kiểm tra. Giữ nguồn gốc trong [excluded-cafef-pdf-duplicates.json](excluded-cafef-pdf-duplicates.json). Trùng số là tiêu chí loại theo yêu cầu, không phải bằng chứng xác định lỗi API. Không áp dụng với số 0 hoặc các cặp cùng chỉ tiêu đã ghép đúng.', '',
             '| ID trước khi loại | Chỉ tiêu CafeF | Giá trị đã bỏ qua | Dòng PDF có cùng số |','|---|---|---:|---|']
    for r in excluded:
        if r['reason']==POLICY['duplicateExclusionReason']:
            hints='; '.join(f"{h['label']} (trang {h['page']})" for h in r['matchingPdfRows'])
            lines.append(f"| {r.get('reviewId') or '—'} | {r['label']} | {formatted(r['cafefValue'])} | {hints} |")
    lines += ['',
              '## Toàn bộ danh sách cần kiểm tra','',
              '| ID | Chỉ tiêu | PDF | CafeF | Chọn giá trị | Nguồn chọn | Lý do |', '|---|---|---:|---:|---:|---|---|']
    for r in review:
        lines.append(f"| {r['reviewId']} | {r['label']} | {formatted(r['pdfValue'])} | {formatted(r['cafefValue'])} | {formatted(r['value'])} | {r['source']} | {', '.join(r['reviewReasons'])} |")
    lines += ['', '## Cách kiểm tra','',
              'Với dòng PDF/CafeF khác nhau: giữ PDF, kiểm tra lại trang nguồn nếu nghi lỗi chép/OCR. Với dòng CafeF tham chiếu: đối chiếu thuyết minh PDF trước; xác nhận đúng nội dung, kỳ, phạm vi và đơn vị; kiểm tra dòng trùng hoặc lệch nhãn. Các số 0 chỉ có trong template CafeF vẫn là tham chiếu chưa xác minh, không phải bằng chứng PDF xác nhận bằng 0.', '',
              'Các tổng gộp từ PDF có công thức và đủ toán hạng; giữ riêng với dòng báo cáo trực tiếp. Không cộng tất cả các dòng báo cáo với nhau vì có cả tổng, chi tiết và tổng dùng để đối chiếu.', '',
              'Trạng thái người dùng kiểm tra hiện là PENDING; chưa tự duyệt tham chiếu hay thay đổi dữ liệu kế toán/scoring chính thức.']
    (BASE/'review-pdf-first.md').write_text('\n'.join(lines)+'\n')
    print(json.dumps(selected['summary'],ensure_ascii=False))


if __name__=='__main__':
    main(sys.argv[1] if len(sys.argv)>1 else "2025")
