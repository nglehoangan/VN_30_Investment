import './lib/ts-runtime.mjs';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {createHash,randomUUID} from 'node:crypto';
import {resolve,join,dirname,isAbsolute} from 'node:path';
import {sealCandidate,validateMembership,validateIdentities,validateSector,reconcileUniverse,referenceCandidateGates} from './lib/reference-candidates.mjs';
const {SECTORS}=await import('../src/domain/scoring/methodology/sectors.ts');
const {validateReference}=await import('../src/domain/portfolio/reference.ts');
const {dateOnly}=await import('../src/shared/time.ts');
const {securityId}=await import('../src/domain/portfolio/values.ts');
const root=process.cwd(),args=process.argv.slice(2),base=join(root,'data/initialization-08b-universe-evidence-01');
if(args.length!==2||args[0]!=='--output'||!isAbsolute(args[1])||dirname(resolve(args[1]))!==join(root,'data')||existsSync(args[1]))throw new Error('NEW_PRIVATE_OUTPUT_REQUIRED');
const output=resolve(args[1]),sha=x=>createHash('sha256').update(x).digest('hex');
const text=readFileSync(join(base,'reference-transcription.json'),'utf8'),transcription=JSON.parse(text);
const pdfHash=sha(readFileSync(join(base,'hsx-july-constituents.pdf')));
if(transcription.pdfSha256!==pdfHash||transcription.members.length!==30||transcription.reviewStatus!=='UNREVIEWED_EXTRACTION_AID')throw new Error('EXACT_OFFICIAL_PDF_TRANSCRIPTION_REQUIRED');
const current=JSON.parse(readFileSync(join(base,'hsx-vn30-current.json'),'utf8'));
if(current.success!==true||current.data.paging.totalPages!==1||current.data.list.length!==current.data.paging.totalCount)throw new Error('COMPLETE_API_RESPONSE_REQUIRED');
const notice=JSON.parse(readFileSync(join(base,'hsx-july-notice.json'),'utf8'));
if(notice.success!==true||notice.data.id!==2479382||!notice.data.summary.includes('03/08/2026'))throw new Error('OFFICIAL_EFFECTIVE_DATE_BINDING_REQUIRED');
const sourceManifest=JSON.parse(readFileSync(join(base,'source-manifest.json'),'utf8'));
for(const source of sourceManifest.sources){
  if(!/^[a-zA-Z0-9-]+\.(json|pdf|png|html|js)$/.test(source.file))throw new Error('LOCAL_PUBLIC_EVIDENCE_FILENAME_REQUIRED');
  if(sha(readFileSync(join(base,source.file)))!==source.contentHash)throw new Error('SOURCE_MANIFEST_HASH_MISMATCH');
}
const byTicker=new Map(current.data.list.map(r=>[r.code,r]));
const sourceReference=sourceManifest.sources.find(s=>s.file==='hsx-july-constituents.pdf').sourceReference;
const issue='UNDATED_OFFICIAL_API_DIFFERS_FROM_DATED_NOTICE_DGC_PLX_TPB_VS_BSR_MCH_TCX';
const identities=transcription.members.map(r=>{
  let api=byTicker.get(r.ticker),identitySource='hsx-vn30-current.json';
  if(!api){identitySource=`hsx-identity-${r.ticker}.json`;const q=JSON.parse(readFileSync(join(base,identitySource),'utf8'));const matches=q.items.filter(i=>i.code===r.ticker);if(matches.length!==1)throw new Error('AMBIGUOUS_IDENTITY_SEARCH');api=matches[0];}
  return {securityId:randomUUID(),idStatus:'PROPOSED_NEW_UUID_REQUIRES_NON_PRIVATE_REGISTRY_RECONCILIATION',ticker:r.ticker,securityName:r.name,
    alternativeNameFromUndatedEndpoint:api.name??null,exchange:'HOSE',isin:api.isin,figi:api.figi??api.bloomberg??null,providerSecurityId:String(api.id),
    identityEvidence:sourceManifest.sources.find(s=>s.file===identitySource),nameEvidence:{sourceReference,evidenceHash:pdfHash,locator:`page:1/row:${r.ordinal}`},
    identifiers:[{type:'TICKER',value:r.ticker,from:'2026-08-03',to:null}],
    tickerHistoryStatus:'EARLIER_HISTORY_NOT_ESTABLISHED',nameHistoryStatus:'NAME_VARIANTS_RETAINED_NOT_DATED_RENAMES',reviewStatus:'REVIEW_REQUIRED'};
});
validateIdentities(identities);
const membership=transcription.members.map(r=>({ticker:r.ticker,securityId:identities.find(i=>i.ticker===r.ticker).securityId,name:r.name,exchange:'HOSE',index:'VN30',
  announcementDate:'2026-07-15',effectiveFrom:'2026-08-03',effectiveTo:null,
  intervalSemantics:'VERSION_COVERAGE_START_NOT_ORIGINAL_FIRST_ENTRY_DATE',source:'HOSE',sourceReference,evidenceHash:pdfHash,version:'HOSE-INDEX-JULY-2026-NOTICE-2479382',locator:`page:1/row:${r.ordinal}`,reviewStatus:'REVIEW_REQUIRED'}));
validateMembership(membership);
const reference={version:'DI123-PROPOSED-REFERENCE-2026-08-03',intervals:membership.map((r,i)=>({id:`candidate-membership-${i+1}`,kind:'MEMBERSHIP',securityId:securityId(r.securityId),from:dateOnly(r.effectiveFrom),to:null,value:'VN30',taxonomy:null,sourceReference:r.sourceReference}))};
validateReference(reference); // No COMPLETE_CONFIRMED coverage or production write.
const sectors=membership.map(r=>{const raw=transcription.sectors.filter(s=>s.ticker===r.ticker);if(raw.length!==1)throw new Error('AMBIGUOUS_OR_MISSING_SOURCE_SECTOR');return validateSector({securityId:r.securityId,ticker:r.ticker,sector:null,
    sourceSector:raw[0].sourceSector,sourceTaxonomy:'HOSE_VNALLSHARE_SECTOR_GICS',sourceTaxonomyVersion:'HOSE-JULY-2026-NOTICE-2479382',taxonomyVersion:null,
    effectiveFrom:'2026-08-03',effectiveTo:null,sourceReference,evidenceHash:pdfHash,locator:`page:${raw[0].page}/row:${raw[0].ordinal}`,method:'EXPLICIT_REFERENCE_EVIDENCE',approvalStatus:'REVIEW_REQUIRED',
    blocker:'GOVERNED_PROJECT_M3_MAPPING_REQUIRED_FINANCIALS_CANNOT_DISTINGUISH_BANK_INSURANCE_SECURITIES'},SECTORS);});
const catalog=JSON.parse(readFileSync(join(root,'docs/fundamental-data-engine/issuer-sources.json'),'utf8'));
const research=catalog.sources.filter(r=>r.scope==='research_basket').map(r=>r.ticker),official=membership.map(r=>r.ticker);
const common={sourceManifest,asOf:'2026-10-10',unresolvedConflicts:[issue,'NO_POST_EFFECTIVE_DATE_CHANGE_HISTORY_CERTIFICATION','INDEPENDENT_SOURCE_TRANSCRIPTION_REVIEW_PENDING'],
  retrievedAt:sourceManifest.sources.find(s=>s.file==='hsx-july-constituents.pdf').retrievedAt,
  reviewerChecklist:['Verify exact original source hashes, VN30 main table and exclude reserve table','Verify July15 announcement/August3 coverage start; do not invent historical first entry','Reconcile undated official API discrepancies and current coverage','Resolve stable IDs against any explicitly non-private identity registry','Approve dated project-sector assignments and source taxonomy mapping through existing governance'],requiredApproval:'GENUINE_REFERENCE_DATA_REVIEW_AND_EXACT_PACKAGE_OWNER_APPROVAL_WHERE_EXISTING_GOVERNANCE_ACCEPTS_IT'};
const packets={membership:sealCandidate('VN30_MEMBERSHIP_APPROVAL_CANDIDATE',{...common,sourceKind:'OFFICIAL',sourceAuthority:'HOSE_ORIGINAL_DATED_NOTICE_AND_ATTACHMENT',members:membership,reserves:transcription.reserves,referenceCandidate:reference,
  reconciliation:{OFFICIAL_ACTIVE:official,officialActiveSemantics:'DATED_NOTICE_CANDIDATES_FROM_2026_08_03_CURRENT_CONTINUITY_REVIEW_PENDING',RESEARCH_BASKET:research,DIFFERENCE:reconcileUniverse(official,research),undatedOfficialApiTickers:current.data.list.map(r=>r.code),undatedOfficialApiDifference:reconcileUniverse(current.data.list.map(r=>r.code),official),tickerChanges:'NOT_ESTABLISHED',newlyAddedPerSecondaryReport:['MCH','TCX'],removedPerSecondaryReport:['PLX','TPB'],secondaryChangeClaimsRequireOfficialPriorVersionReview:true},transformationRules:['Select only 30 main VN30 rows on PDF page1; reserve rows never enter active set','Bind effective date from notice body, not filename','Preserve undated API discrepancy; no automatic source winner']}),
  identities:sealCandidate('SECURITY_IDENTITY_APPROVAL_CANDIDATE',{...common,identities,transformationRules:['Allocate UUID independently of ticker; persist this immutable proposal for reuse','Bind HOSE ISIN/FIGI/provider identity; retain name variants','Do not create alias-derived duplicate identities or infer prior ticker history']}),
  sectors:sealCandidate('SECTOR_ASSIGNMENT_APPROVAL_CANDIDATE',{...common,assignments:sectors,allowedProjectSectors:SECTORS,sourceSectorCoverage:sectors.length,approvedProjectSectorCoverage:0,transformationRules:['Retain explicit sector-index membership from original PDF pages17–28','Never classify from issuer name or financial statement','No implicit GICS-to-M3 taxonomy mapping; Financials cannot imply BANK']}),};
process.umask(0o077);mkdirSync(output,{mode:0o700});
for(const [kind,packet] of Object.entries(packets))writeFileSync(join(output,kind+'.json'),JSON.stringify(packet,null,2)+'\n',{flag:'wx',mode:0o600});
writeFileSync(join(output,'di123.json'),JSON.stringify({status:'BLOCKED',packageHashes:Object.fromEntries(Object.entries(packets).map(([k,p])=>[k,p.packageHash])),gates:referenceCandidateGates({sourceKind:'OFFICIAL',rows:membership,identities,sectors,asOf:'2026-10-10',unresolvedIssues:common.unresolvedConflicts}),di4Through15:'RETAIN_EXISTING_BLOCKED_NOT_EXECUTED_NO_EVALUATION',productionWrites:0,downstreamExecuted:false},null,2)+'\n',{flag:'wx',mode:0o600});
console.log(JSON.stringify({status:'APPROVAL_CANDIDATES_PREPARED_NOT_APPROVED',members:membership.length,identities:identities.length,sourceSectors:sectors.length,approvedProjectSectors:0}));
