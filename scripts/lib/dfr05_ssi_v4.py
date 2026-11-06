"""SSI-only retained research dispatch. Sealed predecessor kernels remain unchanged."""
from dataclasses import replace
from collections import Counter
from copy import deepcopy
import json
from lib import dfr05_acb_v2 as acb
from lib import dfr02 as d2
p1,ROOT=acb.p1,acb.ROOT
BASELINE='fc688e49fd4a6ad06d0333967ce24c9f7e8adbc8'
REL='docs/fundamental-data-engine/dfr-05/p2-4-b1-ssi-fc688e49'
SSI=acb.Identity('483a7e5c-ae5d-456d-840e-54433896ad43','SSI','SECURITIES','SECURITIES','CONSOLIDATED')
REVIEW='docs/fundamental-data-engine/evidence/2026-10-15-ticker-closure-SSI/SSI_ISSUER_VERIFICATION.json'
BINDINGS='scripts/lib/dfr05_ssi_bindings_v4.json'
NATIVE='docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-30/b6-comparability-r2'

def authorize(i):
 if i!=SSI or not isinstance(i,acb.Identity):raise ValueError('SSI_EXACT_IDENTITY_SCOPE_ONLY')
 return i

def verify_identity(store,i):
 authorize(i)
 u=store.read(acb.UNIVERSE)
 if u['contentHash']!=acb.UHASH or p1.digest({k:v for k,v in u.items() if k!='contentHash'})!=acb.UHASH or u['researchReferenceDate']!='2026-11-05' or u['version']!='2026-11-05-v1':raise ValueError('UNIVERSE')
 r=[r for r in u['constituents'] if r['securityId']==i.securityId]
 routes=[r for r in store.read(acb.PLAN)['rows'] if r['securityId']==i.securityId]
 if len(r)!=1 or r[0]['ticker']!='SSI' or r[0]['existingSector']!='SECURITIES' or len(routes)!=1 or routes[0]['routeQualificationStatus']!='READY' or routes[0]['proposedResearchSubtype']!='SECURITIES':raise ValueError('IDENTITY_ROUTE')

class Adapter:
 records=p1.Adapter.records
 def __init__(self,store,kind,identity):
  verify_identity(store,identity)
  if kind not in p1.PRIMARY:raise ValueError('ADAPTER_KIND')
  self.store,self.kind,self.ticker=store,kind,'SSI';self.path=p1.PRIMARY[kind].format(ticker='SSI')

class FinancialGraph(d2.Graph):
 def __init__(self,identity):authorize(identity);self.ticker,self.nodes,self.by_key='SSI',{},{};self.revision_bridges=[]
 def add(self,n):
  if n.get('scope')!='CONSOLIDATED' or not n['id'].startswith('SSI:CONSOLIDATED:'):raise ValueError('FINANCIAL_GRAPH_IDENTITY_SCOPE')
  return super().add(n)
 def derive(self,name,year,deps,op,definition,scope='CONSOLIDATED',across_years=False):
  if any(n.get('economicOwnership')=='CLIENT_OFF_BALANCE' for n in deps):raise ValueError('CLIENT_BALANCES_NOT_CORPORATE_CALCULATION_OPERANDS')
  bridge=next((b for b in self.revision_bridges if b['metric']==name and b['year']==year),None)
  if bridge is None:return super().derive(name,year,deps,op,definition,scope,across_years)
  if op!='growth' or not across_years or len(deps)!=2:raise ValueError('EXPLICIT_COHORT_OPERATION')
  for n,column in zip(deps,[bridge['current'],bridge['comparative']]):
   if any(n.get(k)!=bridge[k] for k in ('scope','currency','unit','scale')) or n['concept']!=bridge['concept'] or any(n.get(k)!=column[k] for k in ('year','value','revisionBasis')) or n['status']!='SUPPORTED' or n['pdfEvidence']['sha256']!=bridge['sourceHash'] or bridge['page'] not in n['pdfEvidence']['pages'] or n['periodType']!='ANNUAL' or n['periodStart']!=f"{n['year']}-01-01" or n['periodEnd']!=f"{n['year']}-12-31":raise ValueError('EXPLICIT_COLUMN_COHORT_MISMATCH')
  view=[{**n,'revisionBasis':'ORIGINAL_REVIEWED_VINTAGE'} for n in deps]
  if not d2.compatible(view,True):raise ValueError('COHORT_DIMENSIONS')
  result=super().derive(name,year,view,op,definition,scope,True)
  result.update(revisionBasis='COHERENT_EXPLICIT_COLUMN_COHORT',compatibilityEvidence=deepcopy(bridge),originalOperandRevisionBases=[n['revisionBasis'] for n in deps],sourceMetadataUnchanged=True)
  return result
 # No blanket same-PDF override; only the separately qualified explicit column pair.


class DependencyGraph(p1.DependencyGraph):
 def add(self,id,kind,ticker='SSI',status='REFERENCE_ONLY',**meta):
  if ticker!='SSI':raise ValueError('CROSS_ISSUER_NODE')
  n=dict(id=id,kind=kind,ticker=ticker,status=status,**meta)
  if id in self.nodes and self.nodes[id]!=n:raise ValueError('DUPLICATE_NODE')
  self.nodes[id]=n;return id

def replay(store,identity=SSI):
 verify_identity(store,identity)
 config=store.read(BINDINGS);verification=store.read(REVIEW)
 qualified=[s for s in verification['statements'] if s['reviewStatus']=='QUALIFIED' and s['reportingScope']=='CONSOLIDATED' and s['fiscalYear'] in (2022,2023,2024,2025)]
 if {s['fiscalYear'] for s in qualified}!={2022,2023,2024,2025} or any(s['unitBasis']!='CURRENCY' or s['currency']!='VND' or s['verifiedHash']!=s['SHA256'] for s in qualified):raise ValueError('SCOPE_GATE')
 reuse=p1.module('ssi_d2','scripts/build-dfr02.py');g=FinancialGraph(identity)
 refs=store.read(NATIVE+'/native-review-sources.json');caps={v['id']:(i,v) for i,v in enumerate(refs['rawReferenceCaptures'])};contexts={v['observationId']:v for v in refs['contexts']}
 idx=reuse.pdf_index(store.read(p1.PRIMARY['PDF'].format(ticker='SSI')),p1.PRIMARY['PDF'].format(ticker='SSI'))
 reuse.import_facts(store,g,NATIVE+'/native-review-sources.json',caps,contexts,idx)
 native=store.read(NATIVE+'/native-inputs/SSI.json')
 for n in list(g.nodes.values()):
  if n['concept']=='CASH_CAPEX_REPORTED':del g.nodes[n['id']];del g.by_key[(n['concept'],n['year'],n['scope'])];continue
  o=next(o for o in native['observations'] if o['itemId']==n['concept'] and o['fiscalYear']==n['year'])
  f=json.loads(caps[o['rawCaptureId']][1]['payload'])['originalCanonicalRecord']
  n['canonicalRevision']=f.get('revisionStatus','UNKNOWN')
  if n['canonicalRevision']=='RESTATED':n['revisionBasis']='RESTATED_REVIEWED_VINTAGE'
  if n['scope']!='CONSOLIDATED' or n['unit']!='CURRENCY' or n['raw']['multiplier']!='1':raise ValueError('NATIVE_SCOPE_UNIT')
  n['economicOwnership']='GROUP_RECOGNIZED';n['unrestrictedLiquidityQualified']=False
  n['observationBinding']=store.bind(n['observationBinding']['path'],n['observationBinding']['jsonPointer'])
  n['reviewPayloadBinding'].update(store.bind(n['reviewPayloadBinding']['path'],n['reviewPayloadBinding']['jsonPointer']))
 # Rebind historical review paths to the extant, byte-identical retained PDFs.
 qualified=[dict(s,historicalRetainedPath=s['retainedPath'],retainedPath=next(n['pdfEvidence']['path'] for n in g.nodes.values() if n['year']==s['fiscalYear'] and n['pdfEvidence']['sha256']==s['SHA256'])) for s in qualified]
 # New, bounded source-image qualification; all source columns remain explicit.
 review=config['sourceImageReview'];pdf=review['pdfPath']
 if store.pin(pdf)['sha256']!=review['sha256']:raise ValueError('NEW_REVIEW_SOURCE_HASH')
 for ri,r in enumerate(config['pageReadings']):
  if r['year']!=2025 or r['revision']!='ORIGINAL_REVIEWED_VINTAGE' or review['scope']!='CONSOLIDATED':raise ValueError('EXPLICIT_COLUMN_COHORT_REQUIRED')
  concept=r['concept'];year=r['year'];annual=r['periodType']=='ANNUAL'
  notespath=p1.PRIMARY['NOTES'].format(ticker='SSI');docs=store.read(notespath)['documents'];matches=[(di,pi) for di,doc in enumerate(docs) if doc['sourceHash']==review['sha256'] for pi,page in enumerate(doc['pages']) if page['page']==r['page']]
  if len(matches)!=1:raise ValueError('NOTES_PAGE_BINDING')
  di,pi=matches[0]
  g.add(dict(id=f'SSI:CONSOLIDATED:{concept}:{year}',concept=concept,year=year,scope='CONSOLIDATED',kind='REPORTED_FACT',value=r['value'],originalValue=r['value'],nativeSourceValue=r['value'],nativeSourceMultiplier='1',unit='CURRENCY',currency='VND',scale='1',periodType=r['periodType'],periodStart=f'{year}-01-01' if annual else f'{year}-12-31',periodEnd=f'{year}-12-31',revisionBasis=r['revision'],canonicalRevision='ORIGINAL',status='SUPPORTED',dependencyIds=[],publicationAt=None,economicOwnership=r['economicOwnership'],unrestrictedLiquidityQualified=False,observationBinding=store.bind(BINDINGS,f'/pageReadings/{ri}'),noteBinding=store.bind(notespath,f'/documents/{di}/pages/{pi}'),pdfEvidence=dict(path=pdf,sha256=review['sha256'],pages=[r['page']],rowCode=r['rowCode'],caption=r['caption'],columnQualification=review['columnQualification']['income' if annual else 'balance']),newImageReviewClaimed=True))
 g.revision_bridges=config.get('revisionBridges',[])
 # Every separately requested but unqualified topic remains an explicit missing fact.
 for year in range(2022,2026):
  for concept in config['unqualifiedConcepts']:g.fact(concept,year)
 for year in range(2022,2026):
  for name,a,b in [('FINANCIAL_DEBT_EQUITY','FINANCIAL_DEBT','TOTAL_EQUITY'),('FINANCIAL_LEVERAGE','TOTAL_ASSETS','TOTAL_EQUITY'),('MARGIN_EQUITY','SECURITIES_MARGIN_LOANS','TOTAL_EQUITY'),('REPORTED_CASH_FINANCIAL_DEBT','CASH_AND_EQUIVALENTS','FINANCIAL_DEBT')]:g.derive(name,year,[g.fact(a,year),g.fact(b,year)],'ratio',config['definitions'][name])
  for name,num,den in [('GROUP_ROE_AVG','NET_INCOME','TOTAL_EQUITY'),('GROUP_ROA_AVG','NET_INCOME','TOTAL_ASSETS')]:
   if year>2022:g.derive(name,year,[g.fact(num,year),g.fact(den,year-1),g.fact(den,year)],'average_ratio','Group earnings / average opening and closing group carrying amount; no normalized/common-owner return.',across_years=True)
  if year>2022:
   for concept in ['NET_INCOME','NET_INCOME_ATTRIBUTABLE_PARENT','OPERATING_REVENUE','SECURITIES_MARGIN_LOANS']:
    g.derive(concept+'_YOY',year,[g.fact(concept,year),g.fact(concept,year-1)],'growth','Unadjusted reported annual growth; not per-share or forward growth.',across_years=True)
 for name,a,b in [('NET_FVTPL_REPORTED','FVTPL_GROSS_GAINS','FVTPL_GROSS_LOSSES'),('NET_FVTPL_UNREALIZED_ASSET','FVTPL_UNREALIZED_GAINS','FVTPL_UNREALIZED_LOSSES'),('NET_WARRANT_REVALUATION','FVTPL_WARRANT_REVALUATION_GAINS','FVTPL_WARRANT_REVALUATION_LOSSES')]:g.derive(name,2025,[g.fact(a,2025),g.fact(b,2025)],'subtract','Paired reported components; not normalized or recurring earnings.')
 g.derive('RESULT_OPERATING_REVENUE_RATIO',2025,[g.fact('RESULT_FROM_OPERATIONS',2025),g.fact('OPERATING_REVENUE',2025)],'ratio','Reported securities result after financing and administration / operating revenue; not industrial operating margin.')
 # Retained investigative FY25 components are explicit reference evidence, not qualified facts.
 extra='docs/fundamental-data-engine/evidence/2026-10-15-ticker-closure-SSI/SSI_SECURITIES_METRICS.json';e=store.read(extra)
 references=[dict(binding=store.bind(extra,'/supplemental/0'),status='REFERENCE_ONLY',reason='Historical investigative record; selected components now separately qualified by v4 pageReadings; no historical admission promotion',data=e['supplemental'][0])]
 metrics=list(g.nodes.values());graph=DependencyGraph();specs=reuse.rubrics();rubrics=[]
 store.pin('src/domain/scoring/methodology.ts')
 for m in metrics:
  graph.add(m['id'],'METRIC',status=m['status'])
  if m.get('observationBinding'):
   source='SOURCE:'+m['id'];obs='OBS:'+m['id'];graph.add(source,'ORIGINAL_SOURCE',binding=store.bind(m['pdfEvidence']['path']));graph.add(obs,'QUALIFIED_OBSERVATION',status=m['status'],binding=m['observationBinding']);graph.edge(source,obs);graph.edge(obs,m['id'])
 for m in metrics:
  for dep in m['dependencyIds']:graph.edge(dep,m['id'])
 for s in specs:
  rid=s['id'];rule=config['rubrics'][rid];deps=[m['id'] for m in metrics if m['concept'] in rule['concepts']]
  topic='TOPIC:SSI:'+rid;rubric='SSI:'+rid
  graph.add(topic,'TOPIC',status='NOT_RATED',requiredTopics=s['topics'],fullTopicQualified=False)
  graph.add(rubric,'RUBRIC',status='NOT_RATED');graph.edge(topic,rubric)
  for dep in deps:graph.edge(dep,topic,'FINANCIAL_CONTEXT_ONLY')
  rubrics.append(dict(id=rubric,rubric=rid,category=s['category'],requiredTopics=s['topics'],status='NOT_RATED',eligibility=rule['class'],readiness='DEFERRED',points=None,band=None,assessment=None,metricContextIds=deps,missingEvidence=rule['dependency'],requiredAnalystAssumptions=rule['assumptions'],valuationDependency=rid.startswith('VAL-') or rid in ('CA-DIST','CA-PSV'),productionScoringReady=False))
 # Full retained adapter traversal validates raw source pointers without copying datasets.
 inventory=[];projection=[]
 candidate_pointers={c['jsonPointer'] for m in metrics for c in m.get('extractionCandidates',[])}
 for kind in p1.PRIMARY:
  adapter=Adapter(store,kind,identity);source=store.read(adapter.path);counts=Counter()
  if kind=='NOTES':
   counts['NARRATIVE']=sum(len(d['pages']) for d in source['documents'])
  else:
   for report in source['reports'].values():
    for period in report['periods'].values():
     for variant in period['variants']:
      for group in variant['groups']:
       for row in group['rows']:counts[p1.value_state(row)]+=1
  # Traverse only definition-matched source cells through the unchanged P1 adapter.
  selected=list(adapter.records(candidate_pointers if kind=='PDF' else set()))
  projection.extend(selected)
  inventory.append(dict(kind=kind,path=adapter.path,binding=store.bind(adapter.path),recordStates=dict(counts),projectedRecords=len(selected),selectionAuthority=False,unselectedRows='Inventory only; not individually qualified'))
 crosschecks=reuse.api_crosschecks(store,'SSI')
 for c in crosschecks:c['reconciliation']='REFERENCE_ONLY_UNITS_SCOPE_REVISION_NOT_JOINTLY_QUALIFIED'
 metric_reconciliation=[]
 for m in metrics:
  if m['status']!='SUPPORTED':continue
  metric_reconciliation.append(dict(metricId=m['id'],authoritativeObservation=m.get('observationBinding'),operandIds=m['dependencyIds'],pdfCandidates=m.get('extractionCandidates',[]),notesBinding=m.get('noteBinding'),providerReferences=[c for c in crosschecks if c['concept']==m['concept'] and c['year']==m['year']],combined=dict(binding=store.bind(p1.PRIMARY['COMBINED'].format(ticker='SSI')),status='REFERENCE_ONLY',reason='Combined selection is not independent source authority; no definition-qualified matching row promoted.'),status='SUPPORTED_FROM_VERIFIED_PDF_OR_EXACT_OPERANDS',conflictPolicy='Only jointly qualified concept/period/scope/unit/revision observations can establish a numerical conflict. Unqualified candidates cannot overrule verified PDF.'))
 dossier=dict(contract='dfr05-ssi-research-v4',ticker='SSI',securityId=identity.securityId,classification='RESEARCH_PROVISIONAL',productionAdmissible=False,scoringAuthorized=False,sectorRouting=dict(approvedM3Sector='SECURITIES',researchSubtype='SECURITIES',qualifiedReportingScope='CONSOLIDATED'),metrics=metrics,rubrics=rubrics,categoryScores=None,totalScore=None,ranking=None,currentSignal=None,valuationPerShare=None,referenceEvidence=references)
 graph.validate();store.validate()
 return dict(dossier=dossier,sourceInventory=inventory,sourceProjection=projection,dependencyGraph=graph.export(),gapRegister=[dict(metricId=m['id'],reasons=m.get('reasons',[])) for m in metrics if m['status']=='MISSING'],conflictRegister=[dict(metricId=m['id'],reasons=m.get('reasons',[]),dependencyIds=m['dependencyIds']) for m in metrics if m['status']=='CONFLICT'],reconciliation=crosschecks,metricReconciliation=metric_reconciliation,scopeQualification=dict(scope='CONSOLIDATED',qualifiedStatements=qualified,alternateStatements=[s for s in verification['statements'] if s not in qualified],publicationUnknown=True,newImageReviewClaimed=True,newReview=review),inputPins=store.pins)
