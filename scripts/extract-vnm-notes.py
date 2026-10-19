"""Re-extract VNM notes from reacquired PDFs, retaining OCR geometry and provenance.

Run with a Python environment containing PyMuPDF and the compiled Apple Vision
reader (scripts/lib/vision-ocr.m). Candidate-only; no canonical writes.
"""
import argparse
import concurrent.futures
import datetime
import hashlib
import json
import pathlib
import re
import subprocess
import tempfile
import unicodedata

ROOT = pathlib.Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'data/manual-download/VNM/2026-10-19'
OUTPUT = ROOT / 'data/manual-extracted/notes-v1/VNM/2026-10-19'
EXPECTED = {
    'FY2022': '744b30d29cfaa3cad98c28c40c9dcb335606fe754baffd241738caead822ece6',
    'FY2023': '7cdcebe4a0be8875288460d094b7c708b1d92a1de04e19d3949c0e4ab6c60cb1',
    'FY2024': 'a70f448abc8aa61f0b6d25a281a1af4bf0d46d7309083d18556129cc53620450',
    'FY2025': 'ee996ffcb87f0699a59c20b102082666f6716fcf9be8ee314ad2de055f79c940',
    '6M2026': 'a6155aa757b320b893a78093b0454473f4a581aead225af4eb4ef1fbd6628561',
}
URLS = {f'FY{y}': f'https://static2.vietstock.vn/data/HOSE/{y}/BCTC/VN/NAM/VNM_Baocaotaichinh_{y}_Kiemtoan_Hopnhat.pdf' for y in range(2022, 2026)}
URLS['6M2026'] = 'https://static2.vietstock.vn/vietstock/2026/7/31/20260730___vnm___bctc_da_soat_xet_q2_2026___hop_nhat.pdf'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def relative(path):
    return str(path.relative_to(ROOT))


def save(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def normalized(text):
    return unicodedata.normalize('NFKD', text.replace('đ', 'd').replace('Đ', 'D')).encode('ascii', 'ignore').decode().lower()


def extract_page(job):
    import pymupdf
    period, path, number, vision, dpi = job
    target = OUTPUT / 'raw' / period / f'p{number:04}.json'
    if target.exists():
        old = json.loads(target.read_text())
        if old.get('sourceHash') == EXPECTED[period] and old.get('status') == 'OCR_CANDIDATE':
            return period, number, relative(target), None
    try:
        with pymupdf.open(path) as doc, tempfile.TemporaryDirectory(prefix='vnm-notes-') as tmp:
            page = doc[number - 1]
            png = pathlib.Path(tmp) / 'page.png'
            page.get_pixmap(dpi=dpi).save(png)
            result = subprocess.run([vision, str(png)], capture_output=True, timeout=120)
            if result.returncode:
                raise RuntimeError(result.stderr.decode(errors='replace'))
            words = json.loads(result.stdout)
            raw = {'schemaVersion': 'vnm-notes-reader-v1', 'sourceHash': EXPECTED[period],
                   'pdfPath': relative(pathlib.Path(path)), 'physicalPage': number,
                   'width': page.rect.width, 'height': page.rect.height, 'rotation': page.rotation,
                   'renderDpi': dpi, 'renderHash': sha(png.read_bytes()),
                   'method': 'APPLE_VISION_ACCURATE_EN_US', 'status': 'OCR_CANDIDATE',
                   'languageLimitation': 'Vietnamese OCR requires caption/amount review; confidence is not accounting verification.',
                   'observations': words, 'nativeText': page.get_text()}
        save(target, raw)
        return period, number, relative(target), None
    except Exception as error:
        save(target, {'sourceHash': EXPECTED[period], 'physicalPage': number,
                      'status': 'READ_ERROR', 'error': str(error)})
        return period, number, relative(target), str(error)


def lines(raw):
    """Merge OCR observations by baseline; retain original chunks and exact pointers."""
    clusters = []
    for i, w in sorted(enumerate(raw['observations']), key=lambda iw: (iw[1]['y'] + iw[1]['height'] / 2, iw[1]['x'])):
        center = w['y'] + w['height'] / 2
        if clusters and abs(center - clusters[-1]['center']) < .008:
            clusters[-1]['members'].append((i, w))
        else:
            clusters.append({'center': center, 'members': [(i, w)]})
    return [sorted(c['members'], key=lambda iw: iw[1]['x']) for c in clusters]


TOKEN = re.compile(r'(?<![\w/])(?:\(\s*)?-?\d+(?:[.,]\d+)*(?:\s*\))?%?(?![\w/])')


def numeric_candidates(text):
    values = [{'lexicalValue': m.group(), 'value': None, 'status': 'EXPLICIT_DASH_NOT_ZERO', 'characterSpan': [m.start(), m.end()]} for m in re.finditer(r'(?<!\S)[–—-](?!\S)', text)]
    if text.strip() in ['-', '–', '—']:
        return [{'lexicalValue': text, 'value': None, 'status': 'EXPLICIT_DASH_NOT_ZERO', 'characterSpan': [0, len(text)]}]
    for match in TOKEN.finditer(text):
        lexical = match.group().strip()
        clean = lexical.strip('()% ').replace(' ', '')
        negative = lexical.startswith('(') or clean.startswith('-')
        unsigned = clean.lstrip('-')
        if re.fullmatch(r'\d{1,3}(?:\.\d{3})+', unsigned):
            val, status = unsigned.replace('.', ''), 'VN_THOUSANDS_NUMERIC_CANDIDATE'
        elif re.fullmatch(r'\d{1,3}(?:,\d{3})+', unsigned):
            val, status = None, 'AMBIGUOUS_COMMA_FORMAT'
        elif re.fullmatch(r'\d+', unsigned):
            val, status = unsigned, 'INTEGER_TOKEN_UNASSIGNED'
        elif re.fullmatch(r'\d+,\d{1,2}', unsigned):
            val, status = unsigned.replace(',', '.'), 'VN_DECIMAL_NUMERIC_CANDIDATE'
        else:
            val, status = None, 'AMBIGUOUS_NUMBER_FORMAT'
        if val is not None and negative:
            val = '-' + val
        values.append({'lexicalValue': lexical, 'value': val, 'status': status,
                       'characterSpan': [match.start(), match.end()],
                       'unit': 'PERCENT' if lexical.endswith('%') else 'UNASSIGNED',
                       'period': None, 'canonicalMetric': None})
    return sorted(values, key=lambda v: v['characterSpan'][0])


def map_period(period, inventory):
    groups, pages, current = [], [], None
    section = "UNASSIGNED"
    note_started = False
    for entry in inventory:
        raw = json.loads((ROOT / entry['rawPath']).read_text())
        if raw.get('status') != 'OCR_CANDIDATE':
            pages.append({**entry, 'status': 'READ_ERROR'})
            continue
        obs = raw['observations']
        header = ' '.join(w['text'] for w in obs if w['y'] < .23)
        header_note = bool(re.search(r'mau b\s*09|thuyet minh bao cao', normalized(header))) and raw['physicalPage'] > 5
        note_started = note_started or header_note
        is_note = note_started
        pages.append({**entry, 'status': 'OCR_CANDIDATE', 'isNotesPage': is_note,
                      'notesClassification': 'HEADER_CANDIDATE' if header_note else 'CONTINUATION_AFTER_NOTES_START' if is_note else 'NOT_NOTES_HEADER',
                      'observationCount': len(obs), 'headerText': header})
        if not is_note:
            continue
        for row_number, chunks in enumerate(lines(raw)):
            label = ' '.join(w['text'] for _, w in chunks)
            x = min(w['x'] for _, w in chunks)
            y = min(w['y'] for _, w in chunks)
            section_heading = re.match(r'^([IVX]+)\.(?:\s+(.+))?$', label)
            if section_heading and x < .17 and .14 < y < .94:
                section = section_heading[1]
                current = {'id': f'section-{section.lower()}-introduction-p{raw["physicalPage"]}',
                           'section': section, 'noteNumber': None, 'label': section_heading[2] or 'SECTION_TITLE_SEE_FOLLOWING_ROW',
                           'order': len(groups), 'rows': []}
                groups.append(current)
            if not section_heading and normalized(label).startswith('thong tin bo sung cho cac khoan muc') and x < .17:
                # OCR can omit the Roman numeral. Do not inherit the preceding section.
                section = f'UNNUMBERED-PAGE-{raw["physicalPage"]}'
                current = {'id': f'section-unassigned-p{raw["physicalPage"]}', 'section': section,
                           'noteNumber': None, 'label': label, 'headingStatus': 'ROMAN_NUMERAL_NOT_READ',
                           'order': len(groups), 'rows': []}
                groups.append(current)
            heading = re.match(r'^(\d{1,2})[.)](?:\s+([^\d].*))?$', label)
            if heading and x < .17 and .14 < y < .94:
                number = int(heading[1])
                # Notes restart numbering across Roman sections; never merge by number alone.
                if 1 <= number <= 60:
                    current = {'id': f'section-{section.lower()}-note-{number:02}-occurrence-{sum(g.get("noteNumber") == number and g.get("section") == section for g in groups)}',
                               'section': section,
                               'noteNumber': number, 'label': heading[2] or 'NOTE_TITLE_SEE_FOLLOWING_ROW', 'rawHeading': label,
                               'headingStatus': 'OCR_GEOMETRY_CANDIDATE', 'sourcePage': raw['physicalPage'],
                               'order': len(groups), 'rows': []}
                    groups.append(current)
            if current is None:
                current = {'id': 'unassigned-notes-introduction', 'noteNumber': None,
                           'label': 'Unassigned notes introduction', 'section': section, 'order': len(groups), 'rows': []}
                groups.append(current)
            cells = []
            for index, word in chunks:
                pointer = f'/observations/{index}'
                cells.append({'text': word['text'], 'bbox': {k: word[k] for k in ['x', 'y', 'width', 'height']},
                              'confidence': word['confidence'], 'rawLocator': pointer,
                              'numericCandidates': numeric_candidates(word['text'])})
            current['rows'].append({'id': f'p{raw["physicalPage"]}-r{row_number:03}',
                                    'order': len(current['rows']), 'label': label,
                                    'value': None, 'valueStatus': 'MULTICOLUMN_OR_NARRATIVE_SEE_CELLS',
                                    'sourcePage': raw['physicalPage'], 'rawPath': entry['rawPath'],
                                    'rawLocators': [c['rawLocator'] for c in cells], 'cells': cells,
                                    'unit': 'UNASSIGNED', 'pageUnitEvidence': [{'text': w['text'], 'rawLocator': f'/observations/{i}'} for i, w in enumerate(obs) if w['text'].strip() in ['VND', 'VNĐ', 'USD', 'VND/cổ phiếu']], 'periodColumns': 'UNASSIGNED_PRESERVE_SOURCE_HEADERS',
                                    'reviewStatus': 'UNREVIEWED_OCR', 'productionAdmissible': False})
    return groups, pages


def main():
    import pymupdf
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--vision', required=True)
    parser.add_argument('--workers', type=int, default=4)
    parser.add_argument('--dpi', type=int, default=200)
    args = parser.parse_args()
    jobs, documents, manifest = [], {}, []
    for period in EXPECTED:
        path = SOURCE / f'VNM_{period}.pdf'
        if not path.exists():
            manifest.append({'period': period, 'status': 'MISSING_PDF'})
            continue
        body = path.read_bytes()
        actual = sha(body)
        if actual != EXPECTED[period]:
            raise ValueError(f'Unexpected source variant {period}: {actual}; do not silently replace expected capture')
        with pymupdf.open(path) as pdf:
            count = len(pdf)
        documents[period] = {'periodKey': period, 'pdfPath': relative(path), 'sha256': actual,
                             'bytes': len(body), 'pageCount': count, 'url': URLS[period],
                             'downloadStatus': 'HTTP_200_PDF_HASH_MATCHES_RETAINED_SOURCE',
                             'reacquisitionDate': '2026-10-19', 'exactRetrievalTimestamp': None,
                             'priorHashAuthority': 'data/manual-extracted/display-v1/VNM.json',
                             'scope': 'CONSOLIDATED',
                             'auditReviewStatus': 'REVIEWED' if period == '6M2026' else 'AUDITED',
                             'qualificationBasis': 'Hash matches previously retained original; OCR does not reapprove accounting.',
                             'periodEnd': '2026-06-30' if period == '6M2026' else period[2:] + '-12-31',
                             'periodType': 'YTD' if period == '6M2026' else 'ANNUAL'}
        jobs.extend((period, str(path), n, args.vision, args.dpi) for n in range(1, count + 1))
    inventory = {period: [] for period in documents}
    with concurrent.futures.ProcessPoolExecutor(max_workers=args.workers) as pool:
        for i, (period, number, raw_path, error) in enumerate(pool.map(extract_page, jobs), 1):
            inventory[period].append({'physicalPage': number, 'rawPath': raw_path, 'error': error})
            if i % 20 == 0:
                print(f'OCR {i}/{len(jobs)}', flush=True)
    periods = {}
    for period in documents:
        groups, pages = map_period(period, sorted(inventory[period], key=lambda p: p['physicalPage']))
        variant = {'id': period.lower() + '-reacquired-2026-10-19', 'source': documents[period],
                   'reportingScope': 'CONSOLIDATED', 'status': 'UNREVIEWED_OCR', 'groups': groups}
        period_key = '2026-YTD2' if period == '6M2026' else period[2:]
        periods[period_key] = {'periodType': documents[period]['periodType'],
                               'asOf': documents[period]['periodEnd'], 'variants': [variant]}
        value = {'schemaVersion': 'manual-notes-display-v1', 'ticker': 'VNM',
                 'productionAdmissible': False, 'reports': {'thuyet-minh': {'periods': {period_key: periods[period_key]}}}}
        save(OUTPUT / f'{period}.json', value)
        save(OUTPUT / 'inventory' / f'{period}.json', {'document': documents[period], 'pages': pages})
        manifest.append({'period': period, 'document': documents[period], 'notesPages': sum(p.get('isNotesPage', False) for p in pages),
                         'groups': len(groups), 'noteNumbers': [g['noteNumber'] for g in groups],
                         'rows': sum(len(g['rows']) for g in groups),
                         'failedPages': [p['physicalPage'] for p in pages if p['status'] == 'READ_ERROR'],
                         'file': relative(OUTPUT / f'{period}.json')})
    save(OUTPUT / 'VNM.json', {'schemaVersion': 'manual-notes-display-v1', 'ticker': 'VNM',
                             'productionAdmissible': False, 'reports': {'thuyet-minh': {'label': 'Thuyết minh báo cáo tài chính hợp nhất', 'periods': periods}}})
    save(OUTPUT / 'manifest.json', {'schemaVersion': 'vnm-notes-inventory-v1', 'createdAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
                                  'status': 'UNREVIEWED_EXTRACTION_CANDIDATE', 'documents': manifest,
                                  'failedRequests': [{'url': 'https://d8um25gjecm9v.cloudfront.net/cms/20260730_VNM_BCTC_da_soat_xet_Q2_2026_Hop_nhat_76ef2e29c1.pdf', 'status': 403, 'alternative': URLS['6M2026']}],
                                  'limitations': ['OCR line grouping and note boundaries require review.', 'Numeric tokens are not authoritative accounting cells.', 'No automatic row/column, comparative date, unit or canonical assignment.', 'All physical PDF pages retained in raw inventory; only heading-detected note pages in presentation.']})
    index_periods = {}
    for key, content in periods.items():
        variant = content['variants'][0]
        index_periods[key] = {'source': variant['source'],
                              'jsonPath': relative(OUTPUT / f"{variant['source']['periodKey']}.json"),
                              'notes': [{'id': g['id'], 'section': g.get('section'), 'number': g.get('noteNumber'),
                                         'label': g['label'], 'pages': sorted({r['sourcePage'] for r in g['rows']}),
                                         'jsonPointer': f'/reports/thuyet-minh/periods/{key}/variants/0/groups/{i}'}
                                        for i, g in enumerate(variant['groups'])]}
    save(ROOT / 'data/comparisons/VN30/VNM/notes-index.json',
         {'schemaVersion': 'vnm-notes-index-v1', 'productionAdmissible': False,
          'aggregatePath': relative(OUTPUT / 'VNM.json'), 'periods': index_periods,
          'note': 'Separate from annual-pdf-first selection; preserves full notes and interim source variant.'})
    hashes = {relative(p): sha(p.read_bytes()) for p in sorted(OUTPUT.rglob('*.json')) if p.name != 'ARTIFACT_HASHES.json'}
    save(OUTPUT / 'ARTIFACT_HASHES.json', {'algorithm': 'SHA-256', 'selfExcluded': True, 'files': hashes})
    print(json.dumps([{k: v for k, v in m.items() if k != 'document'} for m in manifest], ensure_ascii=False), flush=True)


if __name__ == '__main__':
    main()
