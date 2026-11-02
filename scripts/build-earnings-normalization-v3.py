#!/usr/bin/env python3
"""Issuer-specific normalization research, with explicit unresolved incidence and admission."""
import json,hashlib
from decimal import Decimal,getcontext
from pathlib import Path
from lib.held_normalization import number,text
from lib.earnings_normalization import tax_profile,allocation_proxy,incidence_envelope,total_credit_proxy,deduct_funds,adjusted_earnings,bsr_resolution,earnings_envelope
getcontext().prec=50
ROOT=Path(__file__).resolve().parents[1]
OLD=ROOT/'docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-30'
BASE=ROOT/'docs/fundamental-data-engine/scoring-dataset-acceptance/2026-11-02'
OUT=BASE/'earnings-normalization-v3'
NEW=['BID','BSR','CTG','GVR','HDB','LPB','MCH','MSN','SAB','SHB','SSB','STB','TCX','VIB','VIC','VJC','VPB']
PRIOR=['ACB','FPT','GAS','HPG','MBB','MWG','SSI','TCB','VCB','VHM','VNM','VPL','VRE']
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def write(name,value):
 p=OUT/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
def build():
 pins={}
 def read(p):pins[str(p.relative_to(ROOT))]=sha(p);return json.loads(p.read_text())
 def pin(p,h):
  if sha(ROOT/p)!=h:raise ValueError('SOURCE_BYTES_MISMATCH:'+p)
  pins[p]=h
 facts={x['ticker']:x for x in read(OLD/'b6-economics-r3/checked-common-earnings.json')['facts']}
 contexts={x['observationId']:x for x in read(OLD/'b6-comparability-r2/native-review-sources.json')['contexts']}
 risk={x['ticker']:x for x in read(OLD/'b6-underwriting-r4/checked-bank-risk-expense.json')['rows']}
 for fact in facts.values():pin(fact['source']['pdfPath'],fact['source']['sha256'])
 for row in risk.values():
  if row['sourceScope']!=facts[row['ticker']]['sourceScope']:raise ValueError('BANK_RISK_REPORTING_SCOPE_MISMATCH')
  for src in row['sourceEvidence']:pin(src['pdfPath'],src['sha256'])
 cfg=read(BASE/'held-normalization-v1/checked-inputs.json')
 readings=read(OUT/'checked-readings.json')['readings'];seen=set()
 for r in readings:
  if r['id'] in seen:raise ValueError('DUPLICATE_READING_ID')
  seen.add(r['id']);f=facts[r['ticker']]
  expected_period='FY2024' if r['key'].endswith('2024') else 'FY2025'
  expected_column='FY2024_COMPARATIVE_IN_FY2025_REPORT' if expected_period=='FY2024' else 'FY2025_CURRENT'
  if r['id']!=r['ticker']+'-FY2025-'+r['key'] or r['documentPeriod']!='FY2025' or r['period']!=expected_period or r['columnBinding']!=expected_column:raise ValueError('EXACT_READING_PERIOD_COLUMN_OR_ID_REQUIRED')
  if r['pdfPath']!=f['source']['pdfPath'] or r['pdfSha256']!=f['source']['sha256'] or r['scope']!=f['sourceScope']:
   raise ValueError('READING_ISSUER_PERIOD_SCOPE_OR_SOURCE_MISMATCH:'+r['id'])
  if r['unit'] not in ['VND','MILLION_VND','PERCENT'] or r['multiplier']!=('1000000' if r['unit']=='MILLION_VND' else '0.01' if r['unit']=='PERCENT' else '1'):raise ValueError('LOSSLESS_DECLARED_UNIT_REQUIRED')
  if r['fullPageImageInspected'] is not True or type(r['physicalPage']) is not int or r['physicalPage']<1:raise ValueError('CHECKED_PAGE_REQUIRED')
  is_rate=r['key'] in ['reportedForeignRateSingapore','reportedForeignRateIreland']
  if is_rate!=(r['unit']=='PERCENT') or (not is_rate and r['multiplier']!=f['currencyMultiplier']):raise ValueError('READING_CONCEPT_UNIT_MISMATCH')
  number(r['lexicalValue']);pin(r['pdfPath'],r['pdfSha256'])
 for r in cfg['readings']:pin(r['sourcePdf'],r['sourceHash'])
 funds=read(BASE/'vn30-underwriting-v2/fund-bridge-successor.json')['issuers']
 for fund in funds.values():
  for src in fund['sources']:pin(src['pdfPath'],src['sha256'])
  parent_plan=fund.get('parentCompanyAGMRewardWelfareAllocation')
  if parent_plan:pin(parent_plan['source']['pdfPath'],parent_plan['source']['sha256'])
 closure={'BSR':bsr_resolution('5213612063223','4061012360','374103026199','376701162230','2598136032'),
  'GVR':dict(selectedPublishedSubsidiaryFundVnd='606620346513',supersedesInterimCommonFundVnd='317726455843',
    parentFinalPlanNominalVnd='30130000000',parentPlanDisplayResolutionVnd='10000000',parentFinalExactVnd=None,
    nominalCommonNumeratorVnd='4681801218538',allocationIncludesNci=False,
    q3PriorPeriodMovementVnd='445479943882',q3MovementIsExclusivelyFY2025=False,
    selection='PUBLISHED_FY2025_SUBSIDIARY_ALLOCATION_PLUS_SEPARATE_ROUNDED_PARENT_AGM_PLAN',financialAccepted=False)}
 closure['BSR'].update(analysisDisposition='ARITHMETIC_AND_SOURCE_BRANCH_SELECTION_CLOSED',issuerCorrectionEvidence=None,fullFinalFundAdmission=False)
 closure['GVR'].update(analysisDisposition='INTERIM_FINAL_NCI_MAPPING_CLOSED',fullFinalFundCompletenessProven=False,bookMovementReconciliation='OPEN_NOT_BALANCED_BY_INVENTED_ENTRY')
 write('BSR-GVR-disposition.json',dict(contract='fund-conflict-disposition-v3',issuers=closure,predecessorSha256=sha(BASE/'vn30-underwriting-v2/fund-bridge-successor.json'),productionAdmissible=False))
 profiles=[];summaries=[]
 for t in sorted(NEW+PRIOR):
  f=facts[t];native=read(OLD/f'b6-comparability-r2/native-inputs/{t}.json');old=read(OLD/f'b6-underwriting-r4/issuers/{t}.json')
  local={r['key']:r for r in readings if r['ticker']==t}
  def rv(k):
   r=local[k];return number(r['lexicalValue'])*number(r['multiplier'])
  def obs(item,year,required=True):
   scope_aliases=['STANDALONE','SEPARATE_STANDALONE'] if f['sourceScope']=='STANDALONE' else ['CONSOLIDATED']
   xs=[o for o in native['observations'] if o['itemId']==item and o['periodEnd']==f'{year}-12-31' and o['reportingScope'] in scope_aliases]
   if year==2025:
    exact=[o for o in xs if contexts[o['id']]['sourceHash']==f['source']['sha256']]
    xs=exact
   if len(xs)!=1:
    if required:raise ValueError('UNIQUE_OBSERVATION_REQUIRED:'+t+'/'+item+'/'+str(year))
    return None
   o=xs[0];c=contexts[o['id']];pin(c['sourcePath'],c['sourceHash']);return o
  def ov(item,year):return number(obs(item,year)['normalized']['value'])
  group=rv('groupNetIncome') if 'groupNetIncome' in local else ov('NET_INCOME',2025)
  pbt=rv('pbt') if 'pbt' in local else number(risk[t]['preTaxProfitFY2025'])*number(risk[t]['currencyMultiplier']) if t in risk else None
  if pbt is None:
   if 'taxExpense' in local:tax=rv('taxExpense')
   elif 'taxCurrent' in local and 'taxDeferred' in local:tax=rv('taxCurrent')+rv('taxDeferred')
   else:raise ValueError('TAX_OR_PBT_READING_REQUIRED:'+t)
   pbt=group+tax
  tax=tax_profile(pbt,group)
  if 'pbt' in local and 'taxCurrent' in local and 'taxDeferred' in local:
   if pbt-group!=rv('taxCurrent')+rv('taxDeferred'):raise ValueError('CHECKED_TAX_IDENTITY_MISMATCH:'+t)
  parent_obs=obs('NET_INCOME_ATTRIBUTABLE_PARENT',2025,False)
  parent=rv('parentNetIncome') if 'parentNetIncome' in local else number(f['sourcePreDeductionProfit'])*number(f['currencyMultiplier']) if f['sourcePreDeductionProfit'] is not None else number(parent_obs['normalized']['value']) if parent_obs else number(f['reportedCommonProfitVnd'])
  proxy=allocation_proxy(parent,group)
  original=number(f['reportedCommonProfitVnd']);common=original;components=[]
  if t=='BSR':common=number(closure[t]['selectedCommonNumeratorVnd'])
  elif t=='GVR':common=number(closure[t]['nominalCommonNumeratorVnd'])
  later=old['normalization'].get('laterFundBridge')
  if later and t not in ['BSR','GVR']:
   pin(later['source']['pdfPath'],later['source']['sha256'])
   components=[dict(id=later['id'],period='FY2025',classification='PARENT_NON_SHAREHOLDER_LEAKAGE',alreadyDeducted=False,value=later['amountVnd'])]
   common=deduct_funds(common,components)
  tax_rates=['0','.2'] if t!='VJC' else ['0',format(rv('reportedForeignRateSingapore'),'f'),'.2',format(rv('reportedForeignRateIreland'),'f')]
  weights=['1'] if f['sourceScope']=='STANDALONE' else ['0','1'];adjustments=[];credit=None
  def adjust(key,amount,refs,why,proven=None):
   a=dict(id=t+'-'+key,pretaxVnd=text(amount),readingIds=refs,reason=why)
   if proven is not None:a['provenCommonWeight']=proven
   a['incidenceEnvelope']=incidence_envelope(a['pretaxVnd'],tax_rates,[proven] if proven is not None else weights)
   adjustments.append(a)
  if t in NEW and f['sector']=='BANK':
   r=risk[t];mult=number(r['currencyMultiplier'])
   for src in r['sourceEvidence']:pin(src['pdfPath'],src['sha256'])
   rows=[dict(year=y,openingAssets=text(ov('TOTAL_ASSETS',y-1)),closingAssets=text(ov('TOTAL_ASSETS',y)),totalCreditExpense=text(number(r['riskExpenseByYear'][str(y)])*mult)) for y in [2023,2024,2025]]
   target=(ov('TOTAL_ASSETS',2024)+ov('TOTAL_ASSETS',2025))/2
   rate,normalized=total_credit_proxy(rows,text(target),'1')
   credit=dict(method='TOTAL_P_AND_L_CREDIT_EXPENSE_PER_AVERAGE_TOTAL_ASSETS_PROXY',history=rows,weightedHistoricalRate=text(rate),targetAverageAssetsVnd=text(target),baseChargeVnd=text(normalized),loanOnlyClaimed=False,fullCycleQualified=False,
     populationAndVintage='Original dated annual observations retained; three years and changing asset mix do not prove a full-cycle/PIT matched loan population.')
   adjust('total-credit-proxy',number(r['riskExpenseByYear']['2025'])*mult-normalized,[], 'Replace total P&L credit charge, never label this loan-only provisioning.')
   rec=(rv('recoveries2024')+rv('recoveries2025'))/2
   adjust('recoveries-mean',rec-rv('recoveries2025'),[local[k]['id'] for k in ['recoveries2024','recoveries2025']], 'Two-year gross recovery mean sensitivity; reported collection expenses remain, not a full recovery cycle.')
   if 'investmentRiskReversal2025' in local:adjust('investment-reversal',-rv('investmentRiskReversal2025'),[local['investmentRiskReversal2025']['id']], 'Separate securities-income line reversal, outside total P&L credit-charge replacement; retain ordinary securities costs.')
   if 'disposalGain' in local and 'disposalCost' in local:
    adjust('category-net-disposal',-(rv('disposalGain')-rv('disposalCost')),[local[k]['id'] for k in ['disposalGain','disposalCost']], 'Category-net disposal sensitivity from matching reported income/cost captions, not proof of a single transaction or cash gain.')
   if t=='SSB':adjust('ptf-sale',-rv('subsidiaryDisposalGain'),[local['subsidiaryDisposalGain']['id']], 'Remove specific PTF disposal gain; contract closure does not imply reversal of the completed sale.',proven='1')
  elif t=='BSR':
   adjust('contract-compensation',-rv('contractCompensationIncome'),[local['contractCompensationIncome']['id']], 'Exclude contract compensation sensitivity; retain deposit income and operating FX in base.')
  elif t=='GVR':
   adjust('compensation-income-exclusion',-rv('compensationIncome'),[local['compensationIncome']['id']], 'Conservative compensation-income exclusion sensitivity, not a proven net transaction gain. Related expense remains because claim/cost matching is unproven; retain routine rubber-tree disposal and science fund P&L cost.')
  elif t=='MSN':
   adjust('disposal-gain',-rv('disposalGain'),[local['disposalGain']['id']], 'Remove specific disposal gain; retain writeoff losses in base; optional addback is separate.')
  elif t=='SAB':
   adjust('bargain-purchase',-rv('bargainPurchaseGain'),[local['bargainPurchaseGain']['id']], 'Remove acquisition-specific bargain gain; tax exemption and common attribution are not individually proven.')
   adjust('investment-reversal',-rv('longTermInvestmentProvisionReversal'),[local['longTermInvestmentProvisionReversal']['id']], 'Remove provision reversal; retain investment loss and normal deposit interest.')
  elif t=='TCX':
   paired=rv('assetRevaluationGain')-rv('assetRevaluationLoss')+rv('warrantRevaluationGain')-rv('warrantRevaluationLoss')
   adjust('paired-unrealized',-paired,[local[k]['id'] for k in ['assetRevaluationGain','assetRevaluationLoss','warrantRevaluationGain','warrantRevaluationLoss']], 'Remove paired net asset/warrant unrealized result once, not realized sales proceeds.',proven='1')
   adjust('realized-trading-cycle',(rv('realizedTradingNet2024')+rv('realizedTradingNet2025'))/2-rv('realizedTradingNet2025'),[local[k]['id'] for k in ['realizedTradingNet2024','realizedTradingNet2025']], 'Two-year realized net trading mean is a cycle proxy, not a full market cycle; retain margin funding/impairment.',proven='1')
  elif t=='VIC':
   adjust('nonrefundable-sponsor',-rv('nonrefundableSponsorIncome'),[local['nonrefundableSponsorIncome']['id']], 'Mainly subsidiary VinFast income; parent/group NPAT ratio exceeds one and cannot allocate this gain.')
  elif t=='VJC':
   adjust('aircraft-margin',-(rv('aircraftSaleRevenue')-rv('aircraftSaleCost')),[local[k]['id'] for k in ['aircraftSaleRevenue','aircraftSaleCost']], 'Core-airline branch removes paired aircraft sale margin, retains lease expenses/commitments; recurring fleet-finance alternative kept separately.')
   for k in ['supplierFinanceSupport','aircraftInvestmentProvisionReversal']:adjust(k,-rv(k),[local[k]['id']], 'Core-airline branch excludes this benefit; no automatic cash realization.')
  history=[]
  for y in [2022,2023,2024,2025]:
   rev=obs('REVENUE',y,False);ni=obs('NET_INCOME',y,False)
   margin=None if not rev or not ni or number(rev['normalized']['value'])<=0 else text(number(ni['normalized']['value'])/number(rev['normalized']['value']))
   history.append(dict(year=y,reportedGroupNetMargin=margin,revenueObservationId=rev['id'] if rev else None,profitObservationId=ni['id'] if ni else None))
  margins=[number(h['reportedGroupNetMargin']) for h in history if h['reportedGroupNetMargin'] is not None]
  cycle=dict(history=history,historyPurgedOfAllOneOffs=False,cycleQualified=False,automaticScalarApplied=False,
      reportedMarginMinimum=text(min(margins)) if margins else None,reportedMarginMaximum=text(max(margins)) if margins else None,
      reason='Historical reported margins are counterevidence, not an automatic sustainable common-earnings multiplier. Banks use explicit credit/recovery axes; mixed groups need segment cycle review.')
  profile=dict(contract='issuer-common-earnings-normalization-v3',ticker=t,sector=f['sector'],scope=f['sourceScope'],period='FY2025',classification='CONDITIONAL_RESEARCH_NOT_ADMITTED',
   originalReportedCommonVnd=text(original),reportedScopeNetIncomeVnd=text(group),parentNetIncomeVnd=text(parent),reportedScopePbtVnd=text(pbt),pbtBasis='CHECKED_PDF_READING' if 'pbt' in local else 'CHECKED_PNL_PBT' if t in risk else 'DERIVED_FROM_SCOPE_NI_AND_CHECKED_TAX',taxProfile=tax,
   parentToReportedScopeProfitRatio=None if group==0 else text(parent/group),commonAttributionProxy=None if proxy is None else format(proxy,'f'),proxyIsProvenOwnership=False,nciIncidence='NOT_APPLICABLE_STANDALONE' if f['sourceScope']=='STANDALONE' else 'UNPROVEN_TRANSACTION_ATTRIBUTION',
   sourceCommonBridgeVnd=text(common),sourceCommonBridgePrecision='NOMINAL_ROUNDED_PARENT_PLAN_NOT_EXACT' if t=='GVR' else 'SELECTED_BRANCH_WITH_ONE_VND_SOURCE_VARIANT' if t=='BSR' else 'DECLARED_SOURCE_UNITS',
   nativeNetIncomeVnd=obs('NET_INCOME',2025)['normalized']['value'],
   checkedVsNativeNetIncomeDifferenceVnd=text(group-ov('NET_INCOME',2025)),
   additionalSourceDifferences=[dict(readingId=local['printedIncomeStatementCommonNumerator']['id'],printedVnd=text(rv('printedIncomeStatementCommonNumerator')),retainedCommonVnd=text(original),differenceVnd=text(rv('printedIncomeStatementCommonNumerator')-original))] if 'printedIncomeStatementCommonNumerator' in local else [],
   additionalKnownFundDeductions=components,unprovenAdditionalFundLeakageVnd=None,
   sourceFundStatus=f['fundStatus'],sourcePrintedDeductionsPreservedInEvidence=True,fullFundCompletenessProven=False,
   knownFundAmountsArePostTaxAndNotTaxDiscounted=True,
   assumedMarginalTaxRates=tax_rates,commonIncidenceScenarios=weights,
   incidenceParametersAreConfirmedFacts=False,basePretaxAdjustments=adjustments,creditNormalization=credit,cycleReview=cycle,checkedReadingIds=[r['id'] for r in readings if r['ticker']==t],
   accountingConflictDisposition=closure.get(t),acceptedNormalizedCommonEarningsVnd=None,acceptedEps=None,productionScoringAuthorized=False,navAuthorized=False,tradingAuthorized=False)
  if t in NEW:
   scenarios=[]
   for name,charge_mult,rec_mult in [('BEAR','1.25','.75'),('BASE','1','1'),('BULL','.85','1.1')]:
    aa=[dict(a) for a in adjustments]
    if credit:
     target_charge=number(credit['baseChargeVnd'])*number(charge_mult)
     aa[0]['pretaxVnd']=text(number(risk[t]['riskExpenseByYear']['2025'])*number(risk[t]['currencyMultiplier'])-target_charge)
     mean=(rv('recoveries2024')+rv('recoveries2025'))/2
     recovery=mean*number(rec_mult)
     if name=='BEAR':recovery=min(recovery,rv('recoveries2025'))
     aa[1]['pretaxVnd']=text(recovery-rv('recoveries2025'))
    scenario_axes={}
    def add_axis(ident,delta,why,proven=None):
     a=dict(id=t+'-'+ident,pretaxVnd=text(delta),readingIds=[],reason=why)
     if proven is not None:a['provenCommonWeight']=proven
     aa.append(a)
    index=['BEAR','BASE','BULL'].index(name)
    if t=='BSR':
     margins=[rv('grossProfit2024')/rv('revenue2024'),rv('grossProfit2025')/rv('revenue2025')]
     target=[min(margins),sum(margins)/2,max(margins)][index]
     add_axis('reported-refining-margin-stress',rv('revenue2025')*target-rv('grossProfit2025'),'Two reported years of refining gross margin, not a purified/full-cycle forecast.')
     scenario_axes['assumedRefiningGrossMargin']=text(target)
    elif t=='GVR':
     values=[rv('rubberTreeDisposalIncome2024'),rv('rubberTreeDisposalIncome')]
     target=[min(values),sum(values)/2,max(values)][index]
     add_axis('routine-rubber-tree-income-cycle',target-rv('rubberTreeDisposalIncome'),'Routine plantation turnover retained; vary observed gross tree-disposal income while retaining costs, not a net cash claim.')
     scenario_axes['targetReportedTreeDisposalIncomeVnd']=text(target)
    elif t=='MCH':
     retained=['0','.5','1'][index]
     add_axis('related-party-interest-collection-stress',-rv('relatedPartyLoanInterest')*(1-number(retained)),'Explicit interest-realization stress, not proof of a bad loan or full related-party recoverability; funding costs retained.')
     scenario_axes['assumedRelatedInterestRealizationFraction']=retained
    elif t in ['MSN','VIC']:
     losses=[rv('assetDisposalWriteoffLoss'),rv('assetDisposalWriteoffLoss2024')]
     target=[max(losses),sum(losses)/2,min(losses)][index]
     add_axis('recurring-restructuring-cost-stress',rv('assetDisposalWriteoffLoss')-target,'Reported two-year writeoffs recur; replace with stated expense target, not a full exceptional-loss addback.')
     scenario_axes['targetReportedWriteoffExpenseVnd']=text(target)
    elif t=='SAB':
     retained=['0','.5','1'][index]
     # The base adjustment removed the reversal; add back only the explicit recurring fraction.
     next(a for a in aa if a['id']==t+'-investment-reversal')['pretaxVnd']=text(-rv('longTermInvestmentProvisionReversal')*(1-number(retained)))
     scenario_axes['assumedReversalRecurrenceFraction']=retained
    elif t=='TCX':
     realized=[rv('realizedTradingNet2024'),rv('realizedTradingNet2025')]
     target=[min(realized),sum(realized)/2,max(realized)][index]
     next(a for a in aa if a['id']==t+'-realized-trading-cycle')['pretaxVnd']=text(target-rv('realizedTradingNet2025'))
     scenario_axes['targetRealizedNetTradingVnd']=text(target)
    elif t=='VJC':
     retained=['0','.5','1'][index]
     next(a for a in aa if a['id']==t+'-aircraft-margin')['pretaxVnd']=text(-(rv('aircraftSaleRevenue')-rv('aircraftSaleCost'))*(1-number(retained)))
     scenario_axes['assumedAircraftSaleMarginRecurrenceFraction']=retained
    # Cartesian incidences are explicit sensitivity, never invented transaction tax/NCI facts.
    for a in aa:a['incidenceEnvelope']=incidence_envelope(a['pretaxVnd'],tax_rates,[a['provenCommonWeight']] if 'provenCommonWeight' in a else weights)
    envelope=earnings_envelope(text(common),aa,tax_rates,weights)
    proxy_case=None if proxy is None else text(adjusted_earnings(text(common),aa,tax='.2',common_weight=proxy))
    scenarios.append(dict(name=name,assumedCycleAxes=scenario_axes,adjustments=aa,commonEarningsIncidenceMinimumVnd=envelope['minimumVnd'],commonEarningsIncidenceMaximumVnd=envelope['maximumVnd'],
      unreviewedLeakageAndOneOffsBounded=False,independentIncidenceByAdjustment=True,
      diagnosticAt20PercentTaxAndProfitRatioVnd=proxy_case,diagnosticIsSelectedEstimate=False,loanOnlyNormalizationClaimed=False))
   profile['scenarios']=scenarios
   profile['economicTreatment']={'MCH':'Retain consumer operating costs, inventory provisions, and existing finance income; isolate related-party interest for recoverability review, no unsupported one-off found.',
     'VIC':'Maintain issuer EPS/distributability numerator; show restricted reinvestment claim separately, do not call it welfare leakage or freely distributable cash.',
     'VJC':'Core-airline branch plus aircraft-finance recurrence alternatives; not a single accepted earnings number.'}.get(t,'Source-specific bridge and explicit tax/common-incidence sensitivities; no financial admission.')
   if t=='VIC':profile['restrictedReinvestmentClaimVnd']=text(rv('reinvestmentRestrictedIncome'));profile['economicClaimBeforeRestrictionVnd']=text(parent)
   if t=='MSN':profile['optionalAssetWriteoffAddback']=incidence_envelope(text(rv('assetDisposalWriteoffLoss')),tax_rates,weights)
   if t=='MCH':profile['relatedPartyLoanInterestVnd']=text(rv('relatedPartyLoanInterest'));profile['relatedPartyInterestAutomaticallyRemoved']=False
   if t=='VJC':profile['aircraftMarginRecurrenceAlternatives']=[dict(retainedFraction=w,groupPretaxMarginRetainedVnd=text((rv('aircraftSaleRevenue')-rv('aircraftSaleCost'))*number(w))) for w in ['0','.5','1']]
  else:
   path=BASE/f'held-normalization-v1/issuers/{t}.json'
   prior=read(path) if path.exists() else old
   scenarios=prior.get('scenarios',prior.get('conditionalValuation',{}).get('scenarios',[]))
   challenges=[]
   for sc in scenarios:
    norm=sc.get('normalization',{});deltas=norm.get('adjustments',[])
    challenge=dict(name=sc['name'],retainedModelAssumptions=sc.get('assumptions'),oldNormalization=norm or None,
       oldCycleImpactVnd=text(number(norm['scenarioCommonProfit'])-(number(norm['afterAdjustments'])-number(norm['additionalUnestimatedFundAssumption']))) if 'scenarioCommonProfit' in norm else None,
       cycleScalarIsEmpiricallyQualified=False,
       pretaxAdjustmentIncidence=[dict(reason=a['reason'],pretaxVnd=a['pretaxVnd'],sourceReadingIds=a['sourceReadingIds'],
          sensitivity=incidence_envelope(a['pretaxVnd'],tax_rates,weights)) for a in deltas],
       confirmedAdditionalFundVnd=text(sum((number(c['value']) for c in components),Decimal(0))),
       fundHaircutCanReplaceKnownAllocation=False,
       oldCycleFactor=norm.get('cycleFactor'),oldCycleFactorQualified=False,
       reportedGroupTaxRateIsMarginal=False,profitRatioIsOwnership=False,accepted=False)
    if deltas:
     aa=[dict(id=str(i),pretaxVnd=a['pretaxVnd']) for i,a in enumerate(deltas)]
     envelope=earnings_envelope(text(common),aa,tax_rates,weights)
     challenge['beforeCycleAfterKnownFundIncidenceRangeVnd']=[envelope['minimumVnd'],envelope['maximumVnd']]
     challenge['diagnosticAtReportedScopeEffectiveTaxVnd']=text(adjusted_earnings(text(common),aa,tax=tax['reportedEffectiveRate'],common_weight=proxy)) if proxy is not None and tax['reportedEffectiveRate'] is not None and 0<=number(tax['reportedEffectiveRate'])<=1 else None
    challenges.append(challenge)
   profile['modelChallenges']=challenges
   profile['priorModelPath']=str(path.relative_to(ROOT)) if path.exists() else str((OLD/f'b6-underwriting-r4/issuers/{t}.json').relative_to(ROOT))
   profile['priorValueRequiresRequalification']=True
   if t=='VNM':
    inp=read(OLD/'b6-underwriting-r4/vnm-parent-owner-cash-input.json');profile['modelScope']='STANDALONE_PARENT';profile['consolidatedTaxProfileApplicableToParentModel']=False;profile['standaloneFundAccruedVnd']=inp['valuesByYear']['2025']['fundAccrued'];profile['parentScopeSourceInput']=inp
   if t=='VNM':
    profile['standaloneTaxFundChallenge']=[]
    for sc in scenarios:
     delta=-number(sc['pretaxDisposalGainRemoved'])+number(sc['otherFinanceCostAdjustment'])
     parent_npat=number(inp['valuesByYear']['2025']['npat']);actual_fund=number(inp['valuesByYear']['2025']['fundAccrued'])
     profile['standaloneTaxFundChallenge'].append(dict(name=sc['name'],pretaxAdjustmentVnd=text(delta),commonWeight='1',
       historicalFixedFundNormalizedEarningsByTax=[dict(assumedMarginalTax=ta,valueVnd=text(parent_npat+delta*(1-number(ta))-actual_fund)) for ta in tax_rates],
       historicalFundVnd=text(actual_fund),forwardFundRateAssumption='0.10',historicalFundReestimated=False,
       consolidatedGroupEtrApplied=False))
   if t=='ACB':
    profile['priorLoanEarningsBridge']=old['conditionalValuation']['earningsAdjustment'];profile['sourceFundDeductedOnce']=True
    delta=old['conditionalValuation']['loanNormalization']['pretaxProfitAdjustment']
    profile['loanTaxNciChallenge']=earnings_envelope(text(common),[dict(id='loan-credit-only',pretaxVnd=delta)],tax_rates,weights)
    profile['diagnosticAt20PercentAndProfitRatioVnd']=text(adjusted_earnings(text(common),[dict(id='loan-credit-only',pretaxVnd=delta)],tax='.2',common_weight=proxy)) if proxy is not None else None
  profiles.append(profile);write('issuers/'+t+'.json',profile)
  summaries.append(dict(ticker=t,reportingScope=f['sourceScope'],reportedEffectiveTax=tax['reportedEffectiveRate'],newModel=t in NEW,selectedSustainableEarningsVnd=None,commonAttributionProxy=profile['commonAttributionProxy'],knownAdditionalFundVnd=text(sum((number(c['value']) for c in components),Decimal(0))),sourceCommonBridgeVnd=text(common),sourceCommonBridgePrecision='NOMINAL_ROUNDED_PARENT_PLAN_NOT_EXACT' if t=='GVR' else 'SELECTED_BRANCH_WITH_ONE_VND_SOURCE_VARIANT' if t=='BSR' else 'DECLARED_SOURCE_UNITS',status='CONDITIONAL_RESEARCH_NOT_ADMITTED'))
 write('summary.json',dict(contract='vn30-earnings-summary-v3',analysisMode='AS_REVISED_CURRENT_RESEARCH_NOT_HISTORICAL_AS_KNOWN',newIssuerCount=17,challengedPriorModelCount=13,issuers=summaries,financialCriteriaOrWeightsChanged=False,acceptedNormalizationCount=0))
 table=['# Bảng rà soát17 mã — FY2025', '',
  'Đơn vị: tỷ VND, làm tròn trình bày. Đây là các nhánh nghiên cứu có điều kiện, không phải lợi nhuận bền vững đã chọn hoặc đã nghiệm thu. GVR dùng kế hoạch quỹ mẹ được báo cáo làm tròn. Các khoảng chỉ phản ánh incidence của điều chỉnh đã biết, không bao chặn quỹ/giao dịch còn thiếu.', '',
  '| Mã | Common báo cáo | Sau bridge quỹ | Chẩn đoán BASE: thuế20% + proxy lợi nhuận | Khoảng BASE theo các incidence giả định |',
  '|---|---:|---:|---:|---:|']
 def billion(value):return format(number(value)/number('1000000000'),',.3f')
 for p in profiles:
  if p['ticker'] not in NEW:continue
  b=next(s for s in p['scenarios'] if s['name']=='BASE')
  diagnostic='Không có: proxy không hợp lệ' if b['diagnosticAt20PercentTaxAndProfitRatioVnd'] is None else billion(b['diagnosticAt20PercentTaxAndProfitRatioVnd'])
  table.append('| '+p['ticker']+' | '+billion(p['originalReportedCommonVnd'])+' | '+billion(p['sourceCommonBridgeVnd'])+' | '+diagnostic+' | '+billion(b['commonEarningsIncidenceMinimumVnd'])+' … '+billion(b['commonEarningsIncidenceMaximumVnd'])+' |')
 table+=['','Chẩn đoán không phải estimate được chọn. Các giá trị VND không làm tròn, BEAR/BASE/BULL, thuế/phạm vi/NCI và nguồn từng điều chỉnh nằm trong issuers/<TICKER>.json. BSR giữ cả subtotal gốc và nhánh dẫn xuất; GVR giữ nhánh làm tròn; VIC không biến tỷ lệ lợi nhuận lớn hơn1 thành sở hữu. Không có EPS hiện tại/giá trị cổ phần/tín hiệu Buy–Sell được cấp quyền.']
 (OUT/'REVIEW_TABLE.md').write_text('\n'.join(table)+'\n')
 write('manifest.json',dict(contract='vn30-earnings-normalization-manifest-v3',sourcePins=pins,
   members=[dict(ticker=p['ticker'],path='issuers/'+p['ticker']+'.json',sha256=sha(OUT/'issuers'/f"{p['ticker']}.json")) for p in profiles],
   buildImplementationSha256=sha(Path(__file__)),mathImplementationSha256=sha(ROOT/'scripts/lib/earnings_normalization.py'),
   summarySha256=sha(OUT/'summary.json'),checkedReadingsSha256=sha(OUT/'checked-readings.json'),fundDispositionSha256=sha(OUT/'BSR-GVR-disposition.json'),productionScoringAuthorized=False,navAuthorized=False,tradingAuthorized=False))
 print(json.dumps(dict(newIssuers=17,priorModels=13,checkedReadings=len(readings),sourcePins=len(pins))))
if __name__=='__main__':build()
