import 'server-only';
import {sourceBytes} from './registry';
import {snapshotHash as hash} from '@/infrastructure/fundamentals/snapshot-hash';
import {CurrentScorePublications} from './current-publication';
import {registeredCurrentScoreReader} from './registered-current-reader';
import {assertNotRevoked} from '@/infrastructure/repositories/unified-admission';
import type {PrismaClient} from '@/infrastructure/db/generated/client';
import type {CurrentReleaseGate,CurrentPublicationSubject,CurrentPublishedScores} from '@/ports/current-publication';

export const PUB04_REGISTRATION='docs/fundamental-data-engine/vnm-pub04/2026-11-18/PUB04_SERVER_REGISTRATION.json';
// Exact owner-authorized content. Neither URL parameters nor env flags select authority.
const APPROVED_FILE_SHA='a8cefa3008056ca8ca5b4d56ed2224577954eff18e700b9c90d1f1b9f07e82d6';
export function pub04Gate(db:PrismaClient,root=process.cwd()):CurrentReleaseGate{
 const read=()=>{
  const a=JSON.parse(sourceBytes(root,{path:PUB04_REGISTRATION,sha256:APPROVED_FILE_SHA}).toString());
  const {contentHash,...body}=a;
  if(a.contract!=='pub04-exact-read-only-authority-v1'||a.status!=='APPROVED'||hash(body)!==contentHash||a.ownerStatement!=='approval PUB-04'||!sourceBytes(root,a.ownerSource).toString().includes(a.ownerStatement)||a.ticker!=='VNM'||a.purpose!=='CURRENT_FORMAL_VALUATION'||a.tradingAuthorized!==false||a.historicalPitGranted!==false||a.rescoringAuthorized!==false)throw Error('PUB04_OWNER_AUTHORITY_REQUIRED');
  return a;
 };
 const accepted=read();
 return {authorityReference:accepted.id,authorityHash:accepted.contentHash,async verify(operation,subject){
  const current=read();await assertNotRevoked(db,current.id);
  const exact:CurrentPublicationSubject={scorecardId:subject.scorecardId,scorecardHash:subject.scorecardHash,datasetHash:subject.datasetHash,methodologyHash:subject.methodologyHash,reviewHash:subject.reviewHash};
  if(!['READ','PUBLISH'].includes(operation)||!current.permissions.includes(operation)||hash(exact)!==hash(current.subject)||current.contentHash!==accepted.contentHash)throw Error('PUB04_EXACT_SUBJECT_OR_PERMISSION_REQUIRED');
 }};
}
/** Read-only server capability; publish() is deliberately not exposed to the dashboard. */
export function registeredCurrentPublications(db:PrismaClient,root=process.cwd()):CurrentPublishedScores{
 const service=new CurrentScorePublications(db,registeredCurrentScoreReader(db,root),pub04Gate(db,root));
 return {find:id=>service.find(id),latest:()=>service.latest()};
}
