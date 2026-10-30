"""Complete append-only document/note inventory and refresh active provenance hashes."""
import copy
import hashlib
import json
from pathlib import Path
import shutil
import sys

ROOT = Path(__file__).resolve().parents[1]
RECOVERY = '--source-recovery' in sys.argv
OUT = ROOT / ('docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-30/b6-close-inputs-r1' if RECOVERY else 'docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-29/b6-integration-r1')
BASE = ROOT / ('data/manual-extracted-pdf/supplements/2026-10-30-b6-r1' if RECOVERY else 'data/manual-extracted-pdf/supplements/2026-10-29-b6-r1')
BACKUP = ROOT / ('backups/2026-10-30-b6-close-inputs/presentation-before' if RECOVERY else 'backups/2026-10-29-b6-data-integration/presentation-before')


def load(p):
    return json.loads(p.read_text())


def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


def write(p, x):
    p.write_text(json.dumps(x, ensure_ascii=True, separators=(',', ':')) + '\n')


def main():
    assert not (OUT / 'presentation-final-indexes.json').exists()
    manifest = load(BASE / 'manifest.json')
    display = load(ROOT / 'data/manual-extracted-pdf/display-manifest.json')
    combined_manifest = load(ROOT / 'data/combine/manifest.json')
    notes_path = ROOT / 'data/manual-extracted-pdf/notes/manifest.json'
    nmanifest = load(notes_path)
    backup = BACKUP / notes_path.relative_to(ROOT); backup.parent.mkdir(parents=True, exist_ok=True);shutil.copyfile(notes_path, backup)
    changes = []
    for ticker in sorted({d['ticker'] for d in manifest['documents']}):
        pp = ROOT / f'data/manual-extracted-pdf/{ticker}.json'; cp = ROOT / f'data/combine/{ticker}.json'
        np = ROOT / f'data/manual-extracted-pdf/notes/{ticker}.json'
        backup = BACKUP / np.relative_to(ROOT);backup.parent.mkdir(parents=True, exist_ok=True);shutil.copyfile(np, backup)
        pdf, combined, notes = load(pp), load(cp), load(np)
        old_notes = copy.deepcopy(notes['documents'])
        for item in manifest['documents']:
            if item['ticker'] != ticker:
                continue
            extracted = load(ROOT / item['path'])
            inventory = {'sourceHash': item['sourceSha256'], 'retainedPaths': [item['sourcePath']], 'pdfPath': item['sourcePath'],
                         'pageCount': item['pages'], 'identity': None, 'identityStatus': 'SUPPLEMENTAL_REVIEW_IN_PROGRESS',
                         'pages': [{'page': p['page'], 'status': p['status'], 'method': p.get('method'), 'reportKey': p.get('reportCandidate'),
                                    'pdfEvidence': p['pdfEvidence']} for p in extracted['notes']], 'evidenceMode': 'DIRECT_PDF'}
            assert not any(d['sourceHash'] == item['sourceSha256'] for d in pdf['documents'])
            pdf['documents'].append(inventory)
            notes['documents'].append({'sourceHash': item['sourceSha256'], 'pdfPaths': [item['sourcePath']], 'identity': None,
                                       'pageCount': item['pages'], 'pages': extracted['notes']})
            display['documents'].append({'ticker': ticker, 'sourceHash': item['sourceSha256'], 'retainedPaths': [item['sourcePath']],
                                         'pdfPath': item['sourcePath'], 'pageCount': item['pages'], 'status': 'RAW_READ_COMPLETE_TABLES_REQUIRE_REVIEW',
                                         'primaryReportsFound': [k for k in ['can-doi-ke-toan', 'ket-qua-kinh-doanh', 'luu-chuyen-tien-te'] if extracted['reports'][k]['periods']],
                                         'primaryReportsMissing': [k for k in ['can-doi-ke-toan', 'ket-qua-kinh-doanh', 'luu-chuyen-tien-te'] if not extracted['reports'][k]['periods']]})
        assert notes['documents'][:len(old_notes)] == old_notes
        write(pp, pdf);write(np, notes)
        for source in combined['sourceFiles']:
            source['sha256'] = sha(ROOT / source['path'])
        combined['notes']['sha256'] = sha(np)
        write(cp, combined)
        next(f for f in display['files'] if f['ticker'] == ticker)['sha256'] = sha(pp)
        next(f for f in combined_manifest['files'] if f['ticker'] == ticker)['sha256'] = sha(cp)
        # Notes manifest layouts from earlier rebuilds use ticker/file/hash fields.
        for entry in nmanifest.get('files', []):
            if entry.get('ticker') == ticker:
                entry['sha256'] = sha(np)
        changes.append({'ticker': ticker, 'pdfSha256': sha(pp), 'combinedSha256': sha(cp), 'notesSha256': sha(np)})
    stats = display['statistics']
    stats['documents'] = len(display['documents'])
    stats['pages'] = sum(d['pageCount'] for d in display['documents'])
    rows = columns = missing_labels = unresolved = 0
    pages_with_tables = set()
    primary_variants = {k: 0 for k in ['can-doi-ke-toan', 'ket-qua-kinh-doanh', 'luu-chuyen-tien-te']}
    for file in display['files']:
        pdf = load(ROOT / ('data/manual-extracted-pdf/' + file['file'] if 'file' in file else file['path']))
        for rk, r in pdf['reports'].items():
            for pk, p in r['periods'].items():
                columns += len(p['variants'])
                if rk in primary_variants:
                    primary_variants[rk] += len(p['variants'])
                unresolved += len(p['variants']) if pk.startswith('UNRESOLVED') else 0
                for v in p['variants']:
                    for g in v['groups']:
                        rows += len(g['rows']);missing_labels += sum(row['label'] is None for row in g['rows'])
                        page = g.get('sourcePage') or next((row.get('pdfEvidence', {}).get('page') for row in g['rows'] if row.get('pdfEvidence', {}).get('page')), None)
                        if page is not None:
                            pages_with_tables.add((v['source'].get('payloadHash'), page))
    stats.update({'rows': rows, 'tableColumns': columns, 'missingLabels': missing_labels, 'unresolvedPeriodColumns': unresolved})
    if RECOVERY:
        stats.update(pagesWithTables=len(pages_with_tables), primaryReports=primary_variants,
                     primaryReportCountSemantics='PRESENTATION_VARIANTS_NOT_UNIQUE_DOCUMENTS')
    write(ROOT / 'data/manual-extracted-pdf/display-manifest.json', display)
    write(notes_path, nmanifest)
    write(ROOT / 'data/combine/manifest.json', combined_manifest)
    receipt = {'status': 'PASS_COMPLETE_SUPPLEMENTAL_DOCUMENT_NOTE_AND_SOURCE_INDEXES', 'changes': changes,
               'priorNotesPreserved': True, 'rawOcrReadersRecreated': False, 'supplementalRawIntermediateFiles': False,
               'statistics': stats, 'productionAdmissible': False}
    (OUT / 'presentation-final-indexes.json').write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'tickers': len(changes), 'rows': rows, 'columns': columns, 'documents': stats['documents']}))


if __name__ == '__main__':
    main()
