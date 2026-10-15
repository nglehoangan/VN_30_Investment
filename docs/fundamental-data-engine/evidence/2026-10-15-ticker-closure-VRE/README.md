# VRE Level-1 evidence

B. VRE CONDITIONALLY CLOSED — ANALYTICAL GAPS CARRIED FORWARD

Read [FINAL_REVIEW.md](FINAL_REVIEW.md) for coverage, source boundaries, debt, gaps, cleanup and governance. This folder contains only VRE accounting evidence; shared runtime/tests do not combine ticker datasets.

Replay from repository root with Node22.23.2:

```sh
node scripts/verify-real-estate-ticker.mjs --ticker=VRE
```

`VRE_RETAINED_ADMISSION_INPUT.json` and `VRE_CANONICAL_FACTS.json` are the self-contained scoped input and expected canonical snapshot. All source bindings must physically exist. Producer regeneration uses retained review/debt JSON plus the immutable pre-closure structured input; `--out=/tmp/vre-review` prevents overwriting sealed evidence.

`VRE_SOURCE_MANIFEST.json` inventories originals and exclusions. `VRE_ISSUER_VERIFICATION.json` stores compact exact source cells, not disposable OCR. `VRE_REAL_ESTATE_METRICS.json` traces authority and category boundaries. Original and restated cells remain linked in `VRE_RESTATEMENT_REVIEW.json`.

No approval or investment decision is granted by this evidence.
