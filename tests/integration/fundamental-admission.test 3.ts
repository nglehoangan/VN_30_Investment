// @vitest-environment node
import {it,expect} from 'vitest';
import {testDatabase} from '../fixtures/database';
import {PrismaFinancialAdmission} from '@/infrastructure/repositories/fundamental-admission';
import {buildHybridAdmission,type HybridAdmissionSnapshot} from '@/domain/fundamentals/hybrid-admission';
import {financialHash} from '@/infrastructure/fundamentals/hybrid-input';
it('retains admission append-only, rejects identity reuse and never accepts scoring approval',async()=>{
 const db=await testDatabase();
 try{
  const repo=new PrismaFinancialAdmission(db.client),at='2026-10-14T00:00:00.000Z';
  const snapshot=buildHybridAdmission({snapshotId:'synthetic-admission',analysisAt:at,systemKnownAt:at,mode:'CURRENT_ANALYSIS',candidates:[],verifications:[],certificates:[],universe:[],statements:[],sourceBindings:[]},financialHash);
  const first=await repo.append(snapshot,'previous-manual',at);
  expect(await repo.append(snapshot,'previous-manual',at)).toEqual(first);
  expect(await repo.find(snapshot.snapshotId)).toEqual(snapshot);
  await expect(repo.append(snapshot,'different-previous',at)).rejects.toThrow();
  await expect(repo.append({...snapshot,readyForScoring:true} as unknown as HybridAdmissionSnapshot,'previous-manual',at)).rejects.toThrow();
  await expect(db.client.fundamentalAdmissionRun.update({where:{id:snapshot.snapshotId},data:{policyVersion:'mutated'}})).rejects.toThrow();
  await expect(db.client.fundamentalAdmissionRun.delete({where:{id:snapshot.snapshotId}})).rejects.toThrow();
  expect(await repo.find(snapshot.snapshotId)).toEqual(snapshot);
  expect(await db.client.$queryRawUnsafe('PRAGMA foreign_key_check')).toEqual([]);
 }finally{await db.close();}
});
