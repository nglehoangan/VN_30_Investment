-- M65-R3-M01 implementation correction under existing CR-01/02/03 approval.
-- Append only. M6.5.2 and candidate metadata/artifacts remain unchanged.
INSERT INTO "methodology_record" (
  "methodology_id", "family", "semantic_version", "implementation_identity",
  "configuration_reference", "governance_status", "intended_use",
  "governing_document_reference", "approval_reference", "effective_date", "recorded_at"
) VALUES (
  'm65-decision-v1-sector-monotonicity-20261001', 'M4_DECISION', '1.0.2',
  'm65-decision-v1-sector-monotonicity-20261001', 'm65-decision-v1-sector-monotonicity-20261001',
  'APPROVED', 'PRODUCTION',
  'docs/06_DASHBOARD/6.5 Decision Engine/M653_SECTOR_POLICY.md',
  'docs/06_DASHBOARD/6.5 Decision Engine/M652_OWNER_APPROVAL.md',
  '2026-10-01', '2026-10-01T00:00:00.000Z'
);
