# ACB production boundaries - PASS

**63/63 actual entry-point probes rejected**: ACB plus six unchanged pilot dossiers, each tested against formal scorer, ranking root, nested ranking card, decision, monthly DCA validation, NAV request qualification, ledger transaction builder, formal DI acceptance and formal AI provenance.

Probes import the existing production functions and require rejection; they do not use mocks or call write repositories. Rejection reasons are retained in boundary-results.json. This validates direct and nested research DTO incompatibility; it does not claim protection against arbitrary transformations, authenticated promotion or all application workflows.

Approved scoring authority verifier executed successfully. All original tracked files and data fingerprints were checked again after the actual probes. No production database connection was opened by the ACB pipeline; the authority verifier uses its existing read-only path. No DB/master/authority write, financial admission, new score, ranking result, portfolio decision, DCA, NAV calculation or ledger posting was performed.

No whole-application release PASS is claimed. Existing release issues and legacy pilot exceptions remain under their original governance. See validation-results.json for executable/runtime versions, exact commands, exit codes, stdout and stderr.
