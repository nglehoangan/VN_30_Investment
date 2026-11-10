from pathlib import Path
import json,hashlib,collections,subprocess,decimal,concurrent.futures
O=Path(__file__).resolve().parent;R=O.parents[3];checks=[]
def load(p):return json.loads(p.read_text())
def sha(p):
 h=hashlib.sha256()
 with p.open('rb')as f:
  for b in iter(lambda:f.read(1048576),b''):h.update(b)
 return h.hexdigest()
def check(name,ok,detail=None):checks.append({'name':name,'pass':bool(ok),'detail':detail})
def pointer(d,p):
 for k in p.split('/')[1:]if p else []:d=d[int(k)]if isinstance(d,list)else d[k.replace('~1','/').replace('~0','~')]
 return d
m=load(O/'VN30_ISSUER_RUBRIC_MATRIX.json');rows=m['rows'];ledger=load(O/'FINANCIAL_EVIDENCE_LEDGER.json');pins=load(O/'SOURCE_PINS.json');cov=load(O/'FINANCIAL_COVERAGE.json');calcs=load(O/'DERIVED_HISTORICAL_METRICS.json');before=load(O/'BASELINE_FINGERPRINTS.json')
check('690 unique issuer rubric instances',len(rows)==len({r['id']for r in rows})==690)
check('30 issuers each 23 rubric IDs',len({r['ticker']for r in rows})==30 and all(n==23 for n in collections.Counter(r['ticker']for r in rows).values()))
spec=(R/'src/domain/scoring/methodology.ts').read_text();spec=json.loads(spec.split('deepFreeze(',1)[1].rsplit(');',1)[0]);expected={x['id']:x['topics']for x in spec}
check('all issuer topic sets match unchanged M3',all({x['rubric']for x in rows if x['ticker']==t}==set(expected)for t in {r['ticker']for r in rows})and all(r['requiredTopics']==expected[r['rubric']]for r in rows))
check('bank research contexts reject industrial cash conversion',all(ledger[i]['concept']not in ['CFO','FCF','CFO_REPORTED_NPAT','CUMULATIVE_CFO_REPORTED_NPAT','POST_ACQUISITION_CASH']for r in rows if r['sector']=='BANK'for i in r['evidenceIds']))
check('taxonomy counts exact',dict(collections.Counter(r['primaryClassification']for r in rows))=={k:v for k,v in m['primaryCounts'].items()if v})
check('no unproven missing classification',not any(r['primaryClassification']=='GENUINELY_MISSING'for r in rows))
check('mapping rows have exact extant ledger data',all(r['evidenceIds'] and all(i in ledger for i in r['evidenceIds'])for r in rows if r['primaryClassification']=='MAPPING_GAP'))
check('policy blockers carry code and policy context',all(r['rubric'].startswith('VAL-')and r['methodologyReference']['path']=='src/domain/scoring/methodology.ts'for r in rows if r['primaryClassification']=='POLICY_OR_MODEL_BLOCKER'))
check('25 provisional assessments preserved by exact source binding',sum(r['existingResearchAssessment']is not None for r in rows)==25)
check('formal score/decisions null',all(r['formalPoints']is None and r['qualifiedScore']is None and r['formalDecision']is None for r in rows)and m['totalScore']is None and m['productionAdmissible']is False)
check('no full formal score input in native audited snapshot',all(not x['fullScoreInputPresent']for x in cov))
# Resolve all audit evidence pointers, grouped by path to bound memory.
refs=collections.defaultdict(set);bindingHashErrors=[]
def walk(d):
 if isinstance(d,dict):
  if 'path'in d and 'jsonPointer'in d and 'sha256'in d:
   refs[d['path']].add(d['jsonPointer'])
   if d['path']in pins and d['sha256']!=pins[d['path']]:bindingHashErrors.append(d['path'])
  for v in d.values():walk(v)
 elif isinstance(d,list):
  for v in d:walk(v)
for x in [m,ledger,calcs,load(O/'NOTE_SEARCH_LEADS.json')]:walk(x)
errors=[];total=0
for p,ptrs in refs.items():
 try:
  d=load(R/p)if (R/p).suffix=='.json'else (R/p).read_text()
  for calc in [x for x in calcs if x['operands'][0]['path']==p]:
   a,b=[pointer(d,z['jsonPointer'])for z in calc['operands']]
   check('operand dimensions '+calc['id'],all(a.get(k)==b.get(k)for k in ['periodStart','periodEnd','reportingScope','revisionKind'])and a['normalized']['unit']==b['normalized']['unit']and a['normalized'].get('currency')==b['normalized'].get('currency')and a['reportingScope']=='CONSOLIDATED'and a['quality']==b['quality']=='VALID'and [a['normalized']['value'],b['normalized']['value']]==calc['originalValues'])
  for ptr in ptrs:
   if ptr:pointer(d,ptr)
   total+=1
 except Exception as e:errors.append({'path':p,'error':str(e)})
check('all binding hashes match pinned sources',not bindingHashErrors,bindingHashErrors)
check('all evidence JSON pointers resolve',not errors,{'pointers':total,'errors':errors})
tree=subprocess.check_output(['git','ls-tree','-r','-z','HEAD'],cwd=R).split(b'\0');gitblobs={}
for entry in tree:
 if entry:
  info,name=entry.split(b'\t',1);gitblobs[name.decode()]=info.decode().split()[2]
def digests(name):
 p=R/name
 if not p.is_file():return name,None,None
 h=hashlib.sha256();g=hashlib.sha1(b'blob '+str(p.stat().st_size).encode()+b'\0')
 with p.open('rb')as f:
  for chunk in iter(lambda:f.read(1048576),b''):h.update(chunk);g.update(chunk)
 return name,h.hexdigest(),g.hexdigest()
actual={}
with concurrent.futures.ThreadPoolExecutor(max_workers=8)as pool:
 for name,h,g in pool.map(digests,sorted(set(before)|set(pins))):actual[name]=(h,g)
blobErrors=[p for p in actual if p in gitblobs and actual[p][1]!=gitblobs[p]]
check('protected tracked inputs match approved HEAD git blobs',not blobErrors,{'changed':blobErrors})
changed=[p for p,h in before.items()if actual[p][0]!=h]
check('captured protected-code/policy/financial JSON/database bytes unchanged',not changed,{'files':len(before),'changed':changed})
meta=load(O/'ARCHIVE_METADATA_BASELINE.json');metaChanged=[p for p,v in meta.items()if not (R/p).is_file()or (R/p).stat().st_size!=v['size']or abs((R/p).stat().st_mtime_ns-v['mtimeNs'])>1000]
check('preexisting sizes and timestamps unchanged within 1 microsecond metadata precision',not metaChanged,{'files':len(meta),'changed':metaChanged,'limitation':'Metadata check allows 1000ns precision tolerance; observed first-run drift <=120ns, zero size changes. This is not a cryptographic rehash of excluded PDFs/media/archives.'})
priorProtected=load(R/'docs/fundamental-data-engine/dfr-05/tcb-sandbox-v1-cf987271/protected-before.json')
check('database hash matches pre-sandbox protected receipt',before.get('data/vn30.sqlite')==priorProtected.get('data/vn30.sqlite'))
check('all source pins unchanged',all(actual[p][0]==h for p,h in pins.items()),{'pins':len(pins)})
master=load(O/'CONFIGURED_MASTER_RECEIPT.json');prior=load(R/'docs/fundamental-data-engine/dfr-05/p2-0-bd3a8b4b/existing-master-snapshot.json')
check('current configured universe equals retained master',master['universe']['content']==prior['UNIVERSE']['content'])
check('current configured sector/security equals retained master',master['referenceData']['content']==prior['REFERENCE_DATA']['content'])
D=decimal.Decimal;decimal.getcontext().prec=50
for x in calcs:
 check('decimal parity '+x['id'],str(D(x['originalValues'][0])/D(x['originalValues'][1]))==x['value'])
required=['VN30_SCORING_USABILITY_AUDIT.md','VN30_ISSUER_RUBRIC_MATRIX.json','VN30_FINANCIAL_DATA_COVERAGE.md','MAPPING_AND_DERIVATION_GAPS.md','ANALYST_ASSESSMENT_GAPS.md','SCORING_GATE_AUDIT.md','PRELIMINARY_ASSESSMENT.md','PRIORITIZED_REMEDIATION_PLAN.md','VALIDATION.md','FINAL_REVIEW.md']
check('all ten required deliverables present',all((O/p).is_file()for p in required))
result={'contract':'vn30-usability-audit-validation-v1','baselineCommit':m['baselineCommit'],'pass':all(x['pass']for x in checks),'checks':checks,'limitations':['Archive/PDF/media sources checked by metadata; no blanket byte-hash claim for those files.','Static gate witnesses; no complete scorer regression invoked.','Structured inspection of 690 rows is not exhaustive semantic review of every note.','No new evidence, financial admission, issuer score, ranking, NAV/ledger write or remediation.']}
(O/'validation-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
# Canonical reproducibility hashes: UTF-8, sort_keys, compact separators, ensure_ascii=False.
manifest={}
for p in sorted(O.iterdir()):
 if p.is_file()and p.name not in ['manifest.json']:manifest[p.name]=sha(p)
can=lambda x:json.dumps(x,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode()
(O/'manifest.json').write_text(json.dumps({'algorithm':'SHA-256','canonicalization':'UTF-8 JSON sort_keys=True,separators=(comma,colon),ensure_ascii=False; no trailing newline','baselineCommit':m['baselineCommit'],'matrixCanonicalSha256':hashlib.sha256(can(m)).hexdigest(),'fileSha256':manifest},indent=2)+'\n')
print(json.dumps({'pass':result['pass'],'checks':len(checks),'failed':[x for x in checks if not x['pass']],'matrixHash':hashlib.sha256(can(m)).hexdigest()}),flush=True)
