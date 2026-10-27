# Legacy compatibility and unchanged baselines

Assessment: 2026-10-27 Asia/Ho_Chi_Minh. Owner authorizes Phase2.2 isolated implementation and targeted blocker investigation only. No Phase2.3, Current NAV implementation, production posting/migration or acceptance changes.

Current code replays actual12original transactions,24ordered legs and11positions exactly, matching saved cash/claim/basis projection. Database SHA256 remains pinned to original. No actual event import, original ID/time rewrite or production migration. Actual-copy migrated replay independently passes.

Approved accounting numeric identity `m63-mwac-decimal12-half-even-v1`, Decimal12 half-even, BUY/SELL, trade settlement, dividend and Phase2.1 net-claim semantics unchanged. Domain preparation helper is the same implementation formerly in application/candidate.ts; compatibility re-export preserves old callers. Existing legacy behavior tested unchanged while new intake adds an opt-in audit boundary; enrolled books cannot bypass it through an unguarded legacy facade.

Existing source/identity contracts (including offline-only NAV bridge DTOs) remain unchanged. Source candidates and active market bindings preserved by full data hashes. No login/auth implementation, policy edits, NAV/scoring/D2 activation or Phase2.3. api/import-captured.mjs and TCBS acquisition entry points inspected but never executed. They are retained acquisition/observation infrastructure, not authority or substitutes for forward-event accounting.
