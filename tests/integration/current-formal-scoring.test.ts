import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {it,expect,describe} from 'vitest';
import {SECTORS,type Sector} from '@/domain/scoring/methodology';
import {calculateScorecard as originalScorecard} from '@/domain/scoring/scorecard';
import {fixture} from '../fixtures/scoring';
import {reviewedAiInput,signAiInput} from '../fixtures/personal-ai-scoring';
import {testDatabase} from '../fixtures/step2-validation-database';
import {dateOnly,instant} from '@/shared/time';
import {calculateScorecard,type ScoreInput} from '@/domain/current-scoring/scorecard';
import {calculateScorecard as historical} from '@/domain/personal-ai/scorecard';
import {snapshotHash as hash} from '@/infrastructure/fundamentals/snapshot-hash';
import {CurrentPurposeScoring} from '@/infrastructure/source-admission/current-scoring';
import type {CurrentScoringDataset} from '@/ports/current-scoring-datasets';
import type {PreScoringDatasetReference} from '@/ports/pre-scoring-datasets';
const NOW='2026-11-17T12:00:00.000Z';
const sign=(x:unknown)=>signAiInput(x as never).input as unknown as ScoreInput;
function input(sector:Sector="INDUSTRIAL"){
 const base=reviewedAiInput(fixture(0,sector)).input;
 return sign({...base,id:'SYNTHETIC-CURRENT-SCORE',artifactScope:'FORMAL',knownAt:NOW,calculatedAt:NOW,currentPurpose:{contract:'current-scoring-time-v1',purpose:'CURRENT_FORMAL_VALUATION',economicCutoff:base.asOf.slice(0,10),evaluatedAt:NOW},methodology:{...base.methodology,family:'SCORING',intendedUse:'PRODUCTION',governanceStatus:'APPROVED',approvalReference:'SYNTHETIC_APPROVAL_NOT_REAL',effectiveDate:dateOnly('2026-11-17'),recordedAt:instant('2026-11-17T01:00:00.000Z')},evidence:base.evidence.map((e,i)=>i?e:{...e,publishedAt:null,receivedAt:NOW,time:{contract:'current-formal-evidence-time-v1',purpose:'CURRENT_FORMAL_VALUATION',policyVersion:'standing-financial-current-v1',policyHash:'a'.repeat(64),authorizationReference:'SYNTHETIC_NOT_REAL',rawHash:'b'.repeat(64),qualificationReference:'SYNTHETIC_REVIEW',originalReceivedAt:NOW,reviewedAt:NOW,ingestedAt:NOW,availableAt:NOW}})});
}
async function setup(){
 const db=await testDatabase(),f=input();
 for(const sql of readFileSync('prisma/proposals/current-scoring-artifact-v1.sql','utf8').match(/CREATE TRIGGER[\s\S]*?END;|CREATE TABLE[\s\S]*?;/g)??[])await db.client.$executeRawUnsafe(sql);
 const reference:PreScoringDatasetReference={contract:'current-purpose-pre-scoring-reference-v1',bindingId:'SYNTHETIC_BINDING',context:{ticker:'S0',securityId:f.securityId,purpose:'CURRENT_FORMAL_VALUATION',economicCutoff:f.asOf.slice(0,10),knownAt:NOW},manifestHash:'a'.repeat(64),permitsScoring:false,historicalPitGranted:false};
 const dataset={contract:'current-purpose-scoring-consumption-v1',status:'ACCEPTED_CURRENT_DATA',purpose:'CURRENT_FORMAL_VALUATION',bindingId:reference.bindingId,manifestHash:reference.manifestHash,parentDatasetId:'SYNTHETIC_PARENT',dataAcceptanceId:'SYNTHETIC_ACCEPTANCE',context:reference.context,originalBindingKnownAt:NOW,facts:[],evidence:[f.evidence[0]],history:[],research:{},price:{},shares:{},financialAssemblyComplete:true,fullM3CoverageCertified:false,gates:{assessment:'NOT_GRANTED',M1:'NOT_GRANTED',confidence:'NOT_GRANTED',scoringAuthorization:'NOT_GRANTED'},readyForScoring:false,historicalPitGranted:false,VNM17Promoted:false} as unknown as CurrentScoringDataset;
 await db.registry.append(f.methodology);let reviewed=hash(f),revoked=false,authorized=true;
 const service=new CurrentPurposeScoring(db.client,db.registry,{resolve:async(ref,context)=>{if(revoked)throw Error('SYNTHETIC_REVOKED');if(hash(ref)!==hash(reference)||context.knownAt!==NOW)throw Error('SYNTHETIC_CONTEXT_MISMATCH');return dataset;}},{verify:async x=>{if(hash(x)!==reviewed)throw Error('SYNTHETIC_UNTRUSTED_REVIEW');}},{verify:async()=>{if(!authorized)throw Error('SYNTHETIC_EXECUTABLE_NOT_APPROVED');}});
 return {db,f,reference,dataset,service,review:(x:ScoreInput)=>reviewed=hash(x),revoke:()=>revoked=true,revokeAuthority:()=>authorized=false};
}
describe('explicit current-purpose scoring, SYNTHETIC AUTHORITY ONLY',()=>{
 it('derives all financial rules with only explicit purpose/time adaptations',()=>expect(execFileSync(process.execPath,['scripts/generate-current-scoring.mjs','--check'],{encoding:'utf8'})).toContain('CURRENT_PARITY_PASS'));
 it('accepts later operational knowledge and method date without changing economic cutoff',()=>{const f=input(),c=calculateScorecard(f,hash);expect(c.asOf).toBe(f.asOf);expect(c.totalScore).toBe('82');expect(c.contract).toBe('personal-ai-current-scorecard-v1');expect(c.operationalAuthorizationGranted).toBe(false);});
 it.each(SECTORS)('preserves approved numeric output for %s under explicit current-time adaptation',sector=>{
  const a=calculateScorecard(input(sector),hash),b=originalScorecard(fixture(0,sector));
  expect(a.totalScore).toBe(b.totalScore);expect(a.categories).toEqual(b.categories);expect(a.metrics).toEqual(b.metrics);expect(a.subcategories.map(r=>({id:r.id,points:r.points,status:r.status}))).toEqual(b.subcategories.map(r=>({id:r.id,points:r.points,status:r.status})));
 });
 it('historical path still rejects the identical current-purpose input',()=>{const f=input();expect(()=>historical(f as never,hash)).toThrow();});
 it('rejects future method, wrong cutoff, invalid evaluation time and PIT substitution',()=>{
  const f=input();for(const changed of [{...f,methodology:{...f.methodology,effectiveDate:dateOnly('2027-01-01')}},{...f,currentPurpose:{...f.currentPurpose,economicCutoff:'2025-07-01'}},{...f,currentPurpose:{...f.currentPurpose,evaluatedAt:'2026-11-16T00:00:00.000Z'}},{...f,currentPurpose:{...f.currentPurpose,purpose:'HISTORICAL_PIT'}}])expect(()=>calculateScorecard(sign(changed),hash)).toThrow();
 });
 it('persists/replays a current score and binding idempotently without historical DI',async()=>{
  const x=await setup();try{const c=await x.service.score(x.f,x.reference);expect(c.totalScore).toBe('82');expect((await x.service.find(c.id))!.card).toEqual(c);expect(await x.service.score(x.f,x.reference)).toEqual(c);expect(Number((await x.db.client.$queryRawUnsafe<{n:number}[]>('SELECT count(*) n FROM current_score_artifact'))[0].n)).toBe(1);expect(await x.db.client.dataInitializationAcceptance.count()).toBe(0);expect(await x.db.client.scoringDatasetBinding.count()).toBe(0);expect(await x.db.client.analyticalArtifact.count()).toBe(0);}finally{await x.db.close();}
 });
 it('rejects untrusted assessment changes, missing current financial lineage and revoked authority',async()=>{
  const x=await setup();try{await expect(x.service.score(sign({...x.f,companyName:'SPOOFED'}),x.reference)).rejects.toThrow();const omitted=sign({...x.f,evidence:x.f.evidence.slice(1)});x.review(omitted);await expect(x.service.score(omitted,x.reference)).rejects.toThrow();x.revokeAuthority();await expect(x.service.score(x.f,x.reference)).rejects.toThrow();}finally{await x.db.close();}
 });
 it('rejects cross-ticker/binding substitution and propagates revocation on readback',async()=>{
  const x=await setup();try{await expect(x.service.score(x.f,{...x.reference,context:{...x.reference.context,securityId:'SYNTHETIC_OTHER'}})).rejects.toThrow();await x.service.score(x.f,x.reference);x.revoke();await expect(x.service.find(x.f.id)).rejects.toThrow();}finally{await x.db.close();}
 });
 it('cannot use trusted review to replace a missing mandatory band or topic',async()=>{
  const x=await setup();try{for(const f of [sign({...x.f,assessments:x.f.assessments.slice(1)}),sign({...x.f,assessments:x.f.assessments.map((a,i)=>i?a:{...a,evidence:a.evidence.slice(1)})})]){x.review(f);await expect(x.service.score(f,x.reference)).rejects.toThrow();}expect(Number((await x.db.client.$queryRawUnsafe<{n:number}[]>('SELECT count(*) n FROM current_score_artifact'))[0].n)).toBe(0);}finally{await x.db.close();}
 });
 it('unresolved Stage0 cannot be promoted by content review; LOW remains non-actionable',async()=>{
  const x=await setup();try{const pending=sign({...x.f,stage0:{...x.f.stage0,status:'UNKNOWN'}});x.review(pending);await expect(x.service.score(pending,x.reference)).rejects.toThrow();const low=sign({...x.f,confidence:{...x.f.confidence,level:'LOW',dimensions:['Weak','Adequate','Adequate','Adequate','Weak']}});x.review(low);const c=await x.service.score(low,x.reference);expect(c.totalScore).toBe('82');expect(c.confidence).toBe('LOW');expect(c.validity).toBe('VALID — NON-ACTIONABLE');}finally{await x.db.close();}
 });
});

describe('existing pinned AI adoption applied to explicit current-purpose inputs',()=>{
 it('verifies real content pins of a SYNTHETIC review and rejects changed M1 or tools',async()=>{
  const {mkdir,writeFile,appendFile}=await import('node:fs/promises');
  const {join}=await import('node:path');
  const {canonicalJson}=await import('@/domain/fundamentals/snapshot');
  const {manifestDigest}=await import('@/infrastructure/fundamentals/snapshot-hash');
  const {PinnedCurrentAssessmentAdoption}=await import('@/infrastructure/source-admission/current-scoring');
  const x=await setup();try{
   const root=join(x.db.directory,'SYNTHETIC_REVIEW');await mkdir(root);
   const signed=signAiInput(x.f as never),f=signed.input as unknown as ScoreInput;
   const tool=canonicalJson({scope:'SYNTHETIC_NOT_REAL_PROVENANCE',inputHash:f.review.inputHash});await writeFile(join(root,'tool.json'),tool);
   const reviewPins=[];
   for(const [i,a]of signed.artifacts.entries()){const path=`pass-${i}.json`;await writeFile(join(root,path),canonicalJson(a));reviewPins.push({reference:f.review.passes[i].artifactReference,path,sha256:f.review.passes[i].artifactHash});}
   const {METRICS}=await import('@/domain/scoring/metrics');
   const packet={contract:'current-assessment-adoption-v1',input:f,datasetHash:hash(x.dataset),metricDecisions:Object.keys(METRICS).map(metric=>({metric,status:'NOT_APPLICABLE',ruleReference:'SYNTHETIC_RULE_NOT_REAL_SECTOR_DISPOSITION',evidenceRefs:[f.evidence[0].id]}))};
   const bytes=canonicalJson(packet);await writeFile(join(root,'input.json'),bytes);
   const adoption=new PinnedCurrentAssessmentAdoption(root,{reference:'SYNTHETIC_CURRENT_INPUT',path:'input.json',sha256:manifestDigest(bytes)},[{reviewHash:hash(f.review),ownerAuthorizationReference:f.review.ownerAuthorizationReference,passArtifacts:reviewPins as never,toolArtifacts:[{reference:'SYNTHETIC_TOOL_LOG_NOT_REAL_PROVENANCE',path:'tool.json',sha256:manifestDigest(tool)}]}]);
   await expect(adoption.verify(f,x.dataset)).resolves.toBeUndefined();
   await expect(new PinnedCurrentAssessmentAdoption(root,{reference:'SYNTHETIC_CURRENT_INPUT',path:'input.json',sha256:manifestDigest(bytes)},[]).verify(f,x.dataset)).rejects.toThrow();
   await expect(adoption.verify(sign({...f,hardVeto:{...f.hardVeto,status:'ACTIVE'}}),x.dataset)).rejects.toThrow();
   await appendFile(join(root,'tool.json'),' ');await expect(adoption.verify(f,x.dataset)).rejects.toThrow();
  }finally{await x.db.close();}
 });
});

describe('exact new executable acceptance cannot be manufactured',()=>{
 it('rejects proposed code authority and changed bytes without touching standing data authority',async()=>{
  const {writeFile}=await import('node:fs/promises');const {join}=await import('node:path');
  const {manifestDigest}=await import('@/infrastructure/fundamentals/snapshot-hash');
  const {PinnedCurrentExecutableAuthority}=await import('@/infrastructure/source-admission/current-scoring-authority');
  const x=await setup();try{
   const body=JSON.stringify({contract:'current-scoring-executable-authority-v1',status:'PROPOSED',purpose:'CURRENT_FORMAL_VALUATION'});await writeFile(join(x.db.directory,'proposal.json'),body);
   const a=new PinnedCurrentExecutableAuthority(x.db.directory,{path:'proposal.json',sha256:manifestDigest(body)},{now:()=>NOW});
   await expect(a.verify(x.f.methodology)).rejects.toThrow();await writeFile(join(x.db.directory,'proposal.json'),body+' ');await expect(a.verify(x.f.methodology)).rejects.toThrow();
  }finally{await x.db.close();}
 });
});

describe('application purpose routing',()=>{
 it('uses current admission for current requests and never falls through to historical DI',async()=>{
  const {PurposeAwareScoringEngine}=await import('@/application/scoring/purpose-aware-engine');
  const x=await setup();let legacyCalls=0;try{
   const engine=new PurposeAwareScoringEngine({score:async()=>{legacyCalls++;throw Error('HISTORICAL_MUST_NOT_RUN');}},x.service);
   expect((await engine.scoreCurrent(x.f,x.reference)).totalScore).toBe('82');expect(legacyCalls).toBe(0);
   await expect(engine.scoreHistorical(x.f as never,{snapshotRunId:'fake',acceptanceId:'fake'})).rejects.toThrow();expect(legacyCalls).toBe(0);
  }finally{await x.db.close();}
 });
});
