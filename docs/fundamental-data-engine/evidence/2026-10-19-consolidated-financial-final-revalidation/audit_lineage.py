"""Independent raw-pointer audit; does not invoke pipeline writers."""
import json,re,gc,sqlite3
from pathlib import Path
from decimal import Decimal
from collections import Counter
OUT=Path(__file__).resolve().parent;ROOT=OUT.parents[3]
def read(p):return json.loads((ROOT/p).read_text(),parse_float=Decimal)
def save(n,d):(OUT/n).write_text(json.dumps(d,ensure_ascii=False,indent=2,default=str)+'\n')
def pointer(doc,path):
 for k in path.lstrip('/').split('/'):
  k=k.replace('~1','/').replace('~0','~');doc=doc[int(k)] if isinstance(doc,list) else doc[k]
 return doc
def enc(k):return k.replace('~','~0').replace('/','~1')
def rows(d):
 for rk,r in d['reports'].items():
  for pk,p in r['periods'].items():
   for vi,v in enumerate(p['variants']):
    for gi,g in enumerate(v['groups']):
     for ri,row in enumerate(g['rows']):yield f'/reports/{enc(rk)}/periods/{enc(pk)}/variants/{vi}/groups/{gi}/rows/{ri}',row,v
results=[];identities=[]
for file in read('data/combine/manifest.json')['files']:
 t=file['ticker'];errors=[];counts=Counter();pdf=read('data/manual-extracted-pdf/'+t+'.json');pages={p:doc['pageCount'] for doc in pdf['documents'] for p in doc['retainedPaths']};index={p:(r.get('value'),r.get('label'),r.get('code'),r.get('status'),r.get('sourcePage')) for p,r,v in rows(pdf)}
 for doc in pdf['documents']:identities.append({'ticker':t,'sourceHash':doc['sourceHash'],'pdfPaths':doc['retainedPaths'],'pageCount':doc['pageCount'],'identityStatus':doc['identityStatus'],'identity':doc.get('identity')})
 del pdf;gc.collect()
 api=read('data/manual-extracted-api/'+t+'.json');aindex={};cache={}
 for p,row,v in rows(api):
  aindex[p]=(row.get('value'),row.get('label'),row.get('code'));loc=row.get('rawLocator')
  if row.get('value') is not None and loc:
   src=v['source'];rawpath=src['rawPayloadLocation']
   if rawpath not in cache:cache[rawpath]=read(rawpath)
   try:
    raw=pointer(cache[rawpath],loc);counts['apiRawCellPointers']+=1
    if raw is None or Decimal(str(raw))!=Decimal(row['value']):errors.append({'pointer':p,'issue':'RAW_API_VALUE_MISMATCH'})
   except (KeyError,ValueError,IndexError,TypeError) as e:errors.append({'pointer':p,'issue':'RAW_API_POINTER_INVALID','error':str(e)})
  if v.get('modeMismatch'):counts['modeMismatches']+=1
 del api,cache;gc.collect();combined=read(file['path'])
 for p,row,v in rows(combined):
  ev=row.get('pdfEvidence')
  if ev:
   counts['combinedToPdfPointers']+=1;original=index.get(ev.get('jsonPointer'))
   if not original:errors.append({'pointer':p,'issue':'PDF_JSON_POINTER_NOT_FOUND'})
   elif row.get('source')=='PDF_REPORTED' and original[:3]!=(row.get('value'),row.get('label'),row.get('code')):errors.append({'pointer':p,'issue':'PDF_REPORTED_VALUE_LABEL_CODE_CHANGED'})
   if ev.get('pdfPath') not in pages or not 1<=ev.get('page',0)<=pages.get(ev.get('pdfPath'),0):errors.append({'pointer':p,'issue':'PDF_PAGE_OUT_OF_RANGE'})
  if row.get('apiEvidence'):
   counts['combinedToApiPointers']+=1;original=aindex.get(row['apiEvidence']['jsonPointer'])
   if not original or original!=(row.get('referenceValue',row.get('value')),row.get('label'),row.get('code')):errors.append({'pointer':p,'issue':'API_REFERENCE_CHANGED'})
  for ref in row.get('cafefReferences',[]):
   ptr=ref.get('jsonPointer');counts['combinedCrosscheckReferences']+=1
   if not ptr or ptr not in aindex or aindex[ptr][0]!=ref.get('value'):errors.append({'pointer':p,'issue':'CAFEF_CROSSCHECK_POINTER_VALUE_MISMATCH'})
  if row.get('source')=='PDF_REPORTED' and row.get('value')=='0':counts['pdfNumericZeroRetained']+=1
  if row.get('source')=='CAFEF_REFERENCE' and row.get('value')=='0':counts['apiZeroReferenceOnly']+=1
  if row.get('pdfStatus') in ['DASH','NULL','MISSING','UNREADABLE'] and row.get('source')=='PDF_REPORTED' and row.get('value')=='0':errors.append({'pointer':p,'issue':'DASH_OR_MISSING_CONVERTED_TO_PDF_ZERO'})
 results.append({'ticker':t,'counts':dict(counts),'errors':errors});print(t,dict(counts),'errors',len(errors),flush=True)
 del combined,index,aindex;gc.collect()
save('EXACT_POINTER_AUDIT.json',{'status':'PASS' if not any(r['errors'] for r in results) else 'FAIL','records':results,'purpose':'Lineage equality only, never concept mapping based on amounts. Raw API cells verified with arbitrary-precision numeric parsing. PDF selection compared to original retained extraction by exact JSON pointer; does not prove OCR image correctness.'})
save('SOURCE_IDENTITY_REVIEW.json',{'documents':identities,'identityCounts':dict(Counter(x['identityStatus'] for x in identities)),'limits':'Only EXISTING_HASH_BOUND_REVIEW metadata is previously qualified. Other filenames/scan candidates are not issuer/audit qualification.'})
# Known rejected legacy verifications must remain rejected and unreferenced by canonical facts.
c=sqlite3.connect('file:'+str(ROOT/'data/vn30.sqlite')+'?mode=ro&immutable=1',uri=True);zero=[]
for (body,) in c.execute('select body from fundamental_admission_run'):
 d=json.loads(body);t=d['canonicalFacts'][0]['ticker'];invalid=set(d['invalidVerificationIds']);leaks=[f['id'] for f in d['canonicalFacts'] if invalid.intersection(f.get('verificationIds',[]))]
 zeros=[{'id':f['id'],'metric':f['itemId'],'period':f['period'],'zeroVerified':f.get('zeroVerified'),'authority':f['authority']} for f in d['canonicalFacts'] if Decimal(f['value'])==0]
 zero.append({'ticker':t,'invalidVerificationIds':sorted(invalid),'invalidVerificationReferencedByCanonical':leaks,'canonicalZeroFacts':zeros})
c.close();save('ZERO_SEMANTICS_REVIEW.json',{'records':zero,'policy':'Reported numeric zero differs from dash/null/missing; CafeF zeros remain unverified references unless approved existing contract establishes semantics; no neutral fill.','invalidLegacyVerificationsLeak':any(r['invalidVerificationReferencedByCanonical'] for r in zero),'rawZeroAndDashLineageAudit':'EXACT_POINTER_AUDIT.json'})
