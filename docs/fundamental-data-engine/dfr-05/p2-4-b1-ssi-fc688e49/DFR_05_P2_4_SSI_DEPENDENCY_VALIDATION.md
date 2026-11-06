# SSI dependency validation
Baseline `fc688e49fd4a6ad06d0333967ce24c9f7e8adbc8`. Implementation: **uncommitted**. SSI only; RESEARCH_PROVISIONAL, productionAdmissible=false, scoringAuthorized=false. All 23 rubrics have null points/band/assessment; categoryScores/totalScore/ranking/valuation remain null. No external acquisition or production mutation.

`dependencyGraph.json` links hash-pinned PDFs → bound observations → financial facts → derived metrics → topic context → all 23 rubric dispositions. Financial context cannot grant full-topic qualification. Graph validation rejects cycles, dangling edges and cross-issuer additions.

`conflict-injection-results.json` records actual controlled overlays for margin lending, financial borrowings, customer cash and parent NPAT FY2025. Each receipt lists every affected and unaffected graph node and a mutated-copy hash. Expected reachability is independently computed by fixed-point closure. Original inputs and dossier remain unchanged. Customer cash affects liquidity readiness only through explicit context; it cannot affect group ROA, corporate cash/debt or shareholder capital. Parent profit does not contaminate group-profit return diagnostics.

The negative revision fixture deliberately uses one PDF with different before/after column cohorts and rejects compatibility. Original/restated metadata is never replaced merely because source hashes match.
