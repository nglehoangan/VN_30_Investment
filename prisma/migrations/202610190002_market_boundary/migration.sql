-- Additive prospective contracts; never reinterpret/delete legacy evidence or accounting.
CREATE TABLE "market_boundary_record" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "kind" TEXT NOT NULL CHECK ("kind" IN ('INITIALIZATION','CAPABILITY','MARKET','ANALYSIS','PORTFOLIO','DECISION')),
 "contract_version" TEXT NOT NULL,
 "created_at" TEXT NOT NULL,
 "body" TEXT NOT NULL CHECK (json_valid("body")),
 "body_hash" TEXT NOT NULL
);
CREATE UNIQUE INDEX "market_boundary_record_id_body_hash_key" ON "market_boundary_record"("id","body_hash");
CREATE TABLE "market_boundary_dependency_head" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "body_hash" TEXT NOT NULL,
 "updated_at" TEXT NOT NULL
);
CREATE TABLE "market_boundary_decision_seal" (
 "decision_id" TEXT NOT NULL PRIMARY KEY,
 "record_id" TEXT NOT NULL UNIQUE REFERENCES "market_boundary_record"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
 "dependency_id" TEXT NOT NULL REFERENCES "market_boundary_dependency_head"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
 "dependency_hash" TEXT NOT NULL
);
CREATE TRIGGER "market_boundary_record_no_update" BEFORE UPDATE ON "market_boundary_record" BEGIN SELECT RAISE(ABORT,'immutable market boundary record'); END;
CREATE TRIGGER "market_boundary_record_no_delete" BEFORE DELETE ON "market_boundary_record" BEGIN SELECT RAISE(ABORT,'immutable market boundary record'); END;
CREATE TRIGGER "market_boundary_seal_no_update" BEFORE UPDATE ON "market_boundary_decision_seal" BEGIN SELECT RAISE(ABORT,'immutable decision seal'); END;
CREATE TRIGGER "market_boundary_seal_no_delete" BEFORE DELETE ON "market_boundary_decision_seal" BEGIN SELECT RAISE(ABORT,'immutable decision seal'); END;
CREATE TABLE "market_boundary_ranking_publication" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "analysis_id" TEXT NOT NULL REFERENCES "market_boundary_record"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
 "body" TEXT NOT NULL CHECK (json_valid("body")),
 "body_hash" TEXT NOT NULL
);
CREATE TRIGGER "market_boundary_ranking_no_update" BEFORE UPDATE ON "market_boundary_ranking_publication" BEGIN SELECT RAISE(ABORT,'immutable ranking publication'); END;
CREATE TRIGGER "market_boundary_ranking_no_delete" BEFORE DELETE ON "market_boundary_ranking_publication" BEGIN SELECT RAISE(ABORT,'immutable ranking publication'); END;
