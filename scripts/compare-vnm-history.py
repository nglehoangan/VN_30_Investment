"""Build checked annual VNM history, without overwriting FY2025 or raw evidence."""
import hashlib
import importlib.util
import json
import pathlib
import re
import sys
from collections import Counter
from decimal import Decimal

ROOT=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts/lib'))
from manual_display import normalize_number
spec=importlib.util.spec_from_file_location('pilot',ROOT/'scripts/compare-vnm-readable.py')
pilot=importlib.util.module_from_spec(spec); spec.loader.exec_module(pilot)
REPORTS, GROUPS=pilot.REPORTS,pilot.GROUPS


def load(path):return json.loads((ROOT/path).read_text())
def sha(path):return hashlib.sha256((ROOT/path).read_bytes()).hexdigest()
def write(path,data):path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')


def build(year):
    period=str(year); base=ROOT/f'data/comparisons/VNM/FY{year}';base.mkdir(parents=True,exist_ok=True)
    pdf=f'data/manual-fundamentals/VNM/VNM_Baocaotaichinh_{year}_Kiemtoan_Hopnhat.pdf'
    transcript=f'docs/fundamental-data-engine/VNM_FY{year}_PDF_TRANSCRIPTION.txt'
    provider_path='data/providers/cafef/display-v1/VNM.json'
    pin_path=f'docs/fundamental-data-engine/VNM_FY{year}_COMPARISON_INPUTS.json'
    inputs={p:sha(p) for p in [pdf,transcript,provider_path]}
    if (ROOT/pin_path).exists():
        assert load(pin_path)['files']==inputs,'PINNED_INPUT_CHANGED'
    else:write(ROOT/pin_path,{'files':inputs})
    def shape(provider):return {'schemaVersion':'readable-financial-report-v1','ticker':'VNM','period':period,'provider':provider,'productionAdmissible':False,'provenanceFile':'provenance.json','reports':{k:{'label':v,'periods':{period:{'groups':{}}}} for k,v in REPORTS.items()}}
    def put(doc,report,group,key,row):
        items=doc['reports'][report]['periods'][period]['groups'].setdefault(group,{'label':GROUPS[group],'items':{}})['items']
        assert key not in items,('DUPLICATE_KEY',report,key)
        items[key]=row
    manual,cafef=shape('PDF'),shape('CAFEF')
    manual.update(sourceFile=pdf,scope='CONSOLIDATED',amountUnit='VND',checkStatus='SOURCE_IMAGES_CHECKED_BY_ASSISTANT')
    cafef.update(sourceFile=provider_path,scope=None,amountUnit=None,unitStatus='PROVIDER_UNDECLARED')
    provenance={'files':{p:{'sha256':h} for p,h in inputs.items()},'pdfRows':{},'cafefRows':{},'excludedPresentationDuplicates':[{'pdfPage':11,'code':'60','reason':'Carry-forward from page 10'}]}
    crosswalk, by_code, pdf_rows={}, {}, []
    # Checked captions in each historical PDF permit these explicit mappings.
    cf_codes={'01':'HDKD_2','02a':'HDKD_4','03':'HDKD_5','04':'HDKD_6','05a':'HDKD_7','06':'HDKD_8','08':'HDKD_10','09':'HDKD_11','10':'HDKD_12','11':'HDKD_13','12':'HDKD_14','14':'HDKD_16','15':'HDKD_17','17':'HDKD_19','20':'HDKD_20','21':'HDDT_22','22':'HDDT_23','23':'HDDT_24','25':'HDDT_26','26':'HDDT_27','27':'HDDT_28','30':'HDDT_29','33':'HDTC_33','34':'HDTC_34','40':'HDTC_38','50':'HDTC_39','60':'HDTC_40','70':'HDTC_42'}
    for number,line in enumerate((ROOT/transcript).read_text().splitlines(),1):
        if not line or line.startswith('#'):continue
        p,code,label,lexical=line.split('|');page=int(p);report=pilot.report_for(page)
        group=pilot.group_for(page,re.sub('[a-z]$','',code))
        key=pilot.slug(label);value,status=normalize_number(lexical)
        assert status in ['VALUE','ZERO','DASH'],(year,line)
        row={'label':label,'value':value,'status':status,'unit':'VND_PER_SHARE' if page==11 and code=='70' else 'VND','sourceCode':re.sub('[a-z]$','',code) if report=='luu-chuyen-tien-te' else code,'sourceOccurrenceKey':code,'sourcePage':page,'lexicalValue':lexical,'originRef':f'PDF/{report}/{group}/{key}'}
        put(manual,report,group,key,row);by_code[(report,code)]=(group,key,row);pdf_rows.append((report,group,key,row))
        provenance['pdfRows'][row['originRef']]={'pdf':pdf,'pdfPage':page,'transcriptionLine':number,'column':f'31/12/{year}' if page<10 else period,'basis':'SOURCE_IMAGE_CHECKED_TRANSCRIPTION'}
        mapped=pilot.provider_mapping(report,code) if report!='luu-chuyen-tien-te' else cf_codes.get(code)
        if mapped:
            assert (report,mapped) not in crosswalk
            crosswalk[(report,mapped)]=(group,key,label)
    # Keep the individual PDF captions. Comparison sums are explicit, never inferred by equal amounts.
    agg_specs=[('cac-dieu-chinh-khac','Các điều chỉnh khác','HDKD_9','hoat-dong-kinh-doanh',['02b','05c','05b']),('anh-huong-ty-gia-va-quy-doi-tien-te','Ảnh hưởng tỷ giá và quy đổi tiền tệ','HDTC_41','hoat-dong-tai-chinh',['61','62']),('co-tuc-da-tra-tong','Cổ tức đã trả tổng','HDTC_36','hoat-dong-tai-chinh',['36','36b'])]
    if year in [2022,2023]:
        # Caption 24 is term-deposit receipts; 2022's second printed 24 is
        # loan recovery, kept separately under occurrence key 24b.
        group,key,row=by_code[('luu-chuyen-tien-te','24')]
        crosswalk[('luu-chuyen-tien-te','HDDT_25')]=(group,key,row['label'])
    # Code 31 explicitly concerns NCI contributions, with no reliable dedicated provider caption.
    # Leave 31/32 distinct PDF-only; do not force them into broad equity issue/repurchase slots.
    for key,label,cfcode,group,codes in agg_specs:crosswalk[('luu-chuyen-tien-te',cfcode)]=(group,key,label)
    source_provider=load(provider_path); cf_rows={}
    for report in REPORTS:
        matches=[v for v in source_provider['reports'][report]['periods'][period]['variants'] if v['requestMode']=='NAM' and not v['modeMismatch']]
        assert len(matches)==1,'AMBIGUOUS_ANNUAL_PROVIDER'
        v=matches[0];raw=v['source']['rawPayloadLocation'];assert sha(raw)==v['source']['payloadHash']
        provenance['files'][raw]={'sha256':sha(raw),'retrievedAt':v['source']['retrievedAt']}
        for g in v['groups']:
            group={'TN':'tai-san','NV':'nguon-von','__ungrouped':'ket-qua-kinh-doanh','HDKD':'hoat-dong-kinh-doanh','HDDT':'hoat-dong-dau-tu','HDTC':'hoat-dong-tai-chinh'}[g['id']]
            for source in g['rows']:
                mapped=crosswalk.get((report,source['code']))
                if mapped:
                    target,key,label=mapped;assert target==group
                else:label=source['label'];key='cafef-only-'+pilot.slug(label)+'-'+(source['code'] or 'heading')
                row={'label':label,'sourceLabel':source['label'],'sourceCode':source['code'],'value':source['value'],'status':source['status'],'kind':'DATA' if source['code'] else 'HEADING','unit':'VND_PER_SHARE' if report=='ket-qua-kinh-doanh' and source.get('static') and 'cổ phiếu' in source['label'] else None,'originRef':f'CAFEF/{report}/{group}/{key}'}
                put(cafef,report,group,key,row);cf_rows[(report,group,key)]=row
                provenance['cafefRows'][row['originRef']]={'rawPayloadPath':raw,'rawLocator':source['rawLocator'],'templateLabel':source['label']}
    comparison={'schemaVersion':'vnm-readable-comparison-v1','ticker':'VNM','period':period,'productionAdmissible':False,'items':{},'cafefOnlyRows':[],'limitations':['CafeF monetary unit and consolidation scope undeclared.','Current-year column from original annual PDF; comparative columns retained in full corpus, not silently substituted.','Term deposits and provider loans/debt-instruments categories require classification review.','NCI contributions/refunds kept PDF-only; no forced mapping to broad equity slots.']}
    used=set(); statuses=Counter()
    def pair(report,group,key,row):
        cf=cf_rows.get((report,group,key))
        status,delta=pilot.compare_values(row['value'],cf['value'],row.get('status','VALUE')) if cf else ('PDF_ONLY',None)
        if cf:used.add((report,group,key))
        statuses[status]+=1
        notes=[]
        if report=='luu-chuyen-tien-te' and row.get('sourceOccurrenceKey') in ['23','24']:notes.append('TERM_DEPOSIT_VS_BROADER_PROVIDER_DEBT_CATEGORY_REVIEW')
        comparison['items'].setdefault(report,{}).setdefault(period,{})[key]={'report':report,'group':group,'key':key,'label':row.get('label',key),'pdf':row,'cafef':cf,'status':status,'rawDeltaPdfMinusCafeF':delta,'notes':notes,'strictDimensionsVerified':False}
    for report,group,key,row in pdf_rows:pair(report,group,key,row)
    for key,label,cfcode,group,codes in agg_specs:
        operands=[by_code[('luu-chuyen-tien-te',c)][2] for c in codes]
        assert all(r['value'] is not None for r in operands)
        row={'label':label,'value':format(sum((Decimal(r['value']) for r in operands),Decimal(0)),'f'),'unit':'VND','status':'VALUE','kind':'EXPLICIT_DISPLAY_AGGREGATE','formula':' + '.join(r['originRef'] for r in operands),'operands':operands}
        pair('luu-chuyen-tien-te',group,key,row)
    comparison['summary']=dict(statuses)
    comparison['cafefOnlyRows']=[{'report':r,'group':g,'key':k,**row} for (r,g,k),row in cf_rows.items() if (r,g,k) not in used]
    for name,data in [('manual.json',manual),('cafef.json',cafef),('comparison.json',comparison),('provenance.json',provenance)]:write(base/name,data)
    values={'ticker':'VNM','year':year,'pdfAmountUnit':'VND','cafefAmountUnit':None,'reports':{}}
    for report,periods in comparison['items'].items():
        for key,row in periods[period].items():values['reports'].setdefault(report,{}).setdefault(period,{})[key]={'label':row['label'],'pdf':row['pdf']['value'],'cafef':row['cafef']['value'] if row['cafef'] else None,'difference':row['rawDeltaPdfMinusCafeF'],'status':row['status'],'pdfUnit':row['pdf']['unit'],'pdfComputed':row['pdf'].get('kind')=='EXPLICIT_DISPLAY_AGGREGATE'}
    for row in comparison['cafefOnlyRows']:
        values['reports'].setdefault(row['report'],{}).setdefault(period,{})[row['key']]={'label':row['sourceLabel'],'pdf':None,'cafef':row['value'],'difference':None,'status':'CAFEF_ONLY','cafefKind':row['kind']}
    write(base/'values.json',values)
    write(base/'structure.json',{'sameOuterHierarchy':True,'hierarchy':['reports','periods','groups','items'],'selection':'One original audited annual PDF, current-year column; one saved annual CafeF variant per report.','pdfRows':len(pdf_rows),'cafefRows':len(cf_rows),'differences':['PDF-specific repeated codes require occurrence keys.','PDF NCI flows remain separate from broad provider equity captions.','Three explicit comparison aggregates retain component rows.','CafeF monetary unit and consolidation scope are undeclared.']})
    lines=[f'# VNM {year} — PDF và CafeF','', 'Giá trị trực tiếp: [values.json](values.json). Dữ liệu sau áp dụng rule: [selected-pdf-first.json](selected-pdf-first.json). Danh sách kiểm tra: [review-pdf-first.md](review-pdf-first.md).','',f'Đã kiểm tra ảnh các trang PDF vật lý 7–14, cột năm {year}. Không tự thay bằng cột so sánh của báo cáo năm sau. Đơn vị PDF là đồng; EPS là đồng/cổ phiếu. CafeF chưa khai báo đơn vị tiền/phạm vi hợp nhất.','', '| Báo cáo / Chỉ tiêu | PDF | CafeF | PDF − CafeF | Trạng thái |','|---|---:|---:|---:|---|']
    for report,periods in comparison['items'].items():
        for row in periods[period].values():
            lines.append(f"| {REPORTS[report]} / {row['label']} | {pilot.format_value(row['pdf']['value'])} | {pilot.format_value(row['cafef']['value']) if row['cafef'] else '—'} | {pilot.format_value(row['rawDeltaPdfMinusCafeF'])} | {row['status']} |")
    (base/'report.md').write_text('\n'.join(lines)+'\n')
    return {'year':year,'pdfRows':len(pdf_rows),'cafefRows':len(cf_rows),'comparison':dict(statuses)}


def main():
    for y in [2022,2023,2024]:print(json.dumps(build(y),ensure_ascii=False))

if __name__=='__main__':main()
