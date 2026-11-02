#!/usr/bin/env python3
"""Additive research/admission worklist; never renews bindings or issues scores."""
import json,hashlib
from pathlib import Path
from lib.project_underwriting import segment_reconcile
ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'docs/fundamental-data-engine/scoring-dataset-acceptance/2026-11-02'
OUT=BASE/'acceptance-remediation-v1'
def read(p):return json.loads(p.read_text())
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def write(name,d):
 p=OUT/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
def source(t,page):
 p=f'data/manual-download/{t}/{t}_Baocaotaichinh_2025_Kiemtoan_Hopnhat.pdf'
 expected={'VHM':'f2068861297d3aa4efb4be9542855b5ba58bf82e9c78a0176e4c52f71639cc62','VPL':'ce72a611e743db0e5a1f60ef40af3ebd0dd6e4c7bc22f0f59aa102893627aef7'}
 if sha(ROOT/p)!=expected[t]:raise ValueError('CHECKED_PDF_SOURCE_CHANGED')
 return dict(pdfPath=p,sha256=expected[t],physicalPage=page,fullPageImageInspected=True,asOf='2025-12-31',scope='CONSOLIDATED',unit='MILLION_VND',productionAdmissible=False)
def build():
 vhm=dict(contract='project-rnav-input-review-v1',ticker='VHM',source=source('VHM',50),
  pooledInventoryUnderConstructionMillionVnd='106955459',inventoryPoolIsGdv=False,projectAmountsAllocated=False,
  inventoryGrossMillionVnd='131520017',inventoryAllowanceMillionVnd='105448',
  inventoryNetMillionVnd='131414569',
  projectUniverseComplete=False,projects=[dict(id='VHM-INVENTORY-'+str(i+1),sourceCaption=n,sourcePhysicalPage=50,
    projectOwnership=None,remainingNetSalesCash=None,remainingConstructionLandTaxSellingCosts=None,
    collectionSchedule=None,projectDebt=None,legalRealizationEvidence=None,projectRnav=None)
    for i,n in enumerate(['Vinhomes Global Gate Hạ Long','Khu đô thị ven vịnh Cam Ranh','Vinhomes Green Paradise','Vinhomes Ocean Park 2','Vinhomes Ocean Park 3','Vinhomes Grand Park','Vinhomes Golden City','Vinhomes Green City'])],
  caveat='Source says mainly these projects and others. Pooled inventory is historical sunk cost, not future proceeds or remaining cost. No allocation by equal weights.',
  corporateOtherAssetSource=source('VHM',52),corporateDepositsProjectAllocation=None,
  enterpriseToCommonBridge=dict(unallocatedCash=None,unallocatedDebt=None,partnerClaims=None,preferredClaims=None,corporateCosts=None),
  acceptedEquityValue=None,acceptedValuePerShare=None,acceptance='BLOCKED_MISSING_PROJECT_INPUTS')
 write('VHM-rnav-inputs.json',vhm)
 # Preserve source segment caption: this includes tourism/entertainment, not a pure-hotel EBITDA.
 common=dict(asOf='2025-12-31',scope='CONSOLIDATED')
 seg=[dict(common,id='HOSPITALITY_TOURISM_ENTERTAINMENT',revenue='11366869',reportedSegmentProfit='2420716',assets='44022373',liabilities='8162220'),
      dict(common,id='REAL_ESTATE_LEASING_TRANSFER',revenue='4172227',reportedSegmentProfit='2973624',assets='18683706',liabilities='28102307')]
 unallocated=dict(common,revenue='0',reportedSegmentProfit='-4377507',assets='24139842',liabilities='13983578')
 total=dict(common,revenue='15539096',reportedSegmentProfit='1016833',assets='86845921',liabilities='50248105')
 vpl=dict(contract='segment-sotp-input-review-v1',ticker='VPL',source=source('VPL',45),additionalSources=[source('VPL',46)],
  nativeUnit='MILLION_VND',segments=seg,unallocated=unallocated,consolidated=total,
  sourceProfitCaption='Lợi nhuận thuần từ hoạt động kinh doanh (bộ phận); tổng sau thu nhập thuần không phân bổ là lợi nhuận thuần trước thuế',
  unallocatedZeroRevenueBasis='Both source segment revenues sum exactly to reported group net revenue; derived reconciliation zero, not an absent source cell.',
  reconciliation=segment_reconcile(seg,unallocated,total),
  financeAndRelatedPartyAllocation=None,segmentDa=None,segmentCapex=None,segmentWorkingCapital=None,
  debtAndLeaseAllocation=None,minorityPreferredClaims=None,commonTaxAllocation=None,
  sourceSegmentProfitIsHotelEbitda=False,pooledCommonCashDcfAccepted=False,acceptedSotp=None,
  requiredModels=['HOSPITALITY_UNLEVERED_CASH_FLOW','PROPERTY_PROJECT_RNAV','FINANCE_RELATED_PARTY_CLAIM_RECOVERABILITY','CORPORATE_AND_PREFERENCE_CLAIM_BRIDGE'],
  acceptance='BLOCKED_SEGMENT_CASH_CLAIM_ALLOCATION')
 write('VPL-segment-inputs.json',vpl)
 findings=[
 dict(id='VPL-MARGINS-SEGMENT',ticker='VPL',rubricId='BQ-EQ',topic='margins',
      evidenceComponent='VPL-segment-inputs.json',pointer='/segments',
      supported='Reported FY2025 segment revenues and segment operating results are separated and reconcile.',
      counterArgument='Hospitality includes tourism/entertainment; reported result is not proven hotel EBITDA or normalized common-owner return.',
      sufficiency='PARTIAL_TOPIC_EVIDENCE_ONLY'),
 dict(id='VPL-CASH-UNALLOCATED',ticker='VPL',rubricId='BQ-CASH',topic='realization',
      evidenceComponent='VPL-segment-inputs.json',pointer='/unallocated',
      supported='Unallocated net income -4377507 million VND bridges segment result to consolidated pretax profit.',
      counterArgument='This is profit, not operating cash. Segment working-capital/capex/cash realizations remain missing.',sufficiency='PARTIAL_TOPIC_EVIDENCE_ONLY'),
 dict(id='VPL-LEVERAGE-POPULATION',ticker='VPL',rubricId='FH-BS',topic='leverage_context',
      evidenceComponent='VPL-segment-inputs.json',pointer='/segments',
      supported='Reported assets and liabilities separated by segment with a distinct unallocated pool.',
      counterArgument='Total liabilities are not interest-bearing debt. Funding, lease and claim allocations cannot follow revenue weights.',sufficiency='PARTIAL_TOPIC_EVIDENCE_ONLY'),
 dict(id='VPL-PRIMARY-COUNTER',ticker='VPL',rubricId='VAL-PRIMARY',topic='primary_model',
      evidenceComponent='VPL-segment-inputs.json',pointer='/requiredModels',
      supported='Two reported operating segments and material unallocated balances require separate economic models.',
      counterArgument='Pooled group common cash DCF is unsuitable for acceptance until property/finance/corporate and preferred claims are separated.',sufficiency='COUNTEREVIDENCE_PRIMARY_MODEL_BLOCKED'),
 dict(id='VPL-CROSSCHECK',ticker='VPL',rubricId='VAL-PRIMARY',topic='cross_check',
      evidenceComponent='VPL-segment-inputs.json',pointer='/reconciliation',
      supported='Four exact arithmetic bridges reconcile segment revenue, results, assets and liabilities.',
      counterArgument='Arithmetic reconciliation verifies reported data, not an independent economic valuation.',sufficiency='PARTIAL_TOPIC_EVIDENCE_ONLY'),
 dict(id='VHM-PRIMARY-INPUTS',ticker='VHM',rubricId='VAL-PRIMARY',topic='primary_model',
      evidenceComponent='VHM-rnav-inputs.json',pointer='/projects',
      supported='Eight named project contexts are identifiable in the inventory note.',
      counterArgument='The source says mainly and other projects. It does not give exhaustive project GDV, ownership, remaining costs or timing.',sufficiency='COUNTEREVIDENCE_PRIMARY_MODEL_BLOCKED'),
 dict(id='VHM-REINV-COST',ticker='VHM',rubricId='CA-REINV',topic='capex',
      evidenceComponent='VHM-rnav-inputs.json',pointer='/pooledInventoryUnderConstructionMillionVnd',
      supported='Construction inventory pool 106955459 million VND is reported historical book cost.',
      counterArgument='Sunk inventory cannot be treated as remaining cash capex, GDV or an equal allocation across projects.',sufficiency='PARTIAL_TOPIC_EVIDENCE_ONLY'),
 dict(id='VHM-MOS-QUALIFICATION',ticker='VHM',rubricId='VAL-MOS',topic='conservative_value',
      evidenceComponent='VHM-rnav-inputs.json',pointer='/enterpriseToCommonBridge',
      supported='The report identifies corporate deposits connected with potential projects.',
      counterArgument='Recoverability, project rights, partner claims and debt allocation are not qualified; book equity cannot supply conservative RNAV.',sufficiency='COUNTEREVIDENCE_VALUE_UNAVAILABLE')]
 for f in findings:f['evidenceComponentSha256']=sha(OUT/f['evidenceComponent']);f['acceptedTopicEvidence']=False
 write('reviewed-topic-findings.json',dict(contract='checked-topic-findings-v1',findings=findings,independentHumanReviewClaimed=False))
 topics=[];rubrics=[];retired=[];pins={}
 for p in sorted((BASE/'vn30-lineage-v1/issuers').glob('*.json')):
  g=read(p);pins[str(p.relative_to(ROOT))]=sha(p);nodes={n['id']:n for n in g['nodes']};stale=set(g['stalePriorFactBindings']);cache={}
  def ancestors(ident):
   if ident not in cache:
    n=nodes[ident];cache[ident]={ident}|set().union(*(ancestors(i) for i in n['inputs']))
   return cache[ident]
  for obs in sorted(stale):retired.append(dict(ticker=g['ticker'],observationId=obs,disposition='EXCLUDED_FROM_NEW_SCORING_SELECTION',historicalBindingUnchanged=True,replacementBinding=None,renewalAuthorized=False))
  for n in g['nodes']:
   if n['kind']!='RUBRIC':continue
   ids=[]
   for eid in n['inputs']:
    e=nodes[eid];ident=g['ticker']+':'+eid;ids.append(ident)
    expired=sorted(o for o in stale if any(i in ancestors(eid) for i in ['source:'+o,'normalized:'+o]))
    topics.append(dict(id=ident,ticker=g['ticker'],rubricId=n['details']['rubricId'],topic=e['details']['topic'],
      candidateEvidenceNodes=e['inputs'],sourceGraphPath=str(p.relative_to(ROOT)),sourceGraphHash=g['contentHash'],
      checkedFindingIds=[f['id'] for f in findings if f['ticker']==g['ticker'] and f['rubricId']==n['details']['rubricId'] and f['topic']==e['details']['topic']],
      topicSpecificSufficiencyProven=False,counterEvidenceDisposition='RETAINED_CANDIDATES_NOT_TOPIC_ADMITTED',
      counterEvidenceReferences=n['details']['retainedAssessment'].get('counterEvidenceRefs',[]),
      counterArgument=n['details'].get('nativeRationale'),
      successorConflictReference='vn30-underwriting-v2/fund-bridge-successor.json#'+g['ticker'] if g['ticker'] in ['BSR','GVR'] else None,
      successorConflictAdmitted=False,expiredObservationBindings=expired,
      required=['TOPIC_SPECIFIC_SOURCE_AND_SEMANTIC_REVIEW','COUNTEREVIDENCE_AND_DISTINCT_ECONOMIC_CHANNEL','FRESH_ADMITTED_BINDING','AI_DI_TRUSTED_PROVENANCE'],
      readyForScoring=False))
   rubrics.append(dict(ticker=g['ticker'],rubricId=n['details']['rubricId'],maxPoints=n['details']['maxPoints'],topicIds=ids,
    retainedHistoricalPoints=n['value'],retainedHistoricalAssessmentHash=n['details']['retainedAssessmentHash'],
    currentAssessment=None,currentReadyForScoring=False,autoRenewedBindings=0))
 assert len(rubrics)==690 and sum(r['retainedHistoricalPoints'] is None for r in rubrics)==688
 write('topic-review-worklist.json',dict(contract='ai-topic-remediation-worklist-v1',topics=topics,rubrics=rubrics,
  rubricCount=len(rubrics),topicCount=len(topics),retainedUnratedRubrics=688,currentReadyRubrics=0,financialCriteriaChanged=False))
 write('binding-dispositions.json',dict(contract='ai-binding-dispositions-v1',bindings=retired,count=len(retired),
  historicalBindingsChanged=False,currentSelection='EXCLUDE_ALL_EXPIRED_UNTIL_NEW_ADMITTED_BINDING',automaticRenewal=False))
 challenges=[]
 for t in ['ACB','VNM','FPT','GAS','HPG','MBB','MWG','SSI','TCB','VCB','VHM','VPL','VRE']:
  p=BASE/f'held-normalization-v1/issuers/{t}.json'
  if not p.exists():p=ROOT/f'docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-30/b6-underwriting-r4/issuers/{t}.json'
  d=read(p);pins[str(p.relative_to(ROOT))]=sha(p)
  objections=['Current dated common share/action/price basis not admitted','Tax, common-owner attribution and forecast cycle require source-specific challenge','Scenario arithmetic agreement alone does not independently validate inputs']
  verdict='CONDITIONAL_RESEARCH_ONLY'
  if t=='VHM':objections+=['Book-value crosscheck is not project RNAV','Missing remaining project cash/cost/timing/ownership/legal/debt and corporate bridge'];verdict='PRIMARY_MODEL_BLOCKED'
  if t=='VPL':objections+=['Pooled group DCF does not isolate hospitality, property and finance claims','Reported segment profit is not proven hotel EBITDA; unallocated pretax loss 4377507 million VND remains'];verdict='POOLED_MODEL_REJECTED_FOR_ACCEPTANCE'
  if t in ['ACB','MBB','TCB','VCB']:objections+=['Three-year loan charges are not a full-cycle asset-quality validation; regulatory distribution headroom unproven']
  if t=='SSI':objections+=['Matched trading/hedging legs and available regulatory capital need separate checks; margin funding is operating, not generic enterprise net debt']
  challenges.append(dict(ticker=t,inputPath=str(p.relative_to(ROOT)),inputSha256=sha(p),counterArguments=objections,
     verdict=verdict,financialAccepted=False,independentHumanReviewClaimed=False,trustedAiPassProvenanceComplete=False))
 write('model-challenge.json',dict(contract='conditional-model-challenge-v1',models=challenges,criteriaOrWeightsChanged=False))
 write('di-provenance-readiness.json',dict(contract='ai-di-remediation-readiness-v1',target='personal-ai-di-acceptance-v1',
  retainedLineageIsDiAcceptance=False,contentHashIsSessionAuthentication=False,trustedPreparationArtifact=None,trustedChallengeArtifact=None,
  ownerAuthorizationScope='RESEARCH_AND_PREVIEW_NOT_PRODUCTION_SCORING',
  financialRulesHash=read(BASE/'vn30-lineage-v1/acceptance-snapshot.json')['financialRulesHash'],
  requiredDiGates=['DI'+str(i) for i in range(1,16)],
  gateDispositions=[dict(gate='DI'+str(i),status='NOT_EVALUATED_BY_THIS_RESEARCH_PACKAGE',acceptedEvidenceReference=None) for i in range(1,16)],
  missing=['TOPIC_SEMANTIC_ADMISSION','COUNTEREVIDENCE_REVIEW','CURRENT_UNEXPIRED_BINDINGS','FINANCIAL_NORMALIZATION_AND_VALUE_QUALIFICATION','TRUSTED_DISTINCT_AI_PASS_ARTIFACTS_AND_SERVER_BINDINGS','REGISTERED_EXACT_DATASET_DI_ACCEPTANCE'],
  financialAcceptance='BLOCKED',productionScoringAuthorized=False,navAuthorized=False,tradingAuthorized=False))
 for p in [ROOT/'data/manual-download/VHM/VHM_Baocaotaichinh_2025_Kiemtoan_Hopnhat.pdf',ROOT/'data/manual-download/VPL/VPL_Baocaotaichinh_2025_Kiemtoan_Hopnhat.pdf']:
  pins[str(p.relative_to(ROOT))]=sha(p)
 for p in [BASE/'vn30-lineage-v1/acceptance-snapshot.json',BASE/'vn30-underwriting-v2/fund-bridge-successor.json']:
  pins[str(p.relative_to(ROOT))]=sha(p)
 files=[p for p in OUT.glob('*.json') if p.name not in ['manifest.json','VALIDATION.json']]
 write('manifest.json',dict(contract='acceptance-remediation-manifest-v1',sourcePins=pins,
  components=[dict(path=p.name,sha256=sha(p)) for p in sorted(files)],productionApplication='NONE',productionScoringAuthorized=False,navAuthorized=False,tradingAuthorized=False))
 print(json.dumps(dict(rubrics=len(rubrics),topics=len(topics),expiredBindings=len(retired),challengedModels=len(challenges))))
if __name__=='__main__':build()
