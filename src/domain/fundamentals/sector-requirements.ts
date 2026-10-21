import type {Sector} from '@/domain/scoring/methodology';
import {SECTORS} from '@/domain/scoring/methodology';
import type {FundamentalObservation} from './contracts';
import type {FundamentalSnapshot} from './snapshot';
import type {ScoringBridgeSources} from './scoring-bridge';
import {eligibleScoringFact} from './scoring-bridge';
import {requireFundamental,fundamentalId} from './validation';
import {dateOnly} from '@/shared/time';
import {ValidationError} from '@/shared/errors';
import {deepFreeze} from '@/domain/portfolio/transaction';

/** Additive, evidence-only contract. Never substitutes for a registered scoring/DI authority. */
export interface FinancialRequirement {
 readonly id:string; readonly itemId:string;
 readonly periodStart:string; readonly periodEnd:string;
 readonly reportingScope:FundamentalObservation['reportingScope'];
 readonly unit:FundamentalObservation['normalized']['unit']; readonly currency:string|null;
 /** Exact source-version IDs in preferred order; empty means no source preference. */
 readonly preferredSources:readonly string[];
}
export interface SectorRequirementGroups {
 readonly contract:'sector-requirement-groups-v1'; readonly version:string; readonly sector:Sector;
 readonly authorityReferences:readonly string[];
 readonly required:readonly FinancialRequirement[];
 readonly anyOf:readonly {readonly id:string;readonly alternatives:readonly FinancialRequirement[];readonly preferred:readonly string[]}[];
 readonly supporting:readonly FinancialRequirement[]; readonly optional:readonly FinancialRequirement[];
 readonly valuationRuleReferences:readonly string[]; readonly normalizationRuleReferences:readonly string[];
}
function exact(v:object,fields:string){requireFundamental(v!==null&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join(' ')===fields.split(' ').sort().join(' '),'SECTOR_REQUIREMENTS_EXACT_FIELDS');}
function refs(v:readonly string[],required=false){requireFundamental(Array.isArray(v)&&(!required||v.length>0)&&new Set(v).size===v.length&&v.every(s=>typeof s==='string'&&s.trim()===s&&s.length>0&&s.length<=4000&&!/[\x00-\x1f<>]/.test(s)),'SECTOR_REQUIREMENTS_REFERENCES');}
export function validateSectorRequirements(s:SectorRequirementGroups){
 exact(s,'contract version sector authorityReferences required anyOf supporting optional valuationRuleReferences normalizationRuleReferences');
 requireFundamental(s.contract==='sector-requirement-groups-v1'&&SECTORS.includes(s.sector),'SECTOR_REQUIREMENTS_CONTRACT');fundamentalId(s.version);
 refs(s.authorityReferences,true);refs(s.valuationRuleReferences,true);refs(s.normalizationRuleReferences,true);
 const ids:string[]=[];
 function clause(c:FinancialRequirement){
  exact(c,'id itemId periodStart periodEnd reportingScope unit currency preferredSources');fundamentalId(c.id);fundamentalId(c.itemId);ids.push(c.id);
  dateOnly(c.periodStart);dateOnly(c.periodEnd);requireFundamental(c.periodStart<=c.periodEnd,'SECTOR_REQUIREMENTS_PERIOD');
  requireFundamental(['CONSOLIDATED','SEPARATE_STANDALONE'].includes(c.reportingScope),'SECTOR_REQUIREMENTS_SCOPE');
  requireFundamental(['CURRENCY','CURRENCY_PER_SHARE','SHARES','RATIO'].includes(c.unit)&&(['CURRENCY','CURRENCY_PER_SHARE'].includes(c.unit)?typeof c.currency==='string'&&/^[A-Z]{3}$/.test(c.currency):c.currency===null),'SECTOR_REQUIREMENTS_UNIT');refs(c.preferredSources);
 }
 for(const a of [s.required,s.anyOf,s.supporting,s.optional])requireFundamental(Array.isArray(a),'SECTOR_REQUIREMENTS_ARRAY');
 requireFundamental(s.required.length+s.anyOf.length>0,'SECTOR_REQUIREMENTS_REQUIRED');
 s.required.forEach(clause);s.supporting.forEach(clause);s.optional.forEach(clause);
 for(const g of s.anyOf){exact(g,'id alternatives preferred');fundamentalId(g.id);ids.push(g.id);requireFundamental(Array.isArray(g.alternatives)&&g.alternatives.length>0,'SECTOR_REQUIREMENTS_ALTERNATIVES');g.alternatives.forEach(clause);refs(g.preferred);requireFundamental(g.preferred.every(id=>g.alternatives.some(c=>c.id===id)),'SECTOR_REQUIREMENTS_UNSUPPORTED_PREFERENCE');}
 requireFundamental(new Set(ids).size===ids.length,'SECTOR_REQUIREMENTS_DUPLICATE_ID');
 return deepFreeze(structuredClone(s));
}
/** Qualifies from selected FORMAL snapshot members through the existing strict bridge, never caller booleans.
 * Multiple unranked sources are ambiguous; array order is not a source precedence policy.
 * Valuation/normalization references are retained, not claimed satisfied by financial coverage. */
export function evaluateSectorRequirements(raw:SectorRequirementGroups,s:FundamentalSnapshot,sources:ScoringBridgeSources,securityId:string,hash:(v:unknown)=>string){
 const spec=validateSectorRequirements(raw);
 requireFundamental(s.request.scope==='FORMAL'&&s.request.mode==='AS_KNOWN'&&s.request.revisionCutoff===null,'SECTOR_REQUIREMENTS_FORMAL_AS_KNOWN');
 requireFundamental(s.request.references.find(r=>r.kind==='SECTOR')?.content.includes(securityId+':'+spec.sector),'SECTOR_REQUIREMENTS_SECTOR_BINDING');
 function assess(c:FinancialRequirement){
  const rejected:{observationId:string;reason:string}[]=[];
  const candidates=s.members.flatMap(m=>{
   const o=sources.observations.find(o=>o.id===m.observationId);
   if(!o||o.securityId!==securityId||o.itemId!==c.itemId)return [];
   if(o.periodStart!==c.periodStart||o.periodEnd!==c.periodEnd||o.reportingScope!==c.reportingScope||o.normalized.unit!==c.unit||o.normalized.currency!==c.currency){rejected.push({observationId:o.id,reason:'REQUIRED_DIMENSIONS_MISMATCH'});return [];}
   try{requireFundamental(hash(o)===m.observationHash,'SECTOR_REQUIREMENTS_OBSERVATION_HASH');const qualified=eligibleScoringFact(s,securityId,sources,o.id);requireFundamental(qualified.a.observationHash===hash(o),'SECTOR_REQUIREMENTS_ASSESSMENT_HASH');return [{observationId:o.id,sourceVersionId:o.sourceVersionId,observationHash:hash(o),assessmentId:qualified.a.id,assessmentHash:hash(qualified.a)}];}
   catch(e){if(!(e instanceof ValidationError))throw e;rejected.push({observationId:o.id,reason:e.issues.map(i=>i.reason).join('|')});return [];}
  }).sort((a,b)=>a.observationId.localeCompare(b.observationId));
  const ranked=candidates.filter(o=>c.preferredSources.includes(o.sourceVersionId)).sort((a,b)=>c.preferredSources.indexOf(a.sourceVersionId)-c.preferredSources.indexOf(b.sourceVersionId));
  const best=ranked.length?ranked.filter(o=>o.sourceVersionId===ranked[0].sourceVersionId):candidates;
  const selected=best.length===1?best[0]:null;
  return {id:c.id,itemId:c.itemId,status:selected?'QUALIFIED' as const:'BLOCKED' as const,selected,candidates,rejected,reason:selected?(ranked.length?'EXPLICIT_SOURCE_PREFERENCE':'ONLY_QUALIFIED_SOURCE'):best.length>1?'AMBIGUOUS_QUALIFIED_SOURCES':'NO_QUALIFIED_EVIDENCE'};
 }
 const required=spec.required.map(assess),supporting=spec.supporting.map(assess),optional=spec.optional.map(assess);
 const anyOf=spec.anyOf.map(g=>{
  const alternatives=g.alternatives.map(assess),qualified=alternatives.filter(a=>a.status==='QUALIFIED');
  const ranked=qualified.filter(a=>g.preferred.includes(a.id)).sort((a,b)=>g.preferred.indexOf(a.id)-g.preferred.indexOf(b.id));
  // Without preference, deterministic clause ID ordering is an explicitly recorded route choice, not source precedence.
  const selected=ranked[0]??qualified.slice().sort((a,b)=>a.id.localeCompare(b.id))[0]??null;
  return {id:g.id,status:selected?'QUALIFIED' as const:'BLOCKED' as const,alternatives,selectedAlternativeId:selected?.id??null,reason:selected?(ranked.length?'EXPLICIT_ALTERNATIVE_PREFERENCE':'DETERMINISTIC_QUALIFIED_ALTERNATIVE'):'NO_QUALIFIED_ALTERNATIVE'};
 });
 const financialCoverageComplete=s.blockers.length===0&&required.every(r=>r.status==='QUALIFIED')&&anyOf.every(g=>g.status==='QUALIFIED');
 const body={contract:'sector-requirement-selection-v1',requirementsHash:hash(spec),snapshotHash:s.contentHash,securityId,sector:spec.sector,asOf:s.request.decisionAsOf,knownAt:s.request.systemKnownAt,required,anyOf,supporting,optional,valuationRuleReferences:spec.valuationRuleReferences,normalizationRuleReferences:spec.normalizationRuleReferences,financialCoverageComplete,readyForScoring:false as const,authorityApproved:false as const};
 return deepFreeze({...body,contentHash:hash(body)});
}
