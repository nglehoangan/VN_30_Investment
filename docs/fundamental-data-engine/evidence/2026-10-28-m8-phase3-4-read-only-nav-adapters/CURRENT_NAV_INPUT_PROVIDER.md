# Conservative input provider skeleton

2026-10-28 · Phase3.4 SliceA · READ_ONLY_ADAPTERS_ONLY

ReadOnlyNavInputProvider implements existing CurrentNavInputProvider without changing it. `prepare(request,C,expectedFactsHash?)` returns BlockedNavInputsV1; `load` prepares then always returns null; isCurrent always false. It cannot construct any CurrentNavPlanV1, qualified NAV or full indicative NAV, regardless of local flags. No acceptance verifier is installed.

Typed blocked output includes exact request portfolio/T/K/revision, ledger state/history/hash (when valid), ledger-derived holdings/cash/claims/payables, all configured source pins including invalid manifests, immutable broker observations/fields/action references and conflicts, deterministic evidenceHead, reasons/limitations, completePlanAvailable=false and productionAuthorized=false. Observed figures are separate from accepted accounting truth; no required plan field is filled with invented values.

Evidence-head hash binds complete request, ordered configured pins, exact account/portfolio/perimeter/T/K, ledger facts/state hashes and observation outcomes. It remains bound even when invalid scope prevents reading a file; two different invalid pins cannot collapse to the same audit head. C is used for validation but not invented as source knowledge. Duplicate IDs/document IDs/paths reject. Missing observations, future evidence, bad asOf, uncertain lifecycle, duplicate security correspondence, same-field cross-document conflicts and disjoint cash/claim/debt discrepancies are explicit reasons. No silent current-balance override, summing ambiguous claims or balancing transaction is attempted.

Always preserve missing source authority, independent acceptance, forward continuity, security identity acceptance and market/calendar qualification. Even numeric cash/claims/payables equal recorded amounts leave completeness UNVERIFIED; recorded debt0 is not proven economic0. Pending/unknown lifecycle/action observations block. Cost basis remains existing reconstructed data, not accepted provenance or a substitute for ownership evidence.

The existing service returns its unchanged generic INPUT_PLAN_UNAVAILABLE when load=null. Detailed adapter reasons/provenance are returned alongside it by test-only composition, rather than modifying V1 NAV result/manifest or fabricating a complete plan. No approved interface amendment is necessary. Future complete-plan support, identity qualification, financial interpretation/reconciliation and authority verification require separate slice authorization.
