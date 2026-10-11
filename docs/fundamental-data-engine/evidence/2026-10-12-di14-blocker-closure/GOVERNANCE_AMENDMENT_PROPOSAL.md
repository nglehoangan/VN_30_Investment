# Governance amendment proposal — Slice 08B

NO APPROVED DOCUMENT MODIFIED.

Status: PROPOSED_AWAITING_PROJECT_OWNER_APPROVAL. Both defects remain open. No implementation or self-approval is permitted.

## CASA_ISSUER_PERIMETER_MAPPING_CONTRACT

Approved M3: (current accounts + savings accounts) / customer deposits; bank-reported definitions where available.

Formula is preserved. The amendment supplies the absent source-specific savings/product/perimeter rules and reported-versus-derived admissibility; M3 currently supplies none of those executable mappings.

**numerator**: BANK_CURRENT_AND_SAVINGS_DEPOSITS: sum only explicitly disclosed current-account and savings-account balances belonging to the owner-approved issuer CASA definition. Demand deposits alone are not evidence of that sum. Do not include all term savings or Auto-Earning products by name; require their evidenced classification and inclusion/exclusion decision.

**denominator**: BANK_CUSTOMER_DEPOSITS: gross customer-deposit balance for the identical issuer, reporting perimeter and as-of date. Exclude interbank, central-bank deposits and issued debt unless an explicitly approved issuer definition states otherwise; any departure must be separately labelled and owner-approved, not silently replace M3 denominator.

**allowedReportingPerimeter**: Owner specifies customer/product populations and exclusions per bank. A reported CASA ratio is usable only when both numerator and denominator match that approved product/perimeter contract and their authority is evidenced.

**issuerDisclosureAuthority**: Qualified issuer financial report, signed disclosure or issuer investor-relations release with exact metric definition/table and disclosure evidence. Being issuer-hosted does not itself approve a product/perimeter mapping.

**regulatoryDisclosureAuthority**: Qualified regulator disclosure with exact issuer and metric perimeter can corroborate or supply inputs only after an owner-approved equivalent-perimeter bridge. Not automatically interchangeable with issuer CASA.

**consolidatedStandalone**: Match the exact required reportingScope. No standalone fallback, scope aggregation or regulatory-to-VAS bridge without separately owner-approved scope/issuer/period bridge.

**periodCompatibility**: Stock amounts and reported ratio must refer to the same explicit as-of date. Do not use publication/signing date as economic period or combine adjacent periods.

**currencyUnit**: Amounts must have matching currencies and approved unit scaling. No FX inference. Ratio is dimensionless; percent and decimal representation require explicit conversion. Never mix balances with percentages or zero-fill missing inputs.

**conflictHandling**: Retain all source occurrences. Resolve only through the existing explicit comparable revision chain or governed equivalence proof; differing definitions/scopes are incompatible rather than competing comparable facts. Comparable unresolved conflicts block the affected mandatory path.

**PIT**: Apply frozen AS_KNOWN policy independently to every operand and definition/bridge. Publication, provider authority, mapping knowledge and correction-known-at must be evidenced and at/before the pinned cutoff. UNKNOWN stays UNKNOWN. Signing date/local receipt/filename do not establish public disclosure.

**sourcePrecedence**: No automatic issuer/regulator/audited/latest-document priority. Source rank, if ever desired, is a separate owner-approved versioned amendment; none is proposed here.

**bankSpecificApplicability**: Owner approves an explicit bank-by-bank, period-effective mapping table: exact issuer, authority, product/class set, source captions, scope, unit and version. No cross-bank caption alias or Auto-Earning/savings assumption.

Owner decisions:

- Approve exact numerator and denominator populations
- Approve permitted reporting scope and bridges, if any
- Approve source authorities and effective bank-specific mappings
- Approve reported-ratio admissibility and period/unit/PIT rules
- Confirm no automatic source precedence

## NPL_REGULATORY_PERIMETER_MAPPING_CONTRACT

Approved M3: NPL / gross customer loans; follow reported regulatory definition and disclose changes; coverage uses consistent NPL definition.

Formula and regulatory-definition/change-disclosure obligation are preserved. The amendment defines the absent gross-versus-net/class-population/basis bridge and source authority contract; coverage must reuse the same approved NPL definition.

**grossNPLNumerator**: BANK_NPL_AMOUNT: gross outstanding balance classified non-performing under the explicitly identified regulatory classification version/class set in the qualified disclosure, before deduction of reserves. Owner approves the enumerated class set and treatment of restructured, purchased, written-off/off-balance exposures; no unnamed regulatory convention or net-loan proxy is inferred.

**grossCustomerLoanDenominator**: BANK_GROSS_CUSTOMER_LOANS: gross customer lending before impairment reserves, for the identical regulatory population, issuer, scope and as-of date. Interbank exposure, securities and non-customer credit are excluded unless explicitly included by the separately approved definition. Derived ratio requires both compatible operands.

**regulatoryLoanClassPerimeter**: Record exact class identifiers/labels, regulatory authority/version, effective dates, included loan/product populations and definition changes. Store a reported NPL ratio only where that disclosure matches the owner-approved gross numerator/gross customer-loan denominator contract.

**VASRegulatoryCompatibility**: VAS presentation is not proof of regulatory classification or identical population. Require an explicit evidenced reconciliation/bridge with owner approval when bases differ. A basis mismatch remains blocked without that bridge.

**issuerAuthority**: Qualified issuer statement/credit-quality note/regulatory disclosure identifying the regulatory definition and version; preserve exact disclosure context and issuer/perimeter.

**regulatoryAuthority**: Qualified regulator disclosure identifying issuer, classification version, scope and population. No precedence over issuer evidence; resolve comparable conflicts using existing lineage only.

**consolidatedStandalone**: Match the exact required reportingScope. No standalone fallback, scope aggregation or regulatory-to-VAS bridge without separately owner-approved scope/issuer/period bridge.

**periodCompatibility**: Stock amounts and reported ratio must refer to the same explicit as-of date. Do not use publication/signing date as economic period or combine adjacent periods.

**currencyUnit**: Amounts must have matching currencies and approved unit scaling. No FX inference. Ratio is dimensionless; percent and decimal representation require explicit conversion. Never mix balances with percentages or zero-fill missing inputs.

**conflictHandling**: Retain all source occurrences. Resolve only through the existing explicit comparable revision chain or governed equivalence proof; differing definitions/scopes are incompatible rather than competing comparable facts. Comparable unresolved conflicts block the affected mandatory path.

**PIT**: Apply frozen AS_KNOWN policy independently to every operand and definition/bridge. Publication, provider authority, mapping knowledge and correction-known-at must be evidenced and at/before the pinned cutoff. UNKNOWN stays UNKNOWN. Signing date/local receipt/filename do not establish public disclosure.

**sourcePrecedence**: No automatic issuer/regulator/audited/latest-document priority. Source rank, if ever desired, is a separate owner-approved versioned amendment; none is proposed here.

**bankSpecificApplicability**: Owner approves an explicit bank-by-bank, period-effective mapping table: exact issuer, authority, product/class set, source captions, scope, unit and version. No cross-bank caption alias or Auto-Earning/savings assumption.

Owner decisions:

- Approve gross NPL and gross customer-loan populations
- Approve enumerated regulatory loan classes/version
- Approve VAS/regulatory and scope compatibility/bridges
- Approve issuer/regulator authority and period/PIT/conflict rules

All approved authority SHA-256 values match the preserved authority input. See JSON for exact hashes and comparison.

STOPPED until explicit Project Owner approval of versioned amendment. No registry/crosswalk/mapping/executable source or M1–M3 amendment performed.
