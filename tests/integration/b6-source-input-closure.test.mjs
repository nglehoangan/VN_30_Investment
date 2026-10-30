// @vitest-environment node
import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {buildFundamentalSnapshot} from '@/domain/fundamentals/snapshot';
import {snapshotHash} from '@/infrastructure/fundamentals/snapshot-hash';
import {evaluateDebtReceipt} from '@/domain/fundamentals/debt-contract';
import {deriveFundamentals} from '@/domain/fundamentals/derivation';
import {bridgeScoringInputs,validateBridgePlan} from '@/domain/fundamentals/scoring-bridge';
import {decimal} from '@/domain/portfolio/values';
const root='docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-30/b6-close-inputs-r1';
const read=p=>JSON.parse(readFileSync(p,'utf8')),sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const sources=read(root+'/native-review-sources.json'),snapshot=read(root+'/native-review-snapshot.json'),index=read(root+'/decision-input-review-index.json');
it('replays current snapshot and its selection from retained native inputs',()=>{
 const replay=buildFundamentalSnapshot(snapshot.request,sources,snapshotHash);
 expect(replay.contentHash).toBe(snapshot.contentHash);expect(replay.members).toEqual(snapshot.members);
 expect(sources.observations).toHaveLength(1793);expect(snapshot.members).toHaveLength(1776);
});
it('partitions original347 gaps, preserves3 provider differences and never relabels VPL opening balances',()=>{
 const r=read(root+'/source-resolution.json');expect(r.rows).toHaveLength(347);expect(new Set(r.rows.map(r=>r.previousObservationId)).size).toBe(347);
 expect(r.resolved).toBe(330);expect(r.unresolved).toBe(17);
 const differences=r.rows.filter(r=>r.status==='PDF_FIRST_REVIEW_SELECTION_WITH_PROVIDER_DIFFERENCE');expect(differences).toHaveLength(3);
 for(const r of differences){expect(r.ticker).toBe('HPG');expect(r.value).not.toBe(r.reviewSelectedValue);expect(r.providerErrorAsserted).toBe(false);}
 expect(r.rows.filter(r=>r.ticker==='VPL'&&r.status==='UNRESOLVED')).toHaveLength(10);
 for(const row of r.rows.filter(row=>row.status!=='UNRESOLVED')){expect(sha(row.sourcePath)).toBe(row.currentHash);expect(row.formalAdmission).toBe(false);}
});
it('validates8 debt receipts, rejects altered source bindings and future current portions',()=>{
 const bundles=[read(root+'/vnm-qualified-borrowings.json'),read(root+'/current-qualified-borrowings.json')];
 expect(bundles.flatMap(b=>b.receipts)).toHaveLength(8);
 for(const b of bundles)for(const r of b.receipts){
  const components=r.components??[r.result.short,r.result.long];
  for(const binding of r.context.sourceBindings)expect(sha(binding.path)).toBe(binding.sha256);
  const result=evaluateDebtReceipt(r.receipt,components,r.context,snapshotHash);expect(result?.value).toBe(r.result.value);
  expect(evaluateDebtReceipt(r.receipt,components,{...r.context,sourceBindings:[]},snapshotHash)).toBeNull();
  const {bodyHash: _hash,...body}=r.receipt;void _hash;
  const invalid={...body,currentPortion:r.receipt.shortValue+'0'};delete invalid.currentPortionPresentation;
  expect(evaluateDebtReceipt({...invalid,bodyHash:snapshotHash(invalid)},components,r.context,snapshotHash)).toBeNull();
  expect(r.receipt.metadata.comprehensivePopulationStatus).toBe('COMPREHENSIVE_UNVERIFIED');
  expect(r.receipt.metadata.uncertainty.materialityAssessment).toBe('UNASSESSED');
 }
});
it('replays all49 FCF derivations and rejects mismatched operand periods',()=>{
 expect(sources.derived).toHaveLength(49);
 for(const d of sources.derived){
  const operands=d.observations;
  const result=deriveFundamentals({request:d.request,recordedAt:d.recordedAt,registry:sources.registry,crosswalk:sources.crosswalk,crosswalkHash:snapshotHash(sources.crosswalk),observations:operands,hash:snapshotHash});
  expect(result.status).toBe('CALCULATED');expect(result.value).toBe(d.value);
  const [a,b]=operands;expect(d.value).toBe(decimal(a.normalized.value).sub(decimal(b.normalized.value)).toString());
  const wrong=[a,{...b,periodEnd:'2020-01-01'}];
  let accepted=false;try{accepted=deriveFundamentals({request:d.request,recordedAt:d.recordedAt,registry:sources.registry,crosswalk:sources.crosswalk,crosswalkHash:snapshotHash(sources.crosswalk),observations:wrong,hash:snapshotHash}).status==='CALCULATED';}catch{/* Contract may reject before calculation. */}
  expect(accepted).toBe(false);
 }
});
it.each(index.rows.map(r=>r.ticker))('%s has complete review structure, replayable arithmetic and no fabricated score',ticker=>{
 const x=read(root+'/native-inputs/'+ticker+'.json');validateBridgePlan(x.bridgePlan);
 expect(()=>bridgeScoringInputs(snapshot,x.securityId,x.bridgePlan,sources)).toThrow();
 expect(x.rubricInputs).toHaveLength(23);expect(x.rubricInputs.every(r=>r.selectedPoints===null&&r.source==='AI_REVIEW_CANDIDATE')).toBe(true);
 const ids=new Set(x.observations.map(o=>o.id));
 for(const r of x.rubricInputs)for(const t of r.evidenceTopics)for(const id of t.observationIds)expect(ids.has(id)).toBe(true);
 for(const m of x.metricCandidates){const [a,b]=m.operandObservationIds.map(id=>x.observations.find(o=>o.id===id));expect(a.periodStart).toBe(b.periodStart);expect(a.periodEnd).toBe(b.periodEnd);expect(m.value).toBe(decimal(a.normalized.value).div(decimal(b.normalized.value)).toString());}
 if(x.sector==='BANK')expect(x.metricCandidates.every(m=>m.metric==='GROSS_CUSTOMER_LOANS_TO_CUSTOMER_DEPOSITS'||m.metric==='REPORTED_LOAN_RESERVES_TO_GROSS_LOANS')).toBe(true);
 expect(x.valuationAssumptions.scenarios).toHaveLength(3);expect(x.valuationAssumptions.listingQuantitySubstitutionAllowed).toBe(false);
 expect(x.hardVetoAssessment.vetoTriggered).toBeNull();expect(x.readyForScoring).toBe(false);
});
