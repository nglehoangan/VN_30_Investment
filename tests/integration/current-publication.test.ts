// @vitest-environment node
import {readFileSync} from 'node:fs';
import {it,expect} from 'vitest';
import {testDatabase} from '../fixtures/step2-validation-database';
import {CurrentScorePublications} from '@/infrastructure/source-admission/current-publication';
import {GovernedCurrentDeployment} from '@/infrastructure/source-admission/current-deployment';
import {closedCurrentReleaseGate} from '@/ports/current-publication';
import {snapshotHash as hash} from '@/infrastructure/fundamentals/snapshot-hash';
import {deepFreeze} from '@/domain/portfolio/transaction';
import {readDashboard} from '../../app/server/dashboard';
import {PrismaAnalyticalArtifacts} from '@/infrastructure/repositories/analytical-artifacts';
const base='docs/fundamental-data-engine/vnm-step4-assessment-conversion/2026-11-18/final-reviewed-run/';
const read=(n:string)=>JSON.parse(readFileSync(base+n,'utf8'));
async function fixture(){
 const db=await testDatabase(),record={card:read('ISOLATED_SCORECARD.json'),authorization:read('AI_ADOPTION_AND_SCORING.json').authorization};
 await db.registry.append(record.card.methodology);
 const records=new Map([[record.card.id,record]]);let authority=true,data=true;
 const source={find:async(id:string)=>{if(!data)throw Error('TEST_DATA_REVOKED');return records.get(id)??null;}};
 const gate={authorityReference:'ISOLATED_TEST_ONLY',authorityHash:hash('TEST_BINDING'),verify:async()=>{if(!authority)throw Error('TEST_AUTHORITY_REVOKED');}};
 const service=new CurrentScorePublications(db.client,source as never,gate);
 return {db,record,records,source,service,gate,revokeAuthority:()=>{authority=false;},revokeData:()=>{data=false;}};
}
it('publishes exact real VNM payload through the actual dashboard reader under ISOLATED TEST authority only',async()=>{
 const f=await fixture();try{
  expect(await f.service.publish(f.record.card.id)).toEqual({id:f.record.card.id,duplicate:false});expect((await f.service.publish(f.record.card.id)).duplicate).toBe(true);
  const m=await readDashboard(f.db.client,'scoring',f.record.card.id,{currentPublications:f.service});expect(m.cards).toHaveLength(1);expect(hash(m.cards[0])).toBe(hash(f.record.card));expect(m.cards[0].confidence).toBe('LOW');expect(m.cards[0].validity).toBe('VALID — NON-ACTIONABLE');
  expect(m.cards[0].asOf).toBe(f.record.card.asOf);expect(m.cards[0].input.knownAt).toBe(f.record.card.input.knownAt);expect(m.cards[0].calculatedAt).toBe(f.record.card.calculatedAt);
  await expect(new PrismaAnalyticalArtifacts(f.db.client).find(f.record.card.id)).rejects.toThrow(); // envelope cannot become legacy FORMAL/PIT
  await expect(readDashboard(f.db.client,'scoring',f.record.card.id)).rejects.toThrow('CURRENT_PUBLICATION_CONSUMER_NOT_CONFIGURED');
  expect(await f.db.client.ledgerTransaction.count()).toBe(0);
 }finally{await f.db.close();}
});
it('selects the latest calculation and rejects an older distinct publication without overwriting history',async()=>{
 const f=await fixture();try{
  await f.service.publish(f.record.card.id);
  const newer=structuredClone(f.record);newer.card.id='VNM_TEST_NEWER_PUBLICATION';newer.card.calculatedAt='2026-11-18T23:59:59.000Z';f.records.set(newer.card.id,deepFreeze(newer));await f.service.publish(newer.card.id);
  expect((await f.service.latest()).map(c=>c.id)).toEqual([newer.card.id]);
  const old=structuredClone(f.record);old.card.id='VNM_TEST_OLDER_PUBLICATION';f.records.set(old.card.id,old);await expect(f.service.publish(old.card.id)).rejects.toMatchObject({issues:expect.arrayContaining([expect.objectContaining({reason:'STALE_CURRENT_PUBLICATION'})])});
  expect(await f.db.client.analyticalArtifact.count()).toBe(2);
 }finally{await f.db.close();}
});
it('revalidates authority and data on read and refuses stale fallback',async()=>{
 const f=await fixture();try{await f.service.publish(f.record.card.id);f.revokeData();await expect(f.service.latest()).rejects.toThrow('TEST_DATA_REVOKED');}finally{await f.db.close();}
 const g=await fixture();try{await g.service.publish(g.record.card.id);g.revokeAuthority();await expect(readDashboard(g.db.client,'scoring',g.record.card.id,{currentPublications:g.service})).rejects.toThrow('TEST_AUTHORITY_REVOKED');}finally{await g.db.close();}
});
it('rejects tampered source, fake PIT and missing publication authority',async()=>{
 const f=await fixture();try{
  await expect(new CurrentScorePublications(f.db.client,f.source as never,closedCurrentReleaseGate).publish(f.record.card.id)).rejects.toThrow('CURRENT_RELEASE_AUTHORIZATION_REQUIRED');
  await f.service.publish(f.record.card.id);const changed=structuredClone(f.record);changed.card.totalScore='99';f.records.set(changed.card.id,changed);await expect(f.service.find(changed.card.id)).rejects.toMatchObject({issues:expect.arrayContaining([expect.objectContaining({reason:'CURRENT_PUBLICATION_LINEAGE'})])});
  changed.card.input.currentPurpose.purpose='HISTORICAL_PIT';await expect(f.service.publish(changed.card.id)).rejects.toMatchObject({issues:expect.arrayContaining([expect.objectContaining({reason:'CURRENT_PUBLICATION_PURPOSE'})])});
 }finally{await f.db.close();}
});
it('gates materialization before any recipe writes and enforces exact deployment result',async()=>{
 let writes=0;const subject={scorecardId:'TEST',scorecardHash:hash(1),datasetHash:hash(2),methodologyHash:hash(3),reviewHash:hash(4)};
 const plan={...subject,contract:'governed-current-deployment-v1' as const,sourcePins:[{path:'TEST_ONLY',sha256:hash(5)}],historicalPitGranted:false as const,activatesPublication:false as const};
 const recipe={verify:async()=>{},replay:async()=>{writes++;return {subject,facts:69,bindingId:'TEST'};}};
 await expect(new GovernedCurrentDeployment(closedCurrentReleaseGate,recipe).apply(plan)).rejects.toThrow();expect(writes).toBe(0);
 const gate={authorityReference:'ISOLATED_TEST_ONLY',authorityHash:hash('TEST_BINDING'),verify:async(_op:string,_subject:unknown,digest?:string)=>{expect(digest).toBe(hash(plan));}};
 expect((await new GovernedCurrentDeployment(gate,recipe).apply(plan)).publicationActivated).toBe(false);
 await expect(new GovernedCurrentDeployment(gate,{...recipe,replay:async()=>({subject:{...subject,datasetHash:hash('TAMPER')},facts:69,bindingId:'TEST'})}).apply(plan)).rejects.toThrow('CURRENT_DEPLOYMENT_RESULT_MISMATCH');
});
