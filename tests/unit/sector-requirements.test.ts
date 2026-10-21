// @vitest-environment node
import {it,expect} from 'vitest';
import {scoringReadinessFixture} from '../fixtures/scoring-readiness';
import {snapshotHash} from '@/infrastructure/fundamentals/snapshot-hash';
import {evaluateSectorRequirements,validateSectorRequirements,type SectorRequirementGroups,type FinancialRequirement} from '@/domain/fundamentals/sector-requirements';
function setup(){
 const f=scoringReadinessFixture(),o=f.observations[0];
 const clause:FinancialRequirement={id:'income',itemId:o.itemId,periodStart:o.periodStart,periodEnd:o.periodEnd,reportingScope:o.reportingScope,unit:o.normalized.unit,currency:o.normalized.currency,preferredSources:[]};
 const spec:SectorRequirementGroups={contract:'sector-requirement-groups-v1',version:'synthetic-groups-v1',sector:o.sector,authorityReferences:['SYNTHETIC ONLY'],required:[],anyOf:[{id:'earnings',alternatives:[{...clause,id:'preferred-missing',itemId:'TOTAL_ASSETS'},clause],preferred:['preferred-missing','income']}],supporting:[],optional:[],valuationRuleReferences:['synthetic-sector-valuation'],normalizationRuleReferences:['synthetic-normalization']};
 const run=(s=spec,snapshot=f.snapshot,sources=f.sources)=>evaluateSectorRequirements(s,snapshot,sources,o.securityId,snapshotHash);
 return {f,o,clause,spec,run};
}
it('OR alternatives remain alternatives; missing preferred input falls back only to qualified evidence with audit',()=>{
 const {run}=setup(),r=run();expect(r.financialCoverageComplete).toBe(true);expect(r.anyOf[0].selectedAlternativeId).toBe('income');expect(r.anyOf[0].alternatives[0].status).toBe('BLOCKED');expect(r.anyOf[0].reason).toBe('EXPLICIT_ALTERNATIVE_PREFERENCE');expect(r.readyForScoring).toBe(false);expect(r.authorityApproved).toBe(false);
});
it('unsupported alternative and unsupported preference cannot pass',()=>{
 const {spec,run}=setup();expect(run({...spec,anyOf:spec.anyOf.map(g=>({...g,alternatives:g.alternatives.slice(0,1),preferred:['preferred-missing']}))}).financialCoverageComplete).toBe(false);
 expect(()=>run({...spec,anyOf:spec.anyOf.map(g=>({...g,preferred:['invented']}))})).toThrow();
});
it('missing required evidence blocks even when an OR group succeeds; supporting and optional never become mandatory',()=>{
 const {spec,clause,run}=setup(),missing={...clause,id:'missing',itemId:'TOTAL_ASSETS'};
 expect(run({...spec,required:[missing]}).financialCoverageComplete).toBe(false);
 const result=run({...spec,supporting:[missing],optional:[{...missing,id:'optional-missing'}]});expect(result.financialCoverageComplete).toBe(true);expect(result.supporting[0].status).toBe('BLOCKED');expect(result.optional[0].status).toBe('BLOCKED');
});
it('scope, unit, period, unknown publication, late availability and null are not qualified alternatives',()=>{
 const {f,spec,clause,run}=setup();for(const patch of [{reportingScope:'SEPARATE_STANDALONE' as const},{currency:'USD'},{periodEnd:'2026-06-29'}])expect(run({...spec,required:[{...clause,id:'strict',...patch}]}).financialCoverageComplete).toBe(false);
 for(const observations of [f.observations.map((o,i)=>i===0?{...o,normalized:{...o.normalized,value:null}}:o),f.observations.map((o,i)=>i===0?{...o,publication:{...o.publication,publicationStatus:'UNKNOWN' as const}}:o)])expect(run(spec,f.snapshot,{...f.sources,observations}).financialCoverageComplete).toBe(false);
 const assessments=f.assessments.map(a=>({...a,availableAt:'2099-01-01T00:00:00.000Z'}));expect(run(spec,f.snapshot,{...f.sources,assessments}).financialCoverageComplete).toBe(false);
});
it('sector-specific rule references are preserved and cross-sector use is rejected',()=>{
 const {run,spec}=setup(),r=run();expect(r.valuationRuleReferences).toEqual(spec.valuationRuleReferences);expect(r.normalizationRuleReferences).toEqual(spec.normalizationRuleReferences);
 expect(()=>run({...spec,sector:'BANK'})).toThrow();expect(()=>run({...spec,sector:'SECURITIES'})).toThrow();
});
it('selection receipt deterministically binds specification, source observations, availability and snapshot context',()=>{
 const {run,spec,clause}=setup(),a=run(),b=run();expect(a).toEqual(b);expect(a.anyOf[0].alternatives[1].selected?.observationHash).toMatch(/^[a-f0-9]{64}$/);expect(a.anyOf[0].alternatives[1].selected?.assessmentHash).toMatch(/^[a-f0-9]{64}$/);
 expect(run({...spec,normalizationRuleReferences:['changed-rule']}).contentHash).not.toBe(a.contentHash);
 const preferred=run({...spec,required:[{...clause,id:'source-priority',preferredSources:[setup().o.sourceVersionId]}]});expect(preferred.required[0].reason).toBe('EXPLICIT_SOURCE_PREFERENCE');
});
it('invalid or duplicate clauses, unbound sectors and candidate snapshots fail closed',()=>{
 const {run,spec,clause,f}=setup();expect(()=>validateSectorRequirements({...spec,required:[clause]})).toThrow();
 expect(()=>run(spec,{...f.snapshot,request:{...f.request,scope:'REVIEW_CANDIDATE'}})).toThrow();expect(()=>run({...spec,required:[{...clause,id:'bad',periodStart:'2027-01-01'}]})).toThrow();
 expect(()=>run({...spec,required:[],anyOf:[]})).toThrow();
});

import {approvedSectorRequirementTemplate,instantiateSectorRequirements} from '@/domain/fundamentals/sector-requirement-templates';
import manualRequirements from '@/domain/fundamentals/manual-fundamental-evidence-requirements-v2.json';
it('all nine sector templates preserve every approved OR/preference/supporting/optional group without bank substitutions',()=>{
 for(const sector of ['BANK','REAL_ESTATE','TECHNOLOGY','RETAIL','INDUSTRIAL','MATERIALS','UTILITIES','ENERGY','SECURITIES'] as const){
  const t=approvedSectorRequirementTemplate(sector),original=manualRequirements.sectors[sector];expect(t.groups.map(({category,...g})=>{expect(['CORE','SECTOR_CORE']).toContain(category);return g;})).toEqual([...original.CORE,...original.SECTOR_CORE]);expect(t.supporting).toEqual(original.SUPPORTING);expect(t.optional).toEqual(original.OPTIONAL);expect(t.fullScoringRequirementsComplete).toBe(false);
 }
 const bank=approvedSectorRequirementTemplate('BANK'),securities=approvedSectorRequirementTemplate('SECURITIES');expect(securities.groups).not.toEqual(bank.groups);
});
it('template instantiation requires explicit dimensions, retains unbound supporting/optional and maps preferences losslessly',()=>{
 expect(()=>instantiateSectorRequirements('BANK','synthetic',{})).toThrow();const {clause}=setup(),template=approvedSectorRequirementTemplate('BANK');
 const dimensions=Object.fromEntries(template.groups.flatMap(g=>g.anyOf).map(item=>[item,{periodStart:clause.periodStart,periodEnd:clause.periodEnd,reportingScope:clause.reportingScope,unit:clause.unit,currency:clause.currency,preferredSources:[]} ]));
 const r=instantiateSectorRequirements('BANK','synthetic',dimensions);expect(r.specification.anyOf).toHaveLength(template.groups.length);expect(r.unboundOptional).toEqual(template.optional.filter(i=>!dimensions[i]));expect(r.fullScoringRequirementsComplete).toBe(false);
});
it('tampering an observation amount without changing its sealed member hash cannot qualify',()=>{
 const {run,f,spec}=setup();const observations=f.observations.map((o,i)=>i===0?{...o,normalized:{...o.normalized,value:'999999'}}:o);expect(run(spec,f.snapshot,{...f.sources,observations}).financialCoverageComplete).toBe(false);
});
