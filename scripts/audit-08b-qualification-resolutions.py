"""Replay the exact retained VRE quarterly-period qualification resolution."""
import copy,hashlib,json,pathlib,runpy
B=pathlib.Path('data/initialization-08b-remediation-work')
BODY='81fd8c18b29a256b57232895ca0deb4bad9106745aa347a751ef3ba9f8297dcc'
sha=lambda p:hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()
def validate(packet):
 try:
  if packet['ticker']!='VRE' or packet['bodyHash']!=BODY or packet['method']!='TWO_INDEPENDENT_DATED_PRIMARY_BALANCE_AND_FLOW_HEADERS' or packet['governanceStatus']!='REVIEW_CANDIDATE' or packet['independentHumanApproval'] is not None or packet['historicalAvailabilityBackdated'] is not False:return False
  old,new=packet['priorQualificationException'],packet['replacementQualification']
  if old['bodyHash']!=BODY or new['bodyHash']!=BODY or old['status']!='EXCEPTION_REVIEW_REQUIRED' or new['status']!='TECHNICALLY_QUALIFIED_REVIEW_CANDIDATE' or old['period'] is not None or new['scope']!='CONSOLIDATED':return False
  current=next(q for q in json.loads((B/'qualifications.json').read_text()) if q['bodyHash']==BODY)
  if current!=new or sha(B/(BODY+'.pdf'))!=BODY:return False
  if sorted(new['contentEvidencePages']['REPORTING_PERIOD'])!=sorted(int(pathlib.Path(p['file']).stem.split('-p')[-1]) for p in packet['sourceProofs']):return False
  pages={}
  for s in packet['sourceProofs']:
   f=pathlib.Path(s['file']);p=json.loads(f.read_text())
   if f!=B/'ocr'/f'{BODY}-p{p["page"]}.json' or sha(f)!=s['sha256'] or sha(f.with_suffix('.png'))!=p['renderSha256'] or p['renderSha256']!=s['renderSha256'] or p['bodyHash']!=BODY or p['engineA']==p['engineB']:return False
   pages[p['page']]=p
  r=runpy.run_path('scripts/reconcile-08b-extraction.py');balance=pages[5];flow=pages[9]
  if not all('BALANCE' in r['primary_kinds'](balance,k) and 'CASH_FLOW' in r['primary_kinds'](flow,k) for k in ['passA','passB']):return False
  header=lambda p,k:' '.join(g['text'] for g in r['lines'](p[k]) if g['cy']<.30)
  window=r['agreed_primary_interim_window'](header(balance,'passA'),header(balance,'passB'),header(flow,'passA'),header(flow,'passB'))
  return window==new['period'] and window['end']=='2026-03-31' and window['type']=='QUARTER'
 except (KeyError,ValueError,TypeError,OSError,StopIteration):return False

def main():
 p=json.loads((B/'vre-q1-primary-period-resolution.json').read_text());assert validate(p)
 for key,value in [('bodyHash','0'*64),('ticker','VNM'),('method','FILENAME_PERIOD'),('independentHumanApproval','FAKE'),('historicalAvailabilityBackdated',True),('replacementQualification',{**p['replacementQualification'],'period':{**p['replacementQualification']['period'],'end':'2025-12-31'}}),('sourceProofs',p['sourceProofs'][:-1])]:
  bad=copy.deepcopy(p);bad[key]=value;assert not validate(bad),key
 print(json.dumps({'status':'PASS','qualificationResolutions':1,'negativeControls':7}))
if __name__=='__main__':main()
