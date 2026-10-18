"""Explicit, no-backup data cleanup. Preview by default; --apply deletes files.

Retains financial extraction/aggregation JSON and the active application DB.
Only operates inside this repository's real, non-symlink data directory.
"""
import argparse
import hashlib
import json
import pathlib
import sqlite3
from collections import Counter
from datetime import datetime, timezone

ROOT=pathlib.Path(__file__).resolve().parents[1]
DATA=ROOT/'data'
REPORT=DATA/'retained-data-index.json'
TICKERS='ACB BID BSR CTG FPT GAS GVR HDB HPG LPB MBB MCH MSN MWG SAB SHB SSB SSI STB TCB TCX VCB VHM VIB VIC VJC VNM VPB VPL VRE'.split()


def retained(path):
    relative=path.relative_to(DATA);parts=relative.parts
    if relative.as_posix()=='retained-data-index.json':return True
    if len(parts)==1 and (parts[0]=='vn30.sqlite' or parts[0].startswith('vn30.sqlite-')):return True
    if path.suffix!='.json':return False
    return (parts[0]=='comparisons' or parts[:2]==('providers','cafef')
            or (parts[:2]==('manual-extracted','display-v1') and len(parts)==3)
            or (parts[0]=='manual-current' and len(parts)==2))


def digest(path):return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    parser=argparse.ArgumentParser();parser.add_argument('--apply',action='store_true');args=parser.parse_args()
    assert DATA.is_dir() and not DATA.is_symlink() and DATA.resolve()==ROOT/'data'
    files=sorted(p for p in DATA.rglob('*') if p.is_file() or p.is_symlink())
    keep=[p for p in files if retained(p)];remove=[p for p in files if not retained(p)]
    assert all(not p.is_symlink() for p in keep),'Retained symlink requires separate handling'
    for t in TICKERS:
        assert DATA/f'manual-extracted/display-v1/{t}.json' in keep
        assert DATA/f'providers/cafef/display-v1/{t}.json' in keep
        assert DATA/f'comparisons/VN30/{t}/annual-pdf-first.json' in keep
    assert DATA/'comparisons/VN30/annual-pdf-first.json' in keep
    assert DATA/'vn30.sqlite' in keep
    # Validate retained JSON and record its bytes before any destructive action.
    checks={}
    for path in keep:
        if path.suffix=='.json' and path!=REPORT:
            json.loads(path.read_text());checks[str(path.relative_to(ROOT))]=digest(path)
    summary={'beforeBytes':sum(p.lstat().st_size for p in files),'retainedFiles':len(keep),'deletedFiles':len(remove),
             'deletedBytes':sum(p.lstat().st_size for p in remove),
             'deletedByDirectory':dict(Counter(p.relative_to(DATA).parts[0] for p in remove)),
             'deletedByExtension':dict(Counter(p.suffix or '(none)' for p in remove))}
    if not args.apply:
        print(json.dumps({'mode':'PREVIEW',**summary},ensure_ascii=False,indent=2));return
    for path in remove:
        assert path.is_relative_to(DATA)
        path.unlink()
    for directory in sorted((p for p in DATA.rglob('*') if p.is_dir() and not p.is_symlink()),key=lambda p:len(p.parts),reverse=True):
        if not any(directory.iterdir()):directory.rmdir()
    for relative,expected in checks.items():assert digest(ROOT/relative)==expected,relative
    with sqlite3.connect((DATA/'vn30.sqlite').as_uri()+'?mode=ro',uri=True) as db:
        assert db.execute('PRAGMA quick_check').fetchall()==[('ok',)]
    survivors=[p for p in DATA.rglob('*') if p.is_file()]
    assert all(retained(p) for p in survivors)
    ledger={'schemaVersion':'retained-data-index-v1','cleanedAt':datetime.now(timezone.utc).isoformat(),
            'userInstruction':'Remove unnecessary data-folder artifacts without backups; retain extracted and aggregated JSON.',
            'backupCreated':False,'summary':{**summary,'afterBytesBeforeIndex':sum(p.stat().st_size for p in survivors)},
            'retainedRoles':{'pdfExtractJson':'data/manual-extracted/display-v1/<TICKER>.json',
              'cafefExtractJson':'data/providers/cafef/display-v1/<TICKER>.json',
              'cafefRawJson':'data/providers/cafef/poc-2026-10-13/',
              'aggregatedJson':'data/comparisons/VN30/annual-pdf-first.json',
              'perTickerJson':'data/comparisons/VN30/<TICKER>/annual-pdf-first.json',
              'runtimeAnalysisJson':'data/manual-current/current-analysis.json',
              'activeApplicationDatabase':'data/vn30.sqlite'},
            'sourceRetention':{'pdfOriginals':'DELETED_BY_USER_INSTRUCTION','ocrReadersAndImages':'DELETED_BY_USER_INSTRUCTION',
                'jsonValues':'RETAINED_UNCHANGED','sourcePointers':'HISTORICAL_REFERENCES_MAY_POINT_TO_DELETED_SOURCE_ARTIFACTS',
                'sourceReplayAvailable':False,'fullReextractionRequiresSourceReacquisition':True},
            'verification':{'retainedJsonParses':True,'retainedJsonBytesUnchanged':True,'sqliteQuickCheck':'ok','tickerCount':30},
            'retainedJsonSha256':checks}
    REPORT.write_text(json.dumps(ledger,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'mode':'APPLIED',**ledger['summary'],'report':str(REPORT.relative_to(ROOT))},ensure_ascii=False,indent=2))

if __name__=='__main__':main()
