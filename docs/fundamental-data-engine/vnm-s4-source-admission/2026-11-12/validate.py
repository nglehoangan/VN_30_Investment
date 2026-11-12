"""Read-only verification of the exact17-fact admission proposal, not a data pipeline."""
import hashlib
import json
from decimal import Decimal
from pathlib import Path

BASE = Path(__file__).parent
ROOT = BASE.parents[3]
checks = 0
verified = set()

def check(condition, message):
    global checks
    assert condition, message
    checks += 1

def digest(path):
    return hashlib.sha256((ROOT / path).read_bytes()).hexdigest()

def pointer(value, ref):
    for part in ref.lstrip('/').split('/') if ref else []:
        key = part.replace('~1', '/').replace('~0', '~')
        value = value[int(key)] if isinstance(value, list) else value[key]
    return value

def verify_pins(value):
    if isinstance(value, dict):
        if 'path' in value and 'sha256' in value:
            check(digest(value['path']) == value['sha256'], 'PIN_HASH:' + value['path'])
            verified.add(value['path'])
            if 'jsonPointer' in value:
                pointer(json.loads((ROOT / value['path']).read_text()), value['jsonPointer'])
        for child in value.values():
            verify_pins(child)
    elif isinstance(value, list):
        for child in value:
            verify_pins(child)

j = json.loads((BASE / 'ADMISSION_DECISIONS.json').read_text())
verify_pins(j)
check(j['baseline'] == 'a693aed5aecb0753b2dea842e26a28f041e2140c', 'BASELINE')
check(j['ownerApproval'] is None and j['ownerApprovedAt'] is None and
      not j['productionActivation'] and not j['sourceAuthorityGranted'], 'NO_SELF_APPROVAL')
check(j['S4R1'] == 'CLOSED_BY_OWNER_APPROVED_CARRY_FORWARD_POLICY' and
      j['S4R4'] == 'CLOSED_BY_SCOPE_EXCLUSION', 'PRESERVE_CLOSED_SCOPE')
facts = j['facts']
check(len(facts) == len({f['id'] for f in facts}) == 17, 'EXACT_FACT_IDENTITIES')
price = facts[0]
request = pointer(json.loads((ROOT / price['rawRequest']['path']).read_text()), price['rawRequest']['jsonPointer'])
check(hashlib.sha256(request['rawResponse'].encode()).hexdigest() == price['rawResponseSha256'], 'ORIGINAL_RESPONSE_HASH')
raw = pointer(json.loads(request['rawResponse']), price['decodedRawPointer'])
check(Decimal(str(raw)) * 1000 == Decimal(price['value']) == Decimal('56900'), 'RAW_CLOSE_UNIT')
check(price['field'] == 'GiaDongCua' and price['adjustment'] == 'RAW' and
      price['receivedAt'] == request['receivedAt'], 'FIELD_AND_ORIGINAL_TIME')
cash = [f for f in facts if f['kind'] == 'GROSS_CASH_DIVIDEND_TERM']
check(len(cash) == 15 and sum(int(f['value']) for f in cash) == 18750, 'EXACT_CASH_COMPONENTS')
for f in cash:
    original = pointer(json.loads((ROOT / f['source']['path']).read_text()), f['source']['jsonPointer'])
    check(f['value'] == original['reviewedCashVndPerShare'] and
          f['eventId'] == original['eventId'] and
          f['paymentDate'] == original['paymentOrEffectiveDate'], 'NO_CASH_REINTERPRETATION')
    check(digest(f['pdfEvidence']['pdfPath']) == f['pdfEvidence']['sha256'], 'PDF_HASH')
check(next(f for f in cash if f['eventId'] == 222269)['value'] == '1850', 'PRESERVE_RESOLVED_CONFLICT')
shares = facts[-1]
check(shares['value'] == '2089955445' and shares['S4R1'] == j['S4R1'] and
      shares['completeNegativeSearch'] is False, 'CARRY_FORWARD_SCOPE')
for f in facts:
    check(f['decisions']['retrospectiveValuationResearch']['status'] == 'READY_FOR_OWNER_ADMISSION', 'RESEARCH_READY')
    check(f['decisions']['formalValuationConsumption']['status'] == 'NOT_READY_FOR_GOVERNED_CONSUMPTION' and
          f['decisions']['historicalPointInTimeBacktesting']['status'] == 'NOT_QUALIFIED', 'NO_FORMAL_OR_PIT_PROMOTION')
check([r['id'] for r in j['remainingRequirements']] == ['F1', 'F2', 'T1'], 'ONLY_IDENTIFIED_GAPS')
# Reuse the existing preservation receipt; do not build another source inventory.
p = ROOT / 'docs/fundamental-data-engine/vnm-s4-share-carry-forward/2026-11-12/PRESERVATION.json'
preserved = json.loads(p.read_text())['files']
for f in preserved:
    check(digest(f['path']) == f['beforeSha256'], 'RETAINED_SOURCE_UNCHANGED:' + f['path'])
# Local document link existence, including exact policy source links.
import re
for filename in ['OWNER_DECISION_SHEET.md', 'S4_ACCEPTANCE_SUMMARY.md']:
    for ref in re.findall(r'\]\(([^)]+)\)', (BASE / filename).read_text()):
        check((BASE / ref.split('#')[0]).exists(), 'DOCUMENT_LINK:' + ref)
print(json.dumps({'status': 'PASS', 'checks': checks, 'factDecisions': len(facts),
                  'cashComponents': len(cash), 'verifiedDistinctPinnedFiles': len(verified),
                  'existingPreservationFilesUnchanged': len(preserved),
                  'sourceAuthorityGranted': False, 'productionActivated': False,
                  'applicationTestsRun': False}, indent=2))
