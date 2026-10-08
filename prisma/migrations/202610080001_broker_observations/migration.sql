CREATE TABLE "broker_observation" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "kind" TEXT NOT NULL,
  "api_id" TEXT,
  "received_at" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "body_hash" TEXT NOT NULL CHECK(length("body_hash") = 64)
);
CREATE INDEX "broker_observation_kind_received_at_idx" ON "broker_observation"("kind", "received_at");
CREATE TRIGGER "broker_observation_no_update" BEFORE UPDATE ON "broker_observation"
BEGIN SELECT RAISE(ABORT, 'Broker observations are immutable'); END;
CREATE TRIGGER "broker_observation_no_delete" BEFORE DELETE ON "broker_observation"
BEGIN SELECT RAISE(ABORT, 'Broker observations are immutable'); END;
