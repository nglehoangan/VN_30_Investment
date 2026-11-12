import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { buildCafefCandidate, implementationPins, bytesHash, checkProfile, type StandingProfile, type StandingTrust } from '@/infrastructure/market-boundary/cafef-standing';
import { exactJson } from '@/infrastructure/market-boundary/exact-json';
import { snapshotHash } from '@/infrastructure/fundamentals/snapshot-hash';
import { loadDatabaseConfig } from '@/infrastructure/config/database';
import { openDatabase } from '@/infrastructure/db/client';
import { PrismaBoundaryStore } from '@/infrastructure/repositories/market-boundary';
/** Every source, membership extension and acceptance in this fixture is SYNTHETIC.
 * No production DB, registry or real pilot acceptance is touched. */
export async function cafefFixture() {
 const root=mkdtempSync(join(tmpdir(),'cafef-standing-test-'));
 const write=(path:string,value:string)=>{mkdirSync(dirname(resolve(root,path)),{recursive:true});writeFileSync(resolve(root,path),value);return {path,sha256:bytesHash(value)};};
 const original=JSON.parse(readFileSync('docs/fundamental-data-engine/cafef-standing-source/2026-11-12/PROFILE_INPUT.json','utf8')) as StandingProfile;
 for(const p of implementationPins(process.cwd())){mkdirSync(dirname(resolve(root,p.path)),{recursive:true});copyFileSync(p.path,resolve(root,p.path));}
 const auth=JSON.parse(readFileSync(original.authorization.path,'utf8'));
 for(const path of [original.authorization.path,auth.source.path]){mkdirSync(dirname(resolve(root,path)),{recursive:true});copyFileSync(path,resolve(root,path));}
 const at=original.knownAt,memberList=original.membership.members;
 const membership=write('synthetic-membership.json',JSON.stringify({origin:'SYNTHETIC_TEST',status:'CERTIFIED',historyComplete:true,effectiveDate:'2026-08-03',asOf:'2026-10-30',composition:memberList.map(m=>m.ticker),originalPDF:{sha256:'3'.repeat(64)}}));
 const identity=write('synthetic-identities.json',JSON.stringify({origin:'SYNTHETIC_TEST',asOf:'2026-10-30',effectiveMembers:memberList.map(m=>({...m,evidenceHash:'3'.repeat(64)}))}));
 const unit=write('synthetic-unit.txt','SYNTHETIC_TEST provider header: Giá (nghìn VNĐ)');
 const unitReceipt=write('synthetic-unit-receipt.json',JSON.stringify({provider:'CAFEF',httpStatus:200,path:unit.path,sha256:unit.sha256,url:'https://cafef.vn/du-lieu/synthetic',receivedAt:'2026-11-11T00:00:00.000000+00:00'}));
 const calSource=write('synthetic-calendar.txt','SYNTHETIC_TEST calendar fixture; never actual exchange authority');
 const profile:StandingProfile={...original,membership:{...membership,identitySource:identity,from:'2026-08-03',through:'2026-10-30',knownAt:at,members:memberList},unitSource:unit,unitReceipt,calendarSources:[calSource],calendar:{...original.calendar,evidence:{id:'synthetic-hose-calendar',hash:snapshotHash([calSource]),knownAt:at,effectiveAt:at}},code:implementationPins(root)};
 const captured=new Map<string,{rawHash:string;requestHash:string;collectorHash:string;origin:'TRUSTED_CAPTURE_HANDOFF'}>();
 const raw=(ticker='VNM',dates=['2026-10-30'],patch:Record<string,unknown>={},closeOverride?:number,adjustedOverride?:number)=>{
  const params={ExchangeType:'HOSE',Symbol:ticker,StartDate:'01/01/2026',EndDate:'10/30/2026',PageIndex:1,PageSize:30};
  const url='https://cafef.vn/du-lieu/Ajax/PageNew/DataHistory/PriceHistory.ashx?'+new URLSearchParams(Object.entries(params).map(([k,v])=>[k,String(v)])).toString();
  const receivedAt='2026-11-11T00:00:00.000123+00:00';
  const rows=dates.map(date=>({Symbol:ticker,Ngay:date.slice(8)+'/'+date.slice(5,7)+'/'+date.slice(0,4),GiaDongCua:closeOverride??(ticker==='VNM'?56.9:100.125),GiaDieuChinh:adjustedOverride??1}));
  const body=JSON.stringify({Data:{Data:rows}}),sha256=bytesHash(body);
  const pin=write('raw/'+ticker+'.json',JSON.stringify({schemaVersion:1,provider:'CAFEF',symbol:ticker,exchange:'HOSE',units:null,prices:dates.map((date,i)=>({date,raw:rows[i],sourceUrl:url,receivedAt,responseSha256:sha256})),requests:[{url,parameters:params,receivedAt,httpStatus:200,sha256,rawResponse:body}],...patch}));
  const parsed=exactJson(readFileSync(resolve(root,pin.path),'utf8')) as {requests:unknown[]};
  const requestHash=snapshotHash(parsed.requests[0]);captured.set(pin.sha256+':'+requestHash,{rawHash:pin.sha256,requestHash,collectorHash:profile.code.find(p=>p.path==='skills/fetch-cafef-price-history/scripts/fetch.py')!.sha256,origin:'TRUSTED_CAPTURE_HANDOFF'});return pin;
 };
 const make=(ticker='VNM',date='2026-10-30',rawPin=raw(ticker,[date]),knownAt=at)=>buildCafefCandidate(root,profile,{raw:rawPin,ticker,exchange:'HOSE',date,knownAt});
 const material=checkProfile(root,profile),approval=write('synthetic-independent-review.json',JSON.stringify({origin:'SYNTHETIC_TEST_NOT_REAL_ACCEPTANCE',decision:'ACCEPTED',materialHash:material,knownAt:at,reviewer:'SYNTHETIC_FIXTURE_REVIEWER',superseded:false}));
 let active=true,accepted=true;
 const trust:StandingTrust={capturedSource:(raw,requestHash)=>captured.get(raw.sha256+':'+requestHash)??null,currentAuthorization:()=>active?profile.authorization:null,independentMaterialAcceptance:hash=>accepted&&hash===material?{materialHash:material,knownAt:at,reference:approval}:null};
 const config=loadDatabaseConfig({DATABASE_URL:'file:'+join(root,'test.sqlite')},process.cwd());
 const db=await openDatabase(config);
 for(const path of ['prisma/migrations/202610190002_market_boundary/migration.sql','prisma/migrations/202611120001_market_ingest/migration.sql']){
  const sql=readFileSync(path,'utf8');const statements=sql.match(/CREATE TRIGGER[\s\S]*?END;|CREATE (?:TABLE|UNIQUE INDEX|INDEX)[\s\S]*?;/g)!;
  for(const statement of statements)await db.$executeRawUnsafe(statement);
 }
 const repo=new PrismaBoundaryStore(db);
 return {root,profile,at,material,trust,db,repo,write,raw,make,
  suspend:()=>{active=false;},unapprove:()=>{accepted=false;},
  async close(){await db.$disconnect();rmSync(root,{recursive:true,force:true});}};
}
