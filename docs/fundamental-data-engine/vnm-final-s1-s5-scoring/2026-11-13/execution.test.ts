/** Real retained VNM assessment probes; no database writer, acceptance creator or synthetic score. */
import {it,expect} from 'vitest';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {ScoringEngine} from '@/application/scoring/engine';
import {verifyProductionAuthorityBundle} from '@/infrastructure/dependencies/production-authority';
import {planFinancialIngest} from '@/infrastructure/source-admission/financial';
import {validateEvidence} from '@/domain/scoring/evidence';
import {buildCafefCandidate} from '@/infrastructure/market-boundary/cafef-standing';
import {snapshotHash} from '@/infrastructure/fundamentals/snapshot-hash';
const root=process.cwd(),out='docs/fundamental-data-engine/vnm-final-s1-s5-scoring/2026-11-13/';
const standing='docs/fundamental-data-engine/standing-authority-version/2026-11-12/';
const read=(p:string)=>JSON.parse(readFileSync(resolve(root,p),'utf8'));
const sha=(p:string)=>createHash('sha256').update(readFileSync(resolve(root,p))).digest('hex');
const reason=(error:unknown)=>{const e=error as {issues?:{reason:string}[];message?:string};return e.issues?.map(i=>i.reason).join('; ')??e.message??String(error);};
function capture(run:()=>unknown){try{return {status:'PASS',result:run(),reason:null};}catch(e){return {status:'BLOCKED',result:null,reason:reason(e)};}}
it('executes retained VNM current-use predicates and the actual formal scoring entry gate, twice, without an artifact write',async()=>{
 const input=read(out+'VNM_SCORING_INPUTS.json'),before=sha('data/vn30.sqlite');
 expect(input.qualifiedFinancialFacts.canonicalFacts).toHaveLength(65);
 expect(input.sourceAuthority.perMaterialReceiptsRequired).toBe(false);
 expect(input.price.valueVndPerShare).toBe('56900');expect(input.price.sourceField).toBe('GiaDongCua');
 expect(input.shares.value).toBe('2089955445');
 const registryPath=standing+'VERSIONED_SOURCE_REGISTRY.json',bindings=read(standing+'TRUSTED_SOURCE_INPUTS.json');
 expect(read(standing+'F1_F2_REAL_ADMISSION_VALIDATION.json').authority.sha256).toBe(sha(registryPath));
 // Replay one already admitted selected real fact, not new qualification of the financial corpus.
 const q=read(standing+'REAL_FINANCIAL_REQUEST.json');
 const plan=planFinancialIngest(root,q);
 // Existing real admission report and v4 receipt stay the qualification authority.
 expect(read(standing+'F1_F2_REAL_ADMISSION_VALIDATION.json').F2.status).toBe('ADMITTED_AND_CONSUMED_SELECTED_FACT');
 expect(plan.quarantine).toEqual([]);expect(plan.evidence).toHaveLength(1);
 expect(plan.evidence[0].value).toBe('57451803693875');
 const current=capture(()=>validateEvidence(plan.evidence,q.securityId,q.economicAsOf+'T23:59:59.999Z',q.knownAt,'CURRENT_FORMAL_VALUATION'));
 const implicit=capture(()=>validateEvidence(plan.evidence,q.securityId,q.economicAsOf+'T23:59:59.999Z',q.knownAt));
 expect(current.status).toBe('PASS');expect(implicit.reason).toContain('CURRENT_ONLY_NOT_PIT');
 const profile=read(standing+'REAL_MARKET_PROFILE.json');
 const market=capture(()=>buildCafefCandidate(root,profile,{raw:bindings.catalogs.cafef[0],ticker:'VNM',exchange:'HOSE',date:'2026-10-30',knownAt:input.reviewKnownAt}));
 expect(market.reason).toContain('VN30_MEMBERSHIP_OUTSIDE_VERIFIED_INTERVAL');
 const authority=capture(()=>verifyProductionAuthorityBundle(root,read('src/infrastructure/dependencies/active-authorities.json').authorityBundle));
 expect(authority.status).toBe('BLOCKED');
 // Read-only registry adapter returns exact actual SQLite records exported by assemble.py.
 // There is no selection/acceptance in the live DB; do not invent one to enter the domain calculator.
 let artifactWrites=0;
 const registry={findById:async(id:string)=>input.scoringAuthority.registryRecords.find((r:{methodologyId:string})=>r.methodologyId===id)??null};
 const artifacts={append:async()=>{artifactWrites++;throw Error('UNAUTHORIZED_ARTIFACT_WRITE');}};
 const engine=new ScoringEngine(registry as never,artifacts as never);
 const attempt=async()=>{try{const card=await engine.score(input.existingScoringInputPreparation);return {status:'SCORED',card,reason:null};}catch(e){return {status:'BLOCKED_BEFORE_CALCULATION',card:null,reason:reason(e)};}};
 const first=await attempt(),second=await attempt();
 expect(first).toEqual(second);expect(first.reason).toBe('FORMAL_SCORING_DATASET_REQUIRED');expect(artifactWrites).toBe(0);
 expect(sha('data/vn30.sqlite')).toBe(before);
 expect(input.existingScoringInputPreparation.assessments.filter((a:{selectedPoints:number|null})=>a.selectedPoints===null)).toHaveLength(14);
 const output={contract:'vnm-final-scoring-execution-v1',baseline:input.baseline,knownAt:input.reviewKnownAt,asOf:input.asOfSelection,
  status:'B_DEFINITIVE_BOUNDED_BLOCKERS',workflow:{entryPoint:'src/application/scoring/engine.ts::ScoringEngine.score',realInputEnvelope:out+'VNM_SCORING_INPUTS.json',attempt:first,replay:second,deterministic:true,domainCalculation:'NOT_ENTERED; complete authorized ScoreInput/selection unavailable. No malformed/synthetic input sent to calculateScorecard.',selectionProvided:false,formalSelectionDatabaseCount:input.databaseReadOnlyState.counts.scoring_dataset_binding,artifactWrites},
  existingSelectedFinancialReplay:{status:'PASS',metric:'TOTAL_ASSETS',value:plan.evidence[0].value,periodEnd:plan.evidence[0].periodEnd,source:'Real retained already-admitted standing-v4 selected fact',evidence:plan.evidence,planHash:snapshotHash(plan),newAdmissionExecuted:false},
  currentPurposeValidation:current,implicitScoringEvidenceValidation:implicit,cutoffMarketValidation:market,
  executableAuthorityValidation:{status:authority.status,reason:authority.reason,exactChangedArtifacts:input.scoringAuthority.exactChangedArtifacts},
  mandatoryGates:{economicReturnAndCapital:'BLOCKED',availableStressLiquidity:'BLOCKED',fundedForecastAndValuation:'BLOCKED',supportedPositionJudgment:'BLOCKED',adopted23RubricsAndM1Gates:'BLOCKED',currentPurposeDataset:'BLOCKED',exactExecutableBinding:'BLOCKED',standingSourceAuthority:'VALID',rawCloseValue:'RESEARCH_QUALIFIED',shareSelection:'CLOSED_BY_OWNER_APPROVED_CARRY_FORWARD_POLICY',adjustedPrice:'EXCLUDED_BY_OWNER_POLICY',historicalPIT:'NOT_QUALIFIED_NOT_A_NEW_CURRENT_SOURCE_REQUIREMENT'},
  metricCoverage:input.metricCoverage,componentScores:{BQ:null,FH:null,GQ:null,IC:null,VAL:null,RG:null,CA:null},totalScore:null,expectedReturn:null,acceptedFairValue:null,
  validity:'NOT_RELIABLY_SCORABLE',productionReady:false,productionActivation:'NOT_AUTHORIZED',VNM17Promoted:false,
  databaseSha256Before:before,databaseSha256After:sha('data/vn30.sqlite'),newUserInformationRequiredToConcludeAssessment:false,
  validationMeaning:'Real selected-fact/current-purpose replay and actual application gate execution. Regression fixtures test contracts, never constitute VNM financial/score admission.'};
 writeFileSync(resolve(root,out+'VNM_SCORING_EXECUTION.json'),JSON.stringify(output,null,2)+'\n');
});
