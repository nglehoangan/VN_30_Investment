"""Append supplements to active display indexes, preserving all old values/variants."""
import copy
import hashlib
import json
from pathlib import Path
import shutil
import sys

ROOT = Path(__file__).resolve().parents[1]
RECOVERY = '--source-recovery' in sys.argv
BASE = ROOT / ('data/manual-extracted-pdf/supplements/2026-10-30-b6-r1' if RECOVERY else 'data/manual-extracted-pdf/supplements/2026-10-29-b6-r1')
OUT = ROOT / ('docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-30/b6-close-inputs-r1' if RECOVERY else 'docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-29/b6-integration-r1')
BACKUP = ROOT / ('backups/2026-10-30-b6-close-inputs/presentation-before' if RECOVERY else 'backups/2026-10-29-b6-data-integration/presentation-before')


def load(path):
    return json.loads(path.read_text())


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def esc(text):
    return text.replace('~', '~0').replace('/', '~1')


def main():
    assert not BACKUP.exists(), 'ALREADY_INTEGRATED'
    processing = load(BASE / 'manifest.json')
    assert processing['complete'] and not any(d['errors'] for d in processing['documents'])
    annual = {'records': []} if RECOVERY else load(OUT.parent / 'annual-download-r1/download-manifest.json')
    retry = {'records': []} if RECOVERY else load(OUT.parent / 'document-retry-r1/download-manifest.json')
    captures = {}
    if RECOVERY:
        for name in ['archive-recovery-network.json', 'archive-recovery-candidates.json', 'archive-recovery-additional.json', 'archive-recovery-last.json']:
            for r in load(OUT / name)['records']:
                for member in r['members']:
                    capture = {'ticker': r['ticker'], 'path': member['path'], 'sha256': member['sha256'], 'status': 'DOWNLOADED',
                               'retrievedAt': r['retrievedAt'], 'httpStatus': 200, 'url': r['url'], 'filename': Path(member['path']).name,
                               'acquisitionReceipt': str((OUT / name).relative_to(ROOT))}
                    if member['archiveEntry'] is not None:
                        capture.update(archiveEntry=member['archiveEntry'], archiveSha256=r['sha256'], archivePath=r['path'])
                    captures[member['path']] = capture
    for r in annual['records']:
        for p in r['pdfs']:
            captures[p['path']] = {'ticker': r['ticker'], 'path': p['path'], 'sha256': p['sha256'],
                                  'status': 'DOWNLOADED', 'retrievedAt': r['archive']['retrievedAt'],
                                  'httpStatus': 200, 'url': r['archive']['url'], 'archiveEntry': p['archiveEntry'],
                                  'archiveSha256': r['archive']['sha256'], 'filename': Path(p['path']).name}
    for r in retry['records']:
        if r['status'] == 'DOWNLOADED':
            captures[r['path']] = {'ticker': r['ticker'], 'path': r['path'], 'sha256': r['sha256'], 'status': 'DOWNLOADED',
                                   'retrievedAt': r['finishedAt'], 'httpStatus': 200, 'url': r['url'], 'filename': Path(r['path']).name}
    paths = ['data/manual-download/manifest.json', 'data/manual-extracted-pdf/manifest.json',
             'data/manual-extracted-pdf/display-manifest.json', 'data/combine/manifest.json']
    tickers = sorted({d['ticker'] for d in processing['documents']})
    paths += [f'data/{folder}/{ticker}.json' for ticker in tickers for folder in ['manual-extracted-pdf', 'combine']]
    before = {}
    for rel in paths:
        source = ROOT / rel; target = BACKUP / rel; target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, target); before[rel] = sha(source)
    downloads = load(ROOT / paths[0]); extraction = load(ROOT / paths[1]); display = load(ROOT / paths[2]); combine = load(ROOT / paths[3])
    changes = []
    try:
        for ticker in tickers:
            pp = ROOT / f'data/manual-extracted-pdf/{ticker}.json'; cp = ROOT / f'data/combine/{ticker}.json'
            pdf = load(pp); combined = load(cp); old_pdf = copy.deepcopy(pdf); old_combined = copy.deepcopy(combined)
            new_rows = new_variants = 0
            for d in processing['documents']:
                if d['ticker'] != ticker:
                    continue
                assert sha(ROOT / d['path']) == d['sha256']
                supplemental = load(ROOT / d['path']); capture = captures[d['sourcePath']]
                for rk, report in supplemental['reports'].items():
                    for pk, period in report['periods'].items():
                        target_report = pdf['reports'].setdefault(rk, {'key': rk, 'label': report['label'], 'periods': {}})
                        target_period = target_report['periods'].setdefault(pk, {k: copy.deepcopy(v) for k, v in period.items() if k != 'variants'})
                        target_period.setdefault('variants', [])
                        cr = combined['reports'].setdefault(rk, {'key': rk, 'label': report['label'], 'periods': {}})
                        cperiod = cr['periods'].setdefault(pk, {k: copy.deepcopy(v) for k, v in period.items() if k != 'variants'})
                        cperiod.setdefault('variants', [])
                        for variant in period['variants']:
                            v = copy.deepcopy(variant); vi = len(target_period['variants'])
                            v['source'] = {'provider': 'MANUAL_PDF', 'payloadHash': d['sourceSha256'], 'rawPayloadHash': d['sourceSha256'],
                                           'retainedPath': d['sourcePath'], 'rawPayloadLocation': d['sourcePath'], 'pdfPath': d['sourcePath'],
                                           'retrievedAt': capture['retrievedAt'], 'evidenceMode': 'DIRECT_PDF'}
                            v['productionAdmissible'] = False
                            for gi, group in enumerate(v['groups']):
                                for ri, row in enumerate(group['rows']):
                                    row['source'] = 'PDF_REPORTED'; row['policyVersion'] = 'report-display-source-priority-v2'
                                    row['reviewReasons'] = ['SUPPLEMENTAL_OCR_CAPTION_PERIOD_UNIT_SCOPE_REVIEW_REQUIRED']
                                    evidence = row['pdfEvidence']; evidence['path'] = f'data/manual-extracted-pdf/{ticker}.json'
                                    evidence['jsonPointer'] = f'/reports/{esc(rk)}/periods/{esc(pk)}/variants/{vi}/groups/{gi}/rows/{ri}'
                                    new_rows += 1
                            target_period['variants'].append(v); cperiod['variants'].append(copy.deepcopy(v)); new_variants += 1
                extraction['documents'].append({'sourceHash': d['sourceSha256'], 'ticker': ticker,
                                                'retainedPaths': [d['sourcePath']], 'pdfPath': d['sourcePath'],
                                                'pageCount': d['pages'], 'methods': {'SUPPLEMENTAL_DIRECT_PDF_EXTRACTION': d['pages']},
                                                'errors': [], 'supplementalExtractionPath': d['path'], 'evidenceMode': 'DIRECT_PDF'})
            # Exact old-prefix comparison; no old source value, variant, order or metadata changed.
            for old, current in [(old_pdf, pdf), (old_combined, combined)]:
                for rk, r in old['reports'].items():
                    for pk, p in r['periods'].items():
                        assert current['reports'][rk]['periods'][pk]['variants'][:len(p['variants'])] == p['variants']
            pp.write_text(json.dumps(pdf, ensure_ascii=True, separators=(',', ':')) + '\n')
            cp.write_text(json.dumps(combined, ensure_ascii=True, separators=(',', ':')) + '\n')
            next(f for f in display['files'] if f['ticker'] == ticker)['sha256'] = sha(pp)
            cm = next(f for f in combine['files'] if f['ticker'] == ticker); cm['sha256'] = sha(cp)
            cm['selections'] = {s: sum(row.get('source') == s for r in combined['reports'].values() for p in r['periods'].values()
                                       for v in p['variants'] for g in v['groups'] for row in g['rows'])
                                for s in ['PDF_REPORTED', 'PDF_EXPLICIT_AGGREGATE', 'CAFEF_REFERENCE', 'MISSING', 'UNRESOLVED_MAPPING']}
            changes.append({'ticker': ticker, 'newRows': new_rows, 'newVariants': new_variants})
        for capture in captures.values():
            assert not any(r.get('path') == capture['path'] for r in downloads['requests'])
            downloads['requests'].append(capture)
        for alias in processing['aliases']:
            extraction['documents'].append({'sourceHash': alias['sha256'], 'ticker': alias['ticker'],
                                             'retainedPaths': [alias['path']], 'pdfPath': alias['path'], 'pageCount': 132,
                                             'methods': {'HASH_IDENTICAL_REUSED_EXTRACTION': 132}, 'errors': [],
                                             'evidenceMode': 'DIRECT_PDF', 'existingPresentation': alias['existingPresentation']})
        extraction['physicalPdfCount'] = sum(r['status'] == 'DOWNLOADED' for r in downloads['requests'])
        extraction['uniquePdfCount'] = len({r['sha256'] for r in downloads['requests'] if r['status'] == 'DOWNLOADED'})
        for rel, body in zip(paths[:4], [downloads, extraction, display, combine]):
            (ROOT / rel).write_text(json.dumps(body, ensure_ascii=True, separators=(',', ':')) + '\n')
    except BaseException:
        for rel in paths:
            shutil.copyfile(BACKUP / rel, ROOT / rel)
        raise
    receipt = {'status': 'PASS_APPEND_ONLY_DISPLAY_INTEGRATION', 'changes': changes,
               'previousValuesAndVariantsUnchanged': True, 'databaseNotModified': True, 'productionAdmissible': False,
               'beforePins': [{'path': rel, 'sha256': digest, 'backupPath': str((BACKUP / rel).relative_to(ROOT))} for rel, digest in before.items()],
               'afterPins': [{'path': rel, 'sha256': sha(ROOT / rel)} for rel in paths]}
    (OUT / 'presentation-integration.json').write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'tickers': len(tickers), 'changes': changes, 'previousValuesUnchanged': True}))


if __name__ == '__main__':
    main()
