"""Literal cash spending readings from full source images; preserve gross spending and deposit mixtures."""
import datetime,hashlib,json
from pathlib import Path
from decimal import Decimal
ROOT=Path('docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-30/b6-underwriting-r4');ROOT.mkdir(exist_ok=True)
S=json.loads(Path('docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-30/b6-comparability-r2/native-review-sources.json').read_text())
COMMON={r['ticker']:r for r in json.loads(Path('docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-30/b6-economics-r3/checked-common-earnings.json').read_text())['facts']}
# Native positive-spending magnitudes, not netted against disposals, borrowing, or deposits.
VALUES={
 'VNM':('1',{2022:'1456914052616',2023:'1579637140762',2024:'1741501711051',2025:'1762010725342'},13,13),
 'MWG':('1',{2022:'4465359523505',2023:'523383330794',2024:'303747827395',2025:'888461890189'},10,10),
 'MSN':('1000000',{2022:'4165321',2023:'2228795',2024:'3099300',2025:'1878231'},13,15),
 'MCH':('1',{2022:'1243183928156',2023:'573174002924',2024:'514058307692',2025:'1185442685542'},12,13),
 'SAB':('1',{2022:'533164261997',2023:'283734894513',2024:'296018278038',2025:'241543771108'},15,15),
}
rows=[]
for ticker,(mult,years,old_page,new_page) in VALUES.items():
 for year,value in years.items():
  if year>=2024:path=COMMON[ticker]['source']['pdfPath'];page=new_page;doc_year=2025
  elif ticker=='SAB':path='data/manual-download/SAB/SAB_Baocaotaichinh_2023_Kiemtoan_Hopnhat.pdf';page=old_page;doc_year=2023
  else:
   o=next(o for o in S['observations'] if o['ticker']==ticker and o['itemId']=='CFO' and o['periodEnd']=='2023-12-31');ctx=next(c for c in S['contexts'] if c['observationId']==o['id']);path=ctx['sourcePath'];page=old_page;doc_year=2023
  sha=hashlib.sha256(Path(path).read_bytes()).hexdigest()
  rows.append(dict(id=f'checked-cash-acquisition-{ticker}-FY{year}',ticker=ticker,itemId='CASH_CAPEX_REPORTED',fiscalYear=year,periodStart=f'{year}-01-01',periodEnd=f'{year}-12-31',sourceScope='CONSOLIDATED',currency='VND',currencyMultiplier=mult,rawCashflowSignedValue='-'+value,spendingMagnitudeNative=value,spendingMagnitudeVnd=format(Decimal(value)*Decimal(mult),'f'),sourceCaption='Cash paid for acquisition/construction of fixed assets and other long-term assets; statement row21',source=dict(pdfPath=path,sha256=sha,page=page,href=path+'#page='+str(page),statementCode='21',documentYear=doc_year,column='CURRENT_YEAR' if year==doc_year else 'PRIOR_YEAR_COMPARATIVE',cellBox=None),review=dict(actor='CHATGPT',fullPageImageInspected=True,reviewedAt=datetime.datetime.now(datetime.timezone.utc).isoformat()),qualification='REPORTED_CASH_ACQUISITION_SPENDING_NOT_MAINTENANCE_CAPEX',maintenanceFraction=None,commonOwnerFcfeQualified=False,productionScoringAuthorized=False))
(ROOT/'checked-extra-capex.json').write_text(json.dumps(dict(contract='b6-checked-extra-cash-acquisition-v1',rows=rows),ensure_ascii=False,indent=2)+'\n')
# VRE is intentionally kept outside clean-capex observations: caption includes deposits.
p='data/manual-download/VRE/VRE_Baocaotaichinh_2023_Kiemtoan_Hopnhat.pdf';mixed=dict(ticker='VRE',period='FY2023',currencyMultiplier='1000000',grossMixedOutflow='8321768',depositReceipts='816956',signedNetMixedFlow='-7504812',sourceCaption='Tiền chi mua tài sản cố định, tài sản dài hạn khác và đặt cọc cho mục đích đầu tư',source=dict(pdfPath=p,sha256=hashlib.sha256(Path(p).read_bytes()).hexdigest(),page=15,href=p+'#page=15'),review=dict(actor='CHATGPT',fullPageImageInspected=True),maintenanceCapex=None,cleanAcquisitionCapex=None,qualification='MIXED_ASSET_ACQUISITION_AND_INVESTMENT_DEPOSITS_REQUIRES_NOTE_BRIDGE',productionScoringAuthorized=False)
(ROOT/'vre-mixed-investing-flow.json').write_text(json.dumps(mixed,ensure_ascii=False,indent=2)+'\n');print('Recorded20annual cash acquisition observations and1separate mixed-flow issue')
