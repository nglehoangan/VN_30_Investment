# Root scripts removal

Status: FULL_ROOT_SCRIPTS_REMOVAL_COMPLETE.

Owner explicitly selected: “Xóa toàn bộ 380 file, chấp nhận lỗi build/database và xác minh”. All 380 reviewed files in root `scripts/` have been removed, including previously retained dependencies. No replacement directory, archive, stub or symlink was created. Original file hashes and Git blob references remain in SCRIPT_REMOVAL_PLAN.json for audit.

Package commands and source-integrity manifests were not rewritten. Build/database commands, skills and tests referring to removed scripts may fail; this consequence was explicitly accepted. Earlier passing typecheck/boundary results preceded full removal and do not establish current readiness. No scoring, deployment or publication was executed.

`skills/*/scripts`, `tools/maintenance`, source PDF/JSON data and the active SQLite database were outside the deletion scope. Database SHA-256 before/after: `0876f70a76b8d89efe1d33559ff2d68b4f8b50bdccb2e510562fd4dc748d8e51`. No backup or archive was created.
