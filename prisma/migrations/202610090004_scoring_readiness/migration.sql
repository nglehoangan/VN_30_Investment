-- Additive Slice 06. No historical binding backfill or production acceptance seeds.
CREATE TABLE data_initialization_acceptance (
 id TEXT NOT NULL PRIMARY KEY, snapshot_run_id TEXT NOT NULL, accepted_at TEXT NOT NULL,
 body TEXT NOT NULL CHECK(json_valid(body) AND length(body)<=16000000), body_hash TEXT NOT NULL CHECK(length(body_hash)=64),
 FOREIGN KEY(snapshot_run_id) REFERENCES fundamental_snapshot_run(run_id) ON DELETE RESTRICT ON UPDATE RESTRICT
);
CREATE INDEX data_initialization_acceptance_snapshot_run_id_accepted_at_idx ON data_initialization_acceptance(snapshot_run_id,accepted_at);
CREATE TABLE scoring_dataset_binding (
 scorecard_id TEXT NOT NULL PRIMARY KEY, snapshot_run_id TEXT NOT NULL, acceptance_id TEXT NOT NULL,
 input_hash TEXT NOT NULL CHECK(length(input_hash)=64), created_at TEXT NOT NULL,
 body TEXT NOT NULL CHECK(json_valid(body) AND length(body)<=4000000), body_hash TEXT NOT NULL CHECK(length(body_hash)=64),
 FOREIGN KEY(scorecard_id) REFERENCES analytical_artifact(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 FOREIGN KEY(snapshot_run_id) REFERENCES fundamental_snapshot_run(run_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 FOREIGN KEY(acceptance_id) REFERENCES data_initialization_acceptance(id) ON DELETE RESTRICT ON UPDATE RESTRICT
);
CREATE TRIGGER scoring_dataset_binding_admission BEFORE INSERT ON scoring_dataset_binding WHEN
 NOT EXISTS(SELECT 1 FROM analytical_artifact a WHERE a.id=NEW.scorecard_id AND a.kind='SCORECARD' AND json_extract(a.body,'$.input.artifactScope')='FORMAL') OR
 NOT EXISTS(SELECT 1 FROM data_initialization_acceptance d WHERE d.id=NEW.acceptance_id AND d.snapshot_run_id=NEW.snapshot_run_id) OR
 json_extract(NEW.body,'$.selection.snapshotRunId') IS NOT NEW.snapshot_run_id OR
 json_extract(NEW.body,'$.selection.acceptanceId') IS NOT NEW.acceptance_id OR json_extract(NEW.body,'$.inputHash') IS NOT NEW.input_hash
 BEGIN SELECT RAISE(ABORT,'Score must bind exact formal dataset and acceptance'); END;
CREATE TRIGGER data_initialization_acceptance_no_update BEFORE UPDATE ON data_initialization_acceptance BEGIN SELECT RAISE(ABORT,'Immutable scoring readiness artifact'); END;
CREATE TRIGGER data_initialization_acceptance_no_delete BEFORE DELETE ON data_initialization_acceptance BEGIN SELECT RAISE(ABORT,'Immutable scoring readiness artifact'); END;
CREATE TRIGGER data_initialization_acceptance_no_replace BEFORE INSERT ON data_initialization_acceptance WHEN EXISTS(SELECT 1 FROM data_initialization_acceptance WHERE id=NEW.id) BEGIN SELECT RAISE(ABORT,'Immutable scoring readiness artifact'); END;
CREATE TRIGGER scoring_dataset_binding_no_update BEFORE UPDATE ON scoring_dataset_binding BEGIN SELECT RAISE(ABORT,'Immutable scoring readiness artifact'); END;
CREATE TRIGGER scoring_dataset_binding_no_delete BEFORE DELETE ON scoring_dataset_binding BEGIN SELECT RAISE(ABORT,'Immutable scoring readiness artifact'); END;
CREATE TRIGGER scoring_dataset_binding_no_replace BEFORE INSERT ON scoring_dataset_binding WHEN EXISTS(SELECT 1 FROM scoring_dataset_binding WHERE scorecard_id=NEW.scorecard_id) BEGIN SELECT RAISE(ABORT,'Immutable scoring readiness artifact'); END;
