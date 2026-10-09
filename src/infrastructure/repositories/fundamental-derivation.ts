import type { PrismaClient,Prisma } from '@/infrastructure/db/generated/client';
import type { FundamentalDerivationRepository } from '@/ports/fundamentals';
import { deriveFundamentals } from '@/domain/fundamentals/derivation';
import type { DerivationAssessment } from '@/domain/fundamentals/derivation';
import type { RegistryRelease,RegistryApprovalBinding } from '@/domain/fundamentals/contracts';
import { requireFundamental,fundamentalId } from '@/domain/fundamentals/validation';
import { normalizationHash } from '@/infrastructure/fundamentals/reviewed-statement';
import { loadCanonicalRegistry,verifyRegistryApproval } from '@/infrastructure/fundamentals/canonical-registry';
import { PrismaFundamentals } from './fundamentals';
import { PrismaMethodologyRegistry } from './methodology-registry';
import { methodologyId } from '@/shared/ids';
import { DataIntegrityError } from '@/shared/errors';
/** Append-only arithmetic artifacts. No fact selection, availability evaluator or scoring integration. */
export class PrismaFundamentalDerivation implements FundamentalDerivationRepository {
  constructor(private readonly client:PrismaClient,private readonly registry:RegistryRelease=loadCanonicalRegistry(),private readonly binding:RegistryApprovalBinding|null=null){}
  private async replay(client:Prisma.TransactionClient,result:DerivationAssessment){
    requireFundamental(normalizationHash(result.registry)===normalizationHash(this.registry),'DERIVATION_REGISTRY_BINDING');
    if(result.request.scope==='FORMAL'){
      const method=await new PrismaMethodologyRegistry(client).findById(methodologyId(this.registry.manifest.methodologyIdentity));
      verifyRegistryApproval(this.registry,this.binding,method);
      requireFundamental(this.registry.manifest.recordedAt<=result.recordedAt&&method!.recordedAt<=result.recordedAt,'DERIVATION_GOVERNANCE_AFTER_EXECUTION');
    }
    const facts=new PrismaFundamentals(client,this.registry,this.binding);
    const observations=await Promise.all(result.observations.map(async ref=>{const o=await facts.findObservation(ref.id);requireFundamental(o!==null,'DERIVATION_INPUT_NOT_FOUND');return o!;}));
    const replay=deriveFundamentals({request:result.request,recordedAt:result.recordedAt,registry:this.registry,crosswalk:result.crosswalk,
      crosswalkHash:result.crosswalkHash,observations,hash:normalizationHash});
    requireFundamental(normalizationHash(replay)===normalizationHash(result),'DERIVATION_REPLAY_MISMATCH');return replay;
  }
  async append(result:DerivationAssessment){
    fundamentalId(result.id);
    try{await this.client.$transaction(async tx=>{
      const checked=await this.replay(tx,result),body=JSON.stringify(checked);
      requireFundamental(Buffer.byteLength(body,'utf8')<=4_000_000,'BOUNDED_DERIVATION');
      await tx.fundamentalDerivation.create({data:{id:checked.id,securityId:checked.request.securityId,recordedAt:checked.recordedAt,status:checked.status,body,bodyHash:normalizationHash(checked)}});
      for(const [operand,spec] of checked.request.operands.entries())for(const [position,observationId] of spec.observationIds.entries())await tx.fundamentalDerivationInput.create({data:{derivationId:checked.id,operand,position,observationId}});
    });}catch(error){throw new DataIntegrityError({cause:error});}
  }
  async find(id:string){
    fundamentalId(id);try{
      const row=await this.client.fundamentalDerivation.findUnique({where:{id},include:{inputs:{orderBy:[{operand:'asc'},{position:'asc'}]}}});if(!row)return null;
      const result=JSON.parse(row.body) as DerivationAssessment;
      requireFundamental(result.id===row.id&&result.recordedAt===row.recordedAt&&result.status===row.status&&result.request.securityId===row.securityId&&normalizationHash(result)===row.bodyHash,'DERIVATION_STORED_INTEGRITY');
      const expected=result.request.operands.flatMap((s,operand)=>s.observationIds.map((observationId,position)=>({derivationId:id,operand,position,observationId})));
      requireFundamental(normalizationHash(expected)===normalizationHash(row.inputs.map(p=>({derivationId:p.derivationId,operand:p.operand,position:p.position,observationId:p.observationId}))),'DERIVATION_INPUT_LINK_MANIFEST');
      return await this.replay(this.client,result);
    }catch(error){throw new DataIntegrityError({cause:error});}
  }
}
