# VN30 Value Investing OS — Market Data Adapter

**Document:** `06_DASHBOARD/MARKET_DATA_ADAPTER.md`  
**Milestone:** 6 — Dashboard & Automation  
**Sub-milestone:** M6.1 — Requirements & Architecture  
**Status:** Approved Baseline  
**Version:** 1.0  
**Date:** 2026-09-09  

## Governing Baselines

This document operationalizes:

- `06_DASHBOARD/REQUIREMENTS.md` — Approved Baseline v1.0
- `06_DASHBOARD/ARCHITECTURE.md` — Approved Baseline v1.0
- `06_DASHBOARD/DOMAIN_MODEL.md` — Approved Baseline v1.0
- `06_DASHBOARD/DATA_FLOW.md` — Approved Baseline v1.0
- `06_DASHBOARD/UI_INFORMATION_ARCHITECTURE.md` — Approved Baseline v1.0
- all approved M1–M5 source documents

This document defines the M6 market/reference/fundamental provider boundary.

It does **not** select a live vendor, redefine source-of-truth ownership, or change investment rules.

---

# 1. Purpose

The Market Data Adapter layer exists to ensure that:

1. domain/business logic never depends on a vendor-specific API;
2. manual CSV/Excel remains a valid first-class fallback;
3. every observation has source/as-of/provenance;
4. freshness and revision status are explicit;
5. bad provider data cannot silently become trusted analytical input;
6. providers can be replaced independently by capability;
7. data ingestion failure degrades safely without corrupting portfolio/accounting truth.

---

# 2. Scope

This document covers provider boundaries for:

- security prices;
- historical prices;
- VN30 benchmark observations;
- VN30 membership/reference;
- sector/reference data;
- company/fundamental evidence;
- corporate/reference data where appropriate.

This document does not cover:

- broker order APIs;
- broker account balances as authoritative accounting;
- transaction posting;
- AI provider architecture;
- UI import details;
- physical DB schema.

---

# 3. Core Principle — Capability-Oriented Ports

Do not create one mandatory god interface.

Recommended logical ports:

```text
PriceProvider
HistoricalPriceProvider
BenchmarkProvider
VN30MembershipProvider
SectorReferenceProvider
FundamentalDataProvider
CorporateReferenceProvider
```

A concrete vendor may implement several capabilities.

A manual-file implementation may satisfy the same logical capabilities from normalized imported records.

---

# 4. Normalized Observation Contract

All provider outputs must be normalized before entering domain/application logic.

A normalized observation must preserve, as applicable:

- subject/security/benchmark identity;
- metric or observation type;
- raw source value;
- normalized value;
- unit/currency;
- effective/as-of period;
- publication date where relevant;
- provider/source identity;
- retrieved/imported timestamp;
- revision/version;
- source reference;
- data-quality state;
- freshness state;
- FACT / ESTIMATE / ASSUMPTION where required.

Vendor-specific field names must stop at adapter boundaries.

---

# 5. Price Provider Contract

Conceptual interface:

```text
PriceProvider
- getPrice(securityId, asOf)
- getLatestPrice(securityId)
```

Return value must include:

```text
MarketPriceObservation
- securityId
- price
- currency
- asOf
- source
- retrievedAt/importedAt
- revision
- quality
- freshness
```

Rules:

1. price without as-of is invalid;
2. provider “latest” must still return the actual market as-of;
3. retrieval time is not market as-of;
4. stale price remains stale even if downloaded now;
5. no missing price may be replaced by zero;
6. no previous close may silently stand in for current/latest without explicit label;
7. adjusted/unadjusted series must be distinguished.

---

# 6. Historical Price Provider Contract

Conceptual interface:

```text
HistoricalPriceProvider
- getPrices(securityId, from, to)
```

Must preserve:

- trading date;
- raw/adjusted status;
- corporate-action adjustment methodology if applicable;
- source;
- revision.

Historical price series used for performance/technical analysis must not be mixed across incompatible methodologies silently.

---

# 7. Benchmark Provider Contract

Conceptual interface:

```text
BenchmarkProvider
- getObservation(benchmarkId, asOf)
- getSeries(benchmarkId, from, to)
```

Must preserve:

- benchmark identity;
- price-return vs total-return methodology;
- observation date;
- value;
- source;
- revision;
- freshness/quality.

The provider must not reconstruct VN30 index values from constituents unless an approved benchmark method explicitly allows it.

Official/selected benchmark observations remain authoritative for benchmark comparison.

---

# 8. VN30 Membership Provider Contract

Conceptual interface:

```text
VN30MembershipProvider
- getMembership(asOf)
- getMembershipHistory(from, to)
```

Normalized result must support effective-dated membership.

Rules:

- current list cannot rewrite historical membership;
- entrants/exits require effective dates;
- uncertain effective date remains unresolved;
- reconstitution triggers review, not automatic trade.

---

# 9. Sector Reference Provider Contract

Conceptual interface:

```text
SectorReferenceProvider
- getSectorAssignments(asOf)
- getSectorHistory(securityId)
```

Rules:

- taxonomy identity/version required;
- assignments effective-dated;
- no current-sector backfill into history;
- missing classification remains explicit.

---

# 10. Fundamental Data Provider Contract

Do not force one giant normalized financial statement schema prematurely.

Conceptual capability:

```text
FundamentalDataProvider
- getEvidence(securityId, requestedMetrics, asOf)
```

Normalized outputs should preserve:

- metric identity;
- period;
- value/text;
- unit;
- statement/source context;
- source document/reference;
- published date;
- as-of;
- revision;
- evidence classification;
- quality/confidence metadata.

M3 metric definitions own how evidence is scored.

Provider does not decide score.

---

# 11. Corporate Reference Provider

May provide:

- company identity;
- exchange/ticker metadata;
- corporate-action notices;
- reference dates;
- dividend notices;
- rights/split notices.

Corporate reference data does not itself post accounting effects.

Accounting consequences still flow through M2 transaction/corporate-action rules.

---

# 12. Manual Import as First-Class Provider

MVP must support operation without live APIs.

Recommended manual-provider model:

```text
CSV / Excel
   |
   v
Import Adapter
   |
   v
Normalized Observations
   |
   v
Persisted Source Dataset
   |
   v
Same Provider Ports / Queries
```

Manual data is not a second-class path.

It must use the same:

- provenance;
- as-of;
- validation;
- freshness;
- revision;
- conflict rules.

---

# 13. Provider Registry

Application configuration may maintain a provider registry by capability.

Example:

```text
PRICE -> ManualCsvPriceProvider
BENCHMARK -> ManualCsvBenchmarkProvider
FUNDAMENTALS -> ManualExcelFundamentalProvider
```

Later:

```text
PRICE -> VendorA
BENCHMARK -> VendorB
FUNDAMENTALS -> VendorC
```

Provider selection is infrastructure configuration, not investment methodology.

---

# 14. Source Priority

If more than one provider exists, priority must be explicit.

Recommended conceptual precedence:

```text
Approved authoritative source
> approved secondary source
> manual verified input
> provisional source
```

However exact source ranking is dataset-specific and must not be invented if upstream documents are silent.

If two sources conflict materially:

- retain both source records where appropriate;
- mark conflict;
- block/degrade dependent actionability;
- require explicit resolution.

Do not silently choose the numerically “closest” value.

---

# 15. Freshness Contract

Every provider output must support freshness evaluation.

Required timestamps:

```text
asOf / effectiveDate
publishedAt where applicable
retrievedAt/importedAt
```

Freshness is derived from the source observation date and approved freshness policy.

Rules:

- downloading old data now does not make it current;
- current calculation timestamp does not make stale input current;
- UI should display source as-of;
- actionability may be blocked by stale decision-critical data.

If no approved numeric freshness threshold exists, adapter does not invent one.

---

# 16. Revision and Correction Contract

Providers may revise historical data.

Normalized storage must support:

- source revision identity;
- superseded/replacement lineage where available;
- imported/retrieved timestamp;
- preservation of prior as-calculated analytical artifacts.

When a source correction arrives:

```text
New source revision
  -> persist new observation/revision
  -> invalidate affected derived outputs
  -> recalculate under current or requested method
```

Do not mutate old analytical records to pretend they were calculated using corrected data.

---

# 17. Security Identity Mapping

Vendor ticker is not enough.

Adapter must map provider identity to canonical `SecurityId`.

Mapping may use:

- exchange;
- ticker;
- issuer identifier;
- effective period;
- explicit mapping table.

If mapping is ambiguous:

- reject or quarantine observation;
- do not guess based on company-name similarity alone.

---

# 18. Units and Currency Normalization

Provider adapter must normalize:

- VND vs scaled VND;
- thousands/millions/billions;
- percentages vs decimal fractions;
- shares vs thousands of shares;
- raw vs adjusted price.

Every normalization must be explicit and testable.

Example prohibited behavior:

```text
provider returns 12.5
system guesses this means 12,500 VND
```

---

# 19. Missing Data Behavior

Provider adapter returns explicit missing state.

Do not:

- zero fill;
- forward fill fundamentals silently;
- invent benchmark value;
- substitute another metric without approved mapping.

Missing data propagates into:

- score validity/confidence;
- ranking;
- decision actionability;
- review warnings.

---

# 20. Provider Error Model

Common error categories:

- AUTHENTICATION_ERROR
- RATE_LIMITED
- NETWORK_ERROR
- TIMEOUT
- SOURCE_UNAVAILABLE
- SCHEMA_CHANGED
- INVALID_PAYLOAD
- IDENTITY_MAPPING_ERROR
- PARTIAL_DATA
- CONFLICTED_DATA

Provider errors must not become generic “no data” silently.

---

# 21. Retry Policy

MVP manual imports require no automatic network retry.

Future live provider adapters may retry transient failures.

Rules:

- bounded retries;
- backoff;
- no infinite loops;
- do not retry deterministic validation/schema errors automatically;
- preserve failure logs;
- failed refresh must not delete last known valid observation.

---

# 22. Partial Dataset Handling

A batch may be partially valid.

Rules:

- accepted/rejected records are explicit;
- rejected rows include reasons;
- no silent row drop;
- commit policy must be dataset-specific.

For decision-critical batch updates, the system may require all-or-nothing if partial commit could create misleading universe/ranking state.

Exact atomicity belongs to dataset-specific import schema.

---

# 23. Provider Health

Optional but useful status:

```text
ProviderHealth
- capability
- provider
- lastSuccess
- lastFailure
- lastDataAsOf
- status
```

Health must not be confused with data freshness.

A provider can be operational while serving stale source data.

---

# 24. Data Provenance

Every normalized observation should support backward navigation:

```text
Normalized Observation
   |
   +--> Provider
   +--> Source Reference
   +--> Import Batch / Retrieval Run
   +--> Raw row/payload reference where retained
```

This enables audit of:

> “Where did this number come from?”

---

# 25. Raw Payload Retention

Raw provider payload retention is optional and dataset-specific.

Retain raw payload/row evidence when useful for:

- audit;
- schema-change debugging;
- correction;
- reproducibility.

Do not retain unnecessary sensitive data.

Raw payload is evidence, not domain truth.

---

# 26. Cache Policy

Provider adapters may cache network responses.

Rules:

- cache key includes relevant query/as-of;
- cache must preserve source observation time;
- cache age is not source freshness;
- stale cache cannot masquerade as current observation;
- cache may be safely cleared.

No distributed cache is required.

---

# 27. Provider Independence

No domain/business module may contain logic such as:

```text
if provider == VendorA:
   use field x
```

All such transformations belong in infrastructure adapters.

Domain sees normalized contracts only.

---

# 28. Vendor Lock-In Test

A provider design passes only if:

1. manual provider can satisfy same normalized contract;
2. vendor can be replaced without changing scoring/decision code;
3. source provenance remains comparable;
4. provider-specific failures do not corrupt domain state.

---

# 29. Validation Layers

Provider data passes:

```text
Transport validation
  -> Schema validation
  -> Identity validation
  -> Unit normalization
  -> Domain/data-quality validation
  -> Conflict/duplicate validation
  -> Persistence
```

Each stage must preserve error context.

---

# 30. Manual Price Import Minimum Schema

At minimum:

```text
ticker/security identifier
price
as_of
currency
source
```

Recommended:

```text
exchange
adjustment status
source reference
revision
```

System supplies:

```text
imported_at
ImportBatchId
```

---

# 31. Manual Benchmark Import Minimum Schema

At minimum:

```text
benchmark_id
date
value
method_type
source
```

`method_type` must distinguish price return vs total return where known.

---

# 32. Manual VN30 Membership Import Minimum Schema

At minimum:

```text
security identifier
effective_from
effective_to optional
source
```

No effective date => cannot be treated as authoritative historical membership.

---

# 33. Manual Fundamental Import

Minimum schema varies by metric.

Common fields:

```text
security identifier
metric_id
period
value/text
unit
source
published_at
classification
```

Do not hardcode scoring formulas in importer.

---

# 34. Automated Data Update Workflow — Future

Future live refresh:

```text
Scheduled/manual refresh trigger
   |
   v
Provider adapter
   |
   v
Normalized observations
   |
   v
Validation/conflict detection
   |
   v
Persist
   |
   v
Selective invalidation
   |
   v
Recalculation
```

Refresh completion does not imply a trading decision.

---

# 35. Provider Configuration

Configuration may include:

- active provider by capability;
- API endpoint;
- credentials via environment/secrets;
- rate-limit settings;
- source-specific normalization config.

Must not include:

- investment thresholds;
- scoring weights;
- risk limits.

---

# 36. Security Requirements

Provider integrations must:

- keep secrets server-side;
- never expose provider tokens to browser;
- validate TLS for HTTPS providers;
- bound payload sizes;
- parse untrusted responses defensively;
- avoid arbitrary code evaluation;
- redact secrets from logs;
- apply least privilege where provider supports scopes.

Manual files remain untrusted input.

---

# 37. Testing Requirements

At minimum test:

## Price
- correct as-of mapping;
- stale data;
- missing data;
- duplicate;
- conflicting source revision;
- wrong currency/unit;
- identity mismatch.

## Benchmark
- price vs total return distinction;
- missing dates;
- stale observation;
- revision.

## Membership
- effective date;
- entrants/exits;
- overlap conflict;
- historical lookup.

## Fundamentals
- unit normalization;
- period mapping;
- FACT/ESTIMATE/ASSUMPTION;
- missing source;
- schema change.

## Provider failures
- timeout;
- rate limit;
- invalid payload;
- partial data;
- auth failure.

## Replacement
- run equivalent normalized contract through two provider adapters.

---

# 38. Acceptance Criteria

`MARKET_DATA_ADAPTER.md` is acceptable only if:

1. domain logic has no vendor dependency;
2. provider ports are capability-oriented;
3. manual CSV/Excel is first-class;
4. price has explicit as-of;
5. retrieved_at is not confused with as-of;
6. benchmark method compatibility is explicit;
7. membership/sector data is effective-dated;
8. fundamentals preserve source/period/classification;
9. identity mapping cannot guess ambiguously;
10. units/currency normalization is explicit;
11. missing data is never silently zero-filled;
12. conflicts are surfaced;
13. revisions preserve historical lineage;
14. stale data propagates into actionability;
15. provider errors preserve last known valid data;
16. raw provider shape stops at adapter boundary;
17. provider secrets stay server-side;
18. manual import and future API share normalized contracts;
19. provider replacement does not require scoring/decision rewrite;
20. no M1–M5 rule is changed.

---

# 39. Initial Multi-Role Review

## Product Manager

### Critical
0 unresolved.

### Major resolved
- Manual operation remains viable without paid/live APIs.
- Vendor selection does not block MVP.
- Provider failure degrades safely.

**Result:** PASS.

## Software Architect

### Critical
0 unresolved.

### Major resolved
- Replaced god-interface idea with capability ports.
- Normalized contracts isolate infrastructure.
- Provider replacement path is explicit.

**Result:** PASS.

## Portfolio Manager

### Critical
0 unresolved.

### Major resolved
- Stale/partial/conflicted data cannot silently support actionable decisions.
- Reconstitution remains review-trigger only.
- Benchmark/fundamental semantics remain separate from portfolio truth.

**Result:** PASS.

## Data Engineer

### Critical
0 unresolved.

### Major resolved
- Provenance/revision/as-of are mandatory.
- Identity/unit normalization is explicit.
- Partial batch/error semantics are defined.

**Result:** PASS.

## Security Reviewer

### Critical
0 unresolved.

### Major resolved
- Secrets remain server-side.
- Provider/file payloads treated as untrusted.
- Raw payload retention is constrained.

### Minor
- Exact credential storage and rotation belong to `SECURITY.md`.

**Result:** PASS.

---

# 40. Issue Register

## Critical unresolved

**0**

## Major unresolved

**0**

## Minor / Deferred

1. exact live provider/vendor;
2. exact source priority by dataset;
3. exact freshness thresholds where upstream is silent;
4. exact retry counts/backoff;
5. exact raw payload retention policy;
6. exact all-or-nothing commit policy per dataset;
7. exact provider health UI;
8. exact API rate-limit configuration.

These are later implementation/configuration concerns.

---

# 41. Approval Gate

Current state:

> **APPROVED BASELINE v1.0**

If approved:

1. promote `06_DASHBOARD/MARKET_DATA_ADAPTER.md` to **Approved Baseline v1.0**;
2. create/update its approved baseline artifact;
3. continue automatically to:
   **`06_DASHBOARD/AI_INTEGRATION.md`**;
4. do not move beyond `AI_INTEGRATION.md` until reviewed and approved.
