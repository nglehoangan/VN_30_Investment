"""Read every retained manual PDF; preserve page geometry before table mapping.

Requires PyMuPDF. Apple Vision executable is built from scripts/lib/vision-ocr.m.
No source PDFs, prior evidence or production accounting records are modified.
"""
import argparse
import concurrent.futures
import gzip
import hashlib
import json
import os
import pathlib
import select
import subprocess
import tempfile
import time

import pymupdf

ROOT = pathlib.Path(__file__).resolve().parents[1]
BASE = ROOT / os.environ.get("VN30_PDF_EXTRACT_ROOT", "data/manual-extracted-pdf")
SOURCE = ROOT / os.environ.get("VN30_PDF_SOURCE_ROOT", "data/manual-download")
READERS = BASE / "readers"
DOCUMENTS = BASE / "documents"
EXISTING = ROOT / "data/manual-extracted/current/ocr"


def digest(data):
    return hashlib.sha256(data).hexdigest()


def write_json(path, value):
    content = json.dumps(value, ensure_ascii=False, separators=(",", ":")).encode()
    temp = path.with_suffix(path.suffix + ".tmp")
    if path.suffix == ".gz":
        temp.write_bytes(gzip.compress(content, mtime=0))
    else:
        temp.write_bytes(content + b"\n")
    temp.replace(path)


def relative(path):
    return str(path.relative_to(ROOT))


# Each process-pool worker owns one recognizer. Its stdin closes when the worker
# exits, so the helper exits at EOF. Readers still retain per-page provenance.
_vision_stream = None
_vision_binary_hashes = {}


def recognize(vision, image, stream):
    global _vision_stream
    if not stream:
        attempt = subprocess.run([vision, str(image)], capture_output=True, timeout=120)
        if attempt.returncode:
            raise RuntimeError("VISION_READ_FAILED:" + attempt.stderr.decode(errors="replace")[:200])
        return json.loads(attempt.stdout)
    if _vision_stream is None or _vision_stream.poll() is not None:
        _vision_stream = subprocess.Popen([vision], stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                                          stderr=subprocess.DEVNULL)
    _vision_stream.stdin.write((str(image) + "\n").encode())
    _vision_stream.stdin.flush()
    if not select.select([_vision_stream.stdout], [], [], 120)[0]:
        _vision_stream.kill()
        _vision_stream.wait()
        raise RuntimeError("VISION_STREAM_TIMEOUT")
    response = _vision_stream.stdout.readline()
    if not response:
        raise RuntimeError("VISION_STREAM_EXIT:" + str(_vision_stream.poll()))
    return json.loads(response)


def extract_document(task):
    item, vision, *options = task
    stream = bool(options[0]) if options else False
    path = ROOT / item["retainedPaths"][0]
    sha = item["sourceHash"]
    assert digest(path.read_bytes()) == sha, "PDF_HASH_MISMATCH"
    target = DOCUMENTS / (sha + ".json.gz")
    if target.exists():
        cached = json.loads(gzip.decompress(target.read_bytes()))
        if cached["sourceHash"] == sha and all(p["status"] != "READ_ERROR" for p in cached["pages"]):
            return {**item, "pageCount": len(cached["pages"]), "rawDocumentPath": relative(target),
                    "rawDocumentHash": digest(target.read_bytes()), "cached": True,
                    "methods": {method: sum(p["method"] == method for p in cached["pages"])
                                for method in sorted({p["method"] for p in cached["pages"]})}, "errors": []}
    pages, errors = [], []
    with pymupdf.open(path) as pdf:
        for index, page in enumerate(pdf):
            page_number = index + 1
            entry = {"page": page_number, "width": page.rect.width, "height": page.rect.height,
                     "rotation": page.rotation, "status": "RAW_EXTRACTION_UNREVIEWED"}
            try:
                retained = EXISTING / f"{sha}-p{page_number}.json"
                native = page.get_text("words", sort=True)
                text = page.get_text().strip()
                area = max(page.rect.width * page.rect.height, 1)
                # Image geometry needs no image hashes. Scanned pages with too little
                # native text already require OCR, so avoid decoding their images twice.
                raster = len(text) >= 150 and any(
                    pymupdf.Rect(info["bbox"]).get_area() / area > 0.5
                    for info in page.get_image_info(hashes=False, xrefs=False))
                if len(text) >= 150 and not raster:
                    entry.update(method="PYMUPDF_NATIVE_WORD_COORDINATES", text=text,
                                 words=[{"text": w[4], "x": w[0] / page.rect.width,
                                         "y": w[1] / page.rect.height,
                                         "width": (w[2]-w[0]) / page.rect.width,
                                         "height": (w[3]-w[1]) / page.rect.height,
                                         "confidence": 1} for w in native])
                else:
                    reader = None
                    if retained.exists():
                        candidate = json.loads(retained.read_text())
                        if candidate.get("bodyHash") == sha and candidate.get("page") == page_number and candidate.get("passA"):
                            reader = candidate
                            entry.update(method=candidate.get("engineA", "RETAINED_OCR"),
                                         readerPath=relative(retained), readerHash=digest(retained.read_bytes()),
                                         readerPass="passA")
                    if reader is None:
                        cached_reader = READERS / f"{sha}-p{page_number}.json.gz"
                        if cached_reader.exists():
                            reader = json.loads(gzip.decompress(cached_reader.read_bytes()))
                            assert reader["bodyHash"] == sha and reader["page"] == page_number
                        else:
                            with tempfile.TemporaryDirectory(prefix="manual-display-") as tmp:
                                image = pathlib.Path(tmp) / "page.png"
                                page.get_pixmap(dpi=180).save(image)
                                words = recognize(vision, image, stream)
                                if vision not in _vision_binary_hashes:
                                    _vision_binary_hashes[vision] = digest(pathlib.Path(vision).read_bytes())
                                reader = {"schemaVersion": "manual-display-reader-v1", "bodyHash": sha,
                                          "page": page_number, "engine": "APPLE_VISION_PERSISTENT_SINGLE_READER_UNREVIEWED" if stream else "APPLE_VISION_SINGLE_READER_UNREVIEWED",
                                          "engineExecutableSha256": _vision_binary_hashes[vision],
                                          "renderDpi": 180, "renderSha256": digest(image.read_bytes()),
                                          "words": words, "status": "RAW_EXTRACTION_UNREVIEWED"}
                                write_json(cached_reader, reader)
                        entry.update(method=reader["engine"], readerPath=relative(cached_reader),
                                     readerHash=digest(cached_reader.read_bytes()), readerPass="words")
                    words = reader.get("passA", reader.get("words", []))
                    entry["text"] = "\n".join(w["text"] for w in sorted(words, key=lambda w: (round(w["y"] / .008), w["x"])))
                    entry["wordCount"] = len(words)
                    if not words:
                        entry["status"] = "EMPTY_READER_OUTPUT_REVIEW_REQUIRED"
                pages.append(entry)
            except Exception as error:
                entry.update(method="FAILED", status="READ_ERROR", error=str(error))
                pages.append(entry)
                errors.append({"page": page_number, "error": str(error)})
    value = {"schemaVersion": "manual-display-raw-v1", **item, "pages": pages}
    write_json(target, value)
    return {**item, "pageCount": len(pages), "rawDocumentPath": relative(target),
            "rawDocumentHash": digest(target.read_bytes()), "cached": False,
            "methods": {method: sum(p["method"] == method for p in pages)
                        for method in sorted({p["method"] for p in pages})}, "errors": errors}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--vision", default="/private/tmp/vn30-vision-ocr")
    parser.add_argument("--workers", type=int, default=4)
    parser.add_argument("--vision-stream", action="store_true", help="Use the persistent stdin/JSON-lines Vision helper")
    parser.add_argument("--ticker")
    args = parser.parse_args()
    for directory in [BASE, READERS, DOCUMENTS]:
        directory.mkdir(parents=True, exist_ok=True)
    inventory = {}
    for path in sorted(SOURCE.rglob("*.pdf")):
        if args.ticker and path.parent.name != args.ticker:
            continue
        body = path.read_bytes()
        assert body.startswith(b"%PDF-"), path
        sha = digest(body)
        item = inventory.setdefault(sha, {"sourceHash": sha, "ticker": path.parent.name,
                                         "byteLength": len(body), "retainedPaths": []})
        assert item["ticker"] == path.parent.name, "CROSS_TICKER_PDF_DUPLICATE"
        item["retainedPaths"].append(relative(path))
    results = []
    start = time.time()
    with concurrent.futures.ProcessPoolExecutor(max_workers=args.workers) as pool:
        futures = {pool.submit(extract_document, (item, args.vision, args.vision_stream)): item for item in inventory.values()}
        for future in concurrent.futures.as_completed(futures):
            item = future.result()
            results.append(item)
            print(json.dumps({"done": len(results), "total": len(inventory), "ticker": item["ticker"],
                              "pages": item["pageCount"], "errors": len(item["errors"]),
                              "elapsedSeconds": round(time.time()-start)}), flush=True)
            manifest = {"schemaVersion": "manual-display-raw-v1", "complete": len(results) == len(inventory),
                        "physicalPdfCount": sum(len(i["retainedPaths"]) for i in inventory.values()),
                        "uniquePdfCount": len(inventory), "documents": sorted(results, key=lambda r: (r["ticker"], r["sourceHash"]))}
            write_json(BASE / ("manifest.json" if not args.ticker else f"manifest-{args.ticker}.json"), manifest)


if __name__ == "__main__":
    main()
