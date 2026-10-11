"""Append an independent OCR attempt for exact retained exception pages.

Original two-reader outputs and renders are immutable inputs to this attempt.
This script does not reconcile, qualify or admit any financial cell.
"""
import argparse, datetime, hashlib, importlib.metadata, json, pathlib, subprocess

import easyocr
from PIL import Image

B = pathlib.Path('data/initialization-08b-remediation-work')
T = B / 'ocr-third-reader'
T.mkdir(exist_ok=True)
runtime = pathlib.Path('/private/tmp/vn30-third-ocr-runtime')
reader = easyocr.Reader(['vi', 'en'], gpu=False,
                        model_storage_directory=str(runtime / 'models'),
                        user_network_directory=str(runtime / 'networks'), verbose=False)
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
dependencies = subprocess.check_output([str(runtime/'bin/python'),'-m','pip','freeze'],text=True)
models = [{'file':str(p),'sha256':sha(p)} for p in sorted((runtime/'models').glob('*.pth'))]
args = argparse.ArgumentParser()
args.add_argument('--selection', default=str(B / 'third-ocr-pilot-selection.json'))
selection_file = pathlib.Path(args.parse_args().selection)
assert selection_file.resolve().parent == B.resolve(), 'SELECTION_OUTSIDE_CONTROLLED_WORK_DIRECTORY'
selection = json.loads(selection_file.read_text())
for d in selection:
    body = B / (d['bodyHash']+'.pdf')
    assert sha(body)==d['bodyHash']
    for n in d['pages']:
        out = T / f'{d["bodyHash"]}-p{n}.json'
        original = B / 'ocr' / f'{d["bodyHash"]}-p{n}.json'
        p = json.loads(original.read_text())
        render = original.with_suffix('.png')
        assert p['bodyHash']==d['bodyHash'] and p['page']==n and p['renderSha256']==sha(render)
        if out.exists():
            retained = json.loads(out.read_text())
            assert retained['bodyHash']==d['bodyHash'] and retained['page']==n
            assert retained['originalOcrProofFile']==str(original) and retained['originalOcrProofSha256']==sha(original)
            assert retained['renderFile']==str(render) and retained['renderSha256']==sha(render)
            assert retained['engine']=='EASYOCR_1.7.2_VI_EN_LATIN_CPU_IMAGE_OCR' and retained['packageVersion']=='1.7.2'
            assert retained['independentHumanApproval'] is None
            print(json.dumps({'ticker':d['ticker'],'page':n,'status':'REUSED_UNCHANGED_RETAINED_ATTEMPT','admittedCells':0}),flush=True)
            continue
        with Image.open(render) as im:
            width,height=im.size
        words=[]
        for bbox,text,confidence in reader.readtext(str(render),detail=1,paragraph=False):
            xs,ys=[float(v[0]) for v in bbox],[float(v[1]) for v in bbox]
            words.append({'text':text,'confidence':float(confidence),
                          'x':min(xs)/width,'y':min(ys)/height,
                          'width':(max(xs)-min(xs))/width,'height':(max(ys)-min(ys))/height})
        words.sort(key=lambda w:(w['y'],w['x']))
        packet={'status':'SUPPLEMENTARY_OCR_ATTEMPT_NOT_RECONCILED_NOT_APPROVED',
                'recordedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),
                'bodyHash':d['bodyHash'],'page':n,'ticker':d['ticker'],
                'originalOcrProofFile':str(original),'originalOcrProofSha256':sha(original),
                'renderSha256':sha(render),'renderFile':str(render),
                'engine':'EASYOCR_1.7.2_VI_EN_LATIN_CPU_IMAGE_OCR','words':words,
                'packageVersion':importlib.metadata.version('easyocr'),
                'dependencies':dependencies,'modelArtifacts':models,
                'selectionFile':str(selection_file),'selectionSha256':sha(selection_file),
                'independentHumanApproval':None}
        out.write_text(json.dumps(packet,ensure_ascii=False,indent=2)+'\n')
        print(json.dumps({'ticker':d['ticker'],'page':n,'words':len(words),'admittedCells':0}),flush=True)
