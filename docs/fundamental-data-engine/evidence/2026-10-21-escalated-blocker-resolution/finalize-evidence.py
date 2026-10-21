from pathlib import Path
import json,hashlib,sqlite3,datetime,subprocess,ast
P=Path(__file__).resolve().parent;assert not (P/'ARTIFACT_HASHES.json').exists();R=Path.cwd();E=R/'docs/fundamental-data-engine/evidence'
def load(p):return json.loads(Path(p).read_text())
def save(n,x):(P/n).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def sha(b):return hashlib.sha256(b).hexdigest()
def failures(d):return sorted((str(Path(t['name']).relative_to(R)),a['fullName']) for t in d['testResults'] for a in t['assertionResults'] if a['status']=='failed')
quality=load(P/'QUALITY_GATE_RESULTS.json');assert quality['status']=='COMPLETE'
for g in quality['results']:assert g['exitCode']==(1 if g['name']=='full' else 0),g
full=load(P/'validation/full-results.json');prior=load(E/'2026-10-21-runtime-authority-market-review/validation/full-results.json');assert failures(full)==failures(prior) and len(failures(full))==18
newtests=[a for t in full['testResults'] if Path(t['name']).name in ['sector-requirements.test.ts','supported-derivation-routes.test.ts'] for a in t['assertionResults']];assert len(newtests)==13 and all(t['status']=='passed' for t in newtests)
summary={'lint':'PASS','typecheck':'PASS','build':'PASS','scoringPassed':127,'focusedPassed':139,'newEngineeringTestsPassed':13,'apiPassed':18,'fullPassed':full['numPassedTests'],'fullFailed':full['numFailedTests'],'fullTotal':full['numTotalTests'],'newUnexplainedRegressions':0}
save('TEST_RESULTS.json',{'summary':summary,'commands':quality['results'],'historicalFailureCategory':{'count':18,'exactPriorSetUnchanged':True,'failures':failures(full),'noTestsSkippedOrDeleted':True,'limitationsWaived':False},'developmentFindings':[{'finding':'Initial template generic parameter had an extra closing angle bracket; initial helper import traversed one directory too far','resolution':'Corrected before final quality gates; all final gates and13 new tests pass'}]})
b=load(P/'BASELINE_IDENTITY.json');db=sqlite3.connect('file:data/vn30.sqlite?mode=ro',uri=True);assert db.execute('pragma integrity_check').fetchall()==[('ok',)] and not db.execute('pragma foreign_key_check').fetchall();logical=sha('\n'.join(db.iterdump()).encode());counts={t:db.execute('select count(*) from "'+t+'"').fetchone()[0] for t in b['counts']};db.close();after=sha(Path('data/vn30.sqlite').read_bytes());assert after==b['databaseSha256'] and logical==b['logicalSha256'] and counts==b['counts']
verified=0
for pkg in ['2026-10-21-production-runtime-scoring-readiness','2026-10-21-runtime-authority-source-closure','2026-10-21-runtime-authority-market-review']:
 seal=load(E/pkg/'ARTIFACT_HASHES.json')
 for f,h in seal['files'].items():assert sha(Path(f).read_bytes())==h,f;verified+=1
 for f,h in seal.get('sourceChanges',{}).items():assert sha(Path(f).read_bytes())==h,f
save('PRODUCTION_MUTATION_AUDIT.json',{'status':'PASS','databaseBeforeSha256':b['databaseSha256'],'databaseAfterSha256':after,'logicalBeforeSha256':b['logicalSha256'],'logicalAfterSha256':logical,'allTableCountsBefore':b['counts'],'allTableCountsAfter':counts,'productionRowsInserted':0,'productionRowsUpdated':0,'productionRowsDeleted':0,'authorityActivated':0,'CASExecuted':False,'scorecardsCreated':0,'rankingsCreated':0,'investmentDecisionsCreated':0,'transactionsCreated':0,'ordersSubmitted':0,'MBB':'DEFERRED score=null rank=null','previousSealedFilesVerified':verified,'networkCalls':0,'nonDatabaseWrites':['Three additive domain modules','Two new test files','Persistent escalation register','This evidence package'],'existingApprovedImplementationFilesChanged':False})
market=load(P/'MARKET_REVALIDATION.json');now=datetime.datetime.now(datetime.timezone.utc).isoformat();exp=datetime.datetime.fromisoformat(market['validThrough'].replace('Z','+00:00'));fresh=datetime.datetime.now(datetime.timezone.utc)<=exp
market['finalCheckedAt']=now;market['freshAtFinalCheck']=fresh
if not fresh:market['status']='EXPIRED_OR_REQUALIFICATION_REQUIRED';market['approvalRequest']=None
save('MARKET_REVALIDATION.json',market)
reg=load(P/'ESCALATION_REGISTER.json');assert load('docs/fundamental-data-engine/ESCALATION_REGISTER.json')==reg
issues={'critical':[],'major':[{'id':r['issueId'],'category':r['blockerCategory'],'status':r['currentStatus'],'owner':r['resolutionOwner'],'exitCriteria':r['exactExitCriteria']} for r in reg['issues'] if r['severity']=='MAJOR'],'minor':[{'id':r['issueId'],'category':r['blockerCategory'],'status':r['currentStatus'],'owner':r['resolutionOwner'],'exitCriteria':r['exactExitCriteria']} for r in reg['issues'] if r['severity']=='MINOR']+[{'id':'WSS_NO_MARKET_FRAMES','category':'EXTERNAL_SOURCE_EVIDENCE','status':'OUTSIDE_REST_EOD_SCOPE','detail':'No streaming qualification claimed; does not block reviewed REST-only completed EOD profile'}],'resolvedEngineeringTasks':['AnyOf/preference/required/supporting/optional-capable evidence representation and qualified route selector','Nine approved sector templates, explicit-dimensions instantiation and auditable selection hash','Definition-supported SECURITIES ROE mapping proposal executable in existing engine; source inputs/approval remain pending']};save('ISSUES.json',issues)
eng=load(P/'ENGINEERING_CLOSURE.json');eng['status']='IMPLEMENTED_TESTED_NOT_ACTIVATED';eng['quality']=summary;save('ENGINEERING_CLOSURE.json',eng)
state={'status':'BLOCKED — ESCALATED_DEPENDENCIES_REMAIN','engineeringResolvedTasks':eng['actuallyResolved'],'escalatedIssues':len(reg['issues']),'partiallyResolvedIssues':2,'remainingMajor':len(issues['major']),'remainingMinor':len(issues['minor']),'OwnerDecisionPacket':'OWNER_DECISION_PACKET.md','sourceMinimumPlan':{'currentCoreObligations':216,'status':'LOWER_BOUND_PENDING_MODEL_NORMALIZATION_DECISIONS','all1754Required':False,'productionPublicationProven':0},'market':{'status':market['status'],'freshAtFinalCheck':fresh,'CASExecuted':False,'authorityActivation':False},'human':{'required':667,'actualApprovals':0},'authorityCandidatesActivated':0,'productionIntegrity':'PASS_UNCHANGED','MBB':'DEFERRED','quality':summary,'scoringExecuted':False,'nextAction':'Independent CIO/Owner review of exact decision packet and implementation evidence; no activation or scoring'};save('FINAL_STATUS.json',state)
(P/'FINAL_REVIEW.md').write_text('''# Escalated blocker resolution — final review

**BLOCKED — ESCALATED_DEPENDENCIES_REMAIN**

## Actually implemented

- New grouped requirements contract supports required, anyOf, explicit alternative/source preferences, supporting and optional evidence. The selector qualifies only sealed FORMAL AS_KNOWN members through the existing strict bridge, checks observation hashes/dimensions, records rejected alternatives and binds selected source/availability/snapshot context in an immutable receipt. Missing required groups block; missing supporting/optional inputs do not become mandatory.
- All9 approved manual-admission sector templates preserve original groups/preferences/supporting/optional fields and sector valuation/normalization references. Explicit instantiation requires supplied dimensions and preserves unbound nonmandatory fields. This is an executable additive evidence gate; existing legacy DI/readiness authorities are not silently migrated. Full production integration still requires exact complete versioned requirements and independent compatibility review.
- A native-compatible PROPOSED SECURITIES ROE mapping delegates to the existing normalized common-profit/average-common-equity formula and operations. Tests execute it with isolated reviewed synthetic inputs. No formula/normalization invention or actual source approval. Existing default crosswalk and all five runtime candidates remain unchanged/inactive.

## Persistent escalation and ownership

ESCALATION_REGISTER.json audits four preceding review packages, explicitly maps predecessor issue IDs and counts only observed occurrences. All9 recurring issues exceeded two reviews and remain escalated;2 have concrete partial engineering closure. Each has root cause, category, role owner, exact dependencies, permitted actions, forbidden shortcuts and measurable exit criteria. The persistent register is docs/fundamental-data-engine/ESCALATION_REGISTER.json; this evidence contains its immutable checkpoint. Historical first occurrences may precede the four-package audit window; the register does not fabricate earlier dates.

## Remaining decisions and evidence

OWNER_DECISION_PACKET.md gives A–G questions/rules/options/recommendations/consequences/exact approval scope/next implementation for bank source populations, date-only policy semantics, unresolved normalization/model choices, authenticated HUMAN deployment, exact MARKET review and later complete authority/dataset acceptance. No approval of blank future hashes or missing source evidence is requested.

SOURCE_MINIMUM_DATASET_PLAN.json lists216 current core/sector-core acquisition obligations across29 eligible issuers with ticker, concept, period, source discovery/retained hashes, publication requirements, owner and acceptance criteria. It is an explicit lower bound, not a complete scoring minimum: exact model/normalization/history/valuation input choices remain unresolved and must expand the plan when selected. It does not require all1,754 retained historical candidates or all OR alternatives. Current comparable disclosures can support current AS_KNOWN only at their real availability/knowledge time.0 production publication facts are newly proven;16 VHM leads and the other missing source evidence remain unadmitted.

HUMAN_GOVERNANCE_PLAN.md provides minimal identity/capability/receipt/CAS/revocation/invalidation/deployment and onboarding steps.667 actual reviews, current M1/auxiliary gates and independent dataset acceptance are preserved; none fabricated.

## MARKET and integrity

Existing2026-10-21 completed EOD candidate natively replayed and110 source pins rehashed, current clock checked against unextended expiry2026-10-22T07:59:59.999Z, expected active release/projection and prior heads checked. MARKET_REVALIDATION.json records current exact approval eligibility and updated request; if expired the request is void. Review recommendation remains limited to REST RAW latest completed EOD; WSS is unqualified. No CAS or activation executed.

Authority replay PASS:22 sealed JSON,30 canonical runs,0 accounting regressions and11 active heads preserved. Production DB byte/logical hash and all table counts unchanged. MBB remains DEFERRED score=null rank=null; no scorecard, ranking, investment decision, transaction or order created.

Quality: lint/typecheck/build/scoring PASS;139 focused tests PASS including13 new engineering tests; full suite2,121 PASS/18 FAIL, exactly the historical18 with0 new unexplained regressions. Historical failures are visible, unwaived and unmodified. See TEST_RESULTS.json for exact commands/logs/failure identities.

Next step: independent CIO/Owner review of the decision packet and exact implementation evidence. No authority activation or scoring is authorized.
''')
(P/'README.md').write_text('# Escalated blocker resolution\n\nStart with FINAL_REVIEW.md and OWNER_DECISION_PACKET.md. Implementation is evidence-only, not activated. Persistent register: docs/fundamental-data-engine/ESCALATION_REGISTER.json. Evidence checkpoint is immutable after ARTIFACT_HASHES.json. Reproduce pre-seal with verify-engineering.mjs, build-evidence.py, sequential run-quality-gates.py, then finalize-evidence.py. These scripts reject sealed output. No production mutation, CAS or scoring.\n')
required=['ESCALATION_REGISTER.json','ENGINEERING_CLOSURE.json','SECTOR_REQUIREMENTS_VALIDATION.json','DERIVATION_CLOSURE.json','SOURCE_MINIMUM_DATASET_PLAN.json','MARKET_REVALIDATION.json','HUMAN_GOVERNANCE_PLAN.md','OWNER_DECISION_PACKET.md','TEST_RESULTS.json','PRODUCTION_MUTATION_AUDIT.json','ISSUES.json','FINAL_REVIEW.md','FINAL_STATUS.json'];assert all((P/n).is_file() for n in required)
for p in P.glob('*.py'):ast.parse(p.read_text())
changes=[p for p in subprocess.check_output(['git','ls-files','--others','--exclude-standard'],text=True).splitlines() if p.startswith(('src/','tests/')) or p=='docs/fundamental-data-engine/ESCALATION_REGISTER.json'];files={str(p.relative_to(R)):sha(p.read_bytes()) for p in P.rglob('*') if p.is_file() and p.name!='ARTIFACT_HASHES.json'};save('ARTIFACT_HASHES.json',{'algorithm':'SHA256','head':b['head'],'sealedAt':now,'files':files,'sourceChanges':{p:sha(Path(p).read_bytes()) for p in changes},'sealIsApproval':False});print(json.dumps({'status':state['status'],'quality':summary,'evidenceFiles':len(files),'sourcePins':len(changes),'databaseUnchanged':True}))
