from pathlib import Path
import json,hashlib
R=Path('/Users/nglehoangan/Documents/Working/VN_30_Investment');O=R/'docs/fundamental-data-engine/scoring-usability-audit/v1-ad81bdce'
def load(p):return json.loads(p.read_text())
def write(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2,sort_keys=True)+'\n')
m=load(O/'VN30_ISSUER_RUBRIC_MATRIX.json');ledger=load(O/'FINANCIAL_EVIDENCE_LEDGER.json');pins=load(O/'SOURCE_PINS.json');p='docs/fundamental-data-engine/dfr-05/p2-6-tcb-78d7069d/evidence-ledger.json';d=load(R/p);pins[p]=hashlib.sha256((R/p).read_bytes()).hexdigest();new=[]
for k,x in d['financials'].items():
 if x.get('value')is None:continue
 ident='TCB:p26:'+x['id'];new.append(ident);ledger[ident]={'ticker':'TCB','concept':x.get('key'),'value':x['value'],'original':x,'periodStart':x.get('periodStart'),'periodEnd':x.get('periodEnd'),'periodType':x.get('periodType'),'scope':x.get('scope'),'unit':x.get('unit'),'currency':x.get('currency'),'quality':x.get('status'),'revision':x.get('revision'),'evidenceStatus':x.get('status'),'binding':{'path':p,'sha256':pins[p],'jsonPointer':'/financials/'+k.replace('~','~0').replace('/','~1')},'productionAdmissible':False}
for r in m['rows']:
 if r['sector']=='BANK':
  # Industrial cash-conversion concepts never qualify bank cash realization.
  rejected=[]
  for topic in r['topics']:
   prior=topic['financialContextEvidenceIds'];topic['financialContextEvidenceIds']=[i for i in prior if ledger[i]['concept']not in ['CFO','FCF','CUMULATIVE_CFO_REPORTED_NPAT','CFO_REPORTED_NPAT','POST_ACQUISITION_CASH']];rejected.extend(i for i in prior if i not in topic['financialContextEvidenceIds'])
  retained=set(i for t in r['topics']for i in t['financialContextEvidenceIds']);r['evidenceIds']=[i for i in r['evidenceIds']if i in retained];r['sectorRejectedContextIds']=sorted(set(rejected))
 if r['ticker']=='TCB'and r['rubric']in ['FH-BS','FH-STRESS','RG-RISK']:
  refs=[i for i in new if ledger[i]['concept']in ['NPL_BANK_CORE','NPL_BANK_CORE_RATIO','NPL_COVERAGE_BANK_CORE']];r['latestPopulationCompatibleBankCoreContext']=refs
  r['secondaryBlockers'].append('LEGACY_MIXED_NPL_DENOMINATOR_REFERENCE_SEPARATE_FROM_P26_BANK_CORE')
  r['sourceConflictScope']='Frozen P2.3 ratio 0.010680291893 uses mixed population; P2.6 bank-core FY2025 ratio 0.01132751808 uses 8198375000000 / 723757397000000. Keep both vintages, use P2.6 only for the stated bank-core definition. No blanket issuer/rubric conflict.'
write(O/'VN30_ISSUER_RUBRIC_MATRIX.json',m);write(O/'FINANCIAL_EVIDENCE_LEDGER.json',ledger);write(O/'SOURCE_PINS.json',pins)
c=load(O/'AUDIT_COUNTS.json');c['evidenceRecords']=len(ledger);c['sourcePins']=len(pins);c['additionalP26HistoricalFinancialEntries']=len(new);write(O/'AUDIT_COUNTS.json',c)
pp=O/'PRELIMINARY_ASSESSMENT.md';s=pp.read_text();needle='## TCB — BANK\n\n';s=s.replace(needle,needle+'P2.6 successor bank-core NPL FY2025 = 8,198,375,000,000 / 723,757,397,000,000 = 0.01132751808 (1.132751808%). Frozen P2.3 0.010680291893 is a different mixed population, retained as a bounded definition issue. Exact P2.6 operands and supporting rows are in FINANCIAL_EVIDENCE_LEDGER.json. Historical draft FH-BS qualification does not establish current capital/stress sufficiency or formal points.\n\n');pp.write_text(s)
p=O/'VALIDATION.md';s=p.read_text().replace('then `python3 validate.py`','then `python3 refine.py`, then `python3 validate.py`').replace('all captured preexisting tracked/data byte fingerprints','captured protected-code/policy/financial JSON/database byte fingerprints and metadata for the other preexisting files').replace('BASELINE_FINGERPRINTS.json records paths enumerated before this folder was created.','BASELINE_FINGERPRINTS.json records protected runtime/policy and retained financial JSON/database hashes captured during this docs-only audit; approved tracked inputs are also compared with HEAD git blobs. ARCHIVE_METADATA_BASELINE.json records size/mtime for preexisting tracked/data files. PDFs/media/archives are not comprehensively rehashed or re-extracted; metadata parity is a weaker check, not byte identity.');p.write_text(s)
print('Refined P2.6 entries',len(new),flush=True)

paths=['src/domain/ranking/rank.ts','src/domain/decision/validation.ts','src/domain/decision/engine.ts']
for f in paths:pins[f]=hashlib.sha256((R/f).read_bytes()).hexdigest()
write(O/'SOURCE_PINS.json',pins)
with (O/'SCORING_GATE_AUDIT.md').open('a')as f:f.write('\n## Static downstream boundary inspection\n\nscorecard.ts:42–46 accepts only FORMAL or SYNTHETIC_TEST plus matching methodology authority. rank.ts:69 requires VALID — ACTIONABLE. decision/validation.ts:47 checks scope lineage; decision/engine.ts:69,112 checks actionability. Audit objects are never submitted; formal points/total are null and productionAdmissible=false. No NAV, ledger or portfolio API is invoked. Static inspection only, not an end-to-end rejection-test claim.\n')

from pathlib import Path
import json,collections
O=Path('/Users/nglehoangan/Documents/Working/VN_30_Investment/docs/fundamental-data-engine/scoring-usability-audit/v1-ad81bdce')
m=json.loads((O/'VN30_ISSUER_RUBRIC_MATRIX.json').read_text())
r=next(x for x in m['rows']if x['id']=='TCB:FH-BS')
assert r['latestP26MandatoryTopicsQualified'] is True
r['primaryClassification']='ANALYST_ASSESSMENT_REQUIRED';r['reason']='P2.6 qualifies all FH-BS topics only for its bounded historical draft scope; proposed Adequate is not formal point selection or evidence of current/stress readiness. Named human adoption, exact point selection and formal evidence/time context remain required.'
counts=collections.Counter(x['primaryClassification']for x in m['rows']);m['primaryCounts']={k:counts[k]for k in m['primaryCounts']}
(O/'VN30_ISSUER_RUBRIC_MATRIX.json').write_text(json.dumps(m,ensure_ascii=False,indent=2,sort_keys=True)+'\n')
c=json.loads((O/'AUDIT_COUNTS.json').read_text());c['primaryCounts']=m['primaryCounts'];c['sourcePins']=len(json.loads((O/'SOURCE_PINS.json').read_text()));c['historicalDraftQualifiedAdditionalRubrics']=1;(O/'AUDIT_COUNTS.json').write_text(json.dumps(c,ensure_ascii=False,indent=2,sort_keys=True)+'\n')
for n in ['VN30_SCORING_USABILITY_AUDIT.md','MAPPING_AND_DERIVATION_GAPS.md']:
 p=O/n;s=p.read_text().replace('| MAPPING_GAP | 325 |','| MAPPING_GAP | 324 |').replace('| ANALYST_ASSESSMENT_REQUIRED | 25 |','| ANALYST_ASSESSMENT_REQUIRED | 26 |').replace('325 primary partial MAPPING_GAP','324 primary partial MAPPING_GAP');p.write_text(s)
p=O/'ANALYST_ASSESSMENT_GAPS.md';s=p.read_text();s+='\nPrimary ANALYST_ASSESSMENT_REQUIRED = 26: 25 preserved DFR-04 challenged research assessments plus one P2.6 TCB FH-BS historical draft with all topics qualified only for that historical scope. The latter still requires human point selection/adoption; it is not a 26th completed DFR-04 assessment, a current-case conclusion or a formal score.\n';p.write_text(s)
print('Latest disposition corrected',m['primaryCounts'])

import sqlite3
c=sqlite3.connect('file:'+str(R/'data/vn30.sqlite')+'?mode=ro&immutable=1',uri=True)
counts={t:c.execute('select count(*)from '+t).fetchone()[0]for t in ['analytical_artifact','scoring_dataset_binding']};c.close()
(O/'STORED_SCORING_INVENTORY.json').write_text(json.dumps({'method':'SQLite mode=ro&immutable=1','database':'data/vn30.sqlite','counts':counts,'interpretation':'No persisted analytical artifact or formal scoring dataset binding in this configured database. This does not prove absence of all draft research outside DB.'},indent=2)+'\n')
with(O/'VN30_SCORING_USABILITY_AUDIT.md').open('a')as f:f.write('\nRead-only configured database inspection: analytical_artifact=0 and scoring_dataset_binding=0. This independently confirms no persisted analytical/scorecard binding in this database; it does not negate draft research documents. See STORED_SCORING_INVENTORY.json.\n')

with (O/'SCORING_GATE_AUDIT.md').open('a')as f:f.write('\nM3 permits explicitly labelled estimates/assumptions and defensible conservative ranges (§9.2); it does not require owner approval of every analyst estimate. Pending TCB valuation choices are a specific retained governance restriction, distinct from the general policy.\n')
