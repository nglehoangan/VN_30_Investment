import {readFileSync,writeFileSync,existsSync,readdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {loadProjectModule,run as s4Run} from '../skills/vn30-market-price-corporate-actions/scripts/runtime.mjs';
const root=process.cwd(),dir='docs/fundamental-data-engine/unified-source-admission/2026-11-12';
const read=p=>JSON.parse(readFileSync(p,'utf8')),sha=b=>createHash('sha256').update(b).digest('hex'),pin=path=>({path,sha256:sha(readFileSync(path))});
const write=(p,v)=>writeFileSync(resolve(dir,p),JSON.stringify(v,null,2)+'\n');
const {UNIFIED_SOURCE_POLICY}=await loadProjectModule('src/domain/fundamentals/standing-source-policy.ts');
const {buildHybridAdmission}=await loadProjectModule('src/domain/fundamentals/hybrid-admission.ts');
const {snapshotHash:hash}=await loadProjectModule('src/infrastructure/fundamentals/snapshot-hash.ts');
const {financialCodePins,financialRequiredBindings}=await loadProjectModule('src/infrastructure/source-admission/financial.ts');
const {buildCafefCandidate,implementationPins}=await loadProjectModule('src/infrastructure/market-boundary/cafef-standing.ts');
const at=read(dir+'/SOURCE_POLICY_AUTHORIZATIONS.json').recordedAt;
write('POLICY.json',UNIFIED_SOURCE_POLICY);
const old='docs/fundamental-data-engine/cafef-standing-source/2026-11-12';
const profile=read(old+'/PROFILE_INPUT.json');profile.knownAt=at;profile.code=implementationPins(root);profile.calendar.evidence={id:'hose-calendar-2026-v1',hash:hash(profile.calendarSources),knownAt:profile.knownAt,effectiveAt:profile.knownAt};
const collection=read('data/market-history/cafef/VNM.json'),raw=pin('data/market-history/cafef/VNM.json');
const market={retained:collection.prices.length,normalized:[],quarantine:[],acceptedCommitted:0,mode:'DRY_RUN',policy:profile.policyFile,independentMaterialAcceptance:'NOT_PRESENT'};
for(const row of collection.prices){if(row.date<profile.membership.from||row.date>profile.membership.through){market.quarantine.push({date:row.date,reason:'VN30_MEMBERSHIP_OUTSIDE_VERIFIED_INTERVAL'});continue;}
 const c=buildCafefCandidate(root,profile,{raw,ticker:'VNM',exchange:'HOSE',date:row.date,knownAt:at});
 const replay=buildCafefCandidate(root,profile,c.spec);
 if(hash(c)!==hash(replay))throw Error('REAL_F1_REPLAY_FAILED');market.normalized.push({date:row.date,value:c.market.body.observations[0].value,rawHash:raw.sha256,materialHash:c.materialHash,replay:'PASS',accepted:false});}
const inputs={VNM:'docs/fundamental-data-engine/evidence/2026-10-15-consumer-targeted-fix/VNM/RETAINED_ADMISSION_INPUT.json',FPT:'docs/fundamental-data-engine/evidence/2026-10-15-ticker-closure-FPT/FPT_RETAINED_ADMISSION_INPUT.json',HPG:'docs/fundamental-data-engine/evidence/2026-10-16-di-governance-closure/HPG_RETAINED_ADMISSION_INPUT.json',VCB:'docs/fundamental-data-engine/evidence/2026-10-15-ticker-closure-VCB/VCB_RETAINED_ADMISSION_INPUT.json'};
const financial=[];
const requests=read('data/manual-extracted-api/requests.json');
function alternatives(ticker){
 const paths=new Set(requests.filter(r=>r.symbol===ticker&&r.rawPayloadLocation&&existsSync(r.rawPayloadLocation)).map(r=>r.rawPayloadLocation));
 const folder='data/manual-download/'+ticker;if(existsSync(folder))for(const name of readdirSync(folder))if(name.endsWith('.pdf'))paths.add(folder+'/'+name);
 const byHash=new Map();for(const path of paths){const h=sha(readFileSync(path));const list=byHash.get(h)??[];list.push(path);byHash.set(h,list.sort());}return byHash;
}

for(const [ticker,path] of Object.entries(inputs)){
 const input=read(path),alias=alternatives(ticker),pins=financialRequiredBindings(input).map(p=>({...p,status:!existsSync(p.path)?alias.has(p.sha256)?'RETAINED_SAME_HASH_ALTERNATIVE':'MISSING':sha(readFileSync(p.path))===p.sha256?'MATCH':'HASH_MISMATCH',retainedAlternatives:alias.get(p.sha256)??[]}));
 const before=buildHybridAdmission(input,hash),replay=buildHybridAdmission(input,hash);if(hash(before)!==hash(replay))throw Error('REAL_F2_REPLAY_FAILED');
 // This is original-time retained validator replay, not current-time admission. Do not rewrite historical receipts.
 financial.push({ticker,input:pin(path),originalAnalysisAt:input.analysisAt,originalSystemKnownAt:input.systemKnownAt,retainedCanonicalFacts:before.canonicalFacts.length,nonMandatoryHistoricalBindings:input.sourceBindings.length-pins.length,invalidVerificationIds:before.invalidVerificationIds,unresolvedIssuerConflicts:before.unresolvedIssuerConflicts,sourceBindings:pins,hashVerifiedSourceCount:pins.filter(p=>p.status==='MATCH'||p.status==='RETAINED_SAME_HASH_ALTERNATIVE').length,sameHashAliasCount:pins.filter(p=>p.status==='RETAINED_SAME_HASH_ALTERNATIVE').length,missingSourceCount:pins.filter(p=>p.status==='MISSING').length,changedSourceCount:pins.filter(p=>p.status==='HASH_MISMATCH').length,replay:'PASS',currentFormalAdmission:'NOT_GRANTED',acceptedCommitted:0,remainingRequirements:['Exact source bindings must be retained and hash-matching','Native raw-cell extraction/review lineage must match normalized facts','Independent acceptance of exact code/semantic material and trusted registry configuration'],dividendShares:'SEPARATE_S4_REVIEW_NOT_INHERITED'});
}
const regression=await s4Run(read('docs/fundamental-data-engine/vnm-s4-reusable-skill/2026-11-12/VNM_INPUT.json'));
const priorPilot=read(old+'/MULTI_TICKER_PILOT.json');
const pilot={status:'PARTIAL',realFinancialValidatorReplays:financial.map(f=>({ticker:f.ticker,replay:f.replay,canonicalFacts:f.retainedCanonicalFacts,sameHashAliasCount:f.sameHashAliasCount,missingSourceCount:f.missingSourceCount,changedSourceCount:f.changedSourceCount,acceptedCommitted:0})),marketPilots:priorPilot.pilots,vnmS4:regression.acceptance??regression.ACCEPTANCE??{status:'COMPLETED_EXISTING_OFFLINE_RUN',formalAdmissionGranted:false},noInheritedFactApprovals:true,syntheticFixtures:'tests/integration/unified-source-admission.test.ts',productionActivation:'NOT_AUTHORIZED'};
write('DATA_MIGRATION_REPORT.json',{status:'PARTIAL',knownAt:at,market,financial,activeDatabaseChanged:false,originalReceiptsRewritten:false,portfolioChanged:false});
write('MULTI_TICKER_PILOT.json',pilot);
write('MATERIAL_REVIEW_PROPOSAL.json',{status:'PROPOSED_NOT_INDEPENDENTLY_ACCEPTED',policy:pin(dir+'/POLICY.json'),authorization:pin(dir+'/SOURCE_POLICY_AUTHORIZATIONS.json'),financialCode:financialCodePins(root),financialInputs:financial.map(f=>f.input),marketMaterialHash:market.normalized[0]?.materialHash??null,ownerPrincipleIsNotCodeAcceptance:true});
console.log(JSON.stringify({marketRows:market.retained,marketReplay:market.normalized.length,financial:financial.map(f=>({ticker:f.ticker,facts:f.retainedCanonicalFacts,missing:f.missingSourceCount,changed:f.changedSourceCount})),acceptedCommitted:0}));
