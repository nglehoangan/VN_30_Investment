import type {PrismaClient,Prisma} from '@/infrastructure/db/generated/client';
import {PrismaFundamentals} from './fundamentals';
import {PrismaFinancialAdmission} from './fundamental-admission';
import {snapshotHash as hash} from '@/infrastructure/fundamentals/snapshot-hash';
import {canonicalJson} from '@/domain/fundamentals/snapshot';
import {sourceBytes,sha,type SourcePin} from '@/infrastructure/source-admission/registry';
import {financialIdentity,type FinancialIngestPlan} from '@/infrastructure/source-admission/financial';
type Db=PrismaClient|Prisma.TransactionClient;
export async function admissionEvent(db:Db,kind:'QUARANTINE'|'REVOCATION',target:string,knownAt:string,details:unknown){
 const body=canonicalJson({kind,target,knownAt,details}),id=hash({kind,target,knownAt,details});
 await db.$executeRawUnsafe('INSERT OR IGNORE INTO source_admission_event(id,kind,target_id,known_at,body,body_hash) VALUES(?,?,?,?,?,?)',id,kind,target,knownAt,body,sha(body));return id;
}
export async function assertNotRevoked(db:Db,id:string){const r=await db.$queryRawUnsafe<unknown[]>('SELECT id FROM source_admission_event WHERE kind=? AND target_id=?','REVOCATION',id);if(r.length)throw Error('FINANCIAL_ADMISSION_REVOKED');}
/** Raw source capture and governed canonical snapshot append in one existing-database transaction. */
export async function commitFinancialPlan(db:PrismaClient,root:string,plan:FinancialIngestPlan){
 return db.$transaction(async tx=>{
  const q=plan.request,id=plan.hybrid.snapshotId;await assertNotRevoked(tx,id);
  const repository=new PrismaFinancialAdmission(tx);
  const canonical={...plan.hybrid,standingAdmission:plan};
  const existing=await repository.find(id);if(existing){const previous=(existing as typeof existing & {standingAdmission?:FinancialIngestPlan}).standingAdmission;if(!previous||financialIdentity(previous.request)!==financialIdentity(q))throw Error('IMMUTABLE_FINANCIAL_ADMISSION_CONFLICT');return {id,duplicate:true};}
  if(!plan.evidence.length||plan.quarantine.length||plan.hybrid.unresolvedIssuerConflicts.length)throw Error('UNQUALIFIED_FINANCIAL_BATCH');
  const sourceId='standing-financial-current-v1',rawRepo=new PrismaFundamentals(tx);
  if(!await rawRepo.findSource(sourceId))await rawRepo.appendSource({id:sourceId,provider:'STANDING_RETAINED',documentationReference:q.material.policy.path,termsReference:q.material.authorization.path,adapterVersion:'retained-qualified-extraction-v1',schemaVersion:'unified-current-financial-plan-v1',coverageLimitations:['Exact qualified bundle only; no blanket financial completeness'],temporalLimitations:['Current valuation only; no historical PIT authority'],recordedAt:q.ingestedAt});
  const batchId='standing-batch:'+hash(q);
  const captureId=(p:SourcePin)=>'standing-raw:'+hash({sourceId,p,batchId});
  const captures=q.material.sourceBindings.map(p=>{const bytes=sourceBytes(root,p),payload=bytes.toString('base64');return {id:captureId(p),sourceVersionId:sourceId,importExecutionId:batchId,requestFingerprint:hash(p),resourceReference:p.path,sourceRecordId:p.path,sourceRecordVersion:p.sha256,retrievedAt:q.ingestedAt,mediaType:'application/octet-stream;base64',responseStatus:200,payload,payloadHash:sha(payload)};});
  // The capture time here records migration receipt, never replaces original receipt in plan/evidence.
  await rawRepo.appendImport({id:batchId,sourceVersionId:sourceId,requestFingerprint:hash(q),startedAt:q.ingestedAt,completedAt:q.ingestedAt,ingestedAt:q.ingestedAt,completion:'COMPLETE',captureIds:captures.map(c=>c.id),errors:[]},captures);
  await repository.append(canonical,q.previousManualSnapshotId,q.ingestedAt);
  return {id,duplicate:false};
 });
}

export async function verifyStoredFinancialRaw(db:Db,plan:FinancialIngestPlan){
 const sourceId='standing-financial-current-v1',batchId='standing-batch:'+hash(plan.request),repository=new PrismaFundamentals(db);
 for(const p of plan.request.material.sourceBindings){
  const c=await repository.findCapture('standing-raw:'+hash({sourceId,p,batchId}));
  if(!c||c.sourceRecordVersion!==p.sha256||c.resourceReference!==p.path||c.importExecutionId!==batchId||c.mediaType!=='application/octet-stream;base64'||sha(Buffer.from(c.payload,'base64'))!==p.sha256)throw Error('STORED_RAW_FINANCIAL_LINK_MISMATCH');
 }
}
