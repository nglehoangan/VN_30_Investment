CREATE TABLE fundamental_availability_assessment (
 id TEXT NOT NULL PRIMARY KEY, observation_id TEXT NOT NULL, policy_version TEXT NOT NULL,
 available_at TEXT, assessed_at TEXT NOT NULL, body TEXT NOT NULL CHECK(json_valid(body) AND length(body)<=4000000), body_hash TEXT NOT NULL CHECK(length(body_hash)=64),
 FOREIGN KEY(observation_id) REFERENCES fundamental_observation(id) ON DELETE RESTRICT ON UPDATE RESTRICT
);
CREATE INDEX fundamental_availability_assessment_observation_id_policy_version_idx ON fundamental_availability_assessment(observation_id,policy_version);
CREATE INDEX fundamental_availability_assessment_available_at_idx ON fundamental_availability_assessment(available_at);
CREATE TABLE fundamental_snapshot_content (
 content_hash TEXT NOT NULL PRIMARY KEY CHECK(length(content_hash)=64), manifest TEXT NOT NULL CHECK(json_valid(manifest) AND length(manifest)<=16000000), manifest_digest TEXT NOT NULL CHECK(length(manifest_digest)=64)
);
CREATE TABLE fundamental_snapshot_run (
 run_id TEXT NOT NULL PRIMARY KEY, content_hash TEXT NOT NULL, built_at TEXT NOT NULL,
 body TEXT NOT NULL CHECK(json_valid(body) AND length(body)<=16000000), body_hash TEXT NOT NULL CHECK(length(body_hash)=64),
 FOREIGN KEY(content_hash) REFERENCES fundamental_snapshot_content(content_hash) ON DELETE RESTRICT ON UPDATE RESTRICT
);
CREATE INDEX fundamental_snapshot_run_content_hash_built_at_idx ON fundamental_snapshot_run(content_hash,built_at);
CREATE TABLE fundamental_snapshot_member (
 run_id TEXT NOT NULL, observation_id TEXT NOT NULL, assessment_id TEXT NOT NULL, selected BOOLEAN NOT NULL CHECK(selected IN(0,1)),
 PRIMARY KEY(run_id,observation_id),
 FOREIGN KEY(run_id) REFERENCES fundamental_snapshot_run(run_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 FOREIGN KEY(observation_id) REFERENCES fundamental_observation(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 FOREIGN KEY(assessment_id) REFERENCES fundamental_availability_assessment(id) ON DELETE RESTRICT ON UPDATE RESTRICT
);
CREATE TRIGGER fundamental_availability_assessment_no_update BEFORE UPDATE ON fundamental_availability_assessment BEGIN SELECT RAISE(ABORT,'Immutable snapshot evidence'); END;
CREATE TRIGGER fundamental_availability_assessment_no_delete BEFORE DELETE ON fundamental_availability_assessment BEGIN SELECT RAISE(ABORT,'Immutable snapshot evidence'); END;
CREATE TRIGGER fundamental_availability_assessment_no_replace BEFORE INSERT ON fundamental_availability_assessment WHEN EXISTS(SELECT 1 FROM fundamental_availability_assessment WHERE id=NEW.id) BEGIN SELECT RAISE(ABORT,'Snapshot evidence exists'); END;
CREATE TRIGGER fundamental_snapshot_content_no_update BEFORE UPDATE ON fundamental_snapshot_content BEGIN SELECT RAISE(ABORT,'Immutable snapshot evidence'); END;
CREATE TRIGGER fundamental_snapshot_content_no_delete BEFORE DELETE ON fundamental_snapshot_content BEGIN SELECT RAISE(ABORT,'Immutable snapshot evidence'); END;
CREATE TRIGGER fundamental_snapshot_content_no_replace BEFORE INSERT ON fundamental_snapshot_content WHEN EXISTS(SELECT 1 FROM fundamental_snapshot_content WHERE content_hash=NEW.content_hash) BEGIN SELECT RAISE(ABORT,'Snapshot evidence exists'); END;
CREATE TRIGGER fundamental_snapshot_run_no_update BEFORE UPDATE ON fundamental_snapshot_run BEGIN SELECT RAISE(ABORT,'Immutable snapshot evidence'); END;
CREATE TRIGGER fundamental_snapshot_run_no_delete BEFORE DELETE ON fundamental_snapshot_run BEGIN SELECT RAISE(ABORT,'Immutable snapshot evidence'); END;
CREATE TRIGGER fundamental_snapshot_run_no_replace BEFORE INSERT ON fundamental_snapshot_run WHEN EXISTS(SELECT 1 FROM fundamental_snapshot_run WHERE run_id=NEW.run_id) BEGIN SELECT RAISE(ABORT,'Snapshot evidence exists'); END;
CREATE TRIGGER fundamental_snapshot_member_no_update BEFORE UPDATE ON fundamental_snapshot_member BEGIN SELECT RAISE(ABORT,'Immutable snapshot evidence'); END;
CREATE TRIGGER fundamental_snapshot_member_no_delete BEFORE DELETE ON fundamental_snapshot_member BEGIN SELECT RAISE(ABORT,'Immutable snapshot evidence'); END;
CREATE TRIGGER fundamental_snapshot_member_no_replace BEFORE INSERT ON fundamental_snapshot_member WHEN EXISTS(SELECT 1 FROM fundamental_snapshot_member WHERE run_id=NEW.run_id AND observation_id=NEW.observation_id) BEGIN SELECT RAISE(ABORT,'Snapshot evidence exists'); END;
CREATE TRIGGER fundamental_snapshot_member_manifest BEFORE INSERT ON fundamental_snapshot_member
WHEN NOT EXISTS(
 SELECT 1 FROM fundamental_snapshot_run r, json_each(r.body,'$.snapshot.request.assessmentPins') p
 WHERE r.run_id=NEW.run_id AND json_extract(p.value,'$.observationId')=NEW.observation_id AND json_extract(p.value,'$.assessmentId')=NEW.assessment_id
) OR NOT EXISTS(SELECT 1 FROM fundamental_availability_assessment a WHERE a.id=NEW.assessment_id AND a.observation_id=NEW.observation_id)
BEGIN SELECT RAISE(ABORT,'Member must bind sealed run manifest and observation assessment'); END;
CREATE TABLE fundamental_snapshot_derived_member (
 run_id TEXT NOT NULL, derivation_id TEXT NOT NULL, selected BOOLEAN NOT NULL CHECK(selected IN(0,1)),
 PRIMARY KEY(run_id,derivation_id),
 FOREIGN KEY(run_id) REFERENCES fundamental_snapshot_run(run_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 FOREIGN KEY(derivation_id) REFERENCES fundamental_derivation(id) ON DELETE RESTRICT ON UPDATE RESTRICT
);
CREATE TRIGGER fundamental_snapshot_derived_member_no_update BEFORE UPDATE ON fundamental_snapshot_derived_member BEGIN SELECT RAISE(ABORT,'Immutable derived snapshot member'); END;
CREATE TRIGGER fundamental_snapshot_derived_member_no_delete BEFORE DELETE ON fundamental_snapshot_derived_member BEGIN SELECT RAISE(ABORT,'Immutable derived snapshot member'); END;
CREATE TRIGGER fundamental_snapshot_derived_member_no_replace BEFORE INSERT ON fundamental_snapshot_derived_member WHEN EXISTS(SELECT 1 FROM fundamental_snapshot_derived_member WHERE run_id=NEW.run_id AND derivation_id=NEW.derivation_id) BEGIN SELECT RAISE(ABORT,'Derived snapshot member exists'); END;
CREATE TRIGGER fundamental_snapshot_derived_member_manifest BEFORE INSERT ON fundamental_snapshot_derived_member WHEN NOT EXISTS(
 SELECT 1 FROM fundamental_snapshot_run r,json_each(r.body,'$.snapshot.request.derivedIds') d WHERE r.run_id=NEW.run_id AND d.value=NEW.derivation_id
) BEGIN SELECT RAISE(ABORT,'Derived member must bind sealed run manifest'); END;
