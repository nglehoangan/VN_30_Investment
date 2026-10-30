/** Read-only DB inventory + review draft. Never inserts acceptance or registers approval. */
import './lib/ts-runtime.mjs';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import ts from 'typescript';
const {snapshotHash}=await import('../src/infrastructure/fundamentals/snapshot-hash.ts');
const {verifyProductionAuthorityBundle}=await import('../src/infrastructure/dependencies/production-authority.ts');
const {validateDIAcceptance}=await import('../src/domain/fundamentals/scoring-readiness.ts');
const out='docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-29';
const target=out+'/acceptance.draft.json';
if(existsSync(target))throw Error('DRAFT_EXISTS_CREATE_A_NEW_REVISION');
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const pin=path=>({path,sha256:createHash('sha256').update(readFileSync(path)).digest('hex')});
const authority=read('src/infrastructure/dependencies/active-authorities.json');
const bundle=verifyProductionAuthorityBundle(process.cwd(),authority.authorityBundle).bundle;
const releasePath='docs/fundamental-data-engine/evidence/2026-10-19-level1-promotion-partition-closure/RELEASE.json';
const members=read(releasePath).partition.members;
if(members.length!==30||new Set(members.map(m=>m.securityId)).size!==30)throw Error('UNIVERSE_INVALID');
const hashDB=()=>createHash('sha256').update(readFileSync('data/vn30.sqlite')).digest('hex');
const before=hashDB(),db=new DatabaseSync('data/vn30.sqlite',{readOnly:true});
const observed={formalSnapshotRuns:db.prepare('SELECT count(*) AS n FROM fundamental_snapshot_run').get().n,formalAcceptances:db.prepare('SELECT count(*) AS n FROM data_initialization_acceptance').get().n,scoringDatasetBindings:db.prepare('SELECT count(*) AS n FROM scoring_dataset_binding').get().n};db.close();
const names=['VN30 master/source và ngày hiệu lực','Universe đủ mã, không trùng','Sector mapping đầy đủ','Market data bắt buộc','Fundamentals bắt buộc','Kiểm định kỳ báo cáo, đơn vị và chuẩn hóa','Missing-data checks','Freshness checks','Conflict/impossible-value checks','Derived metric lineage','Point-in-time controls','Snapshot ID tái lập được','Readiness từng mã được xác định','Independent data-quality review','Không còn Critical/Major chưa giải quyết'];
const payload={contract:'independent-di-acceptance-v1',id:'di-acceptance-vn30-20261029-draft-r1',snapshotRunId:null,contentHash:null,manifestDigest:null,requirements:null,requirementsHash:null,scoringMethodologyHash:snapshotHash(bundle.methodology),universeHash:null,acceptedAt:null,producerReference:null,reviewerReference:null,reviewArtifactReference:null,approvalReference:null,methodologyId:null,gates:names.map((_,i)=>({gate:'DI'+(i+1),status:null,evidenceReference:null})),issues:[],tickers:members.map(m=>({securityId:m.securityId,input:null,bridge:null}))};
const draft={draftContract:'scoring-dataset-acceptance-preparation-v1',status:'DRAFT_NOT_APPROVED',productionAdmissible:false,scoringAuthorized:false,createdAt:new Date().toISOString(),dateTimezone:'Asia/Ho_Chi_Minh',targetContract:payload.contract,
 references:{specification:'docs/08_CONTINUOUS_IMPROVEMENT/DATA_INITIALIZATION.md#28-initialization-gates',runtimeContract:'src/domain/fundamentals/scoring-readiness.ts#DataInitializationAcceptance',governanceEnforcement:'src/infrastructure/repositories/scoring-datasets.ts',currentScoringAuthority:pin(authority.authorityBundle.path),universeCatalog:pin(releasePath)},
 currentObservation:{...observed,note:'Counts are observations, not approval. Retained Level1 partition is a catalog seed; it does not prove formal AS_KNOWN snapshot readiness.'},
 currentApprovedScoringMethodology:bundle.methodology,
 formalPayload:payload,
 gateReview:names.map((description,i)=>({gate:'DI'+(i+1),description,status:'NOT_EXECUTED',expected:null,actual:null,evidenceReference:null,reviewerReference:null})),
 readinessRequirementsDraft:{version:null,algorithm:'strict-canonical-m3-readiness-v2',governanceStatus:null,approvalReference:null,methodologyId:null,recordedAt:null,effectiveDate:null,authorityReferences:[],flowTechnical:'NOT_APPLICABLE_PERMANENT_M3',sectors:[],note:'Separate approved native readiness policy required. Do not substitute manual-evidence-requirements JSON: it is a different contract. Each route needs sector, requiredItems, requiredMetrics, requiredMarketObservations and requiredValuationObservations.'},
 tickerReviewCatalog:members.map(m=>({ticker:m.ticker,securityId:m.securityId,retainedLevel1State:m.state,reviewStatus:'NOT_REVIEWED',readyForScoring:false,note:'input/bridge remain null until reviewed. Deferred members stay in universe and must not receive fabricated scores.'})),
 unresolvedPreparationItems:[{id:'P-SNAPSHOT',severity:'MAJOR',status:'OPEN',detail:'Bind exact FORMAL / AS_KNOWN snapshot run, content hash, manifest digest and universe hash.'},{id:'P-REQUIREMENTS',severity:'MAJOR',status:'OPEN',detail:'Supply approved native readiness-v2 requirements, sector routes and registered policy binding.'},{id:'P-INPUTS',severity:'MAJOR',status:'OPEN',detail:'Review per-ticker ScoreInput and ScoringBridgePlan for every ticker proposed for scoring; retain blocked/deferred tickers explicitly.'},{id:'P-GATES',severity:'MAJOR',status:'OPEN',detail:'Execute and record expected-versus-actual evidence for DI1–DI15; do not infer gate PASS from generic technical tests.'},{id:'P-REVIEW',severity:'MAJOR',status:'OPEN',detail:'Identify producer and distinct independent reviewer, review artifact and exact approval.'},{id:'P-BINDING',severity:'MAJOR',status:'OPEN',detail:'Create externally configured IndependentDIReviewBinding for the final acceptance hash and register exact acceptance/policy methodologies.'}],
 completionRules:['This envelope and readinessRequirementsDraft are preparation documents, not valid runtime acceptance.','null means missing, not zero or PASS. formalPayload.issues carries unresolved preparation blockers; reconcile them with the real DI issue register and evidence-backed resolutions before export.','Copy finalized fields to a standalone payload with only target-contract keys; no draft-only fields.','Set acceptedAt and approval references only after a real approval event. Do not copy scoring-executable approval as dataset approval.','Producer and reviewer references must differ; software string inequality alone does not establish independent review authenticity.','All15gates must be evidenced PASS; unresolved Critical/Major issues must have real resolution references.','Compute hashes using runtime canonicalization; manifestDigest hashes exact manifest text. Do not hash these null placeholders.','Compute full finalized acceptance hash only after payload completion. An external trusted review binding and registered governance records are also required; JSON alone cannot authorize scoring.','Do not import synthetic test acceptance, forge evidence or write acceptance rows to remove blockers.']};
payload.issues=draft.unresolvedPreparationItems.map(item=>({id:item.id,severity:item.severity,resolutionReference:null}));
const source=ts.createSourceFile('readiness.ts',readFileSync('src/domain/fundamentals/scoring-readiness.ts','utf8'),ts.ScriptTarget.Latest,true);
let interfaceFields;
function inspect(node){if(ts.isInterfaceDeclaration(node)&&node.name.text==='DataInitializationAcceptance')interfaceFields=node.members.filter(ts.isPropertySignature).map(m=>m.name.getText(source)).sort();ts.forEachChild(node,inspect);}
inspect(source);
if(JSON.stringify(interfaceFields)!==JSON.stringify(Object.keys(payload).sort()))throw Error('RUNTIME_CONTRACT_FIELDS_DRIFT');
writeFileSync(target,JSON.stringify(draft,null,2)+'\n');
let rejection;
try{validateDIAcceptance(payload);}catch(e){rejection=e.constructor.name;}
if(!rejection)throw Error('INCOMPLETE_DRAFT_UNEXPECTEDLY_ACCEPTED');
const after=hashDB();if(before!==after)throw Error('UNEXPECTED_DB_CHANGE');
writeFileSync(out+'/validation.json',JSON.stringify({status:'PASS_DRAFT_PREPARATION_ONLY',jsonParse:'PASS',runtimeContractFieldNames:'MATCHED_TO_DECLARED_INTERFACE',universeMembers:members.length,gateRows:payload.gates.length,draftIntentionallyRejectedByRuntime:rejection,databaseUnchanged:true,formalAcceptanceGranted:false,sourcePins:[pin('src/domain/fundamentals/scoring-readiness.ts'),pin('src/infrastructure/repositories/scoring-datasets.ts')]},null,2)+'\n');
console.log(JSON.stringify({draft:target,status:draft.status,tickers:members.length,formalAccepted:false,databaseUnchanged:true}));
