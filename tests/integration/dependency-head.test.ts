// @vitest-environment node
import {it,expect} from 'vitest';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {testDatabase} from '../fixtures/database';
import {dependencyFixture,changedFundamentalHeads,portfolioHead} from '../fixtures/dependencies';
import {ProductionDependencies} from '@/application/dependencies/service';
import {PrismaDependencyRegistry} from '@/infrastructure/repositories/dependencies';
import {hashBytes} from '@/infrastructure/market-boundary/tcbs-pipeline';
import {snapshotHash as hash} from '@/infrastructure/fundamentals/snapshot-hash';
import {ref,makeRelease,head} from '@/domain/dependencies/validation';
import {reference,seal} from '@/domain/market-boundary/validation';
import {retainedDependencyBootstrap,acceptedBootstrapBinding} from '@/infrastructure/dependency-catalog';
import type {Head,Resolution} from '@/domain/dependencies/contracts';
const dbcase=async(fn:(f:ReturnType<typeof dependencyFixture>,repo:PrismaDependencyRegistry,service:ProductionDependencies,db:Awaited<ReturnType<typeof testDatabase>>)=>Promise<void>)=>{const db=await testDatabase();try{const f=dependencyFixture(),repo=new PrismaDependencyRegistry(db.client),service=new ProductionDependencies(repo,f.catalog,f.clock,hash);await fn(f,repo,service,db);}finally{await db.close();}};
it('bootstrap binds accepted exact data without fabricating active model/policy authority',()=>{const b=retainedDependencyBootstrap(process.cwd());expect(b.heads).toHaveLength(8);expect(b.missingAuthority).toEqual(['POLICY','SCORING_MODEL','RISK_POLICY']);expect(b.status).toBe('BLOCKED_REQUIRES_AUTHORITY_RESOLUTION');});
it('production resolves internally; caller-selected IDs/mode rejected; every head hash and required slot is checked',()=>dbcase(async(f,repo,s)=>{
 await s.activate(null,'synthetic test bootstrap');const r=await s.resolveProductionAnalysisDependencies({purpose:'VALUATION',requestedAsOf:f.at});expect(r.heads).toHaveLength(13);
 for(const key of ['universe','fundamentals','partition','exceptions','policy','scoringModel','mode'])await expect(s.resolveProductionAnalysisDependencies({purpose:'VALUATION',requestedAsOf:f.at,[key]:'OLD'} as never)).rejects.toThrow('CALLER_SELECTED_STALE_HEAD');
 const missing=f.heads.filter(h=>h.type!=='POLICY');expect(()=>makeRelease(missing,null,f.at,'test',hash)).toThrow();
 expect(()=>makeRelease(f.heads.map(h=>h.type==='UNIVERSE'?{...h,pin:{...h.pin,hash:hash('wrong')}}:h),null,f.at,'test',hash)).toThrow('HEAD_HASH_MISMATCH');
 await expect(repo.find({id:'UNKNOWN',hash:hash('unknown')})).rejects.toThrow('UNKNOWN_HEAD');
}));
it('CAS A→B succeeds; concurrent A→C fails; retry after B checks compatibility; no partial release leaks',()=>dbcase(async(f,repo,s,db)=>{
 const a=await s.activate(null,'A'),b=makeRelease(f.heads,ref(a),f.at,'B',hash),c=makeRelease(f.heads,ref(a),f.at,'C',hash);
 const outcomes=await Promise.allSettled([repo.activate(b,ref(a)),repo.activate(c,ref(a))]);expect(outcomes.filter(o=>o.status==='fulfilled')).toHaveLength(1);const active=(await repo.current())!;
 expect([b.id,c.id]).toContain(active.id);await expect(repo.activate(c,ref(a))).rejects.toThrow('CAS_CONFLICT');
 const incompatible=f.heads.map(h=>h.type==='SCORING_MODEL'?{...h,requires:[{type:'POLICY' as const,pin:{id:'OLD',hash:hash('old')}}]}:h);expect(()=>makeRelease(incompatible,ref(active),f.at,'retry',hash)).toThrow('INCOMPATIBLE_DEPENDENCY_SET');
 await db.client.$executeRawUnsafe("CREATE TRIGGER test_release_failure BEFORE INSERT ON dependency_release BEGIN SELECT RAISE(ABORT,'injected'); END");
 const count=await db.client.marketBoundaryRecord.count();await expect(repo.activate(makeRelease(changedFundamentalHeads(f.heads,f.at),ref(active),f.at,'failed',hash),ref(active))).rejects.toThrow();expect(await db.client.marketBoundaryRecord.count()).toBe(count);expect(ref((await repo.current())!)).toEqual(ref(active));expect(await db.client.dependencyRelease.count()).toBe(2);await db.client.$executeRawUnsafe('DROP TRIGGER test_release_failure');const retry=makeRelease(f.heads,ref(active),f.at,'reconciled retry',hash);await repo.activate(retry,ref(active));expect(ref((await repo.current())!)).toEqual(ref(retry));
}));
it('analysis fundamental change mid-flight blocks sealing; historical release remains replayable and cache stale',()=>dbcase(async(f,repo,s,db)=>{
 const a=await s.activate(null,'A'),r=await s.resolveProductionAnalysisDependencies({purpose:'VALUATION',requestedAsOf:f.at}),candidate=f.analysis(r);
 f.beforeValidate(async()=>{const next=changedFundamentalHeads(f.heads,f.at);f.setHeads(next);await s.activate(ref(a),'accepted synthetic new fundamental release');});
 await expect(s.sealAnalysis(candidate,r)).rejects.toThrow('DEPENDENCY_CHANGED_DURING_ANALYSIS');expect(await db.client.productionDependencyPublication.count()).toBe(0);
 expect((await s.replayHistorical(ref(a),f.at)).publicationAuthority).toBe(false);expect(await s.cacheState(ref(a))).toBe('STALE_DEPENDENCY');
 const replay=await s.replayHistorical(ref(a),f.at);await expect(s.sealAnalysis(candidate,{...r,mode:replay.mode} as unknown as Resolution)).rejects.toThrow('REPLAY_MODE_PRODUCTION_ESCAPE');
 await expect(repo.find({...ref(a),hash:hash('tamper')})).rejects.toThrow();
}));
it.each(['PARTITION','TCX_EXCEPTION'] as const)('%s authority change mid-analysis fails closed; market alone cannot promote MBB',type=>dbcase(async(f,_repo,s,db)=>{
 await s.activate(null,'A');const r=await s.resolveProductionAnalysisDependencies({purpose:'VALUATION',requestedAsOf:f.at});
 f.beforeValidate(async()=>{const next=structuredClone(f.heads) as Head[];const l=head(next,'LEVEL1_RELEASE'),content=structuredClone(l.content) as {exceptions:{status:string}[];partition:{members:{ticker:string;score:null}[]}};if(type==='TCX_EXCEPTION')content.exceptions[0].status='REVOKED';else content.partition.members[0].score=0 as never;next[next.indexOf(l)]={...l,content,pin:{...l.pin,hash:hash(content)}};f.setHeads(next);});
 await expect(s.sealAnalysis(f.analysis(r),r)).rejects.toThrow('AUTHORITATIVE_HEAD_SUPERSEDED');expect(await db.client.productionDependencyPublication.count()).toBe(0);
 const init=head(r.heads,'INITIALIZATION').content as {body:{members:{ticker:string;state:string}[];exceptions:{amountVnd:string}[]}};expect(init.body.members.filter(m=>m.state==='SCORABLE')).toHaveLength(29);expect(init.body.members.find(m=>m.ticker==='MBB')?.state).toBe('DEFERRED');expect(init.body.exceptions[0].amountVnd).toBe('5284485167173');
}));
it('stale/missing market blocks refresh; expiry during analysis and at SQL publication rolls back',()=>dbcase(async(f,repo,s,db)=>{
 await s.activate(null,'A');const r=await s.resolveProductionAnalysisDependencies({purpose:'VALUATION',requestedAsOf:f.at}),a=f.analysis(r);f.beforeValidate(async()=>{f.setNow('2026-10-25T08:00:00.000Z');});
 await expect(s.sealAnalysis(a,r)).rejects.toThrow('REFRESH_REQUIRED');await expect(s.resolveProductionAnalysisDependencies({purpose:'VALUATION',requestedAsOf:f.at})).rejects.toThrow('REFRESH_REQUIRED');
 f.setNow(f.at);f.beforeValidate(async()=>{});const p=await s.sealAnalysis(f.analysis(r,'published-analysis'),r);expect((await repo.publication(ref(p))).analysisRelease).toEqual(r.release);
 await db.client.$executeRawUnsafe("CREATE TRIGGER test_binding_failure BEFORE INSERT ON production_dependency_publication BEGIN SELECT RAISE(ABORT,'injected'); END");
 await expect(s.sealAnalysis(f.analysis(r,'failed-analysis'),r)).rejects.toThrow();expect(await db.client.marketBoundaryRecord.findUnique({where:{id:'failed-analysis'}})).toBeNull();
 await expect(db.client.dependencyRelease.deleteMany()).rejects.toThrow();await expect(db.client.productionDependencyPublication.update({where:{id:p.id},data:{body:'{}'}})).rejects.toThrow();
}));
it('policy/release and live ledger changes invalidate decisions; persistence never trusts stale portfolio watermark',()=>dbcase(async(f,repo,s,db)=>{
 const owner='synthetic-ledger';await db.client.portfolio.create({data:{id:owner,name:'Synthetic test',currency:'VND',createdAt:f.at,inceptionAt:f.at,revision:'0'}});const ph=portfolioHead(f,owner);f.heads.push(ph);f.setHeads(f.heads);
 const first=await s.activate(null,'A'),r=await s.resolveProductionAnalysisDependencies({purpose:'VALUATION',requestedAsOf:f.at}),a=await s.sealAnalysis(f.analysis(r),r);
 await s.resolveProductionDecisionDependencies(ref(a),'VALUATION');
 const base=f.analysis(r).body;const decision=seal('DECISION','synthetic-decision',f.at,f.at,{decisionId:'synthetic-id',securityId:r.heads[0].pin.id,decisionTimestamp:f.at,decisionState:'TEST_ONLY',analysis:reference(a.snapshot),initialization:base.initialization,market:base.market!,portfolio:ph.pin,universe:base.universe,fundamentals:base.fundamentals,policy:base.policy,scoringModel:base.scoringModel,disposition:(head(r.heads,'INITIALIZATION').content as import('@/domain/market-boundary/contracts').Sealed<'INITIALIZATION'>).body.dispositions,exceptions:base.exceptions,sourceHashes:base.sourceHashes,engineVersion:'synthetic-engine-v1',freshness:base.freshness,eligibilityProof:base.prerequisiteProof,dependenciesHash:r.release.hash,executionEligibility:'PASS'},hash);
 await db.client.portfolio.update({where:{id:owner},data:{revision:'1'}});
 const payload={contract:'production-dependency-publication-v1' as const,id:'synthetic-publication',kind:'DECISION' as const,createdAt:f.at,snapshot:decision,analysisRelease:r.release,decisionRelease:r.release};
 await expect(repo.publish({...payload,contentHash:hash(payload)},r.release,()=>f.at)).rejects.toThrow('PORTFOLIO_CHANGED_AT_PUBLICATION');
 await expect(s.sealDecision(decision,ref(a),r)).rejects.toThrow('DECISION_PURPOSE_NOT_QUALIFIED');expect(await db.client.marketBoundaryRecord.findUnique({where:{id:decision.id}})).toBeNull();
 const changed=[...f.heads.filter(h=>h.type!=='PORTFOLIO'),portfolioHead(f,owner,'1')];f.setHeads(changed);await s.activate(ref(first),'ledger changed');await expect(s.resolveProductionDecisionDependencies(ref(a),'VALUATION')).rejects.toThrow(/REANALYSIS_REQUIRED|REVALIDATION_REQUIRED/);
}));

it('dependency change between final validation and SQL transaction rejects atomically',()=>dbcase(async(f,repo,s,db)=>{
 const a=await s.activate(null,'A'),r=await s.resolveProductionAnalysisDependencies({purpose:'VALUATION',requestedAsOf:f.at}),original=repo.publish.bind(repo);
 repo.publish=async(p,expected,clock)=>{f.setHeads(changedFundamentalHeads(f.heads,f.at));await s.activate(ref(a),'new accepted release at publication');return original(p,expected,clock);};
 await expect(s.sealAnalysis(f.analysis(r),r)).rejects.toThrow('DEPENDENCY_CHANGED_AT_PUBLICATION');expect(await db.client.productionDependencyPublication.count()).toBe(0);expect(await db.client.marketBoundaryRecord.findUnique({where:{id:'synthetic-analysis'}})).toBeNull();
}));
it('market activation cannot promote MBB; expiry at final transaction check leaves no partial snapshot',()=>dbcase(async(f,repo,s,db)=>{
 const a=await s.activate(null,'A'),r=await s.resolveProductionAnalysisDependencies({purpose:'VALUATION',requestedAsOf:f.at}),snapshot=f.analysis(r),payload={contract:'production-dependency-publication-v1' as const,id:'expiry-publication',kind:'ANALYSIS' as const,createdAt:f.at,snapshot,analysisRelease:ref(a),decisionRelease:null};let reads=0;
 await expect(repo.publish({...payload,contentHash:hash(payload)},ref(a),()=>++reads===1?f.at:'2026-10-25T08:00:00.000Z')).rejects.toThrow('EXPIRED_MARKET_AT_PUBLICATION');expect(await db.client.marketBoundaryRecord.findUnique({where:{id:snapshot.id}})).toBeNull();
 const next=structuredClone(f.heads) as Head[],l=head(next,'LEVEL1_RELEASE'),level=structuredClone(l.content) as {partition:{members:{ticker:string;state:string;score:unknown}[]}};const mbb=level.partition.members.find(m=>m.ticker==='MBB')!;mbb.state='SCORABLE';mbb.score=0;next[next.indexOf(l)]={...l,content:level,pin:{...l.pin,hash:hash(level)}};expect(()=>makeRelease(next,ref(a),f.at,'market cannot promote',hash)).toThrow();
}));
it('same immutable object ID with changed content is an integrity error; projection remains unchanged',()=>dbcase(async(f,repo,s)=>{
 const a=await s.activate(null,'A'),state=head(f.heads,'RISK_STATE'),next=f.heads.map(h=>h===state?{...h,content:'changed',pin:{...h.pin,hash:hash('changed')}}:h);
 await expect(repo.activate(makeRelease(next,ref(a),f.at,'illegal same ID',hash),ref(a))).rejects.toThrow('HEAD_ID_CONTENT_CHANGED');expect(ref((await repo.current())!)).toEqual(ref(a));
 await expect(s.replayHistorical(ref(a),'2020-01-01T00:00:00.000Z')).rejects.toThrow('PIT_HEAD_UNAVAILABLE');
}));
it('missing market requests refresh, and incompatible/unknown dependencies cannot activate',()=>dbcase(async(f,repo,s)=>{
 const noMarket=f.heads.filter(h=>h.type!=='MARKET');f.setHeads(noMarket);await s.activate(null,'static initialization does not need market');await expect(s.resolveProductionAnalysisDependencies({purpose:'VALUATION',requestedAsOf:f.at})).rejects.toThrow('REFRESH_REQUIRED');
 expect(()=>makeRelease([...f.heads,{...f.heads[0],type:'UNKNOWN'} as never],null,f.at,'bad',hash)).toThrow('UNKNOWN_OR_UNAPPROVED_HEAD');expect((await repo.current())!.heads.some(h=>h.type==='MARKET')).toBe(false);
}));
it('policy supersession blocks new decision from old analysis while historical binding stays immutable',()=>dbcase(async(f,repo,s)=>{
 const a=await s.activate(null,'A'),r=await s.resolveProductionAnalysisDependencies({purpose:'VALUATION',requestedAsOf:f.at}),publication=await s.sealAnalysis(f.analysis(r),r),oldPolicy=head(f.heads,'POLICY'),newPolicy={...oldPolicy,pin:{id:oldPolicy.pin.id+':v2',hash:hash('synthetic-policy-v2')},content:'synthetic-policy-v2'};
 const next=f.heads.map(h=>h===oldPolicy?newPolicy:{...h,requires:h.requires.map(p=>p.type==='POLICY'?{...p,pin:newPolicy.pin}:p)});f.setHeads(next);await s.activate(ref(a),'synthetic accepted policy update');
 await expect(s.resolveProductionDecisionDependencies(ref(publication),'VALUATION')).rejects.toThrow(/REANALYSIS_REQUIRED|REVALIDATION_REQUIRED/);expect((await repo.publication(ref(publication))).analysisRelease).toEqual(ref(a));
}));

it('bootstrap ignores newer unapproved candidate pointers and checks the accepted-review seal',()=>{
 const root=mkdtempSync(join(tmpdir(),'dependency-accepted-')),folder='docs/fundamental-data-engine/evidence/2026-10-20-di14-di15-final-acceptance/',path=folder+'MARKET_SOURCE_REPLAY.json';
 try{mkdirSync(join(root,folder),{recursive:true});mkdirSync(join(root,'data/market-boundary'),{recursive:true});
 const content=JSON.stringify({candidateBinding:{path:'fixed-reviewed.json',sha256:hash('reviewed')}});writeFileSync(join(root,path),content);
 const bytesHash=hashBytes(content);writeFileSync(join(root,folder,'ARTIFACT_HASHES.json'),JSON.stringify({overlayFiles:{[path]:bytesHash}}));writeFileSync(join(root,'data/market-boundary/active-candidate.json'),JSON.stringify({path:'UNAPPROVED_NEW_CANDIDATE'}));
 expect(acceptedBootstrapBinding(root).path).toBe('fixed-reviewed.json');writeFileSync(join(root,path),'{}');expect(()=>acceptedBootstrapBinding(root)).toThrow('ACCEPTED_BOOTSTRAP_REVIEW_HASH');
 }finally{rmSync(root,{recursive:true,force:true});}
});

it('staged lifecycle receives original snapshot binding time while freshness revalidation uses the trusted current clock',()=>dbcase(async(f,_repo,s)=>{
 await s.activate(null,'A');const r=await s.resolveProductionAnalysisDependencies({purpose:'VALUATION',requestedAsOf:f.at}),a=f.analysis(r);f.setNow(new Date(Date.parse(f.at)+1000).toISOString());
 f.catalog.validateAnalysis=async(record,_resolution,request)=>{expect(request.requestedAt).toBe(record.body.analysisTimestamp);expect(request.knownAt).toBe(record.knownAt);expect(request.now).toBe(f.clock.now());return record;};
 const publication=await s.sealAnalysis(a,r);expect(publication.snapshot.id).toBe(a.id);
}));
