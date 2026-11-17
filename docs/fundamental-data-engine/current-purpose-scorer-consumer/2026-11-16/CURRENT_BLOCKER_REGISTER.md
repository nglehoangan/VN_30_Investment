# Successor — current-purpose consumer

The prior blocker “DI/scorer consumer requires a historical FORMAL/AS_KNOWN snapshot to resolve current data” is replaced by the explicit current-purpose consumer contract in CONTRACT.md. The actual ScoringEngine now exposes resolveCurrentDataset and persists an independent current-purpose data acceptance through the trusted consumer. Historical snapshot admission remains unchanged.

Closed by this implementation, subject to validation recorded in VALIDATION.json:

- Current-purpose dataset resolution by the actual scorer consumer.
- Independent persisted current DI acceptance before scorecard creation.
- Original economic / operational times, source lineage and purpose separation.

Not granted or resolved by dataset acceptance:

- Four previously unresolved rubric selections and scoring authorization.
- Assessment, M1, confidence and executable scoring gates.
- Full M3 financial metric certification or formal /100 score.
- Historical PIT qualification or production activation.

A valid dataset acceptance is not an approved numeric ScoreInput and cannot be passed as a legacy scoring authorization. No additional financial report or source approval is requested by this consumer change. Live database migration remains unapplied. Full typecheck is not established in this environment.
