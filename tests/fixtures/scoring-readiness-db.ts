import {scoringReadinessFixture} from './scoring-readiness';
import type {testDatabase} from './database';
import {PrismaFundamentals} from '@/infrastructure/repositories/fundamentals';
import {PrismaFundamentalSnapshot} from '@/infrastructure/repositories/fundamental-snapshot';
import {PrismaFundamentalDerivation} from '@/infrastructure/repositories/fundamental-derivation';
import {PrismaScoringDatasets} from '@/infrastructure/repositories/scoring-datasets';
import {ScoringEngine} from '@/application/scoring/engine';
import {PrismaAnalyticalArtifacts} from '@/infrastructure/repositories/analytical-artifacts';
import {snapshotHash} from '@/infrastructure/fundamentals/snapshot-hash';
export async function setupScoringReadiness(db:Awaited<ReturnType<typeof testDatabase>>,accept=true){
 const f=scoringReadinessFixture(),a=f.acceptance;
 const method=(methodologyId:string,approvalReference:string,configurationReference:string)=>({methodologyId,family:'SYNTHETIC_CONTRACT_TEST',semanticVersion:'1.0.0',approvalReference,governanceStatus:'APPROVED',intendedUse:'PRODUCTION',effectiveDate:'2026-01-01',configurationReference,implementationIdentity:'synthetic-only-contract-implementation',governingDocumentReference:'synthetic-only-authority',recordedAt:f.policy.recordedAt});
 for(const data of [method(f.registry.manifest.methodologyIdentity,f.registryBinding.approvalReference,'registry-sha256:'+f.registry.registryHash),method(f.policyBinding.methodologyId,f.policyBinding.approvalReference,'availability-sha256:'+f.policyBinding.policyHash),method(f.requirements.methodologyId,f.requirements.approvalReference,'readiness-requirements-sha256:'+f.acceptance.requirementsHash),{...method(a.methodologyId,a.approvalReference,'di-acceptance-sha256:'+snapshotHash(a)),recordedAt:a.acceptedAt},f.input.methodology])await db.client.methodologyRecord.create({data});
 const facts=new PrismaFundamentals(db.client,f.registry,f.registryBinding),snapshots=new PrismaFundamentalSnapshot(db.client,f.registry,f.registryBinding,f.policyBinding),derivations=new PrismaFundamentalDerivation(db.client,f.registry,f.registryBinding);
 await db.client.security.createMany({data:f.observations.map(o=>({id:o.securityId,name:'Synthetic Slice06 issuer'}))});await facts.appendSource(f.source);await facts.appendImport(f.batch,f.captures);
 for(const o of f.observations){await facts.appendObservation(o);await snapshots.assess('assessment-'+o.id,o.id,f.policy,f.assessment.assessedAt);}await snapshots.seal(f.request);
 const datasets=new PrismaScoringDatasets(db.client,snapshots,facts,derivations,f.registry,[f.reviewBinding]);if(accept)await datasets.appendAcceptance(a);
 const artifacts=new PrismaAnalyticalArtifacts(db.client),engine=new ScoringEngine(db.registry,artifacts,datasets),selection={snapshotRunId:f.request.runId,acceptanceId:a.id};return {...f,facts,snapshots,derivations,datasets,artifacts,engine,selection};
}
