# Opening ledger validation

Date: 2026-10-27 (Asia/Ho_Chi_Minh). Phase 2.3 validation/reporting only. No production implementation, posting, migration or Phase 3 authorization.

Actual read-only NodeSQLite and current domain constructors rebuilt all immutable records at supported opening **2026-10-08T11:38:01.705Z**. Every saved transaction facts object and ordered stored leg set compared exactly, not merely final balances.

|Field|Expected|Actual|Difference|
|---|---|---|---|
|Transactions|12|12|0|
|Ordered legs|24|24|0|
|Nonzero holdings|11|11|0|
|Cash VND|232420|232420|0|
|Receivables VND|570000|570000|0|
|Recorded payables VND|0|0|0|
|Portfolio revision|1|1|0|
|Projection watermark|1|1|0|

All security quantities/open basis/average cost and other compared aggregates match original projection. SQLite integrity_check=ok and foreign_key_check0violations. OPENING_LEDGER_EXPECTED_ACTUAL.json has per-transaction IDs/timestamps/raw facts hashes/ordered leg hashes and explicit empty differences. validation/opening-replay.json holds exact state; independent Python signed-leg sums agree.

Supported opening and projection timestamps agree. A later replay with no admitted events is still only the retained book; absence of ledger entries is not evidence that no economic events occurred. Stored payables0 is not proof of economic liabilities0. Methodology registry remains PROPOSED. Cross-date07/10broker observations cannot certify08/10economic completeness. No original transaction, leg, ID, timestamp, projection or revision rewritten.
