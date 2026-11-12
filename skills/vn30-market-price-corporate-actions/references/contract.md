# Input/output contract — v1

Run from the repository root with installed project dependencies (Node, Python3, Vitest/Vite's existing Jiti loader). No package install, network, app server or database operation is performed. TypeScript interfaces in `scripts/review.ts` are the structural contract; `runtime.mjs` enforces retained file/value/receipt replay before invoking them. Input preparation is an evidence-review step, not an authority mechanism.

## Input

`schemaVersion=vn30-s4-review-input-v1`; `sourceMode=RETAINED_RESEARCH|SYNTHETIC_TEST` (checked against collector origin); ticker uppercase; exchange `HOSE|HNX|UPCOM`; cutoff ISO date; **explicit** review timestamp. The retained VNM fixture demonstrates every field without requiring source reacquisition. The two checked-in `tests/fixtures/vn30-s4/{SYN,XYZ}.json` sources are synthetic and grant no live research/admission authority.

| Field | Required meaning |
| --- | --- |
| `rawPrice` | Original CaféF row with ticker/date and provider fields unchanged. Missing `GiaDongCua` is a legitimate unqualified case; adjusted data never substitutes. |
| `price` | Ticker/exchange/date, source URL, original receipt and response SHA, raw/receipt references to the existing collector JSON, declared `THOUSAND_VND_PER_SHARE` (or explicit `UNKNOWN` with null unit proof/source → unqualified price), unit source and existing `Evidence`-shaped unit review pin. |
| `actions[]` | Unique event ID/ticker, kind, fiscal period, ex/record/effective date (unknown=null), original provider term and pin, separately reviewed official term/unit and pin, publication candidate and original retrieval/review timestamps. Empty means no terms selected, not certified no-actions coverage. |
| `actions[].official` | Same event ID/kind/period/dates; `definitionSource` points to that full reviewed record. `definitionLayout=RETAINED_REVIEW_V1` maps the existing S4 review keys; `NORMALIZED_EVENT_V1` uses interface field names. Both bind identity independently of amount equality. Capital actions found here are also routed into the existing share evaluator so an empty share-event list cannot hide them; an unresolved capital effective date blocks carry-forward. `reviewed` describes existing content review, not formal authority. Missing/unreviewed/unknown terms remain unqualified. |
| `shares` | Existing carry-forward evaluator's anchor/review objects, plus exact `anchorSource` and `reviewSource` references. Do not put synthetic source-authority claims in these objects. |
| `historicalCoverage` | `complete` plus explicit limitations when false. This cannot prove action continuity or PIT. |
| `sourceLocations[]` | Additional retained PDF/HTML/policy refs used in the review. Include every selected original source, not an inventory of unrelated files. |

A reference is `{path,sha256,pointer?,expected?}`: repository-relative retained file, exact bytes SHA-256, RFC6901 pointer to JSON, optional expected decoded value. Scalar official/provider term refs, raw price and share anchor/review refs require exact value matching. The price receipt must also replay the collector's original embedded response/hash and request symbol/exchange. Keep paths inside the repository. Do not copy private request headers, cookies or authentication metadata into prepared inputs.

`publication.kind` is one of `DATE_ONLY_CANDIDATE`, `TIMESTAMP_CANDIDATE`, `UPDATE_CLUE`, `MISSING`; all retain date/timestamp/timezone/evidence fields, with nulls preserved. A date-only candidate needs a valid date, timezone, null exact timestamp and source pin. Candidates/clues remain unqualified until the existing governed assessment accepts their source-role/publication/availability meaning. Notice dates and mirror dates are not automatically original-publication dates. Unit review Evidence uses the domain's canonical millisecond UTC compatibility representation; preserve original higher-precision receipt bytes separately, and never label the compatibility representation original publication.

## Output and failure semantics

`EVIDENCE.json`: `schemaVersion=vn30-s4-research-output-v1`, ticker, exchange, economic date and explicit review time; qualified raw close or null/reason; separate reconciled action terms and original conflicts; original retrieval/publication evidence; delegated share decision; source pins and limitations. Actions are sorted by stable event ID; object keys are recursively sorted; no current-clock or randomness enters output.

`ACCEPTANCE.json`: matching ticker/cutoff (synthetic sources are `SYNTHETIC_TEST_ONLY`, never proposed for real admission) and independent research/R1/R3/R4/formal/PIT conclusions. `formalAdmissionGranted=false`, `productionActivated=false`, `ownerApproval=null` are properties of this **offline execution**. `ownerAdmission=PENDING_EXPLICIT_OWNER_APPROVAL` is independent of economic evidence readiness. The VNM conditional-approval claim is superseded; no approved17-fact authorization is available. Never manufacture or infer a receipt.

Missing/invalid raw close or missing/conflicting official terms produce null selected values and `PARTIAL_NOT_QUALIFIED`. Source/hash/receipt/identity errors fail before output. Missing publication evidence does not invalidate supported retrospective economics, but never certifies formal/PIT eligibility. Corporate actions are not added to prices; no portfolio cash, share credit, return, score or investment recommendation is calculated.

Existing output bytes are immutable: identical replay is a no-op; changed output fails with `OUTPUT_CONFLICT_USE_NEW_REVIEW_DIRECTORY`. Use a new review directory for changed sources/inputs. Production `data/` output is forbidden.

## Formal acceptance is separate

The runner deliberately reports `NOT_ASSESSED_BY_OFFLINE_REVIEW` for formal use; it has no trusted authority/DB composition. A caller `formalApproved` flag cannot close it. To close F1, the actual retained-raw market capability and purpose/session binding must replay through `RetainedMarketAuthority` and `BoundaryLifecycle`. To close F2, the real selected cash/share Evidence must pass `validateEvidence::validateTime` with accepted source/publication/availability assessments and the correct later-knowledge run context. Do not equate economicAsOf with knownAt/fundamentalCutoff, or change an existing run's cutoff to make a test pass. Synthetic DATE_ONLY tests demonstrate contract support only; they do not admit real facts.

## Owner-decision provenance

Optional `ownerDecision` includes decision (`PROPOSED` or `EXPLICITLY_APPROVED`), ticker, cutoff, exact proposal reference and an authorization reference (null when absent). A proposed record, assistant-authored receipt, ambiguous recommendation, matching hash alone or claimed APPROVED status is not owner authorization. All refs remain subject to source-byte checks. The offline CLI installs no owner verifier and **always leaves admission pending**, even when a reference is provided; it cannot activate research/formal authority.

`owner-decision.ts::assessOwnerDecision` supports a separate trusted host's provenance check: require an independently verified original owner-authored APPROVE decision, exact proposal/ticker/cutoff/research purpose, nonempty owner identity, matching authorization reference and no supersession. The trusted host must resolve the exact proposal/fact scope from its independently held record, never from submitted PASS booleans or an agent-written summary. No such verifier/registry is installed by this skill. Synthetic unit fixtures demonstrate this distinction without granting any real VNM authorization. Even a separately verified research authorization never closes F1/F2 or activates production.
