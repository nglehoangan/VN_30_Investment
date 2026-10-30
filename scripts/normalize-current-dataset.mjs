/** Freeze retained data for review. Never grants admission or mutates the live DB. */
import './lib/ts-runtime.mjs';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync,realpathSync} from 'node:fs';
import {resolve,sep} from 'node:path';
import {createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {gzipSync} from 'node:zlib';
const {canonicalJson}=await import('../src/domain/fundamentals/snapshot.ts');
const {latestDirectMarketPrices}=await import('../src/infrastructure/repositories/direct-market-prices.ts');
const {localSession}=await import('../src/shared/market-display-session.mjs');
const root=realpathSync(process.cwd());
const out=process.argv[2]??'docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-29/normalized-r1';
assert(resolve(out).startsWith(root+sep),'OUTPUT_OUTSIDE_REPOSITORY');
assert(!existsSync(out),'OUTPUT_EXISTS_USE_NEW_REVISION');
const sha=b=>createHash('sha256').update(b).digest('hex');
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const pin=path=>{assert(realpathSync(path).startsWith(root+sep),'SOURCE_OUTSIDE_REPOSITORY');return {path,sha256:sha(readFileSync(path))};};
const at=new Date().toISOString(),dbBefore=pin('data/vn30.sqlite');
const db=new DatabaseSync('data/vn30.sqlite',{readOnly:true});
const artifacts=[],sources=new Map(),issues=[];
function source(path,expected){const p=pin(path);if(expected)assert.equal(p.sha256,expected,path);sources.set(path,p);return p;}
function issue(code,ticker,detail,count=1){issues.push({id:`${ticker??'DATASET'}:${code}`,code,ticker,severity:'MAJOR',status:'OPEN',count,detail});}
function write(name,value){const compressed=name.startsWith('fundamentals/');const path=out+'/'+name+(compressed?'.gz':'');mkdirSync(resolve(path,'..'),{recursive:true});const body=JSON.stringify(value, null,compressed?0:2)+'\n';writeFileSync(path,compressed?gzipSync(body):body);artifacts.push(pin(path));}
const catalogPath='docs/fundamental-data-engine/evidence/2026-10-19-level1-promotion-partition-closure/RELEASE.json';
source(catalogPath);const members=read(catalogPath).partition.members;
assert.equal(members.length,30);assert.equal(new Set(members.map(m=>m.securityId)).size,30);assert.equal(new Set(members.map(m=>m.ticker)).size,30);
source('data/combine/manifest.json');const combined=read('data/combine/manifest.json');
for(const path of ['data/manual-download/manifest.json','data/manual-extracted-pdf/display-manifest.json','data/manual-extracted-api/manifest.json','data/manual-extracted-api/requests.json'])source(path);
assert.deepEqual(combined.files.map(f=>f.ticker).sort(),members.map(m=>m.ticker).sort());
const counts={presentationRows:0,numericRows:0,nullRows:0,variants:0,retainedCanonicalFacts:0};
const summaries=[];
const pointer=s=>s.replace(/~/g,'~0').replace(/\//g,'~1');
const decimal=/^-?\d+(?:\.\d+)?$/;
try{
 assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check,'ok');
 assert.equal(db.prepare('PRAGMA foreign_key_check').all().length,0);
 for(const member of members){
  const entry=combined.files.find(f=>f.ticker===member.ticker),path=entry.path;
  source(path,entry.sha256);const payload=read(path);assert.equal(payload.ticker,member.ticker);assert.equal(payload.productionAdmissible,false);
  const rows=[],unknown={scope:0,unit:0,review:0};let variantCount=0;
  for(const [reportKey,report] of Object.entries(payload.reports))for(const [periodKey,period] of Object.entries(report.periods)){
   const variantIds=new Set();
   for(const [vi,variant] of period.variants.entries()){
    assert(!variantIds.has(variant.id),'DUPLICATE_VARIANT');variantIds.add(variant.id);variantCount++;
    for(const [gi,group] of variant.groups.entries())for(const [ri,row] of group.rows.entries()){
     assert(row.value===null||typeof row.value==='string'&&decimal.test(row.value),'NON_LOSSLESS_VALUE');
     const locator=`/reports/${pointer(reportKey)}/periods/${pointer(periodKey)}/variants/${vi}/groups/${gi}/rows/${ri}`;
     const scope=row.reportingScope??variant.reportingScope??null;
     const dimensions={reportKey,periodKey,periodType:variant.periodType??period.periodType??null,year:variant.year??period.year??null,quarter:variant.quarter??period.quarter??null,asOf:variant.asOf??period.asOf??null,reportingScope:scope,unit:row.unit??null,currency:row.currency??null,scale:row.scale??null};
     if(!['CONSOLIDATED','SEPARATE_STANDALONE'].includes(scope))unknown.scope++;
     if(!dimensions.unit||!dimensions.scale)unknown.unit++;
     if(row.needsReview!==false||row.comparisonDimensionsVerified!==true)unknown.review++;
     rows.push({id:sha(path+'#'+locator),securityId:member.securityId,ticker:member.ticker,variantId:variant.id,sourcePointer:locator,dimensions,original:row});
     counts[row.value===null?'nullRows':'numericRows']++;
    }
   }
  }
  assert.equal(new Set(rows.map(r=>r.id)).size,rows.length);assert(rows.length>0);
  const admissions=db.prepare('SELECT id,body,body_hash AS bodyHash,content_hash AS contentHash FROM fundamental_admission_run WHERE json_extract(body,\'$.canonicalFacts[0].ticker\')=? ORDER BY id').all(member.ticker);
  const retainedAdmissions=[];
  for(const record of admissions){
   assert.equal(sha(record.body),record.bodyHash);const body=JSON.parse(record.body);
   const {contentHash,...content}=body;assert.equal(contentHash,record.contentHash);assert.equal(sha(canonicalJson(content)),contentHash);
   assert.equal(body.readyForScoring,false);
   assert(body.canonicalFacts.every(f=>f.ticker===member.ticker&&typeof f.value==='string'&&decimal.test(f.value)));
   const missingPublication=body.canonicalFacts.filter(f=>!f.publishedAt||f.historicalPitEligible!==true).length;
   if(missingPublication)issue('RETAINED_FACT_PIT_UNQUALIFIED',member.ticker,'Retained canonical facts lack historical publication/PIT qualification; receipt time is not publication time.',missingPublication);
   counts.retainedCanonicalFacts+=body.canonicalFacts.length;
   retainedAdmissions.push({id:record.id,bodyHash:record.bodyHash,original:body});
  }
  if(!admissions.length)issue('RETAINED_ADMISSION_MISSING',member.ticker,'No retained admission result found.');
  for(const [key,count] of Object.entries(unknown))if(count)issue('PRESENTATION_'+key.toUpperCase()+'_REQUIRED',member.ticker,'Presentation dimensions and source readings require accounting review; no guessed normalization.',count);
  if(member.state==='DEFERRED')issue('UNIVERSE_MEMBER_DEFERRED',member.ticker,'Retained partition explicitly defers this member.');
  counts.presentationRows+=rows.length;counts.variants+=variantCount;
  write(`fundamentals/${member.ticker}.json`,{contract:'retained-normalized-review-v1',classification:'REVIEW_CANDIDATE',productionAdmissible:false,scoringAuthorized:false,observedAt:at,source:pin(path),member,rows,retainedAdmissions});
  summaries.push({ticker:member.ticker,securityId:member.securityId,rows:rows.length,variants:variantCount,admissionRuns:admissions.length,unknown,readyForScoring:false});
 }
 // Exercise the actual reader against a read-only SQLite connection, including raw API lineage.
 const adapter={brokerObservation:{findUnique:async({where})=>db.prepare('SELECT body,body_hash AS bodyHash FROM broker_observation WHERE id=?').get(where.id)},$queryRaw:async(_strings,ticker)=>db.prepare("SELECT id,body,body_hash AS bodyHash,received_at AS receivedAt FROM broker_observation WHERE kind='TCBS_MARKET_PRICE' AND api_id=? ORDER BY CASE WHEN json_extract(body,'$.schemaVersion')='tcbs-display-price-v2' THEN 1 ELSE 0 END DESC,COALESCE(json_extract(body,'$.selectedAt'),received_at) DESC,id ASC LIMIT 1").all(ticker)};
 const prices=await latestDirectMarketPrices(adapter,members.map(m=>m.ticker),at),session=localSession(at);
 const market=members.map(m=>{
  const [record]=db.prepare("SELECT id,body,body_hash AS bodyHash FROM broker_observation WHERE kind='TCBS_MARKET_PRICE' AND api_id=? ORDER BY CASE WHEN json_extract(body,'$.schemaVersion')='tcbs-display-price-v2' THEN 1 ELSE 0 END DESC,COALESCE(json_extract(body,'$.selectedAt'),received_at) DESC,id ASC LIMIT 1").all(m.ticker);
  if(!record){issue('MARKET_PRICE_MISSING',m.ticker,'No persisted display price.');return {ticker:m.ticker,securityId:m.securityId,price:null};}
  const p=JSON.parse(record.body);assert(prices.some(q=>q.ticker===m.ticker));
  const expectedDate=session.inSession?session.date:session.expectedCloseDate;
  const currentSelection=p.sessionDate===session.date&&p.selectionMode===(session.inSession?'IN_SESSION':'OUTSIDE_SESSION')&&p.tradingDate===expectedDate&&(session.inSession?p.field==='MATCH_PRICE':p.field==='DAILY_BAR_CLOSE_REFERENCE');
  if(!currentSelection)issue('MARKET_SELECTION_NOT_CURRENT',m.ticker,`Stored ${p.field} for ${p.tradingDate} (${p.selectionMode}); current session requires ${session.inSession?'MATCH_PRICE':'DAILY_BAR_CLOSE_REFERENCE'} for ${expectedDate}.`);
  return {ticker:m.ticker,securityId:m.securityId,observationId:record.id,bodyHash:record.bodyHash,price:p,currentSelection,quoteAgeSeconds:Math.max(0,Math.floor((Date.parse(at)-Date.parse(p.receivedAt))/1000)),productionAdmissible:false};
 });
 issue('MARKET_QUALIFICATION_PENDING',null,'Display lineage passes do not establish accepted market capability, corporate-action basis or purpose-specific freshness.');
 const tables=['fundamental_observation','fundamental_availability_assessment','fundamental_derivation','fundamental_snapshot_run','data_initialization_acceptance','scoring_dataset_binding'];
 const nativeInventory=Object.fromEntries(tables.map(t=>[t,db.prepare(`SELECT count(*) AS n FROM ${t}`).get().n]));
 issue('NATIVE_SNAPSHOT_PIPELINE_EMPTY',null,JSON.stringify(nativeInventory));
 issue('READINESS_POLICY_AND_INPUT_BRIDGE_PENDING',null,'Approved native sector requirements and per-ticker reviewed ScoreInput/ScoringBridgePlan are not supplied by retained presentation data.');
 issue('INDEPENDENT_REVIEW_PENDING',null,'DI14 independent review and exact dataset approval/binding remain outstanding.');
 write('market.json',{contract:'retained-market-review-v1',observedAt:at,currentSession:session,productionAdmissible:false,scoringAuthorized:false,validatedPrices:prices.length,members:market});
 write('issues.json',{status:'BLOCKED_FOR_FORMAL_SCORING',issues});
 write('validation.json',{status:'PASS_TECHNICAL_NORMALIZATION_WITH_OPEN_ADMISSION_BLOCKERS',observedAt:at,checks:{universeUnique30:true,allVariantsPreserved:true,losslessDecimalStrings:true,zeroNullDistinct:true,occurrenceAwareIdentity:true,admissionBodyAndContentHashes:true,actualMarketReaderRawLineage:true,databaseIntegrity:true,foreignKeys:true},counts,nativeInventory,tickers:summaries,market:{validated:prices.length,currentSelectionCount:market.filter(m=>m.currentSelection).length},formalScoringAuthorized:false});
}finally{db.close();}
assert.equal(pin('data/vn30.sqlite').sha256,dbBefore.sha256,'DATABASE_CHANGED_DURING_RUN');
for(const s of sources.values())assert.equal(pin(s.path).sha256,s.sha256,'SOURCE_CHANGED_DURING_RUN');
write('manifest.json',{contract:'retained-normalized-dataset-manifest-v1',observedAt:at,classification:'REVIEW_CANDIDATE',productionAdmissible:false,scoringAuthorized:false,databaseUnchanged:true,database:dbBefore,sourcePins:[...sources.values()],implementation:pin('scripts/normalize-current-dataset.mjs'),artifacts:[...artifacts]});
console.log(JSON.stringify({output:out,counts,issues:issues.length,databaseUnchanged:true,scoringAuthorized:false}));
