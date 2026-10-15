# VHM Level-1 evidence

B. VHM CONDITIONALLY CLOSED — ANALYTICAL GAPS CARRIED FORWARD

Read [FINAL_REVIEW.md](FINAL_REVIEW.md) for coverage, source boundaries, debt, gaps, cleanup and governance. This folder contains only VHM accounting evidence; shared runtime/tests do not combine ticker datasets.

Replay from repository root with Node22.23.2:

```sh
node scripts/verify-real-estate-ticker.mjs --ticker=VHM
```

`VHM_RETAINED_ADMISSION_INPUT.json` and `VHM_CANONICAL_FACTS.json` are the self-contained scoped input and expected canonical snapshot. All source bindings must physically exist. Producer regeneration uses retained review/debt JSON plus the immutable pre-closure structured input; `--out=/tmp/vhm-review` prevents overwriting sealed evidence.

`VHM_SOURCE_MANIFEST.json` inventories originals and exclusions. `VHM_ISSUER_VERIFICATION.json` stores compact exact source cells, not disposable OCR. `VHM_REAL_ESTATE_METRICS.json` traces authority and category boundaries. Original and restated cells remain linked in `VHM_RESTATEMENT_REVIEW.json`.

No approval or investment decision is granted by this evidence.
