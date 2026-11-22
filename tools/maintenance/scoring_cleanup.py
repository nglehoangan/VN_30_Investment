"""Plan or apply one ticker's explicitly allowlisted scoring-file cleanup."""
import argparse
from contextlib import closing
import hashlib
import json
from pathlib import Path
import re
import shutil
import sqlite3
import subprocess

from tools.maintenance.common import atomic_json, digest_json, require_ticker, sha256_file

ROOT = Path(__file__).resolve().parents[2]
SCRATCH = re.compile(r"(?:DRAFT|DIAGNOSTIC|SCRATCH|TEMP|PREPARE_READONLY_REVIEW)", re.I)
PROTECTED = re.compile(r"APPROV|AUTHORITY|AUTHORIZATION|RECEIPT|READBACK|PUBLICATION|SOURCE|DATASET|EVIDENCE|EXECUTABLE|METHODOLOGY|CANONICAL", re.I)
DIGEST = re.compile(r"[0-9a-f]{64}")


def file_at(root, relative):
    candidate = root / relative
    if Path(relative).is_absolute() or not relative or candidate.resolve().relative_to(root).as_posix() != relative:
        raise ValueError(f"UNSAFE_PATH: {relative}")
    if not candidate.is_file() or candidate.stat().st_nlink != 1:
        raise ValueError(f"UNSAFE_FILE: {relative}")
    return candidate


def publication_gate(root, ticker, manifest, db):
    if not manifest:
        return "VERIFIED_WEBSITE_READBACK_REQUIRED"
    receipt = json.loads(file_at(root, manifest["path"]).read_text())
    if sha256_file(root / manifest["path"]) != manifest["sha256"]:
        raise ValueError("WEBSITE_READBACK_HASH_MISMATCH")
    if receipt.get("ticker") != ticker or receipt.get("status") != "PASS":
        return "WEBSITE_RECEIPT_SCOPE_OR_STATUS_MISMATCH"
    http = receipt.get("http", {})
    if (http.get("status") != 200 or not DIGEST.fullmatch(http.get("htmlSha256", "")) or
            not isinstance(http.get("url"), str) or not http["url"].startswith(("https://", "http://127.0.0.1:"))):
        return "WEBSITE_HTTP_READBACK_REQUIRED"
    result = db.execute(
        """SELECT a.body,a.body_hash,s.body,s.body_hash FROM analytical_artifact a
           JOIN current_score_artifact s ON s.id=a.id WHERE a.id=? AND a.kind='SCORECARD'""",
        (receipt.get("scorecardId"),),
    ).fetchone()
    if not result:
        return "PUBLISHED_ARTIFACT_REQUIRED"
    envelope, envelope_hash, bundle, bundle_hash = result
    publication, saved = json.loads(envelope), json.loads(bundle)
    card, auth = saved["card"], saved["authorization"]
    if (hashlib.sha256(envelope.encode()).hexdigest() != envelope_hash or envelope_hash != receipt.get("publicationHash") or
            hashlib.sha256(bundle.encode()).hexdigest() != bundle_hash or publication.get("contract") != "current-read-only-publication-v1" or
            card["ticker"] != ticker or publication["scorecardId"] != card["id"] or
            publication.get("scorecardHash") != digest_json(card) or receipt.get("cutoff") != card["asOf"][:10]):
        return "PUBLICATION_READBACK_MISMATCH"
    for target in (card["id"], publication["authorityReference"], publication["authorityHash"],
                   auth["reference"]["bindingId"], auth["dataAcceptanceId"]):
        if db.execute("SELECT 1 FROM source_admission_event WHERE target_id=?", (target,)).fetchone():
            return "PUBLICATION_OR_LINEAGE_REVOKED"
    return None


def references(root, relative, sha, stored):
    path = root / relative
    matches = subprocess.run(
        ["rg", "--hidden", "-l", "-F", "-g", "!.git/**", "-g", "!node_modules/**",
         "-g", "!.next/**", "-g", "!.pnpm-store/**", "-g", "!.env*", "-e", path.name, "-e", sha, "."],
        cwd=root, capture_output=True, text=True, check=False,
    )
    if matches.returncode not in (0, 1):
        raise ValueError("DEPENDENCY_SCAN_FAILED")
    result = [name.removeprefix("./") for name in matches.stdout.splitlines() if (root / name).resolve() != path]
    if any(path.name in row or sha in row for row in stored):
        result.append("SQLite lineage")
    return sorted(result)


def plan(root, ticker, request, database):
    ticker = require_ticker(ticker)
    if request["ticker"] != ticker:
        raise ValueError("INVENTORY_TICKER_MISMATCH")
    scope = request["scope"]
    folder = root / scope
    if (not folder.is_dir() or folder.resolve().relative_to(root).as_posix() != scope
            or not any(re.match(rf"^{ticker}(?:[-_]|$)", part, re.I) for part in Path(scope).parts)):
        raise ValueError("TICKER_SCOPED_DIRECTORY_REQUIRED")
    with closing(sqlite3.connect(database.resolve().as_uri() + "?mode=ro", uri=True)) as db:
        db.execute("BEGIN")
        blocker = publication_gate(root, ticker, request.get("websiteReadback"), db)
        stored = list(db.iterdump())
    allowlist = request["allowlist"]
    if not isinstance(allowlist, dict) or any(not DIGEST.fullmatch(sha) for sha in allowlist.values()):
        raise ValueError("EXPLICIT_PATH_SHA256_ALLOWLIST_REQUIRED")
    entries = []
    tracked = set(subprocess.check_output(["git", "ls-files", "--", scope], cwd=root, text=True).splitlines())
    for path in sorted(folder.rglob("*")):
        if path.is_dir() and not path.is_symlink():
            continue
        relative = path.relative_to(root).as_posix()
        bucket = "KEEP_CANONICAL" if re.search(r"PUBLICATION|SCORE_READBACK|FUTURE_EVIDENCE", path.name, re.I) else "KEEP_ARCHIVE"
        if path.is_symlink():
            entries.append(dict(path=relative, classification="KEEP_ARCHIVE", reason="SYMLINK"))
            continue
        sha = sha256_file(file_at(root, relative))
        refs = []
        reason = "RETAINED"
        if relative in allowlist:
            if sha != allowlist[relative]:
                raise ValueError(f"ALLOWLIST_HASH_MISMATCH: {relative}")
            if not SCRATCH.search(path.name) or PROTECTED.search(path.name):
                reason = "PROTECTED_OR_UNCLASSIFIED"
            else:
                refs = references(root, relative, sha, stored)
                if request.get("inventoryPath"):
                    refs = [ref for ref in refs if ref != request["inventoryPath"]]
                reason = "REFERENCED" if refs else "ALLOWLISTED_REDUNDANT"
                if not refs:
                    bucket = "PRUNE_CANDIDATE"
        entries.append(dict(path=relative, sha256=sha, classification=bucket, tracked=relative in tracked,
                            references=refs, reason=reason))
    if set(allowlist) - {row["path"] for row in entries if "sha256" in row}:
        raise ValueError("ALLOWLIST_OUTSIDE_INVENTORY")
    candidates = [entry for entry in entries if entry["classification"] == "PRUNE_CANDIDATE"]
    return dict(ticker=ticker, blocker=blocker, inventory=entries,
                eligible=[] if blocker else candidates, pendingReadback=candidates if blocker else [])


def restore(root, archive, report):
    for row in report["eligible"]:
        backup = file_at(archive, row["path"])
        target = root / row["path"]
        if sha256_file(backup) != row["sha256"]:
            raise ValueError("ARCHIVE_CHECKSUM_MISMATCH")
        if target.parent.resolve().relative_to(root) != Path(row["path"]).parent:
            raise ValueError("RESTORE_SCOPE_CHANGED")
        if (target.exists() or target.is_symlink()) and sha256_file(file_at(root, row["path"])) != row["sha256"]:
            raise ValueError("RESTORE_TARGET_CONFLICT")
    for row in report["eligible"]:
        target = root / row["path"]
        if not target.exists():
            with target.open("xb") as writer, (archive / row["path"]).open("rb") as source:
                shutil.copyfileobj(source, writer)
            if sha256_file(target) != row["sha256"]:
                target.unlink()
                raise ValueError("RESTORE_CHECKSUM_MISMATCH")


def apply(root, archive, report, approval):
    if report["blocker"] or digest_json(report) != approval or not report["eligible"]:
        raise ValueError("EXACT_APPROVED_ELIGIBLE_PLAN_REQUIRED")
    if archive.is_relative_to(root):
        raise ValueError("ARCHIVE_MUST_BE_OUTSIDE_REPOSITORY")
    archive.mkdir(mode=0o700, parents=True, exist_ok=True)
    manifest = archive / "PLAN.json"
    if not manifest.exists():
        for row in report["eligible"]:
            target = file_at(root, row["path"])
            backup = archive / row["path"]
            backup.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
            if backup.parent.resolve().relative_to(archive) != Path(row["path"]).parent:
                raise ValueError("ARCHIVE_SCOPE_CHANGED")
            if not backup.exists():
                with backup.open("xb") as writer, target.open("rb") as source:
                    shutil.copyfileobj(source, writer)
            if sha256_file(file_at(archive, row["path"])) != row["sha256"]:
                raise ValueError("ARCHIVE_CHECKSUM_MISMATCH")
        atomic_json(manifest, report, immutable=True)
    elif json.loads(manifest.read_text()) != report:
        raise ValueError("ARCHIVE_PLAN_CONFLICT")
    try:
        for row in report["eligible"]:
            if sha256_file(file_at(archive, row["path"])) != row["sha256"]:
                raise ValueError("ARCHIVE_CHECKSUM_MISMATCH")
            target = file_at(root, row["path"])
            if sha256_file(target) != row["sha256"]:
                raise ValueError("SOURCE_CHANGED_BEFORE_APPLY")
            target.unlink()
    except (OSError, ValueError):
        restore(root, archive, report)
        raise


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ticker", required=True, action="append")
    parser.add_argument("--inventory", type=Path)
    parser.add_argument("--database", type=Path, default=ROOT / "data/vn30.sqlite")
    parser.add_argument("--archive", type=Path)
    parser.add_argument("--approval")
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--apply", action="store_true")
    mode.add_argument("--rollback", action="store_true")
    args = parser.parse_args()
    try:
        if len(args.ticker) != 1:
            raise ValueError("EXACTLY_ONE_TICKER_REQUIRED")
        ticker = require_ticker(args.ticker[0])
        if args.rollback:
            archive = args.archive.resolve()
            report = json.loads(file_at(archive, "PLAN.json").read_text())
            if report["ticker"] != ticker or digest_json(report) != args.approval:
                raise ValueError("ARCHIVE_PLAN_APPROVAL_MISMATCH")
            restore(ROOT, archive, report)
            print(json.dumps({"status": "ROLLED_BACK", "ticker": ticker, "planHash": args.approval}))
            return
        source = args.inventory.resolve()
        request = json.loads(source.read_text())
        if source.is_relative_to(ROOT):
            request["inventoryPath"] = source.relative_to(ROOT).as_posix()
        if args.apply and args.archive and (args.archive / "PLAN.json").is_file():
            archived = json.loads(file_at(args.archive.resolve(), "PLAN.json").read_text())
            if archived["ticker"] != ticker or digest_json(archived) != args.approval:
                raise ValueError("ARCHIVE_PLAN_APPROVAL_MISMATCH")
            removed = [row for row in archived["eligible"] if not (ROOT / row["path"]).exists()]
            if removed:
                if len(removed) != len(archived["eligible"]):
                    raise ValueError("PARTIAL_APPLY_REQUIRES_ROLLBACK")
                for row in removed:
                    if sha256_file(file_at(args.archive.resolve(), row["path"])) != row["sha256"]:
                        raise ValueError("ARCHIVE_CHECKSUM_MISMATCH")
                print(json.dumps({"status": "ALREADY_APPLIED", "ticker": ticker, "planHash": args.approval}))
                return
        report = plan(ROOT, ticker, request, args.database)
        if args.apply:
            apply(ROOT, args.archive.resolve(), report, args.approval)
        print(json.dumps({"status": "APPLIED" if args.apply else "DRY_RUN", "planHash": digest_json(report), **report}, indent=2))
    except (AttributeError, OSError, ValueError, KeyError, TypeError, sqlite3.Error, subprocess.SubprocessError) as error:
        parser.exit(2, f"{error}\n")


if __name__ == "__main__":
    main()
