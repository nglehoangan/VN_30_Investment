#!/usr/bin/env python3
"""Replay the reviewed ACB BANK catalog into disposable SQLite only."""
import argparse
from contextlib import closing
from decimal import Decimal
from datetime import datetime, timezone
from hashlib import sha256
import json
from pathlib import Path
import sqlite3
import sys
from tempfile import TemporaryDirectory
from urllib.parse import urlparse

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'skills/vn30-rollout-orchestrator/scripts'))
from control import Universe, digest, pinned, prepare  # noqa: E402

CATALOG = {
    'path': 'docs/fundamental-data-engine/acb-scoring-readiness/2026-11-19/bank-admission/ACB_SOURCE_CATALOG.json',
    'sha256': 'ffbe913912b6d5d04afb4cff1c7c3710f06ceeb3bddc09a66282fa92d83801b3',
}
VERSION = 'vn30-20260803-reviewed-20261115'
CUTOFF = '2026-10-30'
CAPITAL = {'BANK_REPORTED_CAR', 'BANK_REPORTED_CET1'}


def canonical(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':'))


def checksum(data):
    return sha256(data).hexdigest()


def require(condition, error):
    if not condition:
        raise ValueError(error)


def source_documents(catalog, q3):
    documents = {}
    for doc in catalog['documents']:
        receipt = json.loads(pinned(ROOT, {'path': doc['receiptPath'], 'sha256': doc['receiptHash']}))
        _, _, index = doc['receiptPointer'].split('/')
        row = receipt['rows'][int(index)]
        require(row['ticker'] == 'ACB' and str(row['documentId']) == doc['id'] and
                row['sha256'] == doc['sha256'] and row['sourceUrl'] == doc['url'] and
                row['retrievedAt'] == doc['originalRetrievedAt'] and row['sourceRole'] == doc['sourceRole'] and
                row['status'] in ('RETAINED', 'CAPTURED') and
                urlparse(doc['url']).netloc == 'static2.vietstock.vn' and
                urlparse(doc['url']).scheme == 'https', 'BANK_DOCUMENT_RECEIPT_MISMATCH')
        path = q3 if doc['id'] == '564804' and q3 is not None else ROOT / doc['path']
        raw = path.read_bytes()
        require(raw.startswith(b'%PDF-') and checksum(raw) == doc['sha256'], 'BANK_RAW_PDF_HASH_MISMATCH')
        documents[doc['id']] = (doc, raw)
    return documents


def map_facts(catalog, documents):
    facts = []
    for cell in catalog['facts']:
        doc, _ = documents[cell['doc']]
        require(cell['start'] <= cell['end'] == doc['end'] <= CUTOFF and cell['page'] > 0 and
                cell['locator'], 'BANK_CELL_SCOPE_MISMATCH')
        amount = Decimal(cell['native'])
        capital = cell['concept'] in CAPITAL
        if capital:
            require(doc['role'] == 'REGULATORY_CAPITAL_DISCLOSURE' and
                    cell['scope'] == 'REGULATORY_CONSOLIDATED' and cell['unit'] == 'PERCENT' and
                    cell['framework'] == 'TT14_2025_STANDARDIZED' and
                    cell['start'] == cell['end'] and 0 < amount <= 100, 'BANK_CAPITAL_ROLE_OR_RATIO')
            value, unit = str(amount / 100), 'RATIO'
        else:
            require(doc['role'] == 'INTERIM_CONSOLIDATED_STATEMENT' and
                    cell['scope'] == 'CONSOLIDATED' and cell['unit'] == 'MILLION_VND' and
                    amount.is_finite() and amount == amount.to_integral_value(), 'BANK_STATEMENT_ROLE_OR_UNIT')
            value, unit = str(int(amount) * 1_000_000), 'VND'
        fact = {**cell, 'value': value, 'valueUnit': unit, 'rawHash': doc['sha256'],
                'documentRole': doc['role'], 'classification': 'REPORTED'}
        facts.append({'id': 'bank-rehearsal-fact:' + digest(fact), **fact})
    by_key = {(f['concept'], f['start'], f['end'], f['scope']): f for f in facts}
    require(len(by_key) == len(facts), 'BANK_DUPLICATE_FACT_DIMENSIONS')
    operands = [by_key[(key, '2026-09-30', '2026-09-30', 'CONSOLIDATED')]
                for key in ('BANK_RESERVE_GENERAL', 'BANK_RESERVE_SPECIFIC')]
    require(len({f['rawHash'] for f in operands}) == 1 and all(int(f['value']) >= 0 for f in operands),
            'BANK_RESERVE_OPERAND_MISMATCH')
    derived = {
        'concept': 'BANK_LOAN_LOSS_RESERVES', 'start': '2026-09-30', 'end': '2026-09-30',
        'scope': 'CONSOLIDATED', 'valueUnit': 'VND', 'rawHash': operands[0]['rawHash'],
        'value': str(sum(int(f['value']) for f in operands)), 'classification': 'DERIVED',
        'formula': 'GENERAL_PLUS_SPECIFIC_EXCLUDING_MARGIN_LENDING',
        'operandIds': [f['id'] for f in operands],
    }
    facts.append({'id': 'bank-rehearsal-fact:' + digest(derived), **derived})
    return facts


def rehearsal(q3=None, known_at=None):
    known_at = known_at or datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")
    knowledge = datetime.fromisoformat(known_at)
    require(knowledge.tzinfo is not None and knowledge <= datetime.now(timezone.utc),
            "BANK_INVALID_REHEARSAL_CLOCK")
    env = prepare(dict(ticker='ACB', sector='BANK', exchange='HOSE', skill='equity-s1-s5-assessment',
                       referenceDate=CUTOFF, purpose='CURRENT_FORMAL_VALUATION',
                       parameters={'rehearsalCatalogHash': CATALOG['sha256']}), Universe(VERSION))
    subject = env['request']
    catalog = json.loads(pinned(ROOT, CATALOG))
    for key in ('ticker', 'securityId', 'exchange', 'sector', 'referenceDate', 'universe'):
        require(catalog['subject'][key] == subject[key], 'BANK_CATALOG_SCOPE_MISMATCH')
    require(catalog['contract'] == 'bank-admission-review-catalog-v1' and
            catalog['status'] == 'ISOLATED_REHEARSAL_ONLY', 'BANK_CATALOG_NOT_REHEARSAL')
    documents = source_documents(catalog, q3)
    require(all(datetime.fromisoformat(d['originalRetrievedAt']) <= knowledge for d, _ in documents.values()),
            'BANK_SOURCE_NOT_YET_KNOWN')
    facts = map_facts(catalog, documents)
    body = {'contract': 'bank-source-admission-rehearsal-v1', 'request': subject,
            'catalog': CATALOG, 'facts': facts, 'knownAt': known_at, 'authority': 'ISOLATED_REHEARSAL_ONLY'}
    admission_id = 'bank-rehearsal:' + digest(body)
    encoded = canonical(body)
    with TemporaryDirectory(prefix='acb-bank-admission-') as temp, closing(
            sqlite3.connect(Path(temp) / 'rehearsal.sqlite')) as conn:
        conn.execute('PRAGMA foreign_keys=ON')
        conn.executescript((ROOT / 'prisma/proposals/current-financial-dataset-v1.sql').read_text())
        duplicates = []
        for _ in range(2):
            with conn:
                found = conn.execute('SELECT body,body_hash FROM current_financial_admission WHERE id=?',
                                     (admission_id,)).fetchone()
                duplicates.append(found is not None)
                if found:
                    require(found == (encoded, checksum(encoded.encode())), 'BANK_REPLAY_CONFLICT')
                    continue
                for doc, raw in documents.values():
                    conn.execute('INSERT INTO current_financial_raw VALUES (?,?,?)',
                                 (doc['sha256'], doc['path'], raw))
                conn.execute('INSERT INTO current_financial_admission VALUES (?,?,?,?,?,?,?)',
                             (admission_id, 'ACB', subject['securityId'], CUTOFF,
                              known_at, encoded, checksum(encoded.encode())))
                for fact in facts:
                    fact_body = canonical(fact)
                    conn.execute('INSERT INTO current_financial_fact VALUES (?,?,?,?,?)',
                                 (fact['id'], admission_id, fact['rawHash'], fact_body,
                                  checksum(fact_body.encode())))
        verify_sql = ('SELECT f.body,f.body_hash FROM current_financial_fact f '
                      'JOIN current_financial_admission a ON a.id=f.admission_id '
                      'WHERE a.id=? AND a.ticker=? AND a.security_id=? AND a.economic_cutoff=?')
        rows = conn.execute(verify_sql, (admission_id, 'ACB', subject['securityId'], CUTOFF)).fetchall()
        require(len(rows) == len(facts) and all(checksum(row.encode()) == h for row, h in rows) and
                {row for row, _ in rows} == {canonical(f) for f in facts}, 'BANK_FACT_READBACK_MISMATCH')
        require(not conn.execute(verify_sql, (admission_id, 'VNM', subject['securityId'], CUTOFF)).fetchall()
                and not conn.execute(verify_sql, (admission_id, 'ACB', subject['securityId'],
                                                 '2026-10-29')).fetchall(), 'BANK_CROSS_SCOPE_READBACK')
        require(all(checksum(raw) == h for h, raw in conn.execute(
            'SELECT hash,payload FROM current_financial_raw')), 'BANK_RAW_READBACK_MISMATCH')
    return {'status': 'PASS_ISOLATED_SOURCE_REPLAY', 'executionId': env['executionId'],
            'admissionId': admission_id, 'admissionHash': checksum(encoded.encode()), 'request': subject,
            'knownAt': known_at, 'catalog': CATALOG, 'sourceDocuments': [doc for doc, _ in documents.values()],
            'facts': facts, 'idempotency': duplicates == [False, True], 'readback': 'PASS',
            'crossTickerAndCutoffReadback': 'REJECTED', 'productionAdmission': False,
            'datasetBinding': False, 'scoringAuthorized': False}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--q3-pdf', type=Path, help='Optional byte-identical copy of the pinned Q3 PDF.')
    parser.add_argument('--known-at', help='Exact operational timestamp for deterministic replay.')
    args = parser.parse_args()
    print(json.dumps(rehearsal(args.q3_pdf, args.known_at), ensure_ascii=False, indent=2))
