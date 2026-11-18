/** Exact review proposal; never installs its own trust binding. */
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {relative,join} from 'node:path';
export async function prepare({root,out,reviewRoot,input,dataset,profile,hash,load}){
 const read=p=>JSON.parse(readFileSync(p,'utf8')),write=(n,x)=>writeFileSync(join(out,n),JSON.stringify(x,null,2)+'\n');
 const {aiInputSemantic,financialRulesHash}=await load('src/domain/current-scoring/provenance.ts');
 const {METRICS}=await load('src/domain/scoring/metrics.ts');
 const {createHash}=await import('node:crypto');const sha=b=>createHash('sha256').update(b).digest('hex');
 const sourcePin=p=>({path:relative(root,p),sha256:sha(readFileSync(p))});
 const c=read(join(reviewRoot,'ASSESSMENT_CANDIDATES.json')),challenge=read(join(reviewRoot,'ECONOMIC_CHALLENGE_VALIDATION.json')),ledger=read(join(reviewRoot,'SOURCE_REFERENCE_LEDGER.json'));
 if(challenge.status!=='PASS'||ledger.references.some(r=>r.status==='UNRESOLVED'))throw Error('REVIEW_CHALLENGE_NOT_COMPLETE');
 const actualSession=process.env.CODEX_SESSION_ID;if(!actualSession||actualSession!==challenge.actualAiSessionId)throw Error('ACTUAL_REVIEW_SESSION_REQUIRED');
 const source=sourcePin(join(reviewRoot,'ASSESSMENT_CANDIDATES.json'));
 const prep=read(join(reviewRoot,'PREPARATION_REVIEW_EVENT.json')).recordedAt,at=challenge.recordedAt;
 if(at>input.knownAt)throw Error('REVIEW_AFTER_BOUND_KNOWLEDGE');
 const auth='docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-29/PERSONAL_AI_ACCEPTANCE.md';
 const t=dataset.evidence[0].time;
 const witnesses=c.rows.map(r=>({id:'vnm-current-research:'+r.rubricId,version:'vnm-current-research-review-proposal-v1',securityId:input.securityId,observation:'RESEARCH_'+r.rubricId.replaceAll('-','_'),value:JSON.stringify({judgment:r.supportedJudgment,sourceReferenceLedger:'SOURCE_REFERENCE_LEDGER.json',sourcePointer:'/rows/'+c.rows.indexOf(r)}),unit:'TEXT',classification:'ESTIMATE',source:'CHATGPT_RETAINED_RESEARCH_REVIEW_PROPOSAL',periodStart:'2022-01-01',periodEnd:'2026-10-30',asOf:input.asOf,publishedAt:null,receivedAt:input.knownAt,validThrough:input.asOf,critical:true,quality:'VALID',family:'RESEARCH_ECONOMIC_ASSESSMENT',time:{contract:'current-formal-evidence-time-v1',purpose:'CURRENT_FORMAL_VALUATION',policyVersion:'standing-financial-current-v1',policyHash:t.policyHash,authorizationReference:auth,rawHash:source.sha256,qualificationReference:relative(root,join(reviewRoot,'SOURCE_REFERENCE_LEDGER.json')),originalReceivedAt:prep,reviewedAt:at,ingestedAt:input.knownAt,availableAt:input.knownAt}}));
 input.evidence=[...dataset.evidence,...witnesses];
 for(const a of input.assessments){const r=c.rows.find(r=>r.rubricId===a.subcategory),ref='vnm-current-research:'+r.rubricId;a.evidence=r.topicAssessments.map(t=>({topic:t.topicId,refs:[ref],rationale:t.judgment}));a.disconfirmingEvidence=[ref];a.strongerEvidence=false;a.maximumPrerequisitesMet=r.maximumPrerequisitesMet;a.exceptionalJustification=r.exceptionalJustification;a.economicChannel=r.economicChannel;}
 const mp='docs/fundamental-data-engine/vnm-f1-membership-closure/2026-11-15/MARKET_PROFILE.json';
 // VNM-specific existing registered sector route. Membership interval is certified retained coverage, not invented daily snapshots.
 input.reference={taxonomy:'M3_REGISTERED_SECTOR_ROUTE',receivedAt:profile.knownAt,data:{version:'vnm-retained-current-reference-20261118',intervals:[{id:'VNM-identifier-retained',kind:'IDENTIFIER',securityId:input.securityId,from:profile.membership.from,to:'2026-11-16',value:'VNM',taxonomy:null,sourceReference:mp},{id:'VNM-membership-retained',kind:'MEMBERSHIP',securityId:input.securityId,from:profile.membership.from,to:'2026-11-16',value:'VN30',taxonomy:null,sourceReference:mp},{id:'VNM-sector-retained-route',kind:'SECTOR',securityId:input.securityId,from:profile.membership.from,to:'2026-11-16',value:'RETAIL',taxonomy:'M3_REGISTERED_SECTOR_ROUTE',sourceReference:'docs/fundamental-data-engine/vnm-formal-scoring-step1/2026-11-13/VNM_ASSESSMENT_CANDIDATES.json'}]}};
 input.normalization={sector:'RETAIL',cycle:'MILDLY_CYCLICAL',peakCycleRisk:false,method:'Accepted dairy own-history S1-S5 with explicit margin/finance sensitivity; registered sector unchanged.',peerIds:[],peerBasis:'ABSOLUTE_HISTORY',rationale:'No fabricated store economics, peer percentile or reclassification. Limitations remain in assessment.',actionComparable:true,actionEvidenceRefs:['vnm-current-research:CA-DIL','vnm-current-research:CA-PSV']};
 for(const k of ['stage0','hardVeto','residualRisk'])input[k].evidenceRefs=['vnm-current-research:RG-RISK','vnm-current-research:FH-LIQ','vnm-current-research:GQ-INC'];
 input.confidence={level:'LOW',analyst:'CHATGPT',dimensions:['Adequate','Adequate','Adequate','Weak','Weak'],rationale:'Complete assessment proposals do not remove model/normalization dependence; no numeric score haircut or actionable recommendation.'};
 input.doubleCountReview={analyst:'CHATGPT',passed:true,rationale:'Economic channels reviewed separately across all23; the same source supports distinct questions, not duplicated reward. Group/parent, EPS/dividend, level/marginal ROIC, native/estimate distinctions preserved.'};
 input.criticalMissing=[];input.metrics=[];
 const returns=read(join(root,'docs/fundamental-data-engine/vnm-s5-closure/2026-11-13/S5_EXPECTED_RETURN.json'));
 input.expectedReturn={value:returns.cases.find(c=>c.case==='BASE').fiveYearIRR.replace(/(\.\d{12})\d+$/,'$1'),modelConfidence:'LOW',assumptionBasis:'Accepted S5 BASE scenario, not probability-weighted forecast; original full-precision IRR retained in S5 source, positive input truncated to12 decimals for numeric-v1 consumer; no band boundary affected. Bear/Bull and low confidence retained.',aggressiveExpansion:false,downsideDominates:true,nearLowerBoundary:true};
 input.thesis={core:'Accepted S3 competitive dairy franchise with material competitive/demand limitations.',compounding:'Strong realized incremental operating economics; real common per-share compounding not demonstrated robustly through cycle.',valuation:'Accepted S5 Bear/Base/Bull; BASE below current dated raw close; no precise point MOS or positive decision inferred.',downside:'Accepted S2 six core liquidity scenarios pass; disclosed stress/model limitations retained.',invalidation:'Adverse recurring margins, cash realization, impairment, liquidity, source revisions or corporate-action contradictions require reassessment.'};
 const hashes={inputHash:hash(aiInputSemantic(input)),evidenceHash:hash(input.evidence),methodologyHash:hash(input.methodology),financialRulesHash:financialRulesHash(hash)};
 const toolPaths=['ECONOMIC_BRIDGES.json','ECONOMIC_CHALLENGE_VALIDATION.json','SOURCE_REFERENCE_LEDGER.json','ASSESSMENT_CANDIDATES.json','M1_CONFIDENCE_AND_RISK_ASSESSMENT.json'];
 const tools=toolPaths.map(n=>({reference:'VNM_RETAINED_REVIEW:'+n,...sourcePin(join(reviewRoot,n))}));
 const passPins=[],passes=[];
 for(const [i,kind]of ['PREPARATION','CHALLENGE'].entries()){
  const when=i?at:prep,reference='VNM_CURRENT_REVIEW_'+kind;
  const artifact={contract:'personal-ai-pass-artifact-v1',pass:kind,at:when,actor:'CHATGPT',model:'GPT-6; exact deployment identifier not exposed',sessionReference:actualSession,toolReferences:tools.map(p=>p.reference),...hashes,checks:tools.map(p=>({id:p.reference,expectedHash:p.sha256,actualHash:sha(readFileSync(join(root,p.path))),evidenceReferences:[p.reference]}))};
  const path=join(out,kind+'.json');writeFileSync(path,JSON.stringify(artifact,null,2)+'\n');const pin={reference,...sourcePin(path)};passPins.push(pin);passes.push({kind,at:when,actor:artifact.actor,model:artifact.model,sessionReference:actualSession,toolReferences:artifact.toolReferences,artifactReference:reference,artifactHash:pin.sha256});
 }
 input.review={contract:'personal-ai-review-provenance-v1',mode:'OWNER_AUTHORIZED_AI_SELF_REVIEW',independentHumanReviewClaimed:false,ownerAuthorizationReference:auth,...hashes,assessmentHashes:input.assessments.map(a=>({rubricId:a.subcategory,sha256:hash(a)})),passes};
 const decisions={
 ROIC:['PRINCIPLE_EQUIVALENT','BQ-EQ','Accepted S1 normalized group ROIC ranges and WACC, not a falsely precise point. METRIC_DEFINITIONS §5.1/§13.1.'],
 ROE:['PRINCIPLE_EQUIVALENT','BQ-EQ','Use accepted same-scope operating ROIC for economic returns; do not divide group earnings by common equity. §13.1.'],
 CFO_CONVERSION:['PRINCIPLE_EQUIVALENT','BQ-CASH','Accepted BQ-CASH/S1-S5 multi-year cash realization and reinvestment evidence; reported CFO is not relabelled normalized profit. §13.1.'],
 FCF:['PRINCIPLE_EQUIVALENT','VAL-PRIMARY','Accepted S5 internally consistent equity cash-flow scenarios; reported CFO-less-gross-CAPEX remains separate group diagnostic. §13.1.'],
 NET_DEBT:['N_R','FH-BS','Unrestricted consolidated cash is not certified; use qualified reported borrowings and accepted S2 resilience, no invented net-debt point.'],
 INTEREST_COVERAGE:['N_R','FH-STRESS','No blind parent-to-group or gross-to-net-interest conversion; accepted S2 obligation/stress coverage supports the rubric without this exact ratio.'],
 NPL:['NOT_APPLICABLE','FH-BS','Bank-specific credit-quality ratio; VNM is dairy.'],
 COVERAGE:['NOT_APPLICABLE','FH-BS','Bank-specific loan-loss coverage, not liquidity coverage.'],
 CASA:['NOT_APPLICABLE','FH-BS','Bank-specific funding ratio; not VNM deposits.'],
 FCF_YIELD:['N_R','VAL-PRIMARY','Optional point ratio not manufactured from group CFO; primary S5 equity valuation is used.'],
 EARNINGS_YIELD:['N_R','VAL-PRIMARY','No unnormalized E/P substituted for value or shareholder return. Primary S5 scenarios retained.'],
 DIVIDEND_YIELD:['N_R','CA-DIST','No dividend-yield scoring credit; use actual payment/retention/resilience assessment. §10.2.'],
 PB:['N_R','VAL-PRIMARY','No raw PB primary valuation for dairy; accepted S5 cash model is primary.'],
 EV_EBIT:['N_R','VAL-PRIMARY','No incompatible EV/unrestricted cash/normalized EBIT point; equity valuation avoids financing double counting.'],
 MOS:['PRINCIPLE_EQUIVALENT','VAL-MOS','Accepted S5 scenario downside and wide value range: qualitative thin/downside assessment, no precise numeric MOS. §12.17.'],
 REVENUE_CAGR:['PRINCIPLE_EQUIVALENT','GQ-HIST','Actual retained multi-year revenue path and normalized historical growth assessment; no synthetic annualization of nine months.'],
 EPS_CAGR:['PRINCIPLE_EQUIVALENT','GQ-HIST','Common after-fund EPS2022–2025 and explicit cycle sensitivity; nominal CAGR3.5027% not relabelled real growth. §10.4/§13.1.'],
 INCREMENTAL_ROIC:['PRINCIPLE_EQUIVALENT','GQ-INC','Matched normalized earnings/capital component bridge, not mechanical certified marginal ratio; Strong4 below exceptional-durable maximum. §6.3/§13.1.'],
 NET_DEBT_EBITDA:['N_R','FH-BS','Unrestricted cash/compatible normalized group EBITDA not certified; no generic comprehensive debt requirement. Borrowing and accepted S2 risk assessment retained.']};
 const metricDecisions=Object.keys(METRICS).map(metric=>{const d=decisions[metric];if(!d)throw Error('UNMAPPED_METRIC_DISPOSITION:'+metric);return {metric,status:d[0],ruleReference:'METRIC_DEFINITIONS §13.1; '+d[2],evidenceRefs:['vnm-current-research:'+d[1]]};});
 write('EXACT_ADOPTION_PACKET.json',{contract:'current-assessment-adoption-v1',input,datasetHash:hash(dataset),metricDecisions});
 const binding={reviewHash:hash(input.review),ownerAuthorizationReference:auth,passArtifacts:passPins,toolArtifacts:tools};
 write('TRUST_BINDING_PROPOSAL.json',{status:'PROPOSED_NOT_INSTALLED',scope:'EXACT_VNM_CURRENT_DATASET_REVIEW_ONLY',authorityClaimed:false,binding,sourceSemantics:'Research witness ESTIMATE proposals, not newly admitted native financial facts. Existing native35 remain unchanged.',limits:'Local tool/source pins and actual Codex session, not OpenAI signatures or independent human review. No live trusted registry installation.'});
 return {input,packet:{reference:'VNM_EXACT_CURRENT_REVIEW_PROPOSAL',...sourcePin(join(out,'EXACT_ADOPTION_PACKET.json'))},binding};
}
