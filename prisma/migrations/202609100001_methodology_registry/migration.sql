-- Only registry metadata; no portfolio/ledger or numeric probe table.
CREATE TABLE "methodology_record" (
    "methodology_id" TEXT NOT NULL PRIMARY KEY,
    "family" TEXT NOT NULL,
    "semantic_version" TEXT NOT NULL,
    "approval_reference" TEXT NOT NULL,
    "effective_date" TEXT NOT NULL,
    "configuration_reference" TEXT NOT NULL,
    "implementation_identity" TEXT NOT NULL,
    "governing_document_reference" TEXT NOT NULL,
    "recorded_at" TEXT NOT NULL
);
CREATE INDEX "methodology_record_family_effective_date_idx" ON "methodology_record"("family", "effective_date");
-- Approved artifacts are append-only. A new methodology needs a new identity.
CREATE TRIGGER "methodology_record_no_update"
BEFORE UPDATE ON "methodology_record"
BEGIN
    SELECT RAISE(ABORT, 'Methodology records are immutable');
END;
CREATE TRIGGER "methodology_record_no_delete"
BEFORE DELETE ON "methodology_record"
BEGIN
    SELECT RAISE(ABORT, 'Methodology records are immutable');
END;
