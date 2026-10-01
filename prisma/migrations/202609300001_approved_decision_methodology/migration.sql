-- Record explicit external owner approval; append only, never promote historical candidates.
INSERT INTO "methodology_record" (
  "methodology_id", "family", "semantic_version", "implementation_identity",
  "configuration_reference", "governance_status", "intended_use",
  "governing_document_reference", "approval_reference", "effective_date", "recorded_at"
) VALUES (
  'm65-decision-v1-approved-resolutions-20260930', 'M4_DECISION', '1.0.1',
  'm65-decision-v1-approved-resolutions-20260930', 'm65-decision-v1-approved-resolutions-20260930',
  'APPROVED', 'PRODUCTION',
  'docs/06_DASHBOARD/6.5 Decision Engine/CHANGE_REQUESTS.md',
  'docs/06_DASHBOARD/6.5 Decision Engine/M652_OWNER_APPROVAL.md',
  '2026-09-30', '2026-09-30T00:00:00.000Z'
);
