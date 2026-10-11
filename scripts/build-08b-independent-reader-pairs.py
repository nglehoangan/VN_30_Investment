"""Bind supplementary attempts to untouched original reader/render evidence."""
import hashlib, json, pathlib

B=pathlib.Path('data/initialization-08b-remediation-work')
T=B/'ocr-independent-reader-pairs';T.mkdir(exist_ok=True)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
count=0
for f in sorted((B/'ocr-third-reader').glob('*.json')):
    third=json.loads(f.read_text())
    original=pathlib.Path(third['originalOcrProofFile'])
    assert original.resolve().parent==(B/'ocr').resolve()
    assert sha(original)==third['originalOcrProofSha256']
    p=json.loads(original.read_text())
    assert p['bodyHash']==third['bodyHash'] and p['page']==third['page']
    assert p['renderSha256']==third['renderSha256']==sha(original.with_suffix('.png'))
    assert third['engine']=='EASYOCR_1.7.2_VI_EN_LATIN_CPU_IMAGE_OCR'
    assert third['packageVersion']=='1.7.2' and len(third['modelArtifacts'])==2
    # Prefer precise word geometry for extraction; the original Vision stream
    # remains an independent verification reader, with its region geometry.
    pair={**p,'engineA':third['engine'],'engineB':p['engineA'],
          'passA':third['words'],'passB':p['passA'],
          'status':'INDEPENDENT_READER_PAIR_NOT_RECONCILED_NOT_APPROVED',
          'sourceOriginalOcrProofFile':str(original),'sourceOriginalOcrProofSha256':sha(original),
          'sourceThirdReaderProofFile':str(f),'sourceThirdReaderProofSha256':sha(f),
          'independentHumanApproval':None}
    out=T/f.name
    out.write_text(json.dumps(pair,ensure_ascii=False,indent=2)+'\n');count+=1
print(json.dumps({'independentReaderPairs':count,'admittedCells':0}))
