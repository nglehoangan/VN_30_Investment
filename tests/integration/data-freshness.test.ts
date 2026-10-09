// @vitest-environment node
import {it,expect,vi} from 'vitest';
vi.mock('server-only',()=>({}));
import {testDatabase} from '../fixtures/database';
import {setupScoringReadiness} from '../fixtures/scoring-readiness-db';
import {setupFreshnessSnapshot} from '../fixtures/data-freshness';
import {readDataFreshness,publicDocumentUrl} from '@/infrastructure/repositories/data-freshness';
import {readDashboard} from '../../app/server/dashboard';
const view='2027-04-01T00:00:00.000Z';
it('empty data never invents universe or readiness counters and the data read bypasses portfolio/broker services',async()=>{
 const db=await testDatabase();try{const m=await readDashboard(db.client,'data',undefined,{viewedAt:view});expect(m.dataFreshness!.counts).toEqual({universe:null,coveredSecurities:null,selectedFacts:null,dataReady:null,scoringReady:null});expect(m.portfolio).toBeNull();expect(m.cards).toEqual([]);expect(m.brokerApiData).toBeUndefined();expect(await db.client.portfolioProjection.count()).toBe(0);}finally{await db.close();}
});
it('exact 30-member coverage and governed DATE_ONLY clocks are shown independently of DI readiness, with no writes',async()=>{
 const db=await testDatabase();try{const f=await setupScoringReadiness(db,true,'date-only'),services={facts:f.facts,snapshots:f.snapshots,derivations:f.derivations,readiness:f.datasets},before=await db.client.fundamentalSnapshotRun.findMany(),m=await readDashboard(db.client,'data',f.request.runId,{services,acceptanceId:f.acceptance.id,viewedAt:view}),d=m.dataFreshness!;
  expect(d.counts).toEqual({universe:30,coveredSecurities:30,selectedFacts:30,dataReady:1,scoringReady:1});expect(d.review.status).toBe('VERIFIED');expect(d.facts.find(o=>o.id===f.observations[0].id)!.publication).toMatchObject({publishedAt:null,publicationDate:'2026-07-25',publicationPrecision:'DATE_ONLY'});expect(d.facts[0].availability.availableAt).toBe(f.assessments[0].availableAt);expect(d.securities[0].requirements[0].freshnessAtView).toBe('EXCEEDS_PINNED_THRESHOLD');expect(d.securities[0].readiness!.readyForScoring).toBe(true);
  expect(await db.client.fundamentalSnapshotRun.findMany()).toEqual(before);expect(await db.client.analyticalArtifact.count()).toBe(0);expect(await db.client.scoringDatasetBinding.count()).toBe(0);expect(await db.client.portfolioProjection.count()).toBe(0);expect(m.portfolio).toBeNull();expect(m.brokerSnapshot).toBeUndefined();
 }finally{await db.close();}
},30_000);
it('stored DI PASS cannot establish readiness without trusted review capabilities; mismatched acceptance/run stays blocked',async()=>{
 const db=await testDatabase();try{const f=await setupScoringReadiness(db),services={facts:f.facts,snapshots:f.snapshots,derivations:f.derivations};const noReview=await readDataFreshness(db.client,view,f.request.runId,services,f.acceptance.id);expect(noReview.status).toBe('VERIFIED');expect(noReview.review.status).toBe('BLOCKED');expect(noReview.counts.dataReady).toBeNull();
 const other=await f.snapshots.seal({...f.request,runId:'another-ui-run'}),m=await readDataFreshness(db.client,view,other.request.runId,{...services,readiness:f.datasets},f.acceptance.id);expect(m.review.status).toBe('BLOCKED');expect(m.counts.scoringReady).toBeNull();expect((await readDataFreshness(db.client,view,f.request.runId)).status).toBe('BLOCKED');
 }finally{await db.close();}
},30_000);
it('unknown publication and excluded/missing requirements stay visible; public DTO withholds raw payloads, private references and credential URLs',async()=>{
 const db=await testDatabase();try{const f=await setupFreshnessSnapshot(db,true),m=await readDataFreshness(db.client,view,f.request.runId,f.services);expect(m.status).toBe('VERIFIED');expect(m.counts).toMatchObject({universe:1,coveredSecurities:0,selectedFacts:0,dataReady:null,scoringReady:null});expect(m.snapshot!.blockers).toContain('BLOCKED_PUBLICATION_UNKNOWN');expect(m.facts[0]).toMatchObject({selected:false,publication:{publishedAt:null,publicationPrecision:'UNKNOWN'},availability:{status:'UNKNOWN',availableAt:null}});expect(JSON.stringify(m)).not.toContain(f.canary);expect(m.facts[0].source.documentUrl).toBe('https://issuer.example/report.pdf');expect(JSON.stringify(m)).not.toContain('netProfitAfterTax');
 }finally{await db.close();}
});
it('a verified DATE_ONLY snapshot is readable by default composition without creating approvals or fabricated issuer times',async()=>{
 const db=await testDatabase();try{const f=await setupFreshnessSnapshot(db),m=await readDataFreshness(db.client,view,f.request.runId);expect(m.status).toBe('VERIFIED');expect(m.counts.universe).toBe(1);expect(m.facts[0].publication.publishedAt).toBeNull();expect(m.facts[0].availability.publicBoundary).toBe('2026-10-09T00:00:00.000Z');expect(m.review.status).toBe('UNAVAILABLE');expect(m.counts.dataReady).toBeNull();}finally{await db.close();}
});
it('tampered snapshot and malformed/absent run references fail closed without exposing diagnostics',async()=>{
 const db=await testDatabase();try{const f=await setupFreshnessSnapshot(db);for(const id of ['missing-run','../../private','bad?token=private']){const m=await readDataFreshness(db.client,view,id);expect(m.status).toBe('BLOCKED');expect(m.counts.universe).toBeNull();}
 await db.client.$executeRawUnsafe('DROP TRIGGER fundamental_snapshot_run_no_update');const row=await db.client.fundamentalSnapshotRun.findUniqueOrThrow({where:{runId:f.request.runId}});await db.client.fundamentalSnapshotRun.update({where:{runId:row.runId},data:{body:'{}'}});const m=await readDataFreshness(db.client,view,f.request.runId);expect(m.status).toBe('BLOCKED');expect(m.facts).toEqual([]);expect(JSON.stringify(m)).not.toContain(f.canary);
 }finally{await db.close();}
});
it('public document links reject private resources/userinfo and withhold signed queries/fragments without changing resource identity',()=>{
 for(const ref of ['file:///private/account','javascript:alert(1)','http://issuer.example/report','https://user:secret@issuer.example/report','https://127.0.0.1/report','https://host.local/report','opaque-private-reference'])expect(publicDocumentUrl(ref)).toBeNull();expect(publicDocumentUrl('https://issuer.example/report.pdf?token=secret#private')).toBeNull();expect(publicDocumentUrl('https://issuer.example/report.pdf')).toBe('https://issuer.example/report.pdf');
});
it('revision provenance resolves the pinned predecessor without including operator or raw capture bodies',async()=>{
 const db=await testDatabase();try{
  const f=await setupFreshnessSnapshot(db),correction={...f.observation,id:'ui-corrected-fact',recordVersion:'2',rawCaptureId:'ui-correction-capture',revisionKind:'PROVIDER_CORRECTION' as const,supersedesObservationId:f.observation.id,revisionReason:'Synthetic correction only',revisionEvidenceReference:'synthetic-correction-proof',correctionKnownAt:'2026-10-09T09:02:00.000Z',ingestedAt:'2026-10-09T09:02:00.000Z',normalized:{...f.observation.normalized,value:'16000000000'}};
  await f.services.facts.appendImport({...f.batch,id:'ui-correction-import',captureIds:[correction.rawCaptureId]},[{...f.capture,id:correction.rawCaptureId,importExecutionId:'ui-correction-import'}]);await f.services.facts.appendObservation(correction);const a=await f.services.snapshots.assess('ui-corrected-assessment',correction.id,f.policy,f.request.builtAt),s=await f.services.snapshots.seal({...f.request,runId:'ui-revision-run',assessmentPins:[...f.request.assessmentPins,{observationId:correction.id,assessmentId:a.id}]});const m=await readDataFreshness(db.client,view,s.request.runId,f.services);
  expect(m.status).toBe('VERIFIED');expect(m.counts.selectedFacts).toBe(1);expect(m.facts.find(o=>o.id===correction.id)!.revision.chain).toEqual([f.observation.id]);expect(m.facts.find(o=>o.id===f.observation.id)!.selected).toBe(false);expect(JSON.stringify(m)).not.toContain(f.canary);
 }finally{await db.close();}
});
it('governed derived lineage displays actual ordered operands and selected canonical constituent IDs',async()=>{
 const db=await testDatabase();try{
  const {snapshotDerivationFixture}=await import('../fixtures/snapshot'),{loadDerivationCrosswalk}=await import('@/infrastructure/fundamentals/derivation-crosswalk'),{deriveFundamentals}=await import('@/domain/fundamentals/derivation'),{normalizationHash}=await import('@/infrastructure/fundamentals/reviewed-statement'),{PrismaFundamentals}=await import('@/infrastructure/repositories/fundamentals'),{PrismaFundamentalSnapshot}=await import('@/infrastructure/repositories/fundamental-snapshot'),{PrismaFundamentalDerivation}=await import('@/infrastructure/repositories/fundamental-derivation'),{release}=await import('../fixtures/fundamentals');
  const f=snapshotDerivationFixture(),crosswalk={...loadDerivationCrosswalk(release).crosswalk,registryHash:f.registry.registryHash,recordedAt:f.policy.recordedAt,effectiveDate:'2026-01-01'},facts=new PrismaFundamentals(db.client,f.registry),snapshots=new PrismaFundamentalSnapshot(db.client,f.registry),derivations=new PrismaFundamentalDerivation(db.client,f.registry);
  await db.client.security.create({data:{id:f.observation.securityId,name:'SYNTHETIC DERIVED UI ONLY'}});await facts.appendSource(f.source);await facts.appendImport({...f.batch,captureIds:f.observations.map(o=>o.rawCaptureId)},f.observations.map(o=>({...f.capture,id:o.rawCaptureId})));
  for(const o of f.observations){await facts.appendObservation(o);await snapshots.assess('assessment-'+o.id,o.id,f.policy,f.assessment.assessedAt);}
  const request={id:f.request.derivedIds[0],scope:f.request.scope,securityId:f.observation.securityId,sector:f.observation.sector,metric:'FCF' as const,periodStart:f.observation.periodStart,periodEnd:f.observation.periodEnd,cyclical:false,operands:f.observations.map(o=>({id:'operand-'+o.id,operation:'REPORTED' as const,observationIds:[o.id],adjustment:null}))},d=deriveFundamentals({request,recordedAt:f.request.builtAt,registry:f.registry,crosswalk,crosswalkHash:normalizationHash(crosswalk),observations:f.observations,hash:normalizationHash});await derivations.append(d);await snapshots.seal(f.request);
  const m=await readDataFreshness(db.client,view,f.request.runId,{facts,snapshots,derivations});expect(m.status).toBe('VERIFIED');expect(m.derived[0]).toMatchObject({value:'70',selected:true});expect(m.derived[0].operands.map(v=>v.observationIds)).toEqual(f.observations.map(o=>[o.id]));expect(m.derived[0].operands.map(v=>v.value)).toEqual(['100','30']);
 }finally{await db.close();}
});
