-- PREPARED ONLY. Phase 2.2 isolated validation; production execution requires owner authorization.
BEGIN IMMEDIATE;
CREATE TABLE forward_intake_event (
 portfolio_id TEXT NOT NULL REFERENCES portfolio(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 event_namespace TEXT NOT NULL,event_id TEXT NOT NULL,component TEXT NOT NULL,source_revision TEXT NOT NULL,
 transaction_id TEXT NOT NULL UNIQUE REFERENCES ledger_transaction(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 body TEXT NOT NULL CHECK(json_valid(body)),body_hash TEXT NOT NULL,
 PRIMARY KEY(portfolio_id,event_namespace,event_id,component,source_revision)
);
CREATE TRIGGER forward_intake_event_update BEFORE UPDATE ON forward_intake_event
BEGIN SELECT RAISE(ABORT,'immutable forward intake evidence'); END;
CREATE TRIGGER forward_intake_event_delete BEFORE DELETE ON forward_intake_event
BEGIN SELECT RAISE(ABORT,'immutable forward intake evidence'); END;
COMMIT;
