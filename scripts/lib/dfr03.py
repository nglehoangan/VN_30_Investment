"""Partial research judgments with exact topic/dependency and phase boundaries."""
from lib.r4_rubric_completion import validate_partial_assessment

CLASSES=('READY_FOR_ASSESSMENT','DATA_MISSING','ANALYST_REVIEW_PENDING','MATERIAL_CONFLICT','NOT_APPLICABLE')

def eligibility(topic_evidence, material_conflicts=(), applicable=True, na_authorized=False):
    if not applicable:
        if not na_authorized:raise ValueError('METHODOLOGY_NA_NOT_AUTHORIZED')
        return 'NOT_APPLICABLE'
    if material_conflicts:return 'MATERIAL_CONFLICT'
    if any(x=='DATA_MISSING' for x in topic_evidence):return 'DATA_MISSING'
    if all(x=='SUFFICIENT' for x in topic_evidence) and topic_evidence:return 'READY_FOR_ASSESSMENT'
    return 'ANALYST_REVIEW_PENDING'

def validate_review(a,rule,resolve):
    validate_partial_assessment(a,rule)
    if not a.get('assumptions') or not a.get('invalidationConditions') or a.get('confidence') not in ('LOW','MEDIUM','HIGH'):raise ValueError('ASSUMPTIONS_CONFIDENCE_INVALIDATION_REQUIRED')
    for e in a['evidence']:
        for ref in e['refs']:
            proof=resolve(ref)
            if proof['status'] not in ('SUPPORTED','QUALIFIED_CONTEXT'):raise ValueError('UNSUPPORTED_TOPIC_EVIDENCE:'+ref)
    for e in a['counterevidence']:
        if not e['rationale'] or not e['refs']:raise ValueError('SUBSTANTIVE_COUNTEREVIDENCE_REQUIRED')
        for ref in e['refs']:
            if resolve(ref)['status'] not in ('SUPPORTED','QUALIFIED_CONTEXT'):raise ValueError('UNSUPPORTED_COUNTEREVIDENCE')
    if a['selectedPoints']==0 and not a.get('economicAdversityBasis'):raise ValueError('ZERO_CANNOT_STAND_FOR_MISSING')
    return True

def propagate(assessments,changed):
    result={}
    for a in assessments:
        deps={r for e in a['evidence']+a.get('counterevidence',[]) for r in e['refs']}
        blocked=deps.intersection(changed)
        result[a['id']]=dict(status='MATERIAL_CONFLICT' if blocked else 'SUPPORTED',points=None if blocked else a['selectedPoints'],blockedRefs=sorted(blocked))
    return result

def propagate_from_metrics(assessments,dossiers,source_changes):
    from lib.dfr02 import Graph
    known={n['id'] for d in dossiers.values() for n in d['metrics']}
    if not set(source_changes).issubset(known):raise ValueError('UNKNOWN_CHANGED_METRIC')
    changed=set();states={}
    for ticker,d in dossiers.items():
        g=Graph(ticker)
        for n in d['metrics']:g.add(n)
        part=g.recalculate_dispositions(source_changes);states.update(part)
        for n in d['metrics']:
            if part[n['id']]!=n['status'] and part[n['id']]=='CONFLICT':changed.add('METRIC:'+n['id'])
    return dict(metricStates=states,assessmentStates=propagate(assessments,changed))
