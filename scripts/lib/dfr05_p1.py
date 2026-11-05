"""DFR05 P1: deterministic, read-only retained-source research contracts.
No HTTP, SQLite, runtime repositories or formal scoring authority.
"""
from pathlib import Path
from copy import deepcopy
from collections import deque
import hashlib
import importlib.util
import json
from decimal import Decimal
from lib.dfr02 import PILOT, SECTORS, Graph as FinancialGraph, build_metrics, number, pointer, esc, STATUSES
from lib.dfr03 import validate_review
from lib.r4_rubric_completion import validate_partial_assessment

ROOT=Path(__file__).resolve().parents[2]
D2='docs/fundamental-data-engine/dfr-02/2026-11-04'
D4='docs/fundamental-data-engine/dfr-04/closure-37e12f2'
D4OLD='docs/fundamental-data-engine/dfr-04/2026-11-05'
CONTRACT='dfr05-p1-research-v1'
PRIMARY={'PDF':'data/manual-extracted-pdf/{ticker}.json','NOTES':'data/manual-extracted-pdf/notes/{ticker}.json','CAFEF':'data/manual-extracted-api/{ticker}.json','COMBINED':'data/combine/{ticker}.json'}
SCHEMAS={'PDF':'manual-display-v1','NOTES':'manual-pdf-notes-v1','CAFEF':'cafef-display-v1','COMBINED':'vn30-combine-v1'}
ROUTE_RULES={'BANK':'Loan groups/provisions, deposit funding, interest realization and regulatory capital; no industrial FCF.', 'SECURITIES':'Margin/AFS/HTM and pledged/client assets, hedges, maturity/rollover; no industrial cash shortcut.', 'TECHNOLOGY':'Contract recognition and telecom cash/scope bridge; no per-share growth without actions.', 'CONSUMER_DAIRY':'Consumer price/volume, operating cash, term deposits and investment outcomes; no inferred moat.', 'COMPLEX_GROUP':'Segment/support, pledges, puts, common/NCI; no pure-property or parent-cash shortcut.', 'DEVELOPER':'Handover, cooperation/project restrictions, advances, NCI; group CFO is not parent FCFE.'}

def canonical(x):return json.dumps(x,sort_keys=True,ensure_ascii=False,separators=(',',':'))
def digest(x):return hashlib.sha256(canonical(x).encode()).hexdigest()
def sha(path):return hashlib.sha256(Path(path).read_bytes()).hexdigest()
def issuer(t):
 if t not in PILOT:raise ValueError('SIX_PILOT_AUTHORIZATION_ONLY')
 return t

def module(name,file):
 spec=importlib.util.spec_from_file_location(name,ROOT/file);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m

class Store:
 """Pins exact original bytes; Decimal JSON reads are reserved for provider raw numbers."""
 def __init__(self,root=ROOT,expected=None):self.root=Path(root).resolve();self.pins=dict(expected or {});self.cache={};self.checked=set();self.rawCache={}
 def path(self,p):
  if not isinstance(p,str) or Path(p).is_absolute() or '..' in Path(p).parts:raise ValueError('REPOSITORY_RELATIVE_PATH_REQUIRED')
  q=(self.root/p).resolve()
  if not q.is_relative_to(self.root):raise ValueError('PATH_ESCAPE')
  return q
 def pin(self,p,ptr=''):
  q=self.path(p)
  if p not in self.checked:
   actual=sha(q)
   if p in self.pins and self.pins[p]!=actual:raise ValueError('SOURCE_HASH_CHANGED:'+p)
   self.pins[p]=actual;self.checked.add(p)
  return dict(path=p,sha256=self.pins[p],jsonPointer=ptr)
 def read(self,p):
  self.pin(p)
  if p not in self.cache:self.cache[p]=json.loads(self.path(p).read_text())
  return self.cache[p]
 def bind(self,p,ptr=''):
  b=self.pin(p,ptr)
  if not p.endswith('.json'):
   if ptr:raise ValueError('BINARY_SOURCE_HAS_NO_JSON_POINTER')
   b['objectHash']=b['sha256'];b['bindingKind']='FILE_BYTES'
  else:b['objectHash']=digest(pointer(self.read(p),ptr));b['bindingKind']='JSON_OBJECT'
  return b
 def raw_binding(self,p,ptr,expected_hash,value,state):
  b=self.pin(p,ptr)
  if b['sha256']!=expected_hash:raise ValueError('RAW_PROVIDER_HASH')
  if p not in self.rawCache:self.rawCache[p]=json.loads(self.path(p).read_text(),parse_float=Decimal,parse_int=Decimal)
  raw=pointer(self.rawCache[p],ptr)
  if state=='EXPLICIT_NULL':
   if raw is not None:raise ValueError('RAW_NULL_MISMATCH')
   lexical=None
  elif state in ('ZERO','NUMERIC'):
   if raw is None or isinstance(raw,bool):raise ValueError('RAW_DECIMAL_MISMATCH')
   dec=Decimal(str(raw))
   if not dec.is_finite() or dec!=number(value):raise ValueError('RAW_DECIMAL_MISMATCH')
   lexical=format(dec,'f')
  else:raise ValueError('RAW_POINTER_WITHOUT_VALUE')
  b.update(bindingKind='RAW_DECIMAL_VALUE',objectHash=digest(dict(rawDecimal=lexical)),rawDecimal=lexical)
  return b
 def validate(self):
  for p,h in self.pins.items():
   if sha(self.path(p))!=h:raise ValueError('SOURCE_CHANGED_DURING_REPLAY:'+p)


def value_state(row):
 if 'value' not in row:return 'MISSING'
 if row['value'] is None:return 'EXPLICIT_NULL'
 number(row['value']);return 'ZERO' if number(row['value'])==0 else 'NUMERIC'

class Adapter:
 def __init__(self,store,kind,ticker):
  issuer(ticker)
  if kind not in PRIMARY:raise ValueError('ADAPTER_KIND')
  self.store,self.kind,self.ticker=store,kind,ticker;self.path=PRIMARY[kind].format(ticker=ticker)
 def records(self,pointers=None):
  d=self.store.read(self.path)
  if d.get('ticker')!=self.ticker or d.get('schemaVersion')!=SCHEMAS[self.kind] or d.get('productionAdmissible') is not False:raise ValueError('RETAINED_SOURCE_CONTRACT')
  if self.kind=='NOTES':
   for di,doc in enumerate(d['documents']):
    for pi,page in enumerate(doc['pages']):
     p=f'/documents/{di}/pages/{pi}'
     if pointers is not None and p not in pointers:continue
     yield dict(id='CELL:'+self.ticker+':'+self.kind+':'+p,kind='NOTE_PAGE',ticker=self.ticker,binding=self.store.bind(self.path,p),period=None,scope=page.get('scopeCandidate'),unit=None,revision=None,valueState='NARRATIVE',status='CANDIDATE_ONLY',pdfHash=doc['sourceHash'],pdfPaths=doc['pdfPaths'],physicalPage=page['page'],pageTextPointer=p+'/text',publicationAt=None)
   return
  for report in sorted(d['reports']):
   r=d['reports'][report]
   for period in sorted(r['periods']):
    for vi,v in enumerate(r['periods'][period]['variants']):
     vp=f'/reports/{esc(report)}/periods/{esc(period)}/variants/{vi}';src=v.get('source',{})
     for gi,g in enumerate(v['groups']):
      for ri,row in enumerate(g['rows']):
       ptr=vp+f'/groups/{gi}/rows/{ri}'
       if pointers is not None and ptr not in pointers:continue
       unit=g.get('unitEvidence');state=value_state(row)
       # Keep declared metadata as-is. No parsed date, guessed unit, revision or scope.
       record=dict(id='CELL:'+self.ticker+':'+self.kind+':'+ptr,kind='SOURCE_CELL',ticker=self.ticker,binding=self.store.bind(self.path,ptr),variantBinding=self.store.bind(self.path,vp+'/source') if 'source' in v else None,report=report,periodKey=period,period=dict(year=v.get('year'),quarter=v.get('quarter'),periodType=v.get('periodType'),asOf=v.get('asOf')),scope=v.get('reportingScope'),scopeStatus=v.get('scopeStatus'),revision=v.get('revisionKind',v.get('revision')),unit=dict(unit=unit.get('unit'),currency=unit.get('currency'),scale=unit.get('scale'),status=unit.get('status')) if isinstance(unit,dict) else unit,unitEvidencePointer=vp+f'/groups/{gi}/unitEvidence' if unit is not None else None,conceptCode=row.get('code'),occurrenceIndex=ri,variantIndex=vi,groupIndex=gi,value=row.get('value'),originalValue=row.get('lexicalValue',row.get('pdfLexicalValue')),valueState=state,sourceStatus=row.get('status'),status='REFERENCE_ONLY' if self.kind=='CAFEF' else 'CANDIDATE_ONLY',publicationAt=None)
       if self.kind=='CAFEF':record.update(providerUnit=src.get('providerUnit'),modeMismatch=v.get('modeMismatch'),requestMode=v.get('requestMode'),rawBinding=dict(path=src.get('rawPayloadLocation'),sha256=src.get('payloadHash'),jsonPointer=row.get('rawLocator')))
       elif self.kind=='PDF':record.update(pdfHash=src.get('rawPayloadHash') or src.get('payloadHash'),pdfEvidence=row.get('pdfEvidence') or row.get('cellEvidence'))
       else:record.update(selection=row.get('source'),pdfEvidence=row.get('pdfEvidence'),cafefReferences=row.get('cafefReferences'),comparisonDimensionsVerified=row.get('comparisonDimensionsVerified'),rowDimensions={k:row.get(k) for k in ('reportingScope','currency','unit','scale')})
       if self.kind=='CAFEF' and row.get('rawLocator') is not None:
        record['rawBinding']=self.store.raw_binding(src['rawPayloadLocation'],row['rawLocator'],src['payloadHash'],row.get('value'),state)
        if record['originalValue'] is None:record['originalValue']=record['rawBinding']['rawDecimal']
       if self.kind=='PDF' and src.get('pdfPath'):
        if self.store.pin(src['pdfPath'])['sha256']!=record['pdfHash']:raise ValueError('EXTRACTED_PDF_SOURCE_HASH')
       yield record

def replay_metrics(store,t):
 """Call DFR02 input selection and calculation functions, without invoking its writer."""
 issuer(t);d2=module('dfr05_d2_reuse','scripts/build-dfr02.py');p=PRIMARY['PDF'].format(ticker=t);idx=d2.pdf_index(store.read(p),p)
 source=d2.NATIVE+'/native-review-sources.json';s=store.read(source);caps={v['id']:(i,v) for i,v in enumerate(s['rawReferenceCaptures'])};contexts={v['observationId']:v for v in s['contexts']}
 g=FinancialGraph(t);d2.import_facts(store,g,source,caps,contexts,idx)
 normal=store.read(d2.V4+f'/issuers/{t}.json');readings=store.read(d2.V2+'/checked-capital-readings.json')['readings']
 d2.add_overlay(store,g,next((r for r in readings if r['ticker']==t),None),idx);d2.add_economic_readings(store,g,normal);build_metrics(g)
 if t=='VNM':d2.add_vnm_standalone(store,g)
 if t=='TCX':
  # Preserve the explicitly conflicted reported node, not a recomputed/corrected amount.
  old=next(m for m in store.read(D2+'/issuers/TCX.json')['metrics'] if m['concept']=='PRINTED_COMMON_EPS_NUMERATOR')
  if old['status']!='CONFLICT' or old['value'] is not None:raise ValueError('TCX_CONFLICT_NOT_PRESERVED')
  g.add(deepcopy(old));store.pin(old['conflict']['binding']['path'])
 metrics=list(g.nodes.values());expected=store.read(D2+f'/issuers/{t}.json')['metrics']
 if metrics!=expected:raise ValueError('METRIC_PARITY:'+t+':'+str(next((m['id'] for i,m in enumerate(metrics) if i>=len(expected) or m!=expected[i]),'COUNT')))
 return metrics,d2.api_crosschecks(store,t)

class DependencyGraph:
 """Edges point from required input to dependent. Discovery edges never grant eligibility."""
 def __init__(self):self.nodes={};self.edges=set()
 def add(self,id,kind,ticker=None,status='REFERENCE_ONLY',**meta):
  if ticker is not None:issuer(ticker)
  node=dict(id=id,kind=kind,ticker=ticker,status=status,**meta)
  if id in self.nodes and self.nodes[id]!=node:raise ValueError('DUPLICATE_GRAPH_ID:'+id)
  self.nodes[id]=node;return id
 def edge(self,source,target,role='DEPENDENCY',propagates=True):
  if source not in self.nodes or target not in self.nodes:raise ValueError('DANGLING_GRAPH_EDGE')
  a,b=self.nodes[source],self.nodes[target]
  if a['ticker'] and b['ticker'] and a['ticker']!=b['ticker']:raise ValueError('CROSS_ISSUER_EDGE')
  self.edges.add((source,target,role,propagates))
 def validate(self):
  degree={k:0 for k in self.nodes};adj={}
  for a,b,role,propagates in self.edges:
   if a not in degree or b not in degree:raise ValueError('DANGLING_GRAPH_EDGE')
   degree[b]+=1;adj.setdefault(a,[]).append(b)
  q=deque(sorted(k for k,v in degree.items() if v==0));seen=0
  while q:
   a=q.popleft();seen+=1
   for b in adj.get(a,[]):
    degree[b]-=1
    if degree[b]==0:q.append(b)
  if seen!=len(degree):raise ValueError('DEPENDENCY_CYCLE')
 def affected(self,changed):
  if not set(changed)<=self.nodes.keys():raise ValueError('UNKNOWN_CHANGED_NODE')
  adj={}
  for a,b,role,p in self.edges:
   if p:adj.setdefault(a,[]).append(b)
  seen=set(changed);q=deque(changed)
  while q:
   for b in adj.get(q.popleft(),[]):
    if b not in seen:seen.add(b);q.append(b)
  # Status-only conflict overlay; original inputs and judgments are never overwritten.
  return {k:dict(status='MATERIAL_CONFLICT' if self.nodes[k]['kind'] in ('TOPIC','RUBRIC') else 'CONFLICT',points=None) for k in sorted(seen)}
 def export(self):
  self.validate();return dict(nodes=[self.nodes[k] for k in sorted(self.nodes)],edges=[dict(source=a,target=b,role=r,propagates=p) for a,b,r,p in sorted(self.edges)])

class Foundation:
 def __init__(self,store):
  self.store=store;self.graph=DependencyGraph();self.metrics={};self.qualified={};self.adapter_ids={};self.row_qualifications=[];self.adapter_inventory=[]
  self.d4_validator=module("dfr05_d4_reuse","scripts/build-dfr04.py")
  self.closure_validator=module("dfr05_closure_reuse","scripts/build-dfr04-closure.py")
  self.closure_ids=set(store.read(D4+"/summary.json")["newAssessments"])
  for p,key in [(D4+'/evidence-map.json',None),(D4OLD+'/evidence-map.json','qualified')]:
   data=store.read(p);items=data[key] if key else data
   for e in items:
    if e['id'] in self.qualified:raise ValueError('DUPLICATE_QUALIFICATION')
    self.qualified[e['id']]=e
 def source(self,path,ptr='',ticker=None):
  b=self.store.bind(path,ptr);id='SOURCE:'+str(ticker)+':'+path+'#'+ptr
  self.graph.add(id,'SOURCE_BINDING',ticker,'REFERENCE_ONLY',binding=b)
  return id
 def evidence(self,ref,t):
  issuer(t)
  if ref in self.graph.nodes:
   n=self.graph.nodes[ref]
   if n['ticker']!=t:raise ValueError('EVIDENCE_ISSUER_MISMATCH')
   return n
  if ref.startswith('METRIC:'):raise ValueError('UNKNOWN_METRIC_REFERENCE')
  if ref in self.qualified:
   e=self.qualified[ref]
   if e['ticker']!=t or e['status']!='QUALIFIED_CONTEXT':raise ValueError('UNQUALIFIED_OR_WRONG_ISSUER')
   if self.store.pin(e['path'])['sha256']!=e['sha256'] or digest(pointer(self.store.read(e['path']),e['jsonPointer']))!=e['boundObjectHash']:raise ValueError('QUALIFICATION_BINDING')
   if e.get('pdfPath') and self.store.pin(e['pdfPath'])['sha256']!=e['pdfHash']:raise ValueError('QUALIFIED_PDF_HASH')
   id=self.graph.add(ref,'QUALIFIED_EVIDENCE',t,'QUALIFIED_CONTEXT',binding=self.store.bind(e['path'],e['jsonPointer']),qualificationArtifact=D4+'/evidence-map.json' if ref.startswith('C:') else D4OLD+'/evidence-map.json',rubricTopics=e.get('rubricTopics'),qualifiedTopics=e.get('qualifiedTopics'),scope=e.get('scope'),period=e.get('reportingPeriod',e.get('period')),kindOfEvidence=e.get('kind'))
   deps=[self.source(e['path'],e['jsonPointer'],t)]
   if e.get('pdfPath'):deps.append(self.source(e['pdfPath'],'',t))
   for dep in deps:self.graph.edge(dep,id)
   cell=self.adapter_ids.get((e['path'],e['jsonPointer']))
   if cell:self.graph.edge(cell,id,'QUALIFIED_PAGE_CONTEXT')
   return self.graph.nodes[id]
  if ref=='PDF:FPT:EXCEPTION' and t=='FPT':
   path='docs/fundamental-data-engine/dfr-03/2026-11-05/FPT-exception-review.json';review=self.store.read(path);ptr='';kind='PRIOR_TARGETED_REVIEW';deps=[]
   for page in review['pages']:deps.append(self.source(review['notesBinding']['path'],page['notesJsonPointer'],t))
   deps.append(self.source(review['pdfPath'],'',t))
  elif ref=='STANDALONE_CASH:VNM' and t=='VNM':
   path='docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-30/b6-underwriting-r4/vnm-parent-owner-cash-input.json';ptr='';kind='PRIOR_REVIEWED_PARENT_CASH';deps=[]
  elif ref in (f'CONTEXT:{t}',f'ESTIMATE:{t}',f'D2:{t}'):
   if t=='TCX':raise ValueError('CONFLICTED_COMMON_ESTIMATE_INELIGIBLE')
   path=D2+f'/issuers/{t}.json';ptr='/estimates';kind='CONDITIONAL_CONTEXT_NOT_FACT';deps=[]
  elif t=='VIC' and ref in ('VIC:current-model-range','VIC:economic-uncertainty-driver','VIC:source-dependencies'):
   path='docs/fundamental-data-engine/dfr-01/2026-11-04/issuers/VIC.json';old=self.store.read(path);i=next(i for i,r in enumerate(old['rubrics']) if r['rubric']=='RG-UNC');ptr=f'/rubrics/{i}/assessment';kind='SEALED_LEGACY_CONTEXT_NOT_NEW_QUALIFICATION';deps=[self.evidence('ESTIMATE:VIC',t)['id']]
  else:raise ValueError('UNKNOWN_EVIDENCE_REFERENCE:'+ref)
  id=self.graph.add(ref,'QUALIFIED_EVIDENCE',t,'QUALIFIED_CONTEXT',binding=self.store.bind(path,ptr),kindOfEvidence=kind)
  self.graph.edge(self.source(path,ptr,t),id)
  for d in deps:self.graph.edge(d,id)
  if ref.startswith(('CONTEXT:','ESTIMATE:','D2:')):
   estimates=self.store.read(path)['estimates']
   for key in ['normalizationBinding','scenarioBinding']:
    b=estimates.get(key)
    if b:self.graph.edge(self.source(b['path'],b.get('jsonPointer',''),t),id)
  return self.graph.nodes[id]
 def metric_nodes(self,t,metrics):
  for m in metrics:
   ref='METRIC:'+m['id'];self.metrics[ref]=m
   self.graph.add(ref,'METRIC',t,m['status'],metricKind=m['kind'],value=m['value'],period={k:m.get(k) for k in ('year','periodStart','periodEnd','periodType')},scope=m.get('scope'),unit=m.get('unit'),scale=m.get('scale'),currency=m.get('currency'),revision=m.get('revisionBasis'))
  for m in metrics:
   target='METRIC:'+m['id']
   for dep in m['dependencyIds']:self.graph.edge('METRIC:'+dep,target,'CALCULATION')
   if m['kind']=='REPORTED_FACT':
    for key in ['binding','observationBinding','reviewPayloadBinding']:
     b=m.get(key)
     if b:
      if self.store.pin(b['path'])['sha256']!=b['sha256']:raise ValueError('METRIC_BINDING_HASH')
      self.graph.edge(self.source(b['path'],b.get('jsonPointer',''),t),target,'REVIEWED_INPUT')
    pdf=m.get('pdfEvidence') or {};p=pdf.get('path') or pdf.get('pdfPath')
    if p:self.graph.edge(self.source(p,'',t),target,'PDF_SOURCE')
    conflict=m.get('conflict')
    if conflict:
     b=conflict['binding'];self.graph.edge(self.source(b['path'],b.get('jsonPointer',''),t),target,'BOUNDED_CONFLICT')
    for cand in m.get('extractionCandidates',[]):
     cell=self.adapter_ids.get((cand['path'],cand['jsonPointer']))
     if cell:self.graph.edge(cell,target,'UNREVIEWED_CANDIDATE_REFERENCE',False)
 def replay(self,t):
  issuer(t);records=[];metrics,crosschecks=replay_metrics(self.store,t)
  wanted={kind:set() for kind in PRIMARY}
  for metric in metrics:
   for candidate in metric.get('extractionCandidates',[]):
    if candidate['path']==PRIMARY['PDF'].format(ticker=t):wanted['PDF'].add(candidate['jsonPointer'])
  wanted['CAFEF']={r['binding']['jsonPointer'] for r in crosschecks}
  for e in self.qualified.values():
   if e['ticker']==t and e['path']==PRIMARY['NOTES'].format(ticker=t):wanted['NOTES'].add(e['jsonPointer'].removesuffix('/text'))
  if t=='FPT':
   review=self.store.read('docs/fundamental-data-engine/dfr-03/2026-11-05/FPT-exception-review.json')
   wanted['NOTES'].update(p['notesJsonPointer'].removesuffix('/text') for p in review['pages'])
  # Materialize dependency-relevant cells plus first-row schema/window witnesses.
  # Entire original files stay pinned; unused source rows are neither copied nor qualified.
  for kind in ('PDF','COMBINED'):
   data=self.store.read(PRIMARY[kind].format(ticker=t))
   for report,r in data['reports'].items():
    for period,p in r['periods'].items():
     for vi,v in enumerate(p['variants']):
      for gi,g in enumerate(v['groups']):
       for ri,row in enumerate(g['rows']):
        if ri==0 and v.get('year') in (2022,2023,2024,2025):wanted[kind].add(f'/reports/{esc(report)}/periods/{esc(period)}/variants/{vi}/groups/{gi}/rows/{ri}')
        if kind=='COMBINED':
         pdf=row.get('pdfEvidence') or {};matches=pdf.get('path')==PRIMARY['PDF'].format(ticker=t) and pdf.get('jsonPointer') in wanted['PDF']
         matches=matches or any(ref.get('path')==PRIMARY['CAFEF'].format(ticker=t) and ref.get('jsonPointer') in wanted['CAFEF'] for ref in row.get('cafefReferences',[]))
         if matches:wanted[kind].add(f'/reports/{esc(report)}/periods/{esc(period)}/variants/{vi}/groups/{gi}/rows/{ri}')
  for kind in PRIMARY:
   path=PRIMARY[kind].format(ticker=t);data=self.store.read(path);available=sum(len(doc['pages']) for doc in data['documents']) if kind=='NOTES' else sum(len(g['rows']) for r in data['reports'].values() for p in r['periods'].values() for v in p['variants'] for g in v['groups'])
   self.adapter_inventory.append(dict(ticker=t,adapter=kind,binding=self.store.pin(path),sourceStatus=data['status'],availableRows=available,materializedRows=len(wanted[kind]),selection='Exact metric/crosscheck/qualified-page pointers plus annual-window first-row schema witnesses; no unselected source row is promoted.'))
   materialized=list(Adapter(self.store,kind,t).records(wanted[kind]))
   if len(materialized)!=len(wanted[kind]):raise ValueError('SELECTED_SOURCE_POINTER_MISSING')
   for cell in materialized:
    records.append(cell);self.adapter_ids[(cell['binding']['path'],cell['binding']['jsonPointer'])]=cell['id']
    self.graph.add(cell['id'],cell['kind'],t,cell['status'],binding=cell['binding'],valueState=cell['valueState'])
  for cell in records:
   raw=cell.get('rawBinding')
   if raw and raw.get('bindingKind')=='RAW_DECIMAL_VALUE':
    sid='RAW:'+t+':'+raw['path']+'#'+raw['jsonPointer'];self.graph.add(sid,'RAW_PROVIDER_CELL',t,'REFERENCE_ONLY',binding=raw);self.graph.edge(sid,cell['id'],'PROVIDER_RAW_LINEAGE')
   pdf=cell.get('pdfEvidence') or {}
   ref=self.adapter_ids.get((pdf.get('path'),pdf.get('jsonPointer')))
   if ref and ref!=cell['id']:self.graph.edge(ref,cell['id'],'PRESENTATION_SELECTION_NOT_QUALIFICATION',False)
   for candidate in cell.get('cafefReferences') or []:
    other=self.adapter_ids.get((candidate.get('path'),candidate.get('jsonPointer')))
    if other and other!=cell['id']:self.graph.edge(other,cell['id'],'PROVIDER_CROSSCHECK_NOT_QUALIFICATION',False)
  self.metric_nodes(t,metrics)
  old=self.store.read(D4+f'/issuers/{t}.json');rm={r['id']:r for r in rules()}
  for row in old['rubrics']:
   rid='RUBRIC:'+row['id'];self.graph.add(rid,'RUBRIC',t,row['status'],points=row['points'],eligibility=row['eligibility'])
   a=row.get('assessment');compat=False
   if row['status']=='COMPLETED_RESEARCH':
    if a.get('counterevidence'):
     validate_review(a,rm[row['rubric']],lambda ref:self.evidence(ref,t))
     if row['id'] in self.closure_ids:self.closure_validator.validate(a)
     elif all(ref.startswith(('NOTE:','D2:')) for e in a['evidence']+a['counterevidence'] for ref in e['refs']):self.d4_validator.validate(a,rm[row['rubric']])
    else:
     # Four sealed legacy-format judgments: preserve, do not manufacture new counter-ref fields.
     validate_partial_assessment(a,rm[row['rubric']]);compat=True
     if row['id'] not in ('VNM:BQ-CASH','BID:RG-UNC','VIC:RG-UNC','VHM:RG-UNC'):raise ValueError('LEGACY_SCHEMA_NOT_AUTHORIZED')
     if digest(a)!=digest(next(r['assessment'] for r in self.store.read(D4+'/completion-matrix.json') if r['id']==row['id'])):raise ValueError('LEGACY_ASSESSMENT_CHANGED')
    for entry in a.get('counterevidence',[]):
     for ref in entry['refs']:self.graph.edge(self.evidence(ref,t)['id'],rid,'COUNTEREVIDENCE')
   entries={e['topic']:e for e in a['evidence']} if a else {}
   for topic in row['requiredTopics']:
    tid='TOPIC:'+row['id']+':'+topic
    entry=entries.get(topic);refs=entry['refs'] if entry else next((x['refs'] for x in row.get('qualifiedTopicReview',[]) if x['topic']==topic),[])
    self.graph.add(tid,'TOPIC',t,'PRESERVED_QUALIFIED' if a else 'DEFERRED',assessmentTopic=topic,assessmentBinding=self.store.bind(D4+f'/issuers/{t}.json',f'/rubrics/{old["rubrics"].index(row)}'),readinessFromBaseline=row['status'])
    for ref in refs:
     e=self.evidence(ref,t)
     # Closure explicit-topic mappings are rechecked, not generalized across rubrics.
     if a and ref.startswith('C:') and topic not in self.qualified[ref].get('rubricTopics',{}).get(row['rubric'],[]):raise ValueError('TOPIC_NOT_QUALIFIED')
     if a and ref.startswith('NOTE:') and topic not in self.qualified[ref].get('qualifiedTopics',[]):raise ValueError('TOPIC_NOT_QUALIFIED')
     self.graph.edge(e['id'],tid,'QUALIFIED_SUPPORT' if a else 'PARTIAL_CONTEXT_ONLY',bool(a))
    self.graph.edge(tid,rid,'TOPIC_ASSESSMENT')
   self.row_qualifications.append(dict(id=row['id'],status=row['status'],validation='SEALED_LEGACY_SCHEMA_COMPATIBILITY_NO_RERATING' if compat else 'EXACT_M3_AND_DFR03_REVIEW_REPLAY' if a else 'DEFERRED_UNCHANGED',assessmentHash=digest(a) if a else None))
  for s in self.store.read(D4+'/sector-reconciliation.json'):
   if s['ticker']==t and t in ('VIC','VHM'):
    q='LEGACY_DEBT_EXCEPTION:'+t;self.graph.add(q,'QUARANTINED_DEFINITION_EXCEPTION',t,'CONFLICT',basis=s['debtMaturitiesCovenantsFunds']['legacyStatus'],differenceVnd=s['debtMaturitiesCovenantsFunds']['legacyMinusIdentifiedVnd'])
    ref=f'METRIC:{t}:CONSOLIDATED:REPORTED_BORROWINGS:2025';self.graph.edge(ref,q,'LEGACY_REFERENCE_ONLY')
  result=deepcopy(old);result.update(contract=CONTRACT,metrics=metrics,providerCrosschecks=crosschecks,sectorRouting=dict(researchSubtype=SECTORS[t],rule=ROUTE_RULES[SECTORS[t]],formalSectorAdmission=False),legacyDebtExceptionId='LEGACY_DEBT_EXCEPTION:'+t if t in ('VIC','VHM') else None)
  if result['rubrics']!=old['rubrics']:raise ValueError('ASSESSMENT_OR_DEFERRED_PARITY')
  for k in ['totalScore','ranking','currentSignal','valuationPerShare']:
   if result[k] is not None:raise ValueError('SYNTHETIC_TOTAL_OR_DECISION')
  if result['productionAdmissible'] or result['scoringAuthorized']:raise ValueError('RESEARCH_BOUNDARY')
  validate_dossier(result,old)
  return result,records

def rules():return json.loads((ROOT/'src/domain/scoring/methodology.ts').read_text().split('deepFreeze(',1)[1].rsplit(');',1)[0])


def validate_dossier(d,reference=None):
 """Research DTO validation; this grants no topic qualification or scoring authority."""
 t=issuer(d['ticker'])
 if d['contract']!=CONTRACT or d['classification']!='RESEARCH_PROVISIONAL' or d['productionAdmissible'] is not False or d['scoringAuthorized'] is not False:raise ValueError('RESEARCH_CONTRACT_REQUIRED')
 if any(d[k] is not None for k in ('totalScore','ranking','currentSignal','valuationPerShare')):raise ValueError('NO_SYNTHETIC_TOTAL_OR_DECISION')
 route=d['sectorRouting']
 if route['researchSubtype']!=SECTORS[t] or route['formalSectorAdmission'] is not False:raise ValueError('RESEARCH_SECTOR_ROUTE_ONLY')
 ms=d['metrics'];ids={m['id'] for m in ms}
 if len(ids)!=len(ms):raise ValueError('DUPLICATE_METRIC')
 for m in ms:
  if not m['id'].startswith(t+':') or m['status'] not in STATUSES:raise ValueError('METRIC_ID_OR_STATUS')
  if m['value'] is not None:number(m['value'])
  if not set(m['dependencyIds'])<=ids:raise ValueError('DANGLING_FINANCIAL_DEPENDENCY')
  for field in ('periodStart','periodEnd','periodType','scope','unit','scale','revisionBasis'):
   if field not in m:raise ValueError('METRIC_DIMENSION_REQUIRED:'+field)
 rm={r['id']:r for r in rules()};rows=d['rubrics']
 if len(rows)!=23 or {r['rubric'] for r in rows}!=set(rm):raise ValueError('EXACT_23_RUBRICS_REQUIRED')
 for row in rows:
  rule=rm[row['rubric']]
  if row['ticker']!=t or row['id']!=t+':'+row['rubric'] or row['requiredTopics']!=rule['topics']:raise ValueError('RUBRIC_ID_OR_TOPICS')
  if row['status']=='COMPLETED_RESEARCH':
   a=row['assessment'];validate_partial_assessment(a,rule)
   if row['points']!=a['selectedPoints'] or row['band']!=a['assessment']:raise ValueError('RUBRIC_ASSESSMENT_MISMATCH')
  elif row['status']=='NOT_RATED':
   if row['points'] is not None or row['band'] is not None or not row['exactMissingFields']:raise ValueError('DEFERRED_CANNOT_BE_ZERO_OR_EMPTY')
  else:raise ValueError('REPLAY_DISPOSITION_REQUIRED')
 if reference is not None and rows!=reference['rubrics']:raise ValueError('PRESERVED_RUBRIC_PARITY_REQUIRED')
 return True
