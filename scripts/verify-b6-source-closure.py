"""Verify current bytes, append-only values, full-page notes and unchanged live DB."""
import hashlib,json,sqlite3
from pathlib import Path
import fitz
R=Path('docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-30/b6-close-inputs-r1')
def load(p):return json.loads(Path(p).read_text())
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
receipt=load(R/'presentation-integration.json');old_variants=0;old_notes=0
for pin in receipt['beforePins']:
    before=load(pin['backupPath']);assert sha(pin['backupPath'])==pin['sha256']
    path=pin['path'];after=load(path)
    if '/notes/' in path:
        for doc in before['documents']:
            current=next(d for d in after['documents'] if d['sourceHash']==doc['sourceHash']);assert current==doc;old_notes+=len(doc['pages'])
    if 'reports' in before:
        for key,report in before['reports'].items():
            for period,p in report['periods'].items():
                current=after['reports'][key]['periods'][period]['variants']
                assert current[:len(p['variants'])]==p['variants'],(path,key,period);old_variants+=len(p['variants'])
for backup in Path('backups/2026-10-30-b6-close-inputs/presentation-before/data/manual-extracted-pdf/notes').glob('*.json'):
    before=load(backup)
    if 'documents' not in before:continue
    after=load('data/manual-extracted-pdf/notes/'+backup.name)
    for doc in before['documents']:
        current=next(d for d in after['documents'] if d['sourceHash']==doc['sourceHash'])
        assert current==doc;old_notes+=len(doc['pages'])
manifest=load('data/manual-extracted-pdf/manifest.json');downloads=load('data/manual-download/manifest.json')
good=[d for d in downloads['requests'] if d['status']=='DOWNLOADED'];assert len(good)==manifest['physicalPdfCount']
assert len({d['sha256'] for d in good})==manifest['uniquePdfCount']
for d in good:
    assert sha(d['path'])==d['sha256']
    if d.get('archivePath'):assert sha(d['archivePath'])==d['archiveSha256']
notes={};page_count=0
for d in manifest['documents']:
    assert not d['errors'];assert sha(d['pdfPath'])==d['sourceHash']
    with fitz.open(d['pdfPath']) as pdf:assert len(pdf)==d['pageCount']
    ticker=d['ticker'];notes.setdefault(ticker,load('data/manual-extracted-pdf/notes/'+ticker+'.json'))
    n=next(n for n in notes[ticker]['documents'] if n['sourceHash']==d['sourceHash'])
    assert [p['page'] for p in n['pages']]==list(range(1,d['pageCount']+1));page_count+=d['pageCount']
validation=load(R/'native-review-validation.json');assert sha('data/vn30.sqlite')==validation['databaseSha256']
with sqlite3.connect('file:data/vn30.sqlite?mode=ro',uri=True) as db:
    assert db.execute('PRAGMA integrity_check').fetchone()[0]=='ok';assert not db.execute('PRAGMA foreign_key_check').fetchall()
extraction=load('data/manual-extracted-pdf/supplements/2026-10-30-b6-r1/manifest.json')
result=dict(status='PASS',physicalPdfs=len(good),uniquePdfs=manifest['uniquePdfCount'],fullPageNotesChecked=page_count,oldVariantsPreserved=old_variants,oldNotePagesPreserved=old_notes,newUniquePdfs=len(extraction['documents']),databaseUnchanged=True,productionAdmissible=False)
(R/'current-integrity-verification.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
