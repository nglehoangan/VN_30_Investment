# Event schema and compatibility

Date: 2026-10-27 (Asia/Ho_Chi_Minh). Scope: owner-authorized Phase 2.1 implementation and isolated validation only. No Phase 2.2, production posting, source acceptance or migration execution authorized.

`TransactionInput.type = DIVIDEND_RECEIVABLE_SETTLEMENT`, existing exact nominal IDs, VND, amount, securityId, source reference, eventAt/effectiveAt, idempotencyKey and methodologyId remain mandatory. Add optional `dividendSettlement` only for this event; legacy facts get no new default fields.

Nested envelope has exact fields: version, allocation, claimId, actionId, receipt, knownAt, correctionOf (null or original settlement transaction ID). Strict transport schema and domain exact-key checks reject unknown nested fields/version. Allocation identifies original transaction and RECEIVABLE leg, portfolio, currency, NET basis, acceptanceReference, knownAt and complete ordered subclaims. Each subclaim has unique ID, securityId, actionId, exact decimal amount and evidence. Receipt has stable namespace/id, portfolio/security/action, VND/net, actual cash-effective time, knowledge time and evidence. Evidence retains reference, SHA256, JSON Pointer and knownAt. All evidence/knowledge timestamps must be known by the event recorded time; source knowledge is never backdated.

Ordinary eventAt/effectiveAt equal actual receipt time. Correction keeps original receipt effective time separately, requires its new eventAt=effectiveAt and linked same-effective correction group. Date-only ambiguity must be resolved before constructing exact instants; engine does not invent times. Structural validation is not independent source acceptance.

Pure replay is economic as-of reconstruction, **not AS_KNOWN authentication or a bitemporal query API**. No historical time-of-knowledge access is activated. Future knowledge at posting is rejected. Past economic replay may include evidence learned later and must remain retrospective if exposed.

New output still uses `m63-mwac-decimal12-half-even-v1`. Event schema version is separate from numeric methodology identity. Existing methodology registry availability/effective-date checks remain unchanged; no methodology record or owner approval is inserted. Existing old facts/ordered legs rebuild exactly. New subclaim residual DTO is omitted entirely for legacy-only history.
