# PE3 evidence replay

Review FINAL_REVIEW.md and FINAL_STATUS.json first. This is producer evidence, not independent acceptance.

Supported runtime: project Node 22.23.2; Python 3 standard library for replay (no network or OCR installation needed).

```sh
PYTHONDONTWRITEBYTECODE=1 python3 scripts/replay-pe3-evidence.py
PYTHONDONTWRITEBYTECODE=1 python3 scripts/test-pe3-evidence.py
```

Source-cell evidence points directly to the archived source PDF and physical page, with normalized top-left cell boxes where reproduced. Pending digit/box evidence remains explicit. SOURCE_CELL_TRANSCRIPTION.json contains only selected reviewed observations, not bulk OCR readers. The preparation script requires temporary PDFKit/Tesseract review inputs; it refuses to regenerate a sealed package. Do not re-extract or silently recreate removed data readers. Full producer regeneration requires a new versioned review package.

ARTIFACT_HASHES.json pins package files plus new script identities. EVIDENCE_SEAL.json pins that inventory; neither is an independent approval. Existing PE1/PE2 seals and all data remain unchanged.
