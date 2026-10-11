"""Exact GAS accounting-basis source-image exception; no replacement of original readers."""
import copy, datetime, hashlib, json, pathlib, runpy, sys
B=pathlib.Path('data/initialization-08b-remediation-work')
BODY='a90c4b06b6fa67215ee83247c8f2ea7b5cf8bdba8cc968b226e52c55ce568886'
CLAUSES=[
 'Báo cáo tài chính hợp nhất giữa niên độ kèm theo được trình bày bằng Đồng Việt Nam',
 '(VND), theo nguyên tăc giá gốc và phù hợp với chuẩn mực kế toán, chế độ kế toán doanh',
 'nghiệp Việt Nam và các quy định pháp lý có liên quan đến việc lập và trình bày báo cáo tài',
 'chính hợp nhất giữa niên độ.',
]
sha=lambda p:hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()
def validate(proof):
 try:
  if proof['bodyHash']!=BODY or proof['page']!=16 or proof['ticker']!='GAS' or proof['dimension']!='ACCOUNTING_BASIS' or proof['value']!='VAS' or proof['independentHumanApproval'] is not None or proof['verificationMethod']!='CODEX_ASSISTANT_SOURCE_IMAGE_READING' or proof['extractionMethod']!='APPLE_VISION_ACCURATE_IMAGE_OCR' or proof['originalLexicalLines']!=CLAUSES:return False
  if proof['sourceOcrProofFile']!=str(B/'ocr'/f'{BODY}-p16.json') or proof['sourceRenderFile']!=str(B/'ocr'/f'{BODY}-p16.png'):return False
  if sha(B/(BODY+'.pdf'))!=BODY or sha(proof['sourceOcrProofFile'])!=proof['sourceOcrProofSha256'] or sha(proof['sourceRenderFile'])!=proof['renderSha256']:return False
  p=json.loads(pathlib.Path(proof['sourceOcrProofFile']).read_text())
  if p['bodyHash']!=BODY or p['page']!=16 or p['renderSha256']!=proof['renderSha256'] or p['engineA']!=proof['extractionMethod']:return False
  selected=[w for w in p['passA'] if .42<w['y']<.49 and .20<w['x']<.22]
  if [w['text'] for w in selected]!=CLAUSES or selected!=proof['originalWords'] or any(w['confidence']<.8 for w in selected):return False
  r=runpy.run_path('scripts/reconcile-08b-extraction.py')
  return r['affirmative_vas_preparation'](' '.join(w['text'] for w in p['passA'])) and 'co so lap bao cao tai chinh hop nhat giua nien do' in r['fold'](' '.join(w['text'] for w in p['passA']))
 except (KeyError,TypeError,ValueError,OSError):return False

def main():
 f=B/'gas-accounting-basis-source-image-proof.json'
 if '--validate' in sys.argv:
  proof=json.loads(f.read_text());assert validate(proof),'GAS_BASIS_EVIDENCE_INVALID'
  out=json.loads((B/'gas-accounting-basis-qualification-override.json').read_text());original=next(q for q in json.loads((B/'qualifications.json').read_text()) if q['bodyHash']==BODY)
  expected=copy.deepcopy(original);expected['accountingBasis']='VAS';expected['contentEvidencePages']['ACCOUNTING_BASIS']=[16];expected['accountingBasisSourceImageProof']={'file':str(f),'sha256':sha(f)}
  assert out==[expected],'GAS_BASIS_OVERRIDE_EXCEEDS_EXACT_DIMENSION'
  print(json.dumps({'status':'PASS','qualificationOverrides':1}));return
 p=json.loads((B/'ocr'/f'{BODY}-p16.json').read_text())
 proof={'ticker':'GAS','bodyHash':BODY,'page':16,'dimension':'ACCOUNTING_BASIS','value':'VAS','originalLexicalLines':CLAUSES,'originalWords':[w for w in p['passA'] if .42<w['y']<.49 and .20<w['x']<.22],'sourceOcrProofFile':str(B/'ocr'/f'{BODY}-p16.json'),'sourceOcrProofSha256':sha(B/'ocr'/f'{BODY}-p16.json'),'sourceRenderFile':str(B/'ocr'/f'{BODY}-p16.png'),'renderSha256':p['renderSha256'],'extractionMethod':p['engineA'],'verificationMethod':'CODEX_ASSISTANT_SOURCE_IMAGE_READING','recordedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'governanceStatus':'REVIEW_CANDIDATE','independentHumanApproval':None,'limitations':['Page 16 actually inspected. Original second-reader word-order corruption remains retained. This exception establishes only the explicitly reported accounting basis; it does not authorize historical comparability. The source separately states prospective TT99 adoption without reclassifying comparatives. The independent supplementary EasyOCR attempt remains unreconciled and is not asserted as a clean agreeing reader.']}
 assert validate(proof)
 for key,value in [('value','IFRS'),('bodyHash','0'*64),('page',17),('dimension','REPORTING_SCOPE'),('verificationMethod','TWO_CLEAN_OCR_READERS'),('independentHumanApproval','FAKE'),('originalLexicalLines',CLAUSES[:-1]),('renderSha256','0'*64)]:
  bad=copy.deepcopy(proof);bad[key]=value;assert not validate(bad),key
 f.write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n')
 original=next(q for q in json.loads((B/'qualifications.json').read_text()) if q['bodyHash']==BODY);q=copy.deepcopy(original);q['accountingBasis']='VAS';q['contentEvidencePages']['ACCOUNTING_BASIS']=[16];q['accountingBasisSourceImageProof']={'file':str(f),'sha256':sha(f)}
 (B/'gas-accounting-basis-qualification-override.json').write_text(json.dumps([q],ensure_ascii=False,indent=2)+'\n');print(json.dumps({'qualificationOverrides':1,'negativeControls':8}))
if __name__=='__main__':main()
