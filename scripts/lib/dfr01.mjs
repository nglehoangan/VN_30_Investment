/** Research-only selection and exact native-decimal arithmetic. No formal DTO construction. */
export const PILOT = Object.freeze(['FPT','VNM','BID','TCX','VIC','VHM']);
export const CONTRACT = 'dfr-01-research-provisional-v1';
export function rowDisposition(row, variant, original = {}) {
 const reasons = [...row.reasons];
 if (row.value === null) return {status:'MISSING', reasons:[...reasons, 'NO_ELIGIBLE_NUMERIC_VALUE']};
 if (original.conflicts?.length || reasons.some(x => /CONFLICT/.test(x))) return {status:'CONFLICT', reasons};
 if (row.source === 'CAFEF_REFERENCE') reasons.push('PROVIDER_REFERENCE_NOT_QUALIFIED_FOR_CALCULATION');
 if (!row.unit || !row.currency || !row.scale) reasons.push('UNIT_NOT_QUALIFIED');
 if (!['CONSOLIDATED','STANDALONE','PARENT'].includes(row.reportingScope)) reasons.push('SCOPE_NOT_QUALIFIED');
 if (variant.periodType !== 'ANNUAL') reasons.push('ANNUAL_BINDING_NOT_QUALIFIED');
 // Retained extraction alone never constitutes a caption/column/source-image review.
 return {status:'REFERENCE_ONLY', reasons:[...new Set([...reasons,'SOURCE_REVIEW_OR_EXACT_OVERLAY_REQUIRED'])]};
}
export function parentCapital(reading) {
 if (reading.periodEnd !== '2025-12-31' || reading.sourceColumn !== 'FY2025_CLOSING' ||
     reading.reviewMode !== 'FULL_SOURCE_PAGE_IMAGE_INSPECTED_BY_CHATGPT' || reading.nativeCurrency !== 'VND') throw Error('CAPITAL_BINDING_REQUIRED');
 const integer = x => {if (typeof x !== 'string' || !/^-?(0|[1-9]\d*)$/.test(x)) throw Error('EXACT_INTEGER_REQUIRED'); return BigInt(x);};
 if (!['1','1000000'].includes(reading.multiplier) || reading.nativeUnit !== (reading.multiplier === '1' ? 'VND' : 'MILLION_VND')) throw Error('UNIT_BINDING_REQUIRED');
 const total = integer(reading.selectedEquitySubtotalNative);
 if (reading.nciNative === null && reading.sourceScope !== 'STANDALONE') throw Error('NCI_MISSING');
 const nci = reading.nciNative === null ? 0n : integer(reading.nciNative);
 if (total <= 0n || nci > total) throw Error('INVALID_CAPITAL');
 return {value:((total-nci)*integer(reading.multiplier)).toString(), formula:reading.nciNative === null ? 'standaloneEquity * multiplier; NCI inapplicable' : '(reportedEquity - reportedNci) * multiplier', nciInapplicable:reading.nciNative === null};
}
export function dependentStatus(dependencies) {
 if (!dependencies.length || dependencies.some(x=>x.status === 'MISSING')) return 'MISSING';
 if (dependencies.some(x=>x.status === 'CONFLICT')) return 'CONFLICT';
 return dependencies.every(x=>x.status === 'SUPPORTED') ? 'SUPPORTED' : 'REFERENCE_ONLY';
}
export function requireResearchMode(mode) {if (mode !== 'AS_REVISED') throw Error('AS_KNOWN_REQUIRES_SEPARATE_PUBLICATION_CONTRACT');}
export function clusteredZeros(rows) {
 const numeric=rows.filter(r=>typeof r.value==='string'&&/^-?(0|[1-9]\d*)(\.\d+)?$/.test(r.value));
 return numeric.length>=5 && numeric.every(r=>/^0(\.0+)?$/.test(r.value));
}
/** Preserve raw API numeric tokens, including numbers beyond IEEE-754 precision. */
export function losslessJson(text) {
 return JSON.parse(text.replace(/"(?:\\.|[^"\\])*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g, token=>token.startsWith('"')?token:JSON.stringify(token)));
}
