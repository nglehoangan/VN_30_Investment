# VNM S4-R1 — owner carry-forward review

**S4-R1 = CLOSED_BY_OWNER_APPROVED_CARRY_FORWARD_POLICY.** For retrospective valuation at **30 October 2026**, adopt **2,089,955,445 outstanding ordinary shares** from the consolidated Q3 statement at30September, with status **CARRIED_FORWARD_NO_CHANGE_FOUND_IN_REVIEWED_DOCUMENTS**. No effective share-count change was identified within the reviewed downloaded Vietstock documents. This is the owner's documentary carry-forward rule; it is not independent certification of unchanged legal/treasury balances.

Review interval: **1–30October2026**. Review timestamp (UTC): `2026-11-12T07:41:30.977488+00:00`. Source/page/hash, exact coverage, event dates and decision inputs are retained in [REVIEW.json](REVIEW.json); owner authorization is recorded in [the governance receipt](../../governance/SHARE_COUNT_CARRY_FORWARD_OWNER_DECISION_2026-11-12.json).

## Evidence and effective dates

- Reused the existing Q3 share anchor and checked source hash `fd144a9acb3bacbc745cde32d6375471b11b4b005e1919996631b6735d7c8378`. Visually rechecked **physical p59, Note22**: issued and outstanding ordinary shares each2,089,955,445 at30Sep and1Jan2026. The ending outstanding count is the denominator; the EPS weighted average on physical p67 is separate.
- Reviewed the retained inventory of **39 physical PDFs /36 distinct hashes**, the **35 event rows across2 pages** and the saved **17-row2026 document listing**. This is an inventory/title/date review, not full-content review of every PDF. Existing historical notes/anchor JSON were reused; current focused visual reading covered Q3 p59,p67,p68–72 and the one-page October cash notice. No downloads, corpus rebuild or OCR-reader recreation.
- Reviewed categories: issuance, cancellation, stock dividend/bonus, split, consolidation, treasury buyback/reissue and other outstanding-share changes. No effective October share change was found in the reviewed scope. Three retained bonus-right events are historical2016/2018/2020, already preceding the Q3 endpoint; their effective issuance dates are not inferred from record dates and no old action is applied again.
- The retained `20261102...2142...pdf` is visibly **notice2143 dated30Oct2026**: cash dividend2,500VND/share, ex11Nov, record12Nov, payment26Nov. The filename does not override the document number. This cash action does not change outstanding shares; no issuance date or share credit is inferred from announcement/record/payment dates.

## Coverage and use limitation

**This is not a complete negative search.** Tab1 does not exhaust treasury transactions, cancellations or all issuer disclosures. Some report/explanatory/AGM documents in the retained listing were not acquired or read; no capital-action title was identified, which does not establish absence of relevant content. Older PDF content and unrelated report pages were not fully reread. No identified relevant share-change disclosure remains pending review, but provider/category/content coverage is incomplete.

Q3 is the owner's selected retrospective reference: signed30Oct; retained provider listing update **31Oct2026 01:29:53.860Z**; PDF retrieved2Nov. This does **not** prove availability before the30Oct trading cutoff. Formal source/time admission and historical PIT/backtesting remain separate. October legally issued/treasury flow values remain unknown rather than fabricated zero. Closure is limited to S4-R1 under this owner rule, not a complete corporate-action history or unrelated source authority.

## Validation and changes

**10/10 new regression tests pass**, including no change, confirmed effective change, announcement-versus-effective-date separation, conflicting evidence, incomplete external coverage, unread relevant documents, unknown effective dates, cash separation, retained review replay and source-byte preservation. Existing acquisition/evidence tests remain **24/24 PASS**; Python syntax check passes. All **45 protected source/data files** retain identical SHA-256, including39PDFs, original inventories/notes, prices and SQLite. No full application test-suite claim.

Files changed for this task:

- `scripts/lib/share_count_carry_forward.py` — isolated review evaluator; no production runtime wiring.
- `scripts/test-share-count-carry-forward.py` — regression and retained-evidence tests.
- `docs/fundamental-data-engine/governance/SHARE_COUNT_CARRY_FORWARD_OWNER_DECISION_2026-11-12.json`.
- This directory: `REVIEW.json`, `PRESERVATION.json`, `TEST_RESULTS.json`, `FINAL_REVIEW.md`.
- `docs/fundamental-data-engine/vnm-s4-targeted-remediation/2026-11-12/{TARGETED_FINDINGS.json,FINAL_REMEDIATION.md,OWNER_DECISION_SHEET.md}` — current denominator acceptance and remaining formal source/time admission.
- `docs/fundamental-data-engine/vnm-s4-skills/2026-11-11/VNM_S4_ACCEPTANCE.md` — successor notice; historical assessment preserved.
- `AGENTS.md` — persist the owner rule and bounded VNM decision.

Earlier raw-close-policy changes remain separate existing work in the working tree. S4-R4 remains closed by scope exclusion. No valuation score, unrelated investment rule, accounting transaction, production data or source-admission authority changed.

**STOP for CIO review.** Only formal source/time-purpose admission remains an unresolved formal-use item in this bounded S4 assessment; the reviewed-document denominator selection is closed under the explicit owner rule.
