-- Phase 2.1: PREPARED ONLY. No production migration authorized.
-- SQLite CHECK requires a table rebuild. Preserve every existing column/value/index/trigger.
-- Exclusive transaction; prerequisites: quiesced writers, verified backup/restore and owner authorization.
PRAGMA foreign_keys=OFF;
BEGIN IMMEDIATE;
DROP TRIGGER ledger_header_insert;
DROP TRIGGER ledger_header_update;
DROP TRIGGER ledger_header_delete;
DROP TRIGGER ledger_finalize;
DROP TRIGGER ledger_leg_insert;
DROP TRIGGER ledger_leg_update;
DROP TRIGGER ledger_leg_delete;
CREATE TABLE new_ledger_transaction (
 corporate_action_id TEXT REFERENCES corporate_action_reference(id) ON DELETE RESTRICT ON UPDATE CASCADE,
 id TEXT PRIMARY KEY NOT NULL,
 portfolio_id TEXT NOT NULL REFERENCES portfolio(id) ON DELETE RESTRICT ON UPDATE CASCADE,
 security_id TEXT REFERENCES security(id) ON DELETE RESTRICT ON UPDATE CASCADE,
 type TEXT NOT NULL CHECK(type IN ('BUY','SELL','TRADE_SETTLEMENT','DIVIDEND_CASH','CASH_DEPOSIT','CASH_WITHDRAWAL','FEE','TAX','CORPORATE_ACTION','CASH_ADJUSTMENT','DIVIDEND_RECEIVABLE_SETTLEMENT','OPENING_BALANCE','REVERSAL')),
 status TEXT NOT NULL CHECK(status IN ('PENDING','POSTED')),
 event_at TEXT NOT NULL, created_at TEXT NOT NULL, source TEXT NOT NULL, source_reference TEXT NOT NULL,
 idempotency_key TEXT NOT NULL, methodology_id TEXT NOT NULL REFERENCES methodology_record(methodology_id) ON DELETE RESTRICT ON UPDATE CASCADE,
 revision TEXT NOT NULL, facts TEXT NOT NULL CHECK(json_valid(facts)), leg_count INTEGER NOT NULL CHECK(leg_count > 0),
 reverses_id TEXT REFERENCES ledger_transaction(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 settles_id TEXT REFERENCES ledger_transaction(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 CHECK ((type='REVERSAL') = (reverses_id IS NOT NULL)),
 CHECK ((type='TRADE_SETTLEMENT') = (settles_id IS NOT NULL))
);
INSERT INTO new_ledger_transaction SELECT * FROM ledger_transaction;
DROP TABLE ledger_transaction;
ALTER TABLE new_ledger_transaction RENAME TO ledger_transaction;
CREATE UNIQUE INDEX ledger_transaction_reverses_id_key ON ledger_transaction(reverses_id);
CREATE UNIQUE INDEX ledger_transaction_portfolio_id_idempotency_key_key ON ledger_transaction(portfolio_id,idempotency_key);
CREATE UNIQUE INDEX ledger_transaction_portfolio_id_source_source_reference_key ON ledger_transaction(portfolio_id,source,source_reference);
CREATE INDEX ledger_transaction_portfolio_id_event_at_idx ON ledger_transaction(portfolio_id,event_at);
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


CREATE TABLE dividend_settlement_audit (
 transaction_id TEXT PRIMARY KEY NOT NULL REFERENCES ledger_transaction(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 body TEXT NOT NULL CHECK(json_valid(body)), body_hash TEXT NOT NULL
);
CREATE TABLE dividend_receipt_owner (
 portfolio_id TEXT NOT NULL REFERENCES portfolio(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 namespace TEXT NOT NULL, receipt_id TEXT NOT NULL,
 transaction_id TEXT NOT NULL UNIQUE REFERENCES ledger_transaction(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 PRIMARY KEY(portfolio_id,namespace,receipt_id)
);
CREATE TRIGGER dividend_settlement_audit_update BEFORE UPDATE ON dividend_settlement_audit
BEGIN SELECT RAISE(ABORT, 'immutable settlement evidence'); END;
CREATE TRIGGER dividend_settlement_audit_delete BEFORE DELETE ON dividend_settlement_audit
BEGIN SELECT RAISE(ABORT, 'immutable settlement evidence'); END;
CREATE TRIGGER dividend_receipt_owner_update BEFORE UPDATE ON dividend_receipt_owner
BEGIN SELECT RAISE(ABORT, 'immutable settlement evidence'); END;
CREATE TRIGGER dividend_receipt_owner_delete BEFORE DELETE ON dividend_receipt_owner
BEGIN SELECT RAISE(ABORT, 'immutable settlement evidence'); END;
COMMIT;
PRAGMA foreign_keys=ON;
