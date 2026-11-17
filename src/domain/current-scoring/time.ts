import {dateOnly,instant} from '@/shared/time';
import {check,keys} from '@/domain/scoring/validation';
export interface CurrentScoringTime {readonly contract:'current-scoring-time-v1';readonly purpose:'CURRENT_FORMAL_VALUATION';readonly economicCutoff:string;readonly evaluatedAt:string}
/** Temporal consistency only; never grants executable, assessment, source or PIT authority. */
export function validateCurrentScoringTime(input:{readonly currentPurpose:CurrentScoringTime;readonly asOf:string;readonly knownAt:string;readonly calculatedAt:string;readonly methodology:{readonly effectiveDate:string;readonly recordedAt:string}}){
 const p=input.currentPurpose;keys(p,'contract purpose economicCutoff evaluatedAt');
 check(Object.keys(p).length===4&&p.contract==='current-scoring-time-v1'&&p.purpose==='CURRENT_FORMAL_VALUATION','CURRENT_SCORING_PURPOSE_REQUIRED');
 dateOnly(p.economicCutoff);[p.evaluatedAt,input.asOf,input.knownAt,input.calculatedAt,input.methodology.recordedAt].forEach(instant);dateOnly(input.methodology.effectiveDate);
 check(p.economicCutoff===input.asOf.slice(0,10)&&input.asOf<=input.knownAt&&input.knownAt<=p.evaluatedAt&&p.evaluatedAt<=input.calculatedAt,'CURRENT_SCORING_TIME_MISMATCH');
 check(input.methodology.effectiveDate<=p.evaluatedAt.slice(0,10)&&input.methodology.recordedAt<=input.knownAt,'FUTURE_METHODOLOGY');return p;
}
