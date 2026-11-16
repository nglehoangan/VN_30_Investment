export interface PreScoringContext {ticker:string;securityId:string;economicCutoff:string;knownAt:string;purpose:string}
/** Data readiness only. A binding is not a scoring/DI/assessment authorization. */
export interface PreScoringDatasetReference {
 readonly contract:'current-purpose-pre-scoring-reference-v1';
 readonly bindingId:string;
 readonly context:Readonly<PreScoringContext>;
 readonly manifestHash:string;
 readonly permitsScoring:false;
 readonly historicalPitGranted:false;
}
export interface PreScoringDatasets {
 prepare(datasetId:string,context:PreScoringContext):Promise<PreScoringDatasetReference>;
 verify(reference:PreScoringDatasetReference,context:PreScoringContext):Promise<void>;
}
