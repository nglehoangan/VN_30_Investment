"""Literal later-period distribution evidence; partial bridges, never annual EPS restatements."""
import datetime,hashlib,json
from pathlib import Path
from decimal import Decimal
ROOT=Path('docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-30/b6-economics-r3')
common={r['ticker']:r for r in json.loads((ROOT/'checked-common-earnings.json').read_text())['facts']}
rows=[]
for ticker,pages,amount,mult,resolution in [
 ('HDB',[47],'25000','1000000','07/2026/NQ-ĐHĐCĐ 2026-04-24'),
 ('SSI',[66,67,83],'244818160367','1','01/2026/NQ-ĐHĐCĐ 2026-04-23'),
]:
 notes=json.loads(Path('data/manual-extracted-pdf/notes/'+ticker+'.json').read_text())
 doc=next(d for d in notes['documents'] if any(('6T_2026' in p and 'Hopnhat' in p) or 'soat_xet_ban_nien_2026' in p for p in d['pdfPaths']))
 path=doc['pdfPaths'][0];sha=hashlib.sha256(Path(path).read_bytes()).hexdigest();assert sha==doc['sourceHash']
 value=format(Decimal(amount)*Decimal(mult),'f');derived=format(Decimal(common[ticker]['reportedCommonProfitVnd'])-Decimal(value),'f')
 rows.append(dict(id='FY2025-later-parent-fund-'+ticker,ticker=ticker,earningsPeriod='FY2025',evidencePeriod='H1_2026',sourceScope='CONSOLIDATED',component='PARENT_NON_SHAREHOLDER_FUND_ALLOCATION',nativeAmount=amount,currencyMultiplier=mult,amountVnd=value,resolution=resolution,
  basis='Explicit FY2025 distribution footnote plus movement in parent retained earnings; not inferred from fund closing balance or a percentage of consolidated NPAT',
  source=dict(pdfPath=path,sha256=sha,pages=pages,hrefs=[path+'#page='+str(p) for p in pages]),
  review=dict(actor='CHATGPT',mode='OWNER_AUTHORIZED_AI_SELF_REVIEW',fullPageImagesInspected=True,reviewedAt=datetime.datetime.now(datetime.timezone.utc).isoformat()),
  originalCommonProfitVnd=common[ticker]['reportedCommonProfitVnd'],lessConfirmedParentFundOnlyVnd=derived,
  qualification='PARTIAL_ANALYST_DERIVED_COMMON_EARNINGS_BRIDGE',issuerPublishedRestatedFY2025Eps=False,comprehensiveGroupFundCoverageProven=False,normalizedCommonProfitVnd=None,currentShareDenominatorQualified=False,
  caveats=['Original FY2025 source remains unchanged','This identifies a confirmed parent allocation; subsidiary and other non-shareholder leakage coverage remains a separate review','Not sustainable earnings, FCFE, or a completed valuation'],productionScoringAuthorized=False))
(ROOT/'later-fund-bridges.json').write_text(json.dumps(dict(contract='b6-later-parent-fund-bridge-v1',rows=rows),ensure_ascii=False,indent=2)+'\n')
print(json.dumps([dict(ticker=r['ticker'],confirmedFundVnd=r['amountVnd'],partialCommonVnd=r['lessConfirmedParentFundOnlyVnd']) for r in rows]))
