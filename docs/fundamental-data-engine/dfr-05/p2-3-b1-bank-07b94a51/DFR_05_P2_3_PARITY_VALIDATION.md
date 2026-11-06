# Predecessor parity and deterministic replay - PASS

All source/code/output seals for P1,P2.0,P2.1,P2.2 match. All original tracked files and retained data files remain byte-identical. No predecessor output, seal or assessment was rewritten.

| Pilot | Metrics | Completed | Deferred |
|---|---:|---:|---:|
|FPT|145|3|20|
|VNM|175|6|17|
|BID|82|4|19|
|TCX|87|4|19|
|VIC|150|4|19|
|VHM|150|4|19|

P1 totals:789 metric objects,25 completed assessments,113 deferred, including exact provider crosschecks and source projection/assessment hashes. ACB:92 metric objects,85 supported,7 missing,23 deferred; exact canonical core hash`5c1accb54b0373ba8beaf097d3fc4d9d8b758104054b259d1dfc3c69c599f09f`.

Two fresh same-input/same-code replays per issuer match these hashes:

- CTG: `338a104f44f9ceb1365781986a7c693433f9a00ad90decdc54cfb344a9fcc114`
- MBB: `c9b4a6cb33a96d51443526b02890f5763f5d7cd880192b5c24f6acd8b9ac59d1`
- TCB: `3576c2f65ddb97ee4212cca5da3bb76c5ce24394e038192edb193b856219e75b`
- VCB: `0d2c4bf6ab519c095cf4b12111af81553c4c2a593961a941c40ec3540e335aa0`

Canonical core includes the dossier, source inventory/projection, graph, gap register and conflict register. Process timestamps/receipts and predecessor-wide input-pin map are excluded; input-pin maps are separately verified and matched between runs.

10152 protected baseline files verified, including database/sidecar inventory, original financial sources, VN30/sector master, M1–M8, source policy and active authority. Node/Python runtimes and actual commands/exit codes/stdout/stderr are in validation-results.json. No whole-application release acceptance is claimed.
