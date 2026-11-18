import type {calculateScorecard} from '@/domain/current-scoring/scorecard';
export type CurrentPublishedCard=ReturnType<typeof calculateScorecard>;
export interface CurrentPublicationSubject {readonly scorecardId:string;readonly scorecardHash:string;readonly datasetHash:string;readonly methodologyHash:string;readonly reviewHash:string}
/** Trusted server registration capability, never supplied by URL/form or a caller PASS. */
export interface CurrentReleaseGate {readonly authorityReference:string;readonly authorityHash:string;verify(operation:'MATERIALIZE'|'PUBLISH'|'READ',subject:CurrentPublicationSubject,deploymentHash?:string):Promise<void>}
export interface CurrentPublishedScores {find(id:string):Promise<CurrentPublishedCard|null>;latest():Promise<readonly CurrentPublishedCard[]>}
export const closedCurrentReleaseGate:CurrentReleaseGate={authorityReference:'UNCONFIGURED',authorityHash:'0'.repeat(64),async verify(){throw Error('CURRENT_RELEASE_AUTHORIZATION_REQUIRED');}};
