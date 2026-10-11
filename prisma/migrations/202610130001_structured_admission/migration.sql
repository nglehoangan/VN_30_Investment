CREATE TABLE fundamental_admission_run (
 id TEXT NOT NULL PRIMARY KEY,
 content_hash TEXT NOT NULL UNIQUE CHECK(length(content_hash)=64),
 policy_version TEXT NOT NULL,
 analysis_at TEXT NOT NULL,
 body TEXT NOT NULL CHECK(json_valid(body) AND length(body)<=64000000),
 body_hash TEXT NOT NULL CHECK(length(body_hash)=64),
 previous_manual_snapshot_id TEXT NOT NULL,
 created_at TEXT NOT NULL,
 CHECK(json_extract(body,'$.contract')='structured-issuer-verified-current-v1'),
 CHECK(json_extract(body,'$.readyForScoring')=0)
);
CREATE TRIGGER fundamental_admission_run_no_update BEFORE UPDATE ON fundamental_admission_run BEGIN SELECT RAISE(ABORT,'Immutable financial admission'); END;
CREATE TRIGGER fundamental_admission_run_no_delete BEFORE DELETE ON fundamental_admission_run BEGIN SELECT RAISE(ABORT,'Immutable financial admission'); END;
CREATE TRIGGER fundamental_admission_run_no_replace BEFORE INSERT ON fundamental_admission_run WHEN EXISTS(SELECT 1 FROM fundamental_admission_run WHERE id=NEW.id OR content_hash=NEW.content_hash) BEGIN SELECT RAISE(ABORT,'Financial admission already exists'); END;
