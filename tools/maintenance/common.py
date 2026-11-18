"""Small shared maintenance primitives; no application/authority policy."""
import hashlib
import json
import os
from pathlib import Path
import re
import tempfile

def canonical_json(value):
    return json.dumps(value, sort_keys=True, ensure_ascii=False,
                      separators=(',', ':'), allow_nan=False)

def digest_json(value):
    return hashlib.sha256(canonical_json(value).encode()).hexdigest()

def sha256_file(path):
    digest = hashlib.sha256()
    with Path(path).open('rb') as source:
        for chunk in iter(lambda: source.read(1024*1024), b''):
            digest.update(chunk)
    return digest.hexdigest()

def require_ticker(value):
    if not isinstance(value, str):
        raise ValueError('EXACTLY_ONE_TICKER_REQUIRED')
    value = value.strip().upper()
    if value in ('ALL', 'VN30') or not re.fullmatch(r'[A-Z0-9]{3}', value):
        raise ValueError('BATCH_OR_INVALID_TICKER_REJECTED')
    return value

def atomic_json(path, value, immutable=False):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    text = canonical_json(value) + '\n'
    if path.exists() and immutable:
        if path.read_text() != text:
            raise ValueError('IMMUTABLE_EXECUTION_OUTPUT_CONFLICT')
        return
    fd, temp = tempfile.mkstemp(dir=path.parent, prefix='.checkpoint-')
    try:
        with os.fdopen(fd, 'w', encoding='utf-8') as handle:
            handle.write(text)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temp, path)
    finally:
        if os.path.exists(temp):
            os.unlink(temp)
