# Effective-date and knowledge-date gaps

|Field|Retained evidence|Permitted interpretation / gap|
|---|---|---|
|Ledger eventAt/createdAt|Original opening transaction facts and index columns|Local accounting record dates; do not imply market mapping effective-from|
|Opening snapshot holdingsAsOf|Retained original broker snapshot|Portfolio snapshot date, not legal instrument continuity proof|
|Original snapshot received_at|Exact retained observation row|Local acquisition metadata; formal trusted-clock/actor proof not established|
|Historical TCBS receivedAt|111 row metadata with exact body hashes|Point-in-time observations; no interpolation across missing dates|
|Selected 5.11 retrievedAt|25/10 capture per ticker|Evidence availability after 23/10; cannot backdate knowledge to session|
|UUID release knownAt|No qualified identity-namespace event established here|UNKNOWN; no mtime or document-directory date substitution|
|validFrom / validTo|No explicit ledger-to-market interval witness|UNKNOWN; null is not used to imply an open interval|
|knownFrom / knownTo / recordedAt for bridge|No actual bridge event, no authenticated formal knowledge proof|UNKNOWN; dossier preparedAt is preparation time only|

All eleven dossiers have these same interval gaps, alongside per-holding exact known raw timestamps. UNKNOWN fields remain strings only in the evidence-dossier schema; they are never passed as valid dates in a production bridge. Existing Phase 1 strict validators require real dates/evidence and reject these drafts.

Minimum action per holding: obtain original broker instrument inventory/contract note or other retained evidence linking the ledger security to stable TCBS/depository identity (code/ISIN/venue/class), verify source/owner and exact hash, establish explicit effective boundaries and instrument continuity with documented action history, then record genuine known/recorded dates under the future approved governance workflow. Do not copy source listing/issueDate, assume inception date, or infer identity from matching balances. Later evidence can support an explicitly later-knowledge retrospective analysis only; it cannot establish AS_KNOWN 23/10 history.

Ledger IDs are never rewritten; corrections require new immutable evidenced mapping versions, not edited financial facts. No interval witness or external event is fabricated.
