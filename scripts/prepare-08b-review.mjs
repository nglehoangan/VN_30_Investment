import './lib/ts-runtime.mjs';
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,mkdirSync,existsSync,lstatSync} from 'node:fs';
import {resolve,join,isAbsolute,dirname} from 'node:path';
import {researchReadiness,transcriptionDraft} from './lib/transcription-draft.mjs';

const {RepositoryRawDocuments}=await import('../src/infrastructure/fundamentals/raw-document.ts');
const {loadCanonicalRegistry}=await import('../src/infrastructure/fundamentals/canonical-registry.ts');
const {loadStatementMapping}=await import('../src/infrastructure/fundamentals/reviewed-statement.ts');
const {loadDerivationCrosswalk}=await import('../src/infrastructure/fundamentals/derivation-crosswalk.ts');

// No environment loading, fetching, qualification writes, canonical writes or downstream composition.
const args=process.argv.slice(2);
if(args.length!==4||args[0]!=='--database'||args[2]!=='--output'||!isAbsolute(args[1])||!isAbsolute(args[3]))throw new Error('EXPLICIT_ABSOLUTE_DATABASE_AND_NEW_OUTPUT_REQUIRED');
const database=resolve(args[1]),output=resolve(args[3]),root=process.cwd();
if(database!==resolve(root,'data/initialization-08b.sqlite')||lstatSync(database).isSymbolicLink()||existsSync(output)||dirname(output)!==resolve(root,'data')||lstatSync(resolve(root,'data')).isSymbolicLink())throw new Error('OWNER_TARGET_AND_NEW_PRIVATE_DATA_OUTPUT_REQUIRED');
process.umask(0o077);
const sha=x=>createHash('sha256').update(x).digest('hex');
const db=new DatabaseSync(database,{readOnly:true});db.exec('PRAGMA query_only=ON');
const quickCheck=db.prepare('PRAGMA quick_check').all(),foreignKeys=db.prepare('PRAGMA foreign_key_check').all();
if(quickCheck.length!==1||Object.values(quickCheck[0])[0]!=='ok'||foreignKeys.length)throw new Error('DATABASE_INTEGRITY_REQUIRED');
for(const table of ['security','fundamental_observation','fundamental_normalization','fundamental_derivation','fundamental_availability_assessment','fundamental_snapshot_content','fundamental_snapshot_run','data_initialization_acceptance','scoring_dataset_binding']){
  if(db.prepare(`SELECT count(*) AS count FROM ${table}`).get().count!==0)throw new Error('RAW_ONLY_REVIEW_STAGE_REQUIRED_REAUDIT_AFTER_CANONICAL_INITIALIZATION');
}
const rawTables=['fundamental_source_version','fundamental_import_batch','fundamental_raw_capture'];
const inventory=createHash('sha256');let verifiedRows=0;
for(const table of rawTables)for(const row of db.prepare(`SELECT id,body,body_hash FROM ${table} ORDER BY id`).iterate()){
  if(sha(row.body)!==row.body_hash)throw new Error('RAW_STORED_BODY_HASH_MISMATCH');
  inventory.update(JSON.stringify([table,row.id,row.body_hash])+'\n');verifiedRows++;
}
const get=(table,id)=>{const r=db.prepare(`SELECT body,body_hash FROM ${table} WHERE id=?`).get(id);if(!r)return null;if(sha(r.body)!==r.body_hash)throw new Error('RAW_STORED_BODY_HASH_MISMATCH');return JSON.parse(r.body);};
const repository={findCapture:async id=>get(rawTables[2],id),findImport:async id=>get(rawTables[1],id),findSource:async id=>get(rawTables[0],id)};
const reader=new RepositoryRawDocuments(repository),documents=[],nonPdfResponses=[];
mkdirSync(output,{mode:0o700});
const write=(name,value)=>writeFileSync(join(output,name),JSON.stringify(value,null,2)+'\n',{flag:'wx',mode:0o600});
try {
  for(const row of db.prepare('SELECT id FROM fundamental_import_batch ORDER BY id').all()){
    const batch=get(rawTables[1],row.id),source=get(rawTables[0],batch.sourceVersionId);
    const researchTicker=source.id==='fpt-public-documents-v1'?'FPT':/^issuer-([a-z0-9]+)-08b-/.exec(source.id)?.[1].toUpperCase()??null;
    for(let i=0;i<batch.captureIds.length;){
      const first=get(rawTables[2],batch.captureIds[i]),e=JSON.parse(first.payload);
      if(e.chunkIndex!==0||!Number.isInteger(e.chunkCount)||e.chunkCount<1||e.chunkCount>64||i+e.chunkCount>batch.captureIds.length)throw new Error('RAW_RESPONSE_BOUNDARY');
      const captureIds=batch.captureIds.slice(i,i+e.chunkCount);i+=e.chunkCount;
      if(e.error!==null||!['application/pdf','application/octet-stream'].includes(e.mediaType)||Buffer.from(e.bytes,'base64').subarray(0,5).toString()!=='%PDF-'){
        nonPdfResponses.push({researchTicker,sourceVersionId:source.id,importExecutionId:batch.id,captureIds,bodyHash:e.bodySha256,mediaType:e.mediaType,status:e.error===null?'NOT_ADMISSIBLE_PDF':'FAILED_RESPONSE',blocker:e.mediaType.includes('zip')?'ARCHIVE_MEMBER_TRANSFORMATION_NOT_IMPLEMENTED':'NOT_A_FINANCIAL_FACT'});continue;
      }
      const raw=await reader.reconstruct(captureIds),{bodyBase64,...metadata}=raw;
      documents.push({...metadata,researchTicker,provider:source.provider,qualificationStatus:'UNQUALIFIED',reportingPeriod:null,scope:null,reviewerReference:null});
      // Keep one representative reconstruction for concrete offline content review. All receipts remain in inventory.
      if(researchTicker==='FPT'&&!existsSync(join(output,'fpt-review.pdf'))){
        writeFileSync(join(output,'fpt-review.pdf'),Buffer.from(bodyBase64,'base64'),{flag:'wx',mode:0o600});write('fpt-transcription-draft.json',transcriptionDraft(raw));
      }
    }
  }
  const registry=loadCanonicalRegistry(),mapping=loadStatementMapping(registry),crosswalk=loadDerivationCrosswalk(registry);
  const artifacts=[['REGISTRY','canonical-items-v1.json',registry.manifest,registry.registryHash],['FPT_MAPPING','fpt-reviewed-mapping-v1.json',mapping.manifest,mapping.hash],['DERIVATION_CROSSWALK','derivation-crosswalk-v1.json',crosswalk.crosswalk,crosswalk.hash]];
  const methods=db.prepare('SELECT methodology_id,family,configuration_reference,governance_status,intended_use FROM methodology_record ORDER BY methodology_id').all();
  const approvals=artifacts.map(([kind,file,manifest,semanticHash])=>({kind,reference:`src/infrastructure/fundamentals/${file}`,fileSha256:sha(readFileSync(join(root,'src/infrastructure/fundamentals',file))),semanticHash,
    hashSemantics:kind==='REGISTRY'?'SORTED_KEY_CANONICAL_JSON':'EXACT_JSON_STRINGIFY_VALIDATED_MANIFEST',version:manifest.registryVersion??manifest.version,
    technicalValidation:'PASSED_EXISTING_LOADER',governanceStatus:manifest.governanceStatus,approvalReference:null,
    supportedIssuers:kind==='FPT_MAPPING'?['FPT']:null,
    issuerApplicabilityRule:kind==='FPT_MAPPING'?'FPT_ONLY_EXACT_SOURCE_VERSION_AND_APPROVED_SECTOR_REQUIRED':'ISSUER_AGNOSTIC_DEFINITIONS_REQUIRE_OFFICIAL_SECURITY_SECTOR_AND_DOCUMENT_QUALIFICATION',
    supportedSectors:kind==='FPT_MAPPING'?null:[...new Set(kind==='REGISTRY'?manifest.items.flatMap(i=>i.sectorApplicability):manifest.routes.map(r=>r.sector))],
    sectorApplicabilityRule:kind==='FPT_MAPPING'?'NO_SECTOR_MASTER_AUTHORITY_DECLARED_BY_MAPPING':'ONLY_DECLARED_DEFINITION_ROUTES_NOT_AN_ISSUER_SECTOR_ASSIGNMENT',
    requiredMethodologyConfigurationReference:kind==='REGISTRY'?`registry-sha256:${semanticHash}`:null,
    exactDefinitions:manifest,matchingApprovedProductionMethodologies:kind==='REGISTRY'?methods.filter(m=>m.governance_status==='APPROVED'&&m.intended_use==='PRODUCTION'&&m.configuration_reference===`registry-sha256:${semanticHash}`):[],
    requiredApprovalReference:'GENUINE_EXTERNAL_APPROVAL_OF_FINAL_RELEASE_HASH_AND_EXACT_METHODOLOGY_BINDING',
    limitations:['PROPOSED_IS_NOT_APPROVED','APPROVAL_CHANGES_RELEASE_CONTENT_REQUIRING_FINAL_HASH_REVIEW',...(kind==='FPT_MAPPING'?['SOURCE_VERSION_EXACT_MATCH_REQUIRED_NOT_REBOUND_TO_08B_SOURCES','FIVE_FIELDS_ONLY_NO_BANKING_MAPPING','TOTAL_PROFIT_IS_NOT_COMMON_ATTRIBUTABLE_PROFIT','CAPEX_DEFINITION_RECONCILIATION_REQUIRED']:kind==='DERIVATION_CROSSWALK'?['BANK_CASA_NPL_OPERANDS_UNRESOLVED','ROE_REQUIRES_GENUINE_NORMALIZATION_AND_AVERAGE_EQUITY']:[])],
    reviewerChecklist:['Verify definitions against frozen M3 authority','Verify issuer/sector applicability and source-version identity','Verify units, periods, scope and profit/CAPEX semantics','Approve final hash/version through existing governance; never treat this package as authority']}));
  const catalog=JSON.parse(readFileSync(join(root,'docs/fundamental-data-engine/issuer-sources.json'),'utf8'));
  write('review-package.json',{schemaVersion:1,kind:'SLICE_08B_OUTSIDE_CANONICAL_REVIEW_PACKAGE',status:'BLOCKED',databaseReference:'data/initialization-08b.sqlite',verifiedRawStoredBodies:verifiedRows,rawInventoryHash:inventory.digest('hex'),
    documents,nonPdfResponses,approvalCandidates:approvals,methodologyRecordsChecked:methods,researchReadiness:researchReadiness(catalog.sources,documents),officialUniverseCount:null,qualifiedDocuments:0,
    snapshotRunId:null,contentHash:null,canonicalWrites:0,rawAcquisitionExecuted:false,scoringExecuted:false});
  console.log(JSON.stringify({status:'BLOCKED_REVIEW_PACKAGE_PREPARED',pdfReceipts:documents.length,nonPdfResponses:nonPdfResponses.length,canonicalWrites:0}));
} finally {db.close();}
