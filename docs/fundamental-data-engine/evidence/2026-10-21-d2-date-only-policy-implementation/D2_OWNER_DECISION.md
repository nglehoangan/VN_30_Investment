# D2 Owner decision — policy semantics and implementation only

Source: explicit Owner session instruction dated2026-10-21, “D2 Conservative DATE_ONLY Availability: APPROVED.”

Approval scope: **policy semantics and implementation only**. **Production activation NOT APPROVED.** This records the Owner's instruction in review evidence; it does not register or activate a production methodology/authority or approve source facts.

Owner-approved semantics:

1. DATE_ONLY requires verified authoritative issuer/exchange public disclosure, exact source-to-document identity and immutable evidence binding.
2. Preserve original precision; publishedAt remains null if exact time is unknown. DATE_ONLY is never interpreted as an actual publication timestamp.
3. Timezone Asia/Ho_Chi_Minh. Conservative boundary is00:00 at the beginning of the next local calendar day, represented as17:00Z on the original date (UTC+7).
4. effectiveKnownAt is the maximum of publication boundary, retrieval, ingestion, verification, mapping knowledge, methodology knowledge and every other applicable required contract boundary. Missing required knowledge evidence blocks; never backdate availability or use future information at an earlier AS_KNOWN cutoff.
5. Preserve verified exact timestamp behavior. Never admit unverified VHM publication leads.
6. Do not activate D2/runtime authorities, execute MARKET CAS, create scorecards/rankings, transactions or orders.

Policy candidate identity: `d2-conservative-date-only-availability-v1`; version `1.0.0`.
Canonical JSON SHA256: `1738c2b0f46dfb618fe51aceaa002bd2bc55db182837dc72ee0d6b1b346eafad`.
Exact policy file SHA256: `8df67c1052eb71ca1da57651119d3de508e2e0c0c3a5fc350315ccacb9afd7b0` (source and evidence copy are byte-identical).

Implementation candidate identity: `d2-conservative-date-only-implementation-v1`; version `1.0.0`.
Implementation manifest canonical content SHA256: `7405b633a7cea0777e180588469a444de6a61c4382118c02d4b02e04ee827f97` (hash excludes its own contentHash field).
Exact source/test file hashes are bound by D2_IMPLEMENTATION_MANIFEST.json. These hashes describe reviewed implementation artifacts, not activation approval or source admission.

Policy approval does not approve a metadata source, identity relationship, financial mapping, accounting fact, normalization or dataset. PinnedD2Availability requires separately approved exact source-publication and source-identity bindings, reads/re-hashes actual configured document/metadata/observation/knowledge bytes, and emits candidate evidence only. No caller-supplied identity or approval flag creates trust. No approved production binding or admission receipt is generated.

Independent CIO review must assess these exact artifacts and tests. Any subsequent active runtime integration/authority version/effectivity and actual source qualification need their own concrete review; no blank future hash is approved here.
