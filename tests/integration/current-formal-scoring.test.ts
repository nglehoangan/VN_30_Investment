import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {LimitedCoverageView} from '@/ui/limited-coverage';
import {ACB_LIMITED_METHOD, ACB_UNRATED_RUBRICS} from '@/domain/current-scoring/limited-coverage';
import {mkdtempSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {ValidationError} from "@/shared/errors";
import {previewEvidenceBasedScore, type ConservativeAssessment} from "@/domain/current-scoring/evidence-based-preview";
import {ensureCurrentSchema} from '../fixtures/current-schema';
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
async function setup(f=input(),ticker='S0',parentDatasetId='SYNTHETIC_PARENT',bindingId='SYNTHETIC_BINDING',manifestHash='a'.repeat(64),dataAcceptanceId='SYNTHETIC_ACCEPTANCE',bindingKnownAt=NOW){
 const db=await testDatabase();
 await ensureCurrentSchema(db.client,'prisma/proposals/current-scoring-artifact-v1.sql');
 const reference:PreScoringDatasetReference={contract:'current-purpose-pre-scoring-reference-v1',bindingId,context:{ticker,securityId:f.securityId,purpose:'CURRENT_FORMAL_VALUATION',economicCutoff:f.asOf.slice(0,10),knownAt:bindingKnownAt},manifestHash,permitsScoring:false,historicalPitGranted:false};
 const dataset={contract:'current-purpose-scoring-consumption-v1',status:'ACCEPTED_CURRENT_DATA',purpose:'CURRENT_FORMAL_VALUATION',bindingId:reference.bindingId,manifestHash:reference.manifestHash,parentDatasetId,dataAcceptanceId,context:reference.context,originalBindingKnownAt:bindingKnownAt,facts:[],evidence:[f.evidence[0]],history:[],research:{},price:{},shares:{},financialAssemblyComplete:true,fullM3CoverageCertified:false,gates:{assessment:'NOT_GRANTED',M1:'NOT_GRANTED',confidence:'NOT_GRANTED',scoringAuthorization:'NOT_GRANTED'},readyForScoring:false,historicalPitGranted:false,VNM17Promoted:false} as unknown as CurrentScoringDataset;
 await db.registry.append(f.methodology);let reviewed=hash(f),revoked=false,authorized=true;
 const service=new CurrentPurposeScoring(db.client,db.registry,{resolve:async(ref,context)=>{if(revoked)throw Error('SYNTHETIC_REVOKED');if(hash(ref)!==hash(reference)||context.knownAt!==bindingKnownAt)throw Error('SYNTHETIC_CONTEXT_MISMATCH');return dataset;}},{verify:async x=>{if(hash(x)!==reviewed)throw Error('SYNTHETIC_UNTRUSTED_REVIEW');}},{verify:async()=>{if(!authorized)throw Error('SYNTHETIC_EXECUTABLE_NOT_APPROVED');}});
 return {db,f,reference,dataset,service,review:(x:ScoreInput)=>reviewed=hash(x),revoke:()=>revoked=true,revokeAuthority:()=>authorized=false};
}
describe('explicit current-purpose scoring, SYNTHETIC AUTHORITY ONLY',()=>{
 it('derives all financial rules with only explicit purpose/time adaptations',()=>expect(execFileSync(process.execPath,['tools/scoring/verify-current-parity.mjs'],{encoding:'utf8'})).toContain('CURRENT_PARITY_PASS'));
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
 it('keeps a predecessor immutable while an exact test-only reviewed successor is materialized',async()=>{
  const x=await setup();
  try{
   const predecessor=await x.service.score(x.f,x.reference);
   const successor=sign({...x.f,id:'SYNTHETIC-CURRENT-SUCCESSOR',priorScorecardId:predecessor.id,revisionReason:'Test-only candidate succession'});
   await expect(x.service.score(successor,x.reference)).rejects.toThrow('SYNTHETIC_UNTRUSTED_REVIEW');
   x.review(successor);
   await expect(x.service.score(sign({...successor,companyName:'Wrong hash'}),x.reference)).rejects.toThrow('SYNTHETIC_UNTRUSTED_REVIEW');
   const scored=await x.service.score(successor,x.reference);
   expect(scored.id).toBe(successor.id);
   const stored=await x.db.client.$queryRawUnsafe<{id:string;body_hash:string}[]>('SELECT id,body_hash FROM current_score_artifact ORDER BY id');
   expect(stored.map(row=>row.id)).toEqual([predecessor.id,successor.id]);
   x.review(x.f);
   expect((await x.service.find(predecessor.id))!.card).toEqual(predecessor);
  }finally{await x.db.close();}
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

describe('ACB pending liquidity successor with synthetic facts in isolated SQLite',()=>{
 it('keeps pending risk non-actionable, persists once and rejects changed scope or assessment',async()=>{
  const base=input('BANK');
  const asOf='2026-10-30T09:00:00.000Z';
  const securityId='658fafbe-65b3-4176-999f-d4d32e1bd838';
  const reviewId='ACB_M1_LIQUIDITY_REVIEW_CLOSED_2026_10_30';
  const evidence=base.evidence.map(e=>({...e,securityId,asOf,validThrough:asOf}));
  const f=sign({...base,asOf,securityId,currentPurpose:{...base.currentPurpose,economicCutoff:'2026-10-30'},
   reference:{...base.reference,data:{...base.reference.data,intervals:base.reference.data.intervals.map(row=>
    row.securityId===base.securityId?{...row,securityId,value:row.kind==='IDENTIFIER'?'ACB':row.value}:row)}},
   evidence:[...evidence,{...evidence[1],id:reviewId,observation:reviewId,family:reviewId}],
   stage0:{...base.stage0,asOf,status:'UNKNOWN',evidenceRefs:[reviewId]},
   hardVeto:{...base.hardVeto,asOf,status:'PENDING',evidenceRefs:[reviewId]},
   residualRisk:{...base.residualRisk,asOf}});
  const parent='current-bank-dataset:012ddaa99a1d0edd6a208e969a9d2811f01b848b44bf76d745e0dc8083056e8b';
  const x=await setup(f,'ACB',parent);
  const wrong=await setup(f,'ACB','SYNTHETIC_WRONG_DATASET');
  try{
   await expect(wrong.service.preflight(f,wrong.reference)).rejects.toMatchObject({
    issues: [expect.objectContaining({reason: 'CURRENT_SCORE_M1_UNRESOLVED'})],
   });
   for(const changed of [
    sign({...f,hardVeto:{...f.hardVeto,status:'ACTIVE'}}),
    sign({...f,stage0:{...f.stage0,evidenceRefs:['BQ-EQ-returns']}}),
    sign({...f,assessments:f.assessments.slice(1)}),
   ]){
    x.review(changed);
    await expect(x.service.score(changed,x.reference)).rejects.toThrow();
   }
   x.review(f);
   await x.service.preflight(f,x.reference);
   expect(await x.service.find(f.id)).toBeNull();
   const card=await x.service.score(f,x.reference);
   expect(card.input.hardVeto.status).toBe('PENDING');
   expect(card.validity).toBe('VALID — NON-ACTIONABLE');
   expect(card.flags).toContain('M1_PENDING_LIQUIDITY_SOURCE_NOT_VERIFIED');
   expect(card.operationalAuthorizationGranted).toBe(false);
   expect(await x.service.score(f,x.reference)).toEqual(card);
   expect((await x.service.find(f.id))?.card).toEqual(card);
   expect(Number((await x.db.client.$queryRawUnsafe<{n:number}[]>('SELECT count(*) n FROM current_score_artifact'))[0].n)).toBe(1);
  }finally{await x.db.close();await wrong.db.close();}
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
   const body=JSON.stringify({contract:'current-scoring-executable-authority-v2',status:'PROPOSED',purpose:'CURRENT_FORMAL_VALUATION'});await writeFile(join(x.db.directory,'proposal.json'),body);
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

describe('reviewable current authority transition',()=>{
 it('keeps signed semantic payload stable across genuine governance application, never across changed code or method semantics',async()=>{
  const {currentAuthorityApprovalPayload}=await import('@/infrastructure/source-admission/current-scoring-authority');
  const f=input(),proposal={...f.methodology,governanceStatus:'PROPOSED' as const,approvalReference:''};
  const applied={...f.methodology,governanceStatus:'APPROVED' as const,approvalReference:'SYNTHETIC_RECEIPT_NOT_REAL',recordedAt:instant('2026-11-18T01:00:00.000Z'),effectiveDate:dateOnly('2026-11-18')};
  const signed=hash(currentAuthorityApprovalPayload(proposal,'a'.repeat(64),'b'.repeat(64)));
  expect(hash(currentAuthorityApprovalPayload(applied,'a'.repeat(64),'b'.repeat(64)))).toBe(signed);
  expect(hash(currentAuthorityApprovalPayload(applied,'c'.repeat(64),'b'.repeat(64)))).not.toBe(signed);
  expect(hash(currentAuthorityApprovalPayload({...applied,semanticVersion:'9.0.0'},'a'.repeat(64),'b'.repeat(64)))).not.toBe(signed);
 });
});

describe('receipt application preserves the reviewed target',()=>{
 it('applies a SYNTHETIC receipt without changing signed code/method semantics or backdating',async()=>{
  const {currentAuthorityApprovalPayload,applyCurrentAuthorityProposal}=await import('@/infrastructure/source-admission/current-scoring-authority');
  const draft={...input().methodology,governanceStatus:'PROPOSED' as const,approvalReference:''};
  const payload={contract:'current-scoring-executable-authority-v2',status:'PROPOSED',purpose:'CURRENT_FORMAL_VALUATION',codeHash:'a'.repeat(64),baselineManifestHash:'b'.repeat(64),approvalPayloadHash:hash(currentAuthorityApprovalPayload(draft,'a'.repeat(64),'b'.repeat(64)))};
  const p={...payload,contentHash:hash(payload)};
  const applied=applyCurrentAuthorityProposal(p,draft,{path:'SYNTHETIC_OWNER_RECEIPT',sha256:'c'.repeat(64)},'2026-11-18T01:00:00.000Z');
  expect(applied.method.effectiveDate).toBe('2026-11-18');expect(applied.method.recordedAt).toBe('2026-11-18T01:00:00.000Z');expect(applied.authority.approvalPayloadHash).toBe(p.approvalPayloadHash);
  expect(()=>applyCurrentAuthorityProposal(p,draft,{path:'SYNTHETIC',sha256:'c'.repeat(64)},'2020-01-01T00:00:00.000Z')).toThrow();
 });
});

describe('Evidence-Based Conservative Scoring research preview', () => {
 function rejectionReason(run: () => unknown) {
  try {
   run();
  } catch (error) {
   if (error instanceof ValidationError) return error.issues[0]?.reason;
   throw error;
  }
  return null;
 }
 const conservative: ConservativeAssessment = {
  rubricId: 'BQ-EQ', band: 'Good economics',
  rationale: 'Synthetic evidence supports the lower point in this band.',
  evidenceRefs: ['BQ-EQ-persistence'], counterEvidenceRefs: ['BQ-EQ-returns'],
  counterEvidenceReview: 'Synthetic counter-evidence considered.',
 };

 it('keeps complete BANK arithmetic and excludes the research preview from ranking and allocation', () => {
  const f = input('BANK');
  const result = previewEvidenceBasedScore(f, [], hash);
  expect(result).toMatchObject({
   status: 'RESEARCH_ONLY', fullOfficialScore: null, eligibleForRanking: false, allocationAuthorized: false,
   confirmedScore: Number(calculateScorecard(f, hash).totalScore),
   ratedMaxPoints: 100, unratedMaxPoints: 0, coverageRatio: 1,
   scoreLowerBound: 82, scoreUpperBound: 82, unratedRubrics: [], conservativeRubrics: [],
  });
  expect(result.rubrics.every(rubric => rubric.state === 'VERIFIED')).toBe(true);
 });

 it('previews a single researched BANK input and rejects a mismatched ticker', () => {
  const f = input('BANK');
  const directory = mkdtempSync(join(tmpdir(), 'vn30-ebcs-'));
  try {
   const path = join(directory, 'preview.json');
   const renamed = sign({...f, reference: {...f.reference, data: {...f.reference.data,
    intervals: f.reference.data.intervals.map(row => row.kind === 'IDENTIFIER' && row.securityId === f.securityId
     ? {...row, value: 'ACB'} : row)}}});
   writeFileSync(path, JSON.stringify({
    contract: 'ebcs-research-preview-input-v1', input: renamed, conservativeAssessments: [],
   }));
   const args = ['tools/scoring/vn30_ebcs_preview.mjs', '--cutoff', f.currentPurpose.economicCutoff, '--input', path];
   const result = execFileSync(process.execPath, [...args, '--ticker', 'ACB'], {encoding: 'utf8'});
   expect(JSON.parse(result)).toMatchObject({ticker: 'ACB', status: 'RESEARCH_ONLY', fullOfficialScore: null});
   expect(() => execFileSync(process.execPath, [...args, '--ticker', 'VNM'], {stdio: 'pipe'}))
    .toThrow('EBCS_PREVIEW_SCOPE_MISMATCH');
  } finally {
   rmSync(directory, {recursive: true, force: true});
  }
 });

 it('supports the lower point of the reviewed band and rejects the upper point or unsupported rationale', () => {
  const f = input('BANK');
  const lower = sign({...f, assessments: f.assessments.map(row =>
   row.subcategory === 'BQ-EQ' ? {...row, selectedPoints: 5} : row)});
  expect(previewEvidenceBasedScore(lower, [conservative], hash).rubrics[0]).toMatchObject({
   state: 'CONSERVATIVE', points: 5,
  });
  expect(rejectionReason(() => previewEvidenceBasedScore(f, [conservative], hash))).toBe('EBCS_LOWEST_SUPPORTED_BAND_REQUIRED');
  expect(rejectionReason(() => previewEvidenceBasedScore(lower, [{...conservative, band: 'Average economics'}], hash)))
   .toBe('EBCS_LOWEST_SUPPORTED_BAND_REQUIRED');
  expect(rejectionReason(() => previewEvidenceBasedScore(lower, [{...conservative, counterEvidenceRefs: []}], hash)))
   .toBe('EBCS_EVIDENCE_MUST_MATCH_REVIEWED_RUBRIC');
  expect(rejectionReason(() => previewEvidenceBasedScore(lower, [{...conservative, evidenceRefs: ['RG-GOV-disclosure']}], hash)))
   .toBe('EBCS_EVIDENCE_MUST_MATCH_REVIEWED_RUBRIC');
 });

 it('separates genuine zero from four unrated rubrics and uses original weights in the interval', () => {
  const f = input('BANK');
  const omitted = ['FH-LIQ', 'FH-STRESS', 'RG-GOV', 'RG-RISK'];
  const partial = sign({...f, criticalMissing: ['Synthetic unresolved critical item'],
   assessments: f.assessments.filter(row => !omitted.includes(row.subcategory)).map(row =>
    row.subcategory === 'BQ-EQ' ? {...row, selectedPoints: 0, assessment: 'Value destructive'} : row)});
  const result = previewEvidenceBasedScore(partial, [], hash);
  expect(result).toMatchObject({
   status: 'RESEARCH_ONLY', fullOfficialScore: null, eligibleForRanking: false, allocationAuthorized: false,
   confirmedScore: 62, scoreLowerBound: 62, scoreUpperBound: 79,
   ratedMaxPoints: 83, unratedMaxPoints: 17, coverageRatio: .83,
   unratedRubrics: omitted,
  });
  expect(result.missingEvidence).toContain('Synthetic unresolved critical item');
  expect(result.rubrics[0]).toMatchObject({points: 0, state: 'VERIFIED'});
  expect(result.rubrics.find(row => row.rubricId === 'FH-LIQ')).toMatchObject({points: null, state: 'NOT_RATED'});
  expect(calculateScorecard(partial, hash).totalScore).toBeNull();
 });
});

it('authorizes and replays only the exact ACB limited coverage in isolated SQLite', async () => {
 const base = input('BANK');
 const asOf = '2026-10-30T09:00:00.000Z';
 const securityId = '658fafbe-65b3-4176-999f-d4d32e1bd838';
 const reviewId = 'ACB_M1_LIQUIDITY_REVIEW_CLOSED_2026_10_30';
 const evidence = base.evidence.map(row => ({...row, securityId, asOf, validThrough:asOf}));
 const f = sign({...base, asOf, securityId,
  methodology:{...base.methodology,methodologyId:ACB_LIMITED_METHOD},
  currentPurpose:{...base.currentPurpose,economicCutoff:'2026-10-30'},
  reference:{...base.reference,data:{...base.reference.data,intervals:base.reference.data.intervals.map(row =>
   row.securityId===base.securityId?{...row,securityId,value:row.kind==='IDENTIFIER'?'ACB':row.value}:row)}},
  evidence:[...evidence,{...evidence[1],id:reviewId,observation:reviewId,family:reviewId}],
  assessments:base.assessments.filter(row=>!ACB_UNRATED_RUBRICS.some(id=>id===row.subcategory)),
  stage0:{...base.stage0,asOf,status:'UNKNOWN',evidenceRefs:[reviewId]},
  hardVeto:{...base.hardVeto,asOf,status:'PENDING',evidenceRefs:[reviewId]},
  residualRisk:{...base.residualRisk,asOf,status:'NOT_RATED'}});
 const manifest = 'bff83724df834f2b29a7a4d0a3a3b573ab466aa2c2d4f72ab23f9b42b2825119';
 const acceptedAt = '2026-11-16T12:00:00.000Z';
 expect(acceptedAt < f.methodology.recordedAt && f.methodology.recordedAt < f.knownAt).toBe(true);
 const x = await setup(f,'ACB','current-bank-dataset:012ddaa99a1d0edd6a208e969a9d2811f01b848b44bf76d745e0dc8083056e8b',
  'current-bank-coverage:'+manifest,manifest,'current-data-acceptance:2624e22d282b23bd94db0834ecc6f012828350dce9ad2f729d994b30bdac614f',acceptedAt);
 const wrong = await setup(f,'ACB',x.dataset.parentDatasetId,'SYNTHETIC_OTHER_BINDING',manifest,x.dataset.dataAcceptanceId,acceptedAt);
 try {
  await expect(wrong.service.preflight(f,wrong.reference)).rejects.toMatchObject({
   issues:[expect.objectContaining({reason:'ACB_LIMITED_SCOPE_MISMATCH'})],
  });
  const incomplete = sign({...f,assessments:f.assessments.slice(1)});
  x.review(incomplete);
  await expect(x.service.preflight(incomplete,x.reference)).rejects.toMatchObject({
   issues:[expect.objectContaining({reason:'ACB_LIMITED_EXACT_RUBRIC_COVERAGE_REQUIRED'})],
  });
  const overRated = sign({...f, assessments:[...f.assessments, base.assessments.find(row=>row.subcategory==='BQ-MOAT')]});
  x.review(overRated);
  await expect(x.service.preflight(overRated,x.reference)).rejects.toMatchObject({
   issues:[expect.objectContaining({reason:'ACB_LIMITED_EXACT_RUBRIC_COVERAGE_REQUIRED'})],
  });
  x.review(f);
  const preflight = await x.service.preflight(f,x.reference);
  expect(preflight.reference.context.knownAt).toBe(acceptedAt);
  expect(preflight.knownAt).toBe(f.knownAt);
  expect(preflight.limitedCoverage).toMatchObject({
   status:'OFFICIAL_LIMITED',fullOfficialScore:null,eligibleForRanking:false,allocationAuthorized:false,
   confirmedScore:48,ratedMaxPoints:58,unratedMaxPoints:42,coverageRatio:.58,
   scoreLowerBound:48,scoreUpperBound:90,ratedRubricCount:14,totalRubricCount:23,
  });
  expect(Number((await x.db.client.$queryRawUnsafe<{n:number}[]>('SELECT count(*) n FROM current_score_artifact'))[0].n)).toBe(0);
  const card = await x.service.score(f,x.reference);
  expect(card.totalScore).toBeNull();
  expect(card.validity).toBe('NOT RELIABLY SCORABLE');
  expect(card).toMatchObject({limitedCoverage:preflight.limitedCoverage});
  expect(card.categories.filter(row=>row.points===null).map(row=>row.category)).toEqual(['BQ','FH','GQ','IC','VAL','RG','CA']);
  expect(card.subcategories.filter(row=>row.points===null).map(row=>row.id)).toEqual(ACB_UNRATED_RUBRICS);
  expect(preflight.limitedCoverage).toBeDefined();
  const markup = renderToStaticMarkup(createElement(LimitedCoverageView,{coverage:preflight.limitedCoverage!}));
  expect(markup).toContain('OFFICIAL_LIMITED · Excluded from investable ranking');
  expect(markup).toContain('48/58');
  expect(markup).toContain('58/100');
  expect(markup).toContain('48–90');
  expect(markup.match(/>N\/R</g)).toHaveLength(9);

  expect(await x.service.score(f,x.reference)).toEqual(card);
  expect((await x.service.find(card.id))?.card).toEqual(card);
  expect(await x.db.client.analyticalArtifact.count()).toBe(0);
  x.revokeAuthority();
  await expect(x.service.preflight(f,x.reference)).rejects.toThrow('SYNTHETIC_EXECUTABLE_NOT_APPROVED');
 } finally {
  await Promise.all([x.db.close(),wrong.db.close()]);
 }
});

it('sends the exact FPT three-rubric candidate through isolated authorization and enforces the V8 scope', async () => {
 const {routes}=JSON.parse(readFileSync('tools/scoring/vn30-score-routes.json','utf8'));
 const route=routes.find((row:{subject:{ticker:string}})=>row.subject.ticker==='FPT');
 const dir=route.assessment.path.slice(0,route.assessment.path.lastIndexOf('/'));
 const {input:candidate}=JSON.parse(readFileSync(join(dir,'FPT_WORKSTREAM_A_SUCCESSOR_V1.json'),'utf8')) as {input:ScoreInput};
 const {input:predecessor}=JSON.parse(readFileSync(route.assessment.path,'utf8')) as {input:ScoreInput};
 const reference=JSON.parse(readFileSync(route.reference.path,'utf8')) as PreScoringDatasetReference;
 const baseline=JSON.parse(readFileSync(join(dir,'FPT_V8_SCORE_READBACK.json'),'utf8'));
 const x=await setup(predecessor,'FPT','TEST-ONLY-FPT-DATASET',reference.bindingId,reference.manifestHash,
     baseline.dataAcceptanceId,reference.context.knownAt);
 try{
  const stored=await x.service.score(predecessor,x.reference);
  expect(stored.id).toBe(baseline.id);
  await expect(x.service.score(candidate,x.reference)).rejects.toThrow('SYNTHETIC_UNTRUSTED_REVIEW');
  expect(candidate.review.passes.map(pass=>pass.kind)).toEqual(['PREPARATION','CHALLENGE']);
  x.review(candidate); // test-only exact input trust; no owner receipt or route is written
  await expect(x.service.score(sign({...candidate,companyName:'Mismatched exact input'}),x.reference))
   .rejects.toThrow('SYNTHETIC_UNTRUSTED_REVIEW');
  await expect(x.service.score(candidate,x.reference)).rejects.toMatchObject({
   issues:[expect.objectContaining({reason:'FPT_LIMITED_EXACT_RUBRIC_COVERAGE_REQUIRED'})],
  });
  x.review(predecessor);
  expect((await x.service.find(predecessor.id))?.card).toEqual(stored);
  expect(await x.service.find(candidate.id)).toBeNull();
 }finally{await x.db.close();}
});
