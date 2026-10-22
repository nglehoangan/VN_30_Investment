"""Read-only exact retained Vietstock document coverage; never admits source facts."""
import argparse
import collections
import datetime
import hashlib
import json
from pathlib import Path
import sqlite3
from lib.vietstock_source_policy import require_vietstock_url

ROOT = Path(__file__).resolve().parents[1]
PLAN = ROOT / 'docs/fundamental-data-engine/evidence/2026-10-21-escalated-blocker-resolution/SOURCE_MINIMUM_DATASET_PLAN.json'

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def recalculate():
    manifest_path = ROOT / 'data/manual-download/manifest.json'
    manifest = json.loads(manifest_path.read_text())
    plan = json.loads(PLAN.read_text())['facts']
    documents = collections.defaultdict(list)
    requests = []
    for index, receipt in enumerate(manifest['requests']):
        row = {'manifestPointer': '/requests/' + str(index), **receipt}
        try:
            require_vietstock_url(receipt['url'])
        except ValueError:
            row['coverageStatus'] = 'EXCLUDED_NON_VIETSTOCK_SOURCE'
            requests.append(row)
            continue
        path = ROOT / receipt['path']
        if receipt['status'] != 'DOWNLOADED' or not path.is_file():
            row['coverageStatus'] = 'FAILED_OR_MISSING_RETAINED_FILE'
        elif not path.read_bytes().startswith(b'%PDF-') or digest(path) != receipt.get('sha256'):
            row['coverageStatus'] = 'INTEGRITY_MISMATCH'
        elif receipt.get('httpStatus') != 200 or not receipt.get('retrievedAt'):
            row['coverageStatus'] = 'MISSING_DOWNLOAD_EVIDENCE'
        else:
            row['coverageStatus'] = 'VERIFIED_RETAINED_VIETSTOCK_BYTES'
            documents[receipt['sha256']].append(row)
        requests.append(row)
    obligations = []
    for i, fact in enumerate(plan):
        matches = documents.get(fact.get('sourceHash'), [])
        matches = [r for r in matches if r['ticker'] == fact['ticker']]
        obligations.append({**fact, 'obligationIndex': i, 'retainedVietstockDocumentMatched': bool(matches),
            'matches': [{'manifestPointer': r['manifestPointer'], 'url': r['url'], 'path': r['path'],
                         'sha256': r['sha256'], 'retrievedAt': r['retrievedAt']} for r in matches],
            'state': 'RETAINED_EXACT_DOCUMENT_ONLY' if matches else 'EXACT_CANONICAL_SOURCE_DOCUMENT_NOT_AVAILABLE',
            'originalPublicationProven': False, 'formalAdmissionGranted': False,
            'remainingGap': 'Original-publication authority and formal lineage/knowledge/approval remain unproven' if matches else
                'Need exact selected canonical source bytes from Vietstock, or independently reviewed source replacement with full re-extraction/lineage; never rewrite the existing source hash'})
    covered = sum(r['retainedVietstockDocumentMatched'] for r in obligations)
    by_issuer = []
    for ticker in sorted({r['ticker'] for r in obligations}):
        rows = [r for r in obligations if r['ticker'] == ticker]
        n = sum(r['retainedVietstockDocumentMatched'] for r in rows)
        by_issuer.append({'ticker': ticker, 'sector': rows[0]['sector'], 'obligations': len(rows),
            'exactRetainedDocumentCovered': n, 'exactDocumentMissing': len(rows)-n,
            'originalPublicationProven': 0, 'formallyAdmitted': 0})
    db = sqlite3.connect('file:' + str(ROOT / 'data/vn30.sqlite') + '?mode=ro', uri=True)
    facts = [f for (body,) in db.execute('select body from fundamental_admission_run') for f in json.loads(body)['canonicalFacts'] if f['ticker'] != 'MBB']
    db.close()
    return {'schemaVersion': 'vietstock-only-exact-document-coverage-v1',
        'at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'inputs': {'minimumDatasetPlan': str(PLAN.relative_to(ROOT)), 'minimumDatasetPlanSha256': digest(PLAN),
            'downloadManifest': str(manifest_path.relative_to(ROOT)), 'downloadManifestSha256': digest(manifest_path)},
        'sourcePolicy': 'VIETSTOCK_ONLY_NO_ISSUER_OR_EXCHANGE_FALLBACK',
        'summary': {'downloadRequests': len(requests), 'verifiedPhysicalPDFs': sum(len(v) for v in documents.values()),
            'verifiedUniquePDFHashes': len(documents), 'failedOrExcludedRequests': sum(r['coverageStatus'] != 'VERIFIED_RETAINED_VIETSTOCK_BYTES' for r in requests),
            'coreObligations': len(plan), 'exactRetainedDocumentCovered': covered, 'exactDocumentMissing': len(plan)-covered,
            'coveragePercent': round(100*covered/len(plan), 2), 'originalPublicationEvidenceCovered': 0,
            'formallyAdmittedObligations': 0, 'eligibleCanonicalFactCandidates': len(facts),
            'eligibleFactCandidatesWithRetainedVietstockHash': sum(bool(documents.get(f.get('sourceHash'))) for f in facts)},
        'coverageSemantics': 'Exact byte/hash linkage to retained Vietstock download only. Not content/accounting approval, original publication verification, complete scoring input or production admission. No new live download performed.',
        'publicationScope': 'No approved original-publication binding supplied through this permitted Vietstock-only input. Company/HOSE PE1 evidence excluded; Vietstock list dates and HTTP/PDF clocks are not substituted.',
        'lowerBoundNotCompleteScoringDataset': True, 'MBB': 'DEFERRED_EXCLUDED_FROM_CORE_COVERAGE',
        'byIssuer': by_issuer, 'obligations': obligations, 'downloadInventory': requests,
        'excludedPriorEvidence': {'path': 'docs/fundamental-data-engine/evidence/2026-10-21-primary-publication-evidence-pe1/',
            'oldVerifiedSourceEvidenceCount': 45, 'reason': 'Historical issuer/exchange provenance does not satisfy current Vietstock-only acquisition selection; do not relabel these captures as Vietstock.'},
        'D2Activated': False, 'scoringExecuted': False, 'databaseWrites': 0}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    target = args.output / 'MINIMUM_DATASET_SOURCE_COVERAGE.json'
    if target.exists():
        raise SystemExit('Refusing to overwrite an existing coverage artifact; choose a new directory.')
    result = recalculate()
    target.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(result['summary']))

if __name__ == '__main__':
    main()
