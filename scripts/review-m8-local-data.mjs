/** Real retained SQLite/Prisma read and reconstruction; no posting/migration/projection writes. */
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import {writeFileSync,readFileSync,existsSync} from 'node:fs';
import {loadDatabaseConfig} from '../src/infrastructure/config/database.ts';
import {openDatabase} from '../src/infrastructure/db/client.ts';
import {PrismaPortfolioLedger} from '../src/infrastructure/repositories/portfolio-ledger.ts';
import {PortfolioEngine} from '../src/application/portfolio/engine.ts';
import {portfolioId} from '../src/domain/portfolio/values.ts';
const root=process.cwd(),file=root+'/data/vn30.sqlite';
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const db=new DatabaseSync(file,{readOnly:true});
const raw=db.prepare('SELECT id,revision FROM portfolio').all();
const before=db.prepare('SELECT count(*) as n FROM ledger_transaction').get().n;
const client=await openDatabase(loadDatabaseConfig({DATABASE_URL:'file:'+file},root));
const summaries=[];
try{
 for(const p of raw){
  try{
  const ledger=new PrismaPortfolioLedger(client);const read=await ledger.read(portfolioId(p.id));
  const now=new Date().toISOString();const state=await new PortfolioEngine(ledger,{now:()=>now}).reconstruct(portfolioId(p.id),now);
  const saved=db.prepare('SELECT payload,as_of,watermark FROM portfolio_projection WHERE portfolio_id=?').get(p.id);
  const projection=saved?JSON.parse(saved.payload):null;
  const select=s=>({cash:s.cash,receivables:s.receivables,payables:s.payables,positions:s.positions,realizedPnl:s.realizedPnl,netDividends:s.netDividends,netContributions:s.netContributions});
  summaries.push({portfolioIdentityHash:hash(p.id),revision:p.revision,transactionCount:read.transactions.length,transactionTypes:[...new Set(read.transactions.map(t=>t.facts.type))],supportedInception:state.supportedInception,supportedInceptionAt:state.supportedInceptionAt,asOf:state.asOf,positions:state.positions.length,nonzeroPositions:state.positions.filter(p=>p.quantity!=='0').length,cashPresent:typeof state.cash==='string',cashIsNegative:state.cash.startsWith('-'),allQuantityCostValuesAreDecimalStrings:state.positions.every(p=>typeof p.quantity==='string'&&typeof p.openCost==='string'),reconstructionHash:hash(select(state)),storedProjectionHash:projection?hash(select(projection)):null,storedProjectionMatchesCurrentReconstruction:projection?hash(select(projection))===hash(select(state)):null,storedProjectionAsOf:saved?.as_of,ledgerWatermarkMatchesProjection:saved?.watermark===state.ledgerWatermark,dividendLedgerEvents:read.transactions.filter(t=>t.facts.type.includes('DIVIDEND')).length,tradeLedgerEvents:read.transactions.filter(t=>['BUY','SELL','TRADE','TRADE_SETTLEMENT'].includes(t.facts.type)).length,dividendAmountsRepresentEvents:read.transactions.some(t=>t.facts.type.includes('DIVIDEND'))?'LEDGER_EVENTS_PRESENT':'NO_DIVIDEND_EVENTS_ZERO_TOTAL_IS_NOT_COMPLETE_DIVIDEND_HISTORY'});
 }catch(error){summaries.push({portfolioIdentityHash:hash(p.id),revision:p.revision,status:'BLOCKED',errorCode:error.code??error.name,errorMessage:error.message,prismaPortfolioQuerySucceeded:true});}
 }
 const manifests=['data/manual-download/manifest.json','data/manual-extracted-pdf/manifest.json','data/manual-extracted-api/manifest.json','data/combine/manifest.json','data/combine/verification.json'].map(path=>({path,sha256:createHash('sha256').update(readFileSync(path)).digest('hex')}));
 const api=JSON.parse(readFileSync('data/manual-extracted-api/manifest.json')),pdf=JSON.parse(readFileSync('data/manual-extracted-pdf/manifest.json')),combine=JSON.parse(readFileSync('data/combine/manifest.json'));
 const result={classification:'ACTUAL_LOCAL_SQLITE_PRISMA_AND_DOMAIN_READS_NOT_SYNTHETIC',database:file,prismaSelectOne:await client.$queryRawUnsafe('SELECT 1 AS ok'),prismaPortfolioCount:await client.portfolio.count(),sqliteIntegrity:db.prepare('PRAGMA integrity_check').get(),foreignKeyViolations:db.prepare('PRAGMA foreign_key_check').all().length,portfolioCount:raw.length,summaries,ledgerCountBefore:before,ledgerCountAfter:db.prepare('SELECT count(*) as n FROM ledger_transaction').get().n,fundamentalAvailability:{pdfPhysicalDocuments:pdf.physicalPdfCount,pdfUniqueDocuments:pdf.uniquePdfCount,apiRawCaptureCount:api.rawCaptureCount,apiSchemaQuarantineCount:api.failures.length,apiStatus:api.status,presentationCombinedProductionAdmissible:combine.productionAdmissible,legacyDashboardResearchSnapshotExists:existsSync('data/manual-current/current-analysis.json'),legacyManualPdfDirectoryExists:existsSync('data/manual-fundamentals'),currentCombinedDirectoryExists:existsSync('data/combine'),note:'Manifest inventory only; no new semantic/source-image validation or corpus regeneration.'},manifests,operationsPerformed:['Prisma connect and SELECT/readonly ledger transaction','Existing domain reconstruction attempted; blocked by authoritative ledger validation','SQLite readonly SELECT and integrity checks'],operationsNotPerformed:['post','projection rebuild','migrate','admit','accept','score','source acquisition']};
 writeFileSync('docs/fundamental-data-engine/evidence/2026-10-24-m8-local-application-readiness/ACTUAL_DATA_RECONSTRUCTION.json',JSON.stringify(result,(_k,v)=>typeof v==='bigint'?v.toString():v,2)+'\n');
 console.log(JSON.stringify({portfolioCount:raw.length,summaries,fundamentalAvailability:result.fundamentalAvailability},null,2));
}finally{await client.$disconnect();db.close();}
