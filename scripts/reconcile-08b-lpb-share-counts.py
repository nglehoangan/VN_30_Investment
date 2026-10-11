"""Exact ordinary outstanding count; never infer it from nominal capital or EPS."""
import hashlib,json,pathlib,runpy
B=pathlib.Path('data/initialization-08b-remediation-work');R=runpy.run_path('scripts/reconcile-08b-extraction.py');h='2d4527bc19aba72b712521d0f2b9b680bff93a5143513da04a83cb97f76b12bf'
q=next(q for q in json.loads((B/'qualifications.json').read_text()) if q['bodyHash']==h);assert q['scope']=='SEPARATE_STANDALONE' and q['period']['end']=='2026-06-30'
f=B/'ocr'/f'{h}-p49.json';p=json.loads(f.read_text());assert p['engineA']!=p['engineB'];assert hashlib.sha256((B/(h+'.pdf')).read_bytes()).hexdigest()==h and hashlib.sha256(f.with_suffix('.png').read_bytes()).hexdigest()==p['renderSha256']
verified=[]
for key in ['passA','passB']:
 gs=R['lines'](p[key]);titles=[g for g in gs if 'so luong co phieu dang luu hanh (co phieu)' in R['fold'](g['text'])];assert len(titles)==1
 title=titles[0];rows=[g for g in gs if title['cy']<g['cy']<title['cy']+.025 and 'co phieu pho thong' in R['fold'](g['text'])];assert len(rows)==1
 row=rows[0];header=R['stock_date_columns'](gs,row['cy'],'2026-06-30');assert header and header['dates']==['2026-06-30']
 vals=R['numbers'](row);assert len(vals)==2 and all(v['confidence']>=.8 and R['numeric_value'](v['lexical'])=='2987282100' for v in vals)
 current=[v for v in vals if min(abs(v['x']+v['width']/2-x) for x in header['positions'])<.075];assert len(current)==1
 verified.append((row,current[0]))
assert verified[0][1]['lexical']==verified[1][1]['lexical']
row,value=verified[0]
c={'ticker':'LPB','securityId':q['securityId'],'documentId':q['documentId'],'bodyHash':h,'page':49,'itemId':'ORDINARY_SHARES_OUTSTANDING','sourceCaption':'Số lượng cổ phiếu đang lưu hành (cổ phiếu) - Cổ phiếu phổ thông','captionAlternative':'EXPLICIT_ORDINARY_OUTSTANDING_SHARE_SUBROW','lexicalValue':value['lexical'],'verificationLexicalValue':verified[1][1]['lexical'],'verifiedCanonicalInteger':'2987282100','unit':'SHARES','currency':None,'scope':q['scope'],'period':{**q['period'],'start':'2026-06-30','end':'2026-06-30'},'periodType':'INSTANT','columnX':value['x'],'rowY':row['cy'],'extractionMethod':p['engineA'],'verificationMethod':p['engineB'],'renderSha256':p['renderSha256'],'sourcePageEvidenceHashes':[hashlib.sha256(json.dumps(p[k],sort_keys=True,ensure_ascii=False).encode()).hexdigest() for k in ['passA','passB']],'status':'VERIFIED_TRANSCRIPTION_REVIEW_CANDIDATE','comparativeColumn':False,'unitEvidence':'Exact ordinary outstanding subrow beneath share-count title; source page states June 30 and closing column. No EPS weighted denominator, registered issuance, nominal capital or adjustment factor substituted.'}
(B/'lpb-share-count-cells.json').write_text(json.dumps([c],ensure_ascii=False,indent=2)+'\n');print(json.dumps({'verifiedOrdinaryShareCells':1,'weightedAverageSubstitution':False}))
