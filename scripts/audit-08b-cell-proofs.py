"""Bind every retained agreed cell to original two-reader bytes, irrespective of reader order."""
import json,pathlib,hashlib,runpy,decimal,re
from functools import cache
B=pathlib.Path('data/initialization-08b-remediation-work')
P=pathlib.Path('data/initialization-08b-final-review-candidate')
sealed=json.loads((P/'source-page-proofs.json').read_text())
R=runpy.run_path('scripts/reconcile-08b-extraction.py')
@cache
def file_sha(file):return hashlib.sha256(pathlib.Path(file).read_bytes()).hexdigest()
def validate_independent_pair(p):
 try:
  original=pathlib.Path(p['sourceOriginalOcrProofFile']);third=pathlib.Path(p['sourceThirdReaderProofFile'])
  if original.resolve().parent!=(B/'ocr').resolve() or third.resolve().parent!=(B/'ocr-third-reader').resolve():return False
  if file_sha(original)!=p['sourceOriginalOcrProofSha256'] or file_sha(third)!=p['sourceThirdReaderProofSha256']:return False
  a=json.loads(original.read_text());c=json.loads(third.read_text())
  return (p['bodyHash']==a['bodyHash']==c['bodyHash'] and p['page']==a['page']==c['page']
          and p['renderSha256']==a['renderSha256']==c['renderSha256']==file_sha(original.with_suffix('.png'))
          and p['engineA']==c['engine']=='EASYOCR_1.7.2_VI_EN_LATIN_CPU_IMAGE_OCR' and p['engineB']==a['engineA']
          and p['passA']==c['words'] and p['passB']==a['passA'] and c['packageVersion']=='1.7.2'
          and c['originalOcrProofFile']==str(original) and c['originalOcrProofSha256']==file_sha(original)
          and len(c['modelArtifacts'])==2 and p['independentHumanApproval'] is None and c['independentHumanApproval'] is None)
 except (KeyError,ValueError,OSError):return False
def validate_transcription(c,p):
 if c.get('sourceIndependentPairProofFile') and not validate_independent_pair(p):return False
 if p.get('bodyHash')!=c['bodyHash'] or p.get('page')!=c['page'] or p.get('renderSha256')!=c['renderSha256']:return False
 if p.get('engineA')==p.get('engineB') or {p.get('engineA'),p.get('engineB')}!={c['extractionMethod'],c['verificationMethod']}:return False
 if c.get('exactHdbInvestorDisclosureProof'):
  return runpy.run_path('scripts/reconcile-08b-hdb-investor-disclosure.py')['validate'](c,p,R)
 if c.get('exactInvestorDisclosureProof'):
  return runpy.run_path('scripts/reconcile-08b-acb-investor-disclosure.py')['validate'](c,p,R)
 if c.get('exactAcbCapitalDisclosure'):
  return runpy.run_path('scripts/reconcile-08b-acb-capital-disclosure.py')['validate'](c,p,R)
 if c.get('ordinaryEquityClassificationProofFile'):
  return runpy.run_path('scripts/reconcile-08b-acb-common-equity.py')['validate'](c,p,R) and R['numeric_value'](c['lexicalValue'])==c['verifiedCanonicalInteger'] and R['numeric_value'](c['verificationLexicalValue'])==c['verifiedCanonicalInteger']
 # Independent re-reading of exact source numeric row and unit; a stream hash
 # alone cannot establish that the claimed lexical cell or scale occurs in it.
 if c['unit'] in ['PERCENT','TRILLION_CURRENCY']:
  if c['ticker']=='LPB' and c['unit']=='PERCENT':
   if c['bodyHash'] not in ['1049f32555f44d804d542129dd5819215b5754376c06d6c8bb87620bf8192e0e','2e59b889948a498ae56193c3d8e51f67f39cc9677b0047c6d3c6f87bcb557799'] or c['page']!=6 or c['itemId']!='BANK_REPORTED_CAR' or c['scope']!='SEPARATE_STANDALONE' or c['periodType']!='INSTANT' or c['period']['start']!=c['period']['end'] or c['period']['end']!='2026-06-30' or c['currency'] is not None:return False
   english=c['bodyHash']=='1049f32555f44d804d542129dd5819215b5754376c06d6c8bb87620bf8192e0e'
   caption='capital adequacy ratio (car)' if english else 'ty le an toan von (car)';tier='tier 1' if english else 'cap 1';standalone_name='standalone' if english else 'rieng le';consolidated_name='consolidated' if english else 'hop nhat'
   for key in ['passA','passB']:
    groups=R['lines'](p[key]);car=[g for g in groups if caption in R['fold'](g['text']) and tier not in R['fold'](g['text'])]
    if len(car)!=1 or abs(car[0]['cy']-c['rowY'])>=.015:return False
    vals=[w for w in car[0]['words'] if w['text'].endswith('%')]
    headers=[g for g in groups if g['cy']<car[0]['cy'] and standalone_name in R['fold'](g['text']) and consolidated_name in R['fold'](g['text'])]
    if len(vals)!=2 or len(headers)!=1:return False
    standalone=[w for w in headers[0]['words'] if R['fold'](w['text']) in ([standalone_name] if english else ['rieng','rieng le'])]
    if len(standalone)!=1 or vals[0]['text']!=c['lexicalValue'] or vals[0]['confidence']<.8 or abs(vals[0]['x']-standalone[0]['x'])>=.08:return False
  for method,lex in [(c['extractionMethod'],c['lexicalValue']),(c['verificationMethod'],c['verificationLexicalValue'])]:
   key='passA' if p['engineA']==method else 'passB'
   if 'rowY' not in c and R['compact'](c['sourceCaption']) not in R['compact'](R['full_text'](p,key)):return False
   ws=[w for w in p[key] if 'rowY' not in c or abs(w['y']+w['height']/2-c['rowY'])<.015]
   if not any(w['text']==lex and w['confidence']>=.8 for w in ws):return False
   try:
    if decimal.Decimal(lex.rstrip('%').replace(',','.'))!=decimal.Decimal(c['verifiedCanonicalInteger']):return False
   except decimal.InvalidOperation:return False
  return True
 for method,lex in [(c['extractionMethod'],c['lexicalValue']),(c['verificationMethod'],c['verificationLexicalValue'])]:
  key='passA' if p['engineA']==method else 'passB'
  groups=R['lines'](p[key]);rows=[g for g in groups if abs(g['cy']-c['rowY'])<.015]
  nums=[n for g in rows for n in R['numbers'](g)]
  expected=R['numeric_value'](lex)
  if expected is None or expected!=c['verifiedCanonicalInteger'] or not any(R['numeric_value'](n['lexical'])==expected and n['confidence']>=.8 for n in nums):return False
  if c['unit']=='SHARES' and c['ticker']=='LPB':
   if c['currency'] is not None or c['scope']!='SEPARATE_STANDALONE' or c['page']!=49 or c['bodyHash']!='2d4527bc19aba72b712521d0f2b9b680bff93a5143513da04a83cb97f76b12bf':return False
   titles=[g for g in groups if 'so luong co phieu dang luu hanh (co phieu)' in R['fold'](g['text'])]
   if len(titles)!=1 or c['itemId']!='ORDINARY_SHARES_OUTSTANDING' or c['periodType']!='INSTANT' or c['period']['start']!=c['period']['end'] or c['period']['end']!='2026-06-30':return False
   ordinary=[g for g in groups if titles[0]['cy']<g['cy']<titles[0]['cy']+.025 and 'co phieu pho thong' in R['fold'](g['text'])]
   if len(ordinary)!=1:return False
   header=R['stock_date_columns'](groups,ordinary[0]['cy'],c['period']['end'])
   if not header or header['dates']!=[c['period']['end']]:return False
   counts=[n for n in R['numbers'](ordinary[0]) if min(abs(n['x']+n['width']/2-h) for h in header['positions'])<.075]
   if len(counts)!=1 or R['numeric_value'](counts[0]['lexical'])!=expected or counts[0]['confidence']<.8 or abs(ordinary[0]['cy']-c['rowY'])>=.015:return False
  if c.get('sourceIndependentPairProofFile') and c['itemId'] in R['CF']:
   # Independently reject a nearby numeric token whose exact subtotal caption
   # belongs to a different, closer amount row.
   caption_rows=R['statement_rows'](groups)
   if not any(R['identify'](g) and R['identify'](g)[0]==c['itemId'] and any(R['numeric_value'](n['lexical'])==expected and n['confidence']>=.8 for n in R['numbers'](g)) for g in caption_rows):return False
  if c['unit'] in ['CURRENCY','MILLION_CURRENCY','THOUSAND_CURRENCY','BILLION_CURRENCY']:
   unit=R['declared_unit'](R['statement_rows'](groups,.53),c['rowY'])
   if c['itemId']=='NET_INCOME_ATTRIBUTABLE_COMMON':
    texts=[R['fold'](R['full_text'](p,k)) for k in ['passA','passB']]
    matched=[g for g in R['statement_rows'](groups) if abs(g['cy']-c['rowY'])<.015 and ((R['identify'](g) or R['identify_ordinary_profit_note'](g,texts) or (None,))[0]=='NET_INCOME_ATTRIBUTABLE_COMMON') and any(R['numeric_value'](n['lexical'])==expected for n in R['numbers'](g))]
    if len(matched)==1 and all('lai co ban tren co phieu' in t and 'thuyet minh bao cao' in t for t in texts):
     source_caption=R['fold'](matched[0]['text'])
     if any(s in source_caption for s in ['(trieu dong)','(trieu vnd)']):unit=(matched[0]['cy'],'MILLION_CURRENCY')
     elif '(vnd)' in source_caption:unit=(matched[0]['cy'],'CURRENCY')
   if not unit or unit[1]!=c['unit']:return False
 return True
def validate_lpb_common_equity_classification(c):
 try:
  f=pathlib.Path(c['commonEquityClassificationProofFile'])
  if str(f)!='data/initialization-08b-remediation-work/lpb-common-equity-classification-proof.json' or file_sha(f)!=c['commonEquityClassificationProofSha256']:return False
  evidence=json.loads(f.read_text())
  if evidence['bodyHash']!=c['bodyHash'] or evidence['classification']!='STANDALONE_ALL_ISSUED_CAPITAL_ORDINARY' or evidence['scope']!='SEPARATE_STANDALONE' or evidence['asOf']!='2026-06-30' or evidence['governanceStatus']!='REVIEW_CANDIDATE' or evidence['independentHumanApproval'] is not None:return False
  if c['itemId']!='COMMON_EQUITY' or c['lexicalValue']!='43.030.481' or c['scope']!=evidence['scope']:return False
  if [s['page'] for s in evidence['sources']]!=[8,30,49]:return False
  for s in evidence['sources']:
   pth=pathlib.Path(s['sourcePageFile'])
   if str(pth)!=f"data/initialization-08b-remediation-work/ocr/{c['bodyHash']}-p{s['page']}.json" or file_sha(pth)!=s['sourcePageSha256']:return False
   page=json.loads(pth.read_text())
   if page['bodyHash']!=c['bodyHash'] or page['page']!=s['page'] or page['renderSha256']!=s['renderSha256'] or file_sha(pth.with_suffix('.png'))!=s['renderSha256'] or page['engineA']==page['engineB']:return False
   for key in ['passA','passB']:
    text=R['compact'](R['full_text'](page,key))
    if not all(R['compact'](a) in text for a in s['exactAnchorsInBothReaders']):return False
    if s['page']==49:
     rows=[g for g in R['lines'](page[key]) if abs(g['cy']-.248)<.01 and '29.872.821' in g['text']]
     if len(rows)!=1:return False
     words=rows[0]['words']
     if any(w['confidence']<.8 for w in words if re.search(r'29\.872\.821|100,00%',w['text'])):return False
     if re.findall(r'29\.872\.821|100,00%',rows[0]['text'])!=['29.872.821','29.872.821','100,00%','29.872.821','29.872.821','100,00%']:return False
  return True
 except (KeyError,ValueError,OSError):return False
def validate_source_image(c,p,proof,hashes,renderhash,bodyhash):
 matches=[r for r in proof['rows'] if all(r[k]==c[k] for k in ['bodyHash','page','itemId','unit','currency','scope','periodType','renderSha256']) and r['periodStart']==c['period']['start'] and r['periodEnd']==c['period']['end'] and r['currentLexical']==c['lexicalValue']==c['verificationLexicalValue'] and r['rowCode']==c['sourceRowCode'] and R['fold'](r['caption'])==c['captionAlternative']]
 numeric=any(w['text']==c['lexicalValue'] and w['confidence']>=.8 and abs(w['y']+w['height']/2-c['rowY'])<.015 and abs(w['x']-c['columnX'])<.015 for w in p['passA'])
 if (c.get('sourceImageColumnDefinition') or {}).get('layout')=='BSR_NOTE_33_CURRENT_PRIOR_RESTATED':
  definition=c['sourceImageColumnDefinition'];text=R['fold'](R['full_text'](p,'passA'))
  numeric=(len(matches)==1 and c['bodyHash']=='9ddfcce5c6c301b381a22c6ff9fb48b69b1a9c99ec531fee25dabde45d54cea5' and c['page']==44
           and c['itemId'] in ['NET_INCOME_ATTRIBUTABLE_COMMON','BASIC_EPS'] and c['scope']=='CONSOLIDATED'
           and c['periodType']=='YTD' and c['period']['start']=='2026-01-01' and c['period']['end']=='2026-06-30'
           and matches[0].get('sourceWordText')==c['sourceWordText'] and matches[0].get('sourceWordTokenIndex')==c['sourceWordTokenIndex']
           and definition.get('currentColumnOrdinal')==0 and definition.get('currentLexical')==c['lexicalValue']
           and definition.get('currentHeader')=='Kỳ này' and definition.get('comparativeHeader')=='Kỳ trước (Trình bày lại)'
           and all(s in text for s in ['lai co ban tren co phieu','thuyet minh bao cao tai chinh hop nhat','co phieu pho thong (vnd)','vnd/co phieu','ky hoat dong 6 thang ket thuc ngay 30 thang 6 nam 2026','ky nay','ky truoc'])
           and any(w['text']==c['sourceWordText'] and w['confidence']>=.8 and w['text'].split()[c['sourceWordTokenIndex']]==c['lexicalValue'] and abs(w['y']+w['height']/2-c['rowY'])<.001 and abs(w['x']-c['columnX'])<.001 for w in p['passA'])
           and c['unit']==('CURRENCY' if c['itemId']=='NET_INCOME_ATTRIBUTABLE_COMMON' else 'CURRENCY_PER_SHARE')
           and c['lexicalValue']==('15.930.797.947.229' if c['itemId']=='NET_INCOME_ATTRIBUTABLE_COMMON' else '3.181'))
 elif (c.get('sourceImageColumnDefinition') or {}).get('layout')=='VJC_NOTE_34_CURRENT_PRIOR_SIX_MONTH':
  definition=c['sourceImageColumnDefinition'];text=R['fold'](R['full_text'](p,'passA'))
  numeric=(len(matches)==1 and c['bodyHash']=='979db52d2bed37e9f1e9a4308db39627f62bc10cb8d9ed1b3fe208f81d3ac682' and c['page']==53
           and c['itemId']=='BASIC_EPS' and c['unit']=='CURRENCY_PER_SHARE' and c['scope']=='CONSOLIDATED'
           and c['periodType']=='YTD' and c['period']['start']=='2026-01-01' and c['period']['end']=='2026-06-30'
           and c['lexicalValue']==c['sourceWordText']=='2.277' and c['sourceWordTokenIndex']==0
           and matches[0].get('sourceWordText')==c['sourceWordText'] and matches[0].get('sourceWordTokenIndex')==0
           and definition.get('currentColumnOrdinal')==0 and definition.get('currentLexical')=='2.277'
           and definition.get('currentHeader')=='Kỳ 6 tháng kết thúc ngày 30 tháng 6 năm 2026' and definition.get('comparativeHeader')=='Kỳ 6 tháng kết thúc ngày 30 tháng 6 năm 2025'
           and all(s in text for s in ['lai co ban tren co phieu (vnd)','co dong pho thong','co phieu pho thong binh quan gia quyen','ky ke toan 6 thang ket thuc ngay 30 thang 06 nam 2026','hop nhat','2026','2025'])
           and any(w['text']=='2.277' and w['confidence']>=.8 and abs(w['y']+w['height']/2-c['rowY'])<.001 and abs(w['x']-c['columnX'])<.001 for w in p['passA'])
           and .68<c['columnX']<.75)
 elif (c.get('sourceImageColumnDefinition') or {}).get('layout')=='LPB_CURRENT_CLOSING_BALANCE':
  definition=c['sourceImageColumnDefinition'];text=R['fold'](R['full_text'](p,'passA'))
  allowed={'BANK_GROSS_CUSTOMER_LOANS':(7,'429.464.738','391.746.491'),'BANK_CUSTOMER_DEPOSITS':(8,'353.513.314','337.583.366'),'TOTAL_LIABILITIES_SUPPORTING':(8,'572.471.987','558.392.040'),'TOTAL_EQUITY':(8,'43.030.481','47.192.474')}
  if c['itemId']=='COMMON_EQUITY' and validate_lpb_common_equity_classification(c):allowed['COMMON_EQUITY']=(8,'43.030.481','47.192.474')
  expected=allowed.get(c['itemId']);near=' '.join(w['text'] for w in p['passA'] if w['x']<.6 and abs(w['y']+w['height']/2-c['rowY'])<.025)
  numeric=(numeric and len(matches)==1 and c['bodyHash']=='2d4527bc19aba72b712521d0f2b9b680bff93a5143513da04a83cb97f76b12bf'
           and expected is not None and (c['page'],c['lexicalValue'],definition.get('comparativeLexical'))==expected
           and c['scope']=='SEPARATE_STANDALONE' and c['periodType']=='INSTANT' and c['period']['start']==c['period']['end']=='2026-06-30'
           and c['unit']=='MILLION_CURRENCY' and definition.get('currentColumnOrdinal')==0 and definition.get('currentLexical')==c['lexicalValue']
           and definition.get('currentHeader')=='Số cuối kỳ' and definition.get('comparativeHeader')=='Số đầu kỳ' and definition.get('currentDate')=='2026-06-30'
           and all(s in text for s in ['tai ngay 30 thang 6 nam 2026','so cuoi ky','so dau ky','trieu vnd'])
           and R['compact'](c['captionAlternative']) in R['compact'](near) and .68<c['columnX']<.75
           and any(w['text']==expected[2] and w['x']>.8 and abs(w['y']+w['height']/2-c['rowY'])<.025 for w in p['passA']))
 elif (c.get('sourceImageColumnDefinition') or {}).get('layout')=='FPT_CURRENT_REVIEWED_PRIMARY':
  definition=c['sourceImageColumnDefinition'];text=R['compact'](R['full_text'](p,'passA'))
  allowed={'TOTAL_ASSETS':(9,'73.563.105.859.500','88.141.991.634.625','280'),'TOTAL_LIABILITIES_SUPPORTING':(10,'32.567.425.051.243','44.393.950.887.086','300'),'CFO':(13,'(1.145.666.005.788)','1.683.573.278.329','20'),'CFI_SUPPORTING':(13,'(3.771.904.822.508)','(7.233.991.769.335)','30'),'CASH_CAPEX_REPORTED':(13,'(1.336.483.237.731)','(3.295.258.865.719)','21'),'CFF_SUPPORTING':(14,'3.280.653.657.460','6.254.833.006.729','40'),'NET_CASH_CHANGE_SUPPORTING':(14,'(1.636.917.170.836)','704.414.515.723','50')}
  expected=allowed.get(c['itemId']);stock=c['itemId'] in ['TOTAL_ASSETS','TOTAL_LIABILITIES_SUPPORTING']
  raw=definition.get('originalSourceWordText','')
  numeric=(expected is not None and len(matches)==1 and c['bodyHash']=='45636554f28c7e6c2f38458b9a22410ed1f67e80627d672b827019a67f299df8'
           and (c['page'],c['lexicalValue'],definition.get('comparativeLexical'),c['sourceRowCode'])==expected
           and c['scope']=='CONSOLIDATED' and c['unit']=='CURRENCY' and c['currency']=='VND'
           and c['periodType']==('INSTANT' if stock else 'YTD') and c['period']['start']==('2026-06-30' if stock else '2026-01-01') and c['period']['end']=='2026-06-30'
           and definition.get('currentColumnOrdinal')==0 and definition.get('currentLexical')==c['lexicalValue'] and .59<c['columnX']<.75
           and re.sub(r'[^0-9]','',raw)==re.sub(r'[^0-9]','',c['lexicalValue']) and ('(' in raw)==('(' in c['lexicalValue'])
           and any(w['text']==raw and w['confidence']>=.8 and abs(w['x']-c['columnX'])<.001 and abs(w['y']+w['height']/2-c['rowY'])<.001 for w in p['passA'])
           and any(w['text']==c['sourceRowCode'] and .45<w['x']<.55 and abs(w['y']+w['height']/2-c['rowY'])<.025 for w in p['passA'])
           and all(R['compact'](s) in text for s in ['hợp nhất','Đơn vị: VND','30/06/2026'])
           and (R['compact']('31/12/2025') in text if stock else all(R['compact'](s) in text for s in ['01/01/2026','01/01/2025','30/06/2025'])))
 elif (c.get('sourceImageColumnDefinition') or {}).get('layout')=='FPT_REVIEWED_ORDINARY_CAPITAL_NOTE_25':
  numeric=runpy.run_path('scripts/reconcile-08b-fpt-ordinary-capital-note.py')['validate'](c,p,R)
 elif (c.get('sourceImageColumnDefinition') or {}).get('layout')=='MCH_NOTE_37_III_REPORTED_EPS':
  numeric=runpy.run_path('scripts/reconcile-08b-mch-eps-image.py')['validate'](c,p,R)
 elif (c.get('sourceImageColumnDefinition') or {}).get('layout')=='GAS_NOTE_36_REPORTED_ORDINARY_PROFIT_AND_EPS':
  numeric=runpy.run_path('scripts/reconcile-08b-gas-ordinary-note-image.py')['validate'](c,p,R)
 elif (c.get('sourceImageColumnDefinition') or {}).get('layout')=='CTG_EXACT_ANNUAL_FINANCING_SUBTOTAL':
  numeric=runpy.run_path('scripts/reconcile-08b-ctg-annual-financing-image.py')['validate'](c,p,R)
 elif (c.get('sourceImageColumnDefinition') or {}).get('layout')=='VNM_EXACT_ANNUAL_STATEMENT_IMAGE':
  numeric=runpy.run_path('scripts/reconcile-08b-vnm-annual-image.py')['validate'](c,p,R)
 elif (c.get('sourceImageColumnDefinition') or {}).get('layout')=='VNM_EXACT_FY25_PRIMARY_IMAGE':
  numeric=runpy.run_path('scripts/reconcile-08b-vnm-fy25-primary-image.py')['validate'](c,p,R)
 elif (c.get('sourceImageColumnDefinition') or {}).get('layout')=='VNM_EXACT_FY23_PRIMARY_IMAGE':
  numeric=runpy.run_path('scripts/reconcile-08b-vnm-fy23-income-image.py')['validate'](c,p,R)
 elif (c.get('sourceImageColumnDefinition') or {}).get('layout')=='VNM_EXACT_FY23_STOCK_IMAGE':
  numeric=runpy.run_path('scripts/reconcile-08b-vnm-fy23-stock-image.py')['validate'](c,p,R)
 elif (c.get('sourceImageColumnDefinition') or {}).get('layout')=='VNM_EXACT_FY23_CASHFLOW_IMAGE':
  numeric=runpy.run_path('scripts/reconcile-08b-vnm-fy23-cashflow-image.py')['validate'](c,p,R)
 elif (c.get('sourceImageColumnDefinition') or {}).get('layout')=='VRE_EXACT_CURRENT_CASHFLOW_IMAGE':
  numeric=runpy.run_path('scripts/reconcile-08b-vre-current-cashflow-image.py')['validate'](c,p,R)
 elif (c.get('sourceImageColumnDefinition') or {}).get('layout')=='ACB_EXACT_PRIOR_ORDINARY_CAPITAL':
  numeric=runpy.run_path('scripts/reconcile-08b-acb-prior-capital-image.py')['validate'](c,p,R)
 elif (c.get('sourceImageColumnDefinition') or {}).get('layout')=='SAB_EXACT_PRIOR_CASHFLOW_IMAGE':
  numeric=runpy.run_path('scripts/reconcile-08b-sab-prior-cashflow-image.py')['validate'](c,p,R)
 elif (c.get('sourceImageColumnDefinition') or {}).get('layout')=='BID_EXACT_CURRENT_PRIMARY':
  numeric=runpy.run_path('scripts/reconcile-08b-bid-current-primary-image.py')['validate'](c,p,R)
 elif (c.get('sourceImageColumnDefinition') or {}).get('layout')=='MWG_EXACT_ORDINARY_DISTRIBUTION_IMAGE':
  numeric=runpy.run_path('scripts/reconcile-08b-mwg-ordinary-distribution-image.py')['validate'](c,p,R)
 elif (c.get('sourceImageColumnDefinition') or {}).get('layout')=='GAS_EXACT_ORDINARY_DISTRIBUTION_IMAGE':
  numeric=runpy.run_path('scripts/reconcile-08b-gas-ordinary-share-image.py')['validate'](c,p,R)
 elif (c.get('sourceImageColumnDefinition') or {}).get('layout')=='GAS_EXACT_CURRENT_PRIMARY_IMAGE':
  numeric=runpy.run_path('scripts/reconcile-08b-gas-current-primary-image.py')['validate'](c,p,R)
 elif (c.get('sourceImageColumnDefinition') or {}).get('layout')=='MCH_EXACT_CLOSING_ORDINARY_SHARES_IMAGE':
  numeric=runpy.run_path('scripts/reconcile-08b-mch-ordinary-share-image.py')['validate'](c,p,R)
 elif (c.get('sourceImageColumnDefinition') or {}).get('layout')=='VNM_EXACT_Q1_STOCK_IMAGE':
  numeric=runpy.run_path('scripts/reconcile-08b-vnm-q1-stock-image.py')['validate'](c,p,R)
 elif (c.get('sourceImageColumnDefinition') or {}).get('layout')=='VNM_EXACT_Q1_CASHFLOW_IMAGE':
  numeric=runpy.run_path('scripts/reconcile-08b-vnm-q1-cashflow-image.py')['validate'](c,p,R)
 elif (c.get('sourceImageColumnDefinition') or {}).get('layout')=='MCH_EXACT_CURRENT_PRIMARY_IMAGE':
  numeric=runpy.run_path('scripts/reconcile-08b-mch-current-primary-image.py')['validate'](c,p,R)
 elif (c.get('sourceImageColumnDefinition') or {}).get('layout')=='FPT_EXACT_CURRENT_ADDITIONAL_IMAGE':
  numeric=runpy.run_path('scripts/reconcile-08b-fpt-current-additional-image.py')['validate'](c,p,R)
 elif (c.get('sourceImageColumnDefinition') or {}).get('layout')=='MCH_EXACT_PRIOR_FINANCING_IMAGE':
  numeric=runpy.run_path('scripts/reconcile-08b-mch-prior-financing-image.py')['validate'](c,p,R)
 elif (c.get('sourceImageColumnDefinition') or {}).get('layout')=='MWG_EXACT_CURRENT_PRIMARY_IMAGE':
  numeric=runpy.run_path('scripts/reconcile-08b-mwg-current-primary-image.py')['validate'](c,p,R)
 elif (c.get('sourceImageColumnDefinition') or {}).get('layout')=='HDB_EXACT_CURRENT_PRIMARY_AND_COMMON_NOTE':
  numeric=runpy.run_path('scripts/reconcile-08b-hdb-current-primary-image.py')['validate'](c,p,R)
 elif (c.get('sourceImageColumnDefinition') or {}).get('layout')=='HDB_EXACT_AUDITED_ANNUAL_PRIMARY':
  numeric=runpy.run_path('scripts/reconcile-08b-hdb-annual-primary-image.py')['validate'](c,p,R)
 elif (c.get('sourceImageColumnDefinition') or {}).get('layout')=='SSI_EXACT_CURRENT_PRIMARY':
  numeric=runpy.run_path('scripts/reconcile-08b-ssi-current-primary-image.py')['validate'](c,p,R)
 elif (c.get('sourceImageColumnDefinition') or {}).get('layout')=='TCX_EXACT_STANDALONE_CURRENT_PRIMARY':
  numeric=runpy.run_path('scripts/reconcile-08b-tcx-current-primary-image.py')['validate'](c,p,R)
 elif (c.get('sourceImageColumnDefinition') or {}).get('layout')=='GVR_EXACT_ANNUAL_CF_IMAGE':
  numeric=runpy.run_path('scripts/reconcile-08b-gvr-annual-cashflow-image.py')['validate'](c,p,R)
 elif (c.get('sourceImageColumnDefinition') or {}).get('layout')=='GVR_EXACT_CURRENT_PRIMARY':
  numeric=runpy.run_path('scripts/reconcile-08b-gvr-current-primary-image.py')['validate'](c,p,R)
 elif (c.get('sourceImageColumnDefinition') or {}).get('layout')=='NONBANK_CURRENT_INSPECTED_PRIMARY':
  numeric=runpy.run_path('scripts/reconcile-08b-nonbank-primary-images.py')['validate_primary_image'](c,p,proof,R)
 elif 'sourceWordText' in c:
  # A Vision region can contain both year columns. An actual supplementary
  # image reading pins the complete original region and current-column token;
  # never assign synthetic per-token coordinates to that region.
  definition=c.get('sourceImageColumnDefinition') or {}
  numeric=(len(matches)==1 and all(matches[0].get(k)==c.get(k) for k in ['sourceWordText','sourceWordTokenIndex','sourceImageColumnDefinition'])
           and c['sourceWordTokenIndex']==definition.get('currentColumnOrdinal')==0
           and definition.get('currentHeader')=='30/6/2026' and definition.get('comparativeHeader')=='30/6/2025'
           and c['periodType']=='YTD' and c['period']['start']=='2026-01-01' and c['period']['end']=='2026-06-30'
           and c['sourceWordText'].split() in [[c['lexicalValue']],[c['lexicalValue'],definition.get('comparativeLexical')]]
           and any(w['text']==c['sourceWordText'] and w['confidence']>=.8 and abs(w['y']+w['height']/2-c['rowY'])<.015 and abs(w['x']-c['columnX'])<.015 for w in p['passA'])
           and any(w['text']==c['sourceRowCode'] and abs(w['y']-matches[0]['numericTop'])<.025 for w in p['passA'])
           and all(s in R['full_text'](p,'passA') for s in ['30/6/2026','30/6/2025','sáu tháng']))
 elif (c.get('sourceImageColumnDefinition') or {}).get('layout')=='QUARTER_CURRENT_PRIOR_THEN_YTD_CURRENT_PRIOR':
  definition=c['sourceImageColumnDefinition']
  numeric=(numeric and len(matches)==1 and matches[0].get('sourceImageColumnDefinition')==definition
           and definition.get('currentColumnOrdinal')==2 and definition.get('currentHeader')=='30/6/2026' and definition.get('comparativeHeader')=='30/6/2025'
           and c['itemId'] in ['REVENUE','GROSS_PROFIT','NET_INCOME','NET_INCOME_ATTRIBUTABLE_PARENT']
           and c['periodType']=='YTD' and c['period']['start']=='2026-01-01' and c['period']['end']=='2026-06-30'
           and c['page'] in [11,12] and .69<c['columnX']<.82
           and len(definition.get('sourceRowValuesLeftToRight',[]))==len(definition.get('originalOcrRowValuesLeftToRight',[]))==4
           and definition['sourceRowValuesLeftToRight'][2]==definition['originalOcrRowValuesLeftToRight'][2]==c['lexicalValue']
           and all(any(w['text']==value and abs(w['y']-matches[0]['numericTop'])<.025 for w in p['passA']) for value in definition['originalOcrRowValuesLeftToRight'])
           and any(w['text']==c['sourceRowCode'] and abs(w['y']-matches[0]['numericTop'])<.025 for w in p['passA'])
           and all(s in R['full_text'](p,'passA') for s in ['30/6/2026','30/6/2025','sáu tháng']))
 if c['unit']=='PERCENT':
  try: exactValue=decimal.Decimal(c['lexicalValue'].rstrip('%').replace(',','.'))==decimal.Decimal(c['verifiedCanonicalInteger'])
  except decimal.InvalidOperation: exactValue=False
 else: exactValue=R['numeric_value'](c['lexicalValue'])==c['verifiedCanonicalInteger']
 return (c.get('sourcePageEvidenceHashes')==hashes and len(matches)==1 and matches[0].get('sourceImageColumnDefinition')==c.get('sourceImageColumnDefinition') and numeric and exactValue and c['extractionMethod']==p['engineA']=='APPLE_VISION_ACCURATE_IMAGE_OCR' and c['verificationMethod']==proof['method']=='CODEX_ASSISTANT_SOURCE_IMAGE_READING' and proof['governanceStatus']=='REVIEW_CANDIDATE' and proof['independentHumanApproval'] is None and c['independentHumanApproval'] is None and p['renderSha256']==c['renderSha256']==renderhash and bodyhash==c['bodyHash'])
rows=[]
for name,root in [('verified-cells.json',P),('verified-cells.json',B),('comparative-verified-cells.json',B),('bank-disclosure-cells.json',B),('tcb-disclosure-cells.json',B),('acb-investor-disclosure-cells.json',B),('hdb-investor-disclosure-cells.json',B),('acb-capital-disclosure-cells.json',B),('vib-share-count-cells.json',B),('lpb-share-count-cells.json',B),('lpb-capital-disclosure-cells.json',B),('lpb-capital-vn-disclosure-cells.json',B),('acb-ordinary-capital-cells.json',B),('source-image-verified-cells.json',B)]:
 if not (root/name).exists():continue
 for c in json.loads((root/name).read_text()):
  wanted=c.get('sourcePageEvidenceHashes');hits=[]
  if name=='source-image-verified-cells.json':
   # Separate actual image-reading evidence; never relabel it Tesseract or
   # human approval, and never replace the original disagreeing OCR streams.
   file=B/'ocr'/f'{c["bodyHash"]}-p{c["page"]}.json'
   proofFile=pathlib.Path(c['sourceImageProofFile'])
   if proofFile.resolve().parent!=B.resolve() or not proofFile.name.endswith('-source-image-reader-proof.json'):raise ValueError('UNCONTROLLED_SOURCE_IMAGE_PROOF_PATH')
   p=json.loads(file.read_text());proof=json.loads(proofFile.read_text())
   hs=[hashlib.sha256(path.read_bytes()).hexdigest() for path in [file,proofFile]]
   supportingProofs=[]
   if c.get('sourceImageColumnDefinition',{}).get('layout')=='ACB_EXACT_PRIOR_ORDINARY_CAPITAL' and runpy.run_path('scripts/reconcile-08b-acb-prior-capital-image.py')['validate'](c,p,R):
    classificationFile=pathlib.Path(c['ordinaryEquityClassificationProofFile']);hs.append(file_sha(classificationFile))
    supportingProofs.append({'file':str(classificationFile),'sha256':file_sha(classificationFile),'supportingDefinitionClassificationEvidence':True})
    for source in json.loads(classificationFile.read_text())['sources']:
     for path in [pathlib.Path(source['file']),pathlib.Path(source['file']).with_suffix('.png')]:
      supportingProofs.append({'file':str(path),'sha256':file_sha(path),'supportingDefinitionClassificationEvidence':True})
   if c['itemId']=='COMMON_EQUITY' and c.get('commonEquityClassificationProofFile') and validate_lpb_common_equity_classification(c):
    hs.append(file_sha(c['commonEquityClassificationProofFile']))
    classificationFile=pathlib.Path(c['commonEquityClassificationProofFile'])
    supportingProofs.append({'file':str(classificationFile),'sha256':file_sha(classificationFile),'supportingDefinitionClassificationEvidence':True})
    for source in json.loads(classificationFile.read_text())['sources']:
     for path in [pathlib.Path(source['sourcePageFile']),pathlib.Path(source['sourcePageFile']).with_suffix('.png')]:
      supportingProofs.append({'file':str(path),'sha256':file_sha(path),'supportingDefinitionClassificationEvidence':True})
   if c.get('ordinaryAttributionProofFile') and runpy.run_path('scripts/reconcile-08b-fpt-ordinary-capital-note.py')['validate_classification'](c,R):
    classificationFile=pathlib.Path(c['ordinaryAttributionProofFile']);hs.append(file_sha(classificationFile))
    supportingProofs.append({'file':str(classificationFile),'sha256':file_sha(classificationFile),'supportingDefinitionClassificationEvidence':True})
    for source in json.loads(classificationFile.read_text())['sources']:
     for path in [pathlib.Path(source['file']),pathlib.Path(source['file']).with_suffix('.png')]:
      supportingProofs.append({'file':str(path),'sha256':file_sha(path),'supportingDefinitionClassificationEvidence':True})
   render=B/'ocr'/f'{c["bodyHash"]}-p{c["page"]}.png'
   valid=validate_source_image(c,p,proof,hs,file_sha(render),file_sha(B/(c['bodyHash']+'.pdf')))
   rows.append({'cellSet':str(root/name),'bodyHash':c['bodyHash'],'page':c['page'],'itemId':c['itemId'],'period':c['period'],'lexicalValue':c['lexicalValue'],'sourcePageEvidenceHashes':wanted,'status':'PASS' if valid else 'FAIL','retainedProofFiles':[{'file':str(file),'sha256':hs[0]},{'file':str(proofFile),'sha256':hs[1]},*supportingProofs],'verificationMethod':proof['method'],'humanApprovalAsserted':False})
   continue
  if root==P:
   candidates=[(p['file'],p['sha256'],p['evidence']) for p in sealed if p['evidence'].get('bodyHash')==c['bodyHash'] and p['evidence'].get('page')==c['page']]
  else:
   file=pathlib.Path(c['sourceIndependentPairProofFile']) if c.get('sourceIndependentPairProofFile') else B/'ocr'/f'{c["bodyHash"]}-p{c["page"]}.json'
   if c.get('sourceIndependentPairProofFile') and file.resolve().parent!=(B/'ocr-independent-reader-pairs').resolve():raise ValueError('UNCONTROLLED_INDEPENDENT_PAIR_PATH')
   candidates=[(str(file),hashlib.sha256(file.read_bytes()).hexdigest(),json.loads(file.read_text()))] if file.exists() else []
  for file,filehash,p in candidates:
   hs=[hashlib.sha256(json.dumps(p[k],sort_keys=True,ensure_ascii=False).encode()).hexdigest() for k in ['passA','passB']]
   if c.get('exactAcbCapitalDisclosure') and validate_transcription(c,p):
    definition=c['regulatoryUnitDefinitionProof']
    hs.extend([definition['ocrSha256'],definition['receiptSha256']])
   if c.get('ordinaryEquityClassificationProofFile') and runpy.run_path('scripts/reconcile-08b-acb-common-equity.py')['validate_classification'](c,R):hs.append(file_sha(c['ordinaryEquityClassificationProofFile']))
   bound=(wanted is None and root==P) or wanted is not None and len(wanted)==len(hs) and set(wanted)==set(hs)
   distinct=p.get('engineA')!=p.get('engineB') and set([p.get('engineA'),p.get('engineB')])==set([c['extractionMethod'],c['verificationMethod']])
   if bound and distinct and p.get('bodyHash')==c['bodyHash'] and p.get('page')==c['page'] and p.get('renderSha256')==c['renderSha256'] and (root==P or validate_transcription(c,p) and file_sha(B/(c['bodyHash']+'.pdf'))==c['bodyHash'] and file_sha(B/'ocr'/f'{c["bodyHash"]}-p{c["page"]}.png')==c['renderSha256']):
    hits.append({'file':file,'sha256':filehash,'streamHashes':hs,'sealedPackageProof':root==P})
    if c.get('exactAcbCapitalDisclosure'):
     definition=c['regulatoryUnitDefinitionProof']
     for source in [B/'ocr'/f'{definition["bodyHash"]}-p11.json',B/'ocr'/f'{definition["bodyHash"]}-p11.png',B/'targeted-indexes/NHNN-TT14-2025-official-part1.pdf',B/'targeted-indexes/NHNN-TT14-2025-official-part1.json',B/'targeted-indexes/NHNN-TT14-2025-capital-definition.pdf',B/'targeted-indexes/NHNN-TT14-2025-capital-definition.json']:
      hits.append({'file':str(source),'sha256':file_sha(source),'supportingRegulatoryUnitEvidence':True,'sealedPackageProof':False})
    if c.get('ordinaryEquityClassificationProofFile'):
     classificationFile=pathlib.Path(c['ordinaryEquityClassificationProofFile']);hits.append({'file':str(classificationFile),'sha256':file_sha(classificationFile),'supportingDefinitionClassificationEvidence':True,'sealedPackageProof':False})
     for source in json.loads(classificationFile.read_text())['sources']:
      for path in [pathlib.Path(source['file']),pathlib.Path(source['file']).with_suffix('.png')]:hits.append({'file':str(path),'sha256':file_sha(path),'supportingDefinitionClassificationEvidence':True,'sealedPackageProof':False})
    if c.get('sourceIndependentPairProofFile'):
     for key in ['sourceOriginalOcrProofFile','sourceThirdReaderProofFile']:
      source=p[key];hits.append({'file':source,'sha256':file_sha(source),'supportingIndependentReaderEvidence':True,'sealedPackageProof':False})
  rows.append({'cellSet':str(root/name),'bodyHash':c['bodyHash'],'page':c['page'],'itemId':c['itemId'],'period':c['period'],'lexicalValue':c['lexicalValue'],'sourcePageEvidenceHashes':wanted,'status':'PASS' if hits else 'FAIL','retainedProofFiles':hits})
if (B/'gas-accounting-basis-qualification-override.json').exists():
 helper=runpy.run_path('scripts/reconcile-08b-gas-basis-image.py');proofFile=B/'gas-accounting-basis-source-image-proof.json';proof=json.loads(proofFile.read_text());valid=helper['validate'](proof)
 override=json.loads((B/'gas-accounting-basis-qualification-override.json').read_text())
 original=next(q for q in json.loads((B/'qualifications.json').read_text()) if q['bodyHash']==helper['BODY'])
 import copy
 expected=copy.deepcopy(original);expected['accountingBasis']='VAS';expected['contentEvidencePages']['ACCOUNTING_BASIS']=[16];expected['accountingBasisSourceImageProof']={'file':str(proofFile),'sha256':file_sha(proofFile)}
 valid=valid and override==[expected]
 files=[proofFile,B/'gas-accounting-basis-qualification-override.json',pathlib.Path(proof['sourceOcrProofFile']),pathlib.Path(proof['sourceRenderFile'])]
 rows.append({'cellSet':'EXACT_SOURCE_IMAGE_QUALIFICATION_DIMENSION','bodyHash':helper['BODY'],'page':16,'itemId':'ACCOUNTING_BASIS','period':original['period'],'lexicalValue':'VAS','status':'PASS' if valid else 'FAIL','retainedProofFiles':[{'file':str(f),'sha256':file_sha(f),'supportingQualificationEvidence':True,'sealedPackageProof':False} for f in files]})
out={'status':'PASS' if all(r['status']=='PASS' for r in rows) else 'FAIL','rows':rows}
(B/'source-cell-proof-audit.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps({'status':out['status'],'cells':len(rows),'failed':sum(r['status']=='FAIL' for r in rows),'failures':[(r['bodyHash'][:8],r['page']) for r in rows if r['status']=='FAIL'][:10]}))
