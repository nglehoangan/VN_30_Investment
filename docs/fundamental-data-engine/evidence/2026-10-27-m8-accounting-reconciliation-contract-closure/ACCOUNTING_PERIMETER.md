# Accounting perimeter — proposed contract v1

Assessment date: 2026-10-27 (Asia/Ho_Chi_Minh). Phase 1 design/evidence closure only. Owner approved the prior architecture assessment as baseline v1.0 in the current task; this is not authenticated source/identity acceptance or Phase 2 authorization. Original baselines and sealed evidence remain unchanged. SOURCE_REFERENCES.json pins inspected files; JSON Pointers below address those pinned bytes.

The book contains the broker securities account, settled broker cash, owned securities, separately identified pending securities, recognized receivables and liabilities. Linked bank accounts are **outside** this portfolio. Owner review must ratify this exact perimeter before importing external flows or calculating investor returns. Bank balances are not assets of this book.

|Event|Classification|Required distinction|
|---|---|---|
|Bank → broker deposit, including auto-funding|External contribution|Actual credited amount/date and bank/broker reference, once only|
|Broker → outside withdrawal|External withdrawal|Actual debit; sale followed by withdrawal is two distinct events|
|BUY / SELL / settlement|Internal asset/claim/cash transformation|No investor flow; trade recognition and cash settlement remain separate|
|Cash dividend / interest|Internal investment income|Not contribution; cash receipt may settle an existing claim rather than create new income|
|Share dividend / pending conversion|Internal ownership/status event|No external flow; credit versus availability transfer are distinct|
|Opening assets/claims|Imported state|Not historical contribution or new income; no lifetime performance implied|
|Transfers between own broker subaccounts|Internal only if both are inside approved perimeter|Require paired references; otherwise boundary classification remains unresolved|

Currency remains VND. No-margin constraints remain: settled cash cannot be negative, funded payables cannot be covered by uncollected receivables. Unknown debt/claim completeness is not zero. Dates use actual source effective time and separate retained knowledge/retrieval time; date-only records do not establish an intraday timestamp. No default midnight may masquerade as broker evidence. No-login local viewing grants no posting or acceptance authority.

Frozen contracts: Investment Policy v1.1; Risk Policy v1.0; M2 immutable POSTED transaction/leg model; `m63-mwac-decimal12-half-even-v1`; exact identity/source-purpose gates; existing correction ordering and CAS. Historical daily NAV is optional, not a prerequisite for this accounting book or point valuation. Existing actionability and release gates remain independent.
