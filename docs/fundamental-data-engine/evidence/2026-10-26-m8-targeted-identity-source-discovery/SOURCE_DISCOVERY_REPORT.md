# Targeted identity evidence source discovery

Final decision: **READY_FOR_TARGETED_ACQUISITION**. This means the missing document requests are concrete, not that evidence has been acquired or mappings qualify. No new incomplete bridge dossier or candidate created.

New targeted inspection covered all 450 retained broker-observation body hashes, field inventories of account/history payloads, actual account raw responses from 21/10, existing implemented endpoint paths, and additional retained HOSE reference/history files. Exact inventories and hashes are separate support JSON files.

Key finding: retained account payloads bind the account to ticker/type/positions, while market master binds ticker to stable code/ISIN/venue/class. **The stable identifier never appears in an actual account-position or trade row inspected.** Joining the two on ticker would repeat the prohibited ticker-only bridge. All retained orders/fills responses have no populated trade records. Neither daily market recapture nor a larger market bar history supplies the missing account-side identity witness.

|Proposed source|Classification|Scope / limitation|
|---|---|---|
|Original ledger facts and opening snapshot|AVAILABLE_AND_VERIFIED|Exact original ticker/position/transaction source hash verified; proves ledger origin only, not economic continuity|
|4.14 historical DB and 21/10 raw account positions|AVAILABLE_BUT_INSUFFICIENT|Account-linked ticker/secType/sbType, no stable security code/ISIN/venue field|
|4.4 orders / 4.6 fills retained captures|AVAILABLE_BUT_INSUFFICIENT|No nonempty trade rows; cannot assess unobserved row identity schema or original confirmations|
|4.13 retained responses|AVAILABLE_BUT_INSUFFICIENT|Empty content; legacy margin-product response, not retained trade confirmations|
|4.16 cash / 4.17 debt|AVAILABLE_BUT_INSUFFICIENT|Historical arrays empty; 21/10 raw requests HTTP400 without raw successful body; cash-only history cannot bind instrument identity|
|5.11 TCBS security master|AVAILABLE_AND_VERIFIED|Existing exact code/ISIN/venue/class point observations; not account-to-instrument bridge|
|Pinned release market UUID assignment|AVAILABLE_AND_VERIFIED|Local namespace assignment, not TCBS-returned UUID or independent economic identity|
|Retained HOSE security list / membership / history|AVAILABLE_BUT_INSUFFICIENT|11/11 exact ticker/ISIN corroboration; no account ledger anchor or complete lifecycle interval|
|Original broker trade confirmations in retained scope|NOT_AVAILABLE|No nonempty confirmation documents located; UI transaction-confirmation screenshots are app test evidence|
|Primary depository instrument certificate/lifecycle record retained|NOT_AVAILABLE|No primary VSD/VSDC record located in inspected retained reference evidence|
|Account-specific broker statement with stable code/ISIN and dated mapping|REQUIRES_EXTERNAL_ACQUISITION|Ask TCBS for actual original record or formal historical instrument mapping addendum|
|Authoritative instrument lifecycle/action coverage for 11 holdings|REQUIRES_EXTERNAL_ACQUISITION|Request/locate exact registration/listing/rename/reuse and corporate-action records for target interval|
|Formal trusted knowledge/acceptance witnesses|REQUIRES_EXTERNAL_ACQUISITION|Future approved governance workflow; cannot reconstruct from local file mtime or printed issue date|

AVAILABLE_AND_VERIFIED means inspected retained bytes/fields match their hashes for the stated scope. It does not authenticate original publisher authority, prove qualified timestamps, or grant source/bridge acceptance. Primary missing source is an account-specific broker record or explicit original-snapshot mapping addendum containing stable instrument identity, plus lifecycle/effective evidence. See MINIMUM_ACQUISITION_PLAN.md.

Search limitations: absent means not located in inspected repository/SQLite/reference scope, not proof it never existed elsewhere. No live capability, current website or unreturned endpoint schema was verified. Existing synthetic UI screenshots are not original trade confirmations. No historical seal was rewritten.
