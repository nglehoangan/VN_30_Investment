# Valuation-time integration

2026-10-27 · Phase 3.3 · DESIGN ONLY — NOT IMPLEMENTED / NOT ACCEPTED

Time fields have different meanings; all instants UTC with original source precision/timezone preserved. Never assign midnight to a date-only broker observation or fabricate actual provider time.

|Time|Meaning / requirement|
|---|---|
|Ledger event/effective|Original observed event versus accounting effect; reconstruct only effects at/beforeT using pinned revision. CreatedAt is retained knowledge, not trade time|
|Broker asOf B|Exact account economic observation atT, or separately evidenced complete roll-forward toT; date-only without compatible accepted boundary fails|
|Market T|Accepted latest completed venue session; identity/action quantity and RAW close aligned to this session|
|Publication/source time|Original provider/source publication if witnessed, otherwise UNKNOWN/null; not replaced by retrieval|
|Retrieval R / knowledge K|Capture retained atR; source knowledge/evidence<=K, T<=K<=C. Capture25Oct cannot become knowledge23Oct|
|Acceptance A|Actual authenticated decision time, not earlier inferred evidence time; qualifying decision known<=K and effective forT, unexpired/unrevoked atC/P|
|Calculation C|Actual server sample; injectable clock does not prove synchronization; rollback/unhealthy clock fails qualifying/publication path|
|Publication P|P>=C; independent current dependency/revocation/session checks, within permitted validity; delayed publication may require new calculation|

Forward continuity must cover supported accepted opening boundary throughT including trades, cash, settlements, claims, fees/debt, transfers and CA. Later ledger movements afterT are excluded from economic reconstruction, but late-created facts affect revision/evidence qualification. Complete source coverage is separate from replay integrity.

|Change|Required handling|
|---|---|
|Late transaction/correction|Append through separately authorized existing accounting workflow, new revision/facts hash and new calculation; old result preserved/superseded, never silently rewritten|
|Corrected broker document|Retain both byte versions; authenticated supersession scope and new reconciliation; unresolved conflict blocks|
|Corporate action|Evidence-backed effective/knowledge interval and quantity/entitlement/price compatibility; pending unsupported remains blocked; no guessed conversion|
|Holiday/exception|Accepted calendar establishes unchanged latest session until exclusive next completed boundary; no arbitrary day-age threshold|
|Suspended/missing security|No accepted current exception in scope; blocked full value, named supported subtotal only|
|Price revision|Exact new raw/source pins and explicit accepted supersession; new result; no latest-wins merging|
|Revocation|Current verification blocks qualifying replay/publication even for historical accepted evidence; retain original audit/invalidation event|
|Inconsistent observations|No mixing current cash, prior prices and differing holdings; accepted exact roll-forward or block|
|Incomplete forward history|Block even if imported opening balances or an endpoint appears to match|

RETROSPECTIVE is the only knowledge mode. Existing service rejects transactions created/event-known afterK and replays current pinned history atT; it is not an AS_KNOWN bitemporal query. Later valid acceptance may support a retrospectiveT only with honestly laterK/C and still valid scoped methodology; it does not create past independent knowledge or make old prices current. Clock/anchor/restore prerequisites remain external; this phase runs no operational clock tests.
