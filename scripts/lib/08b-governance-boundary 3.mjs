/** Diagnostic ownership only: never maps a value, relaxes a selector or creates an adjustment. */
import {createHash} from 'node:crypto';
import approvedContract from '../../src/infrastructure/fundamentals/casa-npl-source-contract-v1.json' with {type:'json'};
if(createHash('sha256').update(JSON.stringify(approvedContract)).digest('hex')!=='936d596c17a2825f1fdae6686ccc8da61dfe27b02da341f9cd51f4f0c4d88657')throw Error('SOURCE_CONTRACT_PIN_MISMATCH');
export const sourceContractApprovalRecordedAt=approvedContract.approvalRecordedAt;
export const BOUNDARY_CLASSES=['FROZEN_M3_MAPPING_CONTRACT_INCOMPLETE','INTENTIONALLY_REQUIRES_HUMAN_ANALYST_REVIEW','LATER_SCORING_WORKFLOW_DEPENDENCY','LATER_VALUATION_WORKFLOW_DEPENDENCY','OPTIONAL_NON_BLOCKING_DERIVATION','TRUE_UNRESOLVED_GOVERNANCE_DEFECT','APPROVED_CONTRACT_REQUIRES_BANK_SPECIFIC_MAPPING'];
export const pathKey=r=>JSON.stringify([r.securityId,r.itemId,r.reportingScope,r.periodStart,r.periodEnd]);
export function mappingBoundary(row,{cutoff}={}){
 if(cutoff!==undefined&&(typeof cutoff!=='string'||!Number.isFinite(Date.parse(cutoff))||new Date(cutoff).toISOString()!==cutoff))throw Error('INVALID_SOURCE_CONTRACT_CUTOFF');
 if(row.obligationRole==='SUPPORTING_FY2022_ROUTE_ATTEMPT_NOT_ADDITIONAL_MINIMUM_3Y_REQUIREMENT')return {classification:BOUNDARY_CLASSES[4],owner:'OPTIONAL_HISTORY',defectKey:null,reason:'FY2022 supporting route does not add a fourth year to the frozen three-year minimum.'};
 if(row.metric==='FCF')return {classification:BOUNDARY_CLASSES[1],owner:'ANALYST_CAPITAL_EXPENDITURE_RECONCILIATION',defectKey:null,reason:'M3 §12.6 requires issuer expenditure to sustain/grow operations and explicit total-versus-maintenance disclosure. The broad cash-payment caption includes other long-term assets; economic reconciliation needs reviewed issuer context. The approved CFO minus issuer capex formula itself is complete.'};
 if(['NPL','CASA'].includes(row.metric)&&cutoff!==undefined&&cutoff>=sourceContractApprovalRecordedAt)return {classification:BOUNDARY_CLASSES[6],owner:'PROJECT_OWNER_BANK_MAPPING_AND_SOURCE_EVIDENCE',defectKey:null,executionAllowed:false,contractVersion:approvedContract.version,approvalRecordedAt:sourceContractApprovalRecordedAt,reason:'The source contract is owner-approved at this cutoff. No bank-specific mapping table was supplied; exact issuer product/class population, captions, authority, scope, unit, effective period and mapping approval remain required. No numeric alias or regulatory sum is authorized.'};
 if(row.metric==='NPL')return {classification:BOUNDARY_CLASSES[0],owner:'PROJECT_OWNER_MAPPING_CONTRACT_GOVERNANCE',defectKey:'NPL_REGULATORY_PERIMETER_MAPPING_CONTRACT',reason:'Approved M3 §12.9 requires the reported regulatory NPL perimeter. Retained group-3/4/5/narrative candidates are not an exact reported total; the candidate REPORTED-only crosswalk has no approved source-column/perimeter-bound construction contract. Owner must approve that machine contract before execution; no regulatory sum is inferred.'};
 if(row.metric==='CASA')return {classification:BOUNDARY_CLASSES[0],owner:'PROJECT_OWNER_MAPPING_CONTRACT_GOVERNANCE',defectKey:'CASA_ISSUER_PERIMETER_MAPPING_CONTRACT',reason:'Approved M3 §12.11 requires current plus savings accounts using bank-reported definitions. The candidate REPORTED-only crosswalk cannot establish savings/Auto-Earning perimeter from demand deposits alone. An approved source-specific perimeter/column contract is required; no bank definition or alias is invented.'};
 throw Error('UNREVIEWED_MAPPING_BOUNDARY_ROUTE');
}
export function mandatoryPath(r){return r.periodEnd.slice(0,4)>='2023'&&!['NET_INCOME_ATTRIBUTABLE_COMMON','COMMON_EQUITY','CAPEX','BANK_CURRENT_AND_SAVINGS_DEPOSITS','BANK_NONPERFORMING_LOANS'].includes(r.itemId);}
export function unknownPathCategory({selected=false,mandatory=false,superseded=false,conflicted=false,humanOnly=false}){
 if(selected)return mandatory?'SELECTED_MANDATORY_INPUT':'SELECTED_OPTIONAL_INPUT';
 if(superseded)return 'SUPERSEDED';
 if(conflicted)return 'CONFLICTED';
 if(humanOnly)return 'HUMAN_REVIEW_DEPENDENCY';
 return 'UNSELECTED_CANDIDATE';
}
export function engineReadiness({mandatorySourceMissing=0,requiredPITUnknown=0,requiredSelectorBlockers=0,governanceDefects=0,sourceContextReview=0,selectedUnsafe=0}){
 const blockers=[];
 if(mandatorySourceMissing)blockers.push('MANDATORY_SOURCE_MISSING');
 if(requiredPITUnknown)blockers.push('REQUIRED_PATH_PUBLICATION_AUTHORITY_UNKNOWN');
 if(requiredSelectorBlockers)blockers.push('REQUIRED_PATH_SELECTOR_BLOCKED');
 if(governanceDefects)blockers.push('FROZEN_M3_MAPPING_CONTRACT_INCOMPLETE');
 if(sourceContextReview)blockers.push('REQUIRED_SOURCE_OR_SELECTOR_CONTEXT_REVIEW');
 if(selectedUnsafe)blockers.push('UNSAFE_SELECTED_FACT');
 return {fundamentalDataEngineReady:blockers.length===0,blockers};
}

export function blocksRequiredAvailability({mandatory=false,superseded=false,humanOnly=false,pathSatisfied=false}){return mandatory&&!superseded&&!humanOnly&&!pathSatisfied;}
