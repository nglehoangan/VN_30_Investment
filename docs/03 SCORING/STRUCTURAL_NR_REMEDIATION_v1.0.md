# Structural N/R Remediation v1.0

Effective for diagnostic research on 23 November 2026. The scoring constitution, sector methodologies and exact executable and approval bindings continue to govern official results.

| Cause | Diagnostic test | Disposition path |
| --- | --- | --- |
| DATA_MISSING | The required qualified field or dated observation is absent or insufficient to support a band. | Retain N/R with the specific limitation and reopening trigger. |
| DATA_MAPPING_GAP | Eligible raw evidence contains the field, and the adapter omits, misidentifies or transforms it incorrectly. | Replay the exact observation and repair the mapping. Validate issuer, revision, period, scope, unit, sign, null/zero and lineage. A repair affecting an approved binding requires a successor and approval. |
| RUBRIC_DESIGN_GAP | Approved topics or bands fail to express the economic condition for the sector. | Record a versioned proposal with alternatives, affected sets, baseline comparison and approval gate. Keep N/R pending formal change control. |
| EVIDENCE_INTERPRETATION_GAP | Applying the approved topics and anchors to the evidence requires a defensible interpretation. | Apply the approved rule where adequate. Otherwise propose a versioned interpretation with boundary examples and counter-evidence. |

Record multiple causes where supported, exactly one primary, and why it governs the action. Record authority or admission restrictions separately from economic causes.

FUTURE_DATA_TEST asks whether another year with the same reporting structure would resolve the row at a **future** eligible cutoff. YES requires an identified field already emitted and a credible missing observation or comparison. NO means the same format leaves the blocker intact and requires escalation to the specific disclosure, analysis, mapping repair or policy owner. UNKNOWN records what would settle the uncertainty. Cite retained evidence and give the rationale. Future observations remain outside the baseline cutoff unless already eligible under the original rules.

One evidence-improvement pass and one resolution/validation review end in RESOLVED or ESCALATED. Zero passes apply when the baseline contains no N/R. Reopen only on specific new qualifying evidence, a corrected mapping or an approved rule. Record counts and outcomes in the final packet. Revalidating the same packet is idempotent.

VERIFIED identifies the defensible approved band. CONSERVATIVE takes the minimum of the lowest evidence-supported approved band. An observed zero can be scored when evidence supports the zero band. N/R remains null and continues to carry its unrated weight. The existing governed engine owns accepted totals, coverage, bounds and eligibility.

## Diagnostic packet and gate handoff

The [skill](../../skills/vn30-structural-nr-remediation/SKILL.md) uses the structural-nr-remediation-v1 contract. Pin the baseline scorecard or official limited-coverage readback by path, SHA-256 and optional JSON pointer, plus its receipts and rubric registry. Bind ticker, qualified sector, economic cutoff, evidence purpose and zoned knowledge cutoff. Verify the exact sector route and baseline authority before recording the packet. Include one unique diagnostic for each baseline N/R.

Diagnostic evidence records subject ticker, path, hash and exact locator. Rated recommendations also record the reviewed scope, unit, period end, publication date, known-at timestamp, purpose eligibility, retained review and band rationale. The validator checks recorded timing and eligibility against the packet. Original admission and scoring gates verify the underlying receipts. For identical JSON mapping, include raw and mapped pins and pointers. Replay normalization, unit conversions or PDF mappings through the original adapter and retain its review and exact comparable values. Design and unapproved interpretation proposals carry null points.

The diagnostic emits all authority flags false. A baseline-impacting action requires original approvals for the exact successor. Model or anchor changes add formal change control before any new assessment and exact route approval. Source admission, authorization, materialization and publication remain separately governed.

[Initial audit and validation](../fundamental-data-engine/structural-nr-remediation/2026-11-23/STRUCTURAL_NR_AUDIT.md)
