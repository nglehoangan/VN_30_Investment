import 'server-only';
import type {PrismaClient} from '@/infrastructure/db/generated/client';
import {PrismaLevel1Disposition} from '@/infrastructure/repositories/level1-disposition';
import binding from '@/infrastructure/fundamentals/active-level1-release.json';
/** Production Level1 governance context; never creates DI acceptance or authorizes scoring. */
export function level1Disposition(client:PrismaClient){return new PrismaLevel1Disposition(client,binding);}

import {policyBQuarantinePorts} from '@/application/fundamentals/policy-b-ports';
import type {AnalyticalArtifacts} from '@/ports/scoring';
import type {DecisionArtifacts} from '@/ports/decision';
import type {MarginalArtifacts} from '@/ports/marginal';
import type {WorkflowArtifacts} from '@/ports/workflow';
/** New release consumers receive quarantine guards and exception context together.
 * Historical DI acceptance readers retain their exact pinned releases. */
export function level1GovernanceServices(client:PrismaClient,artifacts:{analytical:AnalyticalArtifacts;decisions:DecisionArtifacts;marginal:MarginalArtifacts;workflow:WorkflowArtifacts}){
 const governance=level1Disposition(client);
 return {governance,...policyBQuarantinePorts(artifacts,{assertAction:(_id,securityId,action)=>governance.assertAction(securityId,action)},binding.id)};
}
