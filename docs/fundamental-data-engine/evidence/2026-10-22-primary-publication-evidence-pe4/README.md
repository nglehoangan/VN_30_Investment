# PE4 independent technical review

Read FINAL_REVIEW.md, FINAL_STATUS.json and OWNER_APPROVAL_REQUESTS.md. No AI/HUMAN approval or production authority is created.

Replay uses Python standard library, actual archived PDFs/HTML, immutable evidence packages and read-only SQLite. No OCR installation or temporary render files are required for evidence/hash/arithmetic replay. Fresh source-image reinspection can use macOS PDFKit with scripts/pe4-render-pdf.m and the PDF paths/page numbers/normalized top-left boxes in SOURCE_CELL_INDEPENDENT_REVIEW.json. Tesseract assists but is not substituted for conflicting source digits.

```sh
PYTHONDONTWRITEBYTECODE=1 python3 scripts/replay-pe4-evidence.py
PYTHONDONTWRITEBYTECODE=1 python3 scripts/test-pe4-evidence.py
```

The independent verifier imports no prior producer verifier. Its hash/evidence replay is distinct from new original-PDF visual observations and from independent human acceptance. Producer summaries/flags are not proof. Package inputs and scripts are pinned by ARTIFACT_HASHES.json; EVIDENCE_SEAL.json binds that inventory but is not an approval. Review-time observations are explicitly timestamped; replay and arithmetic outputs are deterministic for these pinned inputs. Preparation/finalization refuse to overwrite a sealed package. Full regeneration needs a new versioned review and fresh targeted PDF review inputs, not silent editing of sealed evidence.

The216 obligation rows remain distinct from the104 Vietstock document matches and45 archived technical mappings. Formal acceptance coverage remains0. Missing historical knowledge/cutoffs remain null.
