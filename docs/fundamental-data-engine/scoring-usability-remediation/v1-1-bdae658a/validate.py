"""Fresh full audit revalidation for final v1.1 state; no reuse of prior PASS results."""
from pathlib import Path
import json,hashlib,collections,decimal,concurrent.futures,sqlite3,ast
O=Path(__file__).resolve().parent;R=O.parents[3];V=R/'docs/fundamental-data-engine/scoring-usability-audit/v1-ad81bdce';checks=[]
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
m=load(O/'VN30_ISSUER_RUBRIC_MATRIX.json');old=load(V/'VN30_ISSUER_RUBRIC_MATRIX.json');rows=m['rows'];ledger=load(O/'FINANCIAL_EVIDENCE_LEDGER.json');oldledger=load(V/'FINANCIAL_EVIDENCE_LEDGER.json');pins=load(O/'SOURCE_PINS.json');before=load(O/'protected-before.json');calcs=load(V/'DERIVED_HISTORICAL_METRICS.json');cov=load(V/'FINANCIAL_COVERAGE.json');sem=load(O/'SEMANTIC_COVERAGE_CLOSURE.json');dep=load(O/'RUBRIC_DEPENDENCY_MATRIX.json')
spec=(R/'src/domain/scoring/methodology.ts').read_text();spec=json.loads(spec.split('deepFreeze(',1)[1].rsplit(');',1)[0]);required={s['id']:s['topics']for s in spec}
check('690 unique issuer rubric instances',len(rows)==len({r['id']for r in rows})==690)
check('30 issuers each 23',len({r['ticker']for r in rows})==30 and all(v==23 for v in collections.Counter(r['ticker']for r in rows).values()))
check('unchanged M3 IDs topics maxima',all({r['rubric']for r in rows if r['ticker']==t}==set(required)for t in {r['ticker']for r in rows})and all(r['requiredTopics']==required[r['rubric']]and r['maxPointsUnchanged']==next(s['max']for s in spec if s['id']==r['rubric'])for r in rows))
check('exact classification counts',dict(collections.Counter(r['primaryClassification']for r in rows))=={k:v for k,v in m['primaryCounts'].items()if v})
check('no unproven missing assertion',not any(r['primaryClassification']=='GENUINELY_MISSING'for r in rows))
check('mapping gaps have exact existing source records',all(r['evidenceIds']and all(i in ledger for i in r['evidenceIds'])for r in rows if r['primaryClassification']=='MAPPING_GAP'))
check('policy blockers have exact policy and code refs',all(r.get('formalGateReferences')and any(x['path'].endswith('scorecard.ts')for x in r['formalGateReferences'])and any(x['path'].endswith('SCORING_ENGINE.md')for x in r['formalGateReferences'])for r in rows if r['primaryClassification']=='POLICY_OR_MODEL_BLOCKER'))
check('25 challenged assessments preserved exactly by binding',sum(r['existingResearchAssessment']is not None for r in rows)==25 and all(r['existingResearchAssessment']==next(x['existingResearchAssessment']for x in old['rows']if x['id']==r['id'])for r in rows))
tcb=next(r for r in rows if r['id']=='TCB:FH-BS');otcb=next(r for r in old['rows']if r['id']=='TCB:FH-BS')
check('TCB bounded historical draft preserved',tcb['latestP26Underwriting']==otcb['latestP26Underwriting']and tcb['latestP26MandatoryTopicsQualified']is True and tcb['latestP26FormalPoints']is None)
check('all formal points scores decisions null',all(r['formalPoints']is None and r['qualifiedScore']is None and r['formalDecision']is None for r in rows)and m['totalScore']is None and m['productionAdmissible']is False)
check('no native formal ScoreInput invented',all(not c['fullScoreInputPresent']for c in cov))
check('original financial ledger parity',all(ledger[k]==v for k,v in oldledger.items()),{'unchangedEntries':len(oldledger)})
check('new ledger entries text context only',all(v['unit']=='TEXT'and v['quality']=='UNQUALIFIED_RETAINED_TEXT_CONTEXT'and v['productionAdmissible']is False and v['periodStart']is None and v['periodEnd']is None and v['publicationAt']is None for k,v in ledger.items()if k not in oldledger))
check('bank scored context excludes industrial cash conversion',all(ledger[i]['concept']not in ['CFO','FCF','CFO_REPORTED_NPAT','CUMULATIVE_CFO_REPORTED_NPAT','POST_ACQUISITION_CASH']for r in rows if r['sector']=='BANK'for i in r['evidenceIds']))
# Resolve old and recovered source pointers by file; narratives stay context, never full-topic proof.
refs=collections.defaultdict(set);bindingErrors=[]
def walk(d):
 if isinstance(d,dict):
  if 'path'in d and 'jsonPointer'in d and 'sha256'in d:
   refs[d['path']].add(d['jsonPointer'])
   if d['path']in pins and d['sha256']!=pins[d['path']]:bindingErrors.append(d['path'])
  for v in d.values():walk(v)
 elif isinstance(d,list):
  for v in d:walk(v)
for d in [m,ledger,sem,calcs,dep]:walk(d)
errors=[];n=0
for p,pts in refs.items():
 try:
  d=load(R/p)if(R/p).suffix=='.json'else(R/p).read_text()
  for c in [x for x in calcs if x['operands'][0]['path']==p]:
   a,b=[pointer(d,r['jsonPointer'])for r in c['operands']]
   check('operand dimensions '+c['id'],all(a.get(k)==b.get(k)for k in ['periodStart','periodEnd','reportingScope','revisionKind'])and a['normalized']['unit']==b['normalized']['unit']and a['normalized'].get('currency')==b['normalized'].get('currency')and a['reportingScope']=='CONSOLIDATED'and a['quality']==b['quality']=='VALID'and[a['normalized']['value'],b['normalized']['value']]==c['originalValues'])
  for pt in pts:
   if pt:pointer(d,pt)
   n+=1
 except Exception as e:errors.append({'path':p,'error':str(e)})
check('all source JSON pointers resolve',not errors,{'pointers':n,'errors':errors})
check('binding hashes match pinned inputs',not bindingErrors,bindingErrors)
D=decimal.Decimal;decimal.getcontext().prec=50
for c in calcs:check('Decimal parity '+c['id'],str(D(c['originalValues'][0])/D(c['originalValues'][1]))==c['value'])
# Every protected code, old audit, authority and source input is freshly rehashed once.
paths=sorted(set(before)|set(pins))
def digest(p):
 path=R/p
 if not path.is_file():return p,None,False
 h=hashlib.sha256();tail=b'';found=False;scan=p.startswith(('src/','app/'))and path.suffix in ['.ts','.tsx','.mjs','.json']
 with path.open('rb')as f:
  for chunk in iter(lambda:f.read(1048576),b''):
   h.update(chunk)
   if scan:
    combined=tail+chunk;found=found or b'scoring-usability-remediation'in combined;tail=combined[-64:]
 return p,h.hexdigest(),found
actual={};runtimeImports=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=8)as ex:
 for p,h,found in ex.map(digest,paths):
  actual[p]=h
  if found:runtimeImports.append(p)
changed=[p for p,h in before.items()if actual[p]!=h];sourceChanged=[p for p,h in pins.items()if actual[p]!=h]
check('all protected accepted code policy audit data authority bytes unchanged',not changed,{'files':len(before),'changed':changed})
check('all old and new source pins unchanged',not sourceChanged,{'pins':len(pins),'changed':sourceChanged})
priorDB=load(V/'BASELINE_FINGERPRINTS.json')['data/vn30.sqlite'];check('database matches pre-audit and pre-remediation bytes',actual['data/vn30.sqlite']==before['data/vn30.sqlite']==priorDB,{'sha256':actual['data/vn30.sqlite']})
# Current configured DB, immutable read-only. No historical/current data is admitted or overwritten.
c=sqlite3.connect('file:'+str(R/'data/vn30.sqlite')+'?mode=ro&immutable=1',uri=True);head=c.execute('select body_hash from market_boundary_dependency_head').fetchone()[0];body=json.loads(c.execute('select body from dependency_release where body_hash=?',(head,)).fetchone()[0]);u=next(x for x in body['heads']if x['type']=='UNIVERSE');rd=next(x for x in body['heads']if x['type']=='REFERENCE_DATA');stored={t:c.execute('select count(*)from '+t).fetchone()[0]for t in ['analytical_artifact','scoring_dataset_binding']};c.close();master=load(V/'CONFIGURED_MASTER_RECEIPT.json')
check('current configured universe parity',u['content']==master['universe']['content']and{r['ticker']for r in rows}=={s['ticker']for s in u['content']['identities']})
check('current configured sector security parity',rd['content']==master['referenceData']['content'])
check('no formal artifact or score binding written',stored==load(V/'STORED_SCORING_INVENTORY.json')['counts'],stored)
# Exact accepted authority pin checks, without invoking any activation or changing a seal.
a=load(R/'src/infrastructure/dependencies/active-authorities.json');authoritypins=[a['authorityBundle']]+a['bindings'];check('active authority pins unchanged and valid',all(sha(R/p['path'])==p['sha256']for p in authoritypins))
approval=load(R/'docs/fundamental-data-engine/evidence/2026-10-29-approved-authority-activation/OWNER_APPROVAL_RECEIPT.json');proposal=load(O/'PATCH_PROPOSAL_MANIFEST.json');check('prior approval explicitly excludes future changed bytes','future changed bytes'in approval['excluded']and proposal['activated']is False and proposal['approvalStatus']=='PENDING')
# Semantic review completeness is distinct from full topic/rating completion.
targets={r['id']for r in old['rows']if r['primaryClassification']=='NOT_INSPECTED'};check('exact 250 targets reviewed once',len(sem['rows'])==len({r['id']for r in sem['rows']})==250 and{r['id']for r in sem['rows']}==targets)
check('non-target primary dispositions preserved',all(r['primaryClassification']==next(x['primaryClassification']for x in old['rows']if x['id']==r['id'])for r in rows if r['id']not in targets))
check('closure primary classes match final matrix',all(r['afterPrimaryClassification']==next(x['primaryClassification']for x in rows if x['id']==r['id'])for r in sem['rows']))
check('semantic context never pretends full topic proof',all(r['assessmentComplete']is False and r['humanApproval']is None and all(t['fullTopicQualified']is False for t in r['topics'])for r in sem['rows']))
check('unqualified full topics have exact resolution and issuer judgment',all(r['issuerSpecificJudgment']and r['counterevidenceAndRequiredResolution']and all(t['requiredResolution']and not t['negativeSearchIsAbsenceProof']for t in r['topics'])for r in sem['rows']))
check('zero new completed full-topic assessments stated honestly',sem['newCompletedFullTopicAssessments']==0 and sem['formalScoreableNow']==0)
check('all 690 dependency instances',len(dep['rows'])==len({r['id']for r in dep['rows']})==690)
check('mandatory topics cannot become optional',all({x['topic']for x in r['dependencies']if x['kind']=='TOPIC'and x['role']=='REQUIRED'}==set(required[r['rubric']])for r in dep['rows']))
check('all roles explicit and matrix unactivated',all(x['role']in ['REQUIRED','SUPPORTING','CONTEXT_ONLY']for r in dep['rows']for x in r['dependencies']+r['contextOnly'])and dep['productionAdmissible']is False)
ba=load(O/'BEFORE_AFTER_COUNTS.json');check('before after totals and exact transitions',ba['before']==old['primaryCounts']and ba['after']==m['primaryCounts']and sum(x['count']for x in ba['transitions'])==250 and sum(ba['before'].values())==sum(ba['after'].values())==690)
# Exact unit regression, existing baseline and static application/typecheck receipts.
red=load(O/'g2-g3-red.json');green=load(O/'gate-regression-green.json');base=load(O/'baseline-regression.json');exe=load(O/'execution-receipts.json')
check('focused RED records exactly two expected regressions',red['numFailedTests']==2 and red['success']is False)
check('final proposed regression and role tests all pass',green['success']and green['numFailedTests']==0,{'passed':green['numPassedTests'],'total':green['numTotalTests']})
check('selected accepted baseline tests all pass',base['success']and base['numFailedTests']==0,{'passed':base['numPassedTests'],'total':base['numTotalTests']})
check('exact typecheck boundary and unapplied patch receipts pass',all(x['exitCode']==0 for x in exe['receipts'])and exe['nodeVersion']=='v22.23.2',exe)
check('candidate refuses FORMAL and no runtime source imports proposal','UNAPPROVED_PATCH_CANNOT_SCORE_FORMAL'in(O/'candidate/scorecard.ts').read_text()and not runtimeImports and not(R/'src/domain/scoring/action-dependencies.ts').exists())
proposalBody={k:v for k,v in proposal.items()if k!='contentHash'}
check('proposal canonical content hash valid',hashlib.sha256(json.dumps(proposalBody,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode()).hexdigest()==proposal['contentHash'])
check('proposed patch binds exact candidate source bytes',sha(O/'scoring-g2-g3.proposed.patch')==proposal['patch']['sha256']and all(sha(R/a['reviewHarness'])==a['reviewHarnessSha256']for a in proposal['artifacts']))
for py in O.glob('*.py'):ast.parse(py.read_text())
check('audit helper syntax',True)
requiredFiles=['TARGETED_REMEDIATION_REVIEW.md','SCORING_GATE_REGRESSION_RESULTS.md','RUBRIC_DEPENDENCY_MATRIX.json','SEMANTIC_COVERAGE_CLOSURE.json','VN30_USABILITY_BEFORE_AFTER.md','VALIDATION.md','FINAL_REVIEW.md'];check('all seven deliverables',all((O/p).is_file()for p in requiredFiles))
result={'contract':'vn30-targeted-remediation-validation-v1.1','baselineCommit':m['baselineCommit'],'execution':'FRESH_FULL_FINAL_STATE_CHECKS_NOT_REUSED_V1_PASS','pass':all(x['pass']for x in checks),'checks':checks,'limits':['No full application/release or independent human acceptance.','Semantic review established partial context and exact unresolved products, not full topic qualification.','Source JSON/value bytes are rehashed; all original PDFs are not re-extracted/re-OCRed.','Accepted executable, M3/M4 policy and production admission unchanged.']};(O/'validation-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
can=lambda d:json.dumps(d,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode();(O/'manifest.json').write_text(json.dumps({'baselineCommit':m['baselineCommit'],'matrixCanonicalSha256':hashlib.sha256(can(m)).hexdigest(),'canonicalization':'UTF-8 sort_keys=True separators=(comma,colon) ensure_ascii=False; no newline','files':{str(p.relative_to(O)):sha(p)for p in sorted(O.rglob('*'))if p.is_file()and p.name!='manifest.json'}},indent=2)+'\n')
print(json.dumps({'pass':result['pass'],'checks':len(checks),'failed':[x for x in checks if not x['pass']]}),flush=True)
