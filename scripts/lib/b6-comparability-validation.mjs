import assert from 'node:assert/strict';
/** Integer amounts in declared source units; no tolerance or implicit unit conversion. */
export function validateIssuerBridge(b){
 assert.equal(b.scope,'CONSOLIDATED');assert.equal(b.currency,'VND');
 assert.equal(b.multiplier,b.declaredUnit==='MILLION_CURRENCY'?'1000000':'1');
 assert(['MILLION_CURRENCY','CURRENCY'].includes(b.declaredUnit));
 assert.equal(b.periodEnd,'2025-12-31');assert.equal(b.periodBinding.originalClosingDate,b.periodEnd);
 assert.equal(b.periodBinding.sourceDocumentPeriodStart,'2026-01-01');assert.equal(b.periodBinding.sourceDocumentPeriodEnd,'2026-06-30');
 assert.equal(b.periodBinding.sourceOpeningDate,b.ticker==='FPT'?null:'2026-01-01');assert.equal(b.periodBinding.verified,true);
 assert(b.periodBinding.evidencePages.includes(b.bridgeEvidence.page));
 assert.equal(b.preserveOriginal,true);assert.equal(b.amountEqualityUsedToCreateMapping,false);
 assert.equal(new Set(b.adjustmentOperands.map(o=>o.captionKey)).size,b.adjustmentOperands.length);
 assert(b.adjustmentOperands.length>0);
 const delta=b.adjustmentOperands.reduce((sum,o)=>sum+BigInt(o.signedValue),0n);
 assert.equal(delta.toString(),b.adjustmentTotal);assert.equal((BigInt(b.originalValue)+delta).toString(),b.restatedValue);
 return {originalVnd:(BigInt(b.originalValue)*BigInt(b.multiplier)).toString(),restatedVnd:(BigInt(b.restatedValue)*BigInt(b.multiplier)).toString()};
}
export function validateSameMethodComparison(f,current,base){
 assert.equal(f.scopeBasis,'FTEL_EQUITY_METHOD_BOTH_PERIODS');assert.equal(f.organicGrowthAsserted,false);
 assert.equal(f.annualTTMComparable,false);assert.equal(f.page,18);assert.equal(f.ticker,'FPT');
 assert.equal(current.ticker,f.ticker);assert.equal(base.ticker,f.ticker);
 assert.equal(current.itemId,f.itemId);assert.equal(base.itemId,f.itemId);
 assert.equal(current.periodStart,'2026-01-01');assert.equal(current.periodEnd,'2026-06-30');
 assert.equal(base.periodStart,'2025-01-01');assert.equal(base.periodEnd,'2025-06-30');
 assert.equal(current.reportingScope,base.reportingScope);assert.equal(base.reportingScope,'CONSOLIDATED');
 assert.equal(current.normalized.unit,f.unit);assert.equal(base.normalized.unit,f.unit);
 assert.equal(current.normalized.currency,'VND');assert.equal(base.normalized.currency,'VND');
 assert.equal(current.normalized.value,f.currentValue);assert.equal(base.normalized.value,f.value);
 assert(BigInt(f.value)>0n);
}
