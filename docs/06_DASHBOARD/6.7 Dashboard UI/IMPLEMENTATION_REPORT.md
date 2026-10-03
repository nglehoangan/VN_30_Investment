# M6.7 Dashboard UI implementation report

## Outcome and scope

Built the supported local-first dashboard and evidence-inspection UI on the exact approved M6.6 HEAD `c059254d56c4f635d1ff9b09867ac6b4de970cf1`. Manual recording of occurred economic facts uses preview, explicit confirmation and the authoritative M6.3 command. **M6.8 functionality implemented: NO.**

The completion gate is not claimed: two Major upstream contract gaps remain (CHANGE_REQUESTS.md). Current operational snapshot composition and browser-initiated investment review/allocation workflows cannot be supplied safely from the existing persisted sources. The UI displays Unavailable and blocks current investment actionability rather than making new financial rules or fabricated data.

## A. UI architecture

Next.js Server Components resolve a route-specific presentation model through `app/server/dashboard.ts`. Infrastructure catalog queries select bounded IDs, and existing adapters validate/decode artifact bodies. Detail queries resolve explicit artifact IDs, including references outside list windows. UI client state is limited to draft inputs, submission locks, confirmation display and evidence disclosure. No global client store or query cache is introduced.

| Route | Screen | Authoritative source | Write boundary |
| --- | --- | --- | --- |
| /, /dashboard | Dashboard | M6.3 PortfolioEngine.reconstruct and latest persisted summaries | None |
| /holdings, /holdings/:securityId | Holdings / Portfolio | M6.3 state; historical M6.4/6.5 references | None |
| /vn30 | VN30 Universe | Pinned M6.4 effective-dated scorecard reference | None |
| /ranking, /ranking/:id | Scoring & Ranking / Top 10 | M6.4 immutable Ranking | None |
| /scoring, /scoring/:id | Scorecard | M6.4 immutable Scorecard | None |
| /decisions, /decisions/:id | Decision Center | M6.5 decision repository with deterministic replay | None |
| /dca, /dca/:reviewOrProposalId | DCA Planner | M6.6 proposal and M6.6.1 marginal artifacts | None |
| /reviews, /reviews/:id | Review Center | M6.6 WorkflowArtifacts.find | None |
| /journal, /journal/:reviewId | Investment Journal | Approved embedded journal, behavioral observations and follow-up artifacts | None |
| /transactions, /transactions/:id | Transaction history | M6.3 ledger repository validation | None |
| /transactions/new | Manual occurred-fact entry | Server-resolved portfolio, accounting methodology and ledger revision | Server Action → preview/confirm → PortfolioEngine.post |
| /audit, /audit/:snapshotOrMarginalId | Audit / Methodology | Validated artifacts, embedded snapshots, marginal steps, registry, execution and post-decision links | None |
| /risk | Risk evidence | Historical M6.5 risk assessments | None |
| /performance | Supported performance | M6.3 realized P&L and dividends; unavailable series explicit | None |
| /data, /settings, /imports | Data status / configuration / import availability | Source as-of and methodology metadata | None |

Full screen ownership/transformation/test mapping: UI_IMPLEMENTATION_MAP.md.

## B. Investment authority audit

- M6.3 remains accounting authority. Exact decimal strings from reconstruction render unchanged; React never calculates cash, NAV, cost basis, P&L or weights. The existing projection payload is not trusted as editable accounting truth.
- M6.4 remains score/rank authority. Scorecards and ranking come from checksummed adapters. Exclusions, confidence, data quality and near ties are displayed; Top 10 ≠ Buy list is visible.
- M6.5 remains decision/risk authority. Economic state, execution status, review status, suggested action, reasons, required return and evidence come directly from immutable decisions. Exactly seven states remain in the domain. BUY + REQUIRES CASH ACCUMULATION renders separately.
- M6.6 remains workflow/allocation authority. HOLD CASH is normal; proposal lots, residual cash, marginal steps, stop reasons, preferred candidate, selected substitute, policy and supporting evidence are upstream outputs.
- No price, PE, rank, gain/loss, monthly contribution, available cash or technical signal becomes a UI investment rule. The architecture AST test prohibits runtime UI imports of investment engines, calls to authority calculators and assignments to formal output fields. Existing transitive server/client boundary checks remain active; only React Hook Form was added to allowed UI dependencies.
- No upstream domain module, formula, methodology identity or schema migration was changed.

## C. Screen matrix

All requested screen destinations exist: Dashboard, Portfolio/Holdings, VN30, Ranking, Scorecard, Decisions, DCA, Reviews, Journal, Transactions, Audit, Data status. Risk, Performance, Imports and Settings follow the approved IA. Supported artifacts render; missing upstream services are explicitly unavailable. Reviews support all five approved types, with event-driven reviews ordered first. Review and journal authoring, current allocation initiation and proposal execution handoff remain unavailable under UI-CR-01/02/03.

## D. State coverage

| State | Implemented behavior |
| --- | --- |
| Loading | Next loading boundary with status text |
| Empty | Valid empty tables and explicit missing-artifact messages; no fabricated portfolio data |
| Error | Sanitized server errors and retry-read boundary; no SQL, paths, raw exception or secret output |
| Stale | Historical/as-of labelling; current critical freshness Unavailable; confirmation revision conflict fails closed |
| Blocked | Persistent text warning, integrity error alert; investment initiation has no active control; corrupt selected source fails closed |
| Success | Authoritative accounting and artifacts; HOLD CASH / NO ACTION normal; confirmed ledger event with recomputation result |

Unavailable freshness is never relabelled fresh based on an arbitrary UI time threshold. Recorded/as-of dates are retained separately.

## E. Capital-action controls

Manual entry records already-occurred BUY, SELL, contribution, withdrawal, fee, tax, cash dividend, settlement or reversal. It is not a proposal-execution or trading authorization endpoint. BUY/SELL records the M6.3 obligation; settlement is a separate fact. Corporate actions/opening balances remain visible in immutable history but require their existing specialized upstream workflow.

React Hook Form provides accessible UX validation; strict Zod input parsing and domain replay remain authoritative. Server resolves the only supported portfolio and an approved production accounting methodology. Browser financial authority fields are rejected. Gross trade amount is calculated on the server using the existing domain Decimal; it is never trusted from a draft.

Preview uses prepareCandidate without writing. A process-private HMAC signs the exact command, source identity, server ID, ledger revision and a ten-minute confirmation expiry. Preview exposes authoritative posting legs as the expected accounting effect. Explicit confirmation revalidates the signature, expiry, registered method and current revision, then PortfolioEngine.post atomically claims the revision and validates the full ledger transition. Stable source/idempotency keys and database uniqueness prevent duplicate events. Restart invalidates old previews. No signing secret is serialized to a client.

Next Server Action origin protection is reinforced by explicit mandatory matching Origin/Host checks allowing only HTTP loopback hosts. There is no generic ledger/artifact mutation endpoint, delete/edit control, broker connection or automatic proposal execution. Pending UI and an event-handler lock prevent concurrent submission. Successful posts with blocked/stale reconstruction are reported as recorded and never invited to retry economically.

## F. Responsive and accessibility evidence

Desktop 1440px and mobile 390px Playwright tests exercise major screens and assert no document-level horizontal overflow. Wide analytical tables deliberately scroll within focusable labelled regions. Forms have labels, associated errors, fieldsets, named buttons and pending states. Status is conveyed by text, not color. The shell has grouped navigation, aria-current, skip link, headings and visible focus. Nested evidence mounts on expansion to avoid rendering large pinned input trees.

Visual evidence and actual inspection outcomes are recorded in VALIDATION_REPORT.md. Automated layout checks do not establish a comprehensive accessibility certification.

## G. Validation

Sequential command results, exit codes, test counts and logs are in VALIDATION_REPORT.md and validation-evidence/results.json. Validation targets disposable test databases only. Smoke/E2E now creates an owned temporary database instead of inheriting a real DATABASE_URL. Test fixtures are seeded only through tests/e2e/setup.ts and visibly labelled synthetic. Vitest runs one worker to prevent concurrent heavy immutable-artifact fixtures from exceeding existing 20-second test limits; assertions and timeouts are unchanged. The system Node 22.12.0 was below the repository requirement; validation uses Node 22.23.2 installed under /private/tmp, without changing system Node.

## H. Findings

- Critical unresolved: 0 identified in implemented supported paths; independent review remains required.
- Major unresolved: 2 upstream contract limitations, UI-CR-01 and UI-CR-02. Completion gate not met.
- Minor unresolved: 1, dense evidence tables and long catalogs need presentation polish; core desktop/mobile flows pass.
- Deferred: UI-CR-03 (compatible history/benchmark queries, import commands, independent journal authoring).
- Technical debt: catalog lists cap at 100 with a visible notice; no complete pagination UX. Authoritative M6.3 reconstruction still needs ledger history because no trusted summary query is available. Generalized evidence inspection is less polished than bespoke evidence-field layouts. Existing filesystem composition produces build tracing warnings; no runtime failure is implied by a successful build.
- No real portfolio data was seeded or used as a validation target.

## I. Scope

**M6.8 functionality implemented: NO.** No scheduler, cloud service, broker integration, AI investment authority, policy editing or automation was introduced. Work stops at M6.7.
