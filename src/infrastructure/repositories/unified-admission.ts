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
  // Compare governed snapshots, not unadmitted research inventories. Never latest-wins across runs.
  const previousRows=await tx.$queryRawUnsafe<{id:string}[]>(`SELECT r.id FROM fundamental_admission_run r WHERE json_extract(r.body,'$.standingAdmission.request.ticker')=? AND NOT EXISTS (SELECT 1 FROM source_admission_event e WHERE e.kind='REVOCATION' AND e.target_id=r.id)`,q.ticker);
  const key=(f:FinancialIngestPlan['hybrid']['canonicalFacts'][number])=>hash({ticker:f.ticker,item:f.itemId,period:f.period,scope:f.scope,unit:f.unit,currency:f.currency});
  for(const row of previousRows){const previous=await repository.find(row.id);if(!previous)throw Error('ACCEPTED_FINANCIAL_SNAPSHOT_MISSING');for(const fact of plan.hybrid.canonicalFacts){if(previous.canonicalFacts.some(old=>key(old)===key(fact)&&old.value!==fact.value))throw Error('FINANCIAL_OBSERVATION_CONFLICT_WITH_ACCEPTED_SNAPSHOT');}}

  const sourceId='standing-financial-current-v1',rawRepo=new PrismaFundamentals(tx);
  if(!await rawRepo.findSource(sourceId))await rawRepo.appendSource({id:sourceId,provider:'STANDING_RETAINED',documentationReference:q.material.policy.path,termsReference:q.material.authorization.path,adapterVersion:'retained-qualified-extraction-v1',schemaVersion:'unified-current-financial-plan-v1',coverageLimitations:['Exact qualified bundle only; no blanket financial completeness'],temporalLimitations:['Current valuation only; no historical PIT authority'],recordedAt:q.ingestedAt});
  const batchId='standing-batch:'+hash(q);
  const captures=q.material.sourceBindings.flatMap(p=>{
   const bytes=sourceBytes(root,p),parts=Math.max(1,Math.ceil(bytes.length/2_000_000));
   return Array.from({length:parts},(_,part)=>{const payload=bytes.subarray(part*2_000_000,(part+1)*2_000_000).toString('base64');return {id:'standing-raw:'+hash(parts===1?{sourceId,p,batchId}:{sourceId,p,batchId,part}),sourceVersionId:sourceId,importExecutionId:batchId,requestFingerprint:hash(p),resourceReference:p.path,sourceRecordId:parts===1?p.path:p.path+'#part='+part+'/'+parts,sourceRecordVersion:p.sha256,retrievedAt:q.ingestedAt,mediaType:parts===1?'application/octet-stream;base64':'application/octet-stream;base64;part='+part+'/'+parts,responseStatus:200,payload,payloadHash:sha(payload)};});
  });
  // The capture time here records migration receipt, never replaces original receipt in plan/evidence.
  await rawRepo.appendImport({id:batchId,sourceVersionId:sourceId,requestFingerprint:hash(q),startedAt:q.ingestedAt,completedAt:q.ingestedAt,ingestedAt:q.ingestedAt,completion:'COMPLETE',captureIds:captures.map(c=>c.id),errors:[]},captures);
  await repository.append(canonical,q.previousManualSnapshotId,q.ingestedAt);
  return {id,duplicate:false};
 });
}

export async function verifyStoredFinancialRaw(db:Db,plan:FinancialIngestPlan){
 const sourceId='standing-financial-current-v1',batchId='standing-batch:'+hash(plan.request),repository=new PrismaFundamentals(db);
 for(const p of plan.request.material.sourceBindings){
  const single=await repository.findCapture('standing-raw:'+hash({sourceId,p,batchId}));
  if(single){if(single.sourceRecordVersion!==p.sha256||single.resourceReference!==p.path||single.importExecutionId!==batchId||single.mediaType!=='application/octet-stream;base64'||single.sourceVersionId!==sourceId||single.sourceRecordId!==p.path||sha(single.payload)!==single.payloadHash||Buffer.from(single.payload,'base64').toString('base64')!==single.payload||sha(Buffer.from(single.payload,'base64'))!==p.sha256)throw Error('STORED_RAW_FINANCIAL_LINK_MISMATCH');continue;}
  const first=await repository.findCapture('standing-raw:'+hash({sourceId,p,batchId,part:0})),match=/^application\/octet-stream;base64;part=0\/([1-9]\d*)$/.exec(first?.mediaType??''),count=Number(match?.[1]);
  if(!match||count<2||count>32)throw Error('STORED_MULTIPART_RAW_REQUIRED');
  const chunks:Buffer[]=[];
  for(let part=0;part<count;part++){
   const c=part===0?first:await repository.findCapture('standing-raw:'+hash({sourceId,p,batchId,part}));
   if(!c||c.sourceRecordVersion!==p.sha256||c.resourceReference!==p.path||c.sourceRecordId!==p.path+'#part='+part+'/'+count||c.sourceVersionId!==sourceId||c.importExecutionId!==batchId||c.mediaType!=='application/octet-stream;base64;part='+part+'/'+count||sha(c.payload)!==c.payloadHash)throw Error('STORED_RAW_PART_LINK_MISMATCH');
   const bytes=Buffer.from(c.payload,'base64');if(bytes.toString('base64')!==c.payload)throw Error('STORED_RAW_PART_ENCODING');chunks.push(bytes);
  }
  if(sha(Buffer.concat(chunks))!==p.sha256)throw Error('STORED_RAW_FINANCIAL_LINK_MISMATCH');
 }
}
