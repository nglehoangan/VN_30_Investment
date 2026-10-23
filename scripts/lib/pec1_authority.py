"""Offline owner decision review only. No database writes or runtime admission API.
Trusted receipt digests must be independently authenticated outside this module;
never derive that trust set from the candidate or register being evaluated.
"""
import datetime
import hashlib
import json

GATES = tuple('G'+str(i) for i in range(1, 9))

def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, ensure_ascii=False, separators=(',', ':'), allow_nan=False).encode()).hexdigest()

def instant(value):
    result = datetime.datetime.fromisoformat(value.replace('Z', '+00:00'))
    if result.tzinfo is None:
        raise ValueError('UNQUALIFIED_TIME')
    return result

def evaluate(candidate, inventory, now, trusted_owner_receipts=None):
    """Return review state, never production permission. Default trust is empty."""
    reasons = []
    gates = candidate.get('gates', {})
    for gate in GATES:
        entry = gates.get(gate, {})
        if entry.get('state') not in ('PASS', 'FAIL', 'PENDING', 'NOT_APPLICABLE'):
            reasons.append(gate+':INVALID_STATE')
        # All eight gates are mandatory for this candidate class.
        if entry.get('state') != 'PASS':
            reasons.append(gate+':MANDATORY_GATE_NOT_PASS')
    if sum(c['candidateId'] == candidate['candidateId'] for c in inventory) != 1:
        reasons.append('DUPLICATE_CANDIDATE')
    if any(c['candidateId'] != candidate['candidateId'] and c['authorityKey'] == candidate['authorityKey'] for c in inventory):
        reasons.append('CONFLICTING_SOURCE_AUTHORITY')
    if digest(candidate['evidencePins']) != candidate['evidenceBundleHash']:
        reasons.append('CHANGED_EVIDENCE_HASH')
    if not candidate.get('evidenceValidThrough') or instant(candidate['evidenceValidThrough']) <= instant(now):
        reasons.append('EVIDENCE_EXPIRED_OR_VALIDITY_UNAPPROVED')
    receipt = candidate.get('ownerReceipt')
    trusted = (trusted_owner_receipts or {}).get(candidate['candidateId'])
    if not receipt or not trusted or digest(receipt) != trusted:
        reasons.append('G8:AUTHENTICATED_OWNER_APPROVAL_MISSING')
    else:
        if (receipt.get('candidateId') != candidate['candidateId'] or
            receipt.get('evidenceBundleHash') != candidate['evidenceBundleHash'] or
            receipt.get('role') != 'Investment System Owner' or
            not receipt.get('ownerIdentity') or receipt.get('ownerIdentity') in ('Codex', 'AI Portfolio Manager') or not receipt.get('approvalEvidenceReference') or
            receipt.get('decision') not in ('APPROVED', 'APPROVED_WITH_RESTRICTIONS')):
            reasons.append('G8:OWNER_RECEIPT_SCOPE_INVALID')
        try:
            if not (instant(candidate['preparedAt']) <= instant(receipt['decisionAt']) <= instant(receipt['effectiveFrom']) <= instant(now) < instant(receipt['effectiveThrough'])):
                reasons.append('G8:RETROACTIVE_OR_INVALID_EFFECTIVITY')
        except (ValueError, KeyError, TypeError):
            reasons.append('G8:INVALID_OWNER_CLOCK')
        if receipt.get('decision') == 'APPROVED_WITH_RESTRICTIONS' and not receipt.get('restrictions'):
            reasons.append('G8:RESTRICTIONS_MISSING')
    if candidate.get('productionAdmissionRequested'):
        reasons.append('AUTOMATIC_PRODUCTION_ADMISSION_FORBIDDEN')
    return {'effectiveState': 'PENDING_REQUIRED_EVIDENCE' if reasons else receipt['decision'],
            'blockers': reasons, 'effectiveRestrictions': [] if reasons else receipt.get('restrictions', []), 'productionAccess': False, 'D2Activated': False,
            'scoringActivated': False}
