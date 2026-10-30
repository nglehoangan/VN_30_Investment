"""Independently verify frozen review rows against retained JSON and read-only DB."""
import gzip
import hashlib
import json
from pathlib import Path
import sqlite3
import sys


def sha(data):
    return hashlib.sha256(data).hexdigest()


def load(path):
    data = path.read_bytes()
    return json.loads(gzip.decompress(data) if path.suffix == '.gz' else data)


def pointer(value, locator):
    for part in locator[1:].split('/'):
        key = part.replace('~1', '/').replace('~0', '~')
        value = value[int(key)] if isinstance(value, list) else value[key]
    return value


def main():
    root = Path(__file__).resolve().parents[1]
    folder = root / (sys.argv[1] if len(sys.argv) > 1 else
                     'docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-29/normalized-r1')
    manifest = load(folder / 'manifest.json')
    assert manifest['classification'] == 'REVIEW_CANDIDATE'
    assert manifest['productionAdmissible'] is False
    assert manifest['scoringAuthorized'] is False
    for pin in manifest['sourcePins'] + manifest['artifacts'] + [manifest['implementation']]:
        path = (root / pin['path']).resolve()
        assert path.is_relative_to(root)
        assert sha(path.read_bytes()) == pin['sha256'], str(path)
    total = numeric = nulls = variants = canonical = 0
    with sqlite3.connect('file:' + str(root / 'data/vn30.sqlite') + '?mode=ro', uri=True) as db:
        assert db.execute('PRAGMA integrity_check').fetchone()[0] == 'ok'
        assert not db.execute('PRAGMA foreign_key_check').fetchall()
        for member in load(folder / 'market.json')['members']:
            if member['price'] is None:
                continue
            record = db.execute('SELECT body,body_hash FROM broker_observation WHERE id=?',
                                [member['observationId']]).fetchone()
            assert sha(record[0].encode()) == member['bodyHash'] == record[1]
            assert json.loads(record[0]) == member['price']
        for artifact in manifest['artifacts']:
            if '/fundamentals/' not in artifact['path']:
                continue
            frozen = load(root / artifact['path'])
            original = load(root / frozen['source']['path'])
            expected_rows = sum(len(g['rows']) for report in original['reports'].values()
                                for period in report['periods'].values()
                                for v in period['variants'] for g in v['groups'])
            variants += sum(len(p['variants']) for report in original['reports'].values()
                            for p in report['periods'].values())
            assert len(frozen['rows']) == expected_rows
            assert len({r['sourcePointer'] for r in frozen['rows']}) == expected_rows
            for row in frozen['rows']:
                source = pointer(original, row['sourcePointer'])
                assert row['original'] == source
                assert row['id'] == sha((frozen['source']['path'] + '#' + row['sourcePointer']).encode())
                if source['value'] is None:
                    nulls += 1
                else:
                    assert isinstance(source['value'], str)
                    numeric += 1
                total += 1
            for admission in frozen['retainedAdmissions']:
                record = db.execute('SELECT body,body_hash FROM fundamental_admission_run WHERE id=?',
                                    [admission['id']]).fetchone()
                assert sha(record[0].encode()) == admission['bodyHash'] == record[1]
                assert json.loads(record[0]) == admission['original']
                canonical += len(admission['original']['canonicalFacts'])
    actual = {'presentationRows': total, 'numericRows': numeric, 'nullRows': nulls,
              'variants': variants, 'retainedCanonicalFacts': canonical}
    assert actual == load(folder / 'validation.json')['counts']
    print(json.dumps({'status': 'PASS_EXACT_SOURCE_ROUNDTRIP', 'counts': actual,
                      'allArtifactsAndSourcesHashVerified': True,
                      'sealedDatabaseRowsUnchanged': True,
                      'databaseFileStillIdentical': sha((root / manifest['database']['path']).read_bytes()) == manifest['database']['sha256'],
                      'formalAcceptanceGranted': False}))


if __name__ == '__main__':
    main()
