"""Owner carry-forward review rule; no database/runtime or source-admission authority."""
from datetime import date, timedelta

CARRIED = 'CARRIED_FORWARD_NO_CHANGE_FOUND_IN_REVIEWED_DOCUMENTS'
CLOSED = 'CLOSED_BY_OWNER_APPROVED_CARRY_FORWARD_POLICY'


def assess_share_count(anchor, cutoff, review):
    """Return a bounded documentary selection, never an independently verified zero flow.

    Incomplete provider/disclosure coverage is disclosed, not silently upgraded to an
    exhaustive search. A known relevant unreviewed document or unresolved event blocks
    adoption. Effective dates, rather than announcement dates, determine applicability.
    """
    def blocked(reason):
        return dict(status='NOT_QUALIFIED', acceptance='OPEN', shares=None, reason=reason,
                    sourceAdmission=False, productionActivated=False)
    try:
        end = date.fromisoformat(cutoff)
        start = date.fromisoformat(anchor['asOf']) + timedelta(days=1)
        if (not anchor['eligibleForOwnerReference'] or not anchor['sourceReference'] or
                not anchor['shares'].isdigit() or int(anchor['shares']) <= 0 or start > end):
            return blocked('INVALID_OR_INELIGIBLE_STATEMENT_ANCHOR')
        if (review['ticker'] != anchor['ticker'] or
                date.fromisoformat(review['from']) > start or
                date.fromisoformat(review['through']) < end or not review['reviewedAt']):
            return blocked('REVIEW_SCOPE_INCOMPLETE')
        if not review['inventoryReviewed'] or review['unreviewedRelevantDocuments']:
            return blocked('KNOWN_RELEVANT_DOCUMENTS_NOT_REVIEWED')
        limitations = list(review['limitations'])
        if not review['completeNegativeSearch'] and not limitations:
            return blocked('INCOMPLETE_COVERAGE_REQUIRES_EXPLICIT_LIMITATION')
        for event in review['events']:
            if event['ticker'] != anchor['ticker'] or not event['sourceReference']:
                return blocked('INVALID_EVENT_IDENTITY_OR_LINEAGE')
            if event['affectsOutstanding'] is False:
                continue
            effective = event['effectiveDate']
            if effective is not None:
                day = date.fromisoformat(effective)
                if day < start or day > end:
                    continue
            if event['status'] == 'CONFLICTING':
                return blocked('CONFLICTING_SHARE_COUNT_EVIDENCE')
            if effective is None or event['status'] != 'CONFIRMED' or event['affectsOutstanding'] is None:
                return blocked('UNRESOLVED_SHARE_COUNT_EVENT_OR_EFFECTIVE_DATE')
            return blocked('CONFIRMED_EFFECTIVE_SHARE_COUNT_CHANGE')
        return dict(status=CARRIED, acceptance=CLOSED, shares=anchor['shares'],
                    ticker=anchor['ticker'], anchorDate=anchor['asOf'], cutoff=cutoff,
                    reviewedAt=review['reviewedAt'], completeNegativeSearch=review['completeNegativeSearch'],
                    limitations=limitations, verifiedZeroMovement=False,
                    sourceAdmission=False, productionActivated=False)
    except (KeyError, TypeError, ValueError, AttributeError):
        return blocked('INVALID_REVIEW_INPUT')
