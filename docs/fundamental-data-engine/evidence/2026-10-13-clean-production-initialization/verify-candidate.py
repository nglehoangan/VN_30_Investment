"""Read-only verification of this stopped run; does not certify production readiness."""
import hashlib
import json
import pathlib

OUT = pathlib.Path(__file__).resolve().parent
ROOT = OUT.parents[3]


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    sealed = json.loads((OUT / 'ARTIFACT_HASHES.json').read_text())
    artifacts = sealed['artifacts']
    forward = sorted(artifacts, key=lambda row: row['path'])
    reverse = sorted(reversed(artifacts), key=lambda row: row['path'])
    assert forward == reverse
    encoded = json.dumps(forward, sort_keys=True, separators=(',', ':')).encode()
    assert hashlib.sha256(encoded).hexdigest() == sealed['manifestDigest']
    actual_paths = {str(p.relative_to(OUT)) for p in OUT.rglob('*') if p.is_file() and p.name != 'ARTIFACT_HASHES.json'}
    assert actual_paths == {row['path'] for row in artifacts}, 'UNSEALED_OR_MISSING_ARTIFACT'
    for row in artifacts:
        assert sha(OUT / row['path']) == row['sha256'], 'ARTIFACT_TAMPER: ' + row['path']
    preserved = json.loads((OUT / 'HISTORICAL_EVIDENCE_PRESERVATION.json').read_text())['files']
    for row in preserved:
        assert sha(ROOT / row['path']) == row['sha256'], 'HISTORY_CHANGED: ' + row['path']
    manifest = json.loads((OUT / 'PRODUCTION_SOURCE_MANIFEST.json').read_text())
    for row in manifest['documents']:
        assert sha(ROOT / row['path']) == row['sha256'], 'SOURCE_BODY_CHANGED'
        evidence = row['freshTextEvidence']
        assert sha(ROOT / evidence['path']) == evidence['sha256'], 'FRESH_READER_CHANGED'
    database = json.loads((OUT / 'PRODUCTION_DATABASE_IDENTITY.json').read_text())
    assert sha(ROOT / database['database']['path']) == database['database']['sha256'], 'DATABASE_CHANGED'
    for row in database['migrationFiles']:
        assert sha(ROOT / row['path']) == row['sha256'], 'MIGRATION_CHANGED'
    authority = json.loads((OUT / 'PRODUCTION_AUTHORITY_APPROVAL_CANDIDATE.json').read_text())
    for key in ['registry', 'derivationCrosswalk']:
        assert sha(ROOT / authority[key]['path']) == authority[key]['sha256'], 'RELEASE_CHANGED'
    pre = json.loads((OUT / 'PRE_ADMISSION_CONTENT_IDENTITY.json').read_text())
    content = pre['manifest']
    encoded_content = json.dumps(content, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()
    assert hashlib.sha256(encoded_content).hexdigest() == pre['evidenceContentHash']
    reverse_content = {**content,
                       'documents': sorted(reversed(content['documents']), key=lambda row: row['path']),
                       'referenceSources': sorted(reversed(content['referenceSources']), key=lambda row: row['url'])}
    assert json.dumps(reverse_content, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode() == encoded_content
    assert {row['sha256'] for row in content['documents']} == {row['sha256'] for row in manifest['documents']}
    snapshot = json.loads((OUT / 'PRODUCTION_SNAPSHOT_MANIFEST.json').read_text())
    assert snapshot['snapshotRunId'] is None and snapshot['contentHash'] is None
    assert snapshot['unsafeSelected'] == 0
    print(json.dumps({'artifactHashes': 'PASS', 'historicalEvidence': 'UNCHANGED',
                      'sourceBodies': len(manifest['documents']), 'databaseIdentity': 'PASS',
                      'packageManifestOrderReplay': 'PASS', 'productionSnapshotReplay': 'NOT_EXECUTED',
                      'productionReadiness': 'NOT_READY'}))


if __name__ == '__main__':
    main()
