-- Additive history and publication binding. Reuse market_boundary_dependency_head as CAS projection.
CREATE TABLE dependency_release (
 id TEXT PRIMARY KEY NOT NULL,
 body TEXT NOT NULL CHECK(json_valid(body)),
 body_hash TEXT NOT NULL UNIQUE,
 recorded_at TEXT NOT NULL,
 supersedes_id TEXT REFERENCES dependency_release(id) ON DELETE RESTRICT ON UPDATE RESTRICT
);
CREATE TABLE production_dependency_publication (
 id TEXT PRIMARY KEY NOT NULL,
 kind TEXT NOT NULL CHECK(kind IN ('ANALYSIS','DECISION')),
 record_id TEXT NOT NULL UNIQUE REFERENCES market_boundary_record(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 release_hash TEXT NOT NULL REFERENCES dependency_release(body_hash) ON DELETE RESTRICT ON UPDATE RESTRICT,
 body TEXT NOT NULL CHECK(json_valid(body)),body_hash TEXT NOT NULL
);
CREATE TRIGGER dependency_release_no_update BEFORE UPDATE ON dependency_release BEGIN SELECT RAISE(ABORT,'immutable dependency release'); END;
CREATE TRIGGER dependency_release_no_delete BEFORE DELETE ON dependency_release BEGIN SELECT RAISE(ABORT,'immutable dependency release'); END;
CREATE TRIGGER dependency_publication_no_update BEFORE UPDATE ON production_dependency_publication BEGIN SELECT RAISE(ABORT,'immutable dependency publication'); END;
CREATE TRIGGER dependency_publication_no_delete BEFORE DELETE ON production_dependency_publication BEGIN SELECT RAISE(ABORT,'immutable dependency publication'); END;
CREATE TABLE dependency_object_identity (
 key TEXT PRIMARY KEY NOT NULL,type TEXT NOT NULL,object_id TEXT NOT NULL,body_hash TEXT NOT NULL,
 UNIQUE(type,object_id)
);
CREATE TRIGGER dependency_identity_no_update BEFORE UPDATE ON dependency_object_identity BEGIN SELECT RAISE(ABORT,'immutable dependency identity'); END;
CREATE TRIGGER dependency_identity_no_delete BEFORE DELETE ON dependency_object_identity BEGIN SELECT RAISE(ABORT,'immutable dependency identity'); END;
