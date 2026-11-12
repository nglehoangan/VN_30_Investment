CREATE TABLE source_admission_event (
 id TEXT NOT NULL PRIMARY KEY,
 kind TEXT NOT NULL CHECK(kind IN ('QUARANTINE','REVOCATION')),
 target_id TEXT NOT NULL,
 known_at TEXT NOT NULL,
 body TEXT NOT NULL,
 body_hash TEXT NOT NULL
);
CREATE INDEX source_admission_event_target ON source_admission_event(target_id,kind);
CREATE TRIGGER source_admission_event_no_update BEFORE UPDATE ON source_admission_event BEGIN SELECT RAISE(ABORT,'IMMUTABLE_SOURCE_ADMISSION_EVENT'); END;
CREATE TRIGGER source_admission_event_no_delete BEFORE DELETE ON source_admission_event BEGIN SELECT RAISE(ABORT,'IMMUTABLE_SOURCE_ADMISSION_EVENT'); END;
