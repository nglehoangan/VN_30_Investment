#!/usr/bin/env python3
"""Offline WP1 diagnostics. SELECT-only immutable SQLite; sanitized stdout, no writes."""
import hashlib
import json
import sqlite3
import sys
from decimal import Decimal
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / 'data/vn30.sqlite'
GOV = ROOT / 'docs/fundamental-data-engine/governance'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def audit():
    for suffix in ('-wal', '-journal'):
        sidecar = Path(str(DB) + suffix)
        if sidecar.exists() and sidecar.stat().st_size:
            raise RuntimeError('Live sidecar: refuse immutable replay')
    protected = [DB, *sorted((ROOT / 'data/account-current').glob('*.json'))]
    before = {str(p.relative_to(ROOT)): sha(p) for p in protected}
    confirmations = json.loads((GOV / 'PORTFOLIO_OWNER_CONFIRMATIONS_2026-10-31.json').read_text())
    for pin in confirmations['filePins']:
        assert sha(ROOT / pin['path']) == pin['sha256'], 'Owner evidence pin mismatch'
    c = sqlite3.connect(DB.as_uri() + '?mode=ro&immutable=1', uri=True)
    c.row_factory = sqlite3.Row
    try:
        assert c.execute('PRAGMA integrity_check').fetchone()[0] == 'ok'
        assert not c.execute('PRAGMA foreign_key_check').fetchall()
        count = 0
        for row in c.execute('SELECT body, body_hash FROM broker_observation'):
            assert hashlib.sha256(row['body'].encode()).hexdigest() == row['body_hash'], 'Observation body mismatch'
            count += 1

        def observation(ref):
            pin = confirmations['sourceEvidence'][ref]
            row = c.execute('SELECT * FROM broker_observation WHERE id=?', (pin['id'],)).fetchone()
            assert row and row['body_hash'] == pin['bodySha256'] and row['received_at'] == pin['receivedAt']
            body = json.loads(row['body'], parse_float=Decimal)
            if 'raw' in body:
                assert hashlib.sha256(body['raw'].encode()).hexdigest() == body['rawSha256']
                raw = json.loads(body['raw'], parse_float=Decimal)
                assert raw['stock'] == body['data']['stock'], 'Normalized/raw holdings mismatch'
            for ticker, expected in pin['stock'].items():
                stock = body['data']['stock'][int(expected['jsonPointer'].split('/')[-1])]
                assert stock['symbol'] == ticker
                for field, key in [('totalQtty', 'total'), ('availableTrading', 'available'), ('stockDividend', 'pendingStockDividend'), ('cashDividend', 'pendingCashDividend')]:
                    assert Decimal(str(stock[field])) == Decimal(expected[key])
            return body

        opening, latest = observation('opening'), observation('latest')
        profile_id = 'TCBS_API_RESPONSE:2aafee3f2905ea8ac3d3db67e77cd936302f710e31cc750167af54a6b3be606c'
        balance_id = 'TCBS_API_RESPONSE:9e37ee7a6e882888e80370237c151efa02184399815df7c879f66405f3836253'
        profile = json.loads(c.execute('SELECT body FROM broker_observation WHERE id=?', (profile_id,)).fetchone()[0])['data']
        balance = json.loads(c.execute('SELECT body FROM broker_observation WHERE id=?', (balance_id,)).fetchone()[0])['data']['data'][0]
        assert latest['data']['custodyID'] == balance['custodyID'] == profile['basicInfo']['code105C']
        assert latest['data']['accountNo'] == balance['accountNo']
        assert opening['data']['custodyID'] == latest['data']['custodyID']
        assert opening['data']['accountNo'] == latest['data']['accountNo']
        observed = {k: str(Decimal(str(balance[k]))) for k in ['cashBalance', 'cashDevident', 'depoFee', 'avlWithdraw']}
        assert {k: Decimal(v) for k, v in observed.items()} == {'cashBalance': Decimal(327420), 'cashDevident': Decimal(475000), 'depoFee': Decimal(420), 'avlWithdraw': Decimal(327000)}
        transactions = []
        for row in c.execute('SELECT * FROM ledger_transaction ORDER BY event_at,id'):
            tx = json.loads(row['facts'])
            assert row['type'] == tx['facts']['type'] == 'OPENING_BALANCE' and row['status'] == tx['status'] == 'POSTED'
            stored = c.execute('SELECT * FROM ledger_leg WHERE transaction_id=? ORDER BY sequence', (row['id'],)).fetchall()
            assert len(stored) == row['leg_count'] == len(tx['legs'])
            for actual, expected in zip(stored, tx['legs']):
                for col, key in [('id','id'), ('sequence','sequence'), ('type','type'), ('effective_at','effectiveAt'), ('security_id','securityId'), ('quantity','quantity'), ('amount','amount'), ('settlement_reference','settlementReference')]:
                    assert actual[col] == expected[key], 'Saved leg mismatch'
            transactions.append(tx)
        totals = {kind: sum((Decimal(row[0]) for row in c.execute('SELECT amount FROM ledger_leg WHERE type=?', (kind,))), Decimal(0)) for kind in ['CASH', 'RECEIVABLE', 'PAYABLE', 'COST_BASIS_ADJUSTMENT']}
        assert totals == dict(CASH=Decimal(232420), RECEIVABLE=Decimal(570000), PAYABLE=Decimal(0), COST_BASIS_ADJUSTMENT=Decimal(81980830))
        cash_path = ROOT / confirmations['facts'][1]['sourcePath']
        receipt = json.loads(cash_path.read_text())['reports'][1]['rows'][57]
        assert receipt['date'] == '2026-10-16' and receipt['amountVnd'] == '95000'
        assert 'MWG' in receipt['dividendDescription'] and '08/10/2026' in receipt['dividendDescription']
        assert receipt['sourceCells'] == dict(date='A71', type='B71', amount='C71', balance='D71', description='E71')
        assert totals['CASH'] + Decimal(receipt['amountVnd']) == Decimal(observed['cashBalance'])
        assert totals['RECEIVABLE'] - Decimal(receipt['amountVnd']) == Decimal(observed['cashDevident'])
        positions = [dict(securityId=t['facts']['securityId'], quantity=t['facts']['quantity']) for t in transactions if t['facts'].get('securityId')]
        partitions = [dict(securityId=r['symbol'], total=str(Decimal(str(r['totalQtty']))), available=str(Decimal(str(r['availableTrading']))), pending=str(Decimal(str(r['stockDividend']))), actionReference=None) for r in latest['data']['stock']]
        result = dict(contract='wp1-retained-accounting-audit-v1', protectedFileHashes=before, ownerEvidencePinsVerified=len(confirmations['filePins']), observationHashesVerified=count,
                      accountScopeMatches=True, rawTextAvailability=dict(opening='raw' in opening, latest='raw' in latest), ledgerTransactions=len(transactions), ledgerLegs=sum(len(t['legs']) for t in transactions),
                      ledgerTotals={k: str(v) for k,v in totals.items()}, ledgerPositions=positions,
                      observation=dict(sourceReference=confirmations['sourceEvidence']['latest']['id'], accountReference='PRIVATE_SCOPE_MATCH_VERIFIED', receivedAt=latest['receivedAt'], economicAsOf=None, positions=partitions),
                      observedBalance=observed, receipt=receipt, originalClaim=dict(issuer='MWG', amount='95000', pointer='/data/stock/4/cashDividend', observationId=confirmations['sourceEvidence']['opening']['id']),
                      receiptAlreadyInConfirmedCash=True, commonEconomicInstantCertified=False, productionAccepted=False)
        if '--transactions' in sys.argv:
            result['transactions'] = transactions
    finally:
        c.close()
    assert before == {str(p.relative_to(ROOT)): sha(p) for p in protected}, 'Protected bytes changed'
    result['protectedBytesUnchanged'] = True
    return result


if __name__ == '__main__':
    print(json.dumps(audit(), ensure_ascii=False, indent=2))
