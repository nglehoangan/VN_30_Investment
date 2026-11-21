import type {PrismaClient} from '@/infrastructure/db/generated/client';
import {CurrentBankScoringConsumer} from '@/infrastructure/source-admission/current-bank-scoring';
import {withRegisteredAcbF1Admission} from '../../app/server/acb-bank-admission';

const f1Version={
 path:'docs/fundamental-data-engine/acb-scoring-readiness/2026-11-19/f1-successor/F1_RUNTIME_APPROVED_RECOVERY.json',
 sha256:'b16f6b75bf326922e80c73e5e2f773f4152d7b5884bb606c7c81adf0c13f5b9b',
};

export function createCurrentDatasetConsumer(
 db:PrismaClient,root:string,subject:{ticker:string;securityId:string;sector:string;cutoff:string},
){
 if(subject.ticker!=='ACB'||subject.sector!=='BANK'||subject.cutoff!=='2026-10-30'||
    subject.securityId!=='658fafbe-65b3-4176-999f-d4d32e1bd838'){
  throw Error('ACB_BANK_ADAPTER_SCOPE_MISMATCH');
 }
 const bankSubject={...subject,sector:'BANK' as const};
 type PinnedDatasetPort=ConstructorParameters<typeof CurrentBankScoringConsumer>[1];
 const datasets={
  consume:(...args:Parameters<PinnedDatasetPort['consume']>)=>withRegisteredAcbF1Admission(
   db,root,f1Version,route=>route.consume(...args),
  ),
 };
 // The pinned BANK consumer reads the shared consume fields, but its type names the legacy provider.
 return new CurrentBankScoringConsumer(db,datasets as unknown as PinnedDatasetPort,bankSubject);
}
