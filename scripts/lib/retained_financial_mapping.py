"""Deterministic retained-evidence mapping. Mapping is not governed admission."""
import hashlib
import json
import re
from pathlib import Path


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def pointer(document, location):
    for token in location.strip('/').split('/'):
        token = token.replace('~1', '/').replace('~0', '~')
        document = document[int(token)] if isinstance(document, list) else document[token]
    return document


def evaluate(root, bindings):
    rows, quarantined = [], []
    hashes, documents = {}, {}
    def hashed(path):
        key = str(path)
        if key not in hashes: hashes[key] = digest(path)
        return hashes[key]
    for binding in bindings:
        try:
            path = Path(root) / binding['path']
            if hashed(path) != binding['sha256']:
                raise ValueError('CHANGED_EVIDENCE_HASH')
            if str(path) not in documents: documents[str(path)] = json.loads(path.read_text())
            if binding.get('evidenceReference') and hashed(Path(root)/binding['evidenceReference']) != binding['evidenceSha256']:
                raise ValueError('CHANGED_SUPPORTING_EVIDENCE_HASH')
            cell = pointer(documents[str(path)], binding['pointer'])
            if binding.get('scalarReviewedCell'): cell = {'value': cell}
            for key, expected in binding['checks'].items():
                if cell.get(key) != expected:
                    raise ValueError('DIMENSION_OR_CAPTION_MISMATCH:' + key)
            value = cell[binding.get('valueKey', 'value')]
            if not isinstance(value, str) or not re.fullmatch(r'-?\d+(?:\.\d+)?', value):
                raise ValueError('NON_NUMERIC_NOT_ZERO')
            if binding['unit'] != 'VND' or binding['ticker'] != 'VNM':
                raise ValueError('UNSUPPORTED_MAPPING_DIMENSIONS')
            source = cell.get('source', {})
            sources = source if isinstance(source, list) else [source]
            if cell.get('pdfPath'): sources = sources + [cell]
            for original in sources:
                if original.get('pdfPath') and original.get('pdfSha256'):
                    if hashed(Path(root) / original['pdfPath']) != original['pdfSha256']:
                        raise ValueError('CHANGED_PDF_HASH')
            rows.append({**binding, 'value': value, 'source': source,
                         'status': 'MAPPED_RETAINED_RESEARCH',
                         'formalAdmission': False, 'historicalPitEligible': False})
        except (ValueError, KeyError, IndexError, OSError, TypeError) as error:
            quarantined.append({'id': binding['id'], 'reason': str(error)})
    # Different report vintages are deliberately separate; conflicting same-vintage cells remain visible.
    groups = {}
    for row in rows:
        key = tuple(row[k] for k in ('ticker', 'concept', 'scope', 'start', 'end', 'vintage'))
        groups.setdefault(key, []).append(row)
    conflicts = [sorted(r['id'] for r in group) for group in groups.values()
                 if len({r['value'] for r in group}) > 1]
    for group in conflicts:
        for row in rows:
            if row['id'] in group:
                row['status'] = 'CONFLICT_NOT_QUALIFIED'
    return {'contract': 'retained-financial-mapping-v1', 'rows': rows,
            'quarantined': quarantined, 'conflicts': conflicts,
            'authorityChanged': False, 'productionActivation': False}
