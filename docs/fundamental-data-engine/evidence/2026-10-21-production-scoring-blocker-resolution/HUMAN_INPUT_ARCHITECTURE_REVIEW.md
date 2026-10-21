# HUMAN Input Architecture Review

Status: architecture recommendation only. No approved methodology, source=HUMAN input, review validity or owner gate was changed.

## Findings and counts

667 means23 issuer-specific rubric selections x29 eligible issuers, not667 distinct people or necessarily667 separate approval clicks. Each selection is an auditable declaration with16 fields, named band and bounded integer points; metadata fields do not multiply the number of decisions. H classifications are review judgments over the existing contract, not new scoring rules.

| Class | Meaning | Definitions per issuer | Slots across29 |
|---|---|---|---|
| H1 | Intrinsically qualitative | 8 | 232 |
| H2 | Fact-derived, HUMAN-reviewed | 14 | 406 |
| H3 | Fully deterministic WHOLE rubric | 0 | 0 |
| H4 | Owner/governance gate mirror | 1 | 29 |

H3 whole-rubric count is0. Fixed points after choosing a band do not make band selection mechanical. VAL-RET has deterministic threshold validation, but the estimate/assumptions, within-band selection and maximum support are reviewed. RG-RISK has a fixed class-to-points map, but its underlying M1 classification is a governance gate; classify the whole item H4, not H3. Approved metric calculations outside these23 rubrics are deterministic evidence preparation, not licenses to remove HUMAN attestation.

Auxiliary inputs are separate:8 containers per issuer (232 containers), not another232 rubric decisions. Stage0, veto and residual risk are H4 external-owner envelopes; confidence/model/context need reviewed inputs; double-count review is H4; thesis is H1. The inventory describes every container field. Owner gates are not all literally source=HUMAN in the type system; the distinction is preserved.

## Every rubric

| Rubric | Class | Why | Proposed lifecycle |
|---|---|---|---|
| BQ-EQ | H2 | Accepted returns/margins/capital-cost metrics can be precomputed; persistence and economic normalization still require analyst judgment. | QUARTERLY_ON_NEW_REPORT_AND_EVENT_DRIVEN |
| BQ-MOAT | H1 | Durability, customer behavior and competitive advantage are qualitative investment judgments. | ANNUAL_AND_EVENT_DRIVEN |
| BQ-CASH | H2 | Cash realization and adjustments can be evidenced automatically; quality and recognition interpretation are not a CFO ratio. | QUARTERLY_ON_NEW_REPORT_AND_EVENT_DRIVEN |
| BQ-RES | H1 | Resilience, concentration and stress response need qualitative scenario judgment. | ANNUAL_AND_EVENT_DRIVEN |
| FH-BS | H2 | Capital/leverage/asset-quality facts are computable, but sector buffers and downside sufficiency require review. | QUARTERLY_ON_NEW_REPORT_AND_EVENT_DRIVEN |
| FH-LIQ | H2 | Maturity/covenant/coverage schedules can be prepared; credibility and refinancing resilience require review. | QUARTERLY_ON_NEW_REPORT_AND_EVENT_DRIVEN |
| FH-STRESS | H2 | Scenario calculations can be prepared; scenario plausibility and funding responses require review. | QUARTERLY_ON_NEW_REPORT_AND_EVENT_DRIVEN |
| GQ-HIST | H2 | Comparable growth/per-share calculations can be prepared; base effects, acquisition and normalization quality need review. | QUARTERLY_ON_NEW_REPORT_AND_EVENT_DRIVEN |
| GQ-FWD | H1 | Runway, reinvestment opportunity, execution and funding durability require forward qualitative judgment. | QUARTERLY_ON_NEW_REPORT_AND_EVENT_DRIVEN |
| GQ-INC | H2 | Incremental return operands can be derived; economic denominator/unit-economics comparability still needs review. | QUARTERLY_ON_NEW_REPORT_AND_EVENT_DRIVEN |
| IC-IND | H1 | Barriers, disruption and rational competition are industry judgments, not sector-rank arithmetic. | ANNUAL_AND_EVENT_DRIVEN |
| IC-POS | H1 | Leadership and sustainable positioning require issuer-specific interpretation beyond market share. | ANNUAL_AND_EVENT_DRIVEN |
| IC-CYCLE | H1 | Forward normalized asymmetry requires judgment; spot momentum cannot determine the band. | PER_SCORING_CYCLE_AND_EVENT_DRIVEN |
| VAL-PRIMARY | H2 | Model outputs are computable only after human assumptions; model suitability/cross-check and normalized denominator require review. | PER_SCORING_CYCLE_AND_EVENT_DRIVEN |
| VAL-RET | H2 | Return-band boundaries are deterministic conditional on a reviewed estimate; within-band choice, model confidence, downside and maximum prerequisites prevent a fully deterministic rubric. | PER_SCORING_CYCLE_AND_EVENT_DRIVEN |
| VAL-MOS | H2 | Discount arithmetic can be prepared; conservative value, impairment downside and evidence quality require review. | PER_SCORING_CYCLE_AND_EVENT_DRIVEN |
| RG-GOV | H1 | Minority treatment, auditor/related-party/disclosure interpretation require qualitative governance judgment. | ANNUAL_AND_EVENT_DRIVEN |
| RG-RISK | H4 | ScoreInput must mirror the externally authorized M1 residual-risk class; fixed class-to-points mapping does not authorize inventing/automating the owner gate. | PER_SCORING_CYCLE_AND_EVENT_DRIVEN |
| RG-UNC | H1 | Forecast dependence and defensible uncertainty ranges are judgment calls. | PER_SCORING_CYCLE_AND_EVENT_DRIVEN |
| CA-REINV | H2 | Capital-allocation facts can be tabulated; distinct economic outcomes beyond incremental-return ratio need review. | QUARTERLY_ON_NEW_REPORT_AND_EVENT_DRIVEN |
| CA-DIST | H2 | Distribution/retention/buyback evidence can be prepared; prudence and resilience are not a deterministic payout-ratio rule. | ANNUAL_AND_EVENT_DRIVEN |
| CA-DIL | H2 | Issuance and per-share arithmetic can be prepared; value destruction versus accretion requires issue-terms/proceeds review. | QUARTERLY_ON_NEW_REPORT_AND_EVENT_DRIVEN |
| CA-PSV | H2 | Per-share trends can be calculated; real cycle/action-adjusted compounding still requires review. | QUARTERLY_ON_NEW_REPORT_AND_EVENT_DRIVEN |

## What can be prepared without replacing judgment

H2 topics should use accepted-source extraction, lossless normalized facts, governed derivations, reconciliation tables and counterevidence. HUMAN reviewers then select the band and points. This removes repeated numeric transcription, not review. Ratios alone cannot satisfy BQ/FH/GQ or valuation rubrics. Different economic channels still need distinct rationale where the same evidence family is reused.

IC-IND and compatible IC-CYCLE sector evidence can share a versioned memo only for genuinely comparable industry/date/scenario context. Every issuer still requires its own sector rationale and exposure assessment; no automatic shared points or broad-sector blanket approval. RG-RISK can reference the same authorized residual-risk decision as its external gate, avoiding two independent economic judgments; explicit owner lineage and required HUMAN rubric confirmation remain.

Current contracts do not demand a fresh qualitative judgment every cycle: assessedAt must be <=knownAt and all source evidence must remain valid/usable, same methodology/sector and compatible context. There is no separate fixed TTL or Assessment.validThrough property. There is also no standalone authenticated reusable-assessment entity. Do not invent a runtime expiry policy or add fields to exact ScoreInput objects.

## Lifecycle and reuse recommendation

Potential structural reuse candidates are BQ-MOAT, BQ-RES, IC-IND, IC-POS, RG-GOV and CA-DIST:6 definitions /174 slots, with annual-and-event-driven review. This is potential reuse under all evidence/context checks, not174 approved reusable inputs; currently approved reusable slots=0. Remaining17 definitions /493 slots are refresh-sensitive:11 quarterly-on-new-report (319 slots),6 per-cycle/price/risk (174 slots). All categories have immediate event/correction/conflict/expiry triggers. Cadences are proposals, not current formal policy or permission to extend source validThrough.

Safe future reusable identity: issuer + rubric + exact methodology/executable version + assessment-content hash + evidence/derivation hash set + sector/cycle/peer context + human reviewer/approval reference + explicit validity/review triggers. Content-address the immutable approved instance; each scoring input records exact selected instance/hash. Reuse only when every dependency remains valid and unchanged. A changed price invalidates price-linked valuation conclusions even if structural moat evidence persists. A restatement/correction/event invalidates affected judgments. AS_KNOWN cutoffs must not see later approval/corrections.

Owner gates must retain gate.asOf===input.asOf. A persistent risk conclusion cannot simply reuse an old gate envelope with a different asOf. Reissue a current, explicitly authorized envelope referencing prior reviewed substance only if the governing authority permits it. No automatic rollover. Implementing new assessment entities/receipts/validity logic or cadence policy needs Owner/ChatGPT CIO architecture approval before code/schema changes.

## Safest AI-assisted workflow

1. AI prepares a clearly untrusted draft evidence packet: exact source/cell pointers, accepted fact/derivation IDs and hashes, conflicts, missing topics, sensitivity and counterevidence. It does not fill formal selectedPoints, claim source=HUMAN, assert maximum prerequisites or create owner gates. The approved clarification explicitly says AI may not supply/default/overwrite formal selected points.
2. An authenticated human analyst reviews evidence and explicitly authors/confirms the band, points, rationale, economic channel, counterevidence and maximum prerequisites. No preselected approve-all or missing-equals-neutral behavior.
3. Authorized M1 reviewers provide Stage0/veto/residual-risk envelopes with exact asOf, methodology and evidence. Human role/identity must be established outside a request-controlled analyst string.
4. A reviewer distinct from the producer verifies the complete dataset/bridge/PIT/sector/valuation and binds its exact acceptance hash through the existing independently configured review capability. A draft is never an acceptance.
5. Only an approved immutable reviewed input enters formal runtime authorization. Rejections and unresolved items remain blocking, versioned separately from approved records.

The existing engine checks declared HUMAN/analyst metadata, not cryptographic identity of a person. New authenticated review receipts/UI/store are architecture recommendations and require Owner approval; this task implements none of them. Existing data-readiness or source-assessment approval cannot approve the investment judgments.

## Minimum legitimate human workload

First cycle: all667 rubric slots need legitimate support and explicit selection/attestation, including638 H1/H2 analytical rubric selections and29 H4 residual-risk confirmations. At least29 issuer-specific review dossiers must cover them; the contract does not require667 separate submissions. Each dossier also needs its8 auxiliary containers, including3 M1 gates per issuer (87 dated envelopes, one of which is the same residual-risk substance mirrored by RG-RISK), a double-count review, thesis, valuation/model and normalization context. At least one genuine independent dataset-review capability binding is required. These actions can be bundled for properly authorized people, but none of their semantics may disappear. Person-hours and the number of distinct humans beyond producer/reviewer independence cannot be inferred from code.

For later unchanged cycles, do not retype facts or rewrite still-valid judgments merely to change timestamps. Potential174 structural slots may reuse legitimately valid approved content after dependency checks;493 are refresh-sensitive on their proposed triggers. These are not claims that493 mandatory new manual entries are always needed each cycle or that174 can already be reused automatically. With no approved runtime assessments, no workload reduction is exercised now.

## Does reducing workload require methodology change?

Evidence preparation, coherent issuer dossiers and genuine unchanged-content reuse within existing evidence/time rules can preserve investment meaning. New UI/auth/immutable review lifecycle requires architecture approval. Eliminating a required HUMAN selection, converting a whole rubric to machine-scored, changing bands/weights/thresholds, auto-extending validity or replacing M1 gates requires explicit methodology/governance approval and a new immutable executable/method identity where material. None is implemented.

Conclusion: keep current23 rubric requirements. Reduce transcription and duplicate evidence collection; do not remove judgment or governance to unblock production. Review this proposal with Owner/ChatGPT CIO before implementation.
