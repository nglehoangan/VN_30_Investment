/** Targeted review arithmetic only. Does not change the approved securities metric or admission contract. */
export const TCX_2022_KNOWN_FINANCING='8580234544957';
export const TCX_2022_MANAGED_PAYABLE='5284485167173';
export function reconcileKetVang(proof){
 const unresolved=reason=>({classification:'D_UNRESOLVED',ketVangCarryingAmount:TCX_2022_MANAGED_PAYABLE,qualifiedFinancingPortion:null,excludedNonFinancingPortion:null,canonicalFinancialDebt:null,status:'UNAVAILABLE',reason});
 if(proof.status!=='VERIFIED'||proof.issuer!=='TCX'||proof.end!=='2022-12-31'||proof.measurement!=='CLOSING_CARRYING_AMOUNT')return unresolved('FY2022_ISSUER_CONTRACTUAL_PROOF_REQUIRED');
 if(!proof.sources?.length||!proof.sources.every(s=>s.issuer==='TCX'&&/^[a-f0-9]{64}$/.test(s.sha256)&&s.locator))return unresolved('RETAINED_ISSUER_PROOF_REQUIRED');
 if(proof.coveredPopulation!==TCX_2022_MANAGED_PAYABLE||!proof.contractAppliesToFY2022||!proof.exactPopulationReconciliation)return unresolved('EXACT_FULL_POPULATION_AND_PERIOD_BRIDGE_REQUIRED');
 if(!proof.outsideBankSubtotal||!proof.outsideBondSubtotal)return unresolved('NO_DOUBLE_COUNTING_PROOF_REQUIRED');
 if(!/^\d+$/.test(proof.financingPortion??''))return unresolved('EXACT_SPLIT_REQUIRED');
 const portion=BigInt(proof.financingPortion),total=BigInt(TCX_2022_MANAGED_PAYABLE);
 if(portion>total)return unresolved('FINANCING_PORTION_EXCEEDS_POPULATION');
 if(portion>0n&&(!proof.issuerFinancingUseProven||!proof.directPrincipalObligationProven||!proof.financingReturnObligationProven))return unresolved('FINANCING_NATURE_NOT_PROVEN');
 if(portion<total&&!proof.excludedPopulationNonFinancingProven)return unresolved('NON_FINANCING_EXCLUSION_NOT_PROVEN');
 return {classification:portion===total?'A_FINANCING':portion===0n?'B_NON_FINANCING':'C_EXACT_PARTIAL_FINANCING',ketVangCarryingAmount:TCX_2022_MANAGED_PAYABLE,qualifiedFinancingPortion:portion.toString(),excludedNonFinancingPortion:(total-portion).toString(),canonicalFinancialDebt:(BigInt(TCX_2022_KNOWN_FINANCING)+portion).toString(),status:'QUALIFIED',reason:'ISSUER_CONTRACTUAL_POPULATION_PROOF'};
}
