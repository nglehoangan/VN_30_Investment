# M6 acceptance matrix

Baseline: f609a94d610705f3897e86b914fa4de5055833ce. This inventory covers every numbered FR/WF/DR/NFR/IB/AR in M6.1 REQUIREMENTS and all 25 M6 product acceptance clauses. PASS means runtime evidence for implemented approved behavior; it is not proof of live operational data. Accepted/deferred UI-CR-03 and M6.3 gates remain qualified. Full broader M6 product functionality is not claimed complete merely because this validation passes.

| Requirement | Status | Test/evidence | Scope or limitation |
|---|---|---|---|
| FR-1 Portfolio Dashboard | PASS WITH LIMITATION | current-remediation; m68 A/performance; UI/E2E | Full TWR/XIRR/CAGR/drawdown/benchmark history not implemented (UI-CR-03); tested current NAV/P&L is not investment return. |
| FR-2 Holdings | PASS WITH LIMITATION | portfolio-read-models; dashboard-ui; E2E desktop/mobile | Dense mobile analytic tables and bounded catalogs; full sorting/filtering and all thesis/score fields are limited. |
| FR-3 Transaction Ledger | PASS | portfolio accounting/command/integration; dashboard-ui confirmed posting | Controlled runtime evidence; real-data configuration not claimed. |
| FR-4 Portfolio Reconstruction & Reconciliation | PASS | portfolio reconciliation/regressions; current-remediation E | Controlled runtime evidence; real-data configuration not claimed. |
| FR-5 Cash Management | PASS WITH LIMITATION | workflow cash adapter; m68 A; dca | Actual/reserved/executable cash and contributions are authoritative; full planned-versus-actual DCA history UI is limited. |
| FR-6 VN30 Universe | PASS WITH LIMITATION | portfolio reference/effective-date cases; current-remediation D; workflow mandate | Effective-dated source/history inspectable; automated membership import/event detection deferred. |
| FR-7 Scoring Dashboard | PASS | scoring-golden; scoring-artifacts; UI score evidence | Controlled runtime evidence; real-data configuration not claimed. |
| FR-8 Ranking & Top 10 | PASS WITH LIMITATION | scoring/ranking validity and complete-universe cases; dca exclusion | Formal overall/actionable ranking and Top10 tested; all valuation/quality/sector presentation comparisons are not a complete screening product. |
| FR-9 Decision Center | PASS | decision/decision-sector; dashboard-ui; E2E decision state versus execution | Controlled runtime evidence; real-data configuration not claimed. |
| FR-10 DCA Planner | PASS | dca; marginal; m68 formal production composition | Controlled runtime evidence; real-data configuration not claimed. |
| FR-11 Risk Dashboard | PASS WITH LIMITATION | decision risk/sector/name/drawdown; current sectors; UI Risk | Formal M6.5 risk evidence and current sector weights displayed; full autonomous GREEN/WATCH/WARNING/BREACH and historical drawdown view not claimed. |
| FR-12 Investment Journal | PASS WITH LIMITATION | workflow journal/follow-up persistence; E2E journal | Embedded review journals and decision follow-ups exist; independent journal authoring/complete outcome history deferred. |
| FR-13 Review Center | PASS WITH LIMITATION | workflow unit/integration; current initiation; E2E reviews | Five core review types and embedded risk/behavior/performance findings supported; no separate full independent workflow for each subtype. |
| FR-14 Performance | PASS WITH LIMITATION | portfolio NAV bridge semantic regression; UI performance unavailable | Accounting/valuation NAV bridge is explicitly not total/TWR/XIRR/CAGR return; full benchmark/performance history deferred. |
| FR-15 Data Freshness | PASS | current-remediation B/C; m68 adapter; UI blocked status | Controlled runtime evidence; real-data configuration not claimed. |
| FR-16 Manual Data Import | PASS WITH LIMITATION | strict source adapter; manual UI; unavailable Imports screen | Normalized strict local JSON source and manual transaction facts exist; complete CSV/Excel preview/row-errors/import-batch workflows remain accepted/deferred UI-CR-03. |
| FR-17 Market Data Provider Boundary | PASS WITH LIMITATION | ports/current; LocalCurrentSource malformed/unavailable tests | Replaceable current normalized source boundary exists; complete historical/index/fundamental automated provider coverage deferred. |
| FR-18 AI Integration Boundary | PASS WITH LIMITATION | architecture; source scan; decision AI source rejected | No operational AI integration; tested absence of formal write authority. |
| FR-19 Export & Backup | PASS WITH LIMITATION | m68-backup disposable restore/replay/overwrite/tampering; BACKUP_OPERATION | Private SQLite snapshot and verified candidate restore implemented; full canonical CSV exports deferred under UI-CR-03. |
| FR-20 Audit Trail | PASS | portfolio/scoring/decision/workflow/marginal historical replay | Controlled runtime evidence; real-data configuration not claimed. |
| WF-1 Record a Cash Contribution | PASS | dashboard-ui preview/confirm; E2E manual contribution | Controlled runtime evidence; real-data configuration not claimed. |
| WF-2 Record a BUY | PASS WITH LIMITATION | dashboard-ui BUY amount recomputed; m68 explicit ledger trade | Manual UI records an already-occurred fact, not order authorization. Formal decision/allocation investability remains separate; no broker execution. |
| WF-3 Correct an Incorrect Transaction | PASS | portfolio atomic correction; m68 reversal; dashboard-ui reversal | Controlled runtime evidence; real-data configuration not claimed. |
| WF-4 Monthly DCA Review | PASS | m68 A/B/G; dca; marginal; production current composition | Controlled runtime evidence; real-data configuration not claimed. |
| WF-5 Weekly Review | PASS | workflow ordinary week and current concurrent weekly | Controlled runtime evidence; real-data configuration not claimed. |
| WF-6 Quarterly Review | PASS | workflow quarterly selective/missing fundamental evidence | Controlled runtime evidence; real-data configuration not claimed. |
| WF-7 VN30 Reconstitution | PASS WITH LIMITATION | workflow mandate/effective date; decision legacy | Manual sourced event/current membership workflow; no automatic provider ingestion/detection. |
| WF-8 Decision Audit | PASS | workflow follow-up audit/quality versus outcome/historical cutoff | Controlled runtime evidence; real-data configuration not claimed. |
| DR-1 Identity & Effective Dating | PASS | portfolio identity/reference effective-date tests; membership overlap/Vietnam boundary regressions | Controlled runtime evidence; real-data configuration not claimed. |
| DR-2 Timestamps | PASS | portfolio UTC/Vietnam day boundary; decision/current evidence time guards | Controlled runtime evidence; real-data configuration not claimed. |
| DR-3 Provenance | PASS | artifact lineage and confirmed manual source-reference tests | Controlled runtime evidence; real-data configuration not claimed. |
| DR-4 Data Classification | PASS | score/decision/review FACT/ESTIMATE/ASSUMPTION strict schema | Controlled runtime evidence; real-data configuration not claimed. |
| DR-5 Versioning | PASS WITH LIMITATION | registry and historical-as-calculated fixtures | Financial/score/rank/decision/review versions retained; deferred performance/benchmark methods cannot be claimed implemented. |
| DR-6 Derived Snapshots | PASS | projection stale/corrupt payload rejection; current reconstruction | Controlled runtime evidence; real-data configuration not claimed. |
| NFR-1 Correctness | PASS | exact portfolio/score/decision golden and repeated M6.8 tests | Controlled runtime evidence; real-data configuration not claimed. |
| NFR-2 Data Integrity | PASS | immutable triggers; atomic ledger/artifact persistence; FK checks | Controlled runtime evidence; real-data configuration not claimed. |
| NFR-3 Traceability | PASS | formal chain; historical lineage and execution links | Controlled runtime evidence; real-data configuration not claimed. |
| NFR-4 Testability | PASS | unit/integration suites separated from presentation | Controlled runtime evidence; real-data configuration not claimed. |
| NFR-5 Maintainability | PASS | boundary resolver; UI authority; new architecture tests | Controlled runtime evidence; real-data configuration not claimed. |
| NFR-6 Local-First Operation | PASS WITH LIMITATION | owned loopback smoke; no external browser requests; source unavailable fail-closed | Local operation tested; complete manual CSV import workflow deferred. |
| NFR-7 Backup & Recoverability | PASS | m68-backup + private CLI + restore operation documentation | Controlled runtime evidence; real-data configuration not claimed. |
| NFR-8 Security | PASS | local origin/HMAC/tamper/config/file safety/logging; dependency scope audit | Controlled runtime evidence; real-data configuration not claimed. |
| NFR-9 Performance | PASS WITH LIMITATION | performance.json; bounded catalog scan; E2E practical screen navigation | Measured 30 holdings/31 events; full-history reads and repeated immutable replay retained; multi-year/daily-price scale not proven. |
| NFR-10 Explainability | PASS | score/decision/proposal evidence rendering; explicit missing explanations | Controlled runtime evidence; real-data configuration not claimed. |
| NFR-11 Accessibility & UX Safety | PASS | UI labels/errors/color-independent statuses; desktop/mobile browser navigation | Controlled runtime evidence; real-data configuration not claimed. |
| NFR-12 Portability | PASS WITH LIMITATION | portable SQLite candidate restore; provider ports | SQLite user-owned portable backup available; complete canonical CSV data exports deferred. |
| IB-1 Market/Fundamental Providers | PASS WITH LIMITATION | source adapter/current fail-closed tests | Current-source adapter tested; remaining provider coverage deferred. |
| IB-2 File Import | PASS WITH LIMITATION | strict normalized source and unavailable bulk import; UI-CR-03 | Full CSV/Excel import feature deferred and unavailable. |
| IB-3 AI | PASS WITH LIMITATION | AI absence/architecture/source rejection | No operational AI integration; cannot test a live AI draft boundary. |
| IB-4 Broker | PASS | no broker client/credentials; source graph scan | Controlled runtime evidence; real-data configuration not claimed. |
| IB-5 Export/Backup | PASS | read-only SQLite snapshot source; source unchanged after backup tests | Controlled runtime evidence; real-data configuration not claimed. |
| AR-1 Ledger Audit | PASS | ledger IDs/facts/legs/correction source fields; historical replay | Controlled runtime evidence; real-data configuration not claimed. |
| AR-2 Calculation Audit | PASS | scoring/snapshot/rank versions and watermarks; tamper rejection | Controlled runtime evidence; real-data configuration not claimed. |
| AR-3 Decision Audit | PASS | decision lineage and workflow execution links | Controlled runtime evidence; real-data configuration not claimed. |
| AR-4 Review Audit | PASS | review immutable linkage/persistence/event precedence | Controlled runtime evidence; real-data configuration not claimed. |
| AR-5 No Silent Historical Rewrite | PASS | history fixtures; m68 corrected data B; repeated deploy and restored rows | Controlled runtime evidence; real-data configuration not claimed. |
| AC-1 Portfolio state can be deterministically reconstructed from authoritative transaction history plus approved reference/market data. | PASS | Mapped FR/WF/DR/NFR/IB/AR rows; final regression/E2E results | See relevant FR/NFR/scenario evidence and final results. |
| AC-2 Cash reconciles under M2 rules. | PASS | Mapped FR/WF/DR/NFR/IB/AR rows; final regression/E2E results | See relevant FR/NFR/scenario evidence and final results. |
| AC-3 Holdings reconcile under M2 rules. | PASS | Mapped FR/WF/DR/NFR/IB/AR rows; final regression/E2E results | See relevant FR/NFR/scenario evidence and final results. |
| AC-4 NAV and P&L pass approved test cases. | PASS WITH LIMITATION | Mapped FR/WF/DR/NFR/IB/AR rows; final regression/E2E results | Supported NAV/P&L tests pass; full performance history remains deferred. |
| AC-5 Dividends, fees, taxes, contributions, and withdrawals are not double-counted. | PASS | Mapped FR/WF/DR/NFR/IB/AR rows; final regression/E2E results | See relevant FR/NFR/scenario evidence and final results. |
| AC-6 VN30 membership history is effective-dated. | PASS | Mapped FR/WF/DR/NFR/IB/AR rows; final regression/E2E results | See relevant FR/NFR/scenario evidence and final results. |
| AC-7 Legacy Holdings are handled without automatic BUY/SELL. | PASS | Mapped FR/WF/DR/NFR/IB/AR rows; final regression/E2E results | See relevant FR/NFR/scenario evidence and final results. |
| AC-8 M3 score decomposition is reproducible. | PASS | Mapped FR/WF/DR/NFR/IB/AR rows; final regression/E2E results | See relevant FR/NFR/scenario evidence and final results. |
| AC-9 Top 10 follows M3 ranking rules. | PASS | Mapped FR/WF/DR/NFR/IB/AR rows; final regression/E2E results | See relevant FR/NFR/scenario evidence and final results. |
| AC-10 M4 Decision States are generated only by the decision domain logic. | PASS | Mapped FR/WF/DR/NFR/IB/AR rows; final regression/E2E results | See relevant FR/NFR/scenario evidence and final results. |
| AC-11 DCA may validly result in HOLD CASH. | PASS | Mapped FR/WF/DR/NFR/IB/AR rows; final regression/E2E results | See relevant FR/NFR/scenario evidence and final results. |
| AC-12 Portfolio/risk constraints can block action. | PASS | Mapped FR/WF/DR/NFR/IB/AR rows; final regression/E2E results | See relevant FR/NFR/scenario evidence and final results. |
| AC-13 Data freshness is visible. | PASS | Mapped FR/WF/DR/NFR/IB/AR rows; final regression/E2E results | See relevant FR/NFR/scenario evidence and final results. |
| AC-14 Stale/insufficient material data cannot masquerade as a current actionable recommendation. | PASS | Mapped FR/WF/DR/NFR/IB/AR rows; final regression/E2E results | See relevant FR/NFR/scenario evidence and final results. |
| AC-15 Weekly/Monthly/Quarterly workflows are persistable and auditable. | PASS WITH LIMITATION | Mapped FR/WF/DR/NFR/IB/AR rows; final regression/E2E results | Core five review types persist; broader independent subworkflows limited. |
| AC-16 Recommendation is distinct from execution. | PASS | Mapped FR/WF/DR/NFR/IB/AR rows; final regression/E2E results | See relevant FR/NFR/scenario evidence and final results. |
| AC-17 AI cannot directly mutate authoritative ledger state. | PASS WITH LIMITATION | Mapped FR/WF/DR/NFR/IB/AR rows; final regression/E2E results | AI is not operational; absence of write path is tested. |
| AC-18 Every formal recommendation retains methodology/input lineage. | PASS | Mapped FR/WF/DR/NFR/IB/AR rows; final regression/E2E results | See relevant FR/NFR/scenario evidence and final results. |
| AC-19 Reconciliation discrepancies are visible and never silently repaired. | PASS | Mapped FR/WF/DR/NFR/IB/AR rows; final regression/E2E results | See relevant FR/NFR/scenario evidence and final results. |
| AC-20 Core user data can be exported. | PASS WITH LIMITATION | Mapped FR/WF/DR/NFR/IB/AR rows; final regression/E2E results | SQLite backup is portable; complete CSV exports remain deferred. |
| AC-21 Database backup/restore strategy is documented and testable. | PASS WITH LIMITATION | Mapped FR/WF/DR/NFR/IB/AR rows; final regression/E2E results | Verified local candidate restore; private trusted-device scope only. |
| AC-22 Core automated tests pass. | PASS | Mapped FR/WF/DR/NFR/IB/AR rows; final regression/E2E results | See relevant FR/NFR/scenario evidence and final results. |
| AC-23 No Critical or Major unresolved issue remains. | PASS | Mapped FR/WF/DR/NFR/IB/AR rows; final regression/E2E results | Zero unresolved Critical/Major implementation findings identified in authorized bounded scope; retained wider product limitations are explicit, not full product delivery. |
| AC-24 Documentation reflects implemented behavior. | PASS WITH LIMITATION | Mapped FR/WF/DR/NFR/IB/AR rows; final regression/E2E results | Historical reports retained; M6.8 report and README reconcile current runtime. |
| AC-25 M1–M5 baseline semantics are not silently changed. | PASS | Mapped FR/WF/DR/NFR/IB/AR rows; final regression/E2E results | See relevant FR/NFR/scenario evidence and final results. |

## Operational gate

| Gate | Status | Evidence / qualification |
|---|---|---|
| Architecture boundaries | PASS | Installed resolver boundary scan and authority/replay tests; no shadow owner |
| M6.8 implementation | PASS | Confirmed marginal-composition, backup, issuance-time and catalog-integrity defects fixed within existing rules |
| Controlled validation | PASS | 761 aggregate / 10 browser tests; all final required command attempts pass, with earlier lint failure and corrective rechecks retained in validation-evidence/results.json |
| Complete broader M6 product | PASS WITH LIMITATION | UI-CR-03 and accounting capability gates preserved; listed above, no full imports/performance claim |
| Operationally ready with real data | BLOCKED | Genuine current market/fundamental datasets and external production approvals were not validated; test approvals are not real governance |
| Broker/autonomous trading | NOT APPLICABLE | Explicitly outside M6; no implementation |
| Operational AI drafting | NOT APPLICABLE | No live AI integration |
| Milestone 7 | NOT APPLICABLE | Not implemented |
