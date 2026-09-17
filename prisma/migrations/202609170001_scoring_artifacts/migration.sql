-- Immutable derived analytical artifacts. No economic balances or ledger writes.
CREATE TABLE "analytical_artifact" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "kind" TEXT NOT NULL CHECK ("kind" IN ('SCORECARD','RANKING')),
  "methodology_id" TEXT NOT NULL,
  "as_of" TEXT NOT NULL,
  "calculated_at" TEXT NOT NULL,
  "body" TEXT NOT NULL CHECK (json_valid("body")),
  "body_hash" TEXT NOT NULL,
  CONSTRAINT "artifact_methodology_fk" FOREIGN KEY ("methodology_id") REFERENCES "methodology_record" ("methodology_id") ON DELETE RESTRICT ON UPDATE RESTRICT
);
CREATE INDEX "analytical_artifact_as_of_idx" ON "analytical_artifact"("as_of");
CREATE TRIGGER "artifact_no_update" BEFORE UPDATE ON "analytical_artifact" BEGIN SELECT RAISE(ABORT, 'Immutable analytical artifact'); END;
CREATE TRIGGER "artifact_no_delete" BEFORE DELETE ON "analytical_artifact" BEGIN SELECT RAISE(ABORT, 'Immutable analytical artifact'); END;
