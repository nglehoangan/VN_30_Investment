-- Additive extension of the existing Market Boundary store, not a parallel database.
CREATE TABLE market_boundary_ingest_raw (
 raw_hash TEXT PRIMARY KEY NOT NULL, provider TEXT NOT NULL,
 original_path TEXT NOT NULL, raw_text TEXT NOT NULL
);
CREATE TABLE market_boundary_ingest_link (
 identity_key TEXT PRIMARY KEY NOT NULL,
 run_id TEXT NOT NULL, semantic_hash TEXT NOT NULL,
 capability_id TEXT NOT NULL REFERENCES market_boundary_record(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 market_id TEXT NOT NULL UNIQUE REFERENCES market_boundary_record(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 raw_hash TEXT NOT NULL REFERENCES market_boundary_ingest_raw(raw_hash) ON DELETE RESTRICT ON UPDATE RESTRICT,
 request_hash TEXT NOT NULL, provenance TEXT NOT NULL CHECK(json_valid(provenance))
);
CREATE INDEX market_boundary_ingest_run_idx ON market_boundary_ingest_link(run_id);
CREATE TABLE market_boundary_ingest_quarantine (
 id TEXT PRIMARY KEY NOT NULL, raw_hash TEXT NOT NULL REFERENCES market_boundary_ingest_raw(raw_hash) ON DELETE RESTRICT ON UPDATE RESTRICT,
 reason TEXT NOT NULL, body TEXT NOT NULL CHECK(json_valid(body))
);
CREATE TABLE market_boundary_ingest_revocation (
 identity_key TEXT PRIMARY KEY NOT NULL REFERENCES market_boundary_ingest_link(identity_key) ON DELETE RESTRICT ON UPDATE RESTRICT,
 revoked_at TEXT NOT NULL, reason TEXT NOT NULL
);
CREATE TRIGGER market_ingest_raw_no_update BEFORE UPDATE ON market_boundary_ingest_raw BEGIN SELECT RAISE(ABORT,'immutable market raw evidence'); END;
CREATE TRIGGER market_ingest_raw_no_delete BEFORE DELETE ON market_boundary_ingest_raw BEGIN SELECT RAISE(ABORT,'immutable market raw evidence'); END;
CREATE TRIGGER market_ingest_link_no_update BEFORE UPDATE ON market_boundary_ingest_link BEGIN SELECT RAISE(ABORT,'immutable market linkage'); END;
CREATE TRIGGER market_ingest_link_no_delete BEFORE DELETE ON market_boundary_ingest_link BEGIN SELECT RAISE(ABORT,'immutable market linkage'); END;
CREATE TRIGGER market_ingest_quarantine_no_update BEFORE UPDATE ON market_boundary_ingest_quarantine BEGIN SELECT RAISE(ABORT,'immutable market quarantine'); END;
CREATE TRIGGER market_ingest_quarantine_no_delete BEFORE DELETE ON market_boundary_ingest_quarantine BEGIN SELECT RAISE(ABORT,'immutable market quarantine'); END;
CREATE TRIGGER market_ingest_revocation_no_update BEFORE UPDATE ON market_boundary_ingest_revocation BEGIN SELECT RAISE(ABORT,'immutable market revocation'); END;
CREATE TRIGGER market_ingest_revocation_no_delete BEFORE DELETE ON market_boundary_ingest_revocation BEGIN SELECT RAISE(ABORT,'immutable market revocation'); END;
-- Additional valid captures with the same raw close are audit corroboration, never source rewrites.
CREATE TABLE market_boundary_ingest_receipt (
 id TEXT PRIMARY KEY NOT NULL,
 market_id TEXT NOT NULL REFERENCES market_boundary_record(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 raw_hash TEXT NOT NULL REFERENCES market_boundary_ingest_raw(raw_hash) ON DELETE RESTRICT ON UPDATE RESTRICT,
 request_hash TEXT NOT NULL,
 provenance TEXT NOT NULL CHECK(json_valid(provenance))
);
CREATE TRIGGER market_ingest_receipt_no_update BEFORE UPDATE ON market_boundary_ingest_receipt BEGIN SELECT RAISE(ABORT,'immutable market receipt'); END;
CREATE TRIGGER market_ingest_receipt_no_delete BEFORE DELETE ON market_boundary_ingest_receipt BEGIN SELECT RAISE(ABORT,'immutable market receipt'); END;
