# Owner decision packet — implementation and genuine remaining decisions

Engineering already authorized by this escalation has been implemented: grouped required/anyOf/preferred/supporting/optional semantics, qualified route selection with evidence receipts, nine approved sector templates, and a definition-supported proposed SECURITIES ROE crosswalk. No new decision is requested to invent a formula already defined. None of these implementations activates an authority.

## D1 — Bank source populations, not a generic formula approval

**A. Exact question:** For each of the12 eligible banks and relevant period, which disclosed current/savings products and regulatory loan classes/populations constitute CASA/NPL, and what exact reporting scope/regulatory-to-VAS bridges are permitted?

**B. Existing approved rule:** CASA=current and savings/customer deposits; NPL=gross nonperforming/gross customer loans, coverage uses consistent NPL. Approved `casa-npl-source-contract-v1.json` has zero bank-specific mappings and explicitly excludes automatic registry promotion.

**C. Options:** (1) Exact per-bank disclosed populations and source-table mappings; (2) keep affected metrics unavailable until those disclosures exist. Demand-deposits-only or net-loan aliases are not permitted options.

**D. Recommendation:** Option1 where exact authoritative disclosures support it; option2 elsewhere. Do not approve unspecified future populations.

**E. Consequences/risks:** Mapping work remains per issuer/period; incomparable definitions cannot be ranked as equivalent. Missing necessary sector evidence continues to block the affected route.

**F. Approval scope:** Only a concrete populated mapping table, enumerated classes/products, effective period, scope, units, source locators and any explicitly evidenced bridge. This packet does not contain that evidence and requests no blanket approval of it.

**G. Codex after approval:** Validate/install the exact proposed mappings and registry/crosswalk candidates in an isolated review package, run compatibility tests and present exact hashes. Production activation remains separately prohibited.

## D2 — Date-only public disclosure availability

**A:** Keep timestamp-only admission, or permit an explicit conservative date-only availability boundary for verified issuer/exchange disclosures?

**B:** Unknown stays unknown; source date is distinct from economic period/retrieval/ingestion/signing date. Existing availability engine supports governed date-only boundaries, but the proposed runtime policy does not authorize them.

**C:** (1) Timestamp-only: date-only evidence remains blocked. (2) Verified DATE_ONLY with explicit timezone and next-local-day conservative availability boundary, followed by max with retrieval/ingestion/verification/mapping/method knowledge. The boundary is not an invented public timestamp. Trusted API receipt evidence requires its own exact semantic authority; it is not an automatic substitute.

**D:** Option2 only for verified original public disclosures and exact source-to-document identity; retain original DATE_ONLY and publishedAt=null. Keep unverified VHM index leads blocked.

**E:** Conservative boundaries lose intraday availability and cannot justify a historical cutoff before source/mapping knowledge. Permitting date precision cannot repair inaccessible or mismatched disclosures.

**F:** Policy-design approval for the precise semantic rule/timezone/eligible evidence class only; no approval of unverified facts, future policy hashes or runtime activation.

**G:** Prepare exact versioned proposed policy/source contracts and tests, then submit exact hashes for independent review. Do not admit data or activate authorities automatically.

## D3 — Undefined normalization and valuation input choices

**A:** Where the approved documents leave an issuer's sustainable-profit adjustment, tax/capital population, regulatory bridge or valuation assumption unresolved, which evidenced alternative should govern that issuer and period?

**B:** Preserve approved sector alternatives and cycle rules. Banks use sustainable return/capital/asset quality; securities use through-cycle ROE/fee/trading-risk and P/B/P/E, not BANK CASA/NPL. Property/industrial/commodity/retail/technology/utility/energy valuation and normalization overlays remain as approved in SECTOR_REQUIREMENTS_VALIDATION.json and prior SECTOR_READINESS_MATRIX.json.

**C:** (1) Analyst proposes source-supported normalized components and justified selection among existing approved models, independently reviewed. (2) Defer the affected route if insufficient evidence. A method not already defined requires a separately versioned amendment, not an alias or equal-value mapping.

**D:** Option1 where definitions suffice, with option2 for genuine unknowns. Existing formula applicability does not require another blanket methodology decision; actual economic adjustments do require accountable review.

**E:** The exact full scoring minimum cannot be frozen until selected model/window/normalization inputs are concrete.216 current core obligations are a lower-bound source queue, not a complete valuation or growth dataset.

**F:** Only exact issuer/period-specific proposed adjustments/assumptions and evidenced alternatives with consequences. No approval of a blank all-sector mapping or future hash. No approved weights/bands/formulas change here.

**G:** Implement only the resolved mappings, expand the per-fact acquisition plan for the selected route and test exact units/scope/period/knownAt compatibility. Keep unknowns blocked.

## D4 — Minimal trusted HUMAN workflow deployment

**A:** Which Owner-controlled identity/session trust root, named role administrators and authenticated receipt storage/verifier will the production workflow use?

**B:**667 explicit rubric requirements, current authenticated M1 gates, independent producer/reviewer separation and invalidation remain mandatory. File staging and caller identity strings are not authentication.

**C:** (1) Existing Owner-controlled OIDC/SSO if available, server-managed capability grants, append-only authenticated receipts and auditable revocation; (2) separately provision an Owner-selected managed identity service with the same controls. Neither path delegates HUMAN approval to AI or a service account.

**D:** Option1 if an established trusted service exists; otherwise Owner selects a concrete provider before implementation. No provider deployment is assumed.

**E:** Credential/session/role compromise would invalidate approval authority; signed hashes alone do not establish a real reviewer. Independent reviewer grants must be separated from producer privileges.

**F:** Concrete issuer/audience/session/revocation configuration, named grant administration, analyst/M1/independent capabilities, receipt authenticity/storage/retention/recovery policy and reviewed deployment release. This is security design/deployment scope, not actual rubric/M1 approvals.

**G:** Build isolated identity adapter, server authorization and immutable reason-bearing receipts; test forged identity/role, CSRF, expiry/revocation, CAS races and recovery before any deployment. Present a concrete release for review; create no approvals.

## D5 — Exact MARKET review and separate CAS authorization

**A:** Accept the exact completed2026-10-21 REST EOD package for the limited RAW latest-close valuation profile? See MARKET_REVALIDATION.json for current eligibility, full hashes and prior release; expired proposals must be requalified.

**B:** Technical qualification and independent mechanical review do not activate MARKET. This escalation explicitly forbids CAS. WSS0 frames qualifies no streaming service.

**C:** (1) Accept the exact REST-only EOD candidate/profile for review while leaving heads unchanged; (2) reject with specified evidence/contract reasons or request requalification. Any later CAS requires a distinct explicit authorization and fresh head/time/hash checks.

**D:** Option1 only while MARKET_REVALIDATION.json is eligible. Candidate canonical hash `e4c32fc1663303d634eadcd1a31dc00378ee6965ea00adf33e03cb3f0c3df3ba`; MARKET hash `d869bb08b0486d190e21ad0c26198d9ee96eea7812b55ffd41f806e83fa1e494`; expected release hash `8d1e0909d377a4e1225b54f26cca0833a0fd24a9af3271d4cdd26419e193d01a`. Full capability/initialization/session pins and independent-review digest are in the JSON. Expiry remains2026-10-22T07:59:59.999Z.

**E:** Acceptance is limited to current-knowledge latest completed RAW CLOSE, not adjusted history/total return or WSS. Expiry/head drift invalidates execution eligibility; restoring an expired old policy does not create fresh authority.

**F:** Exact candidate/profile acceptance only, with configured independent reviewer binding. CAS is NOT authorized by approving this packet. No five-authority activation or scoring authorization follows MARKET acceptance.

**G:** Prepare a durable exact acceptance configuration and present separately authorized expected-prior-head CAS operation/recovery review. Do not execute CAS under this escalation.

## D6 — Final authorities and actual dataset acceptance

**A:** No approval question is actionable yet for the5 production authorities: material specifications/source dependencies remain. After they close, review each exact complete payload/version/effectivity/dependency hash, and separately the actual immutable dataset receipt.

**B:** Approved architecture is not runtime authority or dataset approval. Reusable DI methodology is distinct from the future dataset-specific independent acceptance receipt.

**C/D:** Complete prerequisites, then independent exact review; otherwise continue blocked. Do not approve incomplete future hashes or waive missing evidence.

**E:** Premature approval could bind an incomplete registry/source model or synthetic HUMAN evidence.

**F:** Future review must name extant concrete immutable complete artifacts, never unspecified hashes. This packet grants no authority activation.

**G:** Codex may prepare those exact reviewable artifacts when dependencies close. Activation, actual HUMAN review, dataset acceptance and scoring each retain their existing authorization boundaries.
