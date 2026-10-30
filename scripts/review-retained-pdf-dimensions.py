"""Review preparation from retained PDF bytes and existing notes. No OCR/admission writes."""
import collections
import datetime
import hashlib
import json
from pathlib import Path
import re
import unicodedata
import pymupdf

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-29/ai-review-r1'


def load(path):
    return json.loads(path.read_text())


def fold(text):
    return ''.join(c for c in unicodedata.normalize('NFD', text.lower().replace('đ', 'd'))
                   if unicodedata.category(c) != 'Mn')


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def scope(text):
    header = fold(text[:1800])
    combined = bool(re.search(r'(?:bao cao[^\n]{0,110}|financial[^\n]{0,60})hop nhat|consolidated (?:interim )?financial|bao cao tai chinh hop nhat', header))
    separate = bool(re.search(r'bao cao[^\n]{0,110}(?:rieng|cong ty me)|(?:separate|standalone) (?:interim )?financial', header))
    return 'AMBIGUOUS' if combined and separate else 'CONSOLIDATED' if combined else 'SEPARATE_STANDALONE' if separate else None


def unit(text):
    lines = text[:2400].splitlines()
    evidence = []
    for i, line in enumerate(lines):
        normalized = fold(line).strip()
        if re.search(r'^(?:don vi(?: tinh)?\s*:|currency\s*:|units?\s*:|(?:trieu|nghin|ngan)\s+(?:vnd|dong)\b|vnd(?:\s*$|[\x27’]?000)|(?:million|thousand) vnd\b)', normalized):
            evidence.append(' '.join(lines[max(0, i):i + 2]))
    declarations = []
    for original in evidence:
        value = fold(original)
        if re.search(r'trieu (?:dong|vnd)|million (?:vnd|dong)|vnd million', value):
            scale = '1000000'
        elif re.search(r'(?:nghin|ngan) (?:dong|vnd)|thousand (?:vnd|dong)|vnd.?000', value):
            scale = '1000'
        elif re.search(r'\bvnd\b|\bdong\b', value):
            scale = '1'
        else:
            scale = None
        if scale:
            declarations.append({'unit': 'CURRENCY', 'currency': 'VND', 'scale': scale, 'text': original})
    scales = {d['scale'] for d in declarations}
    return {'status': 'EXPLICIT_CANDIDATE' if len(scales) == 1 else 'AMBIGUOUS' if scales else 'UNKNOWN',
            'scale': next(iter(scales)) if len(scales) == 1 else None, 'declarations': declarations}


def publication(text):
    normalized = fold(text)
    result = []
    for m in re.finditer(r'thong tin nay[^\n]{0,100}cong bo|information was published|da duoc cong bo tren', normalized):
        excerpt = text[m.start():m.start() + 520]
        dates = re.findall(r'\b(\d{1,2})[/.](\d{1,2})[/.](20\d{2})\b', excerpt)
        valid = []
        for day, month, year in dates:
            try:
                valid.append(datetime.date(int(year), int(month), int(day)).isoformat())
            except ValueError:
                pass
        result.append({'kind': 'ISSUER_PUBLICATION_DECLARATION_CANDIDATE', 'dates': sorted(set(valid)), 'text': excerpt})
    return result


def main():
    OUT.mkdir(parents=True, exist_ok=False)
    manifest = load(ROOT / 'data/manual-download/manifest.json')
    notes = {}
    note_pins = []
    for path in sorted((ROOT / 'data/manual-extracted-pdf/notes').glob('*.json')):
        data = load(path)
        if 'documents' not in data:
            continue
        note_pins.append({'path': str(path.relative_to(ROOT)), 'sha256': digest(path)})
        for doc in data['documents']:
            notes[doc['sourceHash']] = doc
    documents = []
    selected = {}
    for index, request in enumerate(manifest['requests']):
        if request['status'] != 'DOWNLOADED':
            documents.append({'ticker': request['ticker'], 'status': request['status'], 'path': request.get('path')})
            continue
        path = ROOT / request['path']
        assert digest(path) == request['sha256']
        original = notes.get(request['sha256'])
        pages = []
        with pymupdf.open(path) as pdf:
            if original:
                assert len(pdf) == original['pageCount']
                for page in original['pages']:
                    text = page['text']
                    found_scope, found_unit = scope(text), unit(text)
                    pub = publication(text) if page['page'] <= 5 else []
                    if not (found_scope or found_unit['declarations'] or pub):
                        continue
                    native = pdf[page['page'] - 1].get_text()
                    native_scope, native_unit = scope(native), unit(native)
                    entry = {'page': page['page'], 'href': request['path'] + '#page=' + str(page['page']),
                             'scopeCandidate': found_scope, 'unitCandidate': found_unit,
                             'headerExcerpt': text[:1800], 'publicationCandidates': pub,
                             'candidateReader': 'EXISTING_UNREVIEWED_NOTES',
                             'directTextScope': native_scope, 'directTextUnit': native_unit,
                             'visualReview': 'NOT_REVIEWED', 'accountingAdmission': False}
                    pages.append(entry)
            document = {'ticker': request['ticker'], 'path': request['path'], 'sha256': request['sha256'],
                        'url': request['url'], 'retrievedAt': request['retrievedAt'],
                        'publicationVerified': False, 'publicationTimeSemantics': 'RETRIEVAL_IS_NOT_PUBLICATION',
                        'status': 'SOURCE_BYTES_VERIFIED_DIMENSION_CANDIDATES', 'pageCount': len(pdf),
                        'notesAvailable': original is not None, 'pdfMetadataIsNotPublication': pdf.metadata,
                        'pages': pages}
            documents.append(document)
        # Filename is used only to prioritize visual work, never to confirm dimensions or periods.
        for page in pages:
            if page['scopeCandidate'] != 'CONSOLIDATED' or page['unitCandidate']['status'] != 'EXPLICIT_CANDIDATE':
                continue
            name = path.name
            year = max([int(y) for y in re.findall(r'20\d{2}', name)] or [0])
            score = (year, int('6T' in name or 'q2' in name.lower()), -page['page'])
            if request['ticker'] not in selected or score > selected[request['ticker']]['priority']:
                selected[request['ticker']] = {'ticker': request['ticker'], 'path': request['path'], 'sha256': request['sha256'],
                                               'page': page['page'], 'scopeCandidate': page['scopeCandidate'],
                                               'unitCandidate': page['unitCandidate'], 'priority': score}
        if index % 40 == 0:
            print(json.dumps({'documentsProcessed': index + 1}), flush=True)
    result = {'contract': 'retained-pdf-dimension-review-v1', 'reviewMode': 'AI_ASSISTED_PERSONAL_PROJECT',
              'productionAdmissible': False, 'sourceManifest': {'path': 'data/manual-download/manifest.json',
              'sha256': digest(ROOT / 'data/manual-download/manifest.json')}, 'notePins': note_pins,
              'documents': documents, 'counts': {'physicalDocuments': len(documents),
              'pagesWithCandidates': sum(len(d.get('pages', [])) for d in documents),
              'publicationCandidateDocuments': sum(any(p['publicationCandidates'] for p in d.get('pages', [])) for d in documents)},
              'visualQueue': [selected[t] for t in sorted(selected)]}
    # PDF text layers can contain unpaired surrogate code points; JSON escapes preserve them losslessly.
    (OUT / 'pdf-dimension-audit.json').write_text(json.dumps(result, ensure_ascii=True, indent=2) + '\n')
    previews = Path('/private/tmp/vn30-ai-pdf-review-previews')
    previews.mkdir(exist_ok=True)
    from PIL import Image, ImageDraw
    queue = result['visualQueue']
    for start in range(0, len(queue), 4):
        canvas = Image.new('RGB', (2000, 1500), 'white')
        draw = ImageDraw.Draw(canvas)
        for j, item in enumerate(queue[start:start + 4]):
            with pymupdf.open(ROOT / item['path']) as pdf:
                page = pdf[item['page'] - 1]
                clip = pymupdf.Rect(0, 0, page.rect.width, page.rect.height * .39)
                pix = page.get_pixmap(matrix=pymupdf.Matrix(1.65, 1.65), clip=clip)
                im = Image.frombytes('RGB', [pix.width, pix.height], pix.samples)
                im.thumbnail((990, 685))
                x, y = (j % 2) * 1000, (j // 2) * 750
                canvas.paste(im, (x, y + 35))
                draw.text((x + 5, y + 5), f"{item['ticker']} | PDF page {item['page']} | {item['scopeCandidate']} | scale {item['unitCandidate']['scale']}", fill='black')
        canvas.save(previews / f'headers-{start // 4 + 1:02}.png')
    print(json.dumps({'output': str(OUT.relative_to(ROOT)), 'counts': result['counts'], 'visualQueue': len(queue)}))


if __name__ == '__main__':
    main()
