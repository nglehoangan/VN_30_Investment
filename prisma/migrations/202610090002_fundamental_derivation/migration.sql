CREATE TABLE "fundamental_derivation" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "security_id" TEXT NOT NULL,
 "recorded_at" TEXT NOT NULL,
 "status" TEXT NOT NULL CHECK ("status" IN ('CALCULATED','N_R')),
 "body" TEXT NOT NULL CHECK (json_valid("body") AND length("body") <= 4000000),
 "body_hash" TEXT NOT NULL CHECK (length("body_hash") = 64),
 FOREIGN KEY ("security_id") REFERENCES "security"("id") ON DELETE RESTRICT ON UPDATE RESTRICT
);
CREATE INDEX "fundamental_derivation_security_id_recorded_at_idx" ON "fundamental_derivation"("security_id","recorded_at");
CREATE TABLE "fundamental_derivation_input" (
 "derivation_id" TEXT NOT NULL,
 "operand" INTEGER NOT NULL CHECK ("operand" IN (0,1)),
 "position" INTEGER NOT NULL CHECK ("position" BETWEEN 0 AND 3),
 "observation_id" TEXT NOT NULL,
 PRIMARY KEY ("derivation_id","operand","position"),
 FOREIGN KEY ("derivation_id") REFERENCES "fundamental_derivation"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
 FOREIGN KEY ("observation_id") REFERENCES "fundamental_observation"("id") ON DELETE RESTRICT ON UPDATE RESTRICT
);
CREATE TRIGGER "fundamental_derivation_no_update" BEFORE UPDATE ON "fundamental_derivation" BEGIN SELECT RAISE(ABORT,'Immutable derivation'); END;
CREATE TRIGGER "fundamental_derivation_no_delete" BEFORE DELETE ON "fundamental_derivation" BEGIN SELECT RAISE(ABORT,'Immutable derivation'); END;
CREATE TRIGGER "fundamental_derivation_no_replace" BEFORE INSERT ON "fundamental_derivation" WHEN EXISTS(SELECT 1 FROM "fundamental_derivation" WHERE "id"=NEW."id") BEGIN SELECT RAISE(ABORT,'Derivation already exists'); END;
CREATE TRIGGER "fundamental_derivation_input_no_update" BEFORE UPDATE ON "fundamental_derivation_input" BEGIN SELECT RAISE(ABORT,'Immutable derivation input'); END;
CREATE TRIGGER "fundamental_derivation_input_no_delete" BEFORE DELETE ON "fundamental_derivation_input" BEGIN SELECT RAISE(ABORT,'Immutable derivation input'); END;
CREATE TRIGGER "fundamental_derivation_input_no_replace" BEFORE INSERT ON "fundamental_derivation_input" WHEN EXISTS(SELECT 1 FROM "fundamental_derivation_input" WHERE "derivation_id"=NEW."derivation_id" AND "operand"=NEW."operand" AND "position"=NEW."position") BEGIN SELECT RAISE(ABORT,'Derivation input already exists'); END;
