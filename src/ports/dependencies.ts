import type {Head,Release,Publication,Resolution} from '@/domain/dependencies/contracts';
import type {Pin,Sealed,Consumption} from '@/domain/market-boundary/contracts';
/** Trusted source adapters, never a submitted list of heads or request-controlled approval. */
export interface AcceptedDependencyCatalog {
 readAccepted():Promise<readonly Head[]>;
 /** Re-read external durable/current authorities, including ledger watermark. Throws on ambiguity/drift. */
 assertCurrent(heads:readonly Head[],at:string):Promise<void>;
 /** Existing market-boundary/risk lifecycle, using staged writes only. No actual publication here. */
 validateAnalysis(record:Sealed<'ANALYSIS'>,resolution:Resolution,request:Consumption):Promise<Sealed<'ANALYSIS'>>;
 validateDecision(record:Sealed<'DECISION'>,resolution:Resolution,request:Consumption):Promise<Sealed<'DECISION'>>;
}
export interface DependencyRegistry {
 current():Promise<Release|null>;
 find(pin:Pin):Promise<Release>;
 activate(release:Release,expected:Pin|null):Promise<void>;
 /** Transaction checks projection, time and ledger at commit, appends snapshot and immutable binding together. */
 publish(publication:Publication,expected:Pin,now:()=>string):Promise<void>;
 publication(pin:Pin):Promise<Publication>;
}
