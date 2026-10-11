# Owner approval implementation and independent review handoff

The session instruction “Tôi approve hãy thông qua và làm tiếp” approves the two previously proposed CASA/NPL source contracts. Approval was conservatively recorded at 2026-10-12T14:57:36.000Z. M3 now references the versioned normative contract. The logical proposal item BANK_NPL_AMOUNT is the existing canonical BANK_NONPERFORMING_LOANS.

Diagnostic callers can pass an explicit canonical UTC `cutoff` to `mappingBoundary`. An eligible cutoff recognizes contract approval and returns a bank-specific mapping dependency with executionAllowed=false. Missing cutoff preserves legacy historical classification. The approved contract is integrity-pinned; invalid cutoffs fail closed. This helper never admits facts or computes ratios. The existing registry and numeric derivation crosswalk were not promoted.

Both generic contracts are approved prospectively. No bank-specific caption/product/class tables accompanied the proposal or approval, so every affected source mapping remains blocked. The historical snapshot predates approval and keeps its two historical defects. Eighteen PIT assessments remain UNKNOWN; approval supplies no publication evidence.

Validation: all 1,066 tests in 90 files passed, including eight governance-boundary tests. TypeScript and changed-source ESLint passed. Existing assertion and timeout settings were preserved. The full regression loaded the final governance helper at 15:03:53 UTC, after its last source edit. Prior sealed evidence hashes were checked: 39 artifacts unchanged. Regression JSON retains Vitest suite counts separately from file counts.

Run the diagnostic replay from the repository root with a supported Node 22 runtime:

```sh
node docs/fundamental-data-engine/evidence/2026-10-12-casa-npl-owner-approved/REPLAY_APPROVAL.mjs
```

The evidence is sealed read-only. Replay writes to `/private/tmp/vn30-owner-approval-replay.json` by default; an optional first argument chooses another output path.

DI14 remains AWAITING_INDEPENDENT_REVIEW. DI15 is not PASS. No additional financial statements, production DB writes, or operational scoring/ranking/Top10/decision/DCA execution occurred. Historical raw/render replay limitations remain as recorded in the earlier evidence.
