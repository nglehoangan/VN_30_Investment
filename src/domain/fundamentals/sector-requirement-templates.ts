import requirements from './manual-fundamental-evidence-requirements-v2.json' with {type:'json'};
import type {Sector} from '@/domain/scoring/methodology';
import {requireFundamental} from './validation';
import {deepFreeze} from '@/domain/portfolio/transaction';
import {validateSectorRequirements,type FinancialRequirement,type SectorRequirementGroups} from './sector-requirements';
const sections:Partial<Record<Sector,string>>={BANK:'5',REAL_ESTATE:'6',TECHNOLOGY:'7',RETAIL:'8',INDUSTRIAL:'9',MATERIALS:'10',UTILITIES:'11',ENERGY:'12',SECURITIES:'13.1'};
/** Retains approved admission groups exactly. Admission sufficiency is not full scoring sufficiency. */
export function approvedSectorRequirementTemplate(sector:Sector){
 const section=sections[sector];requireFundamental(section&&Object.hasOwn(requirements.sectors,sector),'SUPPORTED_SECTOR_TEMPLATE');
 const route=requirements.sectors[sector as keyof typeof requirements.sectors];
 return deepFreeze({contract:'approved-sector-requirement-template-v1',sourceVersion:requirements.version,sourceApproval:requirements.approval,sector,
  groups:[...route.CORE.map(g=>({...g,category:'CORE' as const})),...route.SECTOR_CORE.map(g=>({...g,category:'SECTOR_CORE' as const}))],
  supporting:route.SUPPORTING,optional:route.OPTIONAL,requiredDerivations:route.requiredDerivations,
  sectorRuleReference:'docs/03 SCORING/SECTOR_NORMALIZATION.md#'+section,
  fullScoringRequirementsComplete:false as const});
}
/** Instantiate explicit dimensions only. No unit/window/scope inference or source/authority activation. */
export function instantiateSectorRequirements(sector:Sector,version:string,dimensions:Readonly<Record<string,Omit<FinancialRequirement,'id'|'itemId'>>>){
 const template=approvedSectorRequirementTemplate(sector);
 const clause=(itemId:string,id:string):FinancialRequirement=>{const d=dimensions[itemId];requireFundamental(d,'SECTOR_REQUIREMENT_DIMENSIONS_MISSING');return {...d,id,itemId};};
 const spec:SectorRequirementGroups={contract:'sector-requirement-groups-v1',version,sector,authorityReferences:['src/domain/fundamentals/manual-fundamental-evidence-requirements-v2.json'],required:[],
  anyOf:template.groups.map(g=>{const id=g.category+'-'+g.id;const preferred='preference' in g?g.preference as readonly string[]:[];return {id,alternatives:g.anyOf.map(item=>clause(item,id+'-'+item)),preferred:preferred.map(item=>id+'-'+item)};}),
  supporting:template.supporting.filter(item=>dimensions[item]).map(item=>clause(item,'supporting-'+item)),optional:template.optional.filter(item=>dimensions[item]).map(item=>clause(item,'optional-'+item)),
  valuationRuleReferences:[template.sectorRuleReference],normalizationRuleReferences:[template.sectorRuleReference]};
 return deepFreeze({template,specification:validateSectorRequirements(spec),unboundSupporting:template.supporting.filter(item=>!dimensions[item]),unboundOptional:template.optional.filter(item=>!dimensions[item]),fullScoringRequirementsComplete:false as const});
}
