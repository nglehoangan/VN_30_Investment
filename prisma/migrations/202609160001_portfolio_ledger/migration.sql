-- Additive M6.3 migration. No mutation of M6.2 methodology records.
CREATE TABLE portfolio (
 id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, currency TEXT NOT NULL CHECK(currency='VND'),
 inception_at TEXT NOT NULL, created_at TEXT NOT NULL, revision TEXT NOT NULL DEFAULT '0'
);
CREATE TABLE security (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL);
CREATE TABLE corporate_action_reference (id TEXT PRIMARY KEY NOT NULL, terms TEXT NOT NULL CHECK(json_valid(terms)));
CREATE TABLE ledger_transaction (
 corporate_action_id TEXT REFERENCES corporate_action_reference(id) ON DELETE RESTRICT ON UPDATE CASCADE,
 id TEXT PRIMARY KEY NOT NULL,
 portfolio_id TEXT NOT NULL REFERENCES portfolio(id) ON DELETE RESTRICT ON UPDATE CASCADE,
 security_id TEXT REFERENCES security(id) ON DELETE RESTRICT ON UPDATE CASCADE,
 type TEXT NOT NULL CHECK(type IN ('BUY','SELL','TRADE_SETTLEMENT','DIVIDEND_CASH','CASH_DEPOSIT','CASH_WITHDRAWAL','FEE','TAX','CORPORATE_ACTION','CASH_ADJUSTMENT','OPENING_BALANCE','REVERSAL')),
 status TEXT NOT NULL CHECK(status IN ('PENDING','POSTED')),
 event_at TEXT NOT NULL, created_at TEXT NOT NULL, source TEXT NOT NULL, source_reference TEXT NOT NULL,
 idempotency_key TEXT NOT NULL, methodology_id TEXT NOT NULL REFERENCES methodology_record(methodology_id) ON DELETE RESTRICT ON UPDATE CASCADE,
 revision TEXT NOT NULL, facts TEXT NOT NULL CHECK(json_valid(facts)), leg_count INTEGER NOT NULL CHECK(leg_count > 0),
 reverses_id TEXT REFERENCES ledger_transaction(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 settles_id TEXT REFERENCES ledger_transaction(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 CHECK ((type='REVERSAL') = (reverses_id IS NOT NULL)),
 CHECK ((type='TRADE_SETTLEMENT') = (settles_id IS NOT NULL))
);
CREATE UNIQUE INDEX ledger_transaction_reverses_id_key ON ledger_transaction(reverses_id);
CREATE UNIQUE INDEX ledger_transaction_portfolio_id_idempotency_key_key ON ledger_transaction(portfolio_id,idempotency_key);
CREATE UNIQUE INDEX ledger_transaction_portfolio_id_source_source_reference_key ON ledger_transaction(portfolio_id,source,source_reference);
CREATE INDEX ledger_transaction_portfolio_id_event_at_idx ON ledger_transaction(portfolio_id,event_at);
CREATE TABLE ledger_leg (
 id TEXT PRIMARY KEY NOT NULL, transaction_id TEXT NOT NULL REFERENCES ledger_transaction(id) ON DELETE RESTRICT ON UPDATE CASCADE,
 sequence INTEGER NOT NULL CHECK(sequence > 0),
 type TEXT NOT NULL CHECK(type IN ('SECURITY_QUANTITY','COST_BASIS_ADJUSTMENT','CASH','RECEIVABLE','PAYABLE','FEE_CASH','TAX_CASH','OTHER_CASH')),
 effective_at TEXT NOT NULL, security_id TEXT REFERENCES security(id) ON DELETE RESTRICT ON UPDATE CASCADE,
 quantity TEXT, amount TEXT,
 settlement_reference TEXT REFERENCES ledger_leg(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 CHECK ((type='SECURITY_QUANTITY' AND quantity IS NOT NULL AND amount IS NULL AND security_id IS NOT NULL) OR (type!='SECURITY_QUANTITY' AND amount IS NOT NULL AND quantity IS NULL)),
 CHECK(type!='COST_BASIS_ADJUSTMENT' OR security_id IS NOT NULL)
);
CREATE UNIQUE INDEX ledger_leg_transaction_id_sequence_key ON ledger_leg(transaction_id,sequence);
CREATE INDEX ledger_leg_effective_at_idx ON ledger_leg(effective_at);
CREATE TABLE portfolio_projection (
 portfolio_id TEXT PRIMARY KEY NOT NULL REFERENCES portfolio(id) ON DELETE RESTRICT ON UPDATE CASCADE,
 watermark TEXT NOT NULL, as_of TEXT NOT NULL, calculated_at TEXT NOT NULL, payload TEXT NOT NULL CHECK(json_valid(payload))
);
-- Structural immutability only; accounting rules remain in domain/application code.
CREATE TRIGGER ledger_header_insert BEFORE INSERT ON ledger_transaction WHEN NEW.status!='PENDING'
BEGIN SELECT RAISE(ABORT, 'construct pending aggregate first'); END;
CREATE TRIGGER ledger_header_update BEFORE UPDATE ON ledger_transaction WHEN OLD.status='POSTED'
BEGIN SELECT RAISE(ABORT, 'immutable posted transaction'); END;
CREATE TRIGGER ledger_header_delete BEFORE DELETE ON ledger_transaction WHEN OLD.status='POSTED'
BEGIN SELECT RAISE(ABORT, 'immutable posted transaction'); END;
CREATE TRIGGER ledger_finalize BEFORE UPDATE OF status ON ledger_transaction WHEN NEW.status='POSTED'
BEGIN
 SELECT CASE WHEN (SELECT count(*) FROM ledger_leg WHERE transaction_id=NEW.id)!=NEW.leg_count THEN RAISE(ABORT, 'incomplete aggregate') END;
 SELECT CASE WHEN EXISTS(SELECT 1 FROM ledger_transaction p WHERE p.id IN (NEW.reverses_id,NEW.settles_id) AND (p.portfolio_id!=NEW.portfolio_id OR p.status!='POSTED')) THEN RAISE(ABORT, 'invalid lineage') END;
END;
CREATE TRIGGER ledger_leg_insert BEFORE INSERT ON ledger_leg WHEN (SELECT status FROM ledger_transaction WHERE id=NEW.transaction_id)='POSTED'
BEGIN SELECT RAISE(ABORT, 'closed posted leg set'); END;
CREATE TRIGGER ledger_leg_update BEFORE UPDATE ON ledger_leg WHEN (SELECT status FROM ledger_transaction WHERE id=OLD.transaction_id)='POSTED' OR (SELECT status FROM ledger_transaction WHERE id=NEW.transaction_id)='POSTED'
BEGIN SELECT RAISE(ABORT, 'immutable posted leg'); END;
CREATE TRIGGER ledger_leg_delete BEFORE DELETE ON ledger_leg WHEN (SELECT status FROM ledger_transaction WHERE id=OLD.transaction_id)='POSTED'
BEGIN SELECT RAISE(ABORT, 'immutable posted leg'); END;

CREATE TRIGGER action_reference_update BEFORE UPDATE ON corporate_action_reference
BEGIN SELECT RAISE(ABORT, 'immutable action reference'); END;
CREATE TRIGGER action_reference_delete BEFORE DELETE ON corporate_action_reference
BEGIN SELECT RAISE(ABORT, 'immutable action reference'); END;
