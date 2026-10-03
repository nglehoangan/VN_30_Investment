-- Additive M6.5 hypothetical authority. Never a ledger transaction.
CREATE TABLE marginal_allocation (
 id TEXT PRIMARY KEY NOT NULL,
 body TEXT NOT NULL CHECK(json_valid(body)),
 body_hash TEXT NOT NULL
);
CREATE TRIGGER marginal_no_update BEFORE UPDATE ON marginal_allocation BEGIN SELECT RAISE(ABORT, 'Immutable marginal allocation'); END;
CREATE TRIGGER marginal_no_delete BEFORE DELETE ON marginal_allocation BEGIN SELECT RAISE(ABORT, 'Immutable marginal allocation'); END;
CREATE TRIGGER marginal_no_replace BEFORE INSERT ON marginal_allocation WHEN EXISTS (SELECT 1 FROM marginal_allocation WHERE id = NEW.id) BEGIN SELECT RAISE(ABORT, 'Duplicate marginal allocation'); END;

-- Optional marginal references do not rewrite legacy execution bodies.
CREATE UNIQUE INDEX workflow_execution_marginal_step_key
ON workflow_execution(json_extract(body, '$.marginalAssessmentReference'))
WHERE json_extract(body, '$.marginalAssessmentReference') IS NOT NULL;
