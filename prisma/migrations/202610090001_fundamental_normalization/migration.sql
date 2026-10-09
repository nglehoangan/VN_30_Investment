-- Additive Slice 3 validation/normalization evidence only. No backfill or existing-table changes.
CREATE TABLE "fundamental_normalization" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "security_id" TEXT NOT NULL,
 "source_version_id" TEXT NOT NULL,
 "import_execution_id" TEXT NOT NULL,
 "raw_capture_id" TEXT NOT NULL,
 "recorded_at" TEXT NOT NULL,
 "status" TEXT NOT NULL CHECK("status" IN ('VALIDATED','PARTIAL','BLOCKED')),
 "body" TEXT NOT NULL CHECK(json_valid("body") AND length("body") <= 4000000),
 "body_hash" TEXT NOT NULL CHECK(length("body_hash")=64),
 FOREIGN KEY("security_id") REFERENCES "security"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
 FOREIGN KEY("source_version_id") REFERENCES "fundamental_source_version"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
 FOREIGN KEY("import_execution_id","source_version_id") REFERENCES "fundamental_import_batch"("id","source_version_id") ON DELETE RESTRICT ON UPDATE RESTRICT,
 FOREIGN KEY("raw_capture_id","source_version_id") REFERENCES "fundamental_raw_capture"("id","source_version_id") ON DELETE RESTRICT ON UPDATE RESTRICT
);
CREATE INDEX "fundamental_normalization_security_id_recorded_at_idx" ON "fundamental_normalization"("security_id","recorded_at");
CREATE TRIGGER "fundamental_normalization_no_update" BEFORE UPDATE ON "fundamental_normalization" BEGIN SELECT RAISE(ABORT,'Immutable normalization evidence'); END;
CREATE TRIGGER "fundamental_normalization_no_delete" BEFORE DELETE ON "fundamental_normalization" BEGIN SELECT RAISE(ABORT,'Immutable normalization evidence'); END;
CREATE TRIGGER "fundamental_normalization_no_replace" BEFORE INSERT ON "fundamental_normalization" WHEN EXISTS(SELECT 1 FROM "fundamental_normalization" WHERE "id"=NEW."id") BEGIN SELECT RAISE(ABORT,'Normalization identity already exists'); END;
