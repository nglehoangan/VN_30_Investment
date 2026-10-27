# Legacy compatibility report

Date: 2026-10-27 (Asia/Ho_Chi_Minh). Scope: owner-authorized Phase 2.1 implementation and isolated validation only. No Phase 2.2, production posting, source acceptance or migration execution authorized.

No changes to ACCOUNTING_METHOD or Decimal/MWAC rounding. BUY/SELL/DIVIDEND_CASH/TRADE_SETTLEMENT/opening semantics preserved. New nested field is absent on old inputs and old reconstructed state has no added residual field. Canonical old transaction/leg equality validation is retained, not bypassed.

Actual SQLite is read only via node:sqlite DatabaseSync(readOnly:true); every saved transaction is rebuilt by current buildTransaction, every ordered leg compared exactly, and current pure domain reconstruction matched saved projection fields.12/24/11 PASS, original claims570000 preserved. Original database SHA256 and all existing data/evidence hashes unchanged (SAFETY_VERIFICATION.json). No production migration needed to replay old records because audit tables are queried only for new settlement lineage.

Isolated migration rehearsal starts with already posted synthetic opening records and saved legs, rebuilds the type-CHECK table, and compares complete ORM rows/legs before and after; foreign_key_check has no violations. Existing integration/unit tests also run against migrated temporary schemas. Full production backup/restore/rehearsal on a controlled copy remains a separate operational prerequisite before any later production migration authorization. The prepared migration is not deployed.

Default production wiring still uses no DividendSettlementAuthority. It cannot accept new settlement/reversal. Existing12 opening transactions retain IDs, timestamps, facts and costs. No actual MWG receipt, GAS claim allocation, FPT conversion, accepted identity/source record or new methodology approval was produced.
