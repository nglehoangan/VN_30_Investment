import 'server-only';
import type {PrismaClient} from '@/infrastructure/db/generated/client';
import type {Clock} from '@/ports/runtime';
import {systemClock} from '@/infrastructure/runtime';
import {qualifyFinancialPlan,type FinancialIngestRequest,type FinancialIngestPlan} from '@/infrastructure/source-admission/financial';
import {assertSourceMaterial,type SourceAdmissionTrust} from '@/infrastructure/source-admission/registry';
import {commitFinancialPlan,admissionEvent,assertNotRevoked,verifyStoredFinancialRaw} from '@/infrastructure/repositories/unified-admission';
import {PrismaFinancialAdmission} from '@/infrastructure/repositories/fundamental-admission';
import {snapshotHash as hash} from '@/infrastructure/fundamentals/snapshot-hash';
import {validateEvidence} from '@/domain/scoring/evidence';
import {instant} from '@/shared/time';
export {ingestRetainedCafef,ingestCafef} from './cafef-standing-services';
/** No route/production wiring. Dependencies come from trusted server composition, never request JSON. */
export async function ingestStandingFinancial(db:PrismaClient,root:string,q:FinancialIngestRequest,trust:SourceAdmissionTrust,clock:Clock=systemClock){
 const now=clock.now();instant(now);
 try{if(q.knownAt>now||q.ingestedAt>now)throw Error('FUTURE_OPERATIONAL_KNOWLEDGE');
  const operational={...q,knownAt:now,ingestedAt:now};
  const plan=qualifyFinancialPlan(root,operational,trust);return await commitFinancialPlan(db,root,plan);
 }catch(error){await admissionEvent(db,'QUARANTINE','financial-request:'+hash(q),now,{request:q,reason:String(error)});throw error;}
}
export async function revokeStandingFinancial(db:PrismaClient,id:string,reason:string,clock:Clock=systemClock){if(!reason.trim())throw Error('REVOCATION_REASON_REQUIRED');if(!await new PrismaFinancialAdmission(db).find(id))throw Error('UNKNOWN_FINANCIAL_ADMISSION');return admissionEvent(db,'REVOCATION',id,clock.now(),{reason});}
export async function consumeStandingFinancial(db:PrismaClient,root:string,id:string,trust:SourceAdmissionTrust,context:{ticker:string;securityId:string;economicAsOf:string;knownAt:string;purpose:'CURRENT_FORMAL_VALUATION'|'HISTORICAL_PIT'},clock:Clock=systemClock){
 if(context.purpose!=='CURRENT_FORMAL_VALUATION')throw Error('CURRENT_ONLY_NOT_PIT');
 const now=clock.now();instant(now);instant(context.knownAt);if(context.knownAt>now)throw Error('FUTURE_OPERATIONAL_KNOWLEDGE');
 await assertNotRevoked(db,id);
 const snapshot=await new PrismaFinancialAdmission(db).find(id) as (Awaited<ReturnType<PrismaFinancialAdmission['find']>>&{standingAdmission?:FinancialIngestPlan});
 if(!snapshot?.standingAdmission)throw Error('STANDING_FINANCIAL_ADMISSION_REQUIRED');
 const p=snapshot.standingAdmission,q=p.request;
 if(q.ticker!==context.ticker||q.securityId!==context.securityId||q.economicAsOf!==context.economicAsOf||q.knownAt>context.knownAt)throw Error('FINANCIAL_CONSUMPTION_SCOPE');
 await verifyStoredFinancialRaw(db,p);
 assertSourceMaterial(root,q.material,trust,context.knownAt);
 if(hash(qualifyFinancialPlan(root,q,trust))!==hash(p))throw Error('FINANCIAL_STORED_REPLAY_MISMATCH');
 const conflicts=validateEvidence(p.evidence,q.securityId,q.economicAsOf+'T23:59:59.999Z',context.knownAt,'CURRENT_FORMAL_VALUATION');
 if(conflicts.length||!p.evidence.length||p.quarantine.length)throw Error('UNQUALIFIED_FINANCIAL_CONSUMPTION');
 return {evidence:p.evidence,knownAt:context.knownAt,historicalPitGranted:false,readyForScoring:false};
}
