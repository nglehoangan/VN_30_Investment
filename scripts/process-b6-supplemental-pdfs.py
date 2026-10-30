"""Extract newly acquired PDFs into direct-PDF presentation JSON and full-page notes.

No discarded global OCR-reader directories are recreated. Temporary renderings and
recognizer output stay in memory/tmp; final cells retain original PDF/page/boxes.
"""
import concurrent.futures
import datetime
import hashlib
import json
from pathlib import Path
import re
import select
import subprocess
import sys
import tempfile
import pymupdf

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts/lib'))
from manual_display import REPORTS, classify_page, extract_table, fold

OUT = ROOT / 'data/manual-extracted-pdf/supplements/2026-10-29-b6-r1'
VISION = '/private/tmp/vn30-b6-vision-ocr'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=True, separators=(',', ':')) + '\n')


def extract(item):
    assert sha(ROOT / item['path']) == item['sha256']
    result = {'schemaVersion': 'supplemental-direct-pdf-display-v1', 'ticker': item['ticker'],
              'source': item, 'status': 'EXTRACTION_CANDIDATE_REVIEW_REQUIRED',
              'productionAdmissible': False, 'reports': {k: {'key': k, 'label': v, 'periods': {}} for k, v in REPORTS.items()},
              'notes': [], 'errors': []}
    recognizer = None
    identity = {'reportingPeriod': {'start': str(item['year']) + '-01-01', 'end': item['periodEnd']},
                'fiscalQuarter': None if item['year'] == 2025 else 2}
    try:
        with pymupdf.open(ROOT / item['path']) as pdf:
            for pi, page in enumerate(pdf):
                pn = pi + 1
                native = page.get_text().strip()
                area = max(page.rect.width * page.rect.height, 1)
                raster = len(native) < 150 or any((x['bbox'][2] - x['bbox'][0]) * (x['bbox'][3] - x['bbox'][1]) / area > .5 for x in page.get_image_info(hashes=False, xrefs=False))
                try:
                    if not raster:
                        words = [{'text': w[4], 'x': w[0] / page.rect.width, 'y': w[1] / page.rect.height,
                                  'width': (w[2] - w[0]) / page.rect.width, 'height': (w[3] - w[1]) / page.rect.height,
                                  'confidence': 1} for w in page.get_text('words', sort=True)]
                        method = 'PYMUPDF_NATIVE'
                    else:
                        if recognizer is None:
                            recognizer = subprocess.Popen([VISION], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
                        with tempfile.TemporaryDirectory(prefix='vn30-b6-page-') as tmp:
                            image = Path(tmp) / 'page.png'
                            page.get_pixmap(dpi=180).save(image)
                            recognizer.stdin.write((str(image) + '\n').encode()); recognizer.stdin.flush()
                            if not select.select([recognizer.stdout], [], [], 90)[0]:
                                raise RuntimeError('VISION_TIMEOUT')
                            raw = recognizer.stdout.readline()
                            if not raw:
                                raise RuntimeError('VISION_EXIT')
                            words = json.loads(raw)
                        method = 'APPLE_VISION_SINGLE_READER_UNREVIEWED'
                    text = native if not raster else '\n'.join(w['text'] for w in sorted(words, key=lambda w: (round(w['y'] / .008), w['x'])))
                    report, title = classify_page(words)
                    header = fold(' '.join(w['text'] for w in words if w['y'] < .32))
                    combined = 'hop nhat' in header or 'consolidated' in header
                    separate = bool(re.search(r'bao cao[^.]{0,80}rieng|separate|standalone', header))
                    scope = 'CONSOLIDATED' if combined and not separate else 'SEPARATE_STANDALONE' if separate and not combined else None
                    source = {'pdfPath': item['path'], 'sha256': item['sha256'], 'page': pn,
                              'href': item['path'] + '#page=' + str(pn)}
                    result['notes'].append({'page': pn, 'text': text, 'method': method, 'reportCandidate': report,
                                             'scopeCandidate': scope, 'pdfEvidence': source,
                                             'status': 'UNREVIEWED_FULL_PAGE_TEXT', 'wordCount': len(words)})
                    tables = extract_table(words, identity, report or 'bao-cao-bo-sung') if words else []
                    for table in tables:
                        rk = report or 'bao-cao-bo-sung'
                        dim = table['period']; pk = dim['periodKey']
                        period = result['reports'][rk]['periods'].setdefault(pk, {**{k: dim[k] for k in ['year', 'quarter', 'periodType', 'asOf']}, 'variants': []})
                        rows = []
                        for ri, row in enumerate(table['rows']):
                            per_share = bool(re.search(r'co phieu|per share|\beps\b', fold(row['label'] or '')))
                            rows.append({'id': f'p{pn}:c{table["column"]}:r{ri}', 'code': row['code'], 'label': row['label'],
                                         'order': ri, 'value': row['value'], 'lexicalValue': row['lexicalValue'],
                                         'status': row['status'], 'unit': 'CURRENCY_PER_SHARE' if per_share else 'RATIO' if (row['lexicalValue'] or '').endswith('%') else table['unit']['unit'],
                                         'currency': table['unit']['currency'], 'scale': None if per_share else table['unit']['scale'],
                                         'reportingScope': scope, 'needsReview': True, 'productionAdmissible': False,
                                         'pdfEvidence': {**source, 'boxes': row['boxes'], 'captionBoxes': row['captionBoxes']}})
                        period['variants'].append({'id': f'{item["sha256"]}:p{pn}:c{table["column"]}',
                                                   **{k: dim[k] for k in ['periodKey', 'year', 'quarter', 'periodType', 'asOf', 'label']},
                                                   'source': {'provider': 'VIETSTOCK_MIRRORED_PDF', **source},
                                                   'reportingScope': scope, 'status': 'UNREVIEWED_GEOMETRY_CANDIDATE',
                                                   'groups': [{'id': f'p{pn}', 'label': title, 'order': pn, 'unitEvidence': table['unit'], 'rows': rows}]})
                except Exception as e:
                    result['errors'].append({'page': pn, 'error': type(e).__name__ + ':' + str(e)})
                    result['notes'].append({'page': pn, 'text': '', 'status': 'READ_ERROR', 'pdfEvidence': {'pdfPath': item['path'], 'page': pn}})
        path = OUT / item['ticker'] / (item['sha256'] + '.json')
        write(path, result)
        return {'ticker': item['ticker'], 'sourcePath': item['path'], 'sourceSha256': item['sha256'],
                'path': str(path.relative_to(ROOT)), 'sha256': sha(path), 'pages': len(result['notes']),
                'rows': sum(len(g['rows']) for r in result['reports'].values() for p in r['periods'].values() for v in p['variants'] for g in v['groups']),
                'errors': result['errors']}
    finally:
        if recognizer:
            recognizer.stdin.close()
            try:
                recognizer.wait(timeout=5)
            except subprocess.TimeoutExpired:
                recognizer.kill(); recognizer.wait()


def main():
    OUT.mkdir(parents=True, exist_ok=False)
    annual_path = ROOT / 'docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-29/annual-download-r1/download-manifest.json'
    retry_path = ROOT / 'docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-29/document-retry-r1/download-manifest.json'
    annual, retry = json.loads(annual_path.read_text()), json.loads(retry_path.read_text())
    jobs = []
    for r in annual['records']:
        for p in r['pdfs']:
            jobs.append({**p, 'ticker': r['ticker'], 'year': 2025, 'periodEnd': '2025-12-31',
                         'retrievedAt': r['archive']['retrievedAt'], 'sourceUrl': r['archive']['url'], 'scopeHintAuthority': False})
    aliases = []
    for r in retry['records']:
        if r['status'] != 'DOWNLOADED':
            continue
        if r['sameHashPreviouslyRetainedPaths']:
            aliases.append({'ticker': r['ticker'], 'path': r['path'], 'sha256': r['sha256'], 'status': 'HASH_IDENTICAL_TO_ALREADY_EXTRACTED_SOURCE',
                            'existingSourcePaths': r['sameHashPreviouslyRetainedPaths'], 'existingPresentation': 'data/manual-extracted-pdf/' + r['ticker'] + '.json'})
            continue
        jobs.append({**r, 'year': 2025 if r['period'] == '2025' else 2026,
                     'periodEnd': '2025-12-31' if r['period'] == '2025' else '2026-06-30', 'retrievedAt': r['finishedAt']})
    results = []
    with concurrent.futures.ProcessPoolExecutor(max_workers=4) as pool:
        for result in pool.map(extract, jobs):
            results.append(result)
            write(OUT / 'manifest.json', {'contract': 'supplemental-pdf-processing-v1', 'complete': len(results) == len(jobs),
                                         'evidenceMode': 'DIRECT_PDF', 'productionAdmissible': False, 'documents': results, 'aliases': aliases,
                                         'sourcePins': [{'path': str(p.relative_to(ROOT)), 'sha256': sha(p)} for p in [annual_path, retry_path]],
                                         'reader': {'path': 'scripts/lib/vision-ocr-stream.m', 'sha256': sha(ROOT / 'scripts/lib/vision-ocr-stream.m')},
                                         'builder': {'path': 'scripts/process-b6-supplemental-pdfs.py', 'sha256': sha(Path(__file__))}})
            print(json.dumps({k: result[k] for k in ['ticker', 'pages', 'rows', 'errors']}), flush=True)
    print(json.dumps({'documents': len(results), 'aliases': len(aliases), 'pages': sum(r['pages'] for r in results)}))


if __name__ == '__main__':
    main()
