-- Formal analytical history only; no ledger or portfolio mutation.
CREATE TABLE "decision_artifact" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "security_id" TEXT NOT NULL,
  "methodology_id" TEXT NOT NULL,
  "as_of" TEXT NOT NULL,
  "recorded_at" TEXT NOT NULL,
  "prior_decision_id" TEXT,
  "body" TEXT NOT NULL CHECK(json_valid("body")),
  "body_hash" TEXT NOT NULL,
  FOREIGN KEY ("methodology_id") REFERENCES "methodology_record"("methodology_id") ON DELETE RESTRICT ON UPDATE RESTRICT,
  FOREIGN KEY ("prior_decision_id") REFERENCES "decision_artifact"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
  CHECK ("prior_decision_id" IS NULL OR "prior_decision_id" != "id")
);
CREATE INDEX "decision_artifact_security_id_as_of_idx" ON "decision_artifact"("security_id", "as_of");
CREATE TRIGGER "decision_no_update" BEFORE UPDATE ON "decision_artifact" BEGIN SELECT RAISE(ABORT, 'Immutable decision'); END;
CREATE TRIGGER "decision_no_delete" BEFORE DELETE ON "decision_artifact" BEGIN SELECT RAISE(ABORT, 'Immutable decision'); END;
CREATE TRIGGER "decision_no_replace" BEFORE INSERT ON "decision_artifact" WHEN EXISTS (SELECT 1 FROM "decision_artifact" WHERE "id" = NEW."id") BEGIN SELECT RAISE(ABORT, 'Duplicate immutable decision'); END;
