// @vitest-environment node
import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateIssuerBridge,validateSameMethodComparison} from '../../scripts/lib/b6-comparability-validation.mjs';
import {buildFundamentalSnapshot} from '@/domain/fundamentals/snapshot';
import {snapshotHash} from '@/infrastructure/fundamentals/snapshot-hash';
import {bridgeScoringInputs,validateBridgePlan} from '@/domain/fundamentals/scoring-bridge';
import {decimal} from '@/domain/portfolio/values';
const root='docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-30/b6-comparability-r2';
const read=p=>JSON.parse(readFileSync(p,'utf8')),sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const s=read(root+'/native-review-sources.json'),snapshot=read(root+'/native-review-snapshot.json');
const bridges=read(root+'/issuer-comparability-bridges.json').bridges;
it('replays the bounded current snapshot, with all1780 active observations selected',()=>{
 expect(s.observations).toHaveLength(1780);expect(snapshot.members).toHaveLength(1780);
 expect(buildFundamentalSnapshot(snapshot.request,s,snapshotHash).contentHash).toBe(snapshot.contentHash);
 expect(s.observations.every(o=>o.scope==='REVIEW_CANDIDATE')).toBe(true);
});
it('applies VPL scope to requirements, observations, metrics and FCF without deleting prior facts',()=>{
 const x=read(root+'/native-inputs/VPL.json');expect(x.analysisScope.firstAnnualYear).toBe(2023);
 expect(x.observations.every(o=>o.periodStart>='2023-01-01')).toBe(true);
 expect(x.requirementStatus.every(r=>r.periodEnd>='2023-01-01')).toBe(true);
 expect(x.sectorRequirements.every(r=>r.periodEnd>='2023-01-01')).toBe(true);
 expect(x.metricCandidates.every(m=>m.periodStart>='2023-01-01')).toBe(true);
 expect(x.nativeDerivations.every(d=>d.periodStart>='2023-01-01')).toBe(true);
 expect(s.scopeExclusions).toHaveLength(17);expect(s.scopeExclusions.every(e=>e.observation.ticker==='VPL'&&e.observation.periodEnd==='2022-12-31')).toBe(true);
 expect(read('docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-30/b6-close-inputs-r1/native-inputs/VPL.json').observations.some(o=>o.periodEnd==='2022-12-31')).toBe(true);
});
it('reconciles original347 source gaps into331 recovered and16 owner-scope exclusions, no unresolved',()=>{
 const r=read(root+'/source-resolution.json');expect(r.rows).toHaveLength(347);expect(r.resolved).toBe(331);expect(r.outsideOwnerScope).toBe(16);expect(r.unresolved).toBe(0);
 expect(new Set(r.rows.map(r=>r.previousObservationId)).size).toBe(347);
 expect(r.rows.filter(r=>r.status==='CHECKED_ISSUER_PERIOD_AND_VINTAGE_BRIDGE')).toHaveLength(7);
 expect(r.rows.filter(r=>r.status==='OUTSIDE_OWNER_ANALYSIS_SCOPE').every(r=>r.ticker==='VPL'&&r.periodEnd==='2022-12-31')).toBe(true);
});
it.each(bridges)('$ticker $itemId preserves units, original/opening variants and all signed operands',b=>{
 const values=validateIssuerBridge(b);
 for(const e of [b.originalEvidence,b.restatedEvidence,b.bridgeEvidence])expect(sha(e.pdfPath)).toBe(e.sourceHash);
 const x=read(root+'/native-inputs/'+b.ticker+'.json');const selected=x.observations.find(o=>o.itemId===b.itemId&&o.periodEnd===b.periodEnd);expect(selected.normalized.value).toBe(values.restatedVnd);
 expect(b.originalEvidence.column).toContain('ORIGINAL_CLOSING');expect(b.restatedEvidence.column).not.toBe(b.originalEvidence.column);
 const wrongSign=structuredClone(b);wrongSign.adjustmentOperands[0].signedValue=(-BigInt(wrongSign.adjustmentOperands[0].signedValue)).toString();expect(()=>validateIssuerBridge(wrongSign)).toThrow();
 const wrongUnit={...b,multiplier:b.multiplier==='1'?'1000000':'1'};expect(()=>validateIssuerBridge(wrongUnit)).toThrow();
 const wrongPeriod={...b,periodBinding:{...b.periodBinding,verified:false}};expect(()=>validateIssuerBridge(wrongPeriod)).toThrow();
 const duplicate=structuredClone(b);duplicate.adjustmentOperands.push(duplicate.adjustmentOperands[0]);expect(()=>validateIssuerBridge(duplicate)).toThrow();
});
it('preserves VHM million rounding and avoids gross/net double counting',()=>{
 const liab=bridges.find(b=>b.ticker==='VHM'&&b.itemId==='CURRENT_LIABILITIES');expect(liab.adjustmentTotal).toBe('2830528');
 expect(liab.adjustmentOperands.find(o=>o.captionKey==='employee-payables').signedValue).toBe('639646');
 expect(liab.adjustmentOperands.find(o=>o.captionKey==='short-accruals').signedValue).toBe('-639647');
 const assets=bridges.find(b=>b.ticker==='VHM'&&b.itemId==='TOTAL_ASSETS');expect(assets.adjustmentTotal).toBe('6847044');
 expect(assets.adjustmentOperands.some(o=>o.captionKey.includes('gross')||o.captionKey.includes('accumulated'))).toBe(false);
});
it('uses FPT issuer same-method comparatives for fourH1 growth rates, rejects original full-consolidation base',()=>{
 const x=read(root+'/native-inputs/FPT.json'),f=read(root+'/fpt-same-method-comparatives.json');
 const growth=x.metricCandidates.filter(m=>m.metric==='ISSUER_SAME_METHOD_YOY_GROWTH');expect(growth).toHaveLength(4);
 for(const m of growth){
  const [current,base]=m.operandObservationIds.map(id=>s.observations.find(o=>o.id===id));const fact=f.facts.find(f=>f.itemId===m.itemId);
  validateSameMethodComparison(fact,current,base);expect(m.value).toBe(decimal(current.normalized.value).div(decimal(base.normalized.value)).sub(decimal('1')).toString());
  expect(m.organicGrowthAsserted).toBe(false);
  expect(()=>validateSameMethodComparison(fact,current,{...base,periodEnd:'2025-12-31'})).toThrow();
  if(fact.previousOriginalComparative!==fact.value)expect(()=>validateSameMethodComparison(fact,current,{...base,normalized:{...base.normalized,value:fact.previousOriginalComparative}})).toThrow();
 }
 expect(Number(growth.find(g=>g.itemId==='REVENUE').value)*100).toBeCloseTo(12.6162,3);
 expect(f.ttmAvailable).toBe(false);expect(f.fullYear2025SameMethodProvided).toBe(false);
});
it('preserves all previous review artifact and builder hashes',()=>{
 const m=read('docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-30/b6-close-inputs-r1/artifact-manifest.json');
 for(const p of [...m.artifactPins,...m.builderPins])expect(sha(p.path)).toBe(p.sha256);
 expect(sha('data/vn30.sqlite')).toBe(m.databaseSha256);
});
it.each([...new Set(s.observations.map(o=>o.ticker))])('%s keeps formal scoring blocked and review bridge valid',ticker=>{
 const x=read(root+'/native-inputs/'+ticker+'.json');expect(x.sourceGaps).toHaveLength(0);validateBridgePlan(x.bridgePlan);
 let reasons=[];try{bridgeScoringInputs(snapshot,x.securityId,x.bridgePlan,s);}catch(error){reasons=error.issues.map(i=>i.reason);}
 expect(reasons).toContain('CANDIDATES_NOT_FOR_SCORING');expect(x.readyForScoring).toBe(false);
});
