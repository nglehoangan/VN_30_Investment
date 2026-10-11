"""Retain the actual inspected VJC note-34 reading alongside original OCR attempts."""
import datetime,hashlib,json,pathlib,runpy
B=pathlib.Path('data/initialization-08b-remediation-work');R=runpy.run_path('scripts/reconcile-08b-extraction.py')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
h='979db52d2bed37e9f1e9a4308db39627f62bc10cb8d9ed1b3fe208f81d3ac682'
f=B/'ocr'/f'{h}-p53.json';p=json.loads(f.read_text());q=next(q for q in json.loads((B/'qualifications.json').read_text()) if q['bodyHash']==h)
assert q['status']=='TECHNICALLY_QUALIFIED_REVIEW_CANDIDATE' and q['scope']=='CONSOLIDATED' and q['period']['start']=='2026-01-01' and q['period']['end']=='2026-06-30'
assert sha(B/(h+'.pdf'))==h and sha(f.with_suffix('.png'))==p['renderSha256']
rows=[];cells=[]
for item,lexical,caption,unit in [
 ('BASIC_EPS','2.277','Lãi cơ bản trên cổ phiếu (VND)','CURRENCY_PER_SHARE')]:
 word=next(w for w in p['passA'] if lexical in w['text'].split())
 assert word['confidence']>=.8
 rows.append({'bodyHash':h,'page':53,'itemId':item,'caption':caption,'rowCode':None,'currentLexical':lexical,'unit':unit,'currency':'VND','scope':q['scope'],'periodType':'YTD','periodStart':'2026-01-01','periodEnd':'2026-06-30','renderSha256':p['renderSha256'],'sourceWordText':word['text'],'sourceWordTokenIndex':word['text'].split().index(lexical),'sourceImageColumnDefinition':{'layout':'VJC_NOTE_34_CURRENT_PRIOR_SIX_MONTH','currentColumnOrdinal':0,'currentHeader':'Kỳ 6 tháng kết thúc ngày 30 tháng 6 năm 2026','comparativeHeader':'Kỳ 6 tháng kết thúc ngày 30 tháng 6 năm 2025','periodEvidence':'kỳ kế toán 6 tháng kết thúc ngày 30 tháng 06 năm 2026','currentLexical':lexical}})
 cells.append({'ticker':'VJC','securityId':q['securityId'],'documentId':q['documentId'],'bodyHash':h,'page':53,'itemId':item,'sourceCaption':caption,'captionAlternative':R['fold'](caption),'sourceRowCode':None,'lexicalValue':lexical,'verificationLexicalValue':lexical,'verifiedCanonicalInteger':R['numeric_value'](lexical),'unit':unit,'currency':'VND','scope':q['scope'],'period':q['period'],'periodType':'YTD','columnX':word['x'],'rowY':word['y']+word['height']/2,'extractionMethod':p['engineA'],'verificationMethod':'CODEX_ASSISTANT_SOURCE_IMAGE_READING','renderSha256':p['renderSha256'],'sourceWordText':word['text'],'sourceWordTokenIndex':word['text'].split().index(lexical),'sourceImageColumnDefinition':rows[-1]['sourceImageColumnDefinition'],'status':'VERIFIED_TRANSCRIPTION_REVIEW_CANDIDATE','comparativeColumn':False,'independentHumanApproval':None})
proof_file=B/'vjc-note34-source-image-reader-proof.json'
proof={'method':'CODEX_ASSISTANT_SOURCE_IMAGE_READING','recordedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'governanceStatus':'REVIEW_CANDIDATE','independentHumanApproval':None,'rows':rows,'sourceRisk':'Actual image reading 2.277 agrees with original Apple Vision. Original Tesseract 2.271 disagreement remains retained. Unit per share is established by the exact note definition: ordinary profit divided by weighted-average ordinary shares; no EPS calculation or substitution is performed. Comparative is not admitted.'}
proof_file.write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n')
for c in cells:c.update(sourceImageProofFile=str(proof_file),sourceOcrProofFile=str(f),sourcePageEvidenceHashes=[sha(f),sha(proof_file)])
out=B/'source-image-verified-cells.json';existing=json.loads(out.read_text());existing=[c for c in existing if not(c['bodyHash']==h and c['page']==53 and c['itemId']=='BASIC_EPS')];existing.extend(cells);out.write_text(json.dumps(existing,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'verifiedSourceImageCells':len(existing),'newVjcNoteCells':len(cells),'humanApprovalAsserted':False}))
