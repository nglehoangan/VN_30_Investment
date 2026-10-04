import type { ReviewCommand, ReviewTrigger, ReviewSection, ThesisReview, ReviewType } from "@/domain/workflow/contracts";
export interface CurrentSource {
 version:string;portfolioId:string;scope:"FORMAL"|"SYNTHETIC_TEST";asOf:string;receivedAt:string;ledgerWatermark:string;taxonomy:string;valuationMethodologyId:string;
 prices:readonly {id:string;securityId:string;price:string;currency:"VND";observedAt:string;receivedAt:string;validThrough:string|null;sourceReference:string;provider:string;revision:string;quality:"VALID"|"CONFLICTING_DATA"|"INVALID";policyReference:string|null;adjustment:"RAW"|"ADJUSTED"}[];
 references:{version:string;intervals:readonly {id:string;kind:"IDENTIFIER"|"MEMBERSHIP"|"COVERAGE"|"SECTOR";securityId:string|null;from:string;to:string|null;value:string;taxonomy:string|null;sourceReference:string}[]};
 referenceAsOf:string;referenceValidThrough:string|null;referencePolicy:string|null;
 reconciliation:{id:string;portfolioId:string;asOf:string;receivedAt:string;sourceReference:string;cash:string;positions:readonly {securityId:string;quantity:string;openCost:string|null}[];receivables:string|null;payables:string|null;unresolvedDiscrepancy:boolean}|null;
 analyst:{version:string;reviewer:string;asOf:string;receivedAt:string;validThrough:string;sourceReference:string;evidence:ReviewCommand["evidence"];sections:readonly ReviewSection[];theses:readonly ThesisReview[];triggers:readonly ReviewTrigger[];nextReview:string;governance:ReviewCommand["governance"]}|null;
}
export interface ReviewIntent {type:ReviewType;requestedDate:string;contributionReference:string|null;eventReference:string|null}
/** Only infrastructure may normalize external source records into this port. */
export interface CurrentSourceProvider { load(portfolioId: string): Promise<CurrentSource | null> }
