import './lib/ts-runtime.mjs';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {posix} from 'node:path';
const {buildHybridAdmission}=await import('../src/domain/fundamentals/hybrid-admission.ts');
const {financialHash}=await import('../src/infrastructure/fundamentals/hybrid-input.ts');
const {financialTargets,evaluateHybridTarget,selectHybridCurrentPeriods}=await import('../src/domain/fundamentals/hybrid-sufficiency.ts');
const {validatePolicyBAdmission,evaluatePolicyBDI15,assertPolicyBAction,POLICY_B_ACTIONS,GLOBAL_BLOCKERS}=await import('../src/domain/fundamentals/partial-universe.ts');
const {SECTORS}=await import('../src/domain/scoring/methodology.ts');
const O='docs/fundamental-data-engine/evidence/2026-10-17-data-initialization-final-acceptance/',B='docs/fundamental-data-engine/evidence/2026-10-17-di15-partial-universe-amendment/',G='docs/fundamental-data-engine/evidence/2026-10-16-di-governance-closure/',HEAD='68aa87f9ae4478714ec6ca676e5a3b2addf0d77f';
const read=p=>JSON.parse(readFileSync(p,'utf8')),sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),write=(n,v)=>writeFileSync(O+n+'.json',JSON.stringify(v,null,2)+'\n');
assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),HEAD);
const original=read(B+'UNIVERSE_PARTITION.json'),dispositions=read(G+'DISPOSITION_DETAILS_AFTER_FIX.json'),official=read(G+'OFFICIAL_VN30_UNIVERSE_REVIEW.json');
const baseline=p=>createHash('sha256').update(execFileSync('git',['show',HEAD+':'+posix.normalize(p)],{maxBuffer:64*1024*1024})).digest('hex');
const tracked=new Set(execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0'));
const preserved=[];for(const r of read(B+'ARTIFACT_HASHES.json').artifacts){assert.equal(sha(r.path),r.sha256,r.path);preserved.push({path:r.path,sha256:r.sha256});}
validatePolicyBAdmission(original,financialHash);
const rows=[],boundSources=new Map();
for(const identity of original.universe.identities){
 const r=dispositions.rows.find(r=>r.ticker===identity.ticker);assert(r);
 for(const p of [r.inputPath,r.canonicalPath,r.finalPath])assert.equal(sha(p),baseline(p),'STARTING_RELEASE_DIVERGENCE:'+p);
 const input=read(r.inputPath),actual=buildHybridAdmission(input,financialHash),expected=read(r.canonicalPath);assert.deepEqual(actual,expected);
 assert.equal(input.universe.length,1);assert.equal(input.universe[0].ticker,identity.ticker);assert.equal(input.universe[0].sector,r.sector);assert(SECTORS.includes(r.sector));
 assert(actual.canonicalFacts.every(f=>f.ticker===identity.ticker));assert(actual.derivedMetrics.every(f=>f.ticker===identity.ticker));
 for(const b of input.sourceBindings){assert.equal(sha(b.path),b.sha256,b.path);if(tracked.has(posix.normalize(b.path)))assert.equal(sha(b.path),baseline(b.path),'SOURCE_CHANGED:'+b.path);boundSources.set(posix.normalize(b.path),b.sha256);}
 const targets=financialTargets(input).map(t=>evaluateHybridTarget(t,r.sector,actual,input)),current=selectHybridCurrentPeriods(input,actual).find(t=>t.ticker===identity.ticker);
 const issues=original.issues.filter(i=>i.securityId===identity.securityId&&i.status==='OPEN'&&['MAJOR','CRITICAL'].includes(i.severity));
 const pass=targets.every(t=>t.CORE.available===t.CORE.required&&t.SECTOR_CORE.available===t.SECTOR_CORE.required)&&!current.CURRENT_TRAJECTORY.missingCurrentYtd&&!actual.unresolvedIssuerConflicts.length&&!issues.length;
 const member=original.members.find(m=>m.securityId===identity.securityId);assert.equal(member.state,pass?'SCORABLE':'DEFERRED');assert.equal(r.state,pass?'CLOSED':'DEFERRED_BLOCKED');
 assert.equal(actual.readyForScoring,false);assert.notEqual(actual.decisionReady,true);
 rows.push({...identity,sector:r.sector,state:member.state,inputPath:r.inputPath,inputSHA256:sha(r.inputPath),canonicalPath:r.canonicalPath,canonicalFileSHA256:sha(r.canonicalPath),snapshotId:actual.snapshotId,contentHash:actual.contentHash,mode:actual.mode,analysisAt:input.analysisAt,systemKnownAt:input.systemKnownAt,canonicalFacts:actual.canonicalFacts.length,derivedMetrics:actual.derivedMetrics.length,sourceBindings:input.sourceBindings.length,targets,current,exactBlockerIds:issues.map(i=>i.id),score:null,readyForScoring:false,decisionReady:false});
}
assert.equal(rows.length,30);assert.equal(rows.filter(r=>r.state==='SCORABLE').length,25);assert.deepEqual(rows.filter(r=>r.state==='DEFERRED').map(r=>r.ticker).sort(),['MBB','TCX','VIB','VIC','VNM']);
assert.equal(official.status,'CERTIFIED');assert.deepEqual([...official.composition].sort(),rows.map(r=>r.ticker).sort());assert.equal(original.issues.length,6);assert(original.issues.every(i=>i.severity==='MAJOR'&&i.status==='OPEN'));
// Tests of quarantine must not pass merely because an unrelated prerequisite is blocked.
// This isolated in-memory all-PASS fixture is discarded; it is never saved as release authority.
const fixture={...original,prerequisites:original.prerequisites.map(g=>({...g,status:'PASS'}))};assert.equal(evaluatePolicyBDI15(fixture,financialHash).status,'PASS');
const actions=[];for(const m of fixture.members.filter(m=>m.state==='DEFERRED'))for(const action of POLICY_B_ACTIONS){assert.throws(()=>assertPolicyBAction(fixture,m.securityId,action,financialHash));actions.push({ticker:m.ticker,action,status:'DENIED'});}
const faultTests=GLOBAL_BLOCKERS.map(classification=>{
 const issue={id:'final-release-fault-'+classification,securityId:null,kind:'GLOBAL_SYSTEM_BLOCKER',severity:'MAJOR',status:'OPEN',classification,detail:'Synthetic failure injection only; not an observed release issue.',provenance:[{reference:'synthetic-test',sha256:'a'.repeat(64)}],resolutionReference:null};
 const issues=[...fixture.issues,issue],mutated={...fixture,issues,sourceIssueRegister:{...fixture.sourceIssueRegister,issues,issuesHash:financialHash(issues)}};
 const result=evaluatePolicyBDI15(mutated,financialHash);assert.equal(result.quarantineStatus,'FAIL');assert.equal(result.status,'FAIL');return {classification,status:'PASS',result:'GLOBAL_DI15_FAIL'};
});
write('ACCOUNTING_RECONSTRUCTION',{status:'PASS',startingCommit:HEAD,rows,sourceHashes:[...boundSources].map(([path,sha256])=>({path,sha256})),policyBPackagePreserved:preserved.length,sourcePreservationRule:'Tracked source bytes match starting commit; private untracked originals match the exact SHA256 in starting-commit-pinned retained inputs. Originals are never assumed to be git objects.',accountingChanges:0,sourceChanges:0,sourceIssueChanges:0});
write('QUARANTINE_AND_GLOBAL_CHECKS',{status:'PASS',quarantineActions:actions,globalFailureInjections:faultTests,observedIntegrityBlockers:[],allCriticalRemainGlobal:true,independentApprovalGranted:false});
write('UNIVERSE_RECONCILIATION',{status:'PASS',asOf:official.asOf,certificationReference:G+'OFFICIAL_VN30_UNIVERSE_REVIEW.json',certificationSHA256:sha(G+'OFFICIAL_VN30_UNIVERSE_REVIEW.json'),certifiedNames:[...official.composition].sort(),reconstructedNames:rows.map(r=>r.ticker).sort(),universe:original.universe,FULL_UNIVERSE_COUNT:30,SCORABLE_UNIVERSE_COUNT:25,DEFERRED_UNIVERSE_COUNT:5,discrepancy:[],certificationScope:'Pinned certified2026-10-16 universe, not an unverified live2026-10-17 update.'});
writeFileSync(O+'EXCEPTION_REGISTER.json',readFileSync(B+'DEFERRED_EXCEPTION_REGISTER.json'));
console.log(JSON.stringify({status:'PASS',partition:[30,25,5],uniqueSourceHashes:boundSources.size,policyBArtifactsPreserved:preserved.length,quarantineActionsDenied:actions.length,globalFailureClasses:faultTests.length}));
