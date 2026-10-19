"""Verify complete physical coverage and every mapped amount's lexical lineage."""
import gzip
import hashlib
import json
import os
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent / "lib"))
from manual_display import normalize_number

ROOT = pathlib.Path(__file__).resolve().parents[1]
BASE = ROOT / os.environ.get("VN30_PDF_EXTRACT_ROOT", "data/manual-extracted-pdf")
SOURCE = ROOT / os.environ.get("VN30_PDF_SOURCE_ROOT", "data/manual-download")


def load(path):
    data = path.read_bytes()
    return json.loads(gzip.decompress(data) if path.suffix == ".gz" else data)


def pointer(value, path):
    for part in path.lstrip("/").split("/"):
        key = part.replace("~1", "/").replace("~0", "~")
        value = value[int(key)] if isinstance(value, list) else value[key]
    return value


def main():
    manifest = load(BASE / "display-manifest.json")
    raw_manifest = load(BASE / "manifest.json")
    assert manifest["completeRawInventory"] and raw_manifest["complete"]
    files = sorted(SOURCE.rglob("*.pdf"))
    sources = {path: d for d in raw_manifest["documents"] for path in d["retainedPaths"]}
    assert len(files) == len(sources) == raw_manifest["physicalPdfCount"]
    for path in files:
        assert hashlib.sha256(path.read_bytes()).hexdigest() == sources[str(path.relative_to(ROOT))]["sourceHash"]
    checked = missing = ambiguous = 0
    source_count = set()
    for item in manifest["files"]:
        path = BASE / item["file"]
        assert hashlib.sha256(path.read_bytes()).hexdigest() == item["sha256"]
        data = load(path)
        assert data["productionAdmissible"] is False
        cache = {}
        for document in data["documents"]:
            source_count.add(document["sourceHash"])
            raw_path = ROOT / document["rawDocumentPath"]
            assert hashlib.sha256(raw_path.read_bytes()).hexdigest() == document["rawDocumentHash"]
            raw = load(raw_path)
            assert len(raw["pages"]) == document["pageCount"]
            assert [page["page"] for page in raw["pages"]] == list(range(1, len(raw["pages"])+1))
        for report in data["reports"].values():
            for period_key, period in report["periods"].items():
                for variant in period["variants"]:
                    assert variant["periodKey"] == period_key
                    assert variant["productionAdmissible"] is False
                    for group in variant["groups"]:
                        assert len({row["id"] for row in group["rows"]}) == len(group["rows"])
                        for row in group["rows"]:
                            evidence = row["cellEvidence"]
                            if evidence["path"] not in cache:
                                target = ROOT / evidence["path"]
                                assert hashlib.sha256(target.read_bytes()).hexdigest() == evidence["sha256"]
                                cache[evidence["path"]] = load(target)
                            raw = cache[evidence["path"]]
                            strings = [pointer(raw, locator) for locator in evidence["jsonPointers"]]
                            if row["lexicalValue"] is not None:
                                assert any(row["lexicalValue"] in text for text in strings), row
                                assert normalize_number(row["lexicalValue"]) == (row["value"], row["status"])
                            else:
                                assert row["value"] is None
                                missing += 1
                            caption = row["captionEvidence"]
                            if caption["path"] not in cache:
                                target = ROOT / caption["path"]
                                assert hashlib.sha256(target.read_bytes()).hexdigest() == caption["sha256"]
                                cache[caption["path"]] = load(target)
                            caption_tokens = [pointer(cache[caption["path"]], locator) for locator in caption["jsonPointers"]]
                            assert (" ".join(caption_tokens) or None) == row["label"]
                            ambiguous += row["status"].startswith("AMBIGUOUS")
                            checked += 1
    assert len(source_count) == raw_manifest["uniquePdfCount"]
    result = {"status": "PASS_LEXICAL_LINEAGE_AND_COVERAGE", "physicalPdfs": len(files),
              "uniquePdfs": len(source_count), "tickers": len(manifest["files"]), "verifiedCells": checked,
              "missingOrAmbiguousCellPositions": missing, "ambiguousCells": ambiguous,
              "semanticReview": "NOT_PERFORMED_BY_THIS_VERIFIER"}
    (BASE / "verification.json").write_text(json.dumps(result, indent=2)+"\n")
    print(json.dumps(result))


if __name__ == "__main__":
    main()
