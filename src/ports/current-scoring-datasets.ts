import type {PreScoringContext,PreScoringDatasetReference} from './pre-scoring-datasets';
import type {CurrentValuationEvidence} from '@/domain/scoring/evidence';
export interface CurrentScoringFact {
 readonly id:string;readonly itemId:string;readonly value:string;readonly scope:string;
 readonly period:{readonly start:string;readonly end:string};readonly unit:string;
 readonly raw:{readonly path:string;readonly sha256:string};readonly evidence:CurrentValuationEvidence;
}
/** Explicit DI consumer receipt, not a numeric score or historical availability claim. */
export interface CurrentScoringDataset {
 readonly contract:'current-purpose-scoring-consumption-v1';
 readonly status:'ACCEPTED_CURRENT_DATA';readonly purpose:'CURRENT_FORMAL_VALUATION';
 readonly bindingId:string;readonly manifestHash:string;readonly parentDatasetId:string;readonly dataAcceptanceId:string;
 readonly context:Readonly<PreScoringContext>;readonly originalBindingKnownAt:string;
 readonly facts:readonly CurrentScoringFact[];readonly evidence:readonly CurrentValuationEvidence[];
 readonly history:readonly object[];readonly research:Readonly<Record<string,unknown>>;
 readonly price:Readonly<{ticker:string;securityId:string;date:string;value:string;unit:string;field:string;lineage:unknown}>;
 readonly shares:Readonly<{ticker:string;securityId:string;asOf:string;value:string;unit:string;status:string;lineage:unknown}>;
 readonly financialAssemblyComplete:true;readonly fullM3CoverageCertified:false;
 readonly gates:Readonly<{assessment:'NOT_GRANTED';M1:'NOT_GRANTED';confidence:'NOT_GRANTED';scoringAuthorization:'NOT_GRANTED'}>;
 readonly readyForScoring:false;readonly historicalPitGranted:false;readonly VNM17Promoted:false;
}
/** Trusted composition supplies the consumer; caller input is never a gate override. */
export interface CurrentScoringDatasets {
 resolve(reference:PreScoringDatasetReference,context:PreScoringContext):Promise<CurrentScoringDataset>;
}
