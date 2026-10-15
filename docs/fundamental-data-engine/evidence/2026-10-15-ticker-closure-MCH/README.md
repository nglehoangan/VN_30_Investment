# MCH independent closure evidence

B. MCH CONDITIONALLY CLOSED — ANALYTICAL GAPS CARRIED FORWARD

Read FINAL_REVIEW.md, MCH_FINAL_SUFFICIENCY.json and OPEN_ISSUES.json. Every accounting observation, source binding and verifier input in this folder is ticker-specific. Shared runtime/test code does not supply another issuer's canonical facts.

Offline replay (Node 22.23.2):

```sh
node scripts/verify-consumer-retail-ticker.mjs --ticker=MCH
node scripts/close-consumer-retail-ticker.mjs --ticker=MCH --out=/tmp/mch-closure-replay
```

ARTIFACT_HASHES.json seals this folder. INDEPENDENT_REPLAY.json records an independent software process, not independent human approval. Sources in data/ are intentionally ignored by this repository's existing policy and remain physically retained locally; a Git-only checkout does not include those original/raw bytes. The verifier fails if they are absent or changed.
