# Manual financial statement–first architecture amendment

Status: **PROJECT OWNER APPROVED**. Effective prospectively: **2026-10-13**.

The Project Owner explicitly approved this architecture and its implementation in the current workflow request. This approval does not approve DI14/DI15, historical failed snapshots, unrelated proposed registry releases, bank-specific definition guesses or live investment decisions.

## Source ownership and document admission

For CURRENT_ANALYSIS, qualified retained issuer audited annual, reviewed semiannual, quarterly statements and annual reports own canonical accounting fundamentals: revenue, operating profit/EBIT, profits, common shareholder earnings, assets, equity, debt, cash, CFO, CapEx, EPS, BVPS and explicitly evidenced sector disclosures/ratios. Structured providers are DIAGNOSTIC / NON_AUTHORITATIVE_FOR_ACCOUNTING. Their discrepancies can trigger extraction review but cannot veto or overwrite manual facts. TCBS/the approved market source independently owns prices, volume, market-cap inputs and technical/money-flow observations. Official effective-dated index references own membership. Portfolio ledger/broker reconciliation owns quantities, cash, costs, transactions, dividends received and NAV. Cross-domain overwrites are forbidden.

Each admitted PDF binds an exact fresh SHA256 check, retained path, ticker/issuer evidence, type, reporting period, fiscal year/quarter, scope, currency, unit basis, import/review timestamps and qualification reference. Historical reviewed extraction may be reused prospectively only when its lineage still binds the exact retained PDF and reviewed cell/page evidence. Old qualification labels alone are insufficient. Unreviewed OCR/native text is a search aid. Facts retain concept, value, dimensions, exact period/scope, source identity/hash, locator, method/status, quality and revision lineage. Observed zero is distinct from null.

Consolidated group evidence is preferred. Standalone fallback is labelled and never fills consolidated holes. Production accounting conflicts compare only eligible authoritative manual statements for the same economic concept, dimensions, period and scope. Restatements require an explicit same-key predecessor and evidence. No latest-wins policy exists. Cycles, invalid lineage and conflicting revision branches fail closed.

## Mode separation

CURRENT_ANALYSIS admits qualified retained documents with known import/review dates and no future reporting period. Missing exact historical publication time is not a current veto. Proven publication evidence is retained; unproved historical availability remains UNKNOWN. HISTORICAL_REPLAY still requires proved availability before the simulated decision and operational knowledge before the system cutoff. Current snapshots have a distinct type/contract and cannot enter the existing historical bridge. Historical PIT behavior is unchanged.

## Evidence and scoring

The versioned contract is `src/domain/fundamentals/manual-fundamental-evidence-requirements-v1.json`, implementing approved M3 economic principles under this request. CORE covers material financial condition; SECTOR_CORE translates sector economics; SUPPORTING improves confidence; OPTIONAL enriches analysis. Requirements map to affected analytical components, not additive metric points.

FULL has material and supporting coverage. PARTIAL has material coverage with supporting limitations and reduced confidence. INSUFFICIENT has missing/invalid/conflicting material evidence and cannot be fundamentalScorable. Optional absence alone does not reduce confidence. LOW confidence prevents fundamentalScorable. Missing ROIC alone is optional. Banks do not require industrial FCF, CFO conversion, net debt/EBITDA, ROIC or interest coverage. CASA is optional. NPL remains N_R without the approved generic population/definition contract; reserves do not prove NPL recognition or capital adequacy. Securities require funding/margin risk; insurance underwriting/reserves/solvency; property project assets; retail working capital; technology and capital-intensive sectors reinvestment; cyclicals margins; conglomerates segment economics. Sector limitations remain explicit.

The current financial bridge supplies facts, mechanical metrics and component limitations. It produces no scores or fabricated qualitative assessments. M3 bounded subcategory rules, weights 25/15/15/10/20/10/5, maxima, double-count controls, sector normalization and LOW-confidence restrictions are unchanged. Missing weight is never redistributed. Statements cannot alone prove moat, management, competitive structure, regulation or future runway. Valuation still requires sector-appropriate fundamentals plus independently approved current market inputs. Financial readiness is distinct from marketReady, valuationReady, qualitativeReady, readyForScoring and decisionReady; downstream acceptance gates remain in force.

## Freshness and derivation policy

Reporting-cycle-v1 compares the latest qualified reporting period with completed fiscal quarter/year ends and the analysis date. Operational reporting grace: quarterly 60 days, annual-only 120 days. One missed expected cycle is AGING; two or more STALE; no qualified report or unknown fiscal calendar UNKNOWN. These are operational assessment windows, not statutory filing deadlines. Quarterly issuers' annual statements retain quarterly expectations. Non-calendar issuer endpoints must be evidenced. Retrieval/download age is never financial freshness. Corpus absence does not prove that a newer report does not exist.

Mechanical metrics use exact decimal arithmetic and same-scope/dimension/period operands, versioned formulas, operand IDs, source IDs/hashes, time, quality and confidence. ROE uses common profit and average common equity; parent profit is not silently substituted. Partial-period returns are not annualized. CapEx is positive cash outflow magnitude; FCF is CFO minus CapEx. Missing operands/zero denominators yield N_R. REPORTED, MECHANICALLY_DERIVED and ANALYST_ADJUSTED remain distinct; this path creates no analyst adjustments or guessed normalization. CAGR and cycle assessments stay N_R without comparable exact inputs.

## Explicit M8 initialization amendment

| Gate | Prospective interpretation |
| --- | --- |
| DI5 | Required material CORE and SECTOR_CORE evidence under the versioned sufficiency contract; not every possible metric. |
| DI7 | Missing supporting/optional evidence is disclosed and affects confidence/components appropriately, without automatic whole-company failure. |
| DI8 | BCTC freshness is reporting-cycle aware. Other source domains retain independent policies. |
| DI9 | Accounting production conflicts compare authoritative eligible manual facts. Provider discrepancies are diagnostic. Impossible values still fail. |
| DI10 | Required mechanical derivations need exact complete lineage; optional N_R does not veto fundamentals. |
| DI11 | Current and historical admissibility are explicitly distinct; historical anti-look-ahead remains strict. |

DI1–DI4 and downstream scoring gates are not waived. The known official membership discrepancy remains visible; the dated 30-name notice is an explicit research denominator, not certified current membership. Prior Slice 08 packages remain immutable failed/candidate evidence. DI14: AWAITING_INDEPENDENT_REVIEW. DI15: AWAITING_PROJECT_OWNER_APPROVAL. No production scoring/ranking/Top10/decision/DCA is performed or authorized by this amendment.
