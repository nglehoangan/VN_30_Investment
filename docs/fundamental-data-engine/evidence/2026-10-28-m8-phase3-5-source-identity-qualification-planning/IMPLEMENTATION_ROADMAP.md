# Minimum future implementation roadmap

2026-10-28 · SOURCE_IDENTITY_QUALIFICATION_PLANNING_ONLY · DESIGN, NOT ACCEPTANCE

Sequence below separates contracts, candidate matching, provenance, entitlement, trust, independent review and NAVconsumption. No step begins in Phase3.5. No new database/provider/ledger/calculator is recommended merely to represent this plan.

## A — Identity contract finalization

**Dependencies:** Owner approves scoped fields/state/privacy/interval and compatibility decisions.

**External evidence:** Exact sourcecapability constraints fromGAP01–03and brokerresponse where available.

**Potential code:** Future versioned identitysubject/evidence/decision DTOproposal only; no mutations toBridge orSliceAcontracts without review.

**Tests:** Schema/privacy/state-transition and intervalcases.

**Safety:** No acceptance/store/operationalpermissions fromcontract.

**Owner gate:** Separate explicit owner authorization to implementcontractonly.

## B — Read-only identity matching

**Dependencies:** A; exact privateaccount and all11stableanchors; GAP02/03/08.

**External evidence:** Broker annex and relevantnamespace/lifecyclewitnesses.

**Potential code:** Future bounded purecandidate matcher using existingBridgevalidators and SliceAread capabilities.

**Tests:** Exactmatch/ticker-only/collision/rename/membership/duplicate negatives.

**Safety:** Candidatesonly; no realqualifiedresolver orledgerrewrite.

**Owner gate:** Owner authorizes exact read-onlymatching slice; evidenceacquisition separatelyauthorized.

## C — Evidence provenance verification

**Dependencies:** A/B; approvedprivate-source handling and accesscontrols.

**External evidence:** Original bytes, issuer/account/document identity, actualtime/pointer chain.

**Potential code:** Future byte/provenance adapter reusing bounded reader; originalsource decoder separatelyapproved.

**Tests:** Hash/path/encoding/duplicate/future/account/chain/redaction tests.

**Safety:** No financialinterpretation ortrustedknowledge fromhashalone.

**Owner gate:** Owner authorizes provenance/decoderfiles and exact sourcecontract.

## D — Corporate-action identity handling

**Dependencies:** A–C; GAP03/04/05relevant exact records.

**External evidence:** Issuer/brokerentitlement/allocation/receipt/credit/availability timeline.

**Potential code:** Future identity/link/partition checks only, reuse existingaccounting rules.

**Tests:** Pending/split/rights/claim/duplicateunit/stage tests.

**Safety:** No newCApostings, unsupportedaccountingtypes orconversiondate guesses.

**Owner gate:** Owner authorizes specificCAscope; financialposting separate.

## E — Authenticated acceptance integration

**Dependencies:** Approvedtrustarchitecture; no-login deferral unchanged until separatelyamended; GAP09.

**External evidence:** Real role/identity/trustanchor/revocation/audit/clock/restore proofs.

**Potential code:** Future trusted verifier/projection, append-onlydecision mechanism only afterdesignapproval.

**Tests:** Authenticity/scope/expiry/revocation/supersession/self-review/synthetic rejection.

**Safety:** No OS/JSON/Codexsubstitute; no providerinstallednow.

**Owner gate:** Owner separately approves mechanism/configuration and implementation; planningapproval notenough.

## F — Independent validation

**Dependencies:** A–Eand complete exactscope evidence.

**External evidence:** Genuinelydistinctauthorized reviewer and retainedreview/audit records.

**Potential code:** Future validation harness/evidence export asauthorized; reviewerdecisionexternallyauthenticated.

**Tests:** Reproduce wholeboundsubject and20plannedcases; privateoriginal and redactedsummaryconsistency.

**Safety:** Implementer testPASS cannotself-approve orgrantrelease.

**Owner gate:** Owner commissions separateindependentreview; actualdecision scope remainsnarrow.

## G — Current NAV input-provider integration

**Dependencies:** Allidentity/CAdecisions current plus separateaccounting/price/calendar/independentNAV prerequisites.

**External evidence:** Exact acceptedinputs, completeness/reconciliation and pricepurpose scope; B2–B7notwaived.

**Potential code:** Future adapter consumes qualifiedreferences viaapprovedports; do not changeSliceAloadnulluntilseparatelyauthorized.

**Tests:** ExistingNAVregressions plus identity/head/revocation/partialinput/end-to-end negatives.

**Safety:** No productionroute/dashboard/scoring/snapshot/release fromidentityqualification.

**Owner gate:** Owner authorizes separateintegration and publication/release decisions; no automatic nextmilestone.

The smallest immediate external action is the shared privatebrokerpackage, not coding another matcher against incompletefacts. Existing SliceAcan remain useful for inspection while typedBLOCKED. If sourcefacts or realreview infrastructure remain unavailable, stop with explicit gaps rather than expanding scope or installingauthentication. No productionmigration, NAVpublication, historicalNAVimplementation or milestoneadvancement is authorized.
