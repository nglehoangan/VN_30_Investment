from pathlib import Path
import json,hashlib,subprocess,sqlite3,collections,decimal,ast,re
R=Path('/Users/nglehoangan/Documents/Working/VN_30_Investment'); O=R/'docs/fundamental-data-engine/scoring-usability-audit/v1-ad81bdce'
BASE='ad81bdcec2615528164828de0987582edbdaa8ec'; PINS={}; CACHE={}; D=decimal.Decimal;decimal.getcontext().prec=50

def sha(p):
 h=hashlib.sha256()
 with p.open('rb')as f:
  for b in iter(lambda:f.read(1048576),b''):h.update(b)
 return h.hexdigest()
def read(p):
 PINS[p]=sha(R/p);return json.loads((R/p).read_text())
def ref(p,ptr=''):return {'path':p,'sha256':PINS.get(p)or sha(R/p),'jsonPointer':ptr}
def write(n,d): (O/n).write_text(json.dumps(d,ensure_ascii=False,indent=2,sort_keys=True)+'\n')
def md(n,s): (O/n).write_text(s.strip()+'\n')
def table(headers,rows):return '| '+' | '.join(headers)+' |\n| '+' | '.join(['---']*len(headers))+' |\n'+'\n'.join('| '+' | '.join(str(x).replace('|','/').replace('\n',' ') for x in r)+' |'for r in rows)
def getmap(name):
 tree=ast.parse((R/'docs/fundamental-data-engine/dfr-05/p2-5-b1-readiness-74510523/proof.py').read_text())
 for n in tree.body:
  if isinstance(n,ast.Assign)and any(isinstance(t,ast.Name)and t.id==name for t in n.targets):return ast.literal_eval(n.value)
DEPS=getmap('DEPENDENCIES');CONTEXT=getmap('ISSUER_CONTEXT');TC=getmap('TOPIC_CONTEXT')
method='src/domain/scoring/methodology.ts';text=(R/method).read_text();PINS[method]=sha(R/method); specs=json.loads(text.split('deepFreeze(',1)[1].rsplit(');',1)[0])
# Read-only active head; immutable mode prevents creating or touching SQLite sidecars.
c=sqlite3.connect('file:'+str(R/'data/vn30.sqlite')+'?mode=ro&immutable=1',uri=True)
h=c.execute('select body_hash from market_boundary_dependency_head').fetchone()[0];row=c.execute('select id,body from dependency_release where body_hash=?',(h,)).fetchone();release=json.loads(row[1]);c.close()
u=next(x for x in release['heads']if x['type']=='UNIVERSE');rd=next(x for x in release['heads']if x['type']=='REFERENCE_DATA');tickers=sorted(x['ticker']for x in u['content']['identities']);sectors={x['ticker']:x['sector']for x in rd['content']['sectors']}
assert len(tickers)==len(set(tickers))==30
O.mkdir(parents=True,exist_ok=True)
# Baseline enumeration was captured before this audit folder; copy receipt at finalization.
write('CONFIGURED_MASTER_RECEIPT.json',{'baseline':BASE,'releaseId':row[0],'bodyHash':h,'releaseEffectiveFrom':release['effectiveFrom'],'universeHeadEffectiveFrom':u['effectiveFrom'],'universe':u,'referenceData':rd,'method':'SQLite mode=ro&immutable=1; no endpoint lookup','semantics':'Master content asOf is not reconstitution effective date.'})
proposalpath='docs/fundamental-data-engine/dfr-05/p2-0-bd3a8b4b/proposed-vn30-universe.json'; proposal=read(proposalpath)
routepath='docs/fundamental-data-engine/dfr-05/p2-1-653d67f7/DFR_05_P2_1_ROUTE_QUALIFICATION_MATRIX.json';routes={x['ticker']:x for x in read(routepath)['rows']}
closurepath='docs/fundamental-data-engine/dfr-04/closure-37e12f2/completion-matrix.json';prior=read(closurepath);priorby={(x['ticker'],x['rubric']):(i,x)for i,x in enumerate(prior)}
# Pin policies and executable, no invocation of scorer/decision or provider adapters.
policies=['docs/01 SYSTEM/INVESTMENT_POLICY.md','docs/01 SYSTEM/SCORING_MODEL_v1.0.md','docs/03 SCORING/SCORING_ENGINE.md','docs/03 SCORING/SECTOR_NORMALIZATION.md','src/domain/scoring/scorecard.ts','src/domain/scoring/metrics.ts','src/domain/scoring/evidence.ts']
for p in policies:PINS[p]=sha(R/p);(R/p).read_text()
TOPIC_ITEMS={**TC,'realization':['CFO','NET_INCOME'],'one_offs':['NET_INCOME','NET_INCOME_ATTRIBUTABLE_PARENT'],'working_capital':['RECEIVABLES','INVENTORY','CURRENT_LIABILITIES'],'recognition':['REVENUE','RECEIVABLES'],'returns':['NET_INCOME','NET_INCOME_ATTRIBUTABLE_PARENT','TOTAL_EQUITY'],'persistence':['NET_INCOME','REVENUE'],'margins':['GROSS_PROFIT','REVENUE','BANK_NET_INTEREST_INCOME','OPERATING_REVENUE'],'capital':['TOTAL_EQUITY','BANK_REPORTED_CAR','BANK_REPORTED_CET1'],'asset_quality':['RECEIVABLES','INVENTORY','BANK_CUSTOMER_LOAN_NPL','BANK_CUSTOMER_LOAN_NPL_RATIO','BANK_LOAN_LOSS_RESERVES','FVTPL_ASSETS'],'funding':['REPORTED_BORROWINGS','FINANCIAL_DEBT','BANK_CUSTOMER_DEPOSITS'],'leverage_context':['TOTAL_ASSETS','TOTAL_EQUITY','FINANCIAL_DEBT'],'obligations':['CURRENT_LIABILITIES','REPORTED_BORROWINGS','FINANCIAL_DEBT'],'liquidity':['CASH_AND_EQUIVALENTS','CURRENT_ASSETS','BANK_CUSTOMER_DEPOSITS'],'trend':['REVENUE','NET_INCOME_ATTRIBUTABLE_PARENT','NET_INCOME','BANK_GROSS_CUSTOMER_LOANS','OPERATING_REVENUE'],'denominator':['TOTAL_EQUITY','TOTAL_ASSETS'],'incremental_return':['NET_INCOME_ATTRIBUTABLE_PARENT','NET_INCOME'],'concentration':['BANK_GROSS_CUSTOMER_LOANS','SECURITIES_MARGIN_LOANS','RECEIVABLES'],'residual_risks':['TOTAL_EQUITY','BANK_LOAN_LOSS_RESERVES'],'dependencies':['NET_INCOME_ATTRIBUTABLE_PARENT']}
# Financial context is deliberately not topic qualification. No equality/fuzzy mapping.
NOTE_TERMS={'RG-GOV':['bên liên quan','ý kiến kiểm toán'],'CA-DIL':['phát hành cổ phiếu','tăng vốn'],'CA-DIST':['cổ tức','mua lại cổ phiếu'],'FH-LIQ':['rủi ro thanh khoản','kỳ hạn còn lại'],'IC-POS':['thị phần'],'IC-IND':['đối thủ cạnh tranh','cạnh tranh'],'BQ-MOAT':['lợi thế cạnh tranh']}
MATRIX=[];LEDGER={};COVER=[];CALCS=[];DETAILS={};LEADS=[];NORMAL=[]
base='docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-30/b6-comparability-r2/native-inputs/'
dossiers={'ACB':'docs/fundamental-data-engine/dfr-05/p2-2-acb-01-264c7120/ACB.json',**{t:f'docs/fundamental-data-engine/dfr-05/p2-3-b1-bank-07b94a51/issuers/{t}.json'for t in ['CTG','MBB','TCB','VCB']},'SSI':'docs/fundamental-data-engine/dfr-05/p2-4-b1-ssi-fc688e49/dossier.json',**{t:f'docs/fundamental-data-engine/dfr-05/p1-a46da9a8/issuers/{t}.json'for t in ['FPT','VNM','BID','TCX','VIC','VHM']}}
for t in tickers:
 print('Inspecting',t,flush=True);p=base+t+'.json';native=read(p);obs=native['observations'];lookup={o['id']:o for o in obs};item=collections.defaultdict(list)
 for i,o in enumerate(obs):
  ident=t+':native:'+o['id']; item[o['itemId']].append(ident)
  LEDGER[ident]={'ticker':t,'concept':o['itemId'],'value':o.get('normalized',{}).get('value'),'original':o.get('raw'),'periodStart':o.get('periodStart'),'periodEnd':o.get('periodEnd'),'periodType':o.get('periodType'),'scope':o.get('reportingScope'),'unit':o.get('normalized',{}).get('unit'),'currency':o.get('normalized',{}).get('currency'),'quality':o.get('quality'),'revision':o.get('revisionKind'),'availability':o.get('availability'),'publication':o.get('publication'),'evidenceStatus':'RETAINED_REVIEW_OBSERVATION_NOT_FORMAL_ADMISSION','binding':ref(p,'/observations/'+str(i)),'transformationReferences':o.get('transformationReferences',[]),'productionAdmissible':False}
 extra=[];dp=dossiers.get(t)
 if dp:
  dd=read(dp)
  for i,m in enumerate(dd['metrics']):
   if m.get('value')is None:continue
   ident=t+':dossier:'+m['id'];item[m['concept']].append(ident)
   LEDGER[ident]={'ticker':t,'concept':m['concept'],'value':m['value'],'original':m.get('raw',m.get('originalValue')),'periodStart':m.get('periodStart'),'periodEnd':m.get('periodEnd'),'periodType':m.get('periodType'),'scope':m.get('scope'),'unit':m.get('unit'),'currency':m.get('currency'),'quality':m.get('status'),'revision':m.get('revisionBasis'),'sourceBinding':m.get('sourceBinding'),'pdfEvidence':m.get('pdfEvidence'),'evidenceStatus':m.get('status'),'binding':ref(dp,'/metrics/'+str(i)),'productionAdmissible':False}
  extra=dd['metrics']
 # Inspect existing normalized earnings outcome, never promote its conditional working case.
 np=f'docs/fundamental-data-engine/scoring-dataset-acceptance/2026-11-04/earnings-normalization-v4/issuers/{t}.json'
 nd=read(np);NORMAL.append({'ticker':t,'binding':ref(np),'acceptedNormalizedCommonEarningsVnd':nd.get('acceptedNormalizedCommonEarningsVnd'),'fundCompletenessProven':nd.get('fundCompletenessProven'),'completeCycleQualified':nd.get('completeCycleQualified'),'remaining':nd.get('counterevidenceAndRemainingWork'),'conditionalWorkingCaseExcludedFromScore':True})
 # Parse all four retained surfaces; inventory dimensions/cells, no automatic semantic qualification.
 surfaces=[]
 for sp in [f'data/manual-extracted-pdf/{t}.json',f'data/manual-extracted-api/{t}.json',f'data/combine/{t}.json']:
  try:
   sd=read(sp);vc=rc=0;years=collections.Counter();scopes=collections.Counter();units=collections.Counter()
   for report in sd.get('reports',{}).values():
    for period in report.get('periods',{}).values():
     for v in period.get('variants',[]):
      vc+=1;years[str(v.get('year',period.get('year')))]+=1;scopes[str(v.get('reportingScope'))]+=1
      for g in v.get('groups',[]):rc+=len(g.get('rows',[]));units[str(g.get('unitEvidence',{}).get('status'))]+=1
   surfaces.append({'binding':ref(sp),'inspection':'PARSED_STRUCTURE_AND_DIMENSIONS_NOT_ALL_CELLS_QUALIFIED','variants':vc,'rows':rc,'years':dict(years),'scopes':dict(scopes),'unitEvidenceStates':dict(units),'productionAdmissible':sd.get('productionAdmissible')})
  except FileNotFoundError:surfaces.append({'path':sp,'inspection':'NOT_INSPECTED_FILE_UNAVAILABLE'})
 notespath=f'data/manual-extracted-pdf/notes/{t}.json';notes=read(notespath);nleads=collections.defaultdict(list);pages=0
 for di,doc in enumerate(notes.get('documents',[])):
  for pi,page in enumerate(doc.get('pages',[])):
   pages+=1;tx=page.get('text','').lower()
   for rubric,terms in NOTE_TERMS.items():
    if len(nleads[rubric])>=3:continue
    hits=[term for term in terms if term in tx]
    if hits:
     at=tx.index(hits[0]);lead={'ticker':t,'rubric':rubric,'binding':ref(notespath,f'/documents/{di}/pages/{pi}'),'physicalPage':page.get('page'),'pdfPaths':doc.get('pdfPaths'),'sourceHash':doc.get('sourceHash'),'terms':hits,'snippet':page.get('text','')[max(0,at-100):at+300],'qualification':'SEARCH_LEAD_ONLY_PERIOD_SCOPE_AND_FULL_TOPIC_REVIEW_PENDING'};nleads[rubric].append(lead);LEADS.append(lead)
 # Compatible historical arithmetic from exact retained observations, not normalized owner economics.
 def choose(concept,year):
  vals=[(i,o)for i,o in enumerate(obs)if o['itemId']==concept and o.get('periodEnd')==f'{year}-12-31' and o.get('quality')=='VALID' and o.get('normalized',{}).get('value')is not None and o.get('reportingScope')=='CONSOLIDATED']
  return vals[0]if len(vals)==1 else None
 def ratio(a,b,name):
  if not a or not b:return
  ia,x=a;ib,y=b
  if any(x.get(k)!=y.get(k)for k in ['periodStart','periodEnd','reportingScope','revisionKind']):return
  nx=x['normalized'];ny=y['normalized']
  if (nx.get('unit'),nx.get('currency'))!=(ny.get('unit'),ny.get('currency'))or D(ny['value'])<=0:return
  value=D(nx['value'])/D(ny['value']);CALCS.append({'id':t+':'+name,'ticker':t,'metric':name,'value':str(value),'displayValue':str(value.quantize(D('.000001'))),'formula':'numerator / denominator','operands':[ref(p,f'/observations/{ia}'),ref(p,f'/observations/{ib}')],'originalValues':[nx['value'],ny['value']],'periodStart':x['periodStart'],'periodEnd':x['periodEnd'],'scope':x['reportingScope'],'unit':'RATIO','revision':x.get('revisionKind'),'classification':'DERIVED_HISTORICAL_REFERENCE','limitations':'Same-period reported population. Not normalized common-owner return, not sustainable economics or a score.'})
 if sectors[t]!='BANK':ratio(choose('CFO',2025),choose('NET_INCOME',2025),'FY2025_REPORTED_CFO_TO_TOTAL_NPAT')
 ratio(choose('TOTAL_EQUITY',2025),choose('TOTAL_ASSETS',2025),'FY2025_GROUP_EQUITY_TO_ASSETS')
 if sectors[t]=='BANK':ratio(choose('BANK_GROSS_CUSTOMER_LOANS',2025),choose('BANK_CUSTOMER_DEPOSITS',2025),'FY2025_REPORTED_LOANS_TO_CUSTOMER_DEPOSITS')
 histories={k:sorted(set(LEDGER[x]['periodEnd']for x in ids if LEDGER[x]['periodEnd']))for k,ids in item.items()}
 bs={r['subcategory']:r for r in native.get('rubricInputs',[])}
 for s in specs:
  rid=s['id'];oldpair=priorby.get((t,rid));old=oldpair[1]if oldpair else None;completed=bool(old and old.get('assessment')and old.get('status')=='COMPLETED_RESEARCH')
  topicrows=[];allids=[]
  for topic in s['topics']:
   ids=[]
   for k in TOPIC_ITEMS.get(topic,[]):ids.extend(item.get(k,[]))
   ids=list(dict.fromkeys(ids));allids+=ids
   topicrows.append({'topic':topic,'financialContextEvidenceIds':ids,'status':'PRIOR_RESEARCH_TOPIC_BINDING_REQUIRES_FORMAL_ANALYST_ACCEPTANCE'if completed else 'PARTIAL_FINANCIAL_CONTEXT_NOT_FULL_TOPIC_PROOF'if ids else 'NOT_INSPECTED_FOR_FULL_TOPIC','fullTopicQualifiedForFormalScore':False,'requiredProduct':DEPS[rid]})
  allids=list(dict.fromkeys(allids));secondary=['FORMAL_HUMAN_ASSESSMENT_NOT_ESTABLISHED','RESEARCH_OUTPUT_NOT_PRODUCTION_ADMISSIBLE','ALL_23_VALID_ASSESSMENTS_REQUIRED_BY_EXECUTABLE']
  if rid.startswith('VAL-'):primary='POLICY_OR_MODEL_BLOCKER';reason=DEPS[rid];secondary+=['VALUATION_INPUTS_AND_MODEL_NOT_APPROVED','SOURCE_TIME_AND_ACTION_COMPATIBILITY_REQUIRED']
  elif completed:primary='ANALYST_ASSESSMENT_REQUIRED';reason='Existing issuer-specific, challenged M3-band research assessment is preserved; source=AI. Human adoption, evidence availability/admission and formal context are not established.'
  elif allids:primary='MAPPING_GAP';reason='Exact retained financial observations/metrics exist for part of this rubric; legacy rubric references label related context rather than qualified topic-specific proof. Complete semantic mapping and full-topic review; numeric context alone cannot justify a band.';secondary+=['FULL_TOPIC_EVIDENCE_NOT_QUALIFIED','ANALYST_JUDGMENT_PENDING']
  else:primary='NOT_INSPECTED';reason='No sufficiently reviewed full-topic evidence established in this audit. Retained notes/search leads and prior dossiers are not proof of absence; source-specific semantic review remains.';secondary+=['FULL_TOPIC_SOURCE_REVIEW_NOT_COMPLETED']
  if nleads.get(rid):secondary+=['RETAINED_NOTE_LEADS_UNQUALIFIED']
  if t in ['VIC','VHM'] and rid in ['FH-BS','FH-LIQ','FH-STRESS','VAL-PRIMARY','VAL-MOS']:secondary+=['LEGACY_DEBT_CONFLICT_DEPENDENT_RECONCILIATION_ONLY']
  if t in ['CTG','VCB']and rid in ['BQ-EQ','GQ-HIST','GQ-INC']:secondary+=['CROSS_VINTAGE_CONFLICT_DEPENDENCY_REVIEW']
  oldref=ref(closurepath,'/'+str(oldpair[0]))if oldpair else None
  MATRIX.append({'id':t+':'+rid,'ticker':t,'sector':sectors[t],'researchSectorRoute':routes.get(t,{}).get('proposedResearchSubtype',sectors[t]),'rubric':rid,'category':s['category'],'maxPointsUnchanged':s['max'],'requiredTopics':s['topics'],'methodologyReference':ref(method,'')|{'rubricId':rid},'primaryClassification':primary,'secondaryBlockers':secondary,'reason':reason,'topics':topicrows,'evidenceIds':allids,'existingMapping':ref(p,'/rubricInputs/'+str(next(i for i,r in enumerate(native['rubricInputs'])if r['subcategory']==rid))),'mappingStatus':'RELATED_CONTEXT_EXISTS_NOT_FORMAL_TOPIC_MAPPING','existingResearchAssessment':oldref if completed else None,'priorExactDependency':old.get('exactMissingFields',old.get('reason'))if old else None,'notesLeadReferences':nleads.get(rid,[]),'canDeriveNow':[x['id']for x in CALCS if x['ticker']==t and ((rid=='BQ-CASH'and 'CFO'in x['metric'])or(rid=='FH-BS'and 'EQUITY'in x['metric'])or(rid=='FH-LIQ'and 'LOANS'in x['metric']))],'preliminaryResearchAssessmentStatus':'EXISTING_COMPLETED_RESEARCH_PRESERVED'if completed else 'PARTIAL_CONTEXT_OR_NOT_INSPECTED','qualifiedScore':None,'formalPoints':None,'formalDecision':None,'resolution':{'owner':'RESEARCH_ANALYST'if not rid.startswith('VAL-')else 'OWNER_AND_VALUATION_ANALYST','product':DEPS[rid],'stopCondition':'Stop if required topic cannot be bounded from retained evidence; request only identified new authority/input, never create another generic readiness cycle.'}})
 COVER.append({'ticker':t,'sector':sectors[t],'nativeObservationCount':len(obs),'dossierMetricCount':len(extra),'historicalPeriodsByConcept':histories,'rawSurfaces':surfaces,'notesPagesSearched':pages,'notesSemanticReview':'NOT_EXHAUSTIVE_NOT_INSPECTED_FOR_COMPLETE_QUALITATIVE_TOPICS','fullScoreInputPresent':bool(native.get('fullScoreInput')),'readyForScoring':native.get('readyForScoring'),'researchAssessmentsPreserved':sum(r['ticker']==t and r['existingResearchAssessment']is not None for r in MATRIX),'source':ref(p)})
 DETAILS[t]={'financialNarrative':native.get('financialNarrative'),'remainingInputs':native.get('remainingInputs'),'normalization':NORMAL[-1]}
 del native,obs,notes
write('FINANCIAL_EVIDENCE_LEDGER.json',LEDGER);write('FINANCIAL_COVERAGE.json',COVER);write('DERIVED_HISTORICAL_METRICS.json',CALCS);write('NOTE_SEARCH_LEADS.json',LEADS);write('NORMALIZATION_LIMITATIONS.json',NORMAL);write('ISSUER_CONTEXT.json',DETAILS)
counts=collections.Counter(x['primaryClassification']for x in MATRIX);allstates=['SCOREABLE_NOW','MAPPING_GAP','DERIVATION_GAP','ANALYST_ASSESSMENT_REQUIRED','GENUINELY_MISSING','POLICY_OR_MODEL_BLOCKER','NOT_INSPECTED'];counts={k:counts[k]for k in allstates}
write('VN30_ISSUER_RUBRIC_MATRIX.json',{'contract':'vn30-scoring-usability-audit-v1','baselineCommit':BASE,'analysisDate':'2026-11-10','classification':'RESEARCH_AUDIT_ONLY','primaryCounts':counts,'rows':MATRIX,'totalScore':None,'productionAdmissible':False,'ranking':None,'formalDecision':None,'classificationMethod':'One primary cause; all secondary causes preserved. MAPPING_GAP means partial retained numeric topic context requires semantic mapping; does not imply full rubric evidence-ready. No source absence inferred from search non-hits.'})
ready=sorted(COVER,key=lambda x:(-x['researchAssessmentsPreserved'],x['ticker']));top=ready[:5]
write('READINESS_ORDER.json',{'basis':'Completed challenged provisional rubric count, descending; ties alphabetical and explicitly unresolved. Ordinal shortlist only, not likelihood or investment ranking. Financial volume never substitutes full rubric topics.','topFive':[{'ticker':x['ticker'],'completedResearchRubrics':x['researchAssessmentsPreserved'],'remainingRubrics':23-x['researchAssessmentsPreserved']}for x in top],'allIssuers':[{'ticker':x['ticker'],'completedResearchRubrics':x['researchAssessmentsPreserved']}for x in ready]})
summary=table(['Primary class','Instances'],counts.items());ct=table(['Issuer','Sector','Reviewed observations','Dossier metrics','Preserved research rubrics','Parsed PDF/API/combined','Notes pages searched'],[(x['ticker'],x['sector'],x['nativeObservationCount'],x['dossierMetricCount'],x['researchAssessmentsPreserved'],len(x['rawSurfaces']),x['notesPagesSearched'])for x in COVER])
master=f"Configured release `{row[0]}`; activation {release['effectiveFrom']}; universe head effective {u['effectiveFrom']}; membership snapshot asOf {u['content']['asOf']}. Retained P2.0 separately verifies membership effective 2026-08-03 for the 2026-11-05 reference date (retrospective as retrieved); this audit does not replace the configured Master or assert 16 October is reconstitution day. Current active immutable SQLite content matches retained Master snapshot only if validated in receipt."
md('VN30_SCORING_USABILITY_AUDIT.md',f'''# VN30 Scoring Usability Audit v1.0
Baseline `{BASE}`. Audit date 2026-11-10. Research audit only; no remediation or new financial source acquisition.

{master}

## Finding
Financial data is available, and many metrics have already been calculated. The break is between reported observations, fully qualified rubric topics, explicit analyst band selection and formal evidence/time/admission context. Populating financial cells does not establish moat, normalized owner economics, industry position, governance or approved valuation. Existing partial mappings even attach the same financial observations to cost_of_capital and competitive topics; this is context, not proof.

{summary}

Zero SCOREABLE_NOW means no audited instance is demonstrated to satisfy the current formal contract; it does not mean no useful analysis or no prior provisional assessments. Preserve {sum(x['researchAssessmentsPreserved']for x in COVER)} challenged research assessments. No new points selected. Zero GENUINELY_MISSING is an epistemic limit: absence across retained narrative sources was not proven. NOT_INSPECTED explicitly exposes incomplete semantic review. This package is a bounded audit with conditions, not a claim that all 690 full-topic evidence reviews are complete.

## Minimal path
Reuse the completed research assessments and exact metric ledgers; require a named human analyst to adopt/challenge topic evidence. Fix only evidenced executable overbreadth through separate approved engineering work. For first complete scorecard, finish all 23 topics, compatible normalized valuation and formal source-time/admission evidence. Account cash, holdings and NAV are not financial-score prerequisites. No incomplete total is normalized to /100.

## Readiness shortlist
{table(['Issuer','Completed provisional rubrics','Still unresolved'],[(x['ticker'],x['researchAssessmentsPreserved'],23-x['researchAssessmentsPreserved'])for x in top])}

Ordered by existing challenged provisional coverage only; alphabetical ties are not evidence of superiority. This is the most reproducible available readiness proxy, not a complete probability ranking; full valuation readiness remains unresolved. See READINESS_ORDER.json for all issuers and ties.

## Decision
PASS WITH CONDITIONS for structural audit and preserved boundaries; full semantic coverage remains incomplete where NOT_INSPECTED is explicit. No formal score, trading recommendation or production approval. Owner review required before remediation.
''')
md('VN30_FINANCIAL_DATA_COVERAGE.md',f'''# Retained financial coverage
{master}

{ct}

FINANCIAL_COVERAGE.json records exact concept/year dimensions and every inspected surface hash. FY2022–FY2025 presence is per concept, not blanket comparability. Native observation and DFR metric bindings preserve period, scope, unit, revision, original lexical values, PDF pointers and quality. Null publication/availability stays null. Standalone/group, reported/common, original/restated and annual/YTD remain distinct. Parsed variants are extraction candidates, not reviewed facts. Note search is not exhaustive qualitative review. Unknown CaféF units cannot be guessed.

Sector use: banks use asset quality, capital and funding rather than industrial CFO/FCF; securities distinguish client balances and FVTPL outcomes from corporate liquidity and recurring earnings; technology needs scope/contract-recognition bridges; consumer cash conversion does not prove pricing moat; real-estate parent/NCI, project delivery, presales and restricted cash require separate bridges; cyclical materials/energy need through-cycle earnings; transport/tourism and mixed groups need lease, subsidiary and capital intensity analysis.
''')
md('MAPPING_AND_DERIVATION_GAPS.md',f'''# Mapping and derivation audit
{counts['MAPPING_GAP']} primary partial MAPPING_GAP instances each identify exact existing observation/metric IDs, source hashes and JSON pointers in the matrix and FINANCIAL_EVIDENCE_LEDGER.json. These are partial context gaps; remaining mandatory topics are preserved. No generic amount-equality mapping was added.

{len(CALCS)} historical ratios were calculated within the audit with Decimal precision 50, original operands and compatible same-period consolidated scope/revision/unit constraints. DERIVED_HISTORICAL_METRICS.json preserves full results and 6-place display values. No binary float; no normalized/common-owner claim. Ratio non-terminating decimals are precision-bounded, not mathematically exact finite expansions. No compatible unique denominator means no value. No standalone/group mixing, EPS share inference, fabricated tax or zero fill.

Primary DERIVATION_GAP count {counts['DERIVATION_GAP']}: existing historical metric candidates already contain arithmetic. We did not demonstrate an uncomputed metric whose calculation alone completes a rubric. Recomputing diagnostics is useful analysis, not proof of a new scoreable rubric. CAGR's cross-year validator defect is independently recorded under G3; corporate-action-adjusted EPS growth remains blocked until actual actions/shares are qualified.

Reuse path: source observation → compatible research metric → topic-specific evidence and counterevidence → analyst band. Do not feed every optional diagnostic to a formal scorecard; dependency-local quality should be explicit. Legacy VIC/VHM debt correction remains isolated to debt/valuation-dependent topics. CTG/VCB cross-vintage conflicts affect their dependent periods/returns, not every issuer topic.
''')
md('ANALYST_ASSESSMENT_GAPS.md',f'''# Analyst assessment gaps
{sum(x['researchAssessmentsPreserved']for x in COVER)} existing DFR-04 assessments are retained verbatim by binding, including issuer-specific counterevidence, assumptions, confidence and invalidation. Their AI provenance is not relabelled HUMAN. They require formal analyst adoption and independent availability/qualification; completed research does not equal formal points.

Each of 690 rows states M3 required topics and exact next product, owner and stop condition. MAPPING_GAP may coexist with analyst judgment and uninspected qualitative topics. A qualitative search hit is a lead only, never moat/governance qualification. No repeated closure phase is proposed.

Retained FPT BQ-CASH is a qualified bounded research assessment with 4-year cash realization and FY2025 deterioration; do not reopen it as absent. VNM reported cash realization remains distinct from normalized common earnings. TCX trading gains/losses and the bounded 1-VND discrepancy must retain their existing provenance. VHM NCI and VIC closing-column/debt errors cannot be cured by treating group earnings/debt as parent economics. TCB P2.6 FH-BS is historical draft evidence, not an adopted formal score. Sandbox scenarios are hypothetical and excluded from VAL inputs.

Financial reports alone cannot establish independent competitive-share denominators, pricing/customer behavior, industry barriers/disruption, current market price/source cutoff, required return, future management execution or owner-selected scenario economics. First inspect named retained notes/disclosures; only proven absent exact fields justify new evidence authorization.
''')
# Exact executable/policy anchors.
def lines(p,needle):
 a=(R/p).read_text().splitlines();return [i+1 for i,s in enumerate(a)if needle in s]
gates=[('G1','All 23 assessments required at input','src/domain/scoring/scorecard.ts','list(input.assessments,23)','docs/03 SCORING/SCORING_ENGINE.md','Each of the seven approved categories','Formal complete score may require all; preliminary per-rubric reporting is unnecessarily coupled to complete array. Proposal: separate read-only partial assessment presentation, no partial total.'),('G2','Global corporate-action gate','src/domain/scoring/scorecard.ts','const actionProblem','docs/03 SCORING/SCORING_ENGINE.md','## 3A.6','Overbreadth: unrelated industry/governance topics become N/R when actionComparable is false. Proposal: gate affected metric/rubric dependencies only; retain required per-share/action controls.'),('G3','CAGR operand periods','src/domain/scoring/metrics.ts','METRIC_PERIOD_MISMATCH','docs/03 SCORING/SCORING_ENGINE.md','## 3A.6','Defect candidate demonstrated by predicate witness: FY2025 and FY2022 revenue inherently have different period ends, so same-period guard rejects before growth. Proposal: CAGR-specific horizon/annual/scope/unit/revision validation; preserve action-adjusted EPS controls.'),('G4','Every failed metric blocks total','src/domain/scoring/scorecard.ts','const critical=','docs/03 SCORING/SCORING_ENGINE.md','### D. Category','Optional unrelated diagnostic failure is promoted to critical. Proposal: explicit required dependency graph; preserve decision-critical failure block.'),('G5','All as-reported metrics rejected for cyclical','src/domain/scoring/metrics.ts','else if (cyclical','docs/03 SCORING/SCORING_ENGINE.md','normalization','Potential overbreadth for balance-sheet descriptive diagnostics. Proposal: keep reported diagnostics visible; normalize cycle-sensitive economic scoring metrics. Policy interpretation/owner acceptance required before changing authority.'),('G6','Explicit human assessment','src/domain/scoring/scorecard.ts','EXPLICIT_HUMAN_ASSESSMENT_REQUIRED','docs/03 SCORING/SCORING_ENGINE.md','bounded qualitative','Legitimate current formal-authority guard. AI research can remain useful in a separate provisional layer. Never forge human analyst provenance.'),('G7','All unavailable evidence lowers confidence','src/domain/scoring/scorecard.ts','const dataProblems=','docs/03 SCORING/SCORING_ENGINE.md','LOW confidence','Evidence included only as unrelated reference can depress confidence. Proposal: required-support versus contextual-reference dependency distinction, not bypass of actual uncertainty.'),('G8','Actionability versus score points','src/domain/scoring/scorecard.ts','const validity=','docs/03 SCORING/SCORING_ENGINE.md','VALID','Stage0/veto/residual risk/LOW confidence govern interpretation/actionability after total computation. Do not claim portfolio cash or NAV blocks fundamental points; portfolioContext returns null.')]
G=[]
for gid,name,cp,cn,pp,pn,interpret in gates:G.append({'id':gid,'name':name,'code':{'path':cp,'lines':lines(cp,cn)},'policy':{'path':pp,'lines':lines(pp,pn)[:8]},'finding':interpret,'implemented':False})
write('SCORING_GATE_FINDINGS.json',G)
md('SCORING_GATE_AUDIT.md','# Policy versus executable\n\n'+table(['ID','Gate','Code reference','Policy reference','Finding / minimal proposal'],[(x['id'],x['name'],x['code']['path']+':'+','.join(map(str,x['code']['lines'])),x['policy']['path']+':'+','.join(map(str,x['policy']['lines'])),x['finding'])for x in G])+'''\n\nM3 §9 missing-not-zero and no weight redistribution remain mandatory. A defensible conservative estimate/range is allowed only with bounded evidence; the engine's complete-total rule must not be bypassed by synthetic partial sums. Distinguish a stricter formal implementation from permission to change approved scoring authority: proposals need separate review and parity tests. Formal evidence requires available, compatible publication/PIT provenance; evidence.ts supports date-only v2 policy, so timestamp precision is not universally mandatory. Publication unknown is not invented. Existing authority baselines stay approved; draft headings in historical design docs do not revoke accepted runtime methodology. All gates above are static audit findings, not executed full-engine regression tests.
''')
sections=['# Preliminary assessment\n\nDATA_AVAILABLE means preserved reported data; ANALYST_INTERPRETATION is bounded research analysis; QUALIFIED_SCORE remains null here; FORMAL_DECISION remains null. No recommendation, numerical issuer score or synthetic total. Historical financial condition is not an investment ranking.']
for t in tickers:
 cv=next(x for x in COVER if x['ticker']==t);rows=[x for x in CALCS if x['ticker']==t];rated=[x for x in MATRIX if x['ticker']==t and x['existingResearchAssessment']]
 s=f"## {t} — {sectors[t]}\n\n{cv['nativeObservationCount']} retained native observations; {cv['dossierMetricCount']} dossier metrics; {len(rated)} completed research rubrics preserved. "
 s+=CONTEXT.get(t,'See ISSUER_CONTEXT.json for the retained issuer-specific financial narrative, exact unresolved inputs and normalization counterevidence. No full-topic qualitative conclusion is inferred from scale, profit or a search hit.')+'\n\n'
 if rows:
  s+=table(['Historical diagnostic','Value','Period','Source'],[(x['metric'],x['displayValue'],x['periodEnd'],'DERIVED_HISTORICAL_METRICS.json#'+x['id'])for x in rows])+'\n\n'
  for x in rows:
   v=D(x['value'])
   if 'CFO' in x['metric']:s+=('Reported operating cash exceeds group reported net income; this supports historical cash-realization context. 'if v>=1 else 'Reported operating cash is below group reported net income; investigate working-capital/tax/recognition timing. ')+'Acquisition cash, maintenance capex, parent/NCI allocation and normalization still prevent owner-FCF inference.\n\n'
   elif 'EQUITY' in x['metric']:s+=f"Group book equity funds {(v*100).quantize(D('.01'))}% of reported assets. This is a book capital structure diagnostic; asset valuation, restricted funds and regulatory deductions may materially change economic loss capacity.\n\n"
   else:s+='Loan/deposit ratio is a closing reported population diagnostic, not the regulatory LDR or proof of stress liquidity. Interbank/issued funding, encumbrances and maturity behavior remain separate.\n\n'
 else:s+='No additional unique, dimension-compatible ratio was calculated from this frozen native observation subset; this is not an assertion that raw financial metrics are missing.\n\n'
 if rated:
  s+='Preserved challenged research interpretations:\n\n'
  for rr in rated:
   old=priorby[(t,rr['rubric'])][1]['assessment'];s+=f"- **{rr['rubric']}**: {old['rationale']} Existing band `{old['assessment']}`; reference only, no new point assignment.\n"
 n=next(x for x in NORMAL if x['ticker']==t);s+='\nValuation limitation: '+('accepted normalized common earnings remain null'if n['acceptedNormalizedCommonEarningsVnd']is None else 'retained normalized earnings require explicit acceptance-context validation')+'; conditional normalization candidates are excluded. Price cutoff, compatible action/share basis, sustainable returns, required return and terminal economics remain individually qualified dependencies. See NORMALIZATION_LIMITATIONS.json and issuer context; no sandbox valuation promoted.\n'
 sections.append(s)
md('PRELIMINARY_ASSESSMENT.md','\n\n'.join(sections))
first=top[0]['ticker']
md('PRIORITIZED_REMEDIATION_PLAN.md',f'''# Minimal proposals — no implementation authorized by this audit

1. **Reuse existing outputs now, no new acquisition.** Present the {sum(x['researchAssessmentsPreserved']for x in COVER)} completed challenged research rubrics with AI provenance and null formal fields. Link supported financial metrics, source dimensions and exact deferred topics. Do not reopen completed research or run another generic readiness cycle. Acceptance: byte-identical prior assessments, complete links, no total or decision.
2. **Engineering defect work, separately approved.** Propose G2 dependency-local action handling and G3 CAGR period validation first; test unaffected IC/governance survival, true action-sensitive blocking, valid FY22→25 revenue CAGR, invalid horizons/scopes/revisions, unsupported-band rejection and exact baseline parity. G4/G5/G7 require explicit criticality/dependency design review. No code changed here.
3. **Named analyst adoption.** Start with `{first}` under the documented provisional-coverage readiness proxy, while retaining ties and unresolved valuation limits. For each existing assessment, verify all topics, counterevidence, assumptions/invalidation and evidence time. A human explicitly adopts or rejects the band; never relabel AI output. Acceptance: all required topic pointers resolve, no unrelated financial references treated as qualitative proof.
4. **First formal complete scorecard.** Produce exactly 23 current human assessments and source-time/sector/normalization contexts. Close the exact matrix dependencies for industry/moat/governance/allocation, qualify sustainable common-owner valuation and approved cutoff/source/action/share conventions. If a critical topic cannot be bounded, stop with N/R and null total. Stage0, veto, residual risk and confidence control actionability separately. No guarantee any issuer can be completed solely from retained financial statements.

## Actual owner choices
Approve a bounded engineering change scope before changing the approved executable/authority; select a named analyst/adoption process; explicitly decide valuation cutoff/as-known versus retrospective/source-and-action policy and economic assumptions where existing records remain pending. Authorize only exact new nonfinancial/public-market source scope after retained evidence inspection proves the need. Approval of TCB sandbox does not approve its assumptions as forecasts or intrinsic value. Production admission and M4/portfolio release remain separate approvals.

## Cannot be obtained merely by calculating financial ratios
Independent market/competition evidence, customer behavior, forward execution, governance incentives/terms, qualified current/historical price cutoff, share/action terms not retained, cost of equity and future terminal economics. These are exact research/owner/source products, not a request to resend the existing financial corpus.

Stop on a conflict affecting a selected dependency, unavailable source-time authority or unsupported range. Escalate the named product/decision once; do not create a repeated generic closure phase.
''')
# Source pin inventory and self-contained deterministic audit recipe.
write('SOURCE_PINS.json',PINS)
write('AUDIT_COUNTS.json',{'primaryCounts':counts,'preservedResearchAssessments':sum(x['researchAssessmentsPreserved']for x in COVER),'derivedHistoricalMetrics':len(CALCS),'evidenceRecords':len(LEDGER),'noteSearchLeads':len(LEADS),'sourcePins':len(PINS),'topFive':[x['ticker']for x in top]})
# Predicate witness is deliberately not represented as executing the formal engine.
write('GATE_PREDICATE_WITNESS.json',{'kind':'STATIC_PREDICATE_WITNESS_NOT_ENGINE_TEST','CAGR':{'metric':'REVENUE_CAGR','a':{'periodStart':'2025-01-01','periodEnd':'2025-12-31'},'b':{'periodStart':'2022-01-01','periodEnd':'2022-12-31'},'years':3,'samePeriodPredicate':False,'resultFromInspectedGuard':'METRIC_PERIOD_MISMATCH before CAGR arithmetic'},'corporateAction':{'unrelatedRubric':'IC-IND','actionComparable':False,'allTopicEvidenceUsable':True,'actionProblem':True,'completePredicate':False}})
print('Generated',counts,'metrics',len(CALCS),'top',[x['ticker']for x in top],flush=True)
