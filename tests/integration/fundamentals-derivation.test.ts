// @vitest-environment node
import {it,expect} from 'vitest';
import {testDatabase} from '../fixtures/database';
import {fundamentalFixture,release} from '../fixtures/fundamentals';
import {derivationFixture} from '../fixtures/derivation';
import {PrismaFundamentals} from '@/infrastructure/repositories/fundamentals';
import {PrismaFundamentalDerivation} from '@/infrastructure/repositories/fundamental-derivation';
import {DeriveFundamentals} from '@/application/fundamentals/derive';
import {normalizationHash} from '@/infrastructure/fundamentals/reviewed-statement';
import {openDatabase} from '@/infrastructure/db/client';
import {deriveFundamentals} from '@/domain/fundamentals/derivation';
async function setup(db:Awaited<ReturnType<typeof testDatabase>>){
 const input=derivationFixture(),facts=new PrismaFundamentals(db.client),results=new PrismaFundamentalDerivation(db.client);
 await db.client.security.create({data:{id:input.request.securityId,name:'Synthetic derivation issuer'}});
 const source=fundamentalFixture().source;await facts.appendSource(source);
 for(const o of input.observations){const f=fundamentalFixture(o.id);await facts.appendImport(f.batch,[f.capture]);await facts.appendObservation(o);}
 const service=new DeriveFundamentals(facts,results,release,input.crosswalk,{hash:normalizationHash,now:()=>input.recordedAt});
 return {input,facts,results,service};
}
it('persists exact formula/input/adjustment lineage atomically, reopens and retains canonical facts',async()=>{
 const db=await testDatabase();try{
  const s=await setup(db),r=await s.service.run(s.input.request);expect(r.value).toBe('70');expect(await s.results.find(r.id)).toEqual(r);
  for(const o of s.input.observations)expect(await s.facts.findObservation(o.id)).toEqual(o);
  expect(await db.client.fundamentalDerivationInput.count()).toBe(2);await expect(s.results.append(r)).rejects.toThrow();
  expect(await db.client.fundamentalDerivation.count()).toBe(1);
  await db.client.$disconnect();const reopened=await openDatabase(db.config);
  try{expect(await new PrismaFundamentalDerivation(reopened).find(r.id)).toEqual(r);}finally{await reopened.$disconnect();}
 }finally{await db.close();}
},30_000);
it('rejects forged output, missing inputs and formal proposed release without partial writes',async()=>{
 const db=await testDatabase();try{
  const s=await setup(db),r=deriveFundamentals(s.input);
  await expect(s.results.append({...r,value:'999'})).rejects.toThrow();
  await expect(s.service.run({...s.input.request,scope:'FORMAL'})).rejects.toThrow();
  await expect(s.service.run({...s.input.request,operands:[{...s.input.request.operands[0],observationIds:['missing']},s.input.request.operands[1]]})).rejects.toThrow();
  expect(await db.client.fundamentalDerivation.count()).toBe(0);expect(await db.client.fundamentalDerivationInput.count()).toBe(0);
 }finally{await db.close();}
},30_000);
it('keeps N/R evidence, guards artifact/input mutation and replacement, restrictive FKs and tamper replay',async()=>{
 const db=await testDatabase();try{
  const s=await setup(db),r=await s.service.run({...s.input.request,cyclical:true});expect(r.status).toBe('N_R');expect(await s.results.find(r.id)).toEqual(r);
  await expect(db.client.$executeRaw`UPDATE fundamental_derivation SET status='CALCULATED' WHERE id=${r.id}`).rejects.toThrow();
  await expect(db.client.$executeRaw`DELETE FROM fundamental_derivation WHERE id=${r.id}`).rejects.toThrow();
  await expect(db.client.$executeRaw`INSERT OR REPLACE INTO fundamental_derivation SELECT * FROM fundamental_derivation WHERE id=${r.id}`).rejects.toThrow();
  await expect(db.client.$executeRaw`UPDATE fundamental_derivation_input SET position=3 WHERE derivation_id=${r.id}`).rejects.toThrow();
  await expect(db.client.$executeRaw`DELETE FROM fundamental_derivation_input WHERE derivation_id=${r.id}`).rejects.toThrow();
  await expect(db.client.$executeRaw`INSERT OR REPLACE INTO fundamental_derivation_input SELECT * FROM fundamental_derivation_input WHERE derivation_id=${r.id}`).rejects.toThrow();
  await expect(db.client.fundamentalDerivationInput.create({data:{derivationId:r.id,operand:1,position:2,observationId:'missing'}})).rejects.toThrow();
  const forged={...r,id:'forged-derivation',value:'999'};
  await db.client.fundamentalDerivation.create({data:{id:forged.id,securityId:r.request.securityId,recordedAt:r.recordedAt,status:r.status,body:JSON.stringify(forged),bodyHash:normalizationHash(forged)}});
  await expect(s.results.find(forged.id)).rejects.toThrow();
  expect(await db.client.$queryRawUnsafe('PRAGMA foreign_key_check')).toEqual([]);
 }finally{await db.close();}
},30_000);
