-- M6.6 append-only workflow history. No upstream rows are changed.
CREATE TABLE workflow_review (
 id TEXT PRIMARY KEY NOT NULL,
 identity_hash TEXT NOT NULL,
 portfolio_id TEXT NOT NULL,
 type TEXT NOT NULL CHECK(type IN ('WEEKLY','MONTHLY_DCA','QUARTERLY','ANNUAL','EVENT_DRIVEN')),
 supersedes_id TEXT REFERENCES workflow_review(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 recorded_at TEXT NOT NULL,
 body TEXT NOT NULL CHECK(json_valid(body)),
 body_hash TEXT NOT NULL,
 CHECK(supersedes_id IS NULL OR supersedes_id != id)
);
CREATE UNIQUE INDEX workflow_review_identity_hash_key ON workflow_review(identity_hash);
CREATE INDEX workflow_review_portfolio_id_type_idx ON workflow_review(portfolio_id,type);
CREATE TABLE workflow_proposal (
 id TEXT PRIMARY KEY NOT NULL,
 review_id TEXT NOT NULL REFERENCES workflow_review(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 body TEXT NOT NULL CHECK(json_valid(body)), body_hash TEXT NOT NULL
);
CREATE UNIQUE INDEX workflow_proposal_review_id_key ON workflow_proposal(review_id);
CREATE TABLE workflow_audit (
 id TEXT PRIMARY KEY NOT NULL,
 review_id TEXT NOT NULL REFERENCES workflow_review(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 body TEXT NOT NULL CHECK(json_valid(body)), body_hash TEXT NOT NULL
);
CREATE TABLE workflow_execution (
 id TEXT PRIMARY KEY NOT NULL,
 review_id TEXT NOT NULL REFERENCES workflow_review(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 transaction_id TEXT NOT NULL REFERENCES ledger_transaction(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 body TEXT NOT NULL CHECK(json_valid(body)), body_hash TEXT NOT NULL
);
CREATE UNIQUE INDEX workflow_execution_transaction_id_key ON workflow_execution(transaction_id);
CREATE TRIGGER workflow_review_no_update BEFORE UPDATE ON workflow_review BEGIN SELECT RAISE(ABORT, 'Immutable workflow'); END;
CREATE TRIGGER workflow_review_no_delete BEFORE DELETE ON workflow_review BEGIN SELECT RAISE(ABORT, 'Immutable workflow'); END;
CREATE TRIGGER workflow_review_no_replace BEFORE INSERT ON workflow_review WHEN EXISTS (SELECT 1 FROM workflow_review WHERE id = NEW.id OR identity_hash = NEW.identity_hash) BEGIN SELECT RAISE(ABORT, 'Duplicate immutable workflow'); END;
CREATE TRIGGER workflow_proposal_no_update BEFORE UPDATE ON workflow_proposal BEGIN SELECT RAISE(ABORT, 'Immutable workflow'); END;
CREATE TRIGGER workflow_proposal_no_delete BEFORE DELETE ON workflow_proposal BEGIN SELECT RAISE(ABORT, 'Immutable workflow'); END;
CREATE TRIGGER workflow_proposal_no_replace BEFORE INSERT ON workflow_proposal WHEN EXISTS (SELECT 1 FROM workflow_proposal WHERE id = NEW.id OR review_id = NEW.review_id) BEGIN SELECT RAISE(ABORT, 'Duplicate immutable workflow'); END;
CREATE TRIGGER workflow_audit_no_update BEFORE UPDATE ON workflow_audit BEGIN SELECT RAISE(ABORT, 'Immutable workflow'); END;
CREATE TRIGGER workflow_audit_no_delete BEFORE DELETE ON workflow_audit BEGIN SELECT RAISE(ABORT, 'Immutable workflow'); END;
CREATE TRIGGER workflow_audit_no_replace BEFORE INSERT ON workflow_audit WHEN EXISTS (SELECT 1 FROM workflow_audit WHERE id = NEW.id) BEGIN SELECT RAISE(ABORT, 'Duplicate immutable workflow'); END;
CREATE TRIGGER workflow_execution_no_update BEFORE UPDATE ON workflow_execution BEGIN SELECT RAISE(ABORT, 'Immutable workflow'); END;
CREATE TRIGGER workflow_execution_no_delete BEFORE DELETE ON workflow_execution BEGIN SELECT RAISE(ABORT, 'Immutable workflow'); END;
CREATE TRIGGER workflow_execution_no_replace BEFORE INSERT ON workflow_execution WHEN EXISTS (SELECT 1 FROM workflow_execution WHERE id = NEW.id OR transaction_id = NEW.transaction_id) BEGIN SELECT RAISE(ABORT, 'Duplicate immutable workflow'); END;
