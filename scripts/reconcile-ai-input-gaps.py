"""Separate scope/code gaps from missing source data. Never promotes facts."""
import collections
import hashlib
import json
from pathlib import Path
import re
import unicodedata

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-29/ai-review-r1'


def load(path):
    return json.loads(path.read_text())


def fold(text):
    return ''.join(c for c in unicodedata.normalize('NFD', text.lower().replace('đ', 'd'))
                   if unicodedata.category(c) != 'Mn')


def main():
    index = load(OUT / 'input-bridge-index.json')
    results = []
    source_gaps = []
    for member in index['members']:
        data = load(ROOT / member['path'])
        facts = data['factEvidence']
        rows = []
        for row in data['requiredAccountingInputs']:
            if row['candidateFactIds']:
                status = 'CANONICAL_INPUT_EXISTS_REVIEW_AND_NATIVE_BINDING_PENDING'
                candidates = [f for f in facts if f['factId'] in row['candidateFactIds']]
            else:
                candidates = [f for f in facts if f['itemId'] in row['anyOf'] and f['period']['end'] == row['periodEnd']]
                if candidates:
                    status = 'EXISTS_IN_STANDALONE_SCOPE_NOT_A_MISSING_VALUE'
                elif member['ticker'] == 'VNM' and row['requirementId'] == 'debt':
                    candidates = [f for f in facts if f['itemId'] in ['SHORT_TERM_FINANCIAL_BORROWINGS', 'LONG_TERM_FINANCIAL_BORROWINGS'] and f['period']['end'] == row['periodEnd']]
                    status = 'BORROWING_COMPONENTS_EXIST_POPULATION_QUALIFICATION_PENDING'
                else:
                    status = 'REQUIRED_INPUT_NOT_YET_QUALIFIED'
            rows.append({'periodEnd': row['periodEnd'], 'requirementId': row['requirementId'], 'anyOf': row['anyOf'],
                         'status': status, 'candidates': [{'factId': f['factId'], 'itemId': f['itemId'],
                         'originalScope': f['scope'], 'normalizedScopeVocabulary': 'SEPARATE_STANDALONE' if f['scope'] == 'STANDALONE' else f['scope'],
                         'value': f['value'], 'period': f['period'], 'retainedPdfPaths': f['retainedPdfPaths']} for f in candidates],
                         'formalReady': False, 'requiresNewUserValue': False})
        unretained = collections.defaultdict(list)
        for f in facts:
            if not f['retainedPdfPaths']:
                unretained[f['period']['end']].append(f['factId'])
        if unretained:
            source_gaps.append({'ticker': member['ticker'], 'kind': 'CANONICAL_VALUES_EXIST_BUT_EXACT_SOURCE_HASH_NOT_RETAINED',
                                'periods': [{'periodEnd': period, 'factIds': ids} for period, ids in sorted(unretained.items())],
                                'action': 'Locate equivalent source columns in retained PDFs/API first; reacquire source PDFs only from Vietstock where needed. No request for the owner to re-enter amounts.'})
        results.append({'ticker': member['ticker'], 'rows': rows})
    # Exhaustive text search of all retained MBB notes, including source sections that are not statement tables.
    mbb_hits = []
    for doc in load(ROOT / 'data/manual-extracted-pdf/notes/MBB.json')['documents']:
        for page in doc['pages']:
            text = page['text']
            normalized = fold(text)
            matches = list(re.finditer(r'ty le an toan von|capital adequacy|\bcar\b', normalized))
            if matches:
                mbb_hits.append({'path': doc['pdfPaths'][0], 'sha256': doc['sourceHash'], 'page': page['page'],
                                 'excerpts': [text[max(0, m.start() - 100):m.end() + 300] for m in matches[:4]]})
    manifest = load(ROOT / 'data/manual-download/manifest.json')
    failed = next(r for r in manifest['requests'] if r['ticker'] == 'MBB' and r['filename'] == 'MBB_BaocaoTyleAnToanVon_6T_2026.pdf')
    evidence = {'ticker': 'MBB', 'requiredPeriod': '2026-06-30', 'requiredConcept': 'Definition-qualified CAR or CET1',
                'status': 'NO_QUALIFIED_JUNE_CAPITAL_INPUT_IN_RETAINED_SET', 'retainedSearchHits': mbb_hits,
                'failedSourceCapture': failed,
                'visuallyCheckedCounterexample': {'path': 'data/manual-download/MBB/20260806___mbb____part_1.pdf',
                'sha256': '38b198309ad855f21128ccdf304278223d9f390e6688995ed31194060f394578',
                'physicalPage': 62, 'table': 'Table 13', 'displayedCARPercent': '10.73',
                'actualCARDatePerFootnote': '2026-03-31', 'columnHeading': '2026-06-30',
                'conclusion': 'Footnote overrides apparent column period for CAR. Do not promote 10.73% to June CAR.'},
                'nextAction': 'Find a retained/reacquired Vietstock disclosure that explicitly qualifies June30 CAR/CET1, scope and framework; keep deferred until verified.',
                'userUploadRequested': False}
    counts = collections.Counter(row['status'] for ticker in results for row in ticker['rows'])
    result = {'contract': 'personal-ai-input-gap-reconciliation-v1', 'counts': dict(counts), 'tickers': results,
              'scopeAliasRule': {'STANDALONE': 'SEPARATE_STANDALONE', 'semantics': 'Vocabulary translation only; does not prove consolidated comparability or authorize fallback.'},
              'retainedSourceGaps': source_gaps, 'qualifiedDataStillMissing': [evidence],
              'ownerSupplementRequests': [], 'scoringAuthorized': False,
              'sourcePins': [{'path': 'data/manual-extracted-pdf/notes/MBB.json',
                              'sha256': hashlib.sha256((ROOT / 'data/manual-extracted-pdf/notes/MBB.json').read_bytes()).hexdigest()}]}
    (OUT / 'input-gap-reconciliation.json').write_text(json.dumps(result, ensure_ascii=True, indent=2) + '\n')
    print(json.dumps({'counts': dict(counts), 'sourceGapTickers': len(source_gaps), 'ownerSupplementRequests': 0}))


if __name__ == '__main__':
    main()
