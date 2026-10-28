# Slice A implementation boundary (recorded before implementation)

2026-10-28. Approved planning commit: 0f3a4dabcd06912981df2b9d07be80ee557c421e. READ_ONLY_ADAPTERS_ONLY.

Existing CurrentNavInputProvider.load requires a complete CurrentNavPlanV1|null. Slice A cannot construct a truthful complete plan without identities, calendar/market authority, broker completeness and independent acceptance from slices B–G. Add an isolated typed BLOCKED preparation outcome alongside the existing interface; load remains null. Composition returns the blocked preparation diagnostics and unchanged NAV_BLOCKED result. No change to approved calculator/service/request/result contracts or formula.

Reuse PortfolioLedger.read, buildTransaction integrity repository, reconstructPortfolio, Decimal utilities, deepFreeze and snapshotHash. Existing broker snapshot schema lacks exact account identity; broker API display parser masks accounts and uses Number for UI values. Neither is a safe NAV evidence decoder. Add a narrowly versioned immutable observation-envelope reader for retained local bytes, preserving fields/decimal lexemes and exact account/perimeter/document/time bindings. No source conversion/acquisition or financial interpretation is implemented. Tests create fictional local envelopes only; existing raw TCBS/PDF files are not silently treated as this schema. Unsupported retained layouts remain blocked pending separately approved adapters.

Path policy: caller/server-configured private root, relative paths only, no symlink component, bounded regular-file reads using O_NOFOLLOW, descriptor/stat/path checks before and after hash/read; strict UTF-8 and duplicate-key rejection. Exact byte hashes and manifest pins are integrity only, never approval. Same-user/privileged concurrent filesystem attacks are not a claim of tamper-proof storage; production trust integration remains out of scope.

No Next.js/application root is changed, no new authentication, migration, approval store or HTTP path. All operational flags remain false. An isolated composition accepts read-only capabilities and exposes no ledger/engine/post method.
