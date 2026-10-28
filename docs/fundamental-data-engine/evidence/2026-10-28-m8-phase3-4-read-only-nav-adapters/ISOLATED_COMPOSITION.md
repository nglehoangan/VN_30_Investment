# Test-only isolated integration

2026-10-28 · Phase3.4 SliceA · READ_ONLY_ADAPTERS_ONLY

`tests/fixtures/nav-adapter-composition.ts` wires a read-only ledger wrapper, injected BrokerEvidenceReader, conservative input provider and unchanged CurrentNavReadService/calculator. It is not imported by src or app production roots. A real ImmutableBrokerEvidenceReader is used in integration fixtures; no real provider/auth/network is bound.

Factory returns only Object.freeze({read}); no ledger, DB handle, financial command or posting method is returned. Each invocation creates its own provider and local preparation capture; concurrent requests cannot overwrite another caller’s diagnostic. CurrentNavReadService uses its existing validation/revision checks. Missing plan always returns NAV_BLOCKED, both full totals null, permissions false; typed partial input lives separately.

Read dependencies are capabilities within trusted server/test code, not a security sandbox against arbitrary code executing in the same process. Private implementation fields must not be treated as authenticated identities or deployment isolation. No route, action, scheduler, environment mutation, login/session, production provider or dashboard wiring exists. Synthetic approved-price fixtures only verify unchanged calculator compatibility through existing tests; this adapter composition does not create or inject synthetic authority.

All rights remain disabled: production/official/performance/risk/actionability/scoring, current-account-now representation and snapshot persistence. Ordinary existing local views are unchanged. Slices B–G and Phase4 remain outside scope.
