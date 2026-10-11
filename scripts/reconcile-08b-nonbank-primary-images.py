"""Actually inspected current primary-statement cells; no accounting inference."""
import datetime
import hashlib
import json
import pathlib
import runpy

B = pathlib.Path('data/initialization-08b-remediation-work')
SPECS = {
 'VRE': {'body': 'd64526bbf7c390a83e783dcd7341edd9e93d346e4001f5dac65b818f69380220', 'unit': 'MILLION_CURRENCY', 'headers': ['VINCOM RETAIL JOINT STOCK COMPANY', 'CONSOLIDATED', '30 June 2026', 'Unit: VND million'], 'column': [.65, .76], 'codeColumn': [.48, .54], 'rows': [
  (9, 'TOTAL_LIABILITIES_SUPPORTING', '13,495,541', '12,910,946', 'LIABILITIES', '300'),
  (11, 'REVENUE', '4,667,489', '4,274,054', 'Net revenue from goods sold and services rendered', '10'),
  (11, 'GROSS_PROFIT', '2,652,108', '2,384,531', 'Gross profit from goods sold and services rendered', '20'),
  (11, 'NET_INCOME', '3,214,788', '2,410,658', 'Net profit after corporate income tax', '137')]},
 'BSR': {'body': '9ddfcce5c6c301b381a22c6ff9fb48b69b1a9c99ec531fee25dabde45d54cea5', 'unit': 'CURRENCY', 'headers': ['hợp nhất', '30 tháng 6 năm 2026', 'Đơn vị: VND', 'Kỳ này', 'Kỳ trước'], 'column': [.58, .76], 'codeColumn': [.47, .56], 'rows': [
  (11, 'REVENUE', '104.635.924.964.339', '68.666.547.029.930', 'Doanh thu thuần về bán hàng và cung cấp dịch vụ', '10'),
  (12, 'CFO', '6.793.615.051.885', '3.007.957.479.872', 'Lưu chuyển tiền thuần từ hoạt động kinh doanh', '20'),
  (12, 'CFI_SUPPORTING', '(9.991.729.346.001)', '(10.495.573.878.479)', 'Lưu chuyển tiền thuần từ hoạt động đầu tư', '30'),
  (13, 'CFF_SUPPORTING', '2.262.139.191.471', '(4.510.685.664.747)', 'Lưu chuyển tiền thuần từ hoạt động tài chính', '40'),
  (13, 'NET_CASH_CHANGE_SUPPORTING', '(935.975.102.645)', '(11.998.302.063.354)', 'Lưu chuyển tiền thuần trong kỳ', '50')]},
 'MCH': {'body': '4974b488d0511d3d80619912a8e2e9ad06bcb3bb4b416876bfcd4800ae2c1082', 'unit': 'CURRENCY', 'headers': ['hợp nhất', '30 tháng 6 năm 2026', '30/6/2026', '30/6/2025', 'VND'], 'column': [.58, .76], 'codeColumn': [.54, .58], 'rows': [
  (13, 'CFF_SUPPORTING', '(3.287.091.196.759)', '1.674.362.932.728', 'Lưu chuyển tiền thuần từ các hoạt động tài chính', '40'),
  (13, 'NET_CASH_CHANGE_SUPPORTING', '(3.642.234.076.895)', '172.661.837.883', 'Lưu chuyển tiền thuần trong kỳ', '50')]},
 'MSN': {'body': '3e7b265f892fab1c4cfe528bd7f893c591d22a4fe6d2a6027f41d86bb4623c38', 'unit': 'MILLION_CURRENCY', 'headers': ['hợp nhất', '30/6/2026', 'Triệu VND'], 'column': [.69, .81], 'codeColumn': [.55, .66], 'rows': [
  (10, 'TOTAL_ASSETS', '142.957.455', '128.322.475', 'TỔNG TÀI SẢN', '280'),
  (15, 'CFI_SUPPORTING', '(6.240.112)', '13.905.094', 'Lưu chuyển tiền thuần từ hoạt động đầu tư', '30'),
  (16, 'CFF_SUPPORTING', '2.475.049', '(23.233.027)', 'Lưu chuyển tiền thuần từ hoạt động tài chính', '40'),
  (16, 'NET_CASH_CHANGE_SUPPORTING', '(580.364)', '(8.057.103)', 'Lưu chuyển tiền thuần trong kỳ', '50')]},
 'GAS': {'body': 'a90c4b06b6fa67215ee83247c8f2ea7b5cf8bdba8cc968b226e52c55ce568886', 'unit': 'CURRENCY', 'headers': ['hợp nhất', '30 tháng 6 năm 2026', 'Đơn vị: VND'], 'column': [.58, .76], 'codeColumn': [.47, .56], 'rows': [
  (9, 'TOTAL_LIABILITIES_SUPPORTING', '32.568.229.020.837', '25.914.808.991.853', 'NỢ PHẢI TRẢ', '300'),
  (12, 'CFF_SUPPORTING', '(42.021.936.897)', '(230.993.273.437)', 'Lưu chuyển tiền thuần từ hoạt động tài chính', '40'),
  (12, 'NET_CASH_CHANGE_SUPPORTING', '4.178.767.684.909', '4.808.267.233.468', 'Lưu chuyển tiền thuần trong kỳ', '50')]}
}

def validate_primary_image(c, p, proof, R):
 s = SPECS.get(c.get('ticker'))
 if not s: return False
 d = c.get('sourceImageColumnDefinition') or {}
 expected = next((r for r in s['rows'] if r[1] == c['itemId']), None)
 if not expected or (c['page'], c['itemId'], c['lexicalValue'], d.get('comparativeLexical'), c['sourceCaption'], c['sourceRowCode']) != expected: return False
 stock = c['itemId'] in ['TOTAL_ASSETS', 'TOTAL_LIABILITIES_SUPPORTING']
 text = R['compact'](R['full_text'](p, 'passA'))
 required = s['headers'] + (['Closing balance','Opening balance','Reclassified'] if stock and c['ticker']=='VRE' else ['6-month period ended','Current period','Prior period','Reclassified'] if c['ticker']=='VRE' else ['1/1/2026'] if stock and c['ticker']=='MSN' else ['1/1/2026','1/1/2025','30/6/2025'] if c['ticker']=='MSN' else ['Số cuối kỳ','Số đầu kỳ'] if stock else ['Kỳ này','Kỳ trước'] if c['ticker']=='GAS' else [])
 raw = d.get('originalSourceWordText')
 word = [w for w in p['passA'] if w['text']==raw and w['confidence']>=.8 and abs(w['x']-c['columnX'])<.001 and abs(w['y']+w['height']/2-c['rowY'])<.001]
 grouped = c['ticker']=='BSR' and c['itemId']=='NET_CASH_CHANGE_SUPPORTING'
 prior = word if grouped and raw=='(935.975.102.645) (11.998.302.063.354)' and raw.split(' ')==[c['lexicalValue'],d.get('comparativeLexical')] else [w for w in p['passA'] if w['text']==d.get('comparativeLexical') and w['x']>(.75 if c['ticker']=='BSR' else .76) and abs(w['y']+w['height']/2-c['rowY'])<.025]
 code = [w for w in p['passA'] if w['text']==c['sourceRowCode'] and s['codeColumn'][0]<w['x']<s['codeColumn'][1] and abs(w['y']+w['height']/2-c['rowY'])<.025]
 near = ' '.join(w['text'] for w in p['passA'] if w['x']<s['codeColumn'][0] and abs(w['y']+w['height']/2-c['rowY'])<.028)
 return (c['bodyHash']==s['body'] and c['scope']=='CONSOLIDATED' and c['unit']==s['unit'] and c['currency']=='VND'
  and c['periodType']==('INSTANT' if stock else 'YTD') and c['period']['start']==('2026-06-30' if stock else '2026-01-01') and c['period']['end']=='2026-06-30'
  and d.get('currentColumnOrdinal')==0 and d.get('currentLexical')==c['lexicalValue'] and (raw==c['lexicalValue'] or grouped and raw=='(935.975.102.645) (11.998.302.063.354)')
  and s['column'][0]<c['columnX']<s['column'][1] and len(word)==1 and len(prior)==1 and len(code)==1
  and all(R['compact'](a) in text for a in required) and R['compact'](c['sourceCaption']) in R['compact'](near))

def main():
 R=runpy.run_path('scripts/reconcile-08b-extraction.py'); sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
 qs=json.loads((B/'qualifications.json').read_text()); cells=[]; rows=[]
 for ticker,s in SPECS.items():
  q=next(q for q in qs if q['bodyHash']==s['body']); assert q['scope']=='CONSOLIDATED' and q['period']['end']=='2026-06-30'
  for n,item,lexical,prior,caption,code in s['rows']:
   f=B/'ocr'/f"{s['body']}-p{n}.json"; p=json.loads(f.read_text()); assert sha(f.with_suffix('.png'))==p['renderSha256']
   sourceWord=lexical+' '+prior if ticker=='BSR' and item=='NET_CASH_CHANGE_SUPPORTING' else lexical
   word=next(w for w in p['passA'] if w['text']==sourceWord and s['column'][0]<w['x']<s['column'][1] and any(cw['text']==code and s['codeColumn'][0]<cw['x']<s['codeColumn'][1] and abs(cw['y']+cw['height']/2-w['y']-w['height']/2)<.025 for cw in p['passA'])); stock=item in ['TOTAL_ASSETS','TOTAL_LIABILITIES_SUPPORTING']; start='2026-06-30' if stock else '2026-01-01'; typ='INSTANT' if stock else 'YTD'
   d={'layout':'NONBANK_CURRENT_INSPECTED_PRIMARY','currentColumnOrdinal':0,'currentLexical':lexical,'comparativeLexical':prior,'originalSourceWordText':sourceWord,'statementRowCode':code}
   row={'bodyHash':s['body'],'page':n,'itemId':item,'caption':caption,'rowCode':code,'currentLexical':lexical,'unit':s['unit'],'currency':'VND','scope':q['scope'],'periodType':typ,'periodStart':start,'periodEnd':'2026-06-30','renderSha256':p['renderSha256'],'sourceImageColumnDefinition':d}; rows.append(row)
   c={'ticker':ticker,'securityId':q['securityId'],'documentId':q['documentId'],'bodyHash':s['body'],'page':n,'itemId':item,'sourceCaption':caption,'captionAlternative':R['fold'](caption),'sourceRowCode':code,'lexicalValue':lexical,'verificationLexicalValue':lexical,'verifiedCanonicalInteger':R['numeric_value'](lexical),'unit':s['unit'],'currency':'VND','scope':q['scope'],'period':{**q['period'],'start':start,'end':'2026-06-30','type':typ},'periodType':typ,'columnX':word['x'],'rowY':word['y']+word['height']/2,'extractionMethod':p['engineA'],'verificationMethod':'CODEX_ASSISTANT_SOURCE_IMAGE_READING','renderSha256':p['renderSha256'],'sourceImageColumnDefinition':d,'status':'VERIFIED_TRANSCRIPTION_REVIEW_CANDIDATE','comparativeColumn':False,'independentHumanApproval':None,'sourceOcrProofFile':str(f)}
   assert validate_primary_image(c,p,None,R),(ticker,item); cells.append(c)
 proof=B/'nonbank-current-primary-source-image-reader-proof.json'; proof.write_text(json.dumps({'method':'CODEX_ASSISTANT_SOURCE_IMAGE_READING','recordedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'governanceStatus':'REVIEW_CANDIDATE','independentHumanApproval':None,'rows':rows,'sourceRisk':'Actually inspected consolidated current columns and comparative columns. VRE/MSN million VND; BSR/MCH/GAS VND. VRE net-income code 137 is retained exactly as printed; parent profit is not aliased to common. Reclassified prior columns are not admitted by this current-only reading. BSR repeated values bind to their exact row codes. No inferred ordinary equity, normalized earnings or qualifying CAPEX.'},ensure_ascii=False,indent=2)+'\n')
 for c in cells: c.update(sourceImageProofFile=str(proof),sourcePageEvidenceHashes=[sha(pathlib.Path(c['sourceOcrProofFile'])),sha(proof)])
 out=B/'source-image-verified-cells.json'; existing=json.loads(out.read_text()); keys={(c['bodyHash'],c['itemId']) for c in cells}; existing=[c for c in existing if (c['bodyHash'],c['itemId']) not in keys]+cells; out.write_text(json.dumps(existing,ensure_ascii=False,indent=2)+'\n'); print(json.dumps({'sourceImageCells':len(existing),'newCells':len(cells)}))

if __name__=='__main__': main()
