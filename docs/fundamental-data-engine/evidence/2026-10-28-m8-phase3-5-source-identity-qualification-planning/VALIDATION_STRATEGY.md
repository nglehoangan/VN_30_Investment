# Planned validation strategy

2026-10-28 · SOURCE_IDENTITY_QUALIFICATION_PLANNING_ONLY · DESIGN, NOT ACCEPTANCE

All20cases are **planned, not executed tests**. Proposed blocking labels are design names, not claims that a new resolver or acceptance service exists. Existing SliceA/Phase3.2test results are retained baseline evidence only and are not rerun or relabelled independent acceptance.

## IDV-01 — Exact broker account match

**Input:** Privately authenticated full account/owner/perimeter match with complete scoped independent review.

**Expected state:** QUALIFIED for account binding only.

**Reasons:** None for identity; NAV/publishing still independently denied.

**Evidence:** Original private account/ownership bytes and authorized decision/audit.

**Acceptance:** Exact full identifiers/ownership/scope and nootheraccount; no public secret disclosure.

## IDV-02 — Masked account ambiguity

**Input:** Onlylastfour/masked UIaccount and matchingbalances.

**Expected state:** UNRESOLVED.

**Reasons:** EXACT_PRIVATE_ACCOUNT_PROOF_MISSING.

**Evidence:** Full private brokeraccount/ownership/perimeter witness.

**Acceptance:** Mask/quantity/name equality cannot qualify.

## IDV-03 — Wrong portfolio identity

**Input:** Authentically reviewed source belongs to another portfolio.

**Expected state:** REJECTED exact candidate; otherwise UNRESOLVEDuntilreview.

**Reasons:** PORTFOLIO_ACCOUNT_SCOPE_MISMATCH.

**Evidence:** Private source/document/portfolio relation and rejectionprovenance.

**Acceptance:** No crossportfolio match or statepromotion.

## IDV-04 — Wrong economic perimeter

**Input:** Sameshortaccountlabel but different subaccount/margin/productscope.

**Expected state:** UNRESOLVED.

**Reasons:** ECONOMIC_PERIMETER_UNRESOLVED.

**Evidence:** Complete account/product/subaccount/currency and obligation scope.

**Acceptance:** Do not narrow perimeter to hide liability.

## IDV-05 — Valid security identity

**Input:** Unique account-linked stable IDs, correctvenue/class, datedcontinuity and genuineindependentreview.

**Expected state:** QUALIFIED for exact security relationship.

**Reasons:** None for identity, noNAVpublicationauthority.

**Evidence:** Ledger/account/master/namespace/interval/actionproof and scopeddecision.

**Acceptance:** Preserve ledgerID, oneexactmapping and all mandatoryproofs.

## IDV-06 — Ticker-only ambiguity

**Input:** MatchingFPTticker and quantity without stableaccountcode.

**Expected state:** OBSERVED only, relationship UNRESOLVED.

**Reasons:** TICKER_ONLY_NOT_IDENTITY_PROOF.

**Evidence:** Required account-specific stableinstrumentannex.

**Acceptance:** No symbol/name/amount heuristic promotion.

## IDV-07 — Conflicting ISIN

**Input:** Accountsource and master disagree onISIN.

**Expected state:** UNRESOLVED.

**Reasons:** IDENTITY_IDENTIFIER_CONFLICT.

**Evidence:** Both exact sourceversions and issuer/depository/broker adjudication.

**Acceptance:** No ignoringcontradiction or preferred-field override.

## IDV-08 — Provider code collision

**Input:** Same provider namespace/venue/class code resolves two instruments in overlap.

**Expected state:** UNRESOLVED.

**Reasons:** AMBIGUOUS_PROVIDER_IDENTITY.

**Evidence:** Both identifier/interval sources and complete heldscope.

**Acceptance:** Reject ambiguity; same numericcode acrossdifferent namespaces not falselyequated.

## IDV-09 — Ticker change

**Input:** Same legalinstrument with authenticated datedrenamenotice/continuity.

**Expected state:** QUALIFIED within acceptedintervals; otherwise MATCH_CANDIDATE.

**Reasons:** CONTINUITY_ACCEPTANCE_MISSING ifnotaccepted.

**Evidence:** Old/new symbol/code/ISINstatus and acceptedrenamenotice.

**Acceptance:** Original ledgerIDunchanged; noimplicitnewinstrumentmapping.

## IDV-10 — VN30 membership change

**Input:** Valid acceptedinstrument leaves index but remains held.

**Expected state:** QUALIFIED identity unchanged; membership separately updated.

**Reasons:** No identityblock frommembership alone; separatePRICE_COVERAGEgate ifmissing.

**Evidence:** Accepted identity plus separate membership intervalsource.

**Acceptance:** Never remove ownership or pricecoverage merelybecause it leavesVN30.

## IDV-11 — Corporate-action entitlement

**Input:** Exact action/allocation/account/security linkage and accepted eventstage.

**Expected state:** QUALIFIED for explicitlyproved entitlementstage only.

**Reasons:** No automaticavailabilityorvaluationgrant.

**Evidence:** Issuerterms, brokerallocation/recorddates/amounts/NETtaxbasis and reviewerreceipt.

**Acceptance:** Legal entitlement/economicownership/credit/tradability notconflated.

## IDV-12 — Pending-share ambiguity

**Input:** FPT200ordinary+20pending inside220, no credit/tradingdate witness.

**Expected state:** UNRESOLVED pending scope; ordinaryinstrument mayqualifyseparately.

**Reasons:** CORPORATE_ACTION_LIFECYCLE_UNQUALIFIED.

**Evidence:** Exact action/allocation/status/credit/availabilitywitness.

**Acceptance:** No20extraunits, guessedconversion orfullholdingNAV.

## IDV-13 — Duplicate economic ownership

**Input:** Two ledger/entitlementunits claim same overlapping economicinstrumentallocation.

**Expected state:** UNRESOLVED.

**Reasons:** DUPLICATE_ECONOMIC_OWNERSHIP.

**Evidence:** Exact units/allocations/inverseidentity and interval witnesses.

**Acceptance:** Reject doublevaluation; no merging financialfacts.

## IDV-14 — Source document revision

**Input:** New corrected document conflicts with acceptedoldversion.

**Expected state:** UNRESOLVED effectiveuse until reviewed; newcandidateversion.

**Reasons:** SOURCE_REVISION_CONFLICT.

**Evidence:** Both original hashes, explicit correction/supersession scope and review.

**Acceptance:** No overwriting originalseal or latestwins.

## IDV-15 — Revoked identity mapping

**Input:** Genuine scopedrevocation event for previouslyqualifiedmapping.

**Expected state:** REVOKED.

**Reasons:** IDENTITY_ACCEPTANCE_REVOKED.

**Evidence:** Prioracceptedsubject and authentic currentrevocation/audithead.

**Acceptance:** Denyall affecteduse, preserveaudit; no sameversionresurrection.

## IDV-16 — Future-dated evidence

**Input:** Evidence knownafterK or relation effectivestartsafterrequestedT.

**Expected state:** UNRESOLVED for requestedT/K.

**Reasons:** FUTURE_OR_OUT_OF_SCOPE_IDENTITY.

**Evidence:** Actual economic/publication/retrieval/knowledge/decisiontimes.

**Acceptance:** No backdating, listingdate or filemtime substitute.

## IDV-17 — Missing independent reviewer

**Input:** Technicalmatchcomplete but no authenticatedproducer-distinctdecision.

**Expected state:** MATCH_CANDIDATE only.

**Reasons:** INDEPENDENT_IDENTITY_ACCEPTANCE_MISSING.

**Evidence:** Distinctperson/role/audit and exactacceptedsubject.

**Acceptance:** Never QUALIFIEDfromtechnicalPASS.

## IDV-18 — Synthetic approval attempt

**Input:** LocalJSONacceptedtrue or testverifier claimingrealidentityauthority.

**Expected state:** MATCH_CANDIDATE atmost iffactsvalid; acceptanceblocked.

**Reasons:** SYNTHETIC_OR_UNSIGNED_AUTHORITY_REJECTED.

**Evidence:** Real reviewed trustanchor/role/decision evidence, notfixture.

**Acceptance:** No identityassignment or operationalrights fromsyntheticdata.

## IDV-19 — Cross-account contamination

**Input:** Mixed sourcedocuments forOWNER_ACCOUNT_Aanddifferentprivateaccount.

**Expected state:** UNRESOLVED.

**Reasons:** CROSS_ACCOUNT_EVIDENCE_CONTAMINATION.

**Evidence:** Private exact account proofs and per-document scopedbinding.

**Acceptance:** No same-symbol/ISINcash/share blending acrossaccounts.

## IDV-20 — Qualified identity without publication

**Input:** Exact identityrelationship genuinelyqualified but noNAVpublication/release decision.

**Expected state:** QUALIFIED identity only; publication DENY.

**Reasons:** NAV_PUBLICATION_NOT_AUTHORIZED / M7_RELEASE_RESTRICTED.

**Evidence:** Identityreceipt plus separatelymissingpublication/releaseauthority.

**Acceptance:** Identitystate cannot flipV1falsepermissions orpermitmetrics/scoring.

Future sequence: contract/schema/unit tests on isolated synthetic fixtures; bounded private evidence/pointer/hash tests; interval/duplicate/reuse/CAnegative tests; explicit fixture-authority rejection and privacy(log/path/redaction) tests; controlled producer-distinct review/reproduction once real trust/evidence prerequisites exist. No operational production tests now. Qualifiedfixturecases require hypothetical authenticreview infrastructure for future contract validation; no such reviewer/decision is created here.

Preserve request/result/Bridge contracts, frozen policies and legacy accounting gates. Future acceptance evidence must record exact source/code/schema/methodology/test versions and expected/actual outcomes, but success on these cases cannot substitute for externalsourcefacts or authenticated source/identity acceptance.
