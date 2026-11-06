"""Static P2.1 plan validator only. No financial calculation, requalification, acquisition or DB IO."""
from pathlib import Path
from copy import deepcopy
from collections import Counter
import json,hashlib,subprocess
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/fundamental-data-engine/dfr-05/p2-1-653d67f7'
U=ROOT/'docs/fundamental-data-engine/dfr-05/p2-0-bd3a8b4b/proposed-vn30-universe.json'
BASELINE='653d67f78df519ce087c65a6a6cc773c9f615b2e'
UNIVERSE_HASH='931e8355854bccc45918b38f2c5061bfda0786bf4bb8779fbe213be8e5107d56'
PILOTS={'FPT','VNM','BID','TCX','VIC','VHM'}
SUBTYPES={'BSR':'REFINING_ENERGY','GAS':'GAS_INFRASTRUCTURE','GVR':'RUBBER_INDUSTRIAL_LAND_HOLDING','HPG':'INTEGRATED_STEEL','MCH':'CONSUMER_MANUFACTURER','MSN':'CONSUMER_PLATFORM_HOLDING','MWG':'RETAIL_STORE_NETWORK','SAB':'CONSUMER_MANUFACTURER','SSI':'SECURITIES','VJC':'AVIATION_LEASE_OPERATOR','VPL':'HOSPITALITY_RESORT_OPERATIONS','VRE':'PROPERTY_RETAIL_OPERATIONS'}
def read(p):return json.loads(Path(p).read_text())
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def digest(x):return hashlib.sha256(json.dumps(x,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def signed_hash(p):return digest({k:v for k,v in p.items() if k!='contentHash'})
def validate(m,u):
 if signed_hash(m)!=m['contentHash'] or signed_hash(u)!=UNIVERSE_HASH or u['contentHash']!=UNIVERSE_HASH:raise ValueError('CANONICAL_HASH')
 if m['baselineCommit']!=BASELINE or m['approvedUniverseContentHash']!=UNIVERSE_HASH or m['researchReferenceDate']!='2026-11-05' or m['universeVersion']!='2026-11-05-v1':raise ValueError('FROZEN_APPROVED_BASELINE')
 if any(m[k]!=0 for k in ['newFinancialMetrics','newAssessments','newScorecards','newSources']):raise ValueError('PLANNING_ONLY')
 if m['ownerGovernance']['nonPilotFinancialProcessing'] or m['ownerGovernance']['productionActivation']:raise ValueError('NO_IMPLEMENTATION_AUTHORITY')
 expected={x['ticker']:x for x in u['constituents'] if x['pilotClassification']=='NON_PILOT'};rows=m['rows']
 if len(rows)!=24 or len({r['ticker'] for r in rows})!=24 or len({r['securityId'] for r in rows})!=24 or {r['ticker'] for r in rows}!=set(expected):raise ValueError('EXACT_24_IDENTITIES')
 counts=dict(Counter(r['routeQualificationStatus'] for r in rows));counts.setdefault('BLOCKED',0)
 if counts!=m['counts'] or counts!={'READY':16,'READY_WITH_CONDITIONS':8,'BLOCKED':0}:raise ValueError('STATUS_COUNTS')
 if digest([{'ticker':r['ticker'],'securityId':r['securityId']} for r in sorted(rows,key=lambda x:x['ticker'])])!=m['identityHash']:raise ValueError('IDENTITY_HASH')
 for r in rows:
  source=expected[r['ticker']]
  if any(k in r for k in ['metrics','assessment','scorecard','totalScore','ranking','valuationPerShare','portfolioDecision']):raise ValueError('NO_FINANCIAL_OR_SCORE_OUTPUT_IN_PLAN')
  status='READY_WITH_CONDITIONS' if r['ticker'] in {'BSR','GAS','GVR','HPG','MSN','VJC','VPL','VRE'} else 'READY'
  if r['routeQualificationStatus']!=status:raise ValueError('EXACT_ROUTE_CONDITION_CLASS')
  if r['proposedResearchSubtype']!=SUBTYPES.get(r['ticker'],'BANK'):raise ValueError('EXACT_ECONOMIC_SUBTYPE_REQUIRED')
  if r['securityId']!=source['securityId'] or r['existingM3Sector']!=source['existingSector']:raise ValueError('IDENTITY_OR_SECTOR_CHANGED')
  if r['implemented'] or r['implementationAuthorized'] or r['formalScoringAuthorized'] or r['productionAdmissible'] or r['sourceCoverageQualified']:raise ValueError('NO_EXECUTION_OR_QUALIFIED_COVERAGE_CLAIM')
  if not r['canImplementWithoutM3MethodologyChange'] or not r['approvedMethodologyReferences']:raise ValueError('METHODOLOGY_NOT_BOUND')
  if r['routeQualificationStatus']=='READY_WITH_CONDITIONS' and not r['conditions']:raise ValueError('EXACT_CONDITION_REQUIRED')
  if r['existingM3Sector']=='BANK' and (r['proposedResearchSubtype']!='BANK' or any('CFO_REPORTED_NPAT' in f for f in r['metricApplicability'])):raise ValueError('BANK_ROUTE_NOT_INDUSTRIAL')
  if r['ticker']=='SSI' and r['proposedResearchSubtype']!='SECURITIES':raise ValueError('SECURITIES_ROUTE_REQUIRED')
  if not r['mandatorySectorReconciliations'] or not r['knownMissingDependencies'] or not r['resolutionPath'] or not r['routingEvidence']:raise ValueError('ISSUER_ROUTE_CONTRACT_REQUIRED')
  if len(r['sourceInventory'])!=4 or {s['kind'] for s in r['sourceInventory']}!={'PDF','NOTES','CAFEF','COMBINED'}:raise ValueError('FOUR_SOURCE_STRUCTURES')
  for s in r['sourceInventory']:
   if s.get('qualifiedCoverage') or s.get('financialValuesInspected'):raise ValueError('FILENAME_NOT_FINANCIAL_COVERAGE')
 req=read(ROOT/'src/domain/fundamentals/manual-fundamental-evidence-requirements-v2.json')
 for r in rows:
  for g in ['CORE','SECTOR_CORE']:
   if r['mandatoryCanonicalInputGroups'][g]!=req['sectors'][r['existingM3Sector']][g]:raise ValueError('APPROVED_REQUIRED_GROUPS_CHANGED')
 batches=m['proposedBatches'];flat=[t for b in batches for t in b['issuers']]
 if len(batches)!=4 or any(not 1<=len(b['issuers'])<=6 for b in batches) or len(flat)!=24 or len(set(flat))!=24 or set(flat)!=set(expected) or set(flat)&PILOTS:raise ValueError('EXACT_FOUR_BATCH_PARTITION')
 for r in rows:
  if next(b['id'] for b in batches if r['ticker'] in b['issuers'])!=r['batchId']:raise ValueError('BATCH_ROW_MISMATCH')
 return True

def verify():
 if subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()!=BASELINE:raise ValueError('BASELINE_HEAD_DRIFT')
 m=read(OUT/'DFR_05_P2_1_ROUTE_QUALIFICATION_MATRIX.json');u=read(U);validate(m,u)
 for p,h in read(OUT/'protected-before.json').items():
  if sha(ROOT/p)!=h:raise ValueError('PROTECTED_CHANGED:'+p)
 for p,h in m['methodologyPins'].items():
  if sha(ROOT/p)!=h:raise ValueError('METHODOLOGY_OR_KERNEL_CHANGED')
 if sha(OUT/'source-inspection.json')!=m['sourceInspectionHash']:raise ValueError('INSPECTION_CHANGED')
 for r in m['rows']:
  for s in r['sourceInventory']:
   if s['exists'] and sha(ROOT/s['path'])!=s['sha256']:raise ValueError('RETAINED_SOURCE_CHANGED')
  for e in r['routingEvidence']:
   source=read(ROOT/e['path']);obj=source
   for token in e['jsonPointer'][1:].split('/'):obj=obj[int(token)] if isinstance(obj,list) else obj[token]
   if not isinstance(obj,str) or e['qualification']!='ROUTING_CONTEXT_ONLY_NOT_FULL_TOPIC_OR_FINANCIAL_FACT_REVIEW':raise ValueError('ROUTING_CONTEXT_ONLY')
 for folder in ['docs/fundamental-data-engine/dfr-05/p1-a46da9a8','docs/fundamental-data-engine/dfr-05/p2-0-bd3a8b4b']:
  manifest=read(ROOT/folder/'manifest.json')
  for p,h in manifest['files'].items():
   if sha(ROOT/folder/p)!=h:raise ValueError('APPROVED_BASELINE_CHANGED')
 p1=ROOT/'docs/fundamental-data-engine/dfr-05/p1-a46da9a8';total=[0,0,0]
 for t in PILOTS:
  d=read(p1/f'issuers/{t}.json');total[0]+=len(d['metrics']);total[1]+=sum(r['status']=='COMPLETED_RESEARCH' for r in d['rubrics']);total[2]+=sum(r['status']=='NOT_RATED' for r in d['rubrics'])
 if total!=[789,25,113]:raise ValueError('P1_PARITY_DRIFT')
 return dict(status='PASS',routeCounts=m['counts'],nonPilotIdentities=24,subtypes=len({r['proposedResearchSubtype'] for r in m['rows']}),batches=4,sourceStructuresInspected=96,financialMetricsCalculated=0,newAssessments=0,approvedUniverseHash=UNIVERSE_HASH,nonPilotIdentityHash=m['identityHash'],matrixHash=m['contentHash'],protectedFilesVerified=len(read(OUT/'protected-before.json')),p1Counts=total,implementationAuthorized=False)

def adversarial():
 m=read(OUT/'DFR_05_P2_1_ROUTE_QUALIFICATION_MATRIX.json');u=read(U);count=0
 def reject(change):
  nonlocal count
  x=deepcopy(m);change(x);x['contentHash']=signed_hash(x)
  try:validate(x,u)
  except ValueError:count+=1;return
  raise AssertionError('BAD_PLAN_ACCEPTED')
 reject(lambda x:x['rows'].pop())
 reject(lambda x:x['rows'][0].update(securityId='invented'))
 reject(lambda x:x['rows'][0].update(existingM3Sector='CONGLOMERATE'))
 reject(lambda x:x['rows'][0].update(proposedResearchSubtype='INDUSTRIAL'))
 reject(lambda x:x['rows'][0].update(implementationAuthorized=True))
 reject(lambda x:x['rows'][0].update(sourceCoverageQualified=True))
 reject(lambda x:x.update(newFinancialMetrics=1))
 reject(lambda x:x.update(newAssessments=1))
 reject(lambda x:x['ownerGovernance'].update(nonPilotFinancialProcessing=True))
 reject(lambda x:x['ownerGovernance'].update(productionActivation=True))
 reject(lambda x:x['proposedBatches'][1]['issuers'].__setitem__(0,x['proposedBatches'][0]['issuers'][0]))
 reject(lambda x:x['proposedBatches'][0]['issuers'].append('FPT'))
 reject(lambda x:next(r for r in x['rows'] if r['routeQualificationStatus']=='READY_WITH_CONDITIONS').update(conditions=[]))
 reject(lambda x:x['rows'][0]['mandatoryCanonicalInputGroups'].update(SECTOR_CORE=[]))
 reject(lambda x:x.update(researchReferenceDate='2026-11-06'))
 reject(lambda x:x['rows'][0].update(totalScore=0))
 def swap_status(x):
  a=next(r for r in x['rows'] if r['routeQualificationStatus']=='READY');b=next(r for r in x['rows'] if r['routeQualificationStatus']=='READY_WITH_CONDITIONS');a['routeQualificationStatus'],b['routeQualificationStatus']=b['routeQualificationStatus'],a['routeQualificationStatus']
 reject(swap_status)
 return dict(status='PASS',rejectedInvalidPlans=count)
if __name__=='__main__':print(json.dumps(dict(static=verify(),adversarial=adversarial()),ensure_ascii=False,indent=2))
