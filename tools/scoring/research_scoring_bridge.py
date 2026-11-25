"""Reconcile validated research against an exact limited score readback."""

from tools.scoring.annual_reassessment import _rubrics
from tools.scoring.structural_nr import artifact, day, require


def reconcile(native, annual, diagnosis, annual_packet):
    """Consume the existing validators' results without writing scoring inputs."""
    require(diagnosis['evidencePurpose'] == annual_packet['purpose']
            and diagnosis['rubrics'] == annual_packet['rubrics'], 'BRIDGE_PURPOSE_OR_REGISTRY_MISMATCH')
    baseline = artifact(diagnosis['baseline'])
    inventory = native.get('inventory', {}).get('current_score_artifact', [])
    require(any(row['id'] == baseline['id'] and row['sha256'] == baseline['bodyHash'] for row in inventory),
            'EXACT_OFFICIAL_BASELINE_READBACK_REQUIRED')
    rubric_map = _rubrics(diagnosis['rubrics'])
    official = {row['id']: row['points'] for row in baseline['rated']}
    gaps = {row['rubricId']: row for row in diagnosis['rows']}
    require(not official.keys() & gaps.keys() and official.keys() | gaps.keys() == rubric_map.keys(),
            'BRIDGE_RUBRIC_INVENTORY_MISMATCH')

    rows = []
    for rubric_id in rubric_map:
        gap = gaps.get(rubric_id)
        assessment = annual['rubrics'][rubric_id]['assessment']
        reviewed = gap['disposition'] if gap and gap['status'] == 'RESOLVED' else None
        candidate = (assessment if assessment and assessment['state'] != 'N/R' else None) if gap else None
        if reviewed and candidate:
            require((reviewed['points'], reviewed['state']) == (candidate['points'], candidate['state']),
                    'CONFLICTING_RESEARCH_DISPOSITIONS')
        if reviewed:
            require(all(day(fact['publicationDate']) <= diagnosis['cutoff'] for fact in reviewed['scoreEvidence']),
                    'BRIDGE_RESEARCH_PUBLISHED_AFTER_CUTOFF')
        proposed = candidate or reviewed
        rows.append({
            'rubricId': rubric_id,
            'officialPoints': official.get(rubric_id),
            'candidate': ({'points': proposed['points'], 'state': proposed['state'],
                           'review': proposed['review'],
                           'status': 'ASSESSMENT_CANDIDATE' if candidate else 'RESEARCH_CANDIDATE'}
                          if proposed else None),
            'cause': gap['primaryCause'] if gap else None,
            'evidence': gap['evidence'] if gap else [],
            'nextAction': ((gap.get('blocker') or 'Bind mandatory topics to a reviewed successor assessment.')
                           if gap and not candidate else None),
            'requiresSuccessorApproval': bool(gap),
        })

    return {'status': 'PASS WITH LIMITATIONS' if gaps else 'PASS', 'authorityEffect': 'NONE',
            'baselineId': baseline['id'], 'baselineHash': baseline['bodyHash'],
            'officialEligibleForChange': False, 'rows': rows}
