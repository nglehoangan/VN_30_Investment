"""Final bounded rubric challenge. No scoring-policy edits or financial re-admission."""
import json,hashlib,datetime
from decimal import Decimal,localcontext
from pathlib import Path
R=Path.cwd();O=Path(__file__).resolve().parent;B=R/'docs/fundamental-data-engine'
read=lambda p:json.loads(p.read_text())
def pin(p):return {'path':str(p.relative_to(R)),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
def write(n,x):(O/n).write_text(json.dumps(x,ensure_ascii=False,sort_keys=True,indent=2)+'\n')
context=O/'REVIEW_CONTEXT.json'
if not context.exists():write('REVIEW_CONTEXT.json',{'reviewedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='milliseconds').replace('+00:00','Z'),'meaning':'Actual recording of this source/analysis review; not original publication or retrieval time.'})
notes=R/'data/manual-extracted-pdf/notes/VNM.json';n=read(notes)
parent=R/n['documents'][1]['pdfPath'];group=R/n['documents'][6]['pdfPath']
# Values were visually checked against retained PDFs on physical pages 29/30/47 and 37/40.
selected={'parentSubsidiaryCostOpening':'11286657328956','parentSubsidiaryCostClosing':'11644853328956','laoJagroCostOpening':'1543008591832','laoJagroCostClosing':'1901204591832','mirakaCost':'293189808669','mirakaProvision2024':'163615868630','mirakaProvision2025':'293189808669','parentDividendProfitSharingIncome2024':'607267424822','parentDividendProfitSharingIncome2025':'496172279490','parentInvestmentImpairmentExpense2024':'193942663338','parentInvestmentImpairmentExpense2025':'129573940039','groupPpeGrossOpening':'32713051932999','groupPpeGrossClosing':'34581520458638','groupPpeDirectAdditions':'465078910417','groupCwipTransfers':'1311307265616','groupPpeDepreciation':'2034035090631','groupPpeNetOpening':'11520200967499','groupPpeNetClosing':'11618118961976','apisEquityOpening':'56176599876','apisEquityClosing':'64753338714','coconutEquityOpening':'171921215787','coconutEquityClosing':'281431848125','parentCoconutCostOpening':'117730000000','parentCoconutCostClosing':'180628220000'}
for key,value in selected.items():
 formatted=f'{int(value):,}'.replace(',','.')
 pages=[n['documents'][d]['pages'][p]['text'] for d,p in [(1,28),(1,29),(1,46),(6,36),(6,39)]]
 assert any(formatted in text for text in pages),(key,formatted)
assert int(selected['parentSubsidiaryCostClosing'])-int(selected['parentSubsidiaryCostOpening'])==int(selected['laoJagroCostClosing'])-int(selected['laoJagroCostOpening'])==358196000000
assert int(selected['mirakaProvision2025'])-int(selected['mirakaProvision2024'])==int(selected['parentInvestmentImpairmentExpense2025'])
sourceReview={'reviewContext':read(context),'contract':'retained-allocation-notes-review-v1','sourcePins':[pin(parent),pin(group),pin(notes)],'physicalPagesReviewed':{'parent':[29,30,47],'consolidated':[37,40]},'reviewMethod':'JSON first, then native PDFKit page rendering and visual inspection of year/scope/caption/selected values. No source download or rewrite.','selectedReportedValuesVnd':selected,'factAdmission':'NO_NEW_NATIVE_FACT_ADMISSION; source-pinned reviewed research evidence only','limits':['Dividend/profit-sharing income is reported accrual income, not a cash-only IRR.','Parent provisions and consolidated associate losses overlap economically and are not summed.','Equity-method carrying changes are not standalone project returns or fair values.','Intragroup Lao-Jagro contributions are not added to consolidated CAPEX.','No disposal price or positive exit return is inferred for Del Monte.'],'rendererWarnings':'PDFKit logged JBIG2 EOF warnings; all five selected page images were legible and checked. No clean rendering claim for other pages.'}
write('ALLOCATION_SOURCE_REVIEW.json',sourceReview)
I=read(B/'vnm-s1-economic-returns/2026-11-13/S1_INPUTS.json');S=read(B/'vnm-s1-economic-returns/2026-11-13/S1_ECONOMIC_RETURNS.json');C=read(B/'vnm-formal-scoring-step1/2026-11-13/VNM_ASSESSMENT_CANDIDATES.json')
with localcontext() as ctx:
 ctx.prec=45
 fs=I['flows'];margins=[Decimal(f['grossProfit'])/Decimal(f['revenue']) for f in fs.values()];anchors=[min(margins),sum(margins)/len(margins),max(margins)]
 sensitivity=[]
 for margin in anchors:
  for tax in map(Decimal,I['selectedTaxRates']):
   for knownCosts in [False,True]:
    scenario=next(s for s in S['scenarios'] if s['annual'][0]['taxRate']==str(tax) and s['annual'][0]['knownCostCase']==knownCosts and s['annual'][0]['cashExclusionFraction']=='0' and s['annual'][0]['residualLiabilityOperatingFraction']=='0')
    values=[]
    for a in [scenario['annual'][0],scenario['annual'][-1]]:
     f=fs[str(a['year'])];cycleDelta=Decimal(f['revenue'])*margin-Decimal(f['grossProfit']);values.append(Decimal(a['nopatEstimate'])+cycleDelta*(1-tax))
    for capScenario in [s for s in S['scenarios'] if s['annual'][0]['taxRate']==str(tax) and s['annual'][0]['knownCostCase']==knownCosts]:
     a,z=capScenario['annual'][0],capScenario['annual'][-1];dc=Decimal(z['closingCapital']['value'])-Decimal(a['closingCapital']['value'])
     sensitivity.append({'uniformGrossMargin':str(margin),'taxRate':str(tax),'knownCostCase':knownCosts,'capitalScenario':capScenario['id'],'deltaCycleNormalizedNopatEstimate':str(values[1]-values[0]),'deltaBookCapital':str(dc),'unqualifiedRatio':str((values[1]-values[0])/dc) if dc>0 else None,'qualifiedIncrementalRoic':None})
prior=read(B/'vnm-step4-targeted-remediation/2026-11-17/VNM_ECONOMIC_BRIDGES.json')
rows=[]
for row in prior['rows']:
 r=json.loads(json.dumps(row))
 if r['rubricId']=='CA-REINV':
  r.update({'status':'RESEARCH_SUPPORTED_CANDIDATE','candidateBand':{'label':'Mixed/acceptable','min':1,'max':1},'candidatePoints':1,'confidence':'LOW','remainingEconomicDependency':None,'assessment':'Mixed allocation outcomes support the existing middle ordinal band: operating assets commissioned while core operations persist; reported subsidiary/investee distributions coexist with two years of material impairment expense and a fully impaired investment. Distinct disclosed capex, investment and exit chronology was reviewed. No recurring-accretion/max-point claim, no project IRR or profitable divestment inferred. This is evidence-supported mixed judgment, not a default midpoint from missing data.','maximumPrerequisitesMet':False,'formalAdopted':False,'newSourceReference':'ALLOCATION_SOURCE_REVIEW.json','counterevidence':'New Lao-Jagro/beef investments lack mature realized-return measurement; dividend/profit-sharing income fell; impairment persisted. Those limitations bar the consistently-accretive maximum.','doubleCountControl':'Allocation choices/outcome dispersion only. Do not award a second point for S1 annual ROIC or GQ-INC ratios.'})
 rows.append(r)
write('FOUR_RUBRIC_FINAL_REVIEW.json',{'contract':'vnm-four-rubric-final-challenge-v1','rows':rows,'currentEvidenceBlocked':['GQ-INC','CA-DIST','CA-PSV'],'newSupportedCandidate':'CA-REINV','supportedCandidateBandCount':20,'formalAdoptedPoints':None,'cycleNormalizationSensitivity':sensitivity,'sensitivityMeaning':'One common own-history gross-margin anchor is applied symmetrically to FY2022/FY2025, preserving selling/G&A, funds and existing cost/tax scenarios. Diagnostic only: no new M3 threshold, no selective favorable case, no certified common-owner EPS or marginal denominator. Contrasting cost scenarios still prevent a unique robust GQ-INC band.','CA_PSV_Review':'Cycle-normalized operating earnings can be nearly flat while reported common EPS grows. Group/NCI operating sensitivity is not a common-owner intrinsic-value bridge; neither a real-compounding point nor missing-as-zero is forced.','CA_DIST_Review':'S2 payability remains closed. Additional notes establish actual retained uses and distributions but do not rank their economic opportunity cost reliably; no maximum binary distribution point is manufactured.','sourceReview':'ALLOCATION_SOURCE_REVIEW.json','oldResearchClosuresPreserved':True})
for r in C['rows']:
 if r['rubricId']=='CA-REINV':
  r.update({'reviewDate':read(context)['reviewedAt'][:10],'candidateBand':{'label':'Mixed/acceptable','min':1,'max':1},'candidatePoints':1,'supportedJudgment':next(x['assessment'] for x in rows if x['rubricId']=='CA-REINV'),'missingIndispensableEvidence':None,'readinessStates':['RESEARCH_SUPPORTED','FORMAL_ASSESSMENT_READY','AUTHORIZATION_PENDING'],'formalSelectedPoints':None,'formalReadinessMeaning':'Content-ready proposal only; no actual adoption or numeric scorecard.'})
  r['sourceReferences'].append(str((O/'ALLOCATION_SOURCE_REVIEW.json').relative_to(R))+'#')
  judgments={'capex':'Reviewed actual asset additions/commissioning, depreciation and operating persistence; not a project IRR or proof of consistently accretive capex.','acquisitions':'Reviewed retained subsidiary/investee capital, reported investment distributions and repeated impairment: observed mixed outcomes, with current immature projects receiving no return credit.','divestments':'Retained disclosure records Del Monte transfer completion in May2025; no profitable exit or disposal-price credit is inferred. Exit-price uncertainty bars a favorable divestment claim, not the bounded mixed allocation assessment.'}
  for topic in r['topicAssessments']:
   topic['support']='BOUNDED_RESEARCH_SUPPORT';topic['judgment']=judgments[topic['topicId']];topic['evidenceRefs'].append(str((O/'ALLOCATION_SOURCE_REVIEW.json').relative_to(R))+'#')
C.update({'contract':'vnm-step4-successor-assessment-candidates-v1','scope':'REVIEW_CANDIDATES_NOT_FORMAL_INPUT','supportedCandidateBands':20,'isExecutableScoreInput':False,'totalScore':None})
write('VNM_ASSESSMENT_CANDIDATES_SUCCESSOR.json',C)
print('Final rubric challenge: CA-REINV candidate Mixed/acceptable; three economic N/R retained.')
