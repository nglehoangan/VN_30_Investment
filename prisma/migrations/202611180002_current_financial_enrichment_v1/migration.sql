-- Explicit isolated schema rehearsal only; not an automatic production migration.
CREATE TABLE current_financial_enrichment (
 id TEXT PRIMARY KEY NOT NULL,
 dataset_id TEXT NOT NULL REFERENCES current_financial_dataset(id),
 admission_id TEXT NOT NULL REFERENCES current_financial_admission(id),
 body TEXT NOT NULL, body_hash TEXT NOT NULL
);
CREATE TRIGGER current_enrichment_no_update BEFORE UPDATE ON current_financial_enrichment BEGIN SELECT RAISE(ABORT,'immutable current enrichment'); END;
CREATE TRIGGER current_enrichment_no_delete BEFORE DELETE ON current_financial_enrichment BEGIN SELECT RAISE(ABORT,'immutable current enrichment'); END;
