"""Keep readable full-page text, including all notes, beside PDF display tables."""
import gzip
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'data/manual-extracted-pdf'


def load(path):
    body = path.read_bytes()
    return json.loads(gzip.decompress(body) if path.suffix == '.gz' else body)


def main():
    manifest = load(BASE / 'display-manifest.json')
    assert manifest['completeRawInventory'], 'INCOMPLETE_PDF_EXTRACTION'
    (BASE / 'notes').mkdir(exist_ok=True)
    inventory = []
    for item in manifest['files']:
        display = load(BASE / item['file'])
        documents = []
        for document in display['documents']:
            raw = load(ROOT / document['rawDocumentPath'])
            pages = []
            for page, metadata in zip(raw['pages'], document['pages'], strict=True):
                assert page['page'] == metadata['page']
                pages.append({
                    'page': page['page'], 'text': page.get('text', ''),
                    'status': page['status'], 'method': page['method'],
                    'reportCandidate': metadata['reportKey'],
                    'noteCandidate': metadata['reportKey'] == 'thuyet-minh',
                    'titleCandidate': metadata['titleCandidate'],
                    'width': page['width'], 'height': page['height'],
                    'coordinateSystem': 'NORMALIZED_TOP_LEFT',
                    'textEvidence': {'path': document['rawDocumentPath'],
                                     'sha256': document['rawDocumentHash'],
                                     'jsonPointer': metadata['rawLocator'] + '/text' if 'text' in page else None},
                    'geometryEvidence': {
                        'path': page.get('readerPath', document['rawDocumentPath']),
                        'sha256': page.get('readerHash', document['rawDocumentHash']),
                        'jsonPointer': '/' + page['readerPass'] if page.get('readerPath') else metadata['rawLocator'] + '/words'},
                })
            documents.append({
                'sourceHash': document['sourceHash'], 'pdfPaths': document['retainedPaths'],
                'identity': document['identity'], 'pageCount': document['pageCount'], 'pages': pages,
            })
        result = {'schemaVersion': 'manual-pdf-notes-v1', 'ticker': item['ticker'],
                  'status': 'UNREVIEWED_FULL_PAGE_TEXT', 'productionAdmissible': False,
                  'coverage': 'ALL_PAGES_INCLUDING_NOTES_AND_UNCLASSIFIED_NARRATIVE', 'documents': documents}
        path = BASE / 'notes' / item['file']
        path.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
        inventory.append({'ticker': item['ticker'], 'path': str(path.relative_to(ROOT)),
                          'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
                          'documents': len(documents), 'pages': sum(d['pageCount'] for d in documents)})
    (BASE / 'notes' / 'manifest.json').write_text(json.dumps({'files': inventory}, indent=2) + '\n')
    print(json.dumps({'tickers': len(inventory), 'pages': sum(i['pages'] for i in inventory)}))


if __name__ == '__main__':
    main()
