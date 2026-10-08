-- Reviewed additive Slice 1: four analytical tables only; no ledger changes or seeds.
CREATE TABLE "fundamental_source_version" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "recorded_at" TEXT NOT NULL,
 "body" TEXT NOT NULL CHECK(json_valid("body")),
 "body_hash" TEXT NOT NULL CHECK(length("body_hash")=64)
);
CREATE TABLE "fundamental_import_batch" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "source_version_id" TEXT NOT NULL,
 "completed_at" TEXT NOT NULL,
 "body" TEXT NOT NULL CHECK(json_valid("body")),
 "body_hash" TEXT NOT NULL CHECK(length("body_hash")=64),
 FOREIGN KEY("source_version_id") REFERENCES "fundamental_source_version"("id") ON DELETE RESTRICT ON UPDATE RESTRICT
);
CREATE UNIQUE INDEX "fundamental_import_batch_id_source_version_id_key" ON "fundamental_import_batch"("id","source_version_id");
CREATE INDEX "fundamental_import_batch_source_version_id_completed_at_idx" ON "fundamental_import_batch"("source_version_id","completed_at");
CREATE TABLE "fundamental_raw_capture" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "source_version_id" TEXT NOT NULL,
 "import_execution_id" TEXT NOT NULL,
 "retrieved_at" TEXT NOT NULL,
 "payload_hash" TEXT NOT NULL CHECK(length("payload_hash")=64),
 "body" TEXT NOT NULL CHECK(json_valid("body")),
 "body_hash" TEXT NOT NULL CHECK(length("body_hash")=64),
 FOREIGN KEY("source_version_id") REFERENCES "fundamental_source_version"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
 FOREIGN KEY("import_execution_id","source_version_id") REFERENCES "fundamental_import_batch"("id","source_version_id") ON DELETE RESTRICT ON UPDATE RESTRICT
);
CREATE UNIQUE INDEX "fundamental_raw_capture_id_source_version_id_key" ON "fundamental_raw_capture"("id","source_version_id");
CREATE INDEX "fundamental_raw_capture_source_version_id_retrieved_at_idx" ON "fundamental_raw_capture"("source_version_id","retrieved_at");
CREATE TABLE "fundamental_observation" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "security_id" TEXT NOT NULL,
 "source_version_id" TEXT NOT NULL,
 "raw_capture_id" TEXT NOT NULL,
 "item_id" TEXT NOT NULL,
 "registry_hash" TEXT NOT NULL CHECK(length("registry_hash")=64),
 "reporting_scope" TEXT NOT NULL CHECK("reporting_scope" IN ('CONSOLIDATED','SEPARATE_STANDALONE')),
 "period_start" TEXT NOT NULL,
 "period_end" TEXT NOT NULL CHECK("period_end">="period_start"),
 "field_locator" TEXT NOT NULL,
 "mapping_version" TEXT NOT NULL,
 "ingested_at" TEXT NOT NULL,
 "normalized_value" TEXT,
 "available_at" TEXT CHECK("available_at" IS NULL),
 "availability_status" TEXT NOT NULL CHECK("availability_status"='UNKNOWN'),
 "supersedes_observation_id" TEXT CHECK("supersedes_observation_id" IS NULL OR "supersedes_observation_id"<>"id"),
 "body" TEXT NOT NULL CHECK(json_valid("body")),
 "body_hash" TEXT NOT NULL CHECK(length("body_hash")=64),
 FOREIGN KEY("security_id") REFERENCES "security"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
 FOREIGN KEY("source_version_id") REFERENCES "fundamental_source_version"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
 FOREIGN KEY("raw_capture_id","source_version_id") REFERENCES "fundamental_raw_capture"("id","source_version_id") ON DELETE RESTRICT ON UPDATE RESTRICT,
 FOREIGN KEY("supersedes_observation_id") REFERENCES "fundamental_observation"("id") ON DELETE RESTRICT ON UPDATE RESTRICT
);
CREATE UNIQUE INDEX "fundamental_observation_raw_capture_id_item_id_registry_hash_reporting_scope_period_start_period_end_field_locator_mapping_version_key" ON "fundamental_observation"("raw_capture_id","item_id","registry_hash","reporting_scope","period_start","period_end","field_locator","mapping_version");
CREATE INDEX "fundamental_observation_security_id_item_id_reporting_scope_period_end_idx" ON "fundamental_observation"("security_id","item_id","reporting_scope","period_end");
CREATE INDEX "fundamental_observation_source_version_id_ingested_at_idx" ON "fundamental_observation"("source_version_id","ingested_at");
CREATE INDEX "fundamental_observation_supersedes_observation_id_idx" ON "fundamental_observation"("supersedes_observation_id");
CREATE TRIGGER "fundamental_source_version_no_update" BEFORE UPDATE ON "fundamental_source_version" BEGIN SELECT RAISE(ABORT, 'Immutable fundamental evidence'); END;
CREATE TRIGGER "fundamental_source_version_no_delete" BEFORE DELETE ON "fundamental_source_version" BEGIN SELECT RAISE(ABORT, 'Immutable fundamental evidence'); END;
CREATE TRIGGER "fundamental_source_version_no_replace" BEFORE INSERT ON "fundamental_source_version" WHEN EXISTS(SELECT 1 FROM "fundamental_source_version" WHERE "id"=NEW."id") BEGIN SELECT RAISE(ABORT, 'Fundamental identity already exists'); END;
CREATE TRIGGER "fundamental_import_batch_no_update" BEFORE UPDATE ON "fundamental_import_batch" BEGIN SELECT RAISE(ABORT, 'Immutable fundamental evidence'); END;
CREATE TRIGGER "fundamental_import_batch_no_delete" BEFORE DELETE ON "fundamental_import_batch" BEGIN SELECT RAISE(ABORT, 'Immutable fundamental evidence'); END;
CREATE TRIGGER "fundamental_import_batch_no_replace" BEFORE INSERT ON "fundamental_import_batch" WHEN EXISTS(SELECT 1 FROM "fundamental_import_batch" WHERE "id"=NEW."id") BEGIN SELECT RAISE(ABORT, 'Fundamental identity already exists'); END;
CREATE TRIGGER "fundamental_raw_capture_no_update" BEFORE UPDATE ON "fundamental_raw_capture" BEGIN SELECT RAISE(ABORT, 'Immutable fundamental evidence'); END;
CREATE TRIGGER "fundamental_raw_capture_no_delete" BEFORE DELETE ON "fundamental_raw_capture" BEGIN SELECT RAISE(ABORT, 'Immutable fundamental evidence'); END;
CREATE TRIGGER "fundamental_raw_capture_no_replace" BEFORE INSERT ON "fundamental_raw_capture" WHEN EXISTS(SELECT 1 FROM "fundamental_raw_capture" WHERE "id"=NEW."id") BEGIN SELECT RAISE(ABORT, 'Fundamental identity already exists'); END;
CREATE TRIGGER "fundamental_observation_no_update" BEFORE UPDATE ON "fundamental_observation" BEGIN SELECT RAISE(ABORT, 'Immutable fundamental evidence'); END;
CREATE TRIGGER "fundamental_observation_no_delete" BEFORE DELETE ON "fundamental_observation" BEGIN SELECT RAISE(ABORT, 'Immutable fundamental evidence'); END;
CREATE TRIGGER "fundamental_observation_no_replace" BEFORE INSERT ON "fundamental_observation" WHEN EXISTS(SELECT 1 FROM "fundamental_observation" WHERE "id"=NEW."id" OR ("raw_capture_id"=NEW."raw_capture_id" AND "item_id"=NEW."item_id" AND "registry_hash"=NEW."registry_hash" AND "reporting_scope"=NEW."reporting_scope" AND "period_start"=NEW."period_start" AND "period_end"=NEW."period_end" AND "field_locator"=NEW."field_locator" AND "mapping_version"=NEW."mapping_version")) BEGIN SELECT RAISE(ABORT, 'Fundamental identity already exists'); END;
