CREATE TABLE current_scoring_data_acceptance (
 id TEXT PRIMARY KEY NOT NULL,
 binding_id TEXT NOT NULL REFERENCES current_financial_enrichment(id),
 body TEXT NOT NULL,
 body_hash TEXT NOT NULL
);
CREATE TRIGGER current_scoring_data_acceptance_no_update BEFORE UPDATE ON current_scoring_data_acceptance BEGIN SELECT RAISE(ABORT,'IMMUTABLE_CURRENT_DATA_ACCEPTANCE'); END;
CREATE TRIGGER current_scoring_data_acceptance_no_delete BEFORE DELETE ON current_scoring_data_acceptance BEGIN SELECT RAISE(ABORT,'IMMUTABLE_CURRENT_DATA_ACCEPTANCE'); END;
