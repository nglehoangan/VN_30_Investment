import {createHash} from 'node:crypto';

const requireCandidate=(ok,reason)=>{if(!ok)throw new Error(reason);};
function canonical(value){
  if(value===null||typeof value!=='object')return JSON.stringify(value);
  if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
  return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
}
export const candidateHash=value=>createHash('sha256').update(canonical(value)).digest('hex');
const validDate=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;

/** Technical candidate checks only; none of these functions grants governance authority. */
export function validateMembership(rows){
  requireCandidate(Array.isArray(rows)&&rows.length>0,'MEMBERSHIP_ROWS_REQUIRED');
  requireCandidate(new Set(rows.map(r=>r.ticker)).size===rows.length,'DUPLICATE_TICKER');
  requireCandidate(new Set(rows.map(r=>r.securityId)).size===rows.length,'DUPLICATE_SECURITY_IDENTITY');
  for(const r of rows){
    requireCandidate(r.securityId&&/^[A-Z0-9]{2,10}$/.test(r.ticker)&&r.index==='VN30'&&r.exchange==='HOSE','REFERENCE_IDENTITY_REQUIRED');
    requireCandidate(validDate(r.effectiveFrom)&&(r.effectiveTo===null||validDate(r.effectiveTo)&&r.effectiveTo>r.effectiveFrom),'MEMBERSHIP_INTERVAL_REQUIRED');
    requireCandidate(r.sourceReference&&/^[a-f0-9]{64}$/.test(r.evidenceHash),'MEMBERSHIP_EVIDENCE_REQUIRED');
  }
  return rows;
}
export function activeMembership(rows,date){
  validateMembership(rows);requireCandidate(validDate(date),'AS_OF_REQUIRED');
  return rows.filter(r=>r.effectiveFrom<=date&&(r.effectiveTo===null||date<r.effectiveTo));
}
export function reconcileUniverse(official,research){
  requireCandidate(new Set(official).size===official.length,'DUPLICATE_OFFICIAL_TICKER');
  requireCandidate(new Set(research).size===research.length,'DUPLICATE_RESEARCH_TICKER');
  return {officialAbsentFromResearch:official.filter(t=>!research.includes(t)).sort(),researchNotOfficial:research.filter(t=>!official.includes(t)).sort(),duplicates:[]};
}
export function identityForAlias(identities,ticker,date){
  requireCandidate(validDate(date),'AS_OF_REQUIRED');
  const matches=identities.filter(r=>r.identifiers.some(i=>i.type==='TICKER'&&i.value===ticker&&validDate(i.from)&&i.from<=date&&(i.to===null||validDate(i.to)&&date<i.to)));
  requireCandidate(matches.length===1,'AMBIGUOUS_OR_MISSING_ALIAS');return matches[0].securityId;
}
export function validateIdentities(rows){
  requireCandidate(new Set(rows.map(r=>r.securityId)).size===rows.length,'DUPLICATE_STABLE_ID');
  requireCandidate(new Set(rows.map(r=>`${r.exchange}:${r.isin}`)).size===rows.length,'DUPLICATE_ISIN_IDENTITY');
  for(const r of rows)requireCandidate(r.securityId&&r.exchange==='HOSE'&&/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(r.isin),'AUTHORITATIVE_IDENTITY_IDENTIFIER_REQUIRED');
  return rows;
}
export function validateSector(row,allowedSectors){
  requireCandidate(row.method==='EXPLICIT_REFERENCE_EVIDENCE','NAME_OR_STATEMENT_INFERENCE_PROHIBITED');
  requireCandidate(row.sector===null||allowedSectors.includes(row.sector),'UNSUPPORTED_TAXONOMY');
  requireCandidate(row.sector===null||row.sourceReference&&row.evidenceHash&&row.taxonomyVersion&&validDate(row.effectiveFrom),'SECTOR_EVIDENCE_REQUIRED');
  return row;
}
export function sealCandidate(kind,input){
  requireCandidate(input.approvalStatus===undefined||input.approvalStatus==='REVIEW_REQUIRED','NO_SELF_APPROVAL');
  requireCandidate(input.approvalReference===undefined||input.approvalReference===null,'NO_SELF_APPROVAL');
  const packet={schemaVersion:1,...structuredClone(input),kind,approvalStatus:'REVIEW_REQUIRED',approvalReference:null,
    productionAdmissionPermitted:false,hashSemantics:'SHA256_SORTED_KEY_COMPACT_UTF8_JSON_EXCLUDING_PACKAGE_HASH'};
  return {...packet,packageHash:candidateHash(packet)};
}
export function referenceCandidateGates({sourceKind,rows,identities,sectors,asOf,unresolvedIssues=[]}){
  const active=activeMembership(rows,asOf);
  const identitiesComplete=active.every(r=>identities.some(i=>i.securityId===r.securityId&&i.ticker===r.ticker&&i.isin));
  const datedSector=s=>s.sector!==null&&s.approvalStatus==='APPROVED'&&validDate(s.effectiveFrom)&&s.effectiveFrom<=asOf&&(s.effectiveTo===null||validDate(s.effectiveTo)&&asOf<s.effectiveTo);
  const sectorsComplete=active.every(r=>sectors.some(s=>s.securityId===r.securityId&&datedSector(s)));
  // Candidate review tool has no trusted approval capability: declarations cannot self-pass a DI gate.
  return [
    {id:'DI1',status:'BLOCKED',measurement:{sourceKind,activeCandidateCount:active.length,approvedPackageBound:false},technicalEvidence:sourceKind==='OFFICIAL'?'DATED_OFFICIAL_CANDIDATE':'NON_OFFICIAL_REVIEW_REQUIRED',approvalRequired:'EXACT_OFFICIAL_SOURCE_AND_MEMBERSHIP_PACKAGE_REVIEW'},
    {id:'DI2',status:'BLOCKED',measurement:{activeCount:active.length,identitiesComplete,expectedCount:30,unresolvedIssues},technicalEvidence:active.length===30&&identitiesComplete&&unresolvedIssues.length===0?'COMPLETE_CANDIDATE':'INCOMPLETE_OR_CONFLICTED',approvalRequired:'STABLE_IDENTITY_RECONCILIATION_AND_SOURCE_CONFLICT_CLOSURE'},
    {id:'DI3',status:'BLOCKED',measurement:{activeCount:active.length,approvedSectorCount:active.filter(r=>sectors.some(s=>s.securityId===r.securityId&&datedSector(s))).length},technicalEvidence:sectorsComplete?'DECLARED_APPROVAL_REQUIRES_EXTERNAL_VERIFICATION':'MISSING_APPROVED_PROJECT_SECTOR_ASSIGNMENTS',approvalRequired:'DATED_M3_COMPATIBLE_SECTOR_ASSIGNMENTS_AND_GOVERNED_TAXONOMY_MAPPING'},
  ];
}
