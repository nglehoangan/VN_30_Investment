// Explicit retained-evidence workbench; never installs a real independent acceptance or activates production.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { canonical, root, loadProjectModule, run } from '../skills/vn30-market-price-corporate-actions/scripts/runtime.mjs';
const {buildCafefCandidate,createCafefAdapter,implementationPins,checkProfile,assertStandingTrust}=await loadProjectModule('src/infrastructure/market-boundary/cafef-standing.ts');
const {snapshotHash}=await loadProjectModule('src/infrastructure/fundamentals/snapshot-hash.ts');
const args=process.argv.slice(2);
if(args.length!==2||args[0]!=='--package')throw Error('Usage: node scripts/cafef-standing.mjs --package <existing-private-work-package>');
const dir=resolve(args[1]);
if(dir.startsWith(resolve(root,'data')+'/')||dir===resolve(root,'data'))throw Error('WORKBENCH_MUST_NOT_WRITE_PRODUCTION_DATA');
const pin=path=>({path,sha256:createHash('sha256').update(readFileSync(resolve(root,path))).digest('hex')});
const profile=JSON.parse(readFileSync(resolve(dir,'PROFILE_INPUT.json'),'utf8'));
profile.code=implementationPins(root);
profile.calendar.evidence={id:'hose-calendar-2026-v1',hash:snapshotHash(profile.calendarSources),knownAt:profile.knownAt,effectiveAt:profile.knownAt};
const materialHash=checkProfile(root,profile);
writeFileSync(resolve(dir,'MATERIAL_REVIEW_PROPOSAL.json'),canonical({status:'PROPOSED_NOT_INDEPENDENTLY_ACCEPTED',materialHash,profile,requiredAcceptance:'Independent reviewer acceptance of these exact material pins; owner principle is not code acceptance.'}));
const emptyTrust={currentAuthorization:()=>profile.authorization,independentMaterialAcceptance:()=>null,capturedSource:()=>null};
const source='data/market-history/cafef/VNM.json',raw=pin(source),collection=JSON.parse(readFileSync(resolve(root,source),'utf8'));
const counts={},examples={},normalized=[],quarantine=[];
for(const record of collection.prices){
 let reason;
 if(record.date<profile.membership.from||record.date>profile.membership.through)reason='VN30_MEMBERSHIP_OUTSIDE_VERIFIED_INTERVAL';
 else try {
  const c=buildCafefCandidate(root,profile,{raw,ticker:'VNM',exchange:'HOSE',date:record.date,knownAt:profile.knownAt});
  const rows=createCafefAdapter(profile,c.spec).normalize(Buffer.from(c.rawText),c.market.body.sources[0]);
  if(snapshotHash(rows)!==c.capability.body.normalizedSampleHash)throw Error('REPLAY_MISMATCH');
  let admissionReason;try{assertStandingTrust(root,c,emptyTrust);}catch(error){admissionReason=String(error);}
  normalized.push({date:record.date,nativeRawClose:String(record.raw.GiaDongCua),rawField:'GiaDongCua',multiplier:'1000',rawPointer:c.market.body.observations[0].pointer,value:c.market.body.observations[0].value,unit:'VND_PER_SHARE',marketHash:c.market.contentHash,capabilityHash:c.capability.contentHash,rawHash:raw.sha256,responseHash:c.provenance.responseSha256,originalReceipt:c.provenance.originalReceivedAt,availableAt:c.provenance.canonicalAvailability,knownAt:c.spec.knownAt,materialHash,replay:'PASS',accepted:false,admissionReason});
 }catch(error){reason=String(error);}
 if(reason){counts[reason]=(counts[reason]??0)+1;examples[reason]??=record.date;quarantine.push({date:record.date,reason});}
}
const migration={status:'PARTIAL',mode:'DRY_RUN_NO_ACTIVE_DB_WRITES',source:raw,policyVersion:'cafef-vn30-standing-raw-close-v1',materialHash,retainedRows:collection.prices.length,retainedRequests:collection.requests.length,retainedDateRange:{from:collection.prices[0].date,through:collection.prices.at(-1).date},normalizedEligible:normalized.length,acceptedCommitted:0,quarantined:quarantine.length,quarantineReasons:counts,firstExampleByReason:examples,normalized,quarantine,originalUnits:collection.units,independentCodeAcceptance:'MISSING',activeDatabaseChanged:false,historicalPITGranted:false};
writeFileSync(resolve(dir,'MARKET_MIGRATION_REPORT.json'),canonical(migration));
const priorVnmSkill=await run(JSON.parse(readFileSync(resolve(root,'docs/fundamental-data-engine/vnm-s4-reusable-skill/2026-11-12/VNM_INPUT.json'),'utf8')));
if(priorVnmSkill.price.value!=='56900'||priorVnmSkill.actions.length!==15||priorVnmSkill.shares.shares!=='2089955445')throw Error('VNM_REFERENCE_REGRESSION');
const pilots=[];
for(const ticker of ['VNM','FPT','HPG','VCB']){
 const member=profile.membership.members.find(m=>m.ticker===ticker),path=`data/market-history/cafef/${ticker}.json`;
 const entry={ticker,memberInRetainedCertifiedComposition:!!member,membershipVerifiedInterval:{from:profile.membership.from,through:profile.membership.through},requestedCutoff:'2026-10-30',cutoffMembershipQualified:false,retainedPricePath:path,realRetainedCafefEvidenceAvailable:existsSync(resolve(root,path)),dividendShareQualification:'SEPARATE_NOT_INHERITED_FROM_VNM',F2:'OPEN',productionActivated:false};
 if(ticker==='VNM')Object.assign(entry,{status:'PARTIAL',realTransformReplayCount:normalized.length,acceptedCommitted:0,regressionCloseVndPerShare:priorVnmSkill.price.value,reusableSkillReplay:{status:'PASS',price:priorVnmSkill.price.value,reviewedCashComponents:priorVnmSkill.actions.length,shares:priorVnmSkill.shares.shares,ownerAdmission:priorVnmSkill.acceptance.ownerAdmission,formalAdmissionGranted:priorVnmSkill.acceptance.formalAdmissionGranted},limitation:'30Oct raw research close unchanged; dated membership history is verified only through16Oct. Independent code/calendar/identity/unit material acceptance remains absent.'});
 else Object.assign(entry,{status:'BLOCKED',acceptedCommitted:0,limitation:'No retained CafeF PriceHistory collection for this ticker. Retained TCBS quotes/profiles and CafeF financial-report APIs are different source contracts and are not substituted. No new financial/action/price history was fetched.'});
 pilots.push(entry);
}
writeFileSync(resolve(dir,'MULTI_TICKER_PILOT.json'),canonical({status:'PARTIAL',realAdditionalTickerPassed:false,syntheticNotRealAcceptance:true,syntheticValidationReference:'VALIDATION.json',checkedSourceInventories:['data/market-history/cafef/','data/market-source/ (other providers)','data/manual-extracted-api/requests.json (financial reports, not PriceHistory)'],pilots}));
console.log(canonical({materialHash,retained:collection.prices.length,normalizedEligible:normalized.length,quarantined:quarantine.length,accepted:0,extraRealTickerPassed:false}));
