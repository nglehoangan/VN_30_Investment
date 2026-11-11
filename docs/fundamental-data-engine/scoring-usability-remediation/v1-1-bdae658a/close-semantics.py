from pathlib import Path
import json,hashlib,collections,unicodedata,copy
R=Path.cwd();O=R/'docs/fundamental-data-engine/scoring-usability-remediation/v1-1-bdae658a';V=R/'docs/fundamental-data-engine/scoring-usability-audit/v1-ad81bdce'
def read(p):return json.loads(p.read_text())
def write(n,x):(O/n).write_text(json.dumps(x,ensure_ascii=False,indent=2,sort_keys=True)+'\n')
def fold(s):return ''.join(c for c in unicodedata.normalize('NFD',s.lower().replace('đ','d'))if not unicodedata.combining(c))
base=read(V/'VN30_ISSUER_RUBRIC_MATRIX.json');after=copy.deepcopy(base);ledger=read(V/'FINANCIAL_EVIDENCE_LEDGER.json');pack=read(O/'semantic-search-pack.json');pins=read(V/'SOURCE_PINS.json');pins.update(read(O/'semantic-source-pins.json'))
issuer={
'ACB':'FY2025 CAR/CET1 and market-risk sensitivity disclosures are separate from a quantified loss/funding/capital recovery scenario. The issue note reports dividend shares from prior retained profits. No independent market-share denominator was established.',
'BID':'Risk notes describe VaR, NII/EVE and liquidity controls. Retained narrative claims a leading interbank FX/bond position, not a quantified independently verified market share. State/strategic/common and subsidiary ownership must remain separate.',
'BSR':'FY2025 capital-increase resolution and related-party/product-supply disclosures exist. Cashflow and cost data need oil-price/inventory-cycle and realized investment-outcome interpretation; no shock values are invented from a search non-hit.',
'CTG':'FY2025 dividend-share issue and rate-risk scenario methodology are disclosed. Existing cross-vintage financial conflicts remain local to dependent return/growth inputs; an auditor opinion is not governance alignment or stress-capital proof.',
'FPT':'Related-party and geographic-segment disclosures exist; generic share-capital accounting is not evidence of a specific parent issuance. FTEL consolidation/equity-method comparability and completion-estimate cash recognition remain bounded as in the prior challenged research.',
'GAS':'A 2025 equity-funded capital-increase resolution is disclosed. Mechanical bonus/share capitalization does not itself create per-share value; supply-contract, contractual cashflow and group/parent distribution economics remain distinct.',
'GVR':'Group financing cash receipts cannot identify parent common issuance or minority dilution without the equity bridge. Parent related-party transactions are disclosed; group cash and earnings cannot be allocated to the parent by profit proportions.',
'HDB':'ICAAP/capital-planning procedures and group issuance cashflow are disclosed. A stated scenario process is not the quantitative loss-to-capital response; group financial subsidiaries and issuer-share denominators require separate binding.',
'HPG':'The note reports a 20% stock dividend; unpaid construction/fixed-asset additions are not cash capex. A retained June-2026 construction-steel share claim is a later issuer assertion, not FY2025 independent market share or through-cycle cost advantage.',
'LPB':'A 3–5 year capital-plan process and dividend-share terms are retained. Aspiration to increase market share is not an observed market-share denominator; planned stress responses require actual calibrated outcomes before a band.',
'MBB':'Retained market-share/competitiveness material and group rate-risk disclosures are available. Company-compiled peer statistics must retain their original date/population; group subsidiaries/minorities and original/restated financial periods cannot be silently combined.',
'MCH':'The capital note describes a share-capitalization ratio and related-party receivables are disclosed. A share premium capitalization is not economic value creation, and distribution/cost position needs segment and common-owner incidence evidence.',
'MSN':'Group equity cashflow and related-party transactions are present. Parent/common versus subsidiary/NCI issuance, mining/other obligations and investment outcomes require issuer-specific reconciliation; consolidated financing receipts are not a parent per-share return.',
'MWG':'The financing statement explicitly includes non-controlling-owner capital, and related-party disclosure is retained. Store/format outcomes and reinvestment payback require cohorts; an ESOP/parent dilution bridge cannot be inferred from that group cash line.',
'SAB':'The retained EPS note identifies a revised employee-benefit-fund deduction. Generic share-premium policy is not a dated new issuance; distributions, recurring common earnings and same-action EPS comparability must be reconciled.',
'SHB':'Share-offer/employee-plan terms and interest-risk gap disclosures exist. Proposed/public/private/employee offerings need dated completion and proceeds-use evidence; an interest gap table is not a completed funding/capital stress response.',
'SSB':'A disclosed employee share-issue result is a concrete action lead; trading-book stress-process language is procedural. Economic dilution needs terms, proceeds and common-owner per-share effects rather than issued-share quantity alone.',
'SSI':'Sensitivity, related-party, group issuance and investing cash disclosures are retained. Client/custody cash is not corporate liquidity, and FVTPL gains and asset balances do not establish recurring earnings or investment returns.',
'STB':'The rate-risk note explicitly states that interest-rate sensitivity analysis was not performed at the stated date. This is counterevidence to a completed sensitivity claim, not a zero shock or proof that all possible stress evidence is absent.',
'TCB':'Reuse the qualified P2.6 disclosures and historical FH-BS draft. FY2025 bank-core NPL and legacy mixed-population ratios stay distinct; behavioral repricing assumptions are not a complete stress response. All hypothetical sandbox economics remain context-only.',
'TCX':'The risk note states no interest-rate sensitivity calculation under its stated risk rationale. Issuance cash and related-party disclosures are present; client assets, realized/unrealized FVTPL, common numerator and the bounded 1-VND discrepancy remain separate.',
'VCB':'Risk-gap disclosures and related-party note sections are retained. Existing ten sealed cross-vintage conflicts stay tied to their periods; generic common-share policy does not prove complete action history or stressed asset quality.',
'VHM':'Related-party and consolidated financing/investing disclosures are available. Preserve NCI and common-owner earnings populations; group issuance cash and project cashflow cannot establish parent share value or unrestricted debt capacity.',
'VIB':'The retained trading strategy seeks market-share growth; that is an objective, not an independently measured share. Equity movements and rate-risk schedules need dated action and capital-response reconciliation.',
'VIC':'Group related-party, capital and financial-risk disclosures exist. Dividend/share accounting policy is not completion evidence; retain legacy closing-column/debt exceptions and subsidiary/NCI populations before common-owner or stress inferences.',
'VJC':'The financing statement reports share-issuance cash and related-party disclosures are retained. Actual issuance terms, aircraft/lease capital and realized reinvestment outcomes need reconciliation; capital raised is not evidence of value accretion.',
'VNM':'The retained annual narrative discusses industry competition and scenario governance, and prior challenged industry/governance assessments are preserved. A subsidiary share acquisition dated 2021 is not a 2025 parent issue; new common-owner per-share comparisons need compatible scopes and actions.',
'VPB':'The notes identify an IPO/share issuance at a securities subsidiary. It must not be labelled a parent-bank share issue; the group sensitivity table and common/regulatory capital need distinct populations and minority-incidence analysis.',
'VPL':'Related-party balances and group capital receipts are retained. Resort/tourism asset commitments, parent/NCI allocation and action/share history are separate from current group book/cash; no per-share value or normalized return is inferred.',
'VRE':'Related-party receivables and financing disclosures exist; a prior-period group capital receipt is not proof of a current parent issuance. Tenant/property cash economics and common-owner value across actions/cycle remain separate.'}
missing={
'FH-STRESS':'A source-bounded quantified sector shock, loss/cash transmission, usable funding response and capital/deduction bridge for the same date and scope. A policy/process statement or reported sensitivity alone does not complete all three topics.',
'IC-IND':'Evidence-supported barriers, competitive behavior, industry demand and disruption, with dates and counterevidence. Licence/business descriptions and issuer revenue are partial context, not an industry rating.',
'IC-POS':'Dated market/product/cohort denominator, comparable relative cost position and actual distribution economics. Own-company share claims, branch counts and gross margin alone do not establish all topics.',
'IC-CYCLE':'Dated independent cycle position and forward/downside asymmetry plus issuer survivability. Historical income and financial-risk sensitivity are not an industry-cycle forecast.',
'RG-GOV':'Disclosure behavior, related-party terms/fairness, minority protections and auditor findings interpreted jointly. An unmodified opinion or reported related balances does not itself establish good governance.',
'RG-UNC':'Explicit forecast/model ranges, sensitivities and shared dependencies with qualified assumptions. Accounting estimation wording or conditional normalization candidates are not approved forward model ranges.',
'CA-REINV':'Named capex/acquisition/divestment cohorts, maintenance/growth split, subsequent realized after-tax common-owner returns and decision rationale. Spending or goodwill accounting alone is insufficient.',
'CA-DIL':'Completed parent/common action terms and dates, actual proceeds/use, adjustments across the relevant EPS/share horizon and economic dilution analysis. Subsidiary issuance or generic accounting policy is insufficient.',
'CA-PSV':'Comparable sustainable common-owner per-share value over time, complete action bridge and cycle normalization. Current/weighted shares and reported EPS are different populations; a stock dividend is not value creation.',
'BQ-RES':'Customer/project/funding concentration, actual pricing behavior, cyclicality and adverse-stress evidence. Segment disclosures and book balances do not themselves prove pricing power.'}
notes={};closure=[];rejections=[]
for case in pack['rows']:
 row=next(x for x in after['rows']if x['id']==case['id']);allids=[];hasmarketclaim=False
 for topic in case['topics']:
  selected=[]
  for h in topic['selectedPassages']:
   f=fold(h['excerpt']);why=None
   if topic['topic']=='acquisitions'and ('giao dich ban va mua lai'in f or 'trai phieu chinh phu'in f)and 'mua cong ty'not in f:why='REPO_OR_SECURITY_REPURCHASE_NOT_MA_COHORT'
   if topic['topic']=='cycle'and ('it rui ro lien quan'in f or 'khoan tuong duong tien'in f)and 'chu ky'not in f:why='CASH_EQUIVALENT_VALUE_STABILITY_NOT_INDUSTRY_CYCLE'
   if topic['topic']=='funding_response'and ('95%'in f or '85%'in f)and 'thoi han con lai'in f and 'thanh khoan'not in f:why='COLLATERAL_HAIRCUT_NOT_FUNDING_RESPONSE'
   if topic['topic']=='related_parties'and 'cac ben lien quan den cong cu tai chinh'in f:why='CONTRACT_COUNTERPARTY_NOT_RELATED_PARTY_GOVERNANCE'
   if why:rejections.append({'id':case['id'],'topic':topic['topic'],'binding':h['binding'],'reason':why});continue
   # Every accepted excerpt remains partial reported-text context, never full topic proof.
   selected.append(h)
   key=case['id']+':DISCLOSURE:'+topic['topic']+':'+str(len(selected))
   ledger[key]={'ticker':case['ticker'],'concept':'DISCLOSURE_CONTEXT:'+topic['topic'],'value':h['excerpt'],'original':h['excerpt'],'periodStart':None,'periodEnd':None,'scope':None,'unit':'TEXT','quality':'UNQUALIFIED_RETAINED_TEXT_CONTEXT','evidenceStatus':'PARTIAL_CONTEXT_NOT_FULL_TOPIC_PROOF','publicationAt':None,'binding':h['binding'],'pdfEvidence':{'path':h['pdfPath'],'sha256':h['pdfHash'],'page':h['physicalPage']},'dimensionLimit':'Original document/page and text retained; date/scope/units are not inferred from a filename or nearby number. Source-year and source-scope qualification required before use in an assessment.','productionAdmissible':False}
   allids.append(key)
   if topic['topic']=='share':hasmarketclaim=True
  topic['semanticAcceptedPassages']=selected
  topic['reviewDisposition']='PARTIAL_RETAINED_DISCLOSURE_NEEDS_INTERPRETATION'if selected else 'PARTIAL_TYPED_FINANCIAL_CONTEXT'if topic['existingFinancialContextIds']else 'FULL_TOPIC_NOT_ESTABLISHED_IN_REVIEWED_SCOPE'
  topic['requiredResolution']=missing[case['rubric']]
  topic['negativeSearchIsAbsenceProof']=False
  topic['existingFinancialContextIds']=[i for i in topic['existingFinancialContextIds']if not(case['sector']=='BANK'and ledger[i]['concept']in ['CFO','FCF','CFO_REPORTED_NPAT','CUMULATIVE_CFO_REPORTED_NPAT','POST_ACQUISITION_CASH'])]
  allids.extend(topic['existingFinancialContextIds'])
 # All target rows have actually retrieved related context; if not, retain NOT_INSPECTED honestly.
 primary='ANALYST_ASSESSMENT_REQUIRED'if case['rubric']in ['RG-GOV','RG-UNC','IC-IND']or(case['rubric']=='IC-POS'and hasmarketclaim)else 'MAPPING_GAP'
 if not allids:primary='NOT_INSPECTED'
 row['beforePrimaryClassification']=row['primaryClassification'];row['primaryClassification']=primary
 row['secondaryBlockers']=[x for x in row['secondaryBlockers']if x not in ['FULL_TOPIC_REVIEW_NOT_INSPECTED','FULL_TOPIC_SOURCE_REVIEW_NOT_COMPLETED','ALL_23_VALID_ASSESSMENTS_REQUIRED_BY_EXECUTABLE']]+['FULL_TOPIC_QUALIFICATION_STILL_INCOMPLETE','NO_HUMAN_ADOPTION_OR_FORMAL_ADMISSION','SOURCE_DATE_SCOPE_AND_ACTION_BRIDGES_REQUIRED']
 row['evidenceIds']=list(dict.fromkeys(row['evidenceIds']+allids))
 for t in row['topics']:
  st=next(x for x in case['topics']if x['topic']==t['topic']);t['financialContextEvidenceIds']=list(dict.fromkeys(t['financialContextEvidenceIds']+st['existingFinancialContextIds']));t['status']=st['reviewDisposition'];t['fullTopicQualifiedForFormalScore']=False
 row['uninspectedFullTopics']=[];row['semanticReview']={'classification':'RESEARCH_PROVISIONAL','sourceReviewScope':'Retained financial JSON, all note-page search inventory, retrieved topic passages and existing research/draft assessments; not an independent image/OCR/publication certification.','issuerSpecificJudgment':issuer[case['ticker']],'counterevidenceAndLimits':missing[case['rubric']],'sourceContentsAvailable':True,'fullTopicEvidenceReady':False,'completedAssessmentAdded':False,'formalPoints':None,'humanApproval':None,'topicReview':[{'topic':t['topic'],'disposition':t['reviewDisposition'],'sourcePassages':t['semanticAcceptedPassages'],'financialContextIds':t['existingFinancialContextIds'],'fullTopicQualified':False}for t in case['topics']]}
 row['reason']='Retained evidence recovered and semantically reviewed: '+issuer[case['ticker']]+' '+missing[case['rubric']]
 row['preliminaryResearchAssessmentStatus']='SEMANTIC_CONTEXT_REVIEWED_NOT_BAND_READY'
 case['afterPrimaryClassification']=primary;case['issuerSpecificJudgment']=issuer[case['ticker']];case['counterevidenceAndRequiredResolution']=missing[case['rubric']];case['assessmentComplete']=False;case['humanApproval']=None;closure.append(case)
# Correct G1's max/min error on every row without rewriting the historical audit.
for row in after['rows']:
 row['secondaryBlockers']=[x for x in row['secondaryBlockers']if x!='ALL_23_VALID_ASSESSMENTS_REQUIRED_BY_EXECUTABLE']
 row['inputArrayContractCorrection']='assessments length <=23; partial input is supported. A complete total still requires complete defensible categories under the unchanged executable.'
 row['formalPoints']=None;row['qualifiedScore']=None;row['formalDecision']=None
counts=collections.Counter(x['primaryClassification']for x in after['rows']);after['baselineCommit']='bdae658ab3ab6588a0703df9c132f29a08aea84f';after['predecessorAuditBaseline']=base['baselineCommit'];after['contract']='vn30-scoring-usability-targeted-remediation-v1.1';after['primaryCounts']={k:counts[k]for k in base['primaryCounts']};after['classification']='RESEARCH_PROVISIONAL_REMEDIATION_REVIEW'
write('VN30_ISSUER_RUBRIC_MATRIX.json',after);write('FINANCIAL_EVIDENCE_LEDGER.json',ledger);write('SOURCE_PINS.json',pins);write('SEMANTIC_COVERAGE_CLOSURE.json',{'contract':'semantic-closure-v1.1','baselineCommit':after['baselineCommit'],'reviewer':'CODEX_RESEARCH_ANALYSIS_NOT_HUMAN_APPROVAL','targetCount':250,'reviewedCount':len(closure),'newCompletedFullTopicAssessments':0,'preservedChallengedAssessments':25,'preservedTcbHistoricalDraft':1,'formalScoreableNow':0,'classificationCounts':dict(collections.Counter(x['afterPrimaryClassification']for x in closure)),'rows':closure,'sourceInventory':pack['inventory'],'searchNonhitNeverProvesAbsence':True});write('SEMANTIC_CHALLENGE.json',{'rejectedCandidatePassages':rejections,'challenge':'False friends and context misattribution removed; governance opinion != alignment; policy definitions != outcomes; subsidiary/capital receipts != parent issuance; later market-share claims != FY2025 evidence. Full topic qualification remains false.','independentHumanReview':False})
# All mandatory M3 topics remain REQUIRED. Metric rows are SUPPORTING unless the selected economic model specifically requires them.
dep=[]
for row in after['rows']:
 required=[{'kind':'TOPIC','id':row['id']+':TOPIC:'+t,'topic':t,'role':'REQUIRED','rule':'Every approved M3 mandatory topic needs qualified, issuer-specific evidence/counterevidence. No role downgrade or missing-as-zero.'}for t in row['requiredTopics']]
 supporting=[{'kind':'EVIDENCE','id':i,'role':'SUPPORTING','status':ledger[i]['evidenceStatus'],'topicProofByItself':False}for i in row['evidenceIds']]
 conditional=[]
 if row['rubric']=='VAL-RET':conditional.append({'id':'QUALIFIED_EXPECTED_RETURN','kind':'METRIC','role':'REQUIRED','condition':'Always required by VAL-RET; approved model, compatible price/actions and assumptions remain needed.'})
 if row['rubric']=='VAL-PRIMARY':conditional.append({'id':'SELECTED_PRIMARY_MODEL_OPERANDS','kind':'METRIC','role':'REQUIRED','condition':'Only operands of the actually qualified selected model; not every optional ratio.'})
 dep.append({'id':row['id'],'ticker':row['ticker'],'rubric':row['rubric'],'sector':row['sector'],'dependencies':required+supporting+conditional,'contextOnly':[{'id':'UNUSED_PROVIDER_REFERENCE_OR_UNAPPROVED_SCENARIO','kind':'EVIDENCE','role':'CONTEXT_ONLY','cannotSatisfyMandatoryTopics':True}],'actionDependency':{'requiredByRubric':row['rubric']in ['GQ-HIST','VAL-PRIMARY','VAL-RET','VAL-MOS','CA-REINV','CA-DIST','CA-DIL','CA-PSV'],'additionalRule':'Also required if the assessment actually consumes share/per-share evidence or action-sensitive metric operands.'}})
write('RUBRIC_DEPENDENCY_MATRIX.json',{'contract':'rubric-dependency-review-proposal-v1','status':'OWNER_REVIEW_PENDING_NOT_RUNTIME_AUTHORITY','roles':['REQUIRED','SUPPORTING','CONTEXT_ONLY'],'rules':{'requiredFailure':'Block dependent rubric; complete total stays null; no redistribution.','supportingFailure':'Require confidence/evidence review; cannot silently bypass a missing required topic.','contextFailure':'Display as context issue; cannot by itself block all scoring or lower global confidence; cannot serve as topic proof.','cyclicalNormalization':'Unchanged. Failed economic metric normalization cannot be relabelled usable. Role selection only separates descriptive context from actually used score support.','confidence':'No automatic upgrade. Mandatory evidence and genuine Weak/confidence guard remain intact.'},'rows':dep,'productionAdmissible':False})
write('BEFORE_AFTER_COUNTS.json',{'before':base['primaryCounts'],'after':after['primaryCounts'],'transitions':[{ 'from':a,'to':b,'count':n}for (a,b),n in collections.Counter((r['beforePrimaryClassification'],r['afterPrimaryClassification'])for r in [{'beforePrimaryClassification':'NOT_INSPECTED','afterPrimaryClassification':c['afterPrimaryClassification']}for c in closure]).items()],'formalPointsAdded':0,'researchAssessmentsAdded':0,'financialNumericValuesChanged':0})
print('Closed',len(closure),'target rows;',after['primaryCounts'],'rejected',len(rejections),flush=True)

path=O/'RUBRIC_DEPENDENCY_MATRIX.json';dep=json.loads(path.read_text())
for r in dep['rows']:
 p=f"data/manual-extracted-api/{r['ticker']}.json"
 r['contextOnly']=[{'id':r['id']+':CAFEF_REFERENCE','kind':'EVIDENCE','role':'CONTEXT_ONLY','binding':{'path':p,'sha256':pins[p],'jsonPointer':''},'cannotSatisfyMandatoryTopics':True,'qualification':'Unselected provider variants/unknown dimensions remain reference, not admitted topic proof.'}]
 if r['ticker']=='TCB':
  p='docs/fundamental-data-engine/dfr-05/tcb-sandbox-v1-cf987271/scenario-outputs.json'
  r['contextOnly'].append({'id':r['id']+':SANDBOX_REFERENCE','kind':'EVIDENCE','role':'CONTEXT_ONLY','binding':{'path':p,'sha256':pins[p],'jsonPointer':''},'cannotSatisfyMandatoryTopics':True,'qualification':'HYPOTHETICAL_ONLY_NOT_APPROVED_INTRINSIC_VALUE'})
 source=next(x for x in after['rows']if x['id']==r['id'])
 for x in r['dependencies']:
  if x['kind']=='TOPIC':
   t=next(t for t in source['topics']if t['topic']==x['topic']);x['candidateFinancialContextIds']=t['financialContextEvidenceIds'];x['qualifiedFormalUsable']=False;x['researchAssessmentBinding']=source['existingResearchAssessment']
write('RUBRIC_DEPENDENCY_MATRIX.json',dep)
