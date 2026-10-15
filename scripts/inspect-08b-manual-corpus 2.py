"""Inventory and native text extraction from owner-supplied PDFs, without network or DB."""
import argparse
import datetime
import hashlib
import json
import pathlib

REPO = pathlib.Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=pathlib.Path, default=REPO / 'data/manual-fundamentals')
    parser.add_argument('--output', type=pathlib.Path, default=REPO / 'data/manual-extracted/current')
    parser.add_argument('--inventory-only', action='store_true')
    args = parser.parse_args()
    source, output = args.source.resolve(), args.output.resolve()
    if not source.is_dir():
        parser.error('Source folder does not exist')
    if output == source or source in output.parents or output in source.parents:
        parser.error('Output must be separate from source')
    if output.exists():
        parser.error('Output already exists; use a new directory to preserve prior extraction')
    import importlib.util
    spec = importlib.util.spec_from_file_location('physical_corpus', REPO / 'scripts/reconcile-physical-manual-corpus.py')
    physical_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(physical_module)
    import pymupdf
    def validate(body):
        try:
            with pymupdf.open(stream=body, filetype='pdf') as doc:
                if doc.needs_pass or not len(doc): return False, 'ENCRYPTED_OR_EMPTY'
                for page in doc: page.get_text()
            return True, None
        except Exception as error: return False, str(error)
    physical = physical_module.inventory(source, set(), validate)
    pdfs = [source / row['relativePath'] for row in physical['files'] if row['isPdf']]
    if not pdfs:
        parser.error('No PDFs found')
    if not args.inventory_only:
        import pymupdf
    output.mkdir(parents=True, mode=0o700)
    (output / 'PHYSICAL_MANUAL_CORPUS_INVENTORY.json').write_text(json.dumps(physical, indent=2) + '\n')
    (output / 'ocr').mkdir(mode=0o700)
    files, documents, seen = [], [], {}
    for path in pdfs:
        if path.is_symlink() or source not in path.resolve().parents:
            raise ValueError('Source PDFs must be regular files within the manual folder')
        body = path.read_bytes()
        digest = hashlib.sha256(body).hexdigest()
        row = {'path': str(path.relative_to(REPO)) if path.is_relative_to(REPO) else str(path),
               'sha256': digest, 'bytes': len(body), 'folderTickerHint': path.parent.name,
               'filenameAuthority': False, 'duplicateOf': seen.get(digest)}
        if not body.startswith(b'%PDF-'):
            row.update(readable=False, error='INVALID_PDF_HEADER')
        elif args.inventory_only:
            row.update(readable=None, status='INVENTORY_ONLY')
        else:
            try:
                with pymupdf.open(stream=body, filetype='pdf') as pdf:
                    if pdf.needs_pass or not len(pdf):
                        raise ValueError('Encrypted or empty PDF')
                    pages = [page.get_text(sort=True) for page in pdf]
                row.update(readable=True, pageCount=len(pages), nativeCharacters=sum(map(len, pages)))
                if digest not in seen:
                    (output / (digest + '.text.json')).write_text(json.dumps(
                        {'bodyHash': digest, 'pages': pages, 'status': 'NATIVE_TEXT_REVIEW_CANDIDATE'},
                        ensure_ascii=False) + '\n')
            except Exception as error:
                row.update(readable=False, error=type(error).__name__)
        if digest not in seen and row.get('readable') is not False:
            # A symlink avoids a duplicate PDF; readers always recheck its SHA-256.
            (output / (digest + '.pdf')).symlink_to(path.resolve())
            documents.append({'ticker': path.parent.name, 'bodyHash': digest,
                              'documentId': 'manual-document-sha256:' + digest, 'file': digest + '.pdf',
                              'localPath': row['path']})
        seen.setdefault(digest, row['path'])
        files.append(row)
    inventory = {'recordedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
                 'source': str(source), 'files': files, 'pdfs': len(files), 'uniquePdfs': len(seen),
                 'networkRequests': 0, 'productionWrites': 0}
    for name, value in [('manual-inventory.json', inventory), ('selected-documents.json', documents),
                        ('sector-business-evidence.json', [])]:
        (output / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'pdfs': len(files), 'uniquePdfs': len(seen), 'unreadable': sum(
        row.get('readable') is False for row in files), 'output': str(output)}))


if __name__ == '__main__':
    main()
