"""Pin the actual TCX dividend-share action; do not retroactively adjust EPS."""
import datetime, hashlib, json, pathlib, runpy

B = pathlib.Path('data/initialization-08b-remediation-work')
R = runpy.run_path('scripts/reconcile-08b-extraction.py')
recovery = json.loads((B / 'tcx-current-capital-action-recovery.json').read_text())
assert len(recovery['documents']) == 1 and not recovery['exceptions']
d = recovery['documents'][0]
body = d['bodyHash']
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
assert sha(B / (body + '.pdf')) == body
proofs = []
anchors = {
    1: ['TCX', '25/09/2026'],
    2: ['September 25, 2026', 'TCBS website'],
    9: ['Cổ phiếu phổ thông', '2.774.453.325', '554.886.498',
        '3.329.339.823', '18/09/2026', '5:1', '4.167'],
}
for page, required in anchors.items():
    f = B / 'ocr' / f'{body}-p{page}.json'
    p = json.loads(f.read_text())
    assert p['bodyHash'] == body and p['page'] == page
    assert p['engineA'] != p['engineB']
    assert sha(f.with_suffix('.png')) == p['renderSha256']
    for stream in ['passA', 'passB']:
        text = R['compact'](R['full_text'](p, stream))
        for anchor in required:
            assert R['compact'](anchor) in text, (page, stream, anchor)
    proofs.append({'file': str(f), 'sha256': sha(f), 'page': page,
                   'renderSha256': p['renderSha256'],
                   'extractionMethod': p['engineA'], 'verificationMethod': p['engineB']})
out = {
    'id': 'TCX-DIVIDEND-SHARES-2026-09-18', 'ticker': 'TCX',
    'status': 'TWO_READER_CORPORATE_ACTION_EVIDENCE_REVIEW_CANDIDATE',
    'reviewedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'reviewer': 'CODEX_DATA_PRODUCER_MACHINE_READER', 'independentHumanApproval': None,
    'source': d, 'sourcePageProofs': proofs,
    'completionDate': '2026-09-18', 'issuerPublicationDate': '2026-09-25',
    'publicationPrecision': 'DATE_ONLY', 'shareClass': 'ORDINARY_COMMON',
    'sharesBefore': '2774453325', 'sharesIssued': '554886498',
    'sharesAfter': '3329339823', 'allocationRatio': {'oldShares': 5, 'newShares': 1},
    'fractionalSharesCancelled': '4167',
    'limitations': [
        'Completion date does not establish listing or first trading date.',
        'Historical weighted-average shares and EPS require their own period and adjustment lineage.',
        'Not substituted into June 2026 balances or used to backdate system knowledge.',
        'No assumption that this is the latest share count without subsequent-action verification.',
    ],
}
assert int(out['sharesBefore']) + int(out['sharesIssued']) == int(out['sharesAfter'])
(B / 'tcx-capital-action-evidence.json').write_text(json.dumps(out, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'status': out['status'], 'pages': len(proofs), 'sharesAfter': out['sharesAfter']}))
