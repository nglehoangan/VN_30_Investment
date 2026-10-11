# Independent architecture and governance review

Reviewed by a separate architecture/governance agent on 2026-10-14. This review inspected the implementation and retained closure evidence; it does not grant DI14 or DI15 approval.

Recommended verdict: **C. BLOCKED — MATERIAL DATA GAPS REMAIN**.

The source policy correctly makes CafeF the primary structured ingestion source. Qualified issuer statements and audited/reviewed PDFs retain verification, fallback and conflict-resolution authority. Provider Detail/Summary agreement explicitly does not establish independent verification. The previous commit's accounting-authority wording is not the operative policy.

DIRECT_STRUCTURED still requires an exact-record certificate. The loader issues none because retained evidence does not prove statement identity, scope, unit, calendar and revision for those records. STRUCTURED_CERTIFICATION_REPORT.json records candidate-specific noncertification reasons. This is an explicit fail-closed outcome, not completed structured coverage. No certificate requirement was waived.

The present target calendar retains FY2022–FY2025 and H1 2026 for every symbol. It uses the existing 60-day quarterly grace in the approved manual evidence requirements, rather than the latest period offered by the provider. Consequently missing current YTD evidence remains an obligation. Recorded CORE coverage is 250/750 (33.33%) and SECTOR_CORE coverage is 90/365 (24.66%); neither reaches 95%. Sixteen required CORE cells remain classified as conflicts. These are material blockers.

The Prisma admission repository appends a new immutable run, preserves the prior manual snapshot reference, rejects differing reuse of a run ID and checks stored body integrity. Production promotion remains blocked and the dashboard retains its prior manual read model. DATABASE_PRESERVATION.json reports unchanged hashes for existing databases. This review does not claim a promoted production read model.

The snapshot, financial bridge and sufficiency rows retain readyForScoring=false. DI14 remains AWAITING_INDEPENDENT_REVIEW and DI15 remains AWAITING_PROJECT_OWNER_APPROVAL. The closure evidence records officialScoringExecuted=false. No new official scoring, ranking, Top 10 or investment decision is authorized by this review.

Certificate-format ambiguity resolved on re-review: STRUCTURED_CERTIFICATE_FORMAT.md defines a separate retained canonical body excluding certificateHash, and an in-memory envelope adding its digest. This makes body/file digest binding satisfiable without circular hashing. The verifier positively admits one synthetic certified candidate with a matching trusted body binding, rejects unbound and malformed certificates, and confirms production certificates remain zero. This proves the domain admission contract; it does not demonstrate physical ingestion or independent qualification of a real retained certificate. Future actual certificate ingestion and independently reviewed attestations remain deferred.

Critical admission blockers: production coverage below threshold and unresolved required CORE conflicts. Major blockers: absent exact-record structured certification, missing current and sector issuer evidence, incomplete historical publication/revision proof and blocked read-model promotion. The previously raised certificate-envelope ambiguity is resolved and is no longer an additional implementation issue. The original full migration prompt is not retained; the phase audit therefore cannot certify obligations beyond the current explicit instructions and repository evidence.

Independent verification command: `/private/tmp/node-v22.23.2-darwin-arm64/bin/node scripts/verify-cafef-production-admission.mjs` exited 0: PASS, 17 regressions, 826 source bindings. An initial attempt with the host Node v22.12.0 exited 1 because node:module.registerHooks is unavailable in that runtime; it was retried with the closure's compatible Node runtime.

Accepting the structured-first architecture as a design does not justify production admission. Maintain the blocked promotion and reserved DI gates until qualified evidence closes the measured gaps.
