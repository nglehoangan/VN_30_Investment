# G2/G3 implementation review

Owner request: implement the approved cefdb63e8dd38910e589b0607c4f931d4330ca60 proposal, with a VNM-only research pilot. Engineering implementation permission is separate from production executable authority approval.

G2 is applied to `src/domain/scoring/scorecard.ts` and the new immutable `action-dependencies.ts`. Corporate-action failures gate action-sensitive metrics and dependent rubrics. Industry/governance ownership disclosures remain independent unless an action-sensitive metric is actually consumed. GQ-HIST, valuation and capital-allocation action dependencies remain mandatory. Per-share evidence used elsewhere retains its action dependency. Missing/stale/conflicting action evidence never becomes valid by default.

G3 is applied to `metrics.ts`. CAGR requires two ordered growth contexts bound to operand IDs and exact dates; full annual windows; matching known consolidated/standalone scope and revision policy; matching units; exact 3/5-year fiscal/calendar horizon; and source identity. Missing context is rejected. Cross-year annual comparison is permitted; same-period checks remain for other metrics. Cyclical normalization is unchanged.

Two narrow implementation refinements satisfy the explicit G3 acceptance criteria: sourceReference must equal the operand's own nonempty source, and EPS_CAGR requires VND_PER_SHARE units in addition to ACTION_ADJUSTED normalization with usable action provenance. These add no formula, scoring band, weight, valuation assumption or approval bypass. Scope/revision metadata remain qualified-adapter assertions, not source truth inferred by the calculator. Publication/PIT validation remains in validateEvidence and source admission; arithmetic-only research replay does not qualify publication.

The BigInt CAGR `growth()` body and Decimal semantics are unchanged. G4/G5/G7 dependency/confidence policy remains unchanged: an unusable metric may still block a total under the existing contract; this task does not adopt the remediation dependency prototype. The method identity and approved bands/weights remain unchanged.

Tests include frozen pre-change engine witnesses, all-sector equality for unchanged inputs, fiscal/leap-year windows, unit/source/scope/revision/period/horizon negatives, EPS adjustments, local conflicts, partial assessments and rejection of AI/unsupported points. Receipts are in REGRESSION_RESULTS.md and execution-receipts.json. The baseline copies differ from their cefdb63 source only in relative imports required by their fixture location.
