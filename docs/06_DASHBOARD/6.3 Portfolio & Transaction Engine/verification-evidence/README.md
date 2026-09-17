# M6.3 verification evidence — 2026-09-17

Current independent-review remediation: [R2 report](../R2_REMEDIATION_REPORT.md), [results and named regressions](r2-remediation-results.json), [source hashes](r2-source-sha256.json). R2 full suite: 285 pass; earlier closure counts below describe the prior commit.

Current status: all four findings closed. See [completion report](../COMPLETION_REPORT_2026-09-17.md), [closure results](closure-results.json) and [source hashes](closure-source-sha256.json).

The maintained regression suite is `tests/integration/portfolio-regressions.test.ts`. It runs with `pnpm test:portfolio` and `pnpm test`. Final results: 113 M6.3 tests and 262 total tests pass.

## Historical failed audit

`results.json` records the original pre-fix result: exit 1, 240 total, 237 passed, 3 failed. It is a compact transcription of the full Vitest JSON, not the full raw log. C01/M01/M02 were runtime failures; M03 was a source/approved-contract finding. See the [historical audit](../VERIFICATION_AUDIT_2026-09-17.md).

`m63-verification-audit.test.ts.txt` preserves the exact original probes. The `.ts.txt` extension prevents TypeScript from compiling fixture-relative imports in the docs directory. To reproduce the original failure, use an isolated checkout of the **pre-fix source** with the same test fixtures and locked dependencies:

```sh
cp 'docs/06_DASHBOARD/6.3 Portfolio & Transaction Engine/verification-evidence/m63-verification-audit.test.ts.txt' tests/integration/m63-verification-audit.test.ts
pnpm test --reporter=default --reporter=json --outputFile=/private/tmp/m63-verification-full-results.json
```

Do not add the archived probe to the corrected suite: its third assertion assumed a returned blocked snapshot, while the corrected API rejects pre-inception requests explicitly, another permitted safe outcome. The maintained regression asserts the exact ValidationError reason and also checks direct reconstruction and an explicit watermark. C01 additionally asserts no transaction or revision was committed.

Run commands sequentially because package scripts generate Prisma output. Integration tests use their existing private disposable SQLite fixtures; never point them at a user database. The closure e2e retry needed an approved local loopback listener after the sandbox rejected listen with EPERM; the retry passed.
