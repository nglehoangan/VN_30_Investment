/** Evidence diagnostics only. Never maps aliases, creates adjustments, or establishes public clocks. */
export const MAPPING_CLASSES=['MAPPING_RULE_MISSING','CANONICAL_ITEM_MISMATCH','DEFINITION_MISMATCH','SCOPE_MISMATCH','PERIOD_MISMATCH','WINDOW_CONSTRUCTION_MISSING','REVISION_SELECTION_PENDING','PIT_SELECTION_PENDING','OTHER'];
export function classifyMappingOperand({itemId,operation,exactFacts=[],selectedIds=[],otherScopeFacts=[],otherPeriodFacts=[],sourceCells=[],captionCandidates=[],unknownIds=[],conflict=false,freshnessBlocked=false}){
 if(operation==='HUMAN_NORMALIZED')return {classification:'DEFINITION_MISMATCH',disposition:'HUMAN_INVESTMENT_JUDGMENT',reason:'Frozen HUMAN_NORMALIZED route requires independently reviewed normalized earnings; reported profit is not a zero-adjustment substitute.'};
 if(exactFacts.some(o=>selectedIds.includes(o.id)))return {classification:'OTHER',disposition:'RESOLVED_VALID_SELECTED_OPERAND',reason:'Exact frozen item, period, scope, definition, currency and unit is selected in governed AS_KNOWN snapshot.'};
 if(conflict)return {classification:'REVISION_SELECTION_PENDING',disposition:'SELECTOR_REVIEW_REQUIRED',reason:'Exact occurrences are retained but governed selector has unresolved roots, revision or comparison context.'};
 if(exactFacts.some(o=>unknownIds.includes(o.id)))return {classification:'PIT_SELECTION_PENDING',disposition:'PIT_UNKNOWN',reason:'Exact canonical operand exists; public boundary authority is missing. Local retrieval is not publication evidence.'};
 if(exactFacts.length)return {classification:'OTHER',disposition:freshnessBlocked?'FRESHNESS':'SOURCE_CONTEXT_REVIEW_REQUIRED',reason:'Canonical fact exists but is not eligible in the actual selector; inspect source quality, freshness and comparison-context findings.'};
 if(otherScopeFacts.length)return {classification:'SCOPE_MISMATCH',disposition:'SCOPE_PERIOD_MISMATCH',reason:'Required scope differs from retained exact-period facts; no standalone fallback invented.'};
 if(itemId==='CAPEX')return {classification:'CANONICAL_ITEM_MISMATCH',disposition:'GOVERNANCE_MAPPING_GAP',reason:'CASH_CAPEX_REPORTED includes other long-term assets. Frozen CAPEX requires explicit issuer expenditure reconciliation; no blanket alias/negation permits it.'};
 if(itemId==='BANK_CURRENT_AND_SAVINGS_DEPOSITS')return {classification:'DEFINITION_MISMATCH',disposition:'GOVERNANCE_MAPPING_GAP',reason:'Demand-deposit caption alone does not establish the issuer reported CASA perimeter (including savings or issuer-specific Auto-Earning); frozen exact-definition bridge is absent.'};
 if(itemId==='BANK_NONPERFORMING_LOANS'&&!sourceCells.length)return {classification:'MAPPING_RULE_MISSING',disposition:'GOVERNANCE_MAPPING_GAP',reason:'Search hits include regulatory groups 3/4/5 or narrative NPL. Frozen REPORTED route has no approved group-sum/caption-to-total rule bound to this source column and regulatory perimeter.'};
 if(sourceCells.length)return {classification:'OTHER',disposition:'SOURCE_CONTEXT_REVIEW_REQUIRED',reason:'Two-reader cell retained; normalization/qualification/definition/column review failed. No invented mapping or document request.'};
 if(otherPeriodFacts.length)return {classification:'PERIOD_MISMATCH',disposition:'SCOPE_PERIOD_MISMATCH',reason:'Other economic periods are retained; source-caption hits do not establish the exact required column.'};
 return {classification:'OTHER',disposition:'SOURCE_CONTEXT_REVIEW_REQUIRED',reason:captionCandidates.length?'Caption-search evidence exists, but exact caption/column/year/unit agreement was not proved by the two-reader governed extractor. Earlier EXISTS_NOT_MAPPED was a search-candidate label, not verified operand presence.':'No verified exact cell. See all retained-source searches before deciding source absence.'};
}
export function adjustmentDependency(operation){
 if(operation==='HUMAN_NORMALIZED')return {classification:'HUMAN_INVESTMENT_JUDGMENT',workflow:'INDEPENDENT_REVIEWED_NORMALIZED_EARNINGS',mechanical:false,financialPdfMissing:false,adjustmentCreated:false};
 if(operation==='ACTION_ADJUSTED')return {classification:'MECHANICAL_REVIEW_CONTEXT',workflow:'EXACT_GOVERNED_CORPORATE_ACTION_FACTOR_REQUIRED',mechanical:true,financialPdfMissing:false,adjustmentCreated:false};
 throw Error('NOT_A_REVIEWED_ADJUSTMENT_OPERATION');
}
/** Existing proof must match the exact qualification context. No date or audit preference. */
export function existingQualificationForContext(qualifications,bodyHash,period,reportingScope){
 const dimensions=['start','end','type','fiscalYear','fiscalQuarter','calendarReference'];
 return qualifications.find(q=>q.status==='QUALIFIED'&&q.bodyHash===bodyHash&&q.reportingScope===reportingScope&&q.period&&period&&dimensions.every(k=>q.period[k]===period[k]))??null;
}
