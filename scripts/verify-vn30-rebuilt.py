"""Verify the rebuilt corpus, lossless API lineage and PDF-first decisions."""
import collections
from decimal import Decimal
import gzip
import hashlib
import json
from pathlib import Path
import sqlite3
import pymupdf

ROOT = Path(__file__).resolve().parents[1]
CONTROL = ROOT / 'docs/fundamental-data-engine/rebuild-2026-10-19'


def load(path):
    body = path.read_bytes()
    return json.loads(gzip.decompress(body) if path.suffix == '.gz' else body,
                      parse_float=Decimal)


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def resolve(value, locator):
    assert locator.startswith('/')
    for part in locator[1:].split('/'):
        key = part.replace('~1', '/').replace('~0', '~')
        value = value[int(key)] if isinstance(value, list) else value[key]
    return value


def rows(data):
    for report in data['reports'].values():
        for key, period in report['periods'].items():
            ids = []
            for variant in period['variants']:
                ids.append(variant['id'])
                for group in variant['groups']:
                    assert len({r['id'] for r in group['rows']}) == len(group['rows'])
                    for row in group['rows']:
                        yield key, variant, row
            assert len(ids) == len(set(ids)), 'DUPLICATE_CAPTURE_VARIANT_ID'


def main():
    plan = load(CONTROL / 'source-plan.json')
    receipt = load(CONTROL / 'reset-receipt.json')
    expected = {'vn30.sqlite', 'manual-download', 'manual-extracted-pdf', 'manual-extracted-api', 'combine'}
    assert {p.name for p in (ROOT / 'data').iterdir()} == expected
    assert sha(ROOT / 'data/vn30.sqlite') == receipt['databaseSha256Before']
    with sqlite3.connect('file:' + str(ROOT / 'data/vn30.sqlite') + '?mode=ro&immutable=1', uri=True) as db:
        assert db.execute('PRAGMA integrity_check').fetchone()[0] == 'ok'
        assert not db.execute('PRAGMA foreign_key_check').fetchall()
    downloads = load(ROOT / 'data/manual-download/manifest.json')
    assert downloads['complete'] and len(downloads['requests']) == len(plan['sources'])
    good = [r for r in downloads['requests'] if r['status'] == 'DOWNLOADED']
    physical_pages = {}
    for request in good:
        path = ROOT / request['path']
        assert sha(path) == request['sha256']
        assert path.read_bytes().startswith(b'%PDF-')
        with pymupdf.open(path) as document:
            assert len(document) > 0
            physical_pages[request['sha256']] = len(document)
    assert {r['ticker'] for r in good} == set(plan['tickers'])
    raw_manifest = load(ROOT / 'data/manual-extracted-pdf/manifest.json')
    assert raw_manifest['complete']
    assert not any(d['errors'] for d in raw_manifest['documents']), 'PDF_PAGE_READ_ERRORS_REQUIRE_RETRY'
    assert raw_manifest['physicalPdfCount'] == len(good)
    assert raw_manifest['uniquePdfCount'] == len({r['sha256'] for r in good})
    for document in raw_manifest['documents']:
        assert document['pageCount'] == physical_pages[document['sourceHash']], 'PDF_PAGES_MISSING_FROM_READER'
    pdf_verify = load(ROOT / 'data/manual-extracted-pdf/verification.json')
    assert pdf_verify['status'] in ['PASS_LEXICAL_LINEAGE_AND_COVERAGE', 'PASS_DIRECT_PDF_REFERENCE_AND_COVERAGE']
    direct_pdf = raw_manifest.get('evidenceMode') == 'DIRECT_PDF'
    pdf_paths = {r['path']: r['sha256'] for r in good}
    def check_pdf(evidence):
        assert evidence['path'] in pdf_paths
        assert 1 <= evidence['page'] <= physical_pages[pdf_paths[evidence['path']]]
        assert evidence['href'] == evidence['path'] + '#page=' + str(evidence['page'])
    inventory = load(ROOT / 'data/manual-extracted-api/requests.json')
    for request in inventory:
        assert sha(ROOT / request['rawPayloadLocation']) == request['payloadHash']
    api_manifest = load(ROOT / 'data/manual-extracted-api/manifest.json')
    assert api_manifest['complete'] and len(api_manifest['files']) == 30
    combine_manifest = load(ROOT / 'data/combine/manifest.json')
    assert combine_manifest['complete'] and len(combine_manifest['files']) == 30
    for manifest in [api_manifest, combine_manifest]:
        for item in manifest['files']:
            assert sha(ROOT / item['path']) == item['sha256']
    cache = {}
    file_hashes = {}

    def source(path, expected_hash=None):
        if expected_hash is not None:
            if path not in file_hashes:
                file_hashes[path] = sha(ROOT / path)
            assert file_hashes[path] == expected_hash, 'RAW_PAGE_EVIDENCE_HASH_MISMATCH'
        if path not in cache:
            cache[path] = load(ROOT / path)
        return cache[path]

    api_cells = note_pages = combined_cells = excluded_count = 0
    api_period_gaps = []
    selections = collections.Counter()
    for ticker in plan['tickers']:
        cache.clear()
        file_hashes.clear()
        api = load(ROOT / f'data/manual-extracted-api/{ticker}.json')
        assert api['productionAdmissible'] is False
        for _, variant, row in rows(api):
            assert row['value'] is None or isinstance(row['value'], str)
            if row['rawLocator'] is not None:
                original = resolve(source(variant['source']['rawPayloadLocation']), row['rawLocator'])
                assert (original is None and row['value'] is None) or Decimal(str(original)) == Decimal(row['value'])
            else:
                assert row['status'] == 'MISSING_CELL' and row['value'] is None
            api_cells += 1
        for report in api['reports'].values():
            missing = [y for y in range(2022, 2026) if str(y) not in report['periods']]
            if missing:
                api_period_gaps.append({'ticker': ticker, 'report': report['key'], 'missingAnnualYears': missing})
        notes = load(ROOT / f'data/manual-extracted-pdf/notes/{ticker}.json')
        pdf = source(f'data/manual-extracted-pdf/{ticker}.json')
        assert sum(d['pageCount'] for d in notes['documents']) == sum(d['pageCount'] for d in pdf['documents'])
        for document in notes['documents']:
            for page in document['pages']:
                if direct_pdf:
                    check_pdf(page['pdfEvidence'])
                    assert pdf_paths[page['pdfEvidence']['path']] == document['sourceHash']
                    assert isinstance(page['text'], str)
                else:
                    evidence = page['textEvidence']
                    if evidence['jsonPointer']:
                        assert resolve(source(evidence['path'], evidence['sha256']), evidence['jsonPointer']) == page['text']
                    geometry = page['geometryEvidence']
                    reader = source(geometry['path'], geometry['sha256'])
                    assert isinstance(resolve(reader, geometry['jsonPointer']), list)
                    if 'bodyHash' in reader:
                        assert reader['bodyHash'] == document['sourceHash'] and reader['page'] == page['page']
                note_pages += 1
        if direct_pdf:
            for _, variant, row in rows(pdf):
                check_pdf(row['cellEvidence'])
                check_pdf(row['captionEvidence'])
                assert row['cellEvidence']['path'] == variant['source']['pdfPath']
                assert row['sourcePage'] == row['cellEvidence']['page']
                assert 'readerPath' not in row
        for report in api['reports'].values():
            for period in report['periods'].values():
                for variant in period['variants']:
                    for group in variant['groups']:
                        for cell in group['unmappedCells']:
                            original = resolve(source(variant['source']['rawPayloadLocation']), cell['rawLocator'])
                            assert (original is None and cell['value'] is None) or Decimal(str(original)) == Decimal(cell['value'])
        combined = load(ROOT / f'data/combine/{ticker}.json')
        assert sha(ROOT / combined['notes']['path']) == combined['notes']['sha256']
        for item in combined['sourceFiles']:
            assert sha(ROOT / item['path']) == item['sha256']
        assert combined['productionAdmissible'] is False
        review = load(ROOT / f'data/combine/review/{ticker}.json')
        review_pdf_pointers = {item['pdfPointer'] for item in review['issues'] if 'pdfPointer' in item}
        active_api_pointers = set()
        for _, variant, row in rows(combined):
            assert row['value'] is None or isinstance(row['value'], str)
            if 'pdfEvidence' in row:
                evidence = row['pdfEvidence']
                if direct_pdf:
                    check_pdf({'path': evidence['pdfPath'], 'page': evidence['page'], 'href': evidence['href']})
                if 'PDF_CAFEF_VALUE_DIFFERENCE' in row['reviewReasons']:
                    assert evidence['jsonPointer'] in review_pdf_pointers, 'PDF_DIFFERENCE_MISSING_FROM_REVIEW_QUEUE'
                original = resolve(source(evidence['path']), evidence['jsonPointer'])
                if original['status'] in ['VALUE', 'ZERO'] and original['value'] is not None:
                    assert row['source'] == 'PDF_REPORTED' and row['value'] == original['value']
                    assert row['unit'] == original['unit']
                if row['source'] == 'CAFEF_REFERENCE':
                    assert row['unit'] is None and row['reportingScope'] is None
                for reference in row['cafefReferences']:
                    active_api_pointers.add(reference['jsonPointer'])
                    assert resolve(source(reference['path']), reference['jsonPointer'])['value'] == reference['value']
            if 'apiEvidence' in row:
                evidence = row['apiEvidence']
                original = resolve(source(evidence['path']), evidence['jsonPointer'])
                active_api_pointers.add(evidence['jsonPointer'])
                assert original['value'] == row['referenceValue']
            assert row['productionAdmissible'] is False
            selections[row['source']] += 1
            combined_cells += 1
        for item in review['excludedCafeFFallbacks']:
            assert Decimal(item['value']) != 0
            assert item['apiPointer'] not in active_api_pointers
            original = resolve(api, item['apiPointer'])
            assert original['value'] == item['value']
            assert item['provenProviderError'] is False
            assert item['comparisonDimensionsVerified'] is False
            assert item['matches']
            for match in item['matches']:
                original_pdf = resolve(pdf, match['pdfPointer'])
                assert Decimal(original_pdf['value']) == Decimal(item['value'])
                assert original_pdf['label'] != original['label']
            excluded_count += 1
    assert note_pages == sum(d['pageCount'] for d in raw_manifest['documents'])
    report = {'status': 'PASS_REBUILT_CORPUS_AND_SOURCE_PRIORITY', 'tickers': 30,
              'databaseUnchanged': True, 'pdfDownloads': len(good),
              'failedDownloads': len(downloads['requests']) - len(good),
              'uniquePdfs': raw_manifest['uniquePdfCount'], 'pages': note_pages,
              'apiRequests': len(inventory), 'apiSchemaFailuresRetained': len(api_manifest['failures']),
              'apiPeriodGaps': api_period_gaps, 'apiCellsVerified': api_cells, 'combinedCellsVerified': combined_cells,
              'selections': dict(selections), 'excludedFallbacksVerified': excluded_count, 'semanticReview': 'NOT_PERFORMED',
              'productionAdmissible': False, 'evidenceMode': 'DIRECT_PDF' if direct_pdf else 'RAW_READER_POINTERS',
              'lexicalReplayAvailable': not direct_pdf}
    (ROOT / 'data/combine/verification.json').write_text(json.dumps(report, indent=2) + '\n')
    (CONTROL / 'verification.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report))


if __name__ == '__main__':
    main()
