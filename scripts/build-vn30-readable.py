"""Apply readable PDF-first selection to the retained 30-stock universe.

No fuzzy/amount-based crosswalk, automatic unit guessing, latest-wins source
selection or production accounting admission. Generic OCR results need review.
The image-checked VNM annual artifacts are reused unchanged.
"""
import hashlib
import json
import pathlib
import re
import shutil
import sys
import unicodedata
from collections import Counter, defaultdict
from decimal import Decimal

ROOT=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts/lib'))
from report_source_priority import POLICY, choose, numeric

TICKERS='ACB BID BSR CTG FPT GAS GVR HDB HPG LPB MBB MCH MSN MWG SAB SHB SSB SSI STB TCB TCX VCB VHM VIB VIC VJC VNM VPB VPL VRE'.split()
YEARS=['2022','2023','2024','2025']
REPORTS={'can-doi-ke-toan':'Cân đối kế toán','ket-qua-kinh-doanh':'Kết quả kinh doanh','luu-chuyen-tien-te':'Lưu chuyển tiền tệ'}
OUT=ROOT/'data/comparisons/VN30'


def read(path):return json.loads((ROOT/path).read_text())
def sha(path):return hashlib.sha256((ROOT/path).read_bytes()).hexdigest()
def write(path,data):path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
def pointer(parts):return '/'+ '/'.join(str(p).replace('~','~0').replace('/','~1') for p in parts)
def fold(text):return ''.join(c for c in unicodedata.normalize('NFD',(text or '').lower().replace('đ','d')) if unicodedata.category(c)!='Mn')


def caption(text):
    """Remove only presentation numbering/formulas, never economic qualifiers."""
    text=fold(text)
    text=re.sub(r'^\s*(?:[a-z]|[ivxlcdm]+|\d+(?:\.\d+)*)[.)]\s*','',text)
    text=re.sub(r'\([^)]*=+[^)]*\)','',text)
    text=re.sub(r'\(mang sang (?:tu trang truoc|trang sau)\)','',text)
    return re.sub(r'[^a-z0-9]+',' ',text).strip()


def slug(text):return re.sub(r'[^a-z0-9]+','-',caption(text)).strip('-')


def document_year(path):
    name=pathlib.Path(path).name
    m=re.search(r'_Baocaotaichinh_(202[2-5])_Kiemtoan',name)
    if m:return m[1]
    special={'TCBS_Baocaotaichinh_Nam_2022_KT.pdf':'2022','TCBS - BCTC 2023 audited1709900356879E6hgipU2.pdf':'2023','TCBS_Baocaotaichinh_2024_Kiemtoan.pdf':'2024','m88_20260306_tcx___bao_cao_tai_chinh_2025_da_duoc_kiem_toan1772799433553vdjrirjg.pdf':'2025'}
    return special.get(name)


def annual_column(report,period,variant,group,year):
    label=fold(group['columnHeader']['label'])
    # Explicit column/header observations take precedence over filename hints.
    if period==year or (report=='can-doi-ke-toan' and period==year+'-12-31'):
        if any(x in label for x in ['nam truoc','previous year','so dau nam','opening balance']):return None
        if report!='can-doi-ke-toan' and variant.get('periodType') not in ['ANNUAL']:return None
        return 'EXPLICIT_CURRENT_YEAR_HEADER'
    if not period.startswith('UNRESOLVED'):return None
    current=['so cuoi nam','ending balance'] if report=='can-doi-ke-toan' else ['nam nay','current year']
    prior=['so dau nam','opening balance'] if report=='can-doi-ke-toan' else ['nam truoc','previous year']
    if any(x in label for x in current) and not any(x in label for x in prior):
        if re.search(r'quy|quarter|sau thang|six.month|tang|giam',label):return None
        return 'RELATIVE_HEADER_PLUS_ORIGINAL_ANNUAL_DOCUMENT_YEAR_REVIEW_REQUIRED'
    return None


def amount_unit(evidence,label):
    if 'co phieu' in fold(label) and 'lai' in fold(label):return None  # per-share scaling needs source review
    currency,scale=evidence.get('currency'),evidence.get('scale')
    return (currency if scale=='1' else f'{currency}_SCALE_{scale}') if currency and scale else None


def readable_shape(ticker):return {'schemaVersion':'vn30-readable-reports-v1','ticker':ticker,'productionAdmissible':False,'provenanceFile':'provenance.json','reports':{k:{'label':v,'periods':{}} for k,v in REPORTS.items()}}
def put(doc,report,year,group,key,row):
    items=doc['reports'][report]['periods'].setdefault(year,{'groups':{}})['groups'].setdefault(group,{'items':{}})['items']
    assert key not in items,('DUPLICATE_KEY',report,year,group,key)
    items[key]=row


def generic(ticker):
    target=OUT/ticker;target.mkdir(exist_ok=True)
    mp=f'data/manual-extracted/display-v1/{ticker}.json';cp=f'data/providers/cafef/display-v1/{ticker}.json'
    manual_source,cf_source=read(mp),read(cp)
    provenance={'files':{p:{'sha256':sha(p)} for p in [mp,cp]},'pdfRows':{},'cafefRows':{}}
    manual,cafef,selected=readable_shape(ticker),readable_shape(ticker),readable_shape(ticker)
    selected.update(policy=POLICY,extractionStatus='OCR_CANDIDATES_REVIEW_REQUIRED',scope='SCOPES_RETAINED_SEPARATELY',years=YEARS)
    pdf_by=defaultdict(list);cf_by=defaultdict(list);quarantine=[];issues=[];excluded=[];review=[];variant_count=0
    for report in REPORTS:
        for period,p in manual_source['reports'].get(report,{}).get('periods',{}).items():
            for vi,v in enumerate(p['variants']):
                variant_count+=1;vid=f'pdf-variant-{variant_count:04}';path=v['source']['retainedPath'];year=document_year(path)
                for gi,g in enumerate(v['groups']):
                    basis=annual_column(report,period,v,g,year) if year else None
                    base_parts=['reports',report,'periods',period,'variants',vi,'groups',gi]
                    if not basis:
                        quarantine.append({'report':report,'period':period,'documentYear':year,'sourceFile':path,'page':g['sourcePage'],'columnLabel':g['columnHeader']['label'],'rowCount':len(g['rows']),'sourcePointer':pointer(base_parts),'reason':'NON_CURRENT_ANNUAL_OR_UNRESOLVED_COLUMN','items':[{ 'label':r['label'],'sourceCode':r['code'],'value':r['value'],'status':r['status'],'lexicalValue':r['lexicalValue']} for r in g['rows']]})
                        continue
                    unit_evidence=g['unitEvidence'];scope=v.get('reportingScope');seen=Counter((caption(r['label']),r['code']) for r in g['rows'])
                    for ri,r in enumerate(g['rows']):
                        origin=f'{vid}-p{g["sourcePage"]}-r{ri:03}'
                        label=r['label'];norm=caption(label);code=r['code']
                        # Generic captions (e.g. cost/accumulated depreciation) need
                        # printed-code/occurrence context, never amounts, for identity.
                        key=(slug(label) or 'nhan-chua-doc-duoc')+(('-ma-'+str(code)) if code else '')
                        if not norm or (not code and seen[(norm,code)]>1):key+='-'+origin
                        context_key=(key,scope)
                        row={'label':label,'value':r['value'],'status':r['status'],'unit':amount_unit(unit_evidence,label),'currency':unit_evidence.get('currency'),'scale':unit_evidence.get('scale'),'scope':scope,'period':year,'concept':key,'sourceCode':code,'sourcePage':g['sourcePage'],'sourceFile':path,'originRef':origin,'lexicalValue':r['lexicalValue'],'periodBasis':basis,'reviewStatus':'UNREVIEWED_OCR','normalizedCaption':norm}
                        put(manual,report,year,vid+'-p'+str(g['sourcePage']),origin,row)
                        pdf_by[(report,year)].append((context_key,row))
                        provenance['pdfRows'][origin]={'displayFile':mp,'displayPointer':pointer(base_parts+['rows',ri]),'pdfFile':path,'pdfSha256':v['source']['payloadHash'],'cellEvidence':r.get('cellEvidence'),'captionEvidence':r.get('captionEvidence')}
    if ticker=='VIC':
        transcription_path='docs/fundamental-data-engine/VIC_FY2022_INCOME_TRANSCRIPTION.json'
        checked=read(transcription_path);assert sha(checked['sourceFile'])==checked['sourceSha256']
        provenance['files'][transcription_path]={'sha256':sha(transcription_path)}
        for ri,(page,code,label,value) in enumerate(checked['rows']):
            key=slug(label)+'-ma-'+code;origin=f'checked-vic-2022-income-r{ri:03}'
            row={'label':label,'value':value,'status':'VALUE','unit':'VND_PER_SHARE' if page==14 else 'VND_SCALE_1000000','currency':'VND','scale':'1' if page==14 else '1000000','scope':'CONSOLIDATED','period':'2022','concept':key,'sourceCode':code,'sourcePage':page,'sourceFile':checked['sourceFile'],'originRef':origin,'lexicalValue':value,'periodBasis':checked['basis'],'reviewStatus':'ASSISTANT_SOURCE_IMAGE_CHECKED','normalizedCaption':caption(label)}
            put(manual,checked['report'],'2022','checked-source-page-'+str(page),origin,row)
            pdf_by[(checked['report'],'2022')].append(((key,'CONSOLIDATED'),row))
            provenance['pdfRows'][origin]={'transcriptionFile':transcription_path,'transcriptionPointer':f'/rows/{ri}','pdfFile':checked['sourceFile'],'pdfSha256':checked['sourceSha256']}
    for report in REPORTS:
        for year in YEARS:
            variants=[(i,v) for i,v in enumerate(cf_source['reports'].get(report,{}).get('periods',{}).get(year,{}).get('variants',[])) if v['requestMode']=='NAM' and not v['modeMismatch']]
            for vi,v in variants:
                raw=v['source']['rawPayloadLocation'];actual=sha(raw)
                assert actual==v['source']['payloadHash'],'PROVIDER_RAW_HASH_CHANGED'
                provenance['files'][raw]={'sha256':actual,'retrievedAt':v['source']['retrievedAt']}
                for gi,g in enumerate(v['groups']):
                    for ri,r in enumerate(g['rows']):
                        origin=f'cafef-{report}-{year}-v{vi}-g{gi}-r{ri}'
                        row={'label':r['label'],'sourceLabel':r['label'],'sourceCode':r['code'],'value':r['value'],'status':r['status'],'unit':None,'scope':None,'period':year,'originRef':origin,'normalizedCaption':caption(r['label']),'kind':'DATA' if r['code'] else 'HEADING','group':g['id']}
                        put(cafef,report,year,g['id']+'-v'+str(vi),origin,row);cf_by[(report,year)].append(row)
                        provenance['cafefRows'][origin]={'displayFile':cp,'displayPointer':pointer(['reports',report,'periods',year,'variants',vi,'groups',gi,'rows',ri]),'rawPayloadPath':raw,'rawLocator':r['rawLocator']}
    for report in REPORTS:
        for year in YEARS:
            pdf_rows=pdf_by[(report,year)];providers=cf_by[(report,year)]
            concepts=defaultdict(list)
            for identity,row in pdf_rows:concepts[identity].append(row)
            caption_ids=defaultdict(set);provider_captions=defaultdict(list)
            for ident,rs in concepts.items():
                for r in rs:
                    if r['normalizedCaption']:caption_ids[r['normalizedCaption']].add(ident)
            for cf in providers:
                if cf['kind']=='DATA':provider_captions[cf['normalizedCaption']].append(cf)
            used=set();active=[]
            for ident,rs in sorted(concepts.items(),key=lambda p:str(p[0])):
                key,scope=ident;norm=rs[0]['normalizedCaption'];cfs=provider_captions.get(norm,[])
                # Only unambiguous exact normalized captions are a crosswalk.
                matches=cfs if norm and len(caption_ids[norm])==1 and len(cfs)==1 else []
                wrapped=[{**c,'concept':key} for c in matches]
                decision=choose(rs,wrapped,{'concept':key,'period':year,'scope':scope})
                used.update(r['originRef'] for r in matches)
                decision.update(report=report,year=int(year),key=key,label=rs[0]['label'],scope=scope,pdfValues=[r['value'] for r in rs],cafefValue=matches[0]['value'] if matches else None,pdfRefs=[r['originRef'] for r in rs],cafefRefs=[r['originRef'] for r in matches],mappingBasis='UNIQUE_EXACT_NORMALIZED_CAPTION' if matches else 'PDF_CAPTION_AND_CODE_CONTEXT',reviewDecision='PENDING',needsReview=True)
                decision['pdfValue']=decision['value'] if decision['source']=='PDF_REPORTED' else None
                decision['rawDeltaPdfMinusCafeF']=format(Decimal(decision['value'])-Decimal(matches[0]['value']),'f') if decision['source']=='PDF_REPORTED' and matches and numeric(matches[0]['value']) else None
                decision['comparisonDimensionsVerified']=False
                decision['reviewReasons']=list(dict.fromkeys(decision['reviewReasons']+['OCR_SOURCE_IMAGE_AND_CAPTION_REVIEW_REQUIRED']+(['CAFEF_DIMENSIONS_UNVERIFIED'] if matches else [])+(['PDF_SCOPE_UNVERIFIED'] if not scope else [])))
                active.append(('pdf-'+(scope or 'UNKNOWN_SCOPE').lower(),key,decision))
            for cf in providers:
                if cf['originRef'] in used:continue
                if cf['kind']=='HEADING':excluded.append({'report':report,'year':int(year),'label':cf['label'],'cafefRef':cf['originRef'],'reason':'PROVIDER_HEADING_NOT_FINANCIAL_VALUE'});continue
                key='cafef-only-'+slug(cf['label'])+'-'+str(cf['sourceCode'])+'-'+cf['originRef'].split('-v')[-1]
                norm=cf['normalizedCaption'];same_caption=bool(norm and caption_ids.get(norm))
                same_amount=[]
                if numeric(cf['value']) and Decimal(cf['value'])!=0 and not same_caption:
                    same_amount=[{'pdfRef':r['originRef'],'label':r['label'],'value':r['value'],'unit':r['unit'],'page':r['sourcePage'],'sourceFile':r['sourceFile']} for _,r in pdf_rows if r['normalizedCaption'] and r['normalizedCaption']!=norm and r['status'] in ['VALUE','ZERO'] and numeric(r['value']) and Decimal(r['value'])==Decimal(cf['value'])]
                if same_amount and POLICY['excludeNonzeroCafeFFallbackMatchingOtherPdfCaption']:
                    excluded.append({'report':report,'year':int(year),'key':key,'label':cf['label'],'cafefValue':cf['value'],'cafefRef':cf['originRef'],'matchingPdfRows':same_amount,'reason':POLICY['duplicateExclusionReason'],'status':'EXCLUDED_BY_USER_RULE','evidenceStatus':'UNREVIEWED_OCR_MATCH','productionAdmissible':False});continue
                if same_caption:
                    decision={'policyVersion':POLICY['version'],'value':None,'unit':None,'source':'UNRESOLVED_MAPPING','needsReview':True,'reviewReasons':['AMBIGUOUS_PDF_CAPTION_DO_NOT_FALL_BACK'],'productionAdmissible':False}
                else:decision=choose([],[{**cf,'concept':key}],{'concept':key,'period':year})
                decision.update(report=report,year=int(year),key=key,label=cf['label'],scope=None,pdfValue=None,pdfValues=[],cafefValue=cf['value'],pdfRefs=[],cafefRefs=[cf['originRef']],mappingBasis='UNMAPPED_PROVIDER_REFERENCE',reviewDecision='PENDING')
                active.append(('cafef-reference',key,decision))
            for group,key,row in active:
                # Stable human-readable ID, independent of monetary value or hashes.
                row['reviewId']=f'{ticker}-{year}-{report}-{group}-{key}'
                put(selected,report,year,group,key,row)
                if row['needsReview']:review.append(row)
            scopes=Counter(r.get('scope') or 'UNKNOWN' for _,r in pdf_rows)
            issues.append({'ticker':ticker,'year':int(year),'report':report,'pdfCells':len(pdf_rows),'pdfConcepts':len(concepts),'providerCells':len(providers),'scopes':dict(scopes),'status':'OCR_REVIEW_REQUIRED' if pdf_rows else 'PDF_ANNUAL_COLUMN_UNRESOLVED_OR_MISSING','sourceDocumentCandidates':sorted({q['sourceFile'] for q in quarantine if q['report']==report and q['documentYear']==year})})
    counts=Counter(r['source'] for report in selected['reports'].values() for period in report['periods'].values() for g in period['groups'].values() for r in g['items'].values())
    selected['summary']={'selected':sum(counts.values()),'bySource':dict(counts),'needsReview':len(review),'excludedCafeFDuplicates':sum(r['reason']==POLICY['duplicateExclusionReason'] for r in excluded),'excludedHeadings':sum(r['reason']=='PROVIDER_HEADING_NOT_FINANCIAL_VALUE' for r in excluded),'quarantinedColumns':len(quarantine),'coverageGaps':sum(i['pdfCells']==0 for i in issues)}
    def review_priority(row):
        source=row['source']
        return 0 if source=='UNRESOLVED_PDF_CONFLICT' else 1 if source=='CAFEF_REFERENCE' and numeric(row['value']) and Decimal(row['value'])!=0 else 2 if source in ['MISSING','UNRESOLVED_MAPPING'] else 3 if source=='CAFEF_REFERENCE' else 4 if 'PDF_CAFEF_VALUE_DIFFERENCE' in row['reviewReasons'] else 5
    for row in review:row['reviewPriority']=review_priority(row)
    review.sort(key=lambda row:(row['reviewPriority'],row['year'],row['report'],row['key']))
    write(target/'manual.json',manual);write(target/'cafef.json',cafef);write(target/'annual-pdf-first.json',selected)
    write(target/'annual-review.json',{'ticker':ticker,'policyVersion':POLICY['version'],'items':review,'coverage':issues})
    write(target/'excluded-cafef-pdf-duplicates.json',{'ticker':ticker,'items':excluded})
    write(target/'additional-period-candidates.json',{'ticker':ticker,'status':'UNREVIEWED','columns':quarantine})
    write(target/'provenance.json',provenance)
    review_lines=[f'# {ticker} — danh sách cần kiểm tra','', 'Ưu tiên: xung đột PDF, tham chiếu CafeF khác 0, ô thiếu/mapping mơ hồ, tham chiếu bằng 0, chênh lệch và kiểm tra OCR thường lệ. Giá trị giữ nguyên đơn vị nguồn. Chênh lệch thô chưa xác minh cùng đơn vị/phạm vi.','', '[Danh sách JSON đầy đủ](annual-review.json) giữ ID, nguồn và lý do. Các dòng CafeF bị bỏ qua nằm trong [ledger riêng](excluded-cafef-pdf-duplicates.json).','', '| Năm | Báo cáo / Chỉ tiêu | PDF | CafeF | Chọn | Đơn vị chọn | Nguồn | Mức ưu tiên |','|---|---|---|---|---|---|---|---|']
    for r in review:
        safe_label=(r['label'] or 'Nhãn chưa đọc được').replace('|','/')
        pdf_values='; '.join(dict.fromkeys(str(v) if v is not None else 'null' for v in r['pdfValues'])) or '—'
        review_lines.append(f"| {r['year']} | {r['report']} / {safe_label} | {pdf_values} | {r['cafefValue'] if r['cafefValue'] is not None else 'null'} | {r['value'] if r['value'] is not None else 'null'} | {r['unit'] or 'Chưa rõ'} | {r['source']} | {r['reviewPriority']} |")
    (target/'annual-review.md').write_text('\n'.join(review_lines)+'\n')
    lines=[f'# {ticker} — PDF trước, CafeF tham chiếu sau','', '**Trạng thái: dữ liệu OCR cần kiểm tra ảnh nguồn và mapping.** Chưa kiểm tra ảnh toàn bộ như mẫu VNM. Số tiền giữ nguyên đơn vị nguồn; không tự chuyển số triệu đồng sang đồng hoặc suy đoán đơn vị CafeF.','', 'Dữ liệu nhiều năm: [annual-pdf-first.json](annual-pdf-first.json). Nguồn PDF: [manual.json](manual.json). Nguồn CafeF: [cafef.json](cafef.json).','', 'Danh sách kiểm tra: [bảng dễ đọc](annual-review.md), [annual-review.json](annual-review.json). Dòng bị bỏ qua: [excluded-cafef-pdf-duplicates.json](excluded-cafef-pdf-duplicates.json). Cột khác kỳ/chưa xác định: [additional-period-candidates.json](additional-period-candidates.json). Truy vết: [provenance.json](provenance.json).','', '| Năm | Báo cáo | Ô PDF | Chỉ tiêu PDF | Ô CafeF | Trạng thái |','|---|---|---:|---:|---:|---|']
    lines.extend(f"| {i['year']} | {REPORTS[i['report']]} | {i['pdfCells']} | {i['pdfConcepts']} | {i['providerCells']} | {i['status']} |" for i in issues)
    (target/'README.md').write_text('\n'.join(lines)+'\n')
    return selected,{'ticker':ticker,'basis':'AUTOMATED_OCR_CANDIDATES','years':YEARS,**selected['summary']}


def checked_vnm():
    target=OUT/'VNM';target.mkdir(exist_ok=True)
    source='data/comparisons/VNM/annual-pdf-first.json';selected=read(source)
    for name in ['annual-pdf-first.json','annual-review.json','annual-provenance.json','additional-period-candidates.json']:
        shutil.copyfile(ROOT/'data/comparisons/VNM'/name,target/name)
    provenance={'files':{source:{'sha256':sha(source)}}}
    for year in YEARS:
        src=ROOT/'data/comparisons/VNM'/f'FY{year}';dst=target/f'FY{year}';dst.mkdir(exist_ok=True)
        for path in src.glob('*.json'):shutil.copyfile(path,dst/path.name)
        for path in src.glob('*.md'):shutil.copyfile(path,dst/path.name)
    write(target/'provenance.json',provenance)
    (target/'annual-review.md').write_text('# VNM — danh sách kiểm tra\n\n'+'\n'.join(f'- [{y}](FY{y}/review-pdf-first.md)' for y in YEARS)+'\n')
    (target/'README.md').write_text('# VNM\n\nReused unchanged image-checked annual selection from `data/comparisons/VNM/`. Years: 2022–2025. Per-year review files are under FY<year>/.\n')
    rows=[r for report in selected['reports'].values() for p in report['periods'].values() for g in p['groups'].values() for r in g['items'].values()]
    counts=Counter(r['source'] for r in rows)
    return selected,{'ticker':'VNM','basis':'REUSED_IMAGE_CHECKED_ANNUAL_DATA','years':YEARS,'selected':len(rows),'bySource':dict(counts),'needsReview':sum(r['needsReview'] for r in rows),'excludedCafeFDuplicates':sum(s['excludedCafeFDuplicates'] for s in selected['summary']),'excludedHeadings':sum(s['excludedHeadings'] for s in selected['summary']),'quarantinedColumns':None,'coverageGaps':0}


def main():
    OUT.mkdir(exist_ok=True);manifest={'schemaVersion':'vn30-readable-index-v1','universeBasis':'Retained project universe, same 30 symbols as saved CafeF inventory; not a live index reconstitution.','tickers':TICKERS,'years':YEARS,'policy':POLICY,'productionAdmissible':False,'files':[]}
    combined={'schemaVersion':'vn30-multiyear-readable-v1','years':YEARS,'productionAdmissible':False,'tickers':{}}
    for ticker in TICKERS:
        selected,summary=checked_vnm() if ticker=='VNM' else generic(ticker)
        combined['tickers'][ticker]=selected;summary['file']=f'{ticker}/annual-pdf-first.json';summary['sha256']=sha(str((OUT/summary['file']).relative_to(ROOT)))
        manifest['files'].append(summary)
        print(json.dumps({'ticker':ticker,**{k:summary[k] for k in ['selected','needsReview','coverageGaps','excludedCafeFDuplicates']}},ensure_ascii=False),flush=True)
    manifest['totals']={key:sum(r.get(key) or 0 for r in manifest['files']) for key in ['selected','needsReview','excludedCafeFDuplicates','excludedHeadings','coverageGaps']}
    write(OUT/'annual-pdf-first.json',combined);write(OUT/'manifest.json',manifest)
    write(OUT/'review-index.json',{'tickers':[{ 'ticker':r['ticker'],'json':f"{r['ticker']}/annual-review.json",'readableTable':f"{r['ticker']}/annual-review.md",'needsReview':r['needsReview'],'basis':r['basis']} for r in manifest['files']]})
    lines=['# VN30 — JSON báo cáo tài chính','', 'Áp dụng rule PDF trước / CafeF tham chiếu sau cho 30 mã trong kho dự án, các năm 2022–2025.','', '**VNM giữ dữ liệu đã kiểm tra ảnh. 29 mã còn lại là kết quả tự động từ OCR, cần kiểm tra nguồn/mapping; không đồng nghĩa đã đạt mức kiểm tra như VNM.** CafeF chưa khai báo đơn vị tiền/phạm vi. Không dùng mã dòng hoặc số trùng để tự ghép chỉ tiêu; không đoán chuyển đổi đơn vị.','', 'File gộp: [annual-pdf-first.json](annual-pdf-first.json), cấu trúc `tickers → mã → reports → báo cáo → periods → năm → groups → items`. File mỗi mã có cùng cấu trúc từ `reports`.','', 'Danh mục/mức độ hoàn thiện: [manifest.json](manifest.json). Mỗi mã có README, nguồn hai bên, dữ liệu được chọn, danh sách kiểm tra, loại bỏ và truy vết.','', '| Mã | Dòng trong bộ chọn (gồm null/xung đột) | Cần kiểm tra | CafeF bị bỏ qua | Báo cáo-năm chưa xác định cột PDF | Cơ sở |','|---|---:|---:|---:|---:|---|']
    for r in manifest['files']:lines.append(f"| [{r['ticker']}]({r['ticker']}/README.md) | {r['selected']} | {r['needsReview']} | {r['excludedCafeFDuplicates']} | {r['coverageGaps']} | {r['basis']} |")
    lines+=['', 'PDF numeric zero được giữ. Dash/null/OCR không rõ không đổi thành 0. Xung đột PDF giữ null và danh sách ứng viên, không dùng CafeF để né xung đột. Phạm vi hợp nhất/riêng lẻ tách nhóm, không gộp hai cơ sở. Trùng số khác nhãn chỉ loại CafeF fallback khác 0 theo yêu cầu, giữ bằng chứng gốc; không kết luận chắc chắn API lỗi.','', 'Các cột so sánh, quý, giữa niên độ và cột chưa xác định được giữ trong `additional-period-candidates.json` từng mã. “Năm nay/số cuối năm” chỉ liên kết với năm tài liệu gốc khi cột có nhãn rõ, đánh dấu cần kiểm tra. Sai/thiếu caption, kỳ, đơn vị hoặc phân loại của bộ OCR vẫn phải kiểm tra ảnh nguồn. Không có dữ liệu nào tự được duyệt vào accounting/scoring.','', 'Tái tạo: `python3 scripts/build-vn30-readable.py`. Kiểm tra: `python3 scripts/test-vn30-readable.py`.']
    (OUT/'README.md').write_text('\n'.join(lines)+'\n')
    print(json.dumps(manifest['totals']))

if __name__=='__main__':main()
