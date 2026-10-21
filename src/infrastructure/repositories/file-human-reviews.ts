import { mkdirSync,readFileSync,writeFileSync,existsSync,renameSync,unlinkSync } from 'node:fs';
import { resolve } from 'node:path';
import type { HumanReviewStore } from '@/ports/runtime-readiness';
import type { HumanReviewRecord } from '@/domain/fundamentals/runtime-review';
import { fundamentalId,requireFundamental } from '@/domain/fundamentals/validation';
import { snapshotHash } from '@/infrastructure/fundamentals/snapshot-hash';
import { canonicalJson } from '@/domain/fundamentals/snapshot';
import { deepFreeze } from '@/domain/portfolio/transaction';

/** Isolated append-only review staging; no production database or authority activation. */
export class FileHumanReviews implements HumanReviewStore {
  constructor(private readonly root:string){mkdirSync(root,{recursive:true,mode:0o700});}
  async head(id:string):Promise<HumanReviewRecord|null>{
    fundamentalId(id);const dir=resolve(this.root,id),head=resolve(dir,'head.json');
    if(!existsSync(head))return null;
    const pin=JSON.parse(readFileSync(head,'utf8')) as {hash:string};
    requireFundamental(/^[a-f0-9]{64}$/.test(pin.hash),'REVIEW_HEAD_HASH');
    const row=JSON.parse(readFileSync(resolve(dir,pin.hash+'.json'),'utf8')) as HumanReviewRecord;
    const {contentHash,...body}=row;requireFundamental(row.id===id&&contentHash===pin.hash&&snapshotHash(body)===pin.hash,'REVIEW_STORAGE_INTEGRITY');
    return deepFreeze(row);
  }
  async append(row:HumanReviewRecord,expectedHash:string|null){
    fundamentalId(row.id);const dir=resolve(this.root,row.id);mkdirSync(dir,{recursive:true,mode:0o700});
    const lock=resolve(dir,'write.lock');writeFileSync(lock,'locked',{flag:'wx',mode:0o600});
    try{
      const current=await this.head(row.id);requireFundamental((current?.contentHash??null)===expectedHash&&row.previousHash===expectedHash,'REVIEW_CAS_CONFLICT');
      const {contentHash,...body}=row;requireFundamental(snapshotHash(body)===contentHash,'REVIEW_STORAGE_INTEGRITY');
      const file=resolve(dir,contentHash+'.json'),text=canonicalJson(row)+'\n';
      if(existsSync(file))requireFundamental(readFileSync(file,'utf8')===text,'REVIEW_IMMUTABLE_CONFLICT');
      else writeFileSync(file,text,{flag:'wx',mode:0o600});
      const temp=resolve(dir,'head.tmp');writeFileSync(temp,JSON.stringify({hash:contentHash}),{mode:0o600});renameSync(temp,resolve(dir,'head.json'));
    }finally{unlinkSync(lock);}
  }
}
