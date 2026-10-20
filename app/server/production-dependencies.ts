import 'server-only';
import {ProductionDependencies} from '@/application/dependencies/service';
import {PrismaDependencyRegistry} from '@/infrastructure/repositories/dependencies';
import {retainedDependencyBootstrap} from '@/infrastructure/dependency-catalog';
import type {PrismaClient} from '@/infrastructure/db/generated/client';
import {LocalAcceptedDependencyCatalog,type StagedLifecycle} from '@/infrastructure/dependencies/catalog';
import {PrismaBoundaryStore} from '@/infrastructure/repositories/market-boundary';
import type {BoundaryStore} from '@/ports/market-boundary';
import {snapshotHash} from '@/infrastructure/fundamentals/snapshot-hash';
import {requireBoundary} from '@/domain/market-boundary/validation';
import {runtime} from './runtime';
/** Internal activation capability only. Never export an HTTP action or accept a mode/head list from a browser. */
export function productionDependencyServices(db:PrismaClient,lifecycle:(stage:BoundaryStore)=>StagedLifecycle){
 return new ProductionDependencies(new PrismaDependencyRegistry(db),new LocalAcceptedDependencyCatalog(process.cwd(),new PrismaBoundaryStore(db),lifecycle),runtime.clock,snapshotHash);
}
/** Default application catalog cannot invent missing policy/scoring/risk authority. No activation or DI acceptance rewrite. */
export function productionBootstrapInventory(){return retainedDependencyBootstrap(process.cwd());}
export function requireProductionDependencyActivation(){
 const bootstrap=productionBootstrapInventory();
 requireBoundary(bootstrap.missingAuthority.length===0,'REQUIRES_AUTHORITY_RESOLUTION:'+bootstrap.missingAuthority.join(','));
 // Independent closure activation is a separate trusted governance step, never this implementation run.
 throw new Error('DEPENDENCY_HEAD_CLOSURE_NOT_INDEPENDENTLY_ACTIVATED');
}
