import 'server-only';
import {requireAcceptedMarketBoundary} from './market-boundary';
import type {PrismaClient} from '@/infrastructure/db/generated/client';
import type {FundamentalRepository,FundamentalDerivationRepository,FundamentalSnapshotRepository} from '@/ports/fundamentals';
import type {RegistryRelease} from '@/domain/fundamentals/contracts';
import type {AnalyticalArtifacts} from '@/ports/scoring';
import type {DecisionArtifacts} from '@/ports/decision';
import type {MarginalArtifacts} from '@/ports/marginal';
import type {WorkflowArtifacts} from '@/ports/workflow';
import {PrismaPolicyBScoringDatasets,type IndependentDIReviewBinding} from '@/infrastructure/repositories/scoring-datasets-policy-b';
import {policyBQuarantinePorts} from '@/application/fundamentals/policy-b-ports';
/** Explicit new-version composition; no default activation, acceptance creation, scoring or capital write. */
export function policyBServices(client:PrismaClient,snapshots:FundamentalSnapshotRepository,facts:FundamentalRepository,derivations:FundamentalDerivationRepository,registry:RegistryRelease,reviewBindings:readonly IndependentDIReviewBinding[],acceptanceId:string,artifacts:{analytical:AnalyticalArtifacts;decisions:DecisionArtifacts;marginal:MarginalArtifacts;workflow:WorkflowArtifacts}){
 requireAcceptedMarketBoundary();
 const datasets=new PrismaPolicyBScoringDatasets(client,snapshots,facts,derivations,registry,reviewBindings,acceptanceId);
 return {datasets,...policyBQuarantinePorts(artifacts,datasets,acceptanceId)};
}
