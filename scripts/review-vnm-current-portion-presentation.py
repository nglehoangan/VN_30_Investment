"""Record the owner-approved aggregated-current presentation; no canonical writes."""
import datetime
import hashlib
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/fundamental-data-engine/evidence/2026-10-19-included-current-portion'
READABLE = ROOT / 'data/comparisons/VN30/VNM/notes-readable-v1'
FACTS = ROOT / 'docs/fundamental-data-engine/evidence/2026-10-15-consumer-targeted-fix/VNM/CANONICAL_FACTS.json'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def rel(path):
    return str(path.relative_to(ROOT))


def save(name, data):
    (OUT / name).write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='milliseconds').replace('+00:00', 'Z')
    source = json.loads((READABLE / 'VNM.json').read_text())
    facts = json.loads(FACTS.read_text())['canonicalFacts']
    sources = json.loads((READABLE / 'provenance.json').read_text())['sourcePdfSha256']
    periods = {}
    for key, tag in [('2024', 'FY2024'), ('2025', 'FY2025'), ('2026-YTD2', '6M2026')]:
        data = source['reviewedBorrowingTables'][key]
        end = data['periodEnd']
        short, long = data['components'][:2]
        sf = next(f for f in facts if f['itemId'] == 'SHORT_TERM_FINANCIAL_BORROWINGS' and f['period']['end'] == end)
        lf = next(f for f in facts if f['itemId'] == 'LONG_TERM_FINANCIAL_BORROWINGS' and f['period']['end'] == end)
        assert sf['value'] == short['valueExact'] and lf['value'] == long['valueExact']
        pdf = ROOT / data['source']['pdfPath']
        assert sha(pdf) == sources[tag]
        movement = data['movements'][0]['columns'][2]
        opposite = data['movements'][1]['columns'][2]
        assert int(movement['valueExact']) == -int(opposite['valueExact'])
        periods[end] = {
            'ticker': 'VNM', 'periodEnd': end, 'scope': 'CONSOLIDATED', 'currency': 'VND', 'unit': 'CURRENCY',
            'currentPortion': None, 'amountDisclosure': 'NOT_SEPARATELY_DISCLOSED',
            'status': 'INCLUDED_IN_SHORT_NOT_SEPARATELY_DISCLOSED',
            'shortCanonicalId': sf['id'], 'longCanonicalId': lf['id'],
            'shortValue': sf['value'], 'longValue': lf['value'],
            'sourcePath': rel(pdf), 'sourceHash': sha(pdf),
            'shortPage': short['sourcePage'], 'longPage': long['sourcePage'],
            'shortEvidence': short['sourceMatches'], 'longEvidence': long['sourceMatches'],
            'inclusionReview': {'verified': True, 'conclusion': 'Aggregated issuer short closing caption includes reclassified long-term financing; preserve this presentation without requiring a separately disclosed closing component.',
                                'basis': 'Matched consolidated balance-sheet classification to Note15(a), closing column and reciprocal Note15(b) reclassification; reviewed source images.',
                                'movementEvidence': movement['sourceMatches'], 'reclassificationMovement': movement['valueExact'],
                                'movementUsedAsClosingCurrentPortion': False},
            'exclusionReview': {'verified': True, 'conclusion': 'Note15(b) closing amount is the issuer non-current borrowing presentation; reciprocal reclassification has already reduced it.',
                                'basis': 'Matched consolidated non-current balance-sheet caption to Note15(b) closing column and lender total; reviewed source images.',
                                'movementEvidence': opposite['sourceMatches']},
            'reportedSum': str(int(sf['value']) + int(lf['value'])),
            'formula': 'short + noncurrent long; no current amount added or subtracted',
            'reviewedAt': timestamp,
            'limits': 'Presentation classification is reviewed; this does not prove exhaustive financing classes, certify an unknown amount as zero, perform canonical admission or promote a ticker.'}
    evidence = OUT / 'VNM_PRESENTATION_REVIEW.json'
    save(evidence.name, {'schemaVersion': 'vnm-included-current-presentation-review-v1', 'reviewedAt': timestamp,
                         'ownerAuthorization': rel(OUT / 'OWNER_AUTHORIZATION.json'), 'existingComponentFacts': rel(FACTS),
                         'existingComponentFactsSha256': sha(FACTS), 'periods': periods,
                         'canonicalOrDispositionModified': False})
    witnesses = []
    for end, item in periods.items():
        short_source = item['shortEvidence'][0]
        long_source = item['longEvidence'][0]
        proof = {'version': 'current-portion-presentation-v1', 'status': item['status'], 'ticker': 'VNM',
                 'periodEnd': end, 'scope': 'CONSOLIDATED', 'currency': 'VND', 'unit': 'CURRENCY',
                 'shortCanonicalId': item['shortCanonicalId'], 'longCanonicalId': item['longCanonicalId'],
                 'shortValue': item['shortValue'], 'longValue': item['longValue'],
                 'shortPresentationVerified': True, 'noncurrentLongPresentationVerified': True,
                 'sourcePath': item['sourcePath'], 'sourceHash': item['sourceHash'],
                 'shortLocator': short_source['rawPath'] + '#' + short_source['rawLocator'],
                 'longLocator': long_source['rawPath'] + '#' + long_source['rawLocator'],
                 'inclusionLocator': rel(evidence) + '#/periods/' + end + '/inclusionReview',
                 'exclusionLocator': rel(evidence) + '#/periods/' + end + '/exclusionReview',
                 'evidenceReference': rel(evidence), 'evidenceHash': sha(evidence), 'reviewedAt': timestamp}
        # This proof has strings/bools only; Python code-point sorting and compact
        # JSON match the project's canonicalJson. Vitest checks financialHash too.
        proof['bodyHash'] = hashlib.sha256(json.dumps(proof, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()).hexdigest()
        witnesses.append(proof)
    save('VNM_CURRENT_PORTION_PRESENTATIONS.json', {'status': 'REVIEWED_PRESENTATION_WITNESSES_ONLY', 'currentPortion': None,
                                                   'witnesses': witnesses, 'fullDebtReceiptsCreated': False,
                                                   'canonicalAdmissionPerformed': False, 'LEVEL1_PROMOTION_CANDIDATE': False})
    print('Recorded 3 source-bound VNM presentation witnesses; no canonical writes.')


if __name__ == '__main__':
    main()
