#!/usr/bin/env python3
"""Targeted retained-PDF supplement. Reuse selected JSON on replay; no download."""
import json,hashlib,datetime
from pathlib import Path
R=Path(__file__).resolve().parents[1];O=R/'docs/fundamental-data-engine/vnm-current-admission-route/2026-11-16'
pdf='data/manual-download/VNM/2026-11-02-remediation/565717-Q3_2026.pdf'
sha=lambda p:hashlib.sha256((R/p).read_bytes()).hexdigest();pin=lambda p:{'path':p,'sha256':sha(p)}
source=R/'data/manual-extracted-pdf/supplements/VNM-Q3-2026-current-core.json'
if not source.exists():
 prior=json.loads((R/'docs/fundamental-data-engine/vnm-s1-wacc-q3/2026-11-13/Q3_SELECTED_PAGES.json').read_text())
 pages={p['page']:p['lines'] for p in prior['pages'] if p['page'] in (7,12)}
 for p in (13,14):pages[p]=json.loads(Path(f'/private/tmp/vnm-current-source-review/p{p}.json').read_text())
 specs=[('INVENTORY','Hàng tồn kho','140',7,'7.468.559.705.359','6.529.979.921.580'),('CFO','Lưu chuyển tiền thuần từ hoạt động kinh doanh','20',13,'7.745.821.607.312','7.007.793.807.262'),('DEPRECIATION_AMORTIZATION','Khấu hao và phân bổ','02',13,'1.811.472.305.060','1.758.992.969.001'),('ASSET_PURCHASE_CASH_OUTFLOW','Tiền chi mua tài sản cố định và tài sản dài hạn khác','21',14,'(1.311.506.945.115)','(1.416.359.464.724)'),('CASH_INTEREST_PAID','Chi phí đi vay đã trả','14',13,'(289.742.964.313)','(221.521.483.186)'),('CASH_TAX_PAID','Thuế thu nhập doanh nghiệp đã nộp','15',13,'(2.029.286.473.080)','(1.169.098.838.438)'),('NET_INCOME_ATTRIBUTABLE_PARENT','Chủ sở hữu của Công ty','61',12,'8.559.925.918.638','6.569.834.044.990')]
 fields=[]
 for concept,caption,code,page,current,priorValue in specs:
  for column,lexeme,year in [('CURRENT_2026',current,2026),('COMPARATIVE_2025_RECLASSIFIED',priorValue,2025)]:
   matches=[(i,l) for i,l in enumerate(pages[page]) if lexeme in l['text']];assert len(matches)==1,(concept,column,matches)
   i,l=matches[0];stock=concept=='INVENTORY';end='2026-09-30' if year==2026 else '2025-12-31' if stock else '2025-09-30'
   fields.append({'ticker':'VNM','concept':concept,'caption':caption,'code':code,'column':column,'scope':'CONSOLIDATED','periodStart':end if stock else f'{year}-01-01','periodEnd':end,'currency':'VND','scale':'1','value':lexeme.replace('.','').replace('(','').replace(')',''),'nativeLexeme':lexeme,'signNormalization':'NEGATIVE_REPORTED_OUTFLOW_TO_POSITIVE_MAGNITUDE' if lexeme.startswith('(') else 'IDENTITY','source':{'pdfPath':pdf,'pdfSha256':sha(pdf),'physicalPage':page,'href':pdf+'#page='+str(page),'lineIndex':i,'lineText':l['text'],'lineBox':{k:l[k] for k in ['x','y','width','height']},'boxPrecision':'OCR_LINE_MAY_SPAN_CELLS'},'review':'CAPTION_CODE_COLUMN_UNIT_VALUE_CHECKED_AGAINST_RETAINED_PDF_IMAGE_NOT_HUMAN_SCORING_APPROVAL'})
 body={'contract':'vnm-targeted-current-core-source-cells-v1','ticker':'VNM','pdfPath':pdf,'pdfSha256':sha(pdf),'reviewedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='milliseconds').replace('+00:00','Z'),'sourceReceiptPreserved':'docs/fundamental-data-engine/vnm-s1-wacc-q3/2026-11-13/WACC_Q3_INPUTS.json#/q3Source/retrievalEvidence','fields':fields,'pages':[{'physicalPage':p,'lines':v,'reader':'RETAINED_JSON' if p in (7,12) else 'APPLE_VISION_TARGETED_SOURCE_REVIEW','text':'\n'.join(l['text'] for l in v)} for p,v in pages.items()],'pdfKitWarnings':'Unexpected EOF in JBIG2 stream; selected values/headers/captions remained fully legible and were visually checked. No PDF rewrite.'}
 source.write_text(json.dumps(body,ensure_ascii=False,indent=2)+'\n')
supp=json.loads(source.read_text());assert supp['pdfSha256']==sha(pdf)
old=json.loads((R/'docs/fundamental-data-engine/vnm-f2-mapping/2026-11-16/MAPPING_CONTRACT.json').read_text())
new=json.loads(json.dumps(old));new['version']='vnm-reviewed-current-core-v3'
for i,c in enumerate(supp['fields']):
 new['bindings'].append({'id':f'VNM:CORE:{i:02d}','ticker':'VNM','concept':c['concept'],'scope':c['scope'],'start':c['periodStart'],'end':c['periodEnd'],'vintage':'Q3_2026_PRESENTATION','unit':'VND','category':'REVIEWED_CURRENT_CORE_SOURCE_CELL','path':str(source.relative_to(R)),'sha256':sha(str(source.relative_to(R))),'pointer':f'/fields/{i}','checks':{k:c[k] for k in ['ticker','concept','caption','code','column','scope','periodStart','periodEnd','currency','scale','nativeLexeme','signNormalization']}})
(O/'MAPPING_CONTRACT_V3.json').write_text(json.dumps(new,ensure_ascii=False,indent=2,sort_keys=True)+'\n')
metadata=json.loads((O/'DOCUMENT_BINDINGS.json').read_text());metadata['documents'][0]['review']={**pin(str(source.relative_to(R))),'pointer':'/reviewedAt'}
(O/'DOCUMENT_BINDINGS_V2.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2)+'\n')
selected=[m for m in new['bindings'] if m['scope']=='CONSOLIDATED' and m['vintage']=='Q3_2026_PRESENTATION']
requirements=json.loads((O/'DATASET_REQUIREMENTS.json').read_text());requirements['version']='vnm-q3-current-native-core-inputs-v2';requirements['financial']=[{'itemId':{'NET_PROFIT_GROUP':'NET_INCOME'}.get(m['concept'],m['concept']),'scope':m['scope'],'start':m['start'],'end':m['end'],'vintage':m['vintage']} for m in selected if m['end']=='2026-09-30']
unique={json.dumps(x,sort_keys=True):x for x in requirements['financial']};requirements['financial']=list(unique.values())
(O/'DATASET_REQUIREMENTS_V2.json').write_text(json.dumps(requirements,ensure_ascii=False,indent=2)+'\n')
(O/'SELECTED_MAPPING_IDS_V2.json').write_text(json.dumps({'ticker':'VNM','securityId':'a243cd90-95b8-44f0-96a5-b6be0defeb87','economicCutoff':'2026-10-30','mappingIds':[m['id'] for m in selected],'fullM3CoverageCertified':False},indent=2)+'\n')
print(json.dumps({'selected':len(selected),'currentBoundInputs':len(requirements['financial'])}))
