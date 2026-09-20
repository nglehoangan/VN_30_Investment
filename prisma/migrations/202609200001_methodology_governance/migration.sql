-- Record external governance state; this migration does not approve any methodology.
ALTER TABLE "methodology_record" ADD COLUMN "governance_status" TEXT NOT NULL DEFAULT 'APPROVED'
  CHECK ("governance_status" IN ('DRAFT','PROPOSED','APPROVED','RETIRED'));
ALTER TABLE "methodology_record" ADD COLUMN "intended_use" TEXT NOT NULL DEFAULT 'PRODUCTION'
  CHECK ("intended_use" IN ('PRODUCTION','TEST'));
