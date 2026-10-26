# Session validation

Existing latestCompletedHoseSession and normalizer were reused. At 2026-10-26T04:15:10.635Z, latest completed technical-calendar session is **2026-10-23**. Calendar coverage is 2026-01-01 through 2026-12-31, using conservative 15:00 Vietnam cutoff and retained holiday list.

IMPORTANT: calendar metadata says TECHNICAL_POLICY_CANDIDATE_NOT_INDEPENDENT_ACCEPTANCE. No independently accepted calendar was established; no external re-verification occurred. Technical results are conditional on this retained calendar, not an assertion of calendar authority.

Selected capture: board date 23/10; selected daily bars all 2026-10-23T00:00:00.000Z, board request after 23/10 08:00Z; captured on 25/10, so eligible for retrospective latest-completed-session inspection. Retrieval knowledge is 25/10, not backdated to 23/10. No future request/receipt timestamps at validation. Both raw bar dates are enumerated per ticker in ACTUAL_VALIDATION.json; previous bars remain retained and are not silently selected.

Latest 26/10 capture began 03:45Z before 08:00Z completion. Its board date 26/10 mismatches latest completed 23/10. Actual normalizer returns MARKET_BOUNDARY:UNFINISHED_DAILY_BAR. Its apparent daily close cannot qualify as EOD. No repair or fallback within this capture. The older 23/10 capture is a separately declared historical selection. This result does not authorize current NAV after subsequent sessions complete.
