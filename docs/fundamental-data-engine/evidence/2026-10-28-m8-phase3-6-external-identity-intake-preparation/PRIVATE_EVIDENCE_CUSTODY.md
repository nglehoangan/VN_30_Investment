# Private evidence custody and public audit metadata

2026-10-28 · PREPARATION ONLY · NO REAL EVIDENCE INTAKE OR ACCEPTANCE

No private directory, storage provider, key, access grant or real custody reference is created now. This is a boundary design for a future authorized intake.

**Private custody** holds original unmodified broker bytes, full account/ownership identifiers, original document IDs that may encode personal data, actual storage locations, secure issuer correspondence and private reviewer access/audit. Keep it outside Git and outside public export/search paths. Use opaque filenames and a private index; do not rename originals in a way that destroys source provenance without retaining the original name privately. Credentials/tokens/cookies are never required evidence and must not be collected into a statement package.

**Public audit metadata** is a separately reviewed projection, not a copy of the private manifest. Whitelist opaque evidence ID, redacted account alias, safe document alias, general source type/schema, holdings checklist, non-sensitive scope, intake status/issues codes and permitted whole-document hashes. Exclude full account numbers, owner identifiers, original private document IDs/paths/URLs, private correspondence, raw statement contents and free-text disclosures. Whole-file hash is byte integrity, not issuer authenticity or account ownership. Never publish an unsalted hash of an account number as an identity solution.

A future private manifest may reference a document by its real ID; the original ID remains private. A public derivative uses an opaque alias and an authorized private lookup. Redaction produces new bytes and a separate hash. Preserve original and redacted hashes with a private transformation record; do not overwrite originals or describe a redacted hash as the original source hash.

Future custody controls: owner-authorized restricted access, encryption/secure backup under separately approved deployment controls, read-only verification copies, bounded logging of opaque IDs/reason codes, retention/restore checks and review of every export. No system or authentication provider is installed in this phase. No-login local app access and a broker login do not supply independent app authority or authenticated review.

Do not log unredacted document text, personal filenames, private paths, account-bearing API URLs, headers or payloads in exceptions/terminal transcripts. Unknown fields or errors go into issue codes; any private explanatory detail stays in the private index. New repository artifacts contain planning metadata only. Existing retained private data is not re-exported, duplicated or ingested here.
