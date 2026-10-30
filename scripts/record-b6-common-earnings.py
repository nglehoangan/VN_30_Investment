"""Literal FY2025 EPS-note readings from30 full source pages inspected by ChatGPT.
This is accounting common earnings, not an assertion of sustainable economic earnings.
"""
import json,hashlib,datetime
from decimal import Decimal
from pathlib import Path
R=Path('docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-30/b6-economics-r3');R.mkdir(exist_ok=True)
S=Path('docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-30/b6-comparability-r2')
sources=json.loads((S/'native-review-sources.json').read_text())
# page, native currency multiplier, pre-deduction profit, signed explicit deductions,
# printed common profit, weighted shares in exact shares unless noted, printed EPS, fund qualification.
ROWS={
 'ACB':(72,'1000000','15624699',['-100000'],'15524699','5136656599','3022','REPORTED_DEDUCTED'),
 'BID':(58,'1000000','29904264',['-3446462'],'26457802','7010000000','3774','REPORTED_DEDUCTED'),
 'BSR':(41,'1','5213612063223',['-4061012360'],'5230686242758','5007299686','1040','ISSUER_UNESTIMATED'),
 'CTG':(61,'1000000','34604481',None,'34604481','7766944637','4455','ISSUER_UNESTIMATED'),
 'FPT':(55,'1','9376127629501',['-510167707669'],'8865959921832','1699740091','5216','REPORTED_DEDUCTED'),
 'GAS':(59,'1','11414339911686',['-201887859493'],'11212452052193','2412949756','4647','ISSUER_ESTIMATED_DEDUCTION'),
 'GVR':(90,'1','5318551565051',['-317726455843'],'5000825109208','4000000000','1250','TABLE_DEDUCTION_WITH_UNESTIMATED_FOOTNOTE'),
 'HDB':(52,'1000000','16524388',None,'16524388','4609989735','3584','ISSUER_UNESTIMATED'),
 'HPG':(50,'1','15453174006223',['-309063480124'],'15144110526099','7675465855','1973','ISSUER_ESTIMATED_DEDUCTION'),
 'LPB':(53,'1000000','11422379',None,'11422379','2987282300','3824','ISSUER_UNESTIMATED'),
 'MBB':(77,'1000000','26778939',None,'26778939','8054999909','3325','ISSUER_UNESTIMATED'),
 'MCH':(61,'1',None,None,'6667152294616','1199754933','5557','EXPLICIT_COMMON_AFTER_FUNDS'),
 'MSN':(81,'1000000',None,None,'4108306','1516140129','2710','EXPLICIT_COMMON'),
 'MWG':(42,'1',None,None,'7033730770169','1473278779','4774','EXPLICIT_COMMON'),
 'SAB':(70,'1','4423539822535',['-131028135557'],'4292511686978','1282562372','3347','ISSUER_ESTIMATED_DEDUCTION'),
 'SHB':(52,'1000000','11960295',None,'11960295','4593703838','2604','EXPLICIT_COMMON_NO_ZERO_INFERENCE'),
 'SSB':(52,'1000000','5509539',['-165286'],'5344253','2843246575','1880','ISSUER_ESTIMATED_DEDUCTION'),
 'SSI':(85,'1',None,None,'4106090416749','2000373695','2053','ISSUER_UNESTIMATED'),
 'STB':(78,'1000000','5939111',None,'5939111','1885215716','3150','ISSUER_UNESTIMATED'),
 'TCB':(77,'1000000','25290230',['-35379'],'25254851','7069481069','3572','REPORTED_DEDUCTED'),
 'TCX':(62,'1','5683331855108',None,'5683331855108','2094560777','2713','EXPLICIT_COMMON_NO_ZERO_INFERENCE'),
 'VCB':(63,'1000000','35177663',['-2975811'],'32201852','8355675094','3854','ISSUER_ESTIMATED_DEDUCTION'),
 'VHM':(98,'1000000',None,None,'41895255','4107412004','10200','EXPLICIT_COMMON'),
 'VIB':(53,'1000000','7285430',None,'7285430','3404005710','2140','EXPLICIT_COMMON_NO_ZERO_INFERENCE'),
 'VIC':(100,'1000000','11349934',['-664743'],'10685191','7461263509','1432','REINVESTMENT_RESTRICTION_DEDUCTED'),
 'VJC':(66,'1','2122533969007',None,'2122533969007','569419553','3728','EXPLICIT_COMMON_NO_ZERO_INFERENCE'),
 'VNM':(60,'1','9410201646692',['-992817578863'],'8417384067829','2089955445',None,'REPORTED_DEDUCTED'),
 'VPB':(67,'1000000',None,None,'23989930','7933923601','3024','EXPLICIT_COMMON'),
 'VPL':(48,'1000000','1101566',None,'1101566','1781619015','618','PARENT_EPS_NUMERATOR_EXPLICIT'),
 'VRE':(45,'1000000','6445924',None,'6445924','2272000000','2837','EXPLICIT_COMMON_NO_ZERO_INFERENCE'),
}
results=[];at=datetime.datetime.now(datetime.timezone.utc).isoformat()
for ticker,(page,mult,profit,adjustments,common,weighted,eps,fund) in ROWS.items():
 obs=next(o for o in sources['observations'] if o['ticker']==ticker and o['itemId']=='NET_INCOME' and o['periodEnd']=='2025-12-31');ctx=next(c for c in sources['contexts'] if c['observationId']==obs['id']);path=ctx['sourcePath'];digest=hashlib.sha256(Path(path).read_bytes()).hexdigest();assert digest==ctx['sourceHash']
 computed=str(Decimal(profit)+sum(map(Decimal,adjustments))) if profit is not None and adjustments is not None else None
 discrepancy=None if computed is None else format((Decimal(common)-Decimal(computed))*Decimal(mult),'f')
 common_vnd=format(Decimal(common)*Decimal(mult),'f')
 row=dict(id='common-earnings-FY2025-'+ticker,ticker=ticker,sector=obs['sector'],period=dict(start='2025-01-01',end='2025-12-31'),sourceScope='STANDALONE' if ticker in ['LPB','TCX'] else 'CONSOLIDATED',currency='VND',declaredCurrencyUnit='MILLION_CURRENCY' if mult=='1000000' else 'CURRENCY',currencyMultiplier=mult,sourcePreDeductionProfit=profit,signedExplicitDeductions=adjustments,reportedCommonProfit=common,reportedCommonProfitVnd=common_vnd,computedCommonProfitInSourceUnits=computed,reconciliationDifferenceVnd=discrepancy,weightedAverageShares=weighted,weightedSharePrecision='ROUNDED_MILLION' if ticker in ['BID','VRE'] else 'INTEGER_AS_REPORTED',weightedSharesAreCurrentOutstanding=False,reportedBasicEps=eps,epsUnit='VND_PER_SHARE',fundStatus=fund,exhaustiveOneOffReviewComplete=False,economicallyNormalizedCommonEarnings=None,
  source=dict(pdfPath=path,sha256=digest,page=page,href=path+'#page='+str(page),caption='FY2025 current EPS-note common-owner numerator; separate from consolidated total NPAT, EPS denominator is weighted average'),review=dict(actor='CHATGPT',mode='OWNER_AUTHORIZED_AI_SELF_REVIEW',reviewedAt=at,fullPageImageInspected=True),qualification='BLOCKED_SOURCE_ARITHMETIC_DISCREPANCY' if discrepancy not in [None,'0'] else 'REPORTED_COMMON_EARNINGS_REVIEWED_NOT_ECONOMICALLY_NORMALIZED',productionAdmissible=False)
 if ticker=='VNM':row['reportedBasicEps']=None;row['epsPresence']='NOT_PRINTED_ON_THIS_NOTE_PAGE_NO_INFERENCE'
 if ticker=='VIC':row['dilutedWeightedShares']='7517418636';row['dilutedEarningsNumeratorSourceUnits']='10685191';row['reportedDilutedEps']='1421';row['futureExchangeableBondsExcludedAsAntidilutive']=True
 if ticker=='HDB':row['dilutedWeightedShares']='4819248022';row['dilutedEarningsNumeratorSourceUnits']='16680728';row['reportedDilutedEps']='3461';row['additionalEvidencePages']=[53]
 if ticker=='SAB':row['additionalEvidencePages']=[71]
 if ticker=='SHB':row['additionalEvidencePages']=[53]
 if ticker in ['LPB','TCX']:row['scopeWarning']='Source is issuer standalone, do not join automatically to earlier CONSOLIDATED-labelled candidate facts.'
 if ticker=='GVR':row['sourceFootnoteConflict']='Table deducts317726455843 but footnote says funds not estimated; preserve both pending reconciliation.'
 results.append(row)
(R/'checked-common-earnings.json').write_text(json.dumps(dict(contract='checked-common-earnings-review-v1',period='FY2025',facts=results,interpretation='No amount-equality mapping, no dash-to-zero, no annualizing H1; reported common EPS numerators are not normalized owner earnings.'),ensure_ascii=False,indent=2)+'\n')
print(json.dumps(dict(tickers=len(results),explicitDeductionReconciliations=sum(r['computedCommonProfitInSourceUnits'] is not None for r in results),sourceArithmeticConflicts=[r['ticker'] for r in results if r['qualification'].startswith('BLOCKED')],unestimatedFunds=[r['ticker'] for r in results if r['fundStatus']=='ISSUER_UNESTIMATED'])))

# Independent statement-caption cross-check; keep the conflicting EPS subtotal unchanged.
f=next(f for f in results if f['ticker']=='BSR')
p=Decimal('5213612063223');fund=Decimal('4061012360');weighted=Decimal('5007299686');derived=p-fund
x=dict(contract='b6-bsr-source-arithmetic-investigation-v1',ticker='BSR',period='FY2025',source=f['source'],physicalPagesInspected=[11,41],reviewedAt=at,actor='CHATGPT',sourceReadings=dict(parentProfitIncomeStatementVnd=str(p),parentProfitEpsNoteVnd=f['sourcePreDeductionProfit'],printedFundDeductionVnd=str(fund),printedCommonNumeratorVnd=f['reportedCommonProfitVnd'],printedWeightedShares=str(weighted),printedEpsVnd='1040'),analystCrossCheck=dict(formula='parent-profit-minus-printed-fund-deduction',derivedNumeratorVnd=str(derived),printedMinusDerivedVnd=str(Decimal(f['reportedCommonProfitVnd'])-derived),computedWeightedEps=format(derived/weighted,'.12f'),wholeVndEpsRoundingCompatible=abs(derived/weighted-Decimal('1040'))<Decimal('0.5')),conclusion='Parent profit agrees between statement and EPS note. The printed common-numerator subtotal conflicts with its own operands; derived arithmetic is compatible with printed whole-VND EPS. This supports an arithmetic inconsistency inference, not an issuer-confirmed correction.',originalPdfValuesPreserved=True,issuerConfirmedCorrection=False,sourceConflictClosed=False,fundCompletenessConfirmed=False,normalizedCommonEarnings=None,productionScoringAuthorized=False)
(R/'bsr-source-reconciliation.json').write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
