export const TCX_2022_KNOWN_FINANCING: '8580234544957';
export const TCX_2022_MANAGED_PAYABLE: '5284485167173';
export function reconcileKetVang(proof:Record<string,unknown>): {
 classification:'A_FINANCING'|'B_NON_FINANCING'|'C_EXACT_PARTIAL_FINANCING'|'D_UNRESOLVED';
 ketVangCarryingAmount:string;
 qualifiedFinancingPortion:string|null;
 excludedNonFinancingPortion:string|null;
 canonicalFinancialDebt:string|null;
 status:'UNAVAILABLE'|'QUALIFIED';
 reason:string;
};
