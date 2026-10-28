# Revocation and supersession

2026-10-28 · SOURCE_IDENTITY_QUALIFICATION_PLANNING_ONLY · DESIGN, NOT ACCEPTANCE

Accepted mapping data must be append-only/versioned if future storage is authorized. Every correction/revocation binds exact prior subject/decision, affected portfolio/account/security/purpose/interval and provenance; trusted role/head verification determines validity. Unknown/stale revocation or contradictory supersession denies effective use. No signatures or events are generated here.

**Incorrect broker account:** Deny account binding and every dependent security/source relation for affected scope; privately verify corrected account. Allaccount-bound NAV/claims/performance inputs require new review.

**Incorrect security mapping:** Deny exact mapping and all inverse-unit matches until independently reviewed replacement. No ledger rewrite or quantity transfer between instruments.

**Ticker reuse:** Close evidenced old interval; treat reused symbol as different instrument unless exact continuity proved. No ticker-based successor or historic price join.

**Corporate-action correction:** Invalidate affected entitlement/lifecycle interval and related quantity/price interpretations. Preserve original action/ledger facts; any accounting correction needs separate authorization.

**Provider instrument-code change:** Retain old/new namespace/code interval and accepted continuity or separateinstrument. No global replace or inferredsame identity.

**Revised source document:** Retain both original bytes and exact supersession/correction scope; conflict blocks unresolved use. Do not overwrite an old manifest or silently latest-select.

**Revoked acceptance:** Verify authentic revocation and role/head state; deny qualifying replay/publication. No same-version resurrection by rereading original signed approval.

**Conflicting identity evidence:** Immediately block effective qualification pending adjudication; retain all conflicting pins. No arbitrary precedence or choosing whichever matches quantities.

Downstream invalidation design:

- CurrentNAV: refuse stale/invalid identity inputs; new revision/head and complete coherent plan required. No automatic older-source fallback.
- Historical calculations: preserve original result/source/decision bytes with invalidation/superseded annotations; any authorized corrected retrospective computation is a new version with later honest knowledge. Do not rewrite history or claim AS_KNOWN support.
- Evidence manifests: retain original pins/hash and bind new invalidation event/replacement; never edit an old seal to appear accepted.
- Dashboard publication: default deny/hide official value if dependency head/revocation/expiry changes; identity-only qualification never authorizes first publication.
- Performance/risk: mark dependent inputs unavailable/superseded and require separately authorized recalculation; no invented daily NAV or drawdown.
- Investment decisions: invalidate current eligibility and reapply existing full decision/risk/M7 gates. Do not execute or retroactively alter financial decisions automatically.

A single atomic dependency token/final current-head check is a future integration prerequisite across ledger/files/authority store. No existing SliceAisCurrentfalse is changed, and no invalidation service is implemented. Supersession with newly evidenced scope cannot extend original effective/knowledge dates implicitly.
