import './lib/ts-runtime.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const {RUBRICS,CATEGORY_MAXIMA,VERSION,SECTORS}=await import('../src/domain/scoring/methodology.ts');
const {financialRulesHash}=await import('../src/domain/personal-ai/provenance.ts');
const {snapshotHash}=await import('../src/infrastructure/fundamentals/snapshot-hash.ts');
const {validateDIAcceptance}=await import('../src/domain/personal-ai/scoring-readiness.ts');
const {validateAiScoringReview}=await import('../src/domain/personal-ai/provenance.ts');
const base='docs/fundamental-data-engine/scoring-dataset-acceptance/2026-11-04/m8-r4-evidence-rubric-completion-v1/';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const digest=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const coverage=read(base+'rubric-coverage.json'),state=read(base+'current-state.json');
const proposals=read(base+'assessments/current-research-assessments.json'),dataset=read(base+'dataset-snapshot.json');
assert.equal(coverage.rows.length,690);assert.equal(coverage.topics.length,2490);assert.equal(RUBRICS.length,23);
assert.equal(Object.values(CATEGORY_MAXIMA).reduce((a,b)=>a+b,0),100);
const oldRules=read('docs/fundamental-data-engine/scoring-dataset-acceptance/2026-11-02/vn30-lineage-v1/issuers/ACB.json').financialRulesHash;
assert.equal(financialRulesHash(snapshotHash),oldRules);
for(const r of coverage.rows){const rule=RUBRICS.find(x=>x.id===r.rubricId);assert.equal(r.maxPoints,rule.max);assert.deepEqual(r.topics,[...rule.topics]);assert.equal(r.productionScoringReady,false);}
for(const {assessment:a} of proposals.assessments){
 const rule=RUBRICS.find(x=>x.id===a.subcategory),band=rule.bands.find(b=>b.label===a.assessment);
 assert.equal(a.source,'AI');assert.equal(a.analyst,'CHATGPT');assert.equal(a.methodologyVersion,VERSION);assert.ok(SECTORS.includes(a.sector));
 assert.ok(Number.isInteger(a.selectedPoints)&&a.selectedPoints>=band.min&&a.selectedPoints<=band.max);
 assert.deepEqual(a.evidence.map(x=>x.topic).sort(),[...rule.topics].sort());assert.ok(a.disconfirmingEvidence.length);
}
assert.equal(proposals.assessments.length,4);assert.equal(proposals.formalAiScoreInput,false);assert.equal(proposals.totalScore,null);
assert.throws(()=>validateDIAcceptance(dataset));
assert.throws(()=>validateAiScoringReview(proposals,snapshotHash));
assert.equal(digest(state.approvedMethodology.path),state.approvedMethodology.sha256);
assert.equal(digest(state.humanContract.path),state.humanContract.sha256);
assert.equal(digest(state.protectedAuthority.path),state.protectedAuthority.sha256);
console.log(JSON.stringify({status:'PASS_SCOPED_RESEARCH_VALIDATION',rubrics:690,topics:2490,currentPartialAssessments:4,
 approvedRulesUnchanged:true,humanContractUnchanged:true,formalDiAcceptanceRejected:true,nonFormalReviewRejectedByFormalAiContract:true,
 trustedExecutionProvenance:'BLOCKED_NOT_FABRICATED',productionScoringReady:false},null,2));
