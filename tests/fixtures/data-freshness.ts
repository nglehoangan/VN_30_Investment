import {snapshotFixture} from './snapshot';
import {release} from './fundamentals';
import {loadCanonicalRegistry} from '@/infrastructure/fundamentals/canonical-registry';
import {PrismaFundamentals} from '@/infrastructure/repositories/fundamentals';
import {PrismaFundamentalSnapshot} from '@/infrastructure/repositories/fundamental-snapshot';
import {PrismaFundamentalDerivation} from '@/infrastructure/repositories/fundamental-derivation';
import {snapshotHash} from '@/infrastructure/fundamentals/snapshot-hash';
import type {testDatabase} from './database';
/** Synthetic-only disclosure, current registry, and no production approval binding. Suitable for owned E2E DB. */
export async function setupFreshnessSnapshot(db:Awaited<ReturnType<typeof testDatabase>>,unknown=false){
 const f=snapshotFixture('ui-data'),registry=loadCanonicalRegistry(release.manifest),canary='PRIVATE-CREDENTIAL-ACCOUNT-CANARY';
 const source={...f.source,documentationReference:'private:'+canary},payload=JSON.stringify({netProfitAfterTax:'15000',unit:'million VND',privateAccount:canary,credential:canary}),capture={...f.capture,retrievedAt:'2026-10-09T09:00:00.000Z',resourceReference:'https://issuer.example/report.pdf',payload,payloadHash:snapshotHash(JSON.parse(payload))};
 // Raw capture payloadHash is SHA256 of bytes, not canonical JSON semantic hash.
 const {manifestDigest}=await import('@/infrastructure/fundamentals/snapshot-hash');capture.payloadHash=manifestDigest(payload);
 const batch={...f.batch,startedAt:'2026-10-09T08:59:00.000Z',completedAt:capture.retrievedAt,ingestedAt:'2026-10-09T09:01:00.000Z'},policy={...f.policy,governanceStatus:'APPROVED' as const,approvalReference:'SYNTHETIC ONLY date policy'};
 const observation={...f.observation,registryHash:registry.registryHash,publication:unknown?{publishedAt:null,publicationDate:null,publicationPrecision:'UNKNOWN' as const,publicationStatus:'UNKNOWN' as const,timezone:null,evidenceReference:null}:{publishedAt:null,publicationDate:'2026-10-08',publicationPrecision:'DATE_ONLY' as const,publicationStatus:'VERIFIED' as const,timezone:'UTC',evidenceReference:'https://issuer.example/disclosure.pdf'},providerReceivedAt:'2026-10-09T08:30:00.000Z',retrievedAt:capture.retrievedAt,ingestedAt:batch.ingestedAt};
 const request={...f.request,policy,decisionAsOf:'2026-10-09T10:00:00.000Z',systemKnownAt:'2026-10-09T10:00:00.000Z',fundamentalCutoff:'2026-10-09T10:00:00.000Z',marketCutoff:'2026-10-09T10:00:00.000Z',builtAt:'2026-10-09T10:01:00.000Z',references:f.request.references.map(r=>({...r,knownAt:registry.manifest.recordedAt}))};
 await db.client.security.create({data:{id:observation.securityId,name:'SYNTHETIC UI ONLY'}});
 const facts=new PrismaFundamentals(db.client,registry),snapshots=new PrismaFundamentalSnapshot(db.client,registry),derivations=new PrismaFundamentalDerivation(db.client,registry);
 await facts.appendSource(source);await facts.appendImport(batch,[capture]);await facts.appendObservation(observation);await snapshots.assess(f.assessment.id,observation.id,policy,request.builtAt);const snapshot=await snapshots.seal(request);
 return {...f,canary,registry,source,capture,batch,policy,observation,request,snapshot,services:{facts,snapshots,derivations}};
}

import {scoringReadinessFixture} from './scoring-readiness';
import {buildDataFreshness,type PublicFinancialFact} from '@/domain/fundamentals/freshness';
import {evaluateScoringReadiness} from '@/domain/fundamentals/scoring-readiness';
/** Public-only UI fixture; trust, parsing and redaction are exercised against real repositories separately. */
export function publicFreshnessFixture(){
 const f=scoringReadinessFixture('date-only'),facts:PublicFinancialFact[]=f.observations.map((o,i)=>({id:o.id,securityId:o.securityId,ticker:o.ticker,itemId:o.itemId,selected:true,reportingScope:o.reportingScope,periodStart:o.periodStart,periodEnd:o.periodEnd,value:o.normalized.value,unit:o.normalized.unit,currency:o.normalized.currency,quality:o.quality,applicability:o.applicability,publication:{publishedAt:o.publication.publishedAt,publicationDate:o.publication.publicationDate,publicationPrecision:o.publication.publicationPrecision,publicationStatus:o.publication.publicationStatus,timezone:o.publication.timezone},publicationEvidence:{recorded:true,url:'https://issuer.example/disclosure.pdf'},providerReceivedAt:o.providerReceivedAt,retrievedAt:o.retrievedAt,ingestedAt:o.ingestedAt,availability:{assessmentId:f.assessments[i].id,status:'VERIFIED',availableAt:f.assessments[i].availableAt,publicBoundary:f.assessments[i].publicBoundary,publicFallbackBoundary:null,evidenceBackedBoundary:null,boundaryBasis:i===0?'TRUSTED_PROVIDER_RECEIPT':'ISSUER_PUBLICATION_TIMESTAMP',policyVersion:f.policy.version,policyHash:f.assessments[i].policyHash,receiptKnownAt:null,finding:null},source:{versionId:f.source.id,provider:f.source.provider,adapterVersion:f.source.adapterVersion,schemaVersion:f.source.schemaVersion,documentUrl:'https://issuer.example/report.pdf',captureId:o.rawCaptureId,payloadHash:f.capture.payloadHash},revision:{kind:o.revisionKind,predecessorId:null,correctionKnownAt:null,chain:[]}}));
 const model=buildDataFreshness(f.snapshot,facts,[],'2027-04-01T00:00:00.000Z',{status:'VERIFIED',acceptanceId:f.acceptance.id,acceptedAt:f.acceptance.acceptedAt,algorithm:f.requirements.algorithm},evaluateScoringReadiness(f.acceptance,f.snapshot,f.sources,snapshotHash));
 return {...f,model:{...model,catalog:[{runId:f.request.runId,builtAt:f.request.builtAt}],acceptanceChoices:[{id:f.acceptance.id,acceptedAt:f.acceptance.acceptedAt}]}};
}
