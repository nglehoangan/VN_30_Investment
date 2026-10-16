"""Review-only universe reconciliation; never creates production membership or scores."""
def review_universe(evidence_complete, official_composition, research_composition):
    official, research = set(official_composition), set(research_composition)
    delta = {'entering': sorted(official - research), 'exiting': sorted(research - official)}
    if evidence_complete is not True or len(official_composition) != 30 or len(official) != 30:
        status = 'BLOCKED'
    elif delta['entering'] or delta['exiting']:
        status = 'CHANGED_REQUIRES_INITIALIZATION'
    else:
        status = 'CERTIFIED'
    return {'status': status, 'difference': delta, 'readyForScoring': False}


def stop_on_universe_change(review):
    if review['status'] == 'CHANGED_REQUIRES_INITIALIZATION':
        raise SystemExit('UNIVERSE_CHANGE_REQUIRES_DATA_INITIALIZATION: ' + str(review['difference']))
