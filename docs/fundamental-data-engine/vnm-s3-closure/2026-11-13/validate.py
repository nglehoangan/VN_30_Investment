from pathlib import Path
import sys,json,hashlib,subprocess,os,unittest,re,unicodedata
sys.dont_write_bytecode=True
R=Path(__file__).resolve().parents[4];O=Path(__file__).resolve().parent
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();read=lambda n:json.loads((O/n).read_text())
subprocess.run(['python3',str(O/'build.py')],cwd=R,check=True)
m=read('S3_EVIDENCE_MATRIX.json');a=read('S3_IC_POS_ASSESSMENT.json');p=read('SOURCE_PINS.json');checks=[]
def check(name,ok):
 if not ok:raise AssertionError(name)
 checks.append(name)
check('all input protected and script pins match',all(sha(R/x['path'])==x['sha256'] for v in p.values() if isinstance(v,list) for x in v))
method=(R/'src/domain/scoring/methodology.ts').read_text();part=method[method.index('"id": "IC-POS"'):method.index('"id": "IC-CYCLE"')];topics=json.loads(re.search(r'"topics":\s*(\[[^\]]*\])',part).group(1));check('mandatory topics match executable RUBRICS',set(topics)=={x['topic'] for x in a['mandatoryTopicAssessments']})
notes=json.loads((R/'data/manual-extracted-pdf/notes/VNM.json').read_text())
retained=json.loads((R/'docs/fundamental-data-engine/vnm-shared-evidence-products/2026-11-11/evidence-products.json').read_text())['positionDefinitions']
check('original retained position source identities match',all(sha(R/x['source']['path'])==x['source']['sha256'] and sha(R/x['source']['pdfPath'])==x['source']['pdfSha256'] for x in retained if 'source' in x))
for row in m['evidence']:
 for s in row['sourceRefs']:
  if 'pdfPath' in s:
   check('source bytes '+row['id']+' page'+str(s['physicalPage']),sha(R/s['pdfPath'])==s['pdfSha256'])
# Existing annual report is native text. Verify selected claim fragments against original,
# without reacquisition or generating OCR/images.
import pymupdf
pdf=R/'data/manual-download/VNM/VNM_Baocaothuongnien_2025.pdf';doc=pymupdf.open(pdf)
def norm(x):return re.sub(r'\s+',' ',unicodedata.normalize('NFC',x)).lower()
native=[]
for pg,tokens in [(26,['NielsenIQ','-2,4%']),(27,['khả năng chuyển toàn bộ chi phí','cạnh tranh']),(35,['hệ thống bán hàng nội địa']),(41,['logistics','kiểm soát chi phí']),(46,['100 sản phẩm','hàng trăm cửa hàng','0,3%']),(60,['9/10','14 lần/năm','Năm thứ 13'])]:
 text=doc[pg-1].get_text();assert all(norm(t) in norm(text) for t in tokens),(pg,tokens)
 native.append({'pdfPath':str(pdf.relative_to(R)),'pdfSha256':sha(pdf),'physicalPage':pg,'tokens':tokens,'status':'NATIVE_TEXT_MATCH','meaning':'Issuer text only, not independent verification of attributed market/brand panel.'})
check('selected annual claim fragments match original native PDF',len(native)==6)
(O/'SOURCE_NATIVE_CHECKS.json').write_text(json.dumps({'checks':native,'networkRequests':0,'pdfChanged':False},ensure_ascii=False,indent=2,sort_keys=True)+'\n')
check('no source data request or formal numeric score',read('S3_ACCEPTANCE.json')['newUserInformationRequired']==False and a['formalPoints'] is None and a['researchScoringBand'] is None)
check('S1 S2 existing closure unchanged',json.loads((R/'docs/fundamental-data-engine/vnm-s1-closure/2026-11-13/S1_ACCEPTANCE.json').read_text())['status']=='CLOSED' and json.loads((R/'docs/fundamental-data-engine/vnm-s2-public-disclosure/2026-11-13/S2_CLOSURE_ACCEPTANCE.json').read_text())['status']=='CLOSED')
r=unittest.TextTestRunner().run(unittest.defaultTestLoader.discover(str(O),pattern='test_s3.py'));check('21 focused definition provenance authority tests',r.wasSuccessful() and r.testsRun==21)
outputs=['S3_COMPETITIVE_POSITION_RESOLUTION.md','S3_EVIDENCE_MATRIX.json','S3_IC_POS_ASSESSMENT.json','S3_ACCEPTANCE.json','CURRENT_BLOCKER_REGISTER.md','SOURCE_PINS.json'];before={n:sha(O/n) for n in outputs};subprocess.run(['python3',str(O/'build.py')],cwd=R,check=True);check('deterministic replay',before=={n:sha(O/n) for n in outputs})
env={**os.environ,'PATH':'/private/tmp/node-v22.23.2-darwin-arm64/bin:'+os.environ['PATH']}
subprocess.run([str(R/'node_modules/.bin/vitest'),'run','--config','docs/fundamental-data-engine/vnm-s2-liquidity/2026-11-13/vitest.config.mjs','--reporter=json','--outputFile=/private/tmp/vnm-s3-m3-tests.json'],cwd=R,env=env,check=True,stdout=subprocess.DEVNULL)
t=json.loads(Path('/private/tmp/vnm-s3-m3-tests.json').read_text());check('104 existing M3 score and normalization tests pass',t['numPassedTests']==104 and t['numFailedTests']==0)
check('source portfolio DB and scoring bytes unchanged after replay',all(sha(R/x['path'])==x['sha256'] for v in p.values() if isinstance(v,list) for x in v))
report={'contract':'vnm-s3-validation-v1','result':'PASS','S3':'CLOSED','checks':checks,'pythonTests':{'passed':r.testsRun,'failed':0},'typeScriptTests':{'passed':104,'failed':0},'deterministicReplay':{'status':'PASS','hashes':before},'nativeSourceCheckArtifactSha256':sha(O/'SOURCE_NATIVE_CHECKS.json'),'sourceProtectedDatabasePortfolioAndScoringBytes':'UNCHANGED','newNetworkAcquisitions':0,'formalPoints':None,'sourceAuthorityChanged':False,'S5Executed':False,'productionActivation':'NOT_AUTHORIZED','scope':'Research conclusion integrity, not formal scoring provenance or independent original market-panel qualification.'}
(O/'VALIDATION.json').write_text(json.dumps(report,indent=2,sort_keys=True)+'\n');print(json.dumps({'result':'PASS','S3':'CLOSED','pythonTests':r.testsRun,'typeScriptTests':104,'S5Executed':False}))
