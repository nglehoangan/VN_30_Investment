"""Retain the actual inspected BSR note-33 reading alongside original OCR attempts."""
import datetime,hashlib,json,pathlib,runpy
B=pathlib.Path('data/initialization-08b-remediation-work');R=runpy.run_path('scripts/reconcile-08b-extraction.py')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
h='9ddfcce5c6c301b381a22c6ff9fb48b69b1a9c99ec531fee25dabde45d54cea5'
f=B/'ocr'/f'{h}-p44.json';p=json.loads(f.read_text());q=next(q for q in json.loads((B/'qualifications.json').read_text()) if q['bodyHash']==h)
assert q['status']=='TECHNICALLY_QUALIFIED_REVIEW_CANDIDATE' and q['scope']=='CONSOLIDATED' and q['period']['start']=='2026-01-01' and q['period']['end']=='2026-06-30'
assert sha(B/(h+'.pdf'))==h and sha(f.with_suffix('.png'))==p['renderSha256']
rows=[];cells=[]
for item,lexical,caption,unit in [
 ('NET_INCOME_ATTRIBUTABLE_COMMON','15.930.797.947.229','Lợi nhuận trong kỳ phân bổ cho các cổ đông sở hữu cổ phiếu phổ thông (VND)','CURRENCY'),
 ('BASIC_EPS','3.181','Lãi cơ bản trên cổ phiếu (VND/cổ phiếu)','CURRENCY_PER_SHARE')]:
 word=next(w for w in p['passA'] if lexical in w['text'].split())
 assert word['confidence']>=.8
 rows.append({'bodyHash':h,'page':44,'itemId':item,'caption':caption,'rowCode':None,'currentLexical':lexical,'unit':unit,'currency':'VND','scope':q['scope'],'periodType':'YTD','periodStart':'2026-01-01','periodEnd':'2026-06-30','renderSha256':p['renderSha256'],'sourceWordText':word['text'],'sourceWordTokenIndex':word['text'].split().index(lexical),'sourceImageColumnDefinition':{'layout':'BSR_NOTE_33_CURRENT_PRIOR_RESTATED','currentColumnOrdinal':0,'currentHeader':'Kỳ này','comparativeHeader':'Kỳ trước (Trình bày lại)','periodEvidence':'kỳ hoạt động 6 tháng kết thúc ngày 30 tháng 6 năm 2026','currentLexical':lexical}})
 cells.append({'ticker':'BSR','securityId':q['securityId'],'documentId':q['documentId'],'bodyHash':h,'page':44,'itemId':item,'sourceCaption':caption,'captionAlternative':R['fold'](caption),'sourceRowCode':None,'lexicalValue':lexical,'verificationLexicalValue':lexical,'verifiedCanonicalInteger':R['numeric_value'](lexical),'unit':unit,'currency':'VND','scope':q['scope'],'period':q['period'],'periodType':'YTD','columnX':word['x'],'rowY':word['y']+word['height']/2,'extractionMethod':p['engineA'],'verificationMethod':'CODEX_ASSISTANT_SOURCE_IMAGE_READING','renderSha256':p['renderSha256'],'sourceWordText':word['text'],'sourceWordTokenIndex':word['text'].split().index(lexical),'sourceImageColumnDefinition':rows[-1]['sourceImageColumnDefinition'],'status':'VERIFIED_TRANSCRIPTION_REVIEW_CANDIDATE','comparativeColumn':False,'independentHumanApproval':None})
proof_file=B/'bsr-note33-source-image-reader-proof.json'
proof={'method':'CODEX_ASSISTANT_SOURCE_IMAGE_READING','recordedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'governanceStatus':'REVIEW_CANDIDATE','independentHumanApproval':None,'rows':rows,'sourceRisk':'Issuer has not reliably estimated the current bonus/welfare allocation; future allocation may reduce ordinary profit and EPS. These are reported note values, not normalized earnings. EPS numerator 15,928,199,811,197 is distinct from reported ordinary profit; comparative is restated and is not admitted by this packet.'}
proof_file.write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n')
for c in cells:c.update(sourceImageProofFile=str(proof_file),sourceOcrProofFile=str(f),sourcePageEvidenceHashes=[sha(f),sha(proof_file)])
out=B/'source-image-verified-cells.json';existing=json.loads(out.read_text());existing=[c for c in existing if not(c['bodyHash']==h and c['page']==44 and c['itemId'] in ['NET_INCOME_ATTRIBUTABLE_COMMON','BASIC_EPS'])];existing.extend(cells);out.write_text(json.dumps(existing,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'verifiedSourceImageCells':len(existing),'newBsrNoteCells':len(cells),'humanApprovalAsserted':False}))
