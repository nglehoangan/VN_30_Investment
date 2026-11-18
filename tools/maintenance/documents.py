"""One-ticker content-addressed PDF storage and lossless existing-file deduplication."""
from collections import defaultdict
from contextlib import contextmanager
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import tempfile
from tools.maintenance.common import atomic_json,require_ticker,sha256_file,digest_json

PROJECT=Path(__file__).resolve().parents[2]
def stored_path(path):
    path=Path(path).resolve()
    return str(path.relative_to(PROJECT)) if path.is_relative_to(PROJECT) else str(path)

def standard_name(ticker,document_type,period,scope,digest,suffix='.pdf'):
    ticker=require_ticker(ticker)
    if not re.fullmatch(r'[a-f0-9]{64}',digest):raise ValueError('SHA256_REQUIRED')
    parts=[ticker]
    for value in (document_type,period,scope):
        if not isinstance(value,str) or not re.fullmatch(r'[A-Z0-9_-]{1,64}',value):raise ValueError('EXPLICIT_SAFE_DOCUMENT_METADATA_REQUIRED')
        parts.append(value)
    if suffix.lower() not in ('.pdf','.zip','.rar','.html'):raise ValueError('UNSUPPORTED_DOCUMENT_EXTENSION')
    return '__'.join(parts+[digest[:12]])+suffix.lower()

@contextmanager
def ticker_lock(root,ticker):
    folder=Path(root).resolve()/require_ticker(ticker);folder.mkdir(parents=True,exist_ok=True)
    if folder.resolve()!=folder.absolute():raise ValueError('DOCUMENT_FOLDER_ALIAS')
    with (folder/'.document-store.lock').open('a') as handle:
        fcntl.flock(handle,fcntl.LOCK_EX)
        try:yield folder
        finally:fcntl.flock(handle,fcntl.LOCK_UN)

def persist_pdf(root,ticker,body,*,document_type,period,scope,receipt):
    """Reuse exact retained bytes; preserve original receipts, never invent HTTP/clock data."""
    ticker=require_ticker(ticker)
    if not isinstance(body,bytes) or not body.startswith(b'%PDF-'):raise ValueError('VALID_PDF_BYTES_REQUIRED')
    if not isinstance(receipt,dict):raise ValueError('RECEIPT_OBJECT_REQUIRED')
    digest=hashlib.sha256(body).hexdigest()
    if receipt.get('sha256',digest)!=digest:raise ValueError('RECEIPT_CONTENT_HASH_MISMATCH')
    name=standard_name(ticker,document_type,period,scope,digest)
    with ticker_lock(root,ticker) as folder:
        candidates=[p for p in folder.rglob('*') if p.is_file() and not p.is_symlink() and p.suffix.lower()=='.pdf' and p.stat().st_size==len(body)]
        matches=[p for p in candidates if sha256_file(p)==digest]
        target=sorted(matches,key=lambda p:(len(p.parts),str(p)))[0] if matches else folder/name
        reused=bool(matches)
        if not reused:
            if target.exists():raise ValueError('DOCUMENT_NAME_HASH_COLLISION')
            fd,temp=tempfile.mkstemp(dir=folder,prefix='.pdf-')
            try:
                with os.fdopen(fd,'wb') as output:output.write(body);output.flush();os.fsync(output.fileno())
                os.replace(temp,target)
            finally:
                if os.path.exists(temp):os.unlink(temp)
        metadata={'documentType':document_type,'period':period,'scope':scope,'qualification':'NOT_GRANTED_BY_STORAGE'}
        observation_id=digest_json({'ticker':ticker,'sha256':digest,'metadata':metadata,'receipt':receipt})
        record={'id':observation_id,'ticker':ticker,'sha256':digest,'path':stored_path(target),'standardName':name,'status':'REUSED' if reused else 'STORED','metadata':metadata,'receipt':receipt}
        # Append by receipt hash; preserving each original source URL/event and original clock.
        catalog=folder/'document-catalog.json';data=json.loads(catalog.read_text()) if catalog.exists() else {'contract':'ticker-document-catalog-v1','ticker':ticker,'observations':[]}
        if data['ticker']!=ticker:raise ValueError('CATALOG_TICKER_MISMATCH')
        if observation_id not in [r.get('id') for r in data['observations']]:data['observations'].append(record);atomic_json(catalog,data)
        return record

def deduplicate(root,ticker,*,keep_paths=()):
    """Remove redundant physical copies; used legacy paths remain hard-link aliases.

    Never merge issuers, guess report scope, rewrite source receipts or change bytes.
    keep_paths defaults to all existing paths: callers must prove a path unused to unlink it.
    """
    ticker=require_ticker(ticker);actions=[]
    with ticker_lock(root,ticker) as folder:
        files=[p for p in folder.rglob('*') if p.is_file() and not p.is_symlink() and p.suffix.lower() in ('.pdf','.zip','.rar','.html')]
        sizes=defaultdict(list)
        for p in files:sizes[p.stat().st_size].append(p)
        groups=defaultdict(list)
        for group in sizes.values():
            if len(group)>1:
                for p in group:groups[sha256_file(p)].append(p)
        preserve={str(Path(p).resolve()) for p in keep_paths} if keep_paths else {str(p) for p in files}
        for digest,group in sorted(groups.items()):
            if len(group)<2:continue
            group.sort(key=lambda p:(str(p) not in preserve,len(p.relative_to(folder).parts),str(p)))
            canonical=group[0]
            for duplicate in group[1:]:
                original=duplicate.stat();same_inode=os.path.samestat(canonical.stat(),original)
                if same_inode:continue
                if str(duplicate) in preserve:
                    fd,temp=tempfile.mkstemp(dir=duplicate.parent,prefix='.dedup-');os.close(fd);os.unlink(temp)
                    try:
                        os.link(canonical,temp)
                        if sha256_file(temp)!=digest:raise ValueError('DEDUP_HASH_CHANGED')
                        os.replace(temp,duplicate)
                    finally:
                        if os.path.exists(temp):os.unlink(temp)
                    operation='REMOVED_REDUNDANT_COPY_KEPT_REFERENCED_HARDLINK'
                else:duplicate.unlink();operation='REMOVED_UNREFERENCED_DUPLICATE'
                actions.append({'ticker':ticker,'path':stored_path(duplicate),'canonicalPath':stored_path(canonical),'sha256':digest,'bytesReleased':original.st_size,'originalMtimeNs':original.st_mtime_ns,'operation':operation})
        return actions

def cached_by_url(root,ticker,url):
    catalog=Path(root).resolve()/require_ticker(ticker)/'document-catalog.json'
    if not catalog.exists():return None
    data=json.loads(catalog.read_text())
    if data.get('contract')!='ticker-document-catalog-v1' or data['ticker']!=require_ticker(ticker):raise ValueError('CATALOG_TICKER_MISMATCH')
    matches={}
    for row in data['observations']:
        receipt=row.get('receipt',{})
        if url not in [receipt.get('url'),receipt.get('requestedUrl'),receipt.get('finalUrl')]:continue
        p=Path(row['path']);p=p if p.is_absolute() else PROJECT/p
        if not p.resolve().is_relative_to(catalog.parent) or p.is_symlink():continue
        if p.is_file() and not p.is_symlink() and row.get('sha256') and sha256_file(p)==row['sha256']:
            matches.setdefault(row['sha256'],row)
    if len(matches)>1:raise ValueError('CONFLICTING_RETAINED_URL_REVISIONS_EXPLICIT_SELECTION_REQUIRED')
    if matches:return {**next(iter(matches.values())),'status':'REUSED','fetchPerformed':False}
    return None
