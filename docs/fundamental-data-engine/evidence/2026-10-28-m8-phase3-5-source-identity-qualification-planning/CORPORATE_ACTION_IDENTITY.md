# Corporate-action identity requirements

2026-10-28 · SOURCE_IDENTITY_QUALIFICATION_PLANNING_ONLY · DESIGN, NOT ACCEPTANCE

Proposed EntitlementIdentityV1 binds portfolio/private account, original ledger security, legal instrument, issuer/depository event, broker allocation/entitlement, source terms/hash and applicable dates, quantity/amount/unit, event stage and predecessors/corrections. If any required identity/date is unknown, preserve UNKNOWN and deny affected qualification; do not allocate an invented action ID or posting.

|Fact|Meaning|
|---|---|
|Legal entitlement|Right created by applicable legal/event terms for the relevant holder/date|
|Economic ownership|Evidenced account economic interest, including qualifying claims/rights, not automatically a tradable ordinary share|
|Recorded quantity|Existing immutable ledger aggregate; source integrity does not prove all economic rights|
|Pending quantity|Disjoint uncredited/unavailable event allocation, with identity and stage proved separately|
|Tradable quantity|Dated shares eligible for trading after restrictions, not all economically owned units|

**Cash dividend:** Issuer action/event ID, record/ex/payable dates, account entitlement/allocation ID, security anchor, gross/net/tax basis, exact receipt/payment ID. Claim/receipt identity is separate from cash movement; equal amount is not a link; never an external contribution.

**Stock dividend:** Issuer/depository action ID, terms/ratio/rounding, record/allocation/credit dates, account quantity and current status. Legal entitlement, allocated pending shares, credited ordinary and tradable quantity are different facts.

**Bonus shares:** Exact legal action/terms, account allocation and quantity/rounding/lifecycle evidence. Model identity requirements only; no new unsupported BONUSposting or automatic availability.

**Rights issue:** Distinct right/instrument/action ID, record/subscription/exercise/payment/allocation/expiry evidence. Rights are not ordinary shares; subscription obligations/cash must not be omitted; no automatic equivalent pricing.

**Stock split:** Instrument/action identity, official ratio/effective date, account quantity adjustment and RAWprice alignment. Existing engine must own any authorized replay; no manual quantity/price adjustment in identity reader.

**Pending shares:** Origin entitlement/action/allocation ID, disjoint pending/ordinary quantities and dated credit/trading notices. Do not infer conversion date or ordinary eligibility from aggregate/current ticker.

**Settlement completion:** Exact originating trade/claim/event, settlement reference/date/account and quantity/cash legs. Settlement identity does not follow from a matching balance or source flag alone.

**Trading availability:** Dated account status plus applicable exchange/depository/broker restriction/release evidence. Available/tradable is distinct from legal entitlement, economic ownership and recorded quantity.

FPTunresolved example: historical evidence has200ordinary+20pending inside aggregate220. Neither a new master observation nor unchanged ISIN proves the20converted, and no conversion date is assumed. Identity of ordinary FPTmay eventually qualify for a narrow scope while pending entitlement/lifecycle remains unresolved; that does not qualify full holdings/NAV. Reclassification must not produce220+20=240. No hard-coded FPTquantities, accepted conversion or CApostings are introduced.

GAS475000/MWG95000claim identity and MWG16Octreceipt require issuer/action/NETallocation/payment linkage; aggregate570000and equal95000credit do not establish it. Stock-dividend/bonus/rights identity design does not authorize unsupported accounting transaction types. Existing engine/forward-intake restrictions and approved cost-basis methodology remain unchanged; any future supported event posting is a separate authorized operation.
