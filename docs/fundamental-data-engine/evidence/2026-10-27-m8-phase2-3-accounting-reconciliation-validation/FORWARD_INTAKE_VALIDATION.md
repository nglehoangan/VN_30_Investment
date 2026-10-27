# Forward intake validation

Date: 2026-10-27 (Asia/Ho_Chi_Minh). Phase 2.3 validation/reporting only. No production implementation, posting, migration or Phase 3 authorization.

Fresh suite validates explicit supported categories, strict opening instant, rejection of before/equal opening and date-only ambiguity, exact source/account/security identity and record/command content binding, knowledge/retrieval timing, cross-format/file/API-style repeats, existing-ledger duplicates, stable economic namespace/event/component/revision, CAS, concurrent imports, atomic batch rollback, audit failure, revalidation after authority revocation and immutable correction lineage.

Review reads ledger, economic registry and authority under one SQL snapshot; commit independently revalidates the plan inside revision claim. One all-or-nothing commit covers financial facts/legs, Phase2.1 receipt ownership and audit/identity rows. Duplicate variants retain original records. PARTIALbatch failure cannot report full success. Projection is explicitly NOT_REBUILT and actionabilityBlocked, so posted synthetic accounting is not current production readiness.

Unknown categories, ambiguous descriptions, unsupported actions, missing exact identity or absent real source authority remain blocked. No ticker+amount+date economic identity, invented timestamp or opening/lifetime rebase. Original opening cannot be reversed by intake. Unrecognized legacy economic identity causes NEEDS_REVIEW rather than guessing uniqueness. All original source records remain in returned outcomes.

Actual schema lacks prepared intake/settlement tables and real authenticated adapters are unconfigured. This phase did not install a provider, create a route, configure authority, post or migrate. Validation-only helpers/test configuration are inside the new evidence directory; approved application and original test suites unchanged.
