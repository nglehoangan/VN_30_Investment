// @vitest-environment node
import {it,expect} from 'vitest';
import {testDatabase} from '../fixtures/database';
import {setupScoringReadiness} from '../fixtures/scoring-readiness-db';
import {policyBFixture} from '../fixtures/policy-b';
import {PrismaPolicyBScoringDatasets} from '@/infrastructure/repositories/scoring-datasets-policy-b';
import {ScoringEngine} from '@/application/scoring/engine';
import {snapshotHash} from '@/infrastructure/fundamentals/snapshot-hash';
async function setup(){
 const db=await testDatabase(),f=await setupScoringReadiness(db,false),p=policyBFixture();
 const a={...p.acceptance,id:'synthetic-policy-b-acceptance',methodologyId:'synthetic-policy-b-method',approvalReference:'synthetic-independent-policy-b-approval'};
 const bodyHash=snapshotHash(a),method=await db.client.methodologyRecord.findUniqueOrThrow({where:{methodologyId:f.acceptance.methodologyId}});
 await db.client.methodologyRecord.create({data:{...method,methodologyId:a.methodologyId,approvalReference:a.approvalReference,configurationReference:'di-acceptance-sha256:'+bodyHash}});
 const binding={acceptanceHash:bodyHash,reviewerReference:a.reviewerReference,approvalReference:a.approvalReference};
 const datasets=new PrismaPolicyBScoringDatasets(db.client,f.snapshots,f.facts,f.derivations,f.registry,[binding],a.id);
 return {db,f,a,binding,datasets};
}
it('trusted versioned acceptance persists all30 states and rejects deferred formal inputs before any score write',async()=>{
 const {db,f,a,datasets}=await setup();try{
  await datasets.appendAcceptance(a);expect(await datasets.readiness(a.id)).toHaveLength(30);
  const engine=new ScoringEngine(db.registry,f.artifacts,datasets),selection={snapshotRunId:f.request.runId,acceptanceId:a.id};
  await expect(engine.score({...f.input,securityId:a.tickers[25].securityId as typeof f.input.securityId},selection)).rejects.toThrow();
  expect(await db.client.analyticalArtifact.count()).toBe(0);expect(await db.client.scoringDatasetBinding.count()).toBe(0);
  expect((await datasets.readiness(a.id)).slice(25).every(r=>!r.readyForScoring)).toBe(true);
  const stored=await db.client.dataInitializationAcceptance.findUniqueOrThrow({where:{id:a.id}});expect(JSON.parse(stored.body).issues.every((i:{severity:string;resolutionReference:null})=>i.severity==='MAJOR'&&i.resolutionReference===null)).toBe(true);
 }finally{await db.close();}
},30_000);
it('PolicyB cannot manufacture independent approval, bypass pinned release or relabel issues',async()=>{
 const {db,f,a,datasets}=await setup();try{
  const untrusted=new PrismaPolicyBScoringDatasets(db.client,f.snapshots,f.facts,f.derivations,f.registry,[],a.id);
  await expect(untrusted.appendAcceptance(a)).rejects.toThrow();expect(await db.client.dataInitializationAcceptance.count()).toBe(0);
  await expect(datasets.appendAcceptance({...a,id:'different-release'})).rejects.toThrow();
  await expect(datasets.appendAcceptance({...a,issues:[]})).rejects.toThrow();
  await expect(datasets.appendAcceptance({...a,reviewerReference:a.producerReference})).rejects.toThrow();
  const issues=a.partialUniverse!.issues.map(i=>({...i,severity:'MINOR' as const}));
  const forged={...a,issues:issues.map(i=>({id:i.id,severity:i.severity,resolutionReference:i.resolutionReference})),partialUniverse:{...a.partialUniverse!,issues,sourceIssueRegister:{...a.partialUniverse!.sourceIssueRegister,issues,issuesHash:snapshotHash(issues)},members:a.partialUniverse!.members.map(m=>({...m,state:'SCORABLE' as const,levelOnePass:true,quarantine:null,blockerIds:[],reopenTriggers:[]}))}};
  await expect(datasets.appendAcceptance(forged)).rejects.toThrow();
  expect(await db.client.dataInitializationAcceptance.count()).toBe(0);
 }finally{await db.close();}
},30_000);
