"""Read-only baseline checks; all receipts written only to this owner package."""
import json,sys,subprocess,os,datetime,platform
from decimal import Decimal
from pathlib import Path
from prepare import ROOT,OUT,PRIOR,APPROVED,sha,digest,load,pointer,write

def utc():return datetime.datetime.now(datetime.timezone.utc).isoformat()
def run():
 records=[];checks=[];env={**os.environ,'PYTHONDONTWRITEBYTECODE':'1'}
 def check(name,condition):
  if not condition:raise AssertionError(name)
  checks.append(dict(name=name,status='PASS'))
 def command(args):
  start=utc();r=subprocess.run(args,cwd=ROOT,env=env,capture_output=True,text=True);records.append(dict(command=args,startedAt=start,finishedAt=utc(),exitCode=r.returncode,stdout=r.stdout,stderr=r.stderr));write('validation-receipts.json',dict(python=platform.python_version(),records=records))
  if r.returncode:raise RuntimeError('FAILED_COMMAND:'+repr(args))
  return r.stdout
 rel=str(OUT.relative_to(ROOT));head=command(['git','rev-parse','HEAD']).strip()
 command(['git','merge-base','--is-ancestor',APPROVED,'HEAD'])
 command([sys.executable,rel+'/prepare.py'])
 owner=load(OUT/'owner-decision-register.json');choices=load(OUT/'valuation-choice-register.json');a=load(OUT/'assumption-proposal-register.json');test=load(OUT/'scenario-acceptance-register.json')
 check('Only the three explicit owner approvals are recorded',owner['scopeApproval']=='APPROVED' and len(owner['exactOwnerApprovedStatements'])==3 and owner['approvedBaselineCommit']==APPROVED)
 check('No approval time invented',owner['ownerApprovalTimestamp'] is None)
 check('No third remediation round or scenario execution',owner['remediationRoundsUsed']==2 and not owner['newRemediationRound'] and not owner['draftValuationExecuted'])
 check('All D1-D6 recommendations present and pending',len(choices['items'])==6 and {x['id'] for x in choices['items']}=={'D'+str(i) for i in range(1,7)} and all(x['ownerApprovalStatus']=='PENDING' and x['selectedChoice'] is None and x['ownerApprovalReceipt'] is None for x in choices['items']))
 check('Seven economics plus book/actions documented',len(a['items'])==9 and {x['id'] for x in a['items']}=={'A-ROE','A-KE','A-GROWTH','A-PAYOUT','A-STRESS','A-CAPITAL','A-TERMINAL','A-BOOK','A-ACTIONS'})
 check('Unsupported numerical assumptions remain null',all(x['proposedValue'] is None and x['proposedRange'] is None and x['ownerApprovalStatus']=='PENDING' for x in a['items']))
 check('Every assumption has exact blocker, resolution, rationale, sensitivity, confidence',all(all(x[k] for k in ['preciseBlocker','resolution','calculationOrRationale','sensitivity','downsideImplication','confidence']) for x in a['items']))
 check('Single scenario acceptance defined and not run',test['id']=='TCB-DRAFT-SCENARIO-01' and test['status']=='DEFINED_NOT_EXECUTED_BLOCKED' and not test['executionAuthorizedByThisPackage'] and len(test['gates'])==8)
 for record in (owner,test):
  check('Formal/null output fields '+('owner' if record is owner else 'test'),all(record[k] is None for k in ['approvedValuation','formalM3Points','formalM3Total','ranking','M4Decision']))
 check('No numerical valuation or analyst estimates generated',a['estimates']==[] and a['draftValuation'] is None and a['approvedValuation'] is None)
 anchors=load(OUT/'fact-reference-register.json')['items']
 check('Historical references retain decimal strings and original status',len(anchors)==19 and all(isinstance(x['value'],str) and Decimal(x['value']).is_finite() for x in anchors) and next(x for x in anchors if 'EPS_NUMERATOR_PARENT_BOOK_RETURN_PROXY' in x['id'])['status']=='REFERENCE_ONLY')
 bindings=[]
 def collect(x):
  if isinstance(x,dict):
   if {'path','sha256','jsonPointer','objectHash'}<=set(x):bindings.append(x)
   for v in x.values():collect(v)
  elif isinstance(x,list):
   for v in x:collect(v)
 for file in ['fact-reference-register.json','valuation-choice-register.json','assumption-proposal-register.json']:collect(load(OUT/file))
 check('All exact provenance pointers and object hashes resolve',all(sha(ROOT/b['path'])==b['sha256'] and digest(pointer(load(ROOT/b['path']),b['jsonPointer']))==b['objectHash'] for b in bindings))
 prior=load(PRIOR/'manifest.json');check('P2.6 canonical manifest intact',digest({k:v for k,v in prior.items() if k!='contentHash'})==prior['contentHash'])
 check('Every sealed P2.6 output unchanged',all(sha(PRIOR/path)==h for path,h in prior['files'].items()))
 pins=load(PRIOR/'source-input-pins.json');check('All P2.6 financial/source/methodology input pins intact',all(sha(ROOT/path)==h for path,h in pins.items()))
 p26path=str(PRIOR.relative_to(ROOT));names=command(['git','ls-tree','-r','--name-only',APPROVED,'--',p26path]).splitlines()
 check('Entire P2.6 folder matches approved969e36ab commit',bool(names) and all(sha(ROOT/p)==__import__('hashlib').sha256(subprocess.check_output(['git','show',APPROVED+':'+p],cwd=ROOT)).hexdigest() for p in names))
 preexisting=command(['git','diff','--name-only',APPROVED,head]).splitlines();expected=['AGENTS.md','docs/fundamental-data-engine/REBUILT_DATA_WORKFLOW.md','skills/read-pdf-json-first/SKILL.md']
 check('Only three preexisting successor documentation/skill changes',sorted(preexisting)==sorted(expected))
 old=load(PRIOR/'protected-before.json');legacyDrift=[p for p,h in old.items() if not (ROOT/p).is_file() or sha(ROOT/p)!=h]
 check('Original P2.6 protected set unchanged except two documented successor documentation edits',sorted(legacyDrift)==sorted(expected[:2]))
 before=load(OUT/'protected-before.json');changes=[p for p,h in before.items() if not (ROOT/p).is_file() or sha(ROOT/p)!=h]
 data={str(p.relative_to(ROOT)) for p in (ROOT/'data').rglob('*') if p.is_file()};priorData={p for p in before if p.startswith('data/')}
 check('All current baseline protected bytes unchanged',not changes)
 check('Exact data inventory unchanged',data==priorData)
 check('All new input pins unchanged',all(sha(ROOT/path)==h for path,h in load(OUT/'input-pins.json').items()))
 check('P2.6 readiness and rubric count preserved',load(PRIOR/'summary.json')['analysisReadiness']=='ANALYSIS_PARTIALLY_READY' and load(PRIOR/'summary.json')['escalationStatus']=='ESCALATED' and load(PRIOR/'summary.json')['M3_RUBRIC_READINESS']['qualifiedHistoricalDraft']==1 and load(PRIOR/'summary.json')['M3_RUBRIC_READINESS']['blockedForCompleteAssessment']==22)
 status=command(['git','status','--porcelain']);check('All task changes confined to owner-decision package',all(line[3:].startswith(rel+'/') for line in status.splitlines()))
 receipt=dict(status='PASS',approvedCommit=APPROVED,executionHead=head,protectedFiles=len(before),protectedPinSetHash=digest(before),dataFileCount=len(data),databaseHashes={p:h for p,h in before.items() if p.startswith('data/vn30.sqlite')},P26ManifestContentHash=prior['contentHash'],P26SealedOutputs=len(prior['files']),P26CommitFiles=len(names),P26SourcePins=len(pins),preexistingSuccessorChanges=preexisting,originalProtectedSetDocumentedExceptions=legacyDrift,taskMutationOutsidePackage=False,productionWrites=False)
 write('baseline-integrity-receipt.json',receipt)
 write('validation-results.json',dict(status='PASS',checks=checks,checksPassed=len(checks),provenanceBindingsChecked=len(bindings),scope='Decision package consistency and baseline integrity only; not financial scenario acceptance or whole-release validation',scenarioValuationTest='DEFINED_NOT_EXECUTED_BLOCKED',modelExecuted=False,newFinancialCalculations=False,sourceIdentityDiscovery=False,externalAcquisition=False,otherIssuerProcessing=False,productionEngineExecuted=False,formalM3Points=None,total=None,ranking=None,M4Decision=None,approvedValuation=None))
 text=f'''# Owner package validation

Package/baseline validation **PASS**, {len(checks)} checks. Single future scenario financial acceptance remains **DEFINED_NOT_EXECUTED_BLOCKED**. No model, formal scorer/ranking/M4 or production engine was run; no whole-release PASS is claimed.

{len(before)} current-baseline files and exact {len(data)}-file data inventory are unchanged, including SQLite/sidecars. All{len(prior['files'])} sealed P2.6 outputs, all{len(names)} files in the approved P2.6 commit folder and all{len(pins)} retained source/methodology input pins pass. {len(bindings)} precise provenance bindings resolve. Historical1draft/22blocked status remains intact.

Approved969e36ab is an ancestor of execution HEAD `{head}`. The three preexisting changes are AGENTS.md, REBUILT_DATA_WORKFLOW.md and the new JSON-first skill. The first two explain the old P2.6 protected-set differences. No predecessor receipt/seal was rewritten and no unqualified claim of an entirely identical repository versus969e36ab is made. The historical strict verifier was not run because it rejects those later committed documentation changes; its relevant source/output/financial checks are explicitly reproduced read-only here, with the exception list recorded.

Recorded approvals: baseline, commit and Option B only. All6 choices and9 assumption/prerequisite entries remain PENDING;7 core economics have no supported numerical bounds. Draft/approved valuation, formal points/totals/ranking/M4 decisions remain null. No source acquisition, other issuer processing, financial re-normalization or third remediation round occurred.

`validation-receipts.json` contains actual commands, UTC timestamps and exit output; `baseline-integrity-receipt.json` carries protected/database hashes. This package stops at owner review. Receipt validation does not qualify a valuation input or infer approval.
'''
 (OUT/'VALIDATION.md').write_text(text)
 manifest=dict(schema='p26-owner-escalation-package-v1',approvedBaselineCommit=APPROVED,executionHead=head,hashSemantics='SHA256 canonical sorted UTF8 JSON excluding contentHash; exact file bytes pinned',files={str(p.relative_to(OUT)):sha(p) for p in sorted(OUT.rglob('*')) if p.is_file() and p.name not in ('manifest.json','read-only-verification.json') and '__pycache__' not in p.parts})
 manifest['contentHash']=digest(manifest);write('manifest.json',manifest);print(json.dumps(dict(status='PASS',checks=len(checks),protectedFiles=len(before),manifestContentHash=manifest['contentHash'],scenarioTest='NOT_EXECUTED_BLOCKED')))
def verify():
 m=load(OUT/'manifest.json');assert digest({k:v for k,v in m.items() if k!='contentHash'})==m['contentHash']
 for p,h in m['files'].items():assert sha(OUT/p)==h,('PACKAGE_CHANGED',p)
 for p,h in load(OUT/'protected-before.json').items():assert sha(ROOT/p)==h,('PROTECTED_CHANGED',p)
 print(json.dumps(dict(status='PASS',readOnly=True,manifestContentHash=m['contentHash'])))
if __name__=='__main__':verify() if '--verify' in sys.argv else run()
