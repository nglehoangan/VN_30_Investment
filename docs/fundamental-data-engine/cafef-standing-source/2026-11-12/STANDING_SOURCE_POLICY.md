# CaféF VN30 standing raw-close source policy

Starting commit: `e08ec2d05dbb3dfb3afe55b9857c0d46c75139a2`.

The exact owner decision is: **“Standing Source Approval for CaféF Raw Close across the VN30 universe, with automated Capability/Market Validation, deterministic replay, and transformation during ingestion.”** [OWNER_REQUEST.txt](OWNER_REQUEST.txt) is the verbatim user-supplied request; [SOURCE_POLICY_AUTHORIZATION.json](SOURCE_POLICY_AUTHORIZATION.json) pins it and the versioned policy proposal. This authorizes the **source-governance principle**, not arbitrary code, observations, the VNM17-fact financial proposal or production activation.

| Binding | Version/scope |
| --- | --- |
| Policy | `cafef-vn30-standing-raw-close-v1`, [machine definition](../../../../src/domain/market-boundary/cafef-standing-policy-v1.json) |
| Source ID | `CAFEF_PRICE_HISTORY` |
| API | `https://cafef.vn/du-lieu/Ajax/PageNew/DataHistory/PriceHistory.ashx`; exact six request parameters, one-year bounded date scope, positive PageIndex and collector PageSize30 |
| Retained container | Existing fetching skill schemaVersion1; original API bodies and SHA-256 remain embedded |
| Logical source schema / adapter | `cafef-price-history-v1` / `cafef-retained-collection-adapter-v1` |
| Normalizer / field | Existing `cafef-raw-close-only-v1`; **GiaDongCua exclusively**, CLOSE/RAW |
| Units / currency | Evidenced thousand VND/share ×1000 → VND/share, existing decimal arithmetic; original `units:null` is preserved |
| Purpose | VALUATION only; no scoring/execution/ranking authority |
| Universe | VN30 membership effective on each observation date, with bounded source/identity evidence; no perpetual inference from null end dates |
| Session | Existing qualified HOSE calendar and conservative15:00Vietnam full-session convention; not an invented provider event timestamp |

## Three distinct authorizations

1. **Standing source principle — explicitly owner authorized.** The source text/hash and exact scope are verified. A trusted host must select the currently active authorization pin; a submitted candidate cannot choose an active policy for itself.
2. **Adapter/material integrity — independently accepted once per material version, currently missing for real use.** The material hash includes implementation/schema/SQL/clock/collector files, policy, unit declaration plus original receipt, calendar sources and bounded membership/security-ID mapping. Trusted registry acceptance must identify that exact hash, actual knownAt, retained review record/reviewer and non-superseded status. A candidate/CLI cannot supply PASS flags or bootstrap its own acceptance. The dry-run registry is empty; synthetic tests use an explicitly synthetic private registry.
3. **Each capture/observation — automatically validated under unchanged accepted scope.** A trusted capture handoff/catalog, populated by the approved existing collector or qualified retained-evidence import, must identify the exact raw hash/request hash and collector-code hash. This is a provenance control, not a new manual source approval for each ticker. The code then verifies request identity, body/container hashes, date, ticker/exchange, raw field, units, session and dated membership; runs actual authority/lifecycle replay; and atomically persists. Unknown captures cannot admit arbitrary locally fabricated JSON.

The smallest governance amendment is a **trusted standing-policy composition** that derives the existing evidence approvals after those checks. Existing `RetainedMarketAuthority.approve`, capability/market replay, `BoundaryLifecycle.qualifyCapability/acceptMarket`, seal/version validation and financial time contracts remain in force. The authority receives an optional trusted immutable-store raw reader; **origin, root-relative path, size and hash checks still apply**, and the filesystem path remains the default for existing integrations. No generic PASS bypass was added.

## Invalidation and requalification

A missing/superseded authorization, unknown material hash, changed code/collector bytes, API/schema/semantic/unit mismatch, unknown capture, replay/hash mismatch or unsupported membership/calendar range fails closed. Recomputed hashes are not automatically accepted. Update policy authorization if scope/API/financial semantics change; independently review any changed implementation/material, restart/rebind the trusted host and rerun replay before resuming the affected scope. An unrelated provider/source contract is unaffected. Per-ticker data that passes an unchanged accepted material version needs no repetitive manual source approval.

Membership and calendar sources are material evidence, not self-certified runtime flags. The retained real membership review currently proves a window only **3Aug–16Oct2026**. Later dates and2022–2025 history are not admitted under that snapshot. The code preserves this limit instead of weakening it to force migration/pilot success.

## Current status

The principle and controlled pipeline are implemented. **No real independent material acceptance is installed; no actual records are marked accepted in the active database.** Real transformation/replay passes for52 in-window VNM candidates. The30Oct VNM research raw close remains56,900 independently of index-scope admission. F1 is BLOCKED pending the exact independent material/capture qualification and applicable date coverage. F2 remains OPEN; R1/R4 stay CLOSED. The prior17-fact research proposal remains pending explicit owner approval; this standing-market principle is not its approval.

Migration, rollback and exact final decisions are in [FINAL_CIO_REVIEW.md](FINAL_CIO_REVIEW.md). **STOP before production activation.**
