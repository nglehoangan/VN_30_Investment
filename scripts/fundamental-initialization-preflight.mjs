import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const files={sources:'docs/fundamental-data-engine/issuer-sources.json',registry:'src/infrastructure/fundamentals/canonical-items-v1.json',mapping:'src/infrastructure/fundamentals/fpt-reviewed-mapping-v1.json',derivations:'src/infrastructure/fundamentals/derivation-crosswalk-v1.json',initialization:'docs/08_CONTINUOUS_IMPROVEMENT/DATA_INITIALIZATION.md',design:'docs/fundamental-data-engine/DESIGN_REVIEW.md'};
const hash=value=>createHash('sha256').update(value).digest('hex');
const gates=[
 ['DI1','VN30 master source/effective date verified'],['DI2','Active universe complete/no duplicates'],['DI3','Sector mapping complete'],['DI4','Required market data loaded'],['DI5','Required fundamentals loaded'],['DI6','Period/unit normalization validated'],['DI7','Missing-data checks PASS'],['DI8','Freshness checks PASS'],['DI9','Conflict/impossible-value checks PASS'],['DI10','Derived metric lineage verified'],['DI11','Point-in-time controls verified'],['DI12','Data Snapshot ID reproducible'],['DI13','Required per-ticker readiness determined'],['DI14','Independent data-quality review PASS'],['DI15','No Critical/Major data issue unresolved'],
];
/** Repository qualification inventory only. No env, database, network, import or scoring capability. */
export function initializationPreflight({asOf=null,target=null}={}){
 if(asOf!==null&&(typeof asOf!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(asOf)||!Number.isFinite(Date.parse(asOf))||new Date(asOf).toISOString()!==asOf))throw new Error('INVALID_AS_OF');
 if(target!==null&&(typeof target!=='string'||!path.isAbsolute(target)||! /\.(sqlite3?|db)$/.test(target)||/[\0?#%\r\n]/.test(target)))throw new Error('INVALID_TARGET');
 const evidence=Object.entries(files).map(([kind,file])=>{const bytes=readFileSync(path.join(root,file));return {kind,path:file,sha256:hash(bytes),bytes};});
 const json=kind=>JSON.parse(evidence.find(e=>e.kind===kind).bytes.toString('utf8'));
 const register=json('sources'),registry=json('registry'),mapping=json('mapping'),derivations=json('derivations');
 if(register.schemaVersion!==1||!Array.isArray(register.sources)||!register.sources.length)throw new Error('INVALID_SOURCE_REGISTER');
 const seen=new Set();
 for(const s of register.sources){if(!/^[A-Z0-9]{2,10}$/.test(s.ticker)||seen.has(s.ticker)||!['research_basket','supplemental_historical_candidate'].includes(s.scope)||typeof s.status!=='string')throw new Error('INVALID_SOURCE_REGISTER');seen.add(s.ticker);}
 const blockers=['NO_VERIFIED_INITIALIZATION_DATASET','OFFICIAL_UNIVERSE_AND_EFFECTIVE_MEMBERSHIP_REVIEW_REQUIRED','SECTOR_AND_MARKET_INPUTS_REQUIRED','REAL_SOURCE_ACCESS_AND_RETENTION_REVIEW_REQUIRED','INDEPENDENT_NORMALIZATION_FORMULA_PUBLICATION_REVIEW_REQUIRED','EXTERNAL_GOVERNANCE_CAPABILITIES_REQUIRED','DI14_DI15_INDEPENDENT_SIGN_OFF_REQUIRED','EXACT_SOURCE_TARGET_COMMAND_REVIEW_REQUIRED'];
 if(!target)blockers.push('TARGET_DATABASE_NOT_SELECTED');if(!asOf)blockers.push('REPORTING_WINDOW_AND_CUTOFF_NOT_SELECTED');
 // Metadata saying APPROVED never supplies an external approval capability.
 const packet={schemaVersion:1,kind:'VN30_INITIALIZATION_REPOSITORY_PREFLIGHT',status:'BLOCKED',dataset:null,snapshotRunId:null,contentHash:null,formalUniverseCount:null,sourceAccessExecuted:false,databaseAccessExecuted:false,scoringExecuted:false,
  requestedDecisionAsOf:asOf,target:{selected:target!==null,pathWithheld:true,pathHash:target?hash(path.resolve(target)):null,reviewRequired:true},
  repositoryEvidence:evidence.map(({kind,path,sha256})=>({kind,path,sha256})),
  inventory:{researchCandidates:register.sources.filter(s=>s.scope==='research_basket').length,supplementalCandidates:register.sources.filter(s=>s.scope==='supplemental_historical_candidate').length,officialConstituentValidation:register.universe.officialConstituentValidation,sourceRegisterCheckedOn:register.checkedOn,liveVerificationPerformed:false,registry:{version:registry.registryVersion,declaredGovernanceStatus:registry.governanceStatus,externalApprovalVerified:false},providerMappings:[{version:mapping.version,sourceVersionId:mapping.sourceVersionId,declaredGovernanceStatus:mapping.governanceStatus,externalApprovalVerified:false}],derivations:{version:derivations.version,declaredGovernanceStatus:derivations.governanceStatus,externalApprovalVerified:false}},
  candidates:register.sources.map(s=>({ticker:s.ticker,scope:s.scope,discoveryStatus:s.status,sourceRegisterReference:`${files.sources}#${s.ticker}`,activeMembership:'UNKNOWN',sector:'UNKNOWN',market:'UNKNOWN',fundamentals:'UNKNOWN',dataReady:null,readyForScoring:null,status:'BLOCKED',blockers:['OFFICIAL_MEMBERSHIP_NOT_ESTABLISHED','NO_VERIFIED_TICKER_INPUT_PACKAGE','SOURCE_QUALIFICATION_NOT_ESTABLISHED']})),
  gates:gates.map(([id,requirement])=>({id,requirement,status:'NOT_EXECUTED',datasetBoundEvidence:[],measurement:null,independentReviewer:null})),
  issueRegister:[{id:'INIT-001',severity:'MAJOR',status:'OPEN',issue:'No exact initialization dataset or official membership/sector/market evidence supplied.'},{id:'INIT-002',severity:'MAJOR',status:'OPEN',issue:'Real source qualification and externally approved interpretation/availability capabilities remain unverified.'},{id:'INIT-003',severity:'MAJOR',status:'OPEN',issue:'Independent dataset-specific review, DI acceptance and issue closure not executed.'}],blockers};
 return {...packet,packetHash:hash(JSON.stringify(packet))};
}
export function parseArguments(args){const options={};for(let i=0;i<args.length;i++){const key=args[i];if(!['--as-of','--target'].includes(key)||i+1>=args.length||args[i+1].startsWith('--'))throw new Error('INVALID_ARGUMENTS');const name=key==='--as-of'?'asOf':'target';if(name in options)throw new Error('INVALID_ARGUMENTS');options[name]=args[++i];}return options;}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{process.stdout.write(JSON.stringify(initializationPreflight(parseArguments(process.argv.slice(2))),null,2)+'\n');}
 catch{process.stderr.write('Initialization preflight rejected invalid arguments or repository evidence. No data access performed.\n');process.exitCode=1;}
}
