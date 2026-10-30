"""Refine note-derived header candidates; original audit is retained unchanged."""
import importlib.util
import json
from pathlib import Path
import re
import pymupdf
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-29/ai-review-r1'
spec = importlib.util.spec_from_file_location('review', ROOT / 'scripts/review-retained-pdf-dimensions.py')
review = importlib.util.module_from_spec(spec)
spec.loader.exec_module(review)
audit = json.loads((OUT / 'pdf-dimension-audit.json').read_text())
notes = {}
for pin in audit['notePins']:
    assert review.digest(ROOT / pin['path']) == pin['sha256']
    for doc in review.load(ROOT / pin['path'])['documents']:
        notes[doc['sourceHash']] = doc
queue = {}
for doc in audit['documents']:
    if not doc.get('sha256') or doc['sha256'] not in notes:
        continue
    for page in doc['pages']:
        text = next(p['text'] for p in notes[doc['sha256']]['pages'] if p['page'] == page['page'])
        page['unitCandidate'] = review.unit(text)
        header = re.sub(r'\s+', ' ', review.fold(text[:1000]))
        primary = bool(re.search(r'bao cao (?:tinh hinh tai chinh|ket qua|luu chuyen|thu nhap)|bang can doi (?:ke toan|tai khoan)|statement of (?:financial|cash|income)', header))
        excluded = bool(re.search(r'thuyet minh bao cao|bao cao soat xet|bao cao kiem toan|noi dung trang|muc luc', header[:600]))
        page['primaryStatementCandidate'] = primary and not excluded
        if not page['primaryStatementCandidate'] or page['unitCandidate']['status'] != 'EXPLICIT_CANDIDATE':
            continue
        # Consolidation can be split over title lines. Retain this as a candidate for image review.
        scope = page['scopeCandidate']
        if scope is None and 'hop nhat' in header[:600]:
            scope = 'CONSOLIDATED'
            page['scopeCandidate'] = scope
        if scope not in ['CONSOLIDATED', 'SEPARATE_STANDALONE']:
            continue
        years = [int(y) for y in re.findall(r'20\d{2}', Path(doc['path']).name)]
        score = (max(years or [0]), int(scope == 'CONSOLIDATED'),
                 int('6T' in doc['path'] or 'q2' in doc['path'].lower()), -page['page'])
        item = {'ticker': doc['ticker'], 'path': doc['path'], 'sha256': doc['sha256'], 'page': page['page'],
                'scopeCandidate': scope, 'unitCandidate': page['unitCandidate'], 'priority': score}
        if doc['ticker'] not in queue or score > queue[doc['ticker']]['priority']:
            queue[doc['ticker']] = item
audit['visualQueue'] = [queue[t] for t in sorted(queue)]
audit['refinement'] = 'Explicit unit declarations or standalone column unit labels only; exclude auditor/narrative/notes from primary-statement preview selection.'
(OUT / 'pdf-dimension-audit.refined.json').write_text(json.dumps(audit, ensure_ascii=True, indent=2) + '\n')
previews = Path('/private/tmp/vn30-ai-pdf-review-previews-refined')
previews.mkdir(exist_ok=True)
for start in range(0, len(audit['visualQueue']), 4):
    canvas = Image.new('RGB', (2000, 1500), 'white')
    draw = ImageDraw.Draw(canvas)
    for j, item in enumerate(audit['visualQueue'][start:start + 4]):
        with pymupdf.open(ROOT / item['path']) as pdf:
            page = pdf[item['page'] - 1]
            clip = pymupdf.Rect(0, 0, page.rect.width, page.rect.height * .42)
            pix = page.get_pixmap(matrix=pymupdf.Matrix(1.65, 1.65), clip=clip)
            image = Image.frombytes('RGB', [pix.width, pix.height], pix.samples)
            image.thumbnail((990, 690))
            x, y = (j % 2) * 1000, (j // 2) * 750
            canvas.paste(image, (x, y + 35))
            draw.text((x + 5, y + 5), f"{item['ticker']} | PDF page {item['page']} | {item['scopeCandidate']} | scale {item['unitCandidate']['scale']}", fill='black')
    canvas.save(previews / f'headers-{start // 4 + 1:02}.png')
print(json.dumps({'selected': len(queue), 'tickers': sorted(queue)}))
