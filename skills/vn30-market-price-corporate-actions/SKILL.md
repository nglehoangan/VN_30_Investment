---
name: vn30-market-price-corporate-actions
description: Review retained daily raw prices, dividend and capital-action evidence and share-count denominators for one VN30 ticker and cutoff; prepare scoped S4 research and admission outputs without source promotion or production activation.
---

# VN30 market price and corporate actions

Accept **ticker, exchange, cutoff and retained source locations**. Work on one ticker per invocation. Use this workflow for S4 evidence/acceptance review; keep fetching, personal account reconciliation and investment scoring in their existing workflows.

Read [the input/output contract](references/contract.md) when preparing or executing an input. For integration with existing skills, read [migration notes](references/migration.md). Repository paths below are relative to its root.

## Retained evidence first

- Reuse matching price JSON, reviewed action JSON, source PDFs, receipts, policy decisions and hashes. For reading PDFs, use `skills/read-pdf-json-first/SKILL.md`; do not repeat completed discovery, extraction or reconciliation.
- Only if the requested source is genuinely absent, invoke the existing `fetch-cafef-price-history` or `fetch-vietstock-dividend-pdfs` skill within the authorized ticker/date scope. This skill's runner is offline and never fetches. Do not scan/download all VN30 automatically.
- Preserve separate provider observations and original receipts. Never overwrite a conflicting raw response, choose latest-wins, average conflicting values or map events by amount equality.

## Economic selection

- **Only CaféF `GiaDongCua`** may be selected. Reuse `selectCafefRawCloseValue` / `normalizeCafefRawClose` in `src/domain/market-boundary/cafef-raw-close.ts`. No `GiaDieuChinh` fallback; retained adjusted fields are audit-only. Require exact ticker, exchange, trading date and evidenced thousand-VND units; multiply by1000 with the existing decimal implementation. Missing/invalid raw close remains `NOT_QUALIFIED`, not zero.
- Reuse a reviewed official source for each action's event identity, kind, fiscal period, ex/record/effective/payment dates and terms. Compare the **same event and definition** before resolving a provider conflict. Keep cash, stock dividends, bonuses, issuance/cancellation, splits/consolidation and treasury changes separate. Do not infer action factors from adjusted/raw price differences or investor receipt from issuer payment terms.
- Reuse `scripts/lib/share_count_carry_forward.py::assess_share_count`. Carry ending outstanding shares from the latest owner-eligible statement when no effective change is found in the reviewed documents. Confirmed changes, conflicts, unresolved relevant effective dates or known unread relevant disclosures block automatic carry-forward. Incomplete external coverage remains explicit; it does not certify zero treasury flows. EPS weighted-average shares are not ending outstanding shares.

## Time and admission

Keep **economic/trading date**, **publication date/precision**, **original retrieval time** and **review time** distinct. Keep notice signing dates, mirror listing updates and retained VSDC “Cập nhật ngày” clues under their real meanings. A clue is not a silently verified publication assessment. `DATE_ONLY` with timezone is supported by the existing canonical Evidence contract; never invent an intraday timestamp or historical availability.

Produce three distinct conclusions:

1. Retrospective research: qualify only the specific reviewed facts, using actual later knowledge and coverage limitations; existing owner approvals apply only to their exact ticker/fact scope.
2. Formal executable consumption: close F1 only through existing `RetainedMarketAuthority`/`BoundaryLifecycle` capability, replay, purpose and trusted-approval contracts; close F2 only through the existing `Evidence` time/source/run contracts. The offline runner cannot grant these approvals, even if input JSON says PASS. A different ticker does not inherit VNM source admission.
3. Historical PIT/total return: require exact decision-time publication/revision/availability and separately complete action/session inputs under `qualifyCafefHistoricalUse`. Otherwise return `NOT_QUALIFIED`; never use adjusted prices to bypass it. Missing series sessions (R3) restrict historical completeness, not an otherwise supported cutoff raw close.

## Deterministic offline replay

Prepare a `vn30-s4-review-input-v1` JSON with exact retained-source pins and reviewed event identities, following the contract. Example retained VNM fixture: `docs/fundamental-data-engine/vnm-s4-reusable-skill/2026-11-12/VNM_INPUT.json`.

```sh
node skills/vn30-market-price-corporate-actions/scripts/runtime.mjs \
  --input <ticker-input.json> --out <new-review-output-root>
```

Output is `<root>/<TICKER>/<cutoff>/{EVIDENCE.json,ACCEPTANCE.json}`. Explicit input review times make replay deterministic; unchanged reruns do not overwrite, changed results require a new review directory. Source hashes/JSON pointers and collector raw-response hashes are verified before writing. Missing scalar terms stay null; invalid identity/hash or scope fails before output. Never write into `data/`, SQLite, portfolio or authority registries.

For VNM reference scope: R1 remains `CLOSED_BY_OWNER_APPROVED_CARRY_FORWARD_POLICY`, R4 remains `CLOSED_BY_SCOPE_EXCLUSION`, and R3 is restricted to historical completeness. The17-fact retrospective research admission is **PENDING_EXPLICIT_OWNER_APPROVAL**. The old conditional-approval receipt is superseded and retained for audit only. Never treat a recommendation, proposed decision or assistant summary as authorization; require an exact owner-authored reference verified independently for the actual proposal. The current correction/readiness report and CIO checklist are in `docs/fundamental-data-engine/vnm-s4-governance-correction/2026-11-12/FINAL_REVIEW.md`; F1/F2 remain open. For another ticker, derive its own conclusions from its own sources.

Report selected facts, exact unresolved requirements and source/policy references. No repeated generic qualification inventory, score, portfolio mutation or source/production self-approval. **STOP for CIO review.**
