"""Anonymous bounded HOSE daily trading results; no account/session inputs."""
import json,pathlib,hashlib,datetime,concurrent.futures,subprocess,math
B=pathlib.Path('data/initialization-08b-final-work');D=B/'market';D.mkdir(exist_ok=True)
identities=json.load(open('docs/fundamental-data-engine/evidence/2026-10-10-di123-identities.json'))['identities']
def collect(identity):
 t=identity['ticker'];url=f'https://api.hsx.vn/mk/api/v1/market/securities/tradingresult/{t}?pageIndex=1&pageSize=5';p=D/(t+'.json')
 if p.exists():body=p.read_bytes();receivedAt=datetime.datetime.fromtimestamp(p.stat().st_mtime,datetime.timezone.utc).isoformat()
 else:
  result=subprocess.run(['curl','--fail','--silent','--show-error','--max-time','30',url],capture_output=True,timeout=35)
  if result.returncode or len(result.stdout)>200000:raise RuntimeError('BOUNDED_PUBLIC_FETCH_FAILED')
  body=result.stdout
  receivedAt=datetime.datetime.now(datetime.timezone.utc).isoformat();p.write_bytes(body)
 raw=json.loads(body)
 if raw.get('success')!=True:raise RuntimeError('PUBLIC_MARKET_SOURCE_FAILED')
 rows=raw['data']['list'];eligible=[r for r in rows if r['symbol'].strip()==t and datetime.datetime.fromtimestamp(r['reportDate'],datetime.timezone.utc).date().isoformat()<='2026-10-10']
 if not eligible:raise RuntimeError('NO_DATED_MARKET_OBSERVATION')
 r=max(eligible,key=lambda x:x['reportDate']);
 if not isinstance(r['closePrice'],(int,float)) or not math.isfinite(r['closePrice']) or r['closePrice']<=0 or r['mainVolume']<0:raise RuntimeError('INVALID_PUBLIC_MARKET_PRICE_VOLUME')
 prior=[x for x in eligible if x['reportDate']<r['reportDate']];reference=max(prior,key=lambda x:x['reportDate'])['closePrice'] if prior else None
 return {'securityId':identity['securityId'],'ticker':t,'tradingDate':datetime.datetime.fromtimestamp(r['reportDate'],datetime.timezone.utc).date().isoformat(),'sourceReportDateRaw':r['reportDate'],'datePrecision':'DATE_ONLY_NO_INTRADAY_EXCHANGE_TIME_ASSERTED','price':str(int(r['closePrice'])) if r['closePrice'].is_integer() else str(r['closePrice']),'priceType':'UNADJUSTED_DAILY_CLOSE','referencePrice':None,'referenceSemantics':'OFFICIAL_REFERENCE_PRICE_NOT_RETURNED_BY_THIS_DAILY_ENDPOINT','previousObservedClose':None if reference is None else str(int(reference)),'previousObservedCloseSemantics':'PREVIOUS_DATED_CLOSE_NOT_OFFICIAL_REFERENCE_PRICE','volume':str(int(r['mainVolume'])),'source':'HOSE_PUBLIC_DAILY_TRADING_RESULT','sourceReference':url,'receivedAt':receivedAt,'contentHash':hashlib.sha256(body).hexdigest(),'freshness':'LATEST_DATED_RECORD_RETURNED; no numeric threshold fabricated','status':'TECHNICALLY_VALIDATED_REVIEW_CANDIDATE','approvalReference':None}
if __name__=='__main__':
 rows=[];exceptions=[]
 with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
  fs={pool.submit(collect,i):i for i in identities}
  for f,i in fs.items():
   try:rows.append(f.result())
   except Exception as e:exceptions.append({'ticker':i['ticker'],'reason':type(e).__name__})
 rows.sort(key=lambda x:x['ticker']);(B/'market.json').write_text(json.dumps({'status':'REVIEW_CANDIDATE','approvalReference':None,'rows':rows,'exceptions':exceptions,'marketMethodologyReference':'docs/06_DASHBOARD/6.1 Requirements & Architecture/MARKET_DATA_ADAPTER_v1.0.md','coverage':len(rows),'expected':30},indent=2)+'\n');print(json.dumps({'marketCoverage':len(rows),'exceptions':exceptions}))
