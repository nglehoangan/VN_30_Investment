"""Finite sector-filtered work queue derived from the retained, frozen M3 matrix."""
import json,pathlib,hashlib,re,datetime
B=pathlib.Path('data/initialization-08b-remediation-work')
P=pathlib.Path('data/initialization-08b-final-review-candidate')
p=json.loads((P/'review-candidate.json').read_text());m=p['requirementsMatrix'];queue={};metric_queue=[]
execution=json.loads((B/'execution-preview.json').read_text()) if (B/'execution-preview.json').exists() else p
input_plans={(s['ticker'],r['metricId']):r for s in execution['readiness'] for r in s['requiredMetrics']} if execution.get('metricInputPolicy',{}).get('version')=='frozen-m3-sector-input-routing-v2' else {}
reported={'REVENUE','GROSS_PROFIT','CFO','NET_INCOME','TOTAL_ASSETS','TOTAL_EQUITY','CURRENT_ASSETS','CURRENT_LIABILITIES','INVENTORY','RECEIVABLES','BASIC_EPS','ORDINARY_SHARES_OUTSTANDING','CASH_DIVIDENDS_DECLARED','SHARE_REPURCHASES'}
for s in p['readiness']:
 for metric in m['metrics']:
  if s['sector'] not in metric['sectors']:continue
  authority=metric['authority'];excerpt=authority['excerpt'];inputs=metric.get('canonicalInputsBySector',{}).get(s['sector'],metric['canonicalInputs'])
  frozen_inputs=list(inputs)
  plan=input_plans.get((s['ticker'],metric['metricId']))
  if plan and s['sector']=='BANK' and metric['metricId'] in ['FH-BS-BANK-01','BQ-CASH-03']:
   inputs=plan['requiredCanonicalInputs']
  category='E_VALUATION_INPUT' if metric['component'].startswith('VAL-') else 'B_DERIVABLE_FINANCIAL_METRIC' if inputs else 'D_QUALITATIVE_EVIDENCE'
  metric_queue.append({'ticker':s['ticker'],'securityId':s['securityId'],'sector':s['sector'],'metricId':metric['metricId'],'category':category,'authority':authority,'requiredInputs':inputs,'status':'EVIDENCE_PROCESSING_REQUIRED','fallbackRule':metric['missingRule'],'legitimateNR':False,'nrReason':'NO_AUTOMATIC_NR; exact sector rule and evidence required'})
  # Admission interpretation retains every frozen row; it never silently
  # removes a row or creates a generic N/R exemption.
  row=metric_queue[-1]
  row['originalFrozenMatrixInputs']=frozen_inputs
  row['governedInputRouting']=plan.get('sectorSubstituteEvidenceRequirement') if plan else None
  row['preferredInputEvidence']=plan.get('preferredInputEvidence',[]) if plan else []
  row['admissionRole']='PRIMARY_REQUIRED_EVIDENCE'
  row['inputRelationship']='ALL_LISTED_INPUTS_WITH_REQUIRED_WINDOW_AND_CONTEXT'
  row['interpretationAuthority']={'path':'docs/03 SCORING/METRIC_DEFINITIONS.md','sha256':hashlib.sha256(pathlib.Path('docs/03 SCORING/METRIC_DEFINITIONS.md').read_bytes()).hexdigest(),'section':metric['metricId']}
  if metric['metricId']=='BQ-EQ-02' and s['sector'] not in ['BANK','SECURITIES','INSURANCE','REAL_ESTATE']:
   row['admissionRole']='SECONDARY_CROSS_CHECK; PRIMARY_RETURN_EVIDENCE_STILL_REQUIRED'
   row['interpretationReason']='Frozen BQ-EQ-02 explicitly calls ROE a secondary cross-check outside financial institutions. This does not excuse missing primary ROIC or normalization.'
  if metric['metricId']=='FH-BS-BANK-01':
   row['inputRelationship']='AUTHORITATIVE_TOTAL_CAR_REQUIRED; CET1_PREFERRED_WHEN_DISCLOSED'
   row['interpretationReason']='Frozen rule says most authoritative disclosed regulatory ratio, ideally CET1/common equity plus total CAR. Undisclosed CET1 is not an automatic mandatory-data failure or an invented zero.'
  if metric['metricId']=='BQ-EQ-03' and s['sector']!='BANK':
   row['inputRelationship']='GOVERNED_SUITABLE_MARGIN_ROUTE; GROSS_OR_EBIT_MARGIN_WITH_REQUIRED_HISTORY_CONTEXT'
   row['interpretationReason']='Frozen measures may include gross, EBIT or appropriate EBITDA margin; all alternatives are not universally mandatory.'
  if s['sector']=='SECURITIES':
   row['sectorNormalizationAuthority']={'path':'docs/03 SCORING/SECTOR_NORMALIZATION.md','section':'13.1','sha256':hashlib.sha256(pathlib.Path('docs/03 SCORING/SECTOR_NORMALIZATION.md').read_bytes()).hexdigest()}
   row['sectorFitReview']='BROKERAGE_FEE_ECONOMICS_THROUGH_CYCLE_ROE_MARGIN_LENDING_CAPITAL_LIQUIDITY; NO_INDUSTRIAL_SUBSTITUTION_WITHOUT_EXACT_GOVERNED_TRANSLATION'
  row['interpretationGovernanceStatus']='REVIEW_CANDIDATE'
  # Frozen general measurement rule: TTM for current operating state;
  # minimum three completed years for trend assessment, five preferred.
  # Point-in-time leverage/liquidity does not require arbitrary old stocks.
  history=metric['metricId'].startswith(('GQ-HIST-','GQ-INC-','CA-DIL-','CA-PSV-')) or metric['metricId'] in {'BQ-EQ-03','BQ-CASH-01'}
  # The frozen engine accepts four native quarters, or a quarter obtained
  # from compatible adjacent YTD windows. FY + current H1 - prior H1 is
  # not an approved operation. Retain current H1 and the exact YTD operands
  # as source recovery alternatives, without claiming they are comparable.
  ttm=[('2025-07-01','2025-09-30'),('2025-10-01','2025-12-31'),
       ('2026-01-01','2026-03-31'),('2026-04-01','2026-06-30'),
       ('2025-01-01','2025-06-30'),('2025-01-01','2025-09-30'),
       ('2025-01-01','2025-12-31'),('2026-01-01','2026-06-30')]
  annual=[(f'{year}-01-01',f'{year}-12-31') for year in [2023,2024,2025]]
  for item in inputs:
   registry=next(i for i in p['registry']['manifest']['items'] if i['itemId']==item)
   stock=registry['measurementSemantic']=='STOCK' or item in ['BANK_REPORTED_CAR','BANK_REPORTED_CET1','BANK_REPORTED_NIM','BANK_REPORTED_LDR','BANK_REPORTED_CREDIT_GROWTH']
   if stock:
    ends=['2026-06-30']
    if metric['metricId'] in {'BQ-EQ-01','BQ-EQ-02','GQ-INC-01','GQ-INC-BANK'}:ends.append('2025-06-30')
    if history:ends.extend(['2023-12-31','2024-12-31','2025-12-31'])
    # Three-year CAGR has three intervals, not two. Preserve the exact base.
    if metric['metricId']=='GQ-HIST-03':ends.append('2022-12-31')
    periods=[(end,end) for end in dict.fromkeys(ends)]
   else:
    periods=list(ttm)
    if history:periods.extend(annual)
    if metric['metricId'].startswith('GQ-HIST-'):periods.append(('2022-01-01','2022-12-31'))
    periods=list(dict.fromkeys(periods))
   cat='C_BANK_SPECIAL_METRIC' if item.startswith('BANK_') else 'A_REPORTED_FINANCIAL_FACT' if item in reported else 'B_DERIVABLE_FINANCIAL_METRIC'
   for start,end in periods:
    key=(s['ticker'],start,end,item)
    if key not in queue:queue[key]={'ticker':s['ticker'],'securityId':s['securityId'],'sector':s['sector'],'periodStart':start,'periodEnd':end,'itemId':item,'category':cat,'servesMetrics':[],'authorityReferences':[],'sourceAttempts':[],'status':'PENDING_RETAINED_CORPUS_PROCESSING','windowReason':'TTM_OPERATING_STATE; COMPATIBLE_JUNE_BEGIN_END_AVERAGE; THREE_COMPLETED_YEARS_ONLY_FOR_TREND; THREE_INTERVAL_CAGR_BASE_WHERE_REQUIRED', 'generalMeasurementAuthority':{'path':'docs/03 SCORING/METRIC_DEFINITIONS.md','section':'3.1','sha256':hashlib.sha256(pathlib.Path('docs/03 SCORING/METRIC_DEFINITIONS.md').read_bytes()).hexdigest()} }
    row=queue[key];row['servesMetrics'].append(metric['metricId']);row['authorityReferences'].append({'path':authority['path'],'line':authority['line'],'sha256':authority['sha256']})
    if not stock:
     row['approvedOperandRecoveryPolicy']={'operations':['TTM_QUARTERS','QUARTER_FROM_YTD'],
       'authorityPath':'src/domain/fundamentals/derivation.ts',
       'authoritySha256':hashlib.sha256(pathlib.Path('src/domain/fundamentals/derivation.ts').read_bytes()).hexdigest(),
       'nativeTTMWindow':['2025-07-01','2026-06-30'],
       'adjacentYTDRequiresSameFiscalYearAndRevisionVintage':True,
       'crossDocumentComparabilityEstablished':False,
       'doesNotAuthorizeFYPlusH1MinusPriorH1':True}
corpus=json.loads((B/'corpus.json').read_text());preview=json.loads((B/'execution-preview.json').read_text()) if (B/'execution-preview.json').exists() else p
observations=preview['canonicalObservations'];withdrawn={r['observationId'] for r in preview.get('sourcePeriodWithdrawals',[])}|{ancestor for o in observations for ancestor in o['ancestorReferences']};assessments={a['observationId']:a for a in preview.get('availabilityAssessments',[])};selected={x['observationId'] for x in preview['snapshot']['members']};qualified={q['bodyHash']:q for q in preview.get('documentQualificationCandidates',[])}
recovery=[]
for file in B.glob('*recovery.json'):
 packet=json.loads(file.read_text())
 if 'documents' in packet:recovery.extend(packet['documents'])
allDocuments={d['bodyHash']:d for d in corpus['documents']+recovery}
conflicted={id for c in preview.get('unresolvedConflicts',[]) for id in c['observationIds']}
for row in queue.values():
 docs=[d for d in allDocuments.values() if d['ticker']==row['ticker']]
 row['retainedDocumentCandidateIds']=[d['documentId'] for d in docs]
 facts=[o for o in observations if o['ticker']==row['ticker'] and o['itemId']==row['itemId'] and o['periodStart']==row['periodStart'] and o['periodEnd']==row['periodEnd'] and o['id'] not in withdrawn]
 row['existingCanonicalIds']=[o['id'] for o in facts]
 valid=[o for o in facts if o['quality']=='VALID' and o['dataPresence']=='AVAILABLE' and o['id'] not in conflicted]
 usable=[o for o in valid if assessments.get(o['id'],{}).get('status')=='VERIFIED']
 row['pitVerifiedCanonicalIds']=[o['id'] for o in usable]
 row['snapshotSelectedCanonicalIds']=[o['id'] for o in usable if o['id'] in selected]
 row['status']='VERIFIED_CURRENT_SNAPSHOT_INPUT' if row['snapshotSelectedCanonicalIds'] else 'PIT_VERIFIED_FRESHNESS_OR_HISTORY_CONTEXT_PENDING' if usable else 'CANONICAL_VALIDATION_OR_CONFLICT_EXCEPTION' if facts else 'TARGETED_SOURCE_CELL_RECOVERY_REQUIRED'
 row['sourceAttempts']=[{'stage':'RETAINED_PUBLIC_ISSUER_DOCUMENT','documentId':d['documentId'],'bodyHash':d['bodyHash'],'url':d.get('originalPublicUrl'),'retrievedAt':d['retrievedAt'],'qualificationStatus':qualified.get(d['bodyHash'],{}).get('status','NOT_YET_TWO_READER_QUALIFIED'),'qualifiedWindow':qualified.get(d['bodyHash'],{}).get('period'),'sameItemCanonicalIds':[o['id'] for o in facts if 'document-sha256:'+d['bodyHash'] in o['transformationReferences']]} for d in docs]
 row['irreducibleExternalBlockerEstablished']=False
for row in metric_queue:
 requirements=[r for r in queue.values() if r['ticker']==row['ticker'] and row['metricId'] in r['servesMetrics']]
 row['financialWindowKeys']=[[r['periodStart'],r['periodEnd'],r['itemId']] for r in requirements]
 row['verifiedCurrentFinancialWindowCount']=sum(r['status']=='VERIFIED_CURRENT_SNAPSHOT_INPUT' for r in requirements)
 row['pitVerifiedFinancialWindowCount']=sum(bool(r['pitVerifiedCanonicalIds']) for r in requirements)
 if row['pitVerifiedFinancialWindowCount']:row['status']='PARTIAL_VERIFIED_INPUTS_CONTEXT_AND_FALLBACK_REVIEW_REQUIRED'
out={'status':'EXECUTION_BACKLOG','baselineHead':p['head'],'reviewedCommit':'68d4165c40fb040b134b43d53285f550d34cfd7a','priorPackageHash':json.loads((P/'seal.json').read_text())['packageHash'],'frozenMatrixHash':json.loads((P/'seal.json').read_text())['artifactHashes']['matrix'],'classificationPolicy':'QUALITATIVE_AND_VALUATION_ARE_EVIDENCE_PACKAGES_NOT_FAKE_ACCOUNTING_FACTS; NR_REQUIRES_RULE_PLUS_EVIDENCE','executionSnapshotRunId':preview.get('snapshotRunId'),'executionSnapshotContentHash':preview.get('snapshotContentHash'),'metricRequirements':metric_queue,'deduplicatedFinancialWindows':list(queue.values()),'preferredFiveYearHistoryIsNotMandatory':True,'marketMoneyFlowTechnicalRequirements':{'status':'BASELINE_SCOPE_AUDIT_REQUIRED','reason':'Do not invent requirements absent from frozen M3 matrix; accepted market package retained.'}}
(B/'required-data-backlog.json').write_text(json.dumps(out,indent=2,ensure_ascii=False)+'\n');print(json.dumps({'metricRows':len(metric_queue),'deduplicatedFinancialWindows':len(queue),'tickers':len(p['readiness'])}))
