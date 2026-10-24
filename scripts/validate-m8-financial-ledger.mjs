/** Actual portfolio safety regression. No posting, projection writes or migrations. */
import {DatabaseSync} from 'node:sqlite';import assert from 'node:assert/strict';import {writeFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {loadDatabaseConfig} from '../src/infrastructure/config/database.ts';import {openDatabase} from '../src/infrastructure/db/client.ts';
import {PrismaPortfolioLedger} from '../src/infrastructure/repositories/portfolio-ledger.ts';import {PortfolioEngine} from '../src/application/portfolio/engine.ts';import {portfolioId} from '../src/domain/portfolio/values.ts';import {buildTransaction} from '../src/domain/portfolio/transaction.ts';import {instant} from '../src/shared/time.ts';
const root=process.cwd(),file=root+'/data/vn30.sqlite',db=new DatabaseSync(file,{readOnly:true});const client=await openDatabase(loadDatabaseConfig({DATABASE_URL:'file:'+file},root));const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
try{
 const rows=db.prepare("SELECT * FROM ledger_transaction WHERE status='POSTED'").all(),saved=rows.map(r=>JSON.parse(r.facts));
 assert.equal(rows.length,12);let legCount=0;
 for(const [i,row] of rows.entries()){
  const t=saved[i],rebuilt=buildTransaction(t.facts,instant(row.created_at),saved.filter(s=>s.facts.id!==row.id));assert.equal(JSON.stringify(rebuilt),JSON.stringify(t));
  const legs=db.prepare('SELECT * FROM ledger_leg WHERE transaction_id=? ORDER BY sequence').all(row.id).map(l=>({id:l.id,sequence:l.sequence,type:l.type,effectiveAt:l.effective_at,securityId:l.security_id,quantity:l.quantity,amount:l.amount,settlementReference:l.settlement_reference}));assert.equal(JSON.stringify(rebuilt.legs),JSON.stringify(legs));legCount+=legs.length;
 }
 const portfolios=db.prepare('SELECT * FROM portfolio').all();assert.equal(portfolios.length,1);
 const ledger=new PrismaPortfolioLedger(client),id=portfolioId(portfolios[0].id);const read=await ledger.read(id),state=await new PortfolioEngine(ledger,{now:()=>new Date().toISOString()}).reconstruct(id,new Date().toISOString());
 const projection=JSON.parse(db.prepare('SELECT payload FROM portfolio_projection WHERE portfolio_id=?').get(id).payload);
 const fields=s=>({cash:s.cash,receivables:s.receivables,payables:s.payables,positions:s.positions,realizedPnl:s.realizedPnl,netDividends:s.netDividends,netContributions:s.netContributions});assert.deepEqual(fields(state),fields(projection));assert.equal(state.positions.length,11);assert.equal(read.transactions.length,12);assert.equal(legCount,24);
 const result={classification:'ACTUAL_SQLITE_PRISMA_AND_DOMAIN_NO_FIXTURES',status:'PASS',transactionsReplayedExactly:12,originalLegsReplayedExactly:24,holdings:11,cashReceivablesHoldingsAndCostMatchOriginalProjection:true,stateHash:hash(fields(state)),originalSavedAggregatesHash:hash(saved),databaseIntegrity:db.prepare('PRAGMA integrity_check').get(),foreignKeyViolations:db.prepare('PRAGMA foreign_key_check').all().length,operations:['SELECT','authoritative ledger read','domain reconstruction'],mutations:0};
 writeFileSync('docs/fundamental-data-engine/evidence/2026-10-24-m8-financial-current-layout-adapter/LEDGER_REPLAY_RESULTS.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
}finally{await client.$disconnect();db.close();}
