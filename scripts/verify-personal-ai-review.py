"""Adversarial structural/source checks for the personal AI review dossier."""
import collections
import hashlib
import json
from pathlib import Path
import sqlite3

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-29/ai-review-r1'


def load(path):
    return json.loads(path.read_text())


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    manifest = load(OUT / 'review-manifest.json')
    for pin in manifest['inputPins'] + manifest['artifacts'] + [manifest['builder']]:
        assert sha(ROOT / pin['path']) == pin['sha256'], pin['path']
    audit = load(OUT / 'pdf-dimension-audit.refined.json')
    paths = {}
    downloaded = 0
    for d in audit['documents']:
        if not d.get('sha256'):
            continue
        assert sha(ROOT / d['path']) == d['sha256'], d['path']
        paths[d['path']] = d
        downloaded += 1
    visual = load(OUT / 'visual-review.json')
    assert len(visual['pages']) == 30
    assert len({p['ticker'] for p in visual['pages']}) == 30
    for p in visual['pages'] + visual['publicationDeclarations']:
        assert paths[p['path']]['sha256'] == p['sha256']
        assert 1 <= p['page'] <= paths[p['path']]['pageCount']
    assert len([p for p in visual['pages'] if p['scope'] is None]) == 2
    criteria = load(OUT / 'ai-acceptance-criteria.json')
    assert [c['id'] for c in criteria['criteria']] == ['AI%02d' % i for i in range(1, 16)]
    assert criteria['humanIndependentReviewerRequired'] is False
    assert criteria['notEquivalentToHumanIndependentReview'] is True
    assert criteria['legacyRuntimeContractUnchanged'] is True
    assert hashlib.sha256(criteria['ownerInstruction'].encode()).hexdigest() == criteria['ownerInstructionSha256']
    policy = load(OUT / 'readiness-policy.proposed.json')
    assert policy['productionAdmissible'] is False
    original = load(ROOT / policy['sourcePolicy']['path'])
    for route in policy['routes']:
        expected = original['sectors'][route['sector']]
        required = expected['CORE'] + expected['SECTOR_CORE']
        assert [{k: v for k, v in g.items() if k != 'group'} for g in route['requiredGroups']] == required
    index = load(OUT / 'input-bridge-index.json')
    assert len(index['members']) == 30
    count = facts = 0
    with sqlite3.connect('file:' + str(ROOT / 'data/vn30.sqlite') + '?mode=ro', uri=True) as db:
        for member in index['members']:
            data = load(ROOT / member['path'])
            assert not data['readyForScoring'] and data['scoreInput'] is None
            assert data['bridgePreparation']['runtimeBridgePlan'] is None
            retained = {}
            for pin in data['admissionPins']:
                body, body_hash = db.execute('SELECT body,body_hash FROM fundamental_admission_run WHERE id=?', [pin['id']]).fetchone()
                assert hashlib.sha256(body.encode()).hexdigest() == pin['bodyHash'] == body_hash
                retained.update({f['id']: f for f in json.loads(body)['canonicalFacts']})
            for f in data['factEvidence']:
                actual = retained[f['factId']]
                for a, b in [('value', 'value'), ('itemId', 'itemId'), ('scope', 'scope'), ('period', 'period')]:
                    assert f[a] == actual[b]
                assert not f['formalBridgeEligible']
            for r in data['requiredAccountingInputs']:
                assert all(i in retained for i in r['candidateFactIds'])
            assert len(data['rubricInputPlan']) == 23
            assert all(r['selectedPoints'] is None and r['assessmentSource'] != 'HUMAN' for r in data['rubricInputPlan'])
            count += len(data['requiredAccountingInputs'])
            facts += len(data['factEvidence'])
        assert db.execute('PRAGMA integrity_check').fetchone()[0] == 'ok'
        assert not db.execute('PRAGMA foreign_key_check').fetchall()
    reconciled = load(OUT / 'input-gap-reconciliation.json')
    counts = collections.Counter(r['status'] for t in reconciled['tickers'] for r in t['rows'])
    assert dict(counts) == reconciled['counts'] and sum(counts.values()) == count
    for t in reconciled['tickers']:
        for row in t['rows']:
            if row['status'] == 'EXISTS_IN_STANDALONE_SCOPE_NOT_A_MISSING_VALUE':
                assert row['candidates'] and all(c['originalScope'] == 'STANDALONE' for c in row['candidates'])
    counter = reconciled['qualifiedDataStillMissing'][0]['visuallyCheckedCounterexample']
    assert counter['actualCARDatePerFootnote'] != counter['columnHeading']
    assert reconciled['ownerSupplementRequests'] == []
    assert sha(ROOT / 'data/vn30.sqlite') == manifest['databaseSha256']
    result = {'status': 'PASS_REVIEW_DOSSIER_INTEGRITY_NOT_SCORING_ACCEPTANCE',
              'downloadedPdfHashesVerified': downloaded, 'failedSourceInventoryEntries': len(audit['documents']) - downloaded,
              'visualHeaders': 30, 'requiredInputRows': count, 'retainedFactsUnchanged': facts,
              'scopeVocabularyGapsNotMisreportedAsMissingValues': counts['EXISTS_IN_STANDALONE_SCOPE_NOT_A_MISSING_VALUE'],
              'criteriaCount': 15, 'rubricsPerTicker': 23, 'databaseUnchanged': True,
              'humanReviewerRequired': False, 'formalScoringAuthorized': False}
    (OUT / 'verification.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result))


if __name__ == '__main__':
    main()
