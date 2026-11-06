# DFR-05 P2.2-ACB-01 implementation

Baseline/HEAD: `264c7120462d2b638ec32900afb22fd56e74cd1a`. Working-tree implementation is uncommitted; no new commit SHA is claimed. Owner request explicitly authorizes ACB only. Implementation acceptance remains PENDING_OWNER_REVIEW.

Universe: 2026-11-05-v1, reference date 2026-11-05, canonical hash `931e8355854bccc45918b38f2c5061bfda0786bf4bb8779fbe213be8e5107d56`. Stable ACB security ID `658fafbe-65b3-4176-999f-d4d32e1bd838`. New dispatcher authorization requires the complete stable identity + BANK approved M3 sector + BANK economic subtype + CONSOLIDATED qualified financial reporting scope. It denies every other tuple before source access.

New implementation: scripts/lib/dfr05_acb_v2.py; builder: scripts/build-dfr05-acb.py; tests: scripts/test-dfr05-acb.py; boundary probes: scripts/verify-dfr05-acb-boundaries.mjs; finalizer: scripts/finalize-dfr05-acb.py. Sealed DFR02/P1 files, pilot constants, financial facts, bands and weights were not edited. The BANK recipe uses real ACB identities and composes original DFR02 Graph.add/fact/derive and original P1 adapter traversal, raw Decimal checks and dependency edge/affected semantics. No BID execution, ID replacement or pilot-guard bypass occurs.

Four retained source structures were actually traversed: manual PDF display, full-page notes, CaféF display/raw JSON and combined display. Source inventory reports full available row/page counts and original dimensions. Export materializes dependency rows and distinct period/scope/unit/state/mode witnesses; it does not duplicate the whole retained history. Presence never qualifies a financial operand. PDF native review is preferred; CaféF remains a raw-hash/pointer-checked reference with unknown units left unknown. Combined JSON remains a presentation candidate.

The retained native source records carry original normalized VND operands, review flags, original revision, reviewed scope and source hashes. ACB-01 additionally checked original PDF financial pages7/8/10 and loan-reserve notes50/50/52/51 for FY2022/23/24/25 because display extraction omits page8 balances and some total rows, and the reserve definition required reconciliation. Direct review is by the implementing agent, not an independent human. Full historical OCR reconstruction is not claimed; no deleted readers or new sources were acquired.

Specific/general reserve components are distinct reported facts; their sum is explicitly a derived aggregate. The four retained aggregates are preserved in value and source audit, with their narrower definition recorded. Regulatory CAR/CET1 are reported percentage conversions, not accounting-derived capital. Regulatory consolidation and TT41 versus TT14 frameworks stay separate from accounting scope; no across-framework CAR growth is generated.

All new rubric points, bands, assessments, categoryScores, totalScore, ranking, signal and valuation remain null. All output is RESEARCH_PROVISIONAL; productionAdmissible=false and scoringAuthorized=false. No new qualitative evidence, source authority, share count, publication date or owner economic assumption is invented.

Reproduce: set DFR05_NODE_BINARY to an installed repository-supported Node >=22.23.2 <23; run `python3 scripts/finalize-dfr05-acb.py`. It runs twice and validates baseline/source/output hashes, actual tests and production rejections. No runtime download occurs. Python standard library is sufficient for replay; PDF rendering was a bounded manual inspection, not a replay dependency.

STOP for owner review. No CTG/MBB/TCB/VCB/SSI or other non-pilot processing; no rest of Batch B1, acquisition, scoring, production activation or data/database/master write.
