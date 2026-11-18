-- Isolated rehearsal only. No production migration or activation.
CREATE TABLE current_score_artifact (
 id TEXT PRIMARY KEY,
 binding_id TEXT NOT NULL,
 data_acceptance_id TEXT NOT NULL,
 body TEXT NOT NULL,
 body_hash TEXT NOT NULL
);
CREATE TRIGGER current_score_artifact_no_update BEFORE UPDATE ON current_score_artifact BEGIN SELECT RAISE(ABORT,'immutable current score'); END;
CREATE TRIGGER current_score_artifact_no_delete BEFORE DELETE ON current_score_artifact BEGIN SELECT RAISE(ABORT,'immutable current score'); END;
CREATE TRIGGER current_score_artifact_no_replace BEFORE INSERT ON current_score_artifact WHEN EXISTS(SELECT 1 FROM current_score_artifact WHERE id=NEW.id) BEGIN SELECT RAISE(ABORT,'immutable current score'); END;
