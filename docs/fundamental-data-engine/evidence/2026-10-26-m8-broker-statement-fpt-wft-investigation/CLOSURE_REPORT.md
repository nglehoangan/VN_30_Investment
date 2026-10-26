# Broker statement reconciliation and FPT_WFT investigation closure

Final decision: **PARTIALLY_RECONCILED**. All 12 required deliverables completed; no production change.

Actual private 2-page statement dated 07/10/2026 was available, extracted with native PDFKit and visually checked in financial sections. Exact SHA-256 in STATEMENT_INTAKE_REPORT.md and STATEMENT_HOLDINGS.json. Original PDF remains private and outside repository; published artifacts contain no customer name, account number, identification number, original private filename/path or secrets.

|Dimension|Result|
|---|---|
|Holdings|All 11 compared; ten non-FPT quantities/cost match ledger. Original 200 ordinary FPT and 20 FPT_WFT remain distinct in statement data|
|FPT actual ledger case|A: 220 FPT, no FPT_WFT; pending 20 already included numerically. No addition warranted|
|Cost basis|200×73,023 + 20×73,023 = 16,065,060, matching ledger FPT basis. Numerical support only, not verified legal cost-allocation event|
|Conversion completion/date|Owner says eventual completion (OWNER_ATTESTED). Independent conversion date and ratio UNKNOWN; last retained 21/10 response still 200 available / 220 total / 20 stockDividend|
|Corporate-action lead|Retained FPT parent interim report p42 visually confirms 31/07 10% equity-funded issuance plan; no exact account entitlement or trading-effective linkage|
|Statement NAV arithmetic|78,183,500 + 732,420 − 105 = 78,915,815, PASS|
|Ledger vs historical statement economic NAV|Unresolved 70,000 cash-equivalent/receivable scope difference plus 105 borrowing discrepancy; cross-date diagnostic difference 70,105|
|Identity bridge readiness|Historical account/quantity/basis evidence improved; stable account-side code/ISIN, continuity/effective/knowledge witnesses still missing. PARTIAL_EVIDENCE, no accepted mapping|

The source statement is historical, while ledger projection dates to 08/10 opening. No subsequent ledger transactions are retained and personal holdings on 23/10 or today are not proved by market prices. Missing event evidence is not filled with balancing trades. Original normalized FPT_UNAVAILABLE is a derived availability bucket, not proof of a separate instrument or completed conversion.

Validation: all 12 row market-value and P/L/basis calculations PASS, 450 retained broker bodies checksum-valid; exact raw 21/10 hash PASS; actual authoritative ledger reconstruction PASS (12 transactions, 24 legs, 11 holdings). No synthetic tests counted as live acceptance. 2143 protected files unchanged, including SQLite, raw captures, active candidate and source/policy code.

Recommended next action: owner obtains exact FPT entitlement/credit/trading-availability notice and historical cash-equivalent/debt breakdown for 07→08/10. Keep conversionDate UNKNOWN until source-backed; do not add 20 shares, reclassify cash, insert 105 debt or rewrite basis automatically. Independently qualify source/identity through existing gates in separately authorized work.

No live API, import, migration, ledger change, source authority, accepted mapping, NAV/D2/scoring activation, authentication or Phase 4. Stop after investigation; await owner review.
