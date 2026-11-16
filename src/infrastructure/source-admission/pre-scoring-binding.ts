import type {PreScoringDatasets,PreScoringDatasetReference,PreScoringContext} from '@/ports/pre-scoring-datasets';
import type {ScoringDatasets,ScoringDatasetSelection,ScoringDatasetAuthorization} from '@/ports/scoring';
import type {ScoreInput,Scorecard} from '@/domain/scoring/scorecard';
import {CurrentFinancialCoverage} from './current-coverage';
import {snapshotHash as hash} from '@/infrastructure/fundamentals/snapshot-hash';
import {instant,dateOnly} from '@/shared/time';
import {deepFreeze} from '@/domain/portfolio/transaction';
function must(value:unknown,reason:string):asserts value {if(!value)throw Error(reason);}
/** Uses the existing immutable enrichment table: no scorecard FK and no duplicate data store. */
export class CurrentPreScoringBindings implements PreScoringDatasets {
 constructor(private readonly coverage:CurrentFinancialCoverage){}
 async prepare(datasetId:string,context:PreScoringContext):Promise<PreScoringDatasetReference>{
  const binding=await this.coverage.bind(datasetId,context);
  const reference:PreScoringDatasetReference={contract:'current-purpose-pre-scoring-reference-v1',bindingId:binding.id,context:{...binding.result.context},manifestHash:hash(binding.result),permitsScoring:false,historicalPitGranted:false};
  await this.verify(reference,reference.context);return deepFreeze(reference);
 }
 async verify(reference:PreScoringDatasetReference,context:PreScoringContext){
  must(reference.contract==='current-purpose-pre-scoring-reference-v1'&&reference.permitsScoring===false&&reference.historicalPitGranted===false,'PRE_BINDING_NOT_SCORING_AUTHORIZATION');
  must(context.purpose==='CURRENT_FORMAL_VALUATION'&&reference.context.purpose===context.purpose,'CURRENT_ONLY_NOT_PIT');
  instant(context.knownAt);dateOnly(context.economicCutoff);
  must(reference.context.ticker===context.ticker&&reference.context.securityId===context.securityId&&reference.context.economicCutoff===context.economicCutoff&&reference.context.knownAt<=context.knownAt,'PRE_BINDING_CONTEXT_MISMATCH');
  const current=await this.coverage.consume(reference.bindingId,context);
  // consume adds convenience fields; the stored result is the immutable manifest.
  const {id,qualifiedDebtFact,metricInputs,previouslyAdmittedHistory,...manifest}=current;
  must(hash(manifest)===reference.manifestHash&&hash(manifest.context)===hash(reference.context),'PRE_BINDING_MANIFEST_MISMATCH');
 }
}
/** Trusted composition decorator. It only adds a data gate; it cannot grant or replace
 * DI, assessment, M1, confidence or executable authorization in the actual scorer.
 * The existing scorer/domain and underlying authorization remain mandatory.
 */
export class PreboundScoringDatasets implements ScoringDatasets {
 constructor(private readonly bindings:PreScoringDatasets,private readonly reference:PreScoringDatasetReference,private readonly governed:ScoringDatasets){}
 private async dataGate(input:ScoreInput){
  must(input.artifactScope==='FORMAL','PRE_BINDING_FORMAL_CONSUMPTION_ONLY');
  instant(input.asOf);instant(input.knownAt);
  must(input.securityId===this.reference.context.securityId&&input.asOf.slice(0,10)===this.reference.context.economicCutoff,'PRE_BINDING_SCORING_IDENTITY');
  await this.bindings.verify(this.reference,{...this.reference.context,knownAt:input.knownAt});
 }
 async authorize(input:ScoreInput,selection:ScoringDatasetSelection):Promise<ScoringDatasetAuthorization>{
  await this.dataGate(input);return this.governed.authorize(input,selection);
 }
 async append(card:Scorecard,authorization:ScoringDatasetAuthorization){
  await this.dataGate(card.input);await this.governed.append(card,authorization);
 }
 async findBinding(scorecardId:string){
  // Existing repository verifies historical score/input/authorization bindings itself.
  await this.bindings.verify(this.reference,this.reference.context);
  return this.governed.findBinding(scorecardId);
 }
}
