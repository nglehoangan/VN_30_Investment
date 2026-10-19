"""Create website-shaped per-ticker JSON from retained PDF page readers."""
import argparse
import gzip
import hashlib
import json
import os
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent / "lib"))
from manual_display import REPORTS, classify_page, extract_table, fold

ROOT = pathlib.Path(__file__).resolve().parents[1]
BASE = ROOT / os.environ.get("VN30_PDF_EXTRACT_ROOT", "data/manual-extracted-pdf")
SOURCE = ROOT / os.environ.get("VN30_PDF_SOURCE_ROOT", "data/manual-download")


def load(path):
    data = path.read_bytes()
    return json.loads(gzip.decompress(data) if path.suffix == ".gz" else data)


def sha(data):
    return hashlib.sha256(data).hexdigest()


def words_for_page(page, reader_cache):
    if "words" in page:
        return page["words"]
    path = page.get("readerPath")
    if path is None:
        return []
    if path not in reader_cache:
        target = ROOT / path
        assert sha(target.read_bytes()) == page["readerHash"], "READER_HASH_MISMATCH"
        reader_cache[path] = load(target)
    return reader_cache[path].get(page["readerPass"], [])


def enrich_missing_labels(tables, independent, page):
    """A second reader may supply a missing caption only for an exact amount
    on the same physical row. Keep its separate caption provenance explicit.
    """
    for table in tables:
        peers = next((t for t in independent if t["column"] == table["column"]), None)
        if peers is None:
            continue
        for row in table["rows"]:
            if row["value"] is None or not row["boxes"]:
                continue
            y = sum(b["y"]+b["height"]/2 for b in row["boxes"])/len(row["boxes"])
            matches = [r for r in peers["rows"] if r["value"] == row["value"] and r["label"] and r["boxes"]
                       and (not row["code"] or not r["code"] or row["code"] == r["code"])
                       and abs(sum(b["y"]+b["height"]/2 for b in r["boxes"])/len(r["boxes"])-y) < .012]
            if len(matches) != 1:
                continue
            peer = matches[0]
            row["independentCaptionCandidate"] = peer["label"]
            if row["label"] is None:
                row["label"] = peer["label"]
                row["captionBoxes"] = peer["captionBoxes"]
                row["captionWordIndices"] = peer["captionWordIndices"]
                row["labelStatus"] = "INDEPENDENT_READER_CANDIDATE"
                row["captionEvidence"] = {"path": page["readerPath"], "sha256": page["readerHash"], "readerPass": "passB",
                                          "jsonPointers": [f"/passB/{index}/text" for index in peer["captionWordIndices"]]}


def build(documents, snapshot):
    identities = {s["SHA256"]: s for s in snapshot["statements"]}
    reviewed = {}
    for item in snapshot["canonicalFacts"]:
        for fact in item["facts"]:
            reviewed.setdefault(fact["sourceHash"], []).append(fact)
    tickers = {}
    statistics = {"documents": 0, "pages": 0, "pagesWithTables": 0, "tableColumns": 0,
                  "rows": 0, "unresolvedPeriodColumns": 0, "missingLabels": 0,
                  "readErrors": 0, "emptyPages": 0, "primaryReports": {key: 0 for key in list(REPORTS)[:3]}}
    document_inventory = []
    for document in sorted(documents, key=lambda d:(d["ticker"], d["sourceHash"])):
        path = ROOT / document["rawDocumentPath"]
        assert sha(path.read_bytes()) == document["rawDocumentHash"], "RAW_DOCUMENT_HASH_MISMATCH"
        raw = load(path)
        ticker, source_hash = document["ticker"], document["sourceHash"]
        identity = identities.get(source_hash)
        result = tickers.setdefault(ticker, {
            "schemaVersion": "manual-display-v1", "ticker": ticker,
            "status": "PDF_EXTRACTION_CANDIDATE", "productionAdmissible": False,
            "reports": {key: {"key": key, "label": label, "periods": {}} for key, label in REPORTS.items()},
            "documents": [],
        })
        inventory = {"sourceHash": source_hash, "retainedPaths": document["retainedPaths"],
                     "rawDocumentPath": document["rawDocumentPath"], "rawDocumentHash": document["rawDocumentHash"],
                     "pageCount": len(raw["pages"]), "identity": identity,
                     "identityStatus": "EXISTING_HASH_BOUND_REVIEW" if identity else "UNREVIEWED_DOCUMENT",
                     "filenameHints": {"ticker": ticker,
                                       "years": sorted(set(re.findall(r"(?:19|20)\d{2}", document["retainedPaths"][0]))),
                                       "authority": False},
                     "pages": [], "reviewedFacts": reviewed.get(source_hash, [])}
        variants = {}
        reader_cache = {}
        primary_found = set()
        previous_report, previous_scope = None, None
        for page in raw["pages"]:
            statistics["pages"] += 1
            words = words_for_page(page, reader_cache)
            report, title = classify_page(words)
            header_folded = fold(title)
            page_scope = "CONSOLIDATED" if re.search(r"hop nhat|consolidated", header_folded) else "STANDALONE" if re.search(r"rieng le|standalone|separate financial", header_folded) else None
            tables = extract_table(words, identity, report or "bao-cao-bo-sung") if words else []
            classification_method = "PAGE_HEADING" if report else "UNCLASSIFIED"
            if (report is None and tables and previous_report in list(REPORTS)[:3]
                    and re.search(r"chi tieu|thuyet minh|ma thuyet|ma so|tai ngay", header_folded)):
                report = previous_report
                page_scope = page_scope or previous_scope
                classification_method = "TABLE_CONTINUATION_CANDIDATE"
                tables = extract_table(words, identity, report)
            if page.get("readerPath") and page.get("readerPass") == "passA":
                reader = reader_cache.get(page["readerPath"], {})
                if reader.get("passB") and report in list(REPORTS)[:3]:
                    independent = extract_table(reader["passB"], identity, report)
                    enrich_missing_labels(tables, independent, page)
            if report:
                previous_report = report
                previous_scope = page_scope or (identity["reportingScope"] if identity else None)
            # Keep every page discoverable, including narrative-only/blank/error pages.
            inventory["pages"].append({"page": page["page"], "status": page["status"],
                                       "method": page["method"], "reportKey": report,
                                       "reportClassification": classification_method, "scopeCandidate": page_scope,
                                       "tableColumns": len(tables), "rawLocator": f"/pages/{page['page']-1}",
                                       "readerPath": page.get("readerPath"), "titleCandidate": title[:1200]})
            if page["status"] == "READ_ERROR":
                statistics["readErrors"] += 1
            if not words:
                statistics["emptyPages"] += 1
            if not tables:
                continue
            statistics["pagesWithTables"] += 1
            report = report or "bao-cao-bo-sung"
            if report in statistics["primaryReports"]:
                primary_found.add(report)
                statistics["primaryReports"][report] += 1
            for table in tables:
                statistics["tableColumns"] += 1
                dimension = table["period"]
                period_key = dimension["periodKey"]
                if period_key.startswith("UNRESOLVED"):
                    statistics["unresolvedPeriodColumns"] += 1
                period = result["reports"][report]["periods"].setdefault(period_key, {
                    "year": dimension["year"], "quarter": dimension["quarter"], "asOf": dimension["asOf"],
                    "periodType": dimension["periodType"], "variants": [],
                })
                scope = page_scope or (identity["reportingScope"] if identity else None)
                variant_key = (report, period_key, table["column"], scope)
                if variant_key not in variants:
                    variant = {"id": sha(f"{source_hash}:{report}:{period_key}:{table['column']}:{scope}".encode()),
                               "periodKey": period_key, "year": dimension["year"], "quarter": dimension["quarter"],
                               "periodType": dimension["periodType"], "asOf": dimension["asOf"], "label": dimension["label"],
                               "status": "EXTRACTION_CANDIDATE_REVIEW_REQUIRED", "productionAdmissible": False,
                               "reportingScope": scope,
                               "scopeStatus": "PAGE_HEADING_CANDIDATE" if page_scope else "DOCUMENT_REVIEW" if identity else "UNKNOWN",
                               "source": {"provider": "MANUAL_PDF", "payloadHash": source_hash,
                                          "retainedPath": document["retainedPaths"][0],
                                          "rawPayloadLocation": document["rawDocumentPath"],
                                          "rawPayloadHash": document["rawDocumentHash"]}, "groups": []}
                    variants[variant_key] = variant
                    period["variants"].append(variant)
                variant = variants[variant_key]
                rows = []
                for row in table["rows"]:
                    statistics["rows"] += 1
                    statistics["missingLabels"] += row["label"] is None
                    # Raw code may repeat across statement pages; preserve occurrence.
                    percent = (row["lexicalValue"] or "").endswith("%")
                    per_share = bool(re.search(r"tren (?:mot )?co phieu|per share|\beps\b", fold(row["label"] or "")))
                    evidence_path = page.get("readerPath", document["rawDocumentPath"])
                    evidence_hash = page.get("readerHash", document["rawDocumentHash"])
                    pointers = [(f"/{page['readerPass']}/{index}/text" if page.get("readerPath")
                                 else f"/pages/{page['page']-1}/words/{index}/text") for index in row["readerWordIndices"]]
                    caption_pointers = [(f"/{page['readerPass']}/{index}/text" if page.get("readerPath")
                                         else f"/pages/{page['page']-1}/words/{index}/text") for index in row["captionWordIndices"]]
                    rows.append({"id": f"p{page['page']}:r{row['order']}:{row['code'] or 'uncoded'}",
                                 **row, "duplicateTemplateCode": False,
                                 "codeStatus": "GEOMETRY_CANDIDATE" if row["code"] else "UNAVAILABLE",
                                 "extractionMethod": page["method"], "reviewStatus": "UNREVIEWED",
                                 "rawLocator": f"/pages/{page['page']-1}",
                                 "cellEvidence": {"path": evidence_path, "sha256": evidence_hash,
                                                  "jsonPointers": pointers, "selection": "NUMERIC_TOKEN_WITHIN_READER_BOX"},
                                 "captionEvidence": row.get("captionEvidence", {"path": evidence_path, "sha256": evidence_hash,
                                                                               "jsonPointers": caption_pointers}),
                                 "sourcePage": page["page"], "readerPath": page.get("readerPath"),
                                 "readerHash": page.get("readerHash"), "readerPass": page.get("readerPass", "words"),
                                 "unit": "PERCENT" if percent else "PER_SHARE_UNIT_UNRESOLVED" if per_share else "UNRESOLVED_ROW_UNIT" if row["label"] is None else table["unit"]["unit"],
                                 "currency": None if percent else table["unit"]["currency"],
                                 "scale": "1" if percent else None if per_share or row["label"] is None else table["unit"]["scale"]})
                counts = {}
                for row in rows:
                    if row["code"]:
                        counts[row["code"]] = counts.get(row["code"], 0)+1
                for row in rows:
                    row["duplicateTemplateCode"] = bool(row["code"] and counts[row["code"]] > 1)
                variant["groups"].append({"id": f"page-{page['page']}",
                                           "label": f"{REPORTS[report]} · Trang {page['page']}",
                                           "order": page["page"]-1, "sourcePage": page["page"],
                                           "reportClassification": classification_method,
                                           "columnHeader": dimension, "unitEvidence": table["unit"],
                                           "rows": rows, "unmappedCells": []})
        inventory["primaryReportsFound"] = sorted(primary_found)
        inventory["primaryReportsMissing"] = [key for key in list(REPORTS)[:3] if key not in primary_found]
        inventory["status"] = "READ_ERROR" if document["errors"] else "RAW_READ_COMPLETE_TABLES_REQUIRE_REVIEW"
        result["documents"].append(inventory)
        document_inventory.append({"ticker": ticker, **{k:inventory[k] for k in ["sourceHash", "retainedPaths", "pageCount", "primaryReportsFound", "primaryReportsMissing", "status"]}})
        statistics["documents"] += 1
        print(json.dumps({"mappedDocuments": statistics["documents"], "ticker": ticker, "rows": statistics["rows"]}), flush=True)
    for result in tickers.values():
        for report in result["reports"].values():
            variants = [v for p in report["periods"].values() for v in p["variants"]]
            rows = [row for v in variants for g in v["groups"] for row in g["rows"]]
            report["summary"] = {"periods":len(report["periods"]), "variants":len(variants), "cells":len(rows),
                                 "missingLabels":sum(row["label"] is None for row in rows),
                                 "ambiguousCells":sum(row["status"].startswith("AMBIGUOUS") for row in rows),
                                 "unresolvedPeriods":sum(key.startswith("UNRESOLVED") for key in report["periods"])}
    return tickers, statistics, document_inventory


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--preview", action="store_true")
    args = parser.parse_args()
    manifest = load(BASE / "manifest.json")
    if not args.preview:
        assert manifest["complete"], "RAW_EXTRACTION_NOT_COMPLETE"
        physical = sorted(SOURCE.rglob("*.pdf"))
        expected = {path: d["sourceHash"] for d in manifest["documents"] for path in d["retainedPaths"]}
        assert len(physical) == manifest["physicalPdfCount"] == len(expected), "CORPUS_INVENTORY_CHANGED"
        for path in physical:
            assert sha(path.read_bytes()) == expected[str(path.relative_to(ROOT))], "PDF_HASH_MISMATCH"
    snapshot_path = ROOT / os.environ.get("VN30_PDF_IDENTITY_INPUT", "docs/fundamental-data-engine/rebuild-2026-10-19/pdf-identity-input.json")
    snapshot = load(snapshot_path) if snapshot_path.exists() else {"statements": [], "canonicalFacts": []}
    tickers, statistics, documents = build(manifest["documents"], snapshot)
    output = BASE / "preview" if args.preview else BASE
    output.mkdir(parents=True, exist_ok=True)
    files = []
    for ticker, result in sorted(tickers.items()):
        path = output / f"{ticker}.json"
        path.write_text(json.dumps(result, ensure_ascii=False, indent=2)+"\n")
        files.append({"ticker": ticker, "file": path.name, "sha256": sha(path.read_bytes()),
                      "reports": [{"key":r["key"], "label":r["label"], **r["summary"]} for r in result["reports"].values()]})
    report = {"schemaVersion": "manual-display-v1", "completeRawInventory": manifest["complete"],
              "status": "EXTRACTION_CANDIDATE_REVIEW_REQUIRED", "productionAdmissible": False,
              "statistics": statistics, "files": files, "documents": documents}
    (output / "display-manifest.json").write_text(json.dumps(report, ensure_ascii=False, indent=2)+"\n")
    print(json.dumps(statistics), flush=True)


if __name__ == "__main__":
    main()
