CREATE TABLE "fundamental_disposition_release" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "previous_release" TEXT NOT NULL,
 "approved_at" TEXT NOT NULL,
 "approval_hash" TEXT NOT NULL,
 "body" TEXT NOT NULL,
 "body_hash" TEXT NOT NULL
);
CREATE TRIGGER "fundamental_disposition_release_no_update" BEFORE UPDATE ON "fundamental_disposition_release"
BEGIN SELECT RAISE(ABORT, 'Disposition releases are append-only'); END;
CREATE TRIGGER "fundamental_disposition_release_no_delete" BEFORE DELETE ON "fundamental_disposition_release"
BEGIN SELECT RAISE(ABORT, 'Disposition releases are append-only'); END;
