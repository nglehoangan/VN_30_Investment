"""Read-only review. All output restricted to this evidence directory. No admission/scoring calls."""
import json, hashlib, sqlite3, gc, re
from pathlib import Path
from decimal import Decimal
from collections import Counter, defaultdict
from datetime import datetime, timezone
OUT=Path(__file__).resolve().parent
ROOT=OUT.parents[3]
assert ROOT.name=='VN_30_Investment', ROOT
E=ROOT/'docs/fundamental-data-engine/evidence'
def read(p): return json.loads((ROOT/p).read_text())
def sha(p):
 h=hashlib.sha256()
 with open(p,'rb') as f:
  for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
 return h.hexdigest()
def save(n,d): (OUT/n).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
def ref(p): return {'path':str(p),'sha256':sha(ROOT/p)}
def isqualified(f):
 if f.get('reviewAdmissionEvidence',{}).get('accepted') is True:return True
 if all(f.get(k) is True for k in ['qualified','valueVerified','definitionVerified','provenanceVerified']):return True
 return bool(f.get('contractCertificateId') and f.get('observationValidationId') and any(all(m.get(k) is True for k in ['qualified','valueVerified','definitionVerified','provenanceVerified']) and all(m.get(k)==f.get(k) for k in ['value','unit','currency','scope','period','itemId']) for m in f.get('retainedIssuerVerificationMetadata',[])))
def thin(f):
 keys=['id','ticker','itemId','value','period','reportPeriodType','scope','unit','currency','authority','qualified','definitionVerified','valueVerified','provenanceVerified','zeroVerified','sourceHash','evidenceReference','evidenceLocator','revisionStatus','revisionEvidence','debtMetadata','extractionMethod','reviewStatus','retainedIssuerVerificationMetadata','contractCertificateId','mappingContractId','observationValidationId','reviewAdmissionEvidence']
 return {k:f[k] for k in keys if k in f}
protected={str(p.relative_to(ROOT)):sha(p) for p in sorted((ROOT/'data').rglob('*')) if p.is_file()}
save('PROTECTED_INPUTS.json',{'policy':'All files under data; SHA256 before and after review','before':protected})
manifest=read('data/combine/manifest.json'); download=read('data/manual-download/manifest.json')
byhash=defaultdict(list)
for r in download['requests']:
 if r.get('sha256'):byhash[r['sha256']].append(r['path'])
base=read('docs/fundamental-data-engine/evidence/2026-10-16-vn30-data-initialization-final-closure/AGGREGATE_COVERAGE.json')['tickers']
base={r['ticker']:r for r in base}
registry=read('src/domain/fundamentals/manual-fundamental-evidence-requirements-v2.json')
current={}
c=sqlite3.connect('file:'+str(ROOT/'data/vn30.sqlite')+'?mode=ro&immutable=1',uri=True)
for dbid,body,bodyhash in c.execute('select id,body,body_hash from fundamental_admission_run'):
 d=json.loads(body); validations={v['id']:v for v in d['observationValidations']}; facts=[]
 for original in d['canonicalFacts']:
  f=thin(original);v=validations.get(f.get('observationValidationId'))
  if v and v.get('accepted') and v.get('contractCertificateId')==f.get('contractCertificateId') and v.get('mappingContractId')==f.get('mappingContractId') and all(v.get(k)==f.get(k) for k in ['scope','unit','currency']):f['reviewAdmissionEvidence']=v
  facts.append(f)
 t=facts[0]['ticker']
 current[t]={'facts':facts,'rowId':dbid,'bodyHash':bodyhash,'analysisAt':d['analysisAt'],'readyForScoring':d['readyForScoring'],'invalidVerificationIds':d['invalidVerificationIds']}
 del d,body
c.close()
# Independently compare retained approved facts, all dimensions and source changes, not OCR amount matching.
regression=[]; all30=[]; identityPeriods=set(); reportTypes=set(); schemaRows=[]; sourceRows=[]; crosschecks=[]
for t in sorted(base):
 b=base[t]; old=read(b['canonicalPath']); oldfacts=old['canonicalFacts']; facts=current[t]['facts']; sector=b['sector']
 target=b['current']['LONG_TERM_BASELINE']+[b['current']['CURRENT_TRAJECTORY']['latestValidYtd']]
 # latestValidYtd can be lightweight; explicit system target from existing period coverage is authoritative.
 targets={p['target']['end']:p['target'] for p in b['periods']}
 groups=registry['sectors'][sector]['CORE']+registry['sectors'][sector]['SECTOR_CORE']
 observations=[]
 for end,targ in sorted(targets.items()):
  frame=targ['frame']; scope=next(p['scope'] for p in b['periods'] if p['target']['end']==end) or 'CONSOLIDATED'
  for g in groups:
   candidates=[f for f in facts if f['itemId'] in g['anyOf'] and f['period']['end']==end and f['scope']==scope and (f['period']['start']==end or (f.get('reportPeriodType')==frame and f['period']['start']==targ['start']))]
   qualified=[f for f in candidates if isqualified(f)]
   status='QUALIFIED' if qualified else 'MISSING'
   if qualified and all(Decimal(f['value'])==0 for f in qualified):status='ZERO_REPORTED' if all(f.get('zeroVerified') for f in qualified) else 'SUSPECT'
   if len({(f['itemId'],f['value'],f['unit'],f.get('currency')) for f in qualified})>len({f['itemId'] for f in qualified}):status='CONFLICT'
   sources=[]
   for f in candidates:
    hs=[f.get('sourceHash')]+f.get('debtMetadata',{}).get('sourceHashes',[])+[m.get('sourceHash') for m in f.get('retainedIssuerVerificationMetadata',[])]
    sources.extend({'sha256':h,'currentPdfPaths':byhash.get(h,[]),'freshPdfAvailable':bool(byhash.get(h))} for h in dict.fromkeys(h for h in hs if h))
   observations.append({'periodEnd':end,'frame':frame,'periodStart':targ['start'],'scope':scope,'requirement':g['id'],'anyOf':g['anyOf'],'status':status,'facts':candidates,'sourceAvailability':sources,'authorityBasis':'RETAINED_ISSUER_VERIFIED_CANONICAL_PROVENANCE; fresh OCR not authoritative'})
 changes=[]
 key=lambda f:(f['itemId'],f['period']['start'],f['period']['end'],f['scope'],f['unit'],f.get('currency'),f.get('reportPeriodType'))
 oi=defaultdict(list);ni=defaultdict(list)
 for f in oldfacts:oi[key(f)].append(f)
 for f in facts:ni[key(f)].append(f)
 for k,fs in oi.items():
  nf=ni.get(k,[])
  if not nf:changes.append({'key':k,'classification':'UNKNOWN','kind':'NO_EXACT_DIMENSION_SUCCESSOR','oldFacts':[thin(f) for f in fs]})
  elif {f['value'] for f in fs}!={f['value'] for f in nf}:changes.append({'key':k,'classification':'CONFLICT','kind':'VALUE_CHANGE','old':[thin(f) for f in fs],'new':nf})
  elif {f.get('sourceHash') for f in fs}!={f.get('sourceHash') for f in nf}:changes.append({'key':k,'classification':'UNKNOWN','kind':'SOURCE_CHANGE_SAME_VALUE','oldSources':[f.get('sourceHash') for f in fs],'newSources':[f.get('sourceHash') for f in nf]})
 duplicates=[{'key':k,'values':[f['value'] for f in fs]} for k,fs in ni.items() if len(fs)>1]
 baselineClosed=t not in ['VNM','TCX','MBB','VIB','VIC']
 regression.append({'ticker':t,'previouslyClosed25':baselineClosed,'baselineCanonical':ref(b['canonicalPath']),'baselineFacts':len(oldfacts),'currentFacts':len(facts),'changes':changes,'duplicateCanonicalKeys':duplicates,'mandatoryMissing':[{'end':o['periodEnd'],'requirement':o['requirement']} for o in observations if o['status'] not in ['QUALIFIED','ZERO_REPORTED','NOT_APPLICABLE']]})
 # Check existing canonical assets identity only when all three compatible facts are available.
 for end in targets:
  fs={f['itemId']:f for f in facts if f['period']['end']==end and f.get('qualified')}
  ids=['TOTAL_ASSETS','TOTAL_LIABILITIES','TOTAL_EQUITY']
  if all(i in fs for i in ids) and len({(fs[i]['unit'],fs[i].get('currency'),fs[i]['scope']) for i in ids})==1:
   x=Decimal(fs[ids[0]]['value']);y=Decimal(fs[ids[1]]['value'])+Decimal(fs[ids[2]]['value']);delta=abs(x-y)
   status='MATCH' if not delta else 'ROUNDING_ONLY' if delta<=1000 or delta*2<= (abs(x)+abs(y))*Decimal('.000001') else 'CONFLICT'
   crosschecks.append({'ticker':t,'end':end,'check':'ASSETS_EQUALS_LIABILITIES_PLUS_EQUITY','left':str(x),'right':str(y),'delta':str(delta),'classification':status,'factIds':[fs[i]['id'] for i in ids]})
 all30.append({'ticker':t,'sector':sector,'requiredPeriods':list(sorted(targets.values(),key=lambda x:x['end'])),'mandatoryObservations':observations,'productionSnapshot':{k:v for k,v in current[t].items() if k!='facts'},'baselineClosed25':baselineClosed})
 del old,oldfacts
 # Review fresh combined presentation separately; no codes/amounts used to establish canonical mapping.
 doc=read('data/combine/'+t+'.json');cnt=Counter();warn=Counter();periods=set();reports=set();bad=[];rows=0
 for rk,report in doc['reports'].items():
  reports.add(rk)
  for pk,p in report['periods'].items():
   periods.add(pk)
   for vi,v in enumerate(p['variants']):
    identityPeriods.add((str(v.get('year')),str(v.get('quarter')),str(v.get('periodType')),str(v.get('asOf'))));reportTypes.add(rk)
    for group in v.get('groups',[]):
     for ri,row in enumerate(group['rows']):
      rows+=1;cnt[row.get('source','UNKNOWN')]+=1
      for w in row.get('reviewReasons',[]):warn[w]+=1
      value=row.get('value')
      if value is not None and (not isinstance(value,str) or not re.fullmatch(r'-?\d+(?:\.\d+)?',value)):bad.append({'id':row['id'],'issue':'NON_LOSSLESS_DECIMAL_VALUE'})
      if row.get('source')=='PDF_REPORTED':
       ev=row.get('pdfEvidence',{});pp=ev.get('pdfPath');page=ev.get('page')
       if not pp or not (ROOT/pp).is_file() or not isinstance(page,int) or page<1 or not ev.get('jsonPointer'):bad.append({'id':row['id'],'issue':'PDF_LINEAGE_MISSING'})
      if row.get('productionAdmissible') is not False:bad.append({'id':row['id'],'issue':'PRESENTATION_ADMISSIBILITY_NOT_FALSE'})
 schemaRows.append({'ticker':t,'rows':rows,'selections':dict(cnt),'reviewReasons':dict(warn),'periodKeys':sorted(periods),'reports':sorted(reports),'errors':bad,'sourceFiles':doc['sourceFiles']})
 print(t,len(observations),len(changes),len(bad),flush=True)
 del doc;gc.collect()
save('ALL30_LEVEL1_REVALIDATION.json',{'schemaVersion':'read-only-level1-review-v1','contract':ref('src/domain/fundamentals/manual-fundamental-evidence-requirements-v2.json'),'method':'Every mandatory OR group evaluated against dimension-bound retained issuer-qualified facts. New presentation validated separately; no auto-admission. Special candidate qualifications in five ticker files.','tickers':all30})
save('PREVIOUSLY_CLOSED_REGRESSION_REVIEW.json',{'baselinePartition':ref('docs/fundamental-data-engine/evidence/2026-10-17-data-initialization-final-acceptance/UNIVERSE_PARTITION.json'),'records':regression})
save('DATASET_IDENTITY.json',{'path':'data/combine/manifest.json','sha256':sha(ROOT/'data/combine/manifest.json'),'schemaVersion':manifest['schemaVersion'],'generationTimestamp':None,'generationTimestampStatus':'NOT_RECORDED_IN_MANIFEST','filesystemModifiedAt':datetime.fromtimestamp((ROOT/'data/combine/manifest.json').stat().st_mtime,timezone.utc).isoformat(),'manifestDefinesDataset':True,'tickers':[r['ticker'] for r in manifest['files']],'files':manifest['files'],'representedPeriodDimensions':[list(x) for x in sorted(identityPeriods)],'statementTypes':sorted(reportTypes),'sourceTypes':['ISSUER_PDF_VIA_VIETSTOCK','CAFEF_API'],'productionAdmissible':False,'productionDatabaseIsSeparate':ref('data/vn30.sqlite'),'historicalBaseline':'25/5 accepted Oct17; actual database updated Oct19 before this review is28/2; neither silently replaced by candidate partition'})
save('DATASET_SCHEMA_REVIEW.json',{'hierarchy':'reports → report key → periods → period key → variants → groups → rows','result':'VALID_UNREVIEWED_PRESENTATION_WITH_EXPLICIT_LIMITS','perTicker':schemaRows,'canonicalMapping':'Not supplied by presentation schema. Canonical semantics established only by retained reviewed source captions/definitions and contracts; equality/code coincidence never sufficient.','identityAndAudit':'Hash-bound document metadata and retained qualification are needed; filename hints and OCR scope candidates alone are insufficient.','unitPolicy':'PDF page-declared candidate units; CafeF undeclared units remain unknown, no conversion guessed.','periodPolicy':'Annual, quarter and YTD variants retained. Known Q2/YTD OCR ambiguity prevents period-key-only promotion.','unknownsAreNotInvalidFacts':'Missing optional metadata is not itself a Level1 rejection.'})
save('CROSS_STATEMENT_CHECKS.json',{'toleranceSource':'src/infrastructure/fundamentals/cafef.ts:104','absoluteTolerance':'1000 canonical currency units','relativeTolerance':'0.000001 using symmetric mean magnitude','records':crosschecks,'limits':'Only dimension-compatible canonical identities calculated. Other identities must not be fabricated from unreviewed OCR.'})
# Intermediate snapshots deliberately not persisted.
# Per-period identity review, retaining issuer authority and reference independently of OCR.
periodReview=[]
for row in all30:
 t=row['ticker'];b=base[t];inp=read(b['inputPath']);periods=[]
 for target in row['requiredPeriods']:
  end=target['end'];obs=[o for o in row['mandatoryObservations'] if o['periodEnd']==end];scope=obs[0]['scope']
  docs=[{k:s[k] for k in ['documentId','SHA256','ticker','issuer','documentType','reportingPeriod','reportingScope','currency','unitBasis','reviewStatus','reviewReference','auditReviewStatus','opinionPages'] if k in s} for s in inp['statements'] if s['reportingPeriod']['end']==end and s.get('reportingScope')==scope]
  periods.append({'target':target,'requiredScope':scope,'retainedQualifiedDocuments':docs,'basis':'Retained approved source qualification; no new issuer/audit inference from filename or API providerContent. Five-ticker original reviews supplement these references.','mandatoryGroups':len(obs),'satisfiedBeforeSpecialReview':sum(o['status']=='QUALIFIED' for o in obs),'requalificationPolicy':'Existing owner retention policy; unavailable deleted temporary readers are not rejection grounds.'})
 periodReview.append({'ticker':t,'retainedInput':b['inputPath'],'periods':periods})
save('PERIOD_SOURCE_REVIEW.json',{'tickers':periodReview,'limits':'ReviewStatusQUALIFIED is retained admission metadata; not a claim every opinion page was freshly visually checked. Known issuer/scope/period/audit governance preserved, not silently replaced by OCR metadata.'})
