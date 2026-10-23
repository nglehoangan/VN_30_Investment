-- PEC-1C additive installation contract. NOT installed into data/vn30.sqlite.
-- Reuses SQLite transactions; existing workflow_audit is portfolio-review specific.
CREATE TABLE formal_knowledge_audit (
 event_id TEXT PRIMARY KEY NOT NULL,
 event_hash TEXT UNIQUE NOT NULL CHECK(length(event_hash)=64),
 stream_id TEXT NOT NULL CHECK(length(stream_id)=64),
 request_hash TEXT NOT NULL CHECK(length(request_hash)=64),
 previous_event_hash TEXT REFERENCES formal_knowledge_audit(event_hash) ON DELETE RESTRICT ON UPDATE RESTRICT,
 recorded_at TEXT NOT NULL,
 transaction_reference TEXT UNIQUE NOT NULL,
 event_body TEXT NOT NULL CHECK(json_valid(event_body)),
 authorization_body TEXT NOT NULL CHECK(json_valid(authorization_body)),
 operation_body TEXT NOT NULL CHECK(json_valid(operation_body)),
 evidence BLOB NOT NULL,
 row_hash TEXT NOT NULL CHECK(length(row_hash)=64)
);
CREATE UNIQUE INDEX formal_knowledge_audit_single_child
 ON formal_knowledge_audit(stream_id,COALESCE(previous_event_hash,'GENESIS'));
CREATE TRIGGER formal_knowledge_audit_no_update BEFORE UPDATE ON formal_knowledge_audit
 BEGIN SELECT RAISE(ABORT,'Immutable formal knowledge audit'); END;
CREATE TRIGGER formal_knowledge_audit_no_delete BEFORE DELETE ON formal_knowledge_audit
 BEGIN SELECT RAISE(ABORT,'Immutable formal knowledge audit'); END;
CREATE TRIGGER formal_knowledge_audit_no_replace BEFORE INSERT ON formal_knowledge_audit
 WHEN EXISTS(SELECT 1 FROM formal_knowledge_audit WHERE event_id=NEW.event_id OR event_hash=NEW.event_hash)
 BEGIN SELECT RAISE(ABORT,'Duplicate immutable formal knowledge audit'); END;
CREATE TRIGGER formal_knowledge_audit_chain BEFORE INSERT ON formal_knowledge_audit
 WHEN NEW.previous_event_hash IS NOT NULL AND NOT EXISTS(
 SELECT 1 FROM formal_knowledge_audit WHERE event_hash=NEW.previous_event_hash
 AND stream_id=NEW.stream_id AND recorded_at<=NEW.recorded_at)
 BEGIN SELECT RAISE(ABORT,'Invalid formal knowledge audit chain'); END;
