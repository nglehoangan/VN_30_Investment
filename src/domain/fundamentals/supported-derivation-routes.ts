import type {RegistryRelease} from './contracts';
import type {DerivationCrosswalk} from './derivation';
import {validateCrosswalk} from './derivation';
import {requireFundamental} from './validation';
/** Approved §13.1 through-cycle securities ROE uses existing §4.1 common profit/equity formula.
 * Produces a PROPOSED crosswalk only. No source mapping, normalization review or approval is inferred. */
export function proposeSecuritiesRoeRoute(base:DerivationCrosswalk,registry:RegistryRelease,recordedAt:string){
 validateCrosswalk(base,registry);
 requireFundamental(!base.routes.some(r=>r.sector==='SECURITIES'&&r.metric==='ROE'),'SECURITIES_ROE_ROUTE_ALREADY_EXISTS');
 const proposed:DerivationCrosswalk={...base,version:'securities-roe-crosswalk-proposal-v1',recordedAt,governanceStatus:'PROPOSED',approvalReference:null,
  authorityReferences:[...new Set([...base.authorityReferences,'docs/03 SCORING/METRIC_DEFINITIONS.md#bq-eq-02','docs/03 SCORING/SECTOR_NORMALIZATION.md#131-securities--brokerage'])],
  routes:[...base.routes,{sector:'SECURITIES',metric:'ROE',operands:[{role:'normalized_common_profit',itemId:'NET_INCOME_ATTRIBUTABLE_COMMON',operation:'HUMAN_NORMALIZED'},{role:'average_common_equity',itemId:'COMMON_EQUITY',operation:'AVERAGE_ENDPOINTS'}]}]};
 return validateCrosswalk(proposed,registry);
}
