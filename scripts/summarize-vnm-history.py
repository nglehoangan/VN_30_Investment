"""Publish multi-year readable VNM data and review inventory from annual outputs."""
import hashlib
import json
import pathlib
from collections import Counter

ROOT=pathlib.Path(__file__).resolve().parents[1]
BASE=ROOT/'data/comparisons/VNM'

def read(path):return json.loads(path.read_text())
def write(path,data):path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
def main():
    combined={'schemaVersion':'vnm-multiyear-readable-v1','ticker':'VNM','periodType':'ANNUAL','years':[2022,2023,2024,2025],'productionAdmissible':False,'reports':{}}
    audit={'files':{}};summaries=[];queue=[];excluded=[]
    for year in combined['years']:
        base=BASE/f'FY{year}';selected=read(base/'selected-pdf-first.json');manual=read(base/'manual.json')
        review=read(base/'review-pdf-first.json');comp=read(base/'comparison.json')
        summaries.append({'year':year,'pdfRows':sum(len(g['items']) for report in manual['reports'].values() for g in report['periods'][str(year)]['groups'].values()),**selected['summary'],'differences':comp['summary'].get('DIFFERENT_VALUE_OBSERVED',0)})
        queue.extend({'year':year,**r} for r in review['items']);excluded.extend({'year':year,**r} for r in review['excluded'])
        for report,periods in selected['reports'].items():
            groups={}
            for key,row in periods[str(year)].items():groups.setdefault(row['group'],{'items':{}})['items'][key]=row
            combined['reports'].setdefault(report,{'periods':{}})['periods'][str(year)]={'groups':groups}
        for name in ['manual.json','cafef.json','comparison.json','selected-pdf-first.json','review-pdf-first.json','provenance.json']:
            path=base/name;audit['files'][str(path.relative_to(ROOT))]=hashlib.sha256(path.read_bytes()).hexdigest()
    combined['summary']=summaries
    write(BASE/'annual-pdf-first.json',combined)
    write(BASE/'annual-review.json',{'ticker':'VNM','items':queue,'excluded':excluded})
    write(BASE/'annual-provenance.json',audit)
    # Preserve additional periods and variants as candidates. No silent annualization,
    # opening-balance rekeying, or selection among quarter/YTD header ambiguities.
    source=read(ROOT/'data/manual-extracted/display-v1/VNM.json')
    candidates={'ticker':'VNM','status':'EXTRACTION_CANDIDATE_REVIEW_REQUIRED','productionAdmissible':False,'reports':{},'note':'Includes 2021 comparative columns and 2026 interim variants. Quarter versus six-month headers require review; not included in annual selection.'}
    for key,report in source['reports'].items():
        if key not in combined['reports']:continue
        for period,p in report['periods'].items():
            if not (period.startswith('2026') or period=='2021'):continue
            result=candidates['reports'].setdefault(key,{'periods':{}})['periods'].setdefault(period,{'variants':[]})
            for v in p['variants']:
                result['variants'].append({'label':v['label'],'periodType':v['periodType'],'scope':v['reportingScope'],'sourceFile':v['source']['retainedPath'],'status':'UNREVIEWED','groups':[{'page':g['sourcePage'],'columnLabel':g['columnHeader']['label'],'items':{r['id']:{'label':r['label'],'sourceCode':r['code'],'value':r['value'],'status':r['status'],'lexicalValue':r['lexicalValue']} for r in g['rows']}} for g in v['groups']]})
    write(BASE/'additional-period-candidates.json',candidates)
    lines=['# VNM — tổng hợp dữ liệu nhiều năm','', 'Bộ số năm 2022–2024 được trích từ cột năm hiện hành của từng BCTC hợp nhất kiểm toán; đã đối chiếu ảnh PDF trang vật lý 7–14. Năm 2025 giữ bộ đã xử lý trước đó.','', 'File tổng hợp: [annual-pdf-first.json](annual-pdf-first.json), cấu trúc `reports → báo cáo → periods → năm → groups → items`. Giá trị là chuỗi số thập phân trực tiếp; nguồn, số hai bên, công thức và lý do kiểm tra đi kèm từng dòng. Hash nằm trong [annual-provenance.json](annual-provenance.json).','', '| Năm | Dòng PDF trực tiếp trong nguồn | Chọn PDF | Tổng từ PDF | CafeF tham chiếu | Chưa có số | Dòng CafeF bỏ qua | Cần kiểm tra |','|---|---:|---:|---:|---:|---:|---:|---:|']
    for s in summaries:
        c=s['bySource'];y=s['year']
        lines.append(f"| [{y}](FY{y}/report.md) | {s['pdfRows']} | {c.get('PDF_REPORTED',0)} | {c.get('PDF_EXPLICIT_AGGREGATE',0)} | {c.get('CAFEF_REFERENCE',0)} | {c.get('MISSING',0)} | {s['excludedCafeFDuplicates']} | [{s['needsReview']}](FY{y}/review-pdf-first.md) |")
    lines+=['', 'Số dòng nguồn PDF bao gồm dấu gạch. “Chưa có số” giữ null, không điền 0. Tổng từ PDF có công thức để đối chiếu, không được cộng thêm vào các dòng thành phần. CafeF tham chiếu vẫn cần kiểm tra đơn vị/phạm vi; giá trị trùng nhãn PDF khác chỉ dùng để bỏ qua theo rule người dùng, không tự tạo mapping.','', '## Dữ liệu chính từ PDF','', '| Năm | Doanh thu thuần (đồng) | Lợi nhuận sau thuế (đồng) | Tổng tài sản (đồng) | Dòng tiền kinh doanh (đồng) |','|---|---:|---:|---:|---:|']
    for year in combined['years']:
        manual=read(BASE/f'FY{year}/manual.json')
        lookup={(report,r['sourceCode']):r['value'] for report,v in manual['reports'].items() for g in v['periods'][str(year)]['groups'].values() for r in g['items'].values()}
        vals=[lookup[(r,c)] for r,c in [('ket-qua-kinh-doanh','10'),('ket-qua-kinh-doanh','60'),('can-doi-ke-toan','270'),('luu-chuyen-tien-te','20')]]
        lines.append('| '+str(year)+' | '+' | '.join(format(int(v),',').replace(',','.') for v in vals)+' |')
    lines+=['','## File từng năm','', 'Mỗi thư mục `FY2022`, `FY2023`, `FY2024`, `FY2025` có `manual.json`, `cafef.json`, `values.json`, `comparison.json`, `selected-pdf-first.json`, `review-pdf-first.md` và danh sách CafeF bị bỏ qua. [annual-review.json](annual-review.json) gộp danh sách kiểm tra, giữ ID riêng theo năm.','', '## Kỳ khác','', '[additional-period-candidates.json](additional-period-candidates.json) giữ số trực tiếp của cột so sánh 2021 và báo cáo giữa niên độ 2026 ở trạng thái trích xuất chưa kiểm tra. File này tách khỏi số năm đã chọn. Không có PDF BCTC năm 2021 riêng trong thư mục. Báo cáo 2026 chứa cả cột quý II và cột sáu tháng; bộ OCR trước đây gắn cả hai cùng khóa YTD nên chưa được dùng để chọn số năm hoặc gộp với CafeF.','', '## Tái tạo và kiểm tra','', 'Chạy lần lượt `python3 scripts/compare-vnm-history.py`, `python3 scripts/select-vnm-pdf-first.py 2022` (tương tự 2023, 2024), `python3 scripts/summarize-vnm-history.py`, `python3 scripts/test-vnm-history.py`. Bộ 2025 có builder riêng; không ghi đè khi chạy builder lịch sử.','', 'Kiểm tra tự động gồm tổng tài sản/nguồn vốn, lợi nhuận/thuế/phân bổ, dòng tiền và số dư tiền; 588 ô CafeF của ba năm được so với JSON Pointer trong payload gốc. Việc này không thay đổi accounting/scoring chính thức.']
    (BASE/'README.md').write_text('\n'.join(lines)+'\n')
    print(json.dumps(summaries,ensure_ascii=False))

if __name__=='__main__':main()
