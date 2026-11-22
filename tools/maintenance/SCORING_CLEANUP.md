# Single-ticker scoring cleanup

Run from the repository root. Inventory JSON contains `ticker`, a repository-relative ticker directory `scope`, and `allowlist` mapping each reviewed relative file path to its SHA-256. Files outside the inventory, ambiguous filenames, unique evidence and known references remain protected. The script searches text and retained SQLite lineage. A reference to a proposed file is treated as a dependency until reviewed. Compare the inventory with any additional external archive, publication or admission system before approving.

Optionally bind `websiteReadback` as `{"path":"…","sha256":"…"}`. Its exact receipt identifies `ticker`, `status: "PASS"`, `scorecardId`, `cutoff`, `publicationHash` and `http` with `url`, `status: 200`, and `htmlSha256`. Produce this receipt from a real HTTP readback of the intended website and inspect the rendering before approval. A catalog or static renderer receipt is insufficient. The tool ties this receipt to the actual immutable publication and score rows. Use the approved project database.

```sh
python3 -B -m tools.maintenance.scoring_cleanup --ticker ACB --inventory /path/to/inventory.json
```

Review the exact output before approval. If `eligible` is empty, stop. For an approved plan, use the same arguments plus `--apply --approval PLAN_HASH --archive /private/path/unique-run`. Keep generated reports outside the repository while applying so their candidate paths do not create new references. The archive stores checked copies and the exact plan before unlinking. Retries after completed apply report `ALREADY_APPLIED`. If interrupted midway, use rollback before retrying. Pause concurrent writers to the inventory during an approved apply. No Git history changes.

To restore an applied or interrupted plan, run with `--ticker ACB --rollback --archive /private/path/unique-run --approval PLAN_HASH`. Rollback refuses conflicting files and validates saved bytes.
