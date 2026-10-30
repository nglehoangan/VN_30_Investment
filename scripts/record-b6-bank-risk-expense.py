"""Literal P&L risk expense readings from26 full PDF pages inspected by ChatGPT.
Year bindings are explicit: VCB FY2023 is the comparative column in its FY2024 source.
"""
import datetime,hashlib,json
from pathlib import Path
ROOT=Path('docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-30/b6-underwriting-r4');ROOT.mkdir(exist_ok=True)
S=json.loads(Path('docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-30/b6-comparability-r2/native-review-sources.json').read_text())
# FY2023, FY2024 (comparative in2025 source), FY2025 risk expense, FY2025 PPOP and PBT.
VALUES={
 'ACB':('1804231','1606285','3334748','22873524','19538776'),
 'BID':('20343515','21040890','22998662','60786180','37787518'),
 'CTG':('25115141','27598829','17298056','60741865','43443809'),
 'HDB':('4267751','5321434','9748394','31094885','21346491'),
 'LPB':('2826040','1953819','1422280','15691168','14268888'),
 'MBB':('6087032','9576644','13743504','48011862','34268358'),
 'SHB':('7037837','6242792','7575386','22595967','15020581'),
 'SSB':('1200285','2239382','2585848','9454237','6868389'),
 'STB':('3688105','1974364','11383775','19011800','7628025'),
 'TCB':('3921068','4082294','4420625','36958691','32538066'),
 'VCB':('4529947','3314998','3192186','47211823','44019637'),
 'VIB':('4845805','4353458','3467019','12571635','9104616'),
 'VPB':('24994374','27902624','25398549','56023498','30624949'),
}
PAGES={'ACB':(10,10),'BID':(11,12),'CTG':(12,11),'HDB':(10,10),'LPB':(11,10),'MBB':(13,13),'SHB':(10,10),'SSB':(9,11),'STB':(12,10),'TCB':(13,14),'VCB':(12,11),'VIB':(10,11),'VPB':(12,12)}
rows=[]
for ticker,v in VALUES.items():
 sources=[]
 for requested_year,page in zip([2023,2025],PAGES[ticker]):
  o=next(o for o in S['observations'] if o['ticker']==ticker and o['itemId']=='NET_INCOME' and o['periodEnd']==f'{requested_year}-12-31');ctx=next(c for c in S['contexts'] if c['observationId']==o['id']);path=ctx['sourcePath'];assert hashlib.sha256(Path(path).read_bytes()).hexdigest()==ctx['sourceHash']
  sources.append(dict(pdfPath=path,sha256=ctx['sourceHash'],page=page,href=path+'#page='+str(page),columnBinding={'2023':'COMPARATIVE_FY2023_IN_FY2024_REPORT' if ticker=='VCB' else 'CURRENT_FY2023'} if requested_year==2023 else {'2024':'COMPARATIVE_FY2024_IN_FY2025_REPORT','2025':'CURRENT_FY2025'},scope='STANDALONE' if ticker=='LPB' else 'CONSOLIDATED'))
 assert int(v[3])-int(v[2])==int(v[4]),ticker
 rows.append(dict(ticker=ticker,sector='BANK',sourceScope=sources[0]['scope'],currency='VND',currencyMultiplier='1000000',caption='Chi phí dự phòng rủi ro' if ticker in ['MBB','VPB'] else 'Chi phí dự phòng rủi ro tín dụng',riskExpenseByYear={str(y):value for y,value in zip([2023,2024,2025],v[:3])},preProvisionProfitFY2025=v[3],preTaxProfitFY2025=v[4],sourceEvidence=sources,review=dict(actor='CHATGPT',fullPageImagesInspected=True,reviewedAt=datetime.datetime.now(datetime.timezone.utc).isoformat()),qualification='CHECKED_REPORTED_P_AND_L_NOT_LOAN_ONLY_CREDIT_COST',loanOnlyNumeratorReconciled=False,productionScoringAuthorized=False))
(ROOT/'checked-bank-risk-expense.json').write_text(json.dumps(dict(contract='b6-checked-bank-risk-expense-v1',rows=rows,normalizationBoundary='Aggregate P&L risk expense may include securities/other exposures or nonbank subsidiaries. Do not claim a loan-only credit cost without reconciling the note components.'),ensure_ascii=False,indent=2)+'\n');print('Recorded13banks,39annual risk expense readings,26source pages')
