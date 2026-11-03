"""VIC/VinFast native VAS research bridges. No accounting or authority mutations."""
from datetime import date
from decimal import ROUND_HALF_UP, localcontext
from lib.vic_claim_bridge import number, text


def reconcile_pair(total, first, second):
    a,b,c=map(number,(total,first,second))
    if min(a,b,c)<0 or a!=b+c:raise ValueError('EXACT_NONNEGATIVE_CLAIM_IDENTITY_REQUIRED')
    return text(a)


def license_claims(v):
    reconcile_pair(v['licensePayable'],v['offset'],v['licenseCashPayment'])
    reconcile_pair(v['demergerReceivable'],v['offset'],v['demergerCashReceipt'])
    return dict(netCashReceiptMillionVnd=text(number(v['demergerCashReceipt'])-number(v['licenseCashPayment'])),
      offsetIsCash=False,licenseIsFullCurrentPnlExpense=False,receivableIsDisposalGain=False,
      fullFeeDeductionPermitted=False,closingPayableInferredZero=False)


def donor_bridge(sponsor, donor, other, group):
    reconcile_pair(sponsor,donor,other)
    return dict(jscCaptionLessChairmanMillionVnd=text(number(sponsor)-number(donor)),
      groupCaptionLessJscMillionVnd=text(number(group)-number(sponsor)),
      groupCaptionLessChairmanMillionVnd=text(number(group)-number(donor)),
      residualRecipientProven=False,otherRelatedPartyAutomaticallyEliminated=False,
      groupCaptionIsExactlyJscIncome=False)


def tax_gap(pbt, npat, raw_current):
    if raw_current!='DASH':raise ValueError('EXACT_RAW_TAX_CELL_REQUIRED')
    return dict(reportedPbtMinusNpatMillionVnd=text(number(pbt)-number(npat)),
      rawCurrentTaxCell=raw_current,currentTaxNumeric=None,
      eventCurrentTaxVnd=None,eventDeferredTaxVnd=None,
      donationTaxExemptionProven=False,marginalTaxCreditProven=False)


def closing_common(v):
    issued,preferred,common,held=map(number,(v['allIssued'],v['preferred'],v['commonIssued'],v['commonHeldBySubsidiaries']))
    if any(n!=n.to_integral_value() for n in (issued,preferred,common,held)) or min(issued,preferred,common,held)<0:
        raise ValueError('NONNEGATIVE_INTEGER_SHARES_REQUIRED')
    if issued!=preferred+common or held>common:raise ValueError('EXACT_COMMON_PREFERRED_TREASURY_IDENTITY_REQUIRED')
    return text(common-held)


def require_price_date(snapshot_date,price_date):
    for value in (snapshot_date,price_date):
        if not isinstance(value,str) or date.fromisoformat(value).isoformat()!=value:raise ValueError('ISO_DATE_REQUIRED')
    if snapshot_date!=price_date:raise ValueError('DATED_CAPITAL_EVENT_BRIDGE_REQUIRED')
    return True


def replay_eps(v):
    parent,restricted,basic,diluted=map(number,(v['parentNpatMillion'],v['restrictedIncomeMillion'],v['basicNumeratorMillion'],v['dilutedNumeratorMillion']))
    b,increment,d=map(number,(v['basicWeightedShares'],v['incrementalDilutionShares'],v['dilutedWeightedShares']))
    if parent-restricted!=basic or b+increment!=d or min(b,d)<=0:
        raise ValueError('EPS_SOURCE_IDENTITY_REQUIRED')
    with localcontext() as ctx:
        ctx.prec=60
        eps=(basic*1000000/b).quantize(number('1'),rounding=ROUND_HALF_UP)
        deps=(diluted*1000000/d).quantize(number('1'),rounding=ROUND_HALF_UP)
    if eps!=number(v['printedBasicEpsVnd']) or deps!=number(v['printedDilutedEpsVnd']):
        raise ValueError('PRINTED_REPORTED_EPS_REPLAY_REQUIRED')
    return dict(replayedBasicEpsVnd=text(eps),replayedDilutedEpsVnd=text(deps),
      normalizedEpsAccepted=False,weightedSharesAreClosingShares=False,
      historicalDilutionAutomaticallyValidForNormalizedLoss=False)


def segment_bridge(v):
    keys=('propertyPbt','hotelPbt','healthPbt','educationPbt','manufacturingPbt','otherPbt','eliminationPbt')
    total=sum(number(v[k]) for k in keys)
    if total!=number(v['segmentPbt']) or total+number(v['unallocatedIncome'])!=number(v['groupPbt']):
        raise ValueError('SEGMENT_CENTRAL_CONSOLIDATION_IDENTITY_REQUIRED')
    return dict(segmentPbtMillionVnd=text(total),groupPbtMillionVnd=v['groupPbt'],
      jscLossAdditionalDeductionPermitted=False,segmentPbtIsParentNpat=False,
      capexMaintenanceSplitProven=False,segmentNetAssetsAreRnav=False)
