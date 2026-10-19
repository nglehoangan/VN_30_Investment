"""Verify PDF/reader provenance, full notes-page coverage and lossless OCR references."""
import collections
import hashlib
import importlib.util
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('extract_vnm_notes', ROOT / 'scripts/extract-vnm-notes.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
BASE = module.OUTPUT


def read(path):
    return json.loads(path.read_text())


def pointer(value, locator):
    for key in locator.strip('/').split('/'):
        value = value[int(key)] if isinstance(value, list) else value[key]
    return value


def verify():
    manifest = read(BASE / 'manifest.json')
    aggregate = read(BASE / 'VNM.json')
    index = read(ROOT / 'data/comparisons/VN30/VNM/notes-index.json')
    assert len(manifest['documents']) == 5
    report = {'status': 'PASS', 'productionAdmissible': False, 'periods': [],
              'limitations': 'Structural and source-traceability verification; not full visual or accounting approval.'}
    for doc in manifest['documents']:
        source = doc['document']
        period = doc['period']
        assert hashlib.sha256((ROOT / source['pdfPath']).read_bytes()).hexdigest() == source['sha256'] == module.EXPECTED[period]
        assert not doc['failedPages']
        per = read(ROOT / doc['file'])
        key = '2026-YTD2' if period == '6M2026' else period[2:]
        value = per['reports']['thuyet-minh']['periods'][key]
        assert value == aggregate['reports']['thuyet-minh']['periods'][key]
        variant = value['variants'][0]
        assert variant['source']['periodType'] == ('YTD' if period == '6M2026' else 'ANNUAL')
        groups = variant['groups']
        assert len({g['id'] for g in groups}) == len(groups)
        inv = read(BASE / 'inventory' / f'{period}.json')['pages']
        assert [p['physicalPage'] for p in inv] == list(range(1, source['pageCount'] + 1))
        raw = {p['physicalPage']: read(ROOT / p['rawPath']) for p in inv}
        seen = collections.defaultdict(list)
        for group in groups:
            for row in group['rows']:
                assert row['productionAdmissible'] is False
                assert row['label'] == ' '.join(c['text'] for c in row['cells'])
                page = raw[row['sourcePage']]
                for cell in row['cells']:
                    original = pointer(page, cell['rawLocator'])
                    assert original['text'] == cell['text']
                    seen[row['sourcePage']].append(int(cell['rawLocator'].rsplit('/', 1)[-1]))
                    for token in cell['numericCandidates']:
                        start, end = token['characterSpan']
                        assert cell['text'][start:end].strip() == token['lexicalValue'].strip()
                        assert token['value'] is None or isinstance(token['value'], str)
                        if token['status'] == 'EXPLICIT_DASH_NOT_ZERO':
                            assert token['value'] is None
        for page in inv:
            n = page['physicalPage']
            assert raw[n]['sourceHash'] == source['sha256']
            if page['isNotesPage']:
                assert sorted(seen[n]) == list(range(len(raw[n]['observations']))), (period, n, 'DROPPED_OR_DUPLICATED_OBSERVATION')
            else:
                assert not seen[n]
        borrowings = [g for g in groups if module.normalized(g['label']).strip() == 'vay' and g['noteNumber'] == 15]
        assert len(borrowings) == 1, (period, 'BORROWING_NOTE_IDENTITY')
        group = borrowings[0]
        pages = sorted({r['sourcePage'] for r in group['rows']})
        expected_pages = {'FY2022': [47, 48], 'FY2023': [46, 47], 'FY2024': [47, 48], 'FY2025': [47, 48], '6M2026': [52, 53]}[period]
        assert all(p in pages for p in expected_pages), (period, pages)
        for entry in index['periods'][key]['notes']:
            assert pointer(per, entry['jsonPointer'])['id'] == entry['id']
        report['periods'].append({'period': period, 'pdfPages': source['pageCount'],
                                  'notesPages': doc['notesPages'], 'rows': doc['rows'],
                                  'borrowingNoteId': group['id'], 'borrowingPhysicalPages': pages,
                                  'allNotesObservationsRetainedExactlyOnce': True})
    # Regression boundaries: dash, zero, explicit signed amounts, and ambiguous format.
    assert module.numeric_candidates('-')[0]['value'] is None
    assert module.numeric_candidates('0')[0]['value'] == '0'
    assert module.numeric_candidates('(20.750.493.750)')[0]['value'] == '-20750493750'
    assert module.numeric_candidates('58.472.984.36')[0]['value'] is None
    assert module.numeric_candidates('- 39.859.560.000')[0]['status'] == 'EXPLICIT_DASH_NOT_ZERO'
    for path, digest in read(BASE / 'ARTIFACT_HASHES.json')['files'].items():
        assert hashlib.sha256((ROOT / path).read_bytes()).hexdigest() == digest, path
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return report


if __name__ == '__main__':
    verify()
