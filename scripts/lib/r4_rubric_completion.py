"""Current-research assessments only; approved bands/topics are supplied unchanged.
This module does not construct FORMAL ScoreInput, authenticate sessions, or grant DI.
"""
from decimal import Decimal
import hashlib
import json


def decimal_string(value):
    if not isinstance(value,str):raise ValueError('LOSSLESS_DECIMAL_STRING_REQUIRED')
    n=Decimal(value)
    if not n.is_finite():raise ValueError('FINITE_VALUE_REQUIRED')
    return n


def canonical_hash(value):
    return hashlib.sha256(json.dumps(value,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()


def validate_partial_assessment(a,rubric):
    if a['subcategory']!=rubric['id']:raise ValueError('RUBRIC_ID_MISMATCH')
    bands=[b for b in rubric['bands'] if b['label']==a['assessment']]
    if len(bands)!=1 or type(a['selectedPoints']) is not int or not bands[0]['min']<=a['selectedPoints']<=bands[0]['max']:
        raise ValueError('APPROVED_BAND_REQUIRED')
    if a['source']!='AI' or a['analyst']!='CHATGPT':raise ValueError('AI_ORIGIN_REQUIRED')
    if set(t['topic'] for t in a['evidence'])!=set(rubric['topics']) or len(a['evidence'])!=len(rubric['topics']):raise ValueError('ALL_EXACT_TOPICS_REQUIRED')
    if any(not t['refs'] or not t['rationale'] for t in a['evidence']):raise ValueError('SUPPORTED_TOPIC_REQUIRED')
    if not a['rationale'] or not a['economicChannel'] or not a['disconfirmingEvidence']:raise ValueError('REASON_CHANNEL_AND_COUNTEREVIDENCE_REQUIRED')
    if a['selectedPoints']==rubric['max'] and not a['maximumPrerequisitesMet']:raise ValueError('MAXIMUM_PREREQUISITES_REQUIRED')
    return True


def eligibility_reason(ticker,findings):
    """Explicit economic tests, not an automatic stock rating or numerical width threshold."""
    if ticker=='BSR':
        return decimal_string(findings['operatingLowVnd'])<0<decimal_string(findings['operatingHighVnd']) and findings['grossMarginSourceOperandsVerified'] is True
    if ticker=='VIC':
        return decimal_string(findings['namedCommonLowVnd'])<0<decimal_string(findings['namedCommonHighVnd']) and findings['waterfallUnproven'] is True
    if ticker=='VJC':
        return decimal_string(findings['reportedCommonVnd'])>0>decimal_string(findings['coreCaseVnd']) and findings['adjustmentArithmeticMatches'] is True
    if ticker=='VPL':
        return decimal_string(findings['unallocatedProfitMillion'])<0 and abs(decimal_string(findings['unallocatedProfitMillion']))>abs(decimal_string(findings['groupPbtMillion'])) and findings['segmentBridgeMatches'] is True
    return False


def challenge_decision(ticker,findings,assessment,rubric):
    validate_partial_assessment(assessment,rubric)
    if rubric['id']!='RG-UNC' or assessment['selectedPoints']!=0:raise ValueError('REVIEWED_SCOPE_ONLY_NO_DEFAULT_SCORE')
    if not eligibility_reason(ticker,findings):raise ValueError('ECONOMIC_SUPPORT_INSUFFICIENT')
    return dict(decision='ACCEPT_CURRENT_RESEARCH_JUDGMENT_ONLY',productionReady=False,
        independentHumanReviewClaimed=False,missingFilesUsedAsZeroPenalty=False,
        hypotheticalGridWidthAloneUsedAsEvidence=False)
