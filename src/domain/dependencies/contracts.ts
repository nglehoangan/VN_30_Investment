import type { Pin, Sealed, Purpose } from '@/domain/market-boundary/contracts';
export const DEPENDENCY_VERSION='authoritative-dependency-release-v1' as const;
export const PROJECTION_ID='production-dependencies-v1';
export const STATIC_CLASSES=['UNIVERSE','REFERENCE_DATA','INITIALIZATION','FUNDAMENTALS','LEVEL1_RELEASE','MARKET_CAPABILITY','SESSION_POLICY','POLICY','SCORING_MODEL','DECISION_ENGINE','RISK_POLICY'] as const;
export type DependencyClass=typeof STATIC_CLASSES[number]|'MARKET'|'PORTFOLIO'|'RISK_STATE';
export interface Head {
 readonly type:DependencyClass;readonly pin:Pin;readonly contract:string;readonly effectiveFrom:string;readonly recordedAt:string;
 readonly status:'ACCEPTED';readonly sourceReference:string;readonly authorityReference:string;
 readonly scheme:'JSON'|'BOUNDARY'|'SESSION';readonly content:unknown;
 readonly ownerId?:string;
 readonly requires:readonly {readonly type:DependencyClass;readonly pin:Pin}[];
}
export interface Release {
 readonly contract:typeof DEPENDENCY_VERSION;readonly id:string;readonly contentHash:string;readonly recordedAt:string;readonly effectiveFrom:string;
 readonly supersedes:Pin|null;readonly activationReason:string;readonly actor:'SYSTEM_ACCEPTED_ARTIFACTS';readonly heads:readonly Head[];
}
export interface Resolution {readonly mode:'PRODUCTION';readonly release:Pin;readonly purpose:Purpose;readonly requestedAsOf:string;readonly heads:readonly Head[]}
export interface Publication {
 readonly contract:'production-dependency-publication-v1';readonly id:string;readonly contentHash:string;readonly kind:'ANALYSIS'|'DECISION';readonly createdAt:string;
 readonly snapshot:Sealed<'ANALYSIS'>|Sealed<'DECISION'>;readonly analysisRelease:Pin;readonly decisionRelease:Pin|null;
}
export type ChangeEffect='REANALYSIS_REQUIRED'|'REVALIDATION_REQUIRED'|'NO_MATERIAL_EFFECT';
export function changeEffect(type:DependencyClass):ChangeEffect{return ['PORTFOLIO','RISK_STATE'].includes(type)?'REVALIDATION_REQUIRED':'REANALYSIS_REQUIRED';}
