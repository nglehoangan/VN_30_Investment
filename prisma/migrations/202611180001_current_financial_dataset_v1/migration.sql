-- Additive current-purpose storage. Deliberately separate from historical scoring_dataset_binding.
CREATE TABLE current_financial_raw (
 hash TEXT PRIMARY KEY NOT NULL, path TEXT NOT NULL, payload BLOB NOT NULL
);
CREATE TABLE current_financial_admission (
 id TEXT PRIMARY KEY NOT NULL, ticker TEXT NOT NULL, security_id TEXT NOT NULL,
 economic_cutoff TEXT NOT NULL, known_at TEXT NOT NULL, body TEXT NOT NULL, body_hash TEXT NOT NULL
);
CREATE TABLE current_financial_fact (
 id TEXT PRIMARY KEY NOT NULL, admission_id TEXT NOT NULL REFERENCES current_financial_admission(id),
 raw_hash TEXT NOT NULL REFERENCES current_financial_raw(hash), body TEXT NOT NULL, body_hash TEXT NOT NULL
);
CREATE TABLE current_financial_dataset (
 id TEXT PRIMARY KEY NOT NULL, ticker TEXT NOT NULL, security_id TEXT NOT NULL,
 economic_cutoff TEXT NOT NULL, known_at TEXT NOT NULL, body TEXT NOT NULL, body_hash TEXT NOT NULL
);
CREATE TRIGGER current_raw_no_update BEFORE UPDATE ON current_financial_raw BEGIN SELECT RAISE(ABORT,'immutable current raw'); END;
CREATE TRIGGER current_raw_no_delete BEFORE DELETE ON current_financial_raw BEGIN SELECT RAISE(ABORT,'immutable current raw'); END;
CREATE TRIGGER current_admission_no_update BEFORE UPDATE ON current_financial_admission BEGIN SELECT RAISE(ABORT,'immutable current admission'); END;
CREATE TRIGGER current_admission_no_delete BEFORE DELETE ON current_financial_admission BEGIN SELECT RAISE(ABORT,'immutable current admission'); END;
CREATE TRIGGER current_fact_no_update BEFORE UPDATE ON current_financial_fact BEGIN SELECT RAISE(ABORT,'immutable current fact'); END;
CREATE TRIGGER current_fact_no_delete BEFORE DELETE ON current_financial_fact BEGIN SELECT RAISE(ABORT,'immutable current fact'); END;
CREATE TRIGGER current_dataset_no_update BEFORE UPDATE ON current_financial_dataset BEGIN SELECT RAISE(ABORT,'immutable current dataset'); END;
CREATE TRIGGER current_dataset_no_delete BEFORE DELETE ON current_financial_dataset BEGIN SELECT RAISE(ABORT,'immutable current dataset'); END;
