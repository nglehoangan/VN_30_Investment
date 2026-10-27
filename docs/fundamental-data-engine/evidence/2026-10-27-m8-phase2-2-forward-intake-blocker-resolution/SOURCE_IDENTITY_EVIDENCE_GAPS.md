# Exact identity evidence and acquisition request

Assessment: 2026-10-27 Asia/Ho_Chi_Minh. Owner authorizes Phase2.2 isolated implementation and targeted blocker investigation only. No Phase2.3, Current NAV implementation, production posting/migration or acceptance changes.

All11held ledger IDs, provider stable codes/ISIN/venue/class, local market UUIDs, exact evidence pointers/hashes and gaps are in SOURCE_IDENTITY_GAP_MATRIX.json. All11selected master hashes/fields independently reverified. Local market UUID is a pinned application namespace identity, not a UUID asserted by TCBS. No technical mapping defect was found that could legitimately fill the missing account-specific continuity witness.

|Ledger ID|TCBS code|ISIN|Venue/class|Missing account-specific proof|
|---|---|---|---|---|
|FPT|000208|VN000000FPT1|HOSE/COMMON_SHARE|Continuity/effective+knowledge interval, lifecycle clearance and independent acceptance|
|GAS|002033|VN000000GAS3|HOSE/COMMON_SHARE|Continuity/effective+knowledge interval, lifecycle clearance and independent acceptance|
|HPG|000286|VN000000HPG4|HOSE/COMMON_SHARE|Continuity/effective+knowledge interval, lifecycle clearance and independent acceptance|
|MBB|000054|VN000000MBB5|HOSE/COMMON_SHARE|Continuity/effective+knowledge interval, lifecycle clearance and independent acceptance|
|MWG|003170|VN000000MWG0|HOSE/COMMON_SHARE|Continuity/effective+knowledge interval, lifecycle clearance and independent acceptance|
|SSI|000065|VN000000SSI1|HOSE/COMMON_SHARE|Continuity/effective+knowledge interval, lifecycle clearance and independent acceptance|
|TCB|003415|VN000000TCB8|HOSE/COMMON_SHARE|Continuity/effective+knowledge interval, lifecycle clearance and independent acceptance|
|VCB|000193|VN000000VCB4|HOSE/COMMON_SHARE|Continuity/effective+knowledge interval, lifecycle clearance and independent acceptance|
|VHM|005791|VN000000VHM0|HOSE/COMMON_SHARE|Continuity/effective+knowledge interval, lifecycle clearance and independent acceptance|
|VPL|000153|VN000000VPL5|HOSE/COMMON_SHARE|Continuity/effective+knowledge interval, lifecycle clearance and independent acceptance|
|VRE|005599|VN000000VRE6|HOSE/COMMON_SHARE|Continuity/effective+knowledge interval, lifecycle clearance and independent acceptance|

Retained broker4.14 account rows expose ticker/type/status quantities, not stable code+ISIN tying original opening account position to market identifier. 5.11 master and retained HOSE corroboration establish market correspondence only; unchanged ISIN/listingDate is not account continuity or action clearance. Offline bridge contracts intentionally have no accepted state. NO_NEW_EVIDENCE — EXTERNAL_ACTION_REQUIRED for exact continuity.

External request to broker: a dated authenticated account instrument annex naming each of the11original positions, stable code+ISIN+venue+class, original08/10snapshot reference, effective from/to and explicit lifecycle/rename/ticker-reuse/corporate-action coverage through intended valuation interval. Include issuer/depository cross-reference for any change, actual issue/retrieval/knowledge timestamp and signature/verification channel. One certified annex may cover all11; completeness not assumed until obtained. Producer-distinct qualified validator must accept exact hashes/scope, followed by separately authorized source/identity decisions. No-login decision persists; neither OS user nor local JSON/Codex output is substitute authentication.
