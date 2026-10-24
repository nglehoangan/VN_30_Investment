# Implementation report

Only production-code changes:

- `src/domain/portfolio/transaction.ts`: optional opening receivable, exact nonnegative validation and deterministic positive RECEIVABLE leg.
- `src/infrastructure/repositories/portfolio-command-schema.ts`: optional decimal-string field in existing strict opening schema.

The ledger reader, economic replay, accounting methodology identity, migrations, Next.js UI and investment policies are unchanged. New `tests/unit/opening-receivable-compatibility.test.ts` covers precision, absence/zero, malformed/negative input, immutability, evidence requirements, funding, reversals, duplicate ID/idempotency/source and strict adapter corruption rejection. New `validate-m8-ledger-*.mjs` scripts record actual replay, independent original-leg totals and GET-only runtime comparisons. `close-m8-ledger-remediation.py` performs original source/hash, safety, sealed history and RAM-copy immutability checks and assembles this package.

Validation: 162 unit tests, 62 PEC-2 tests, exact actual 12-record/24-leg replay, eleven position balances/bases, fresh build and 18 live HTTP-200 routes. Reports distinguish synthetic seams, isolated copies and actual application data. No package installation or database migration occurred. Existing broker snapshots remain separately labelled; their displayed prices do not grant current market acceptance.
