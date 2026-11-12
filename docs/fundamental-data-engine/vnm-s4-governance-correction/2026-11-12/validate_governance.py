"""Read-only provenance, governance, source preservation and deterministic-replay checks."""
from pathlib import Path
import hashlib
import json
import re
import subprocess

BASE = Path(__file__).resolve().parent
ROOT = BASE.parents[3]
checks = 0

def read(path):
    return json.loads((ROOT / path).read_text())

def check(condition, reason):
    global checks
    assert condition, reason
    checks += 1

def sha(path):
    return hashlib.sha256((ROOT / path).read_bytes()).hexdigest()

correction_path = 'docs/fundamental-data-engine/governance/VNM_S4_APPROVAL_PROVENANCE_CORRECTION_2026-11-12.json'
c = read(correction_path)
s = json.loads((BASE / 'CURRENT_ADMISSION_STATUS.json').read_text())
check(c['contract'] == 's4-owner-approval-provenance-correction-v1', 'CORRECTION_SCHEMA')
check(c['admissionStatus'] == s['ownerAdmission'] == 'PENDING_EXPLICIT_OWNER_APPROVAL', 'CURRENT_PENDING_STATUS')
check(c['actualOwnerAdmissionAuthorization'] is None and s['ownerAuthorization'] is None, 'NO_INVENTED_OWNER_AUTHORIZATION')
check(sha(c['supersedes']['path']) == c['supersedes']['sha256'], 'ORIGINAL_UNSUPPORTED_RECEIPT_PRESERVED')
check(sha(c['proposal']['path']) == c['proposal']['sha256'] == s['proposal']['sha256'], 'ORIGINAL_PROPOSAL_PRESERVED')
check(sha(correction_path) == s['correction']['sha256'], 'CORRECTION_REFERENCE')
proposal = read(c['proposal']['path'])
verified_pins = set()
def verify_pins(value):
    if isinstance(value, dict):
        source = value.get('path') or value.get('pdfPath')
        if source and 'sha256' in value:
            check(sha(source) == value['sha256'], 'ORIGINAL_SOURCE_PIN:' + source)
            verified_pins.add(source)
        for child in value.values():
            verify_pins(child)
    elif isinstance(value, list):
        for child in value:
            verify_pins(child)
verify_pins(proposal)
check(len(proposal['facts']) == 17, 'EXACT_17_FACTS')
check(proposal['ownerApproval'] is None and not proposal['sourceAuthorityGranted'], 'PROPOSAL_IS_NOT_AUTHORIZATION')
check(sum(f['kind'] == 'GROSS_CASH_DIVIDEND_TERM' for f in proposal['facts']) == 15, '15_COMPONENTS')
check(proposal['facts'][0]['value'] == '56900' and proposal['facts'][-1]['value'] == '2089955445', 'UNCHANGED_PRICE_AND_SHARES')
check(s['R1'] == c['R1'] == 'CLOSED_BY_OWNER_APPROVED_CARRY_FORWARD_POLICY', 'R1_STAYS_CLOSED')
check(s['R4'] == c['R4'] == 'CLOSED_BY_SCOPE_EXCLUSION', 'R4_STAYS_CLOSED')
check(s['F1'] == s['F2'] == 'OPEN' and not s['formalS4Closed'] and not s['productionActivated'], 'NO_FORMAL_OR_PRODUCTION_PROMOTION')
protected = json.loads((BASE / 'PRESERVATION.json').read_text())['files']
for f in protected:
    check(sha(f['path']) == f['beforeSha256'], 'IMMUTABLE_BYTES:' + f['path'])
old = ROOT / 'docs/fundamental-data-engine/vnm-s4-reusable-skill/2026-11-12/replay/VNM/2026-10-30'
new = BASE / 'replay/VNM/2026-10-30'
marker = json.loads((old / 'SUPERSEDED.json').read_text())
check(marker['currentOwnerAdmission'] == s['ownerAdmission'], 'REPLAY_SUPERSESSION_STATUS')
for pin in marker['originalFiles']:
    check(sha(pin['path']) == pin['sha256'], 'OLD_REPLAY_PRESERVED')
prior = json.loads((old / 'EVIDENCE.json').read_text())
current = json.loads((new / 'EVIDENCE.json').read_text())
check({k:v for k,v in prior.items() if k != 'acceptance'} == {k:v for k,v in current.items() if k != 'acceptance'}, 'ECONOMIC_EVIDENCE_UNCHANGED')
acceptance = json.loads((new / 'ACCEPTANCE.json').read_text())
check(acceptance['ownerAdmission'] == current['acceptance']['ownerAdmission'] == s['ownerAdmission'], 'CURRENT_OUTPUTS_PENDING')
check(acceptance['ownerApproval'] is None and not acceptance['formalAdmissionGranted'] and not acceptance['productionActivated'], 'OUTPUT_HAS_NO_APPROVAL')
check(acceptance['research'] == s['evidenceReadiness'] == 'READY_FOR_OWNER_ADMISSION', 'READINESS_DISTINCT_FROM_APPROVAL')
first = {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in new.iterdir()}
subprocess.run(['node', 'skills/vn30-market-price-corporate-actions/scripts/runtime.mjs', '--input',
                'docs/fundamental-data-engine/vnm-s4-reusable-skill/2026-11-12/VNM_INPUT.json', '--out', str(BASE / 'replay')],
               cwd=ROOT, check=True, capture_output=True)
check(first == {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in new.iterdir()}, 'BYTE_IDENTICAL_REPLAY')
targeted = read('docs/fundamental-data-engine/vnm-s4-targeted-remediation/2026-11-12/TARGETED_FINDINGS.json')
check(targeted['S4-R2']['researchAdmission'] == s['ownerAdmission'] and targeted['S4-R2']['ownerApproval'] is None, 'TARGETED_STATUS')
check(targeted['S4-R1']['status'] == s['R1'] and targeted['S4-R4']['status'] == s['R4'], 'TARGETED_R1_R4_UNCHANGED')
for path in ['AGENTS.md', 'skills/vn30-market-price-corporate-actions/SKILL.md',
             'docs/fundamental-data-engine/vnm-s4-source-admission/2026-11-12/OWNER_DECISION_SHEET.md',
             'docs/fundamental-data-engine/vnm-s4-source-admission/2026-11-12/S4_ACCEPTANCE_SUMMARY.md',
             'docs/fundamental-data-engine/vnm-s4-reusable-skill/2026-11-12/RESIDUAL_BLOCKERS_AND_CIO_CHECKLIST.md',
             'docs/fundamental-data-engine/vnm-s4-reusable-skill/2026-11-12/FINAL_REVIEW.md']:
    text = (ROOT / path).read_text()
    check('PENDING_EXPLICIT_OWNER_APPROVAL' in text, 'ACTIVE_DOC_PENDING:' + path)
    check('CONDITIONALLY_APPROVED' not in text, 'NO_ACTIVE_UNSUPPORTED_APPROVAL:' + path)
for folder in [BASE, ROOT / 'skills/vn30-market-price-corporate-actions']:
    for path in folder.rglob('*.md'):
        for link in re.findall(r'\]\(([^)]+)\)', path.read_text()):
            if '://' not in link:
                check((path.parent / link.split('#')[0]).exists(), 'LOCAL_DOC_LINK:' + link)
print(json.dumps(dict(status='PASS', checks=checks, protectedFilesUnchanged=len(protected),
                     selectedFacts=17, verifiedDistinctProposalSourcePins=len(verified_pins), ownerAdmission=s['ownerAdmission'], replayHashes=first,
                     formalS4Closed=False, productionActivated=False), indent=2))
