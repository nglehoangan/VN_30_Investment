import {expect} from 'vitest';
import {DatabaseSync} from 'node:sqlite';
import type {testDatabase} from './database';
export interface SchemaObject {name:string;type:string;sql:string}
type TestDatabase=Awaited<ReturnType<typeof testDatabase>>;
export const schemaQuery="SELECT name,type,sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%' ORDER BY name";
/** Only the reviewed type CHECK extension and SQLite's renamed-table quoting may differ. */
export function expectPreservedSchema(before:SchemaObject[],after:SchemaObject[]){
 for(const old of before){
  const expected=old.type==='table'&&old.name==='ledger_transaction'
   ? {...old,sql:old.sql.replace('CREATE TABLE ledger_transaction (','CREATE TABLE "ledger_transaction" (').replace("'CASH_ADJUSTMENT','OPENING_BALANCE'","'CASH_ADJUSTMENT','DIVIDEND_RECEIVABLE_SETTLEMENT','OPENING_BALANCE'")}
   : old;
  expect(after.find(s=>s.name===old.name),old.name).toEqual(expected);
 }
}
export async function migrateAndRepeat(db:TestDatabase){
 expect(db.migration('migrate')).toBe(0);
 const schema=await db.client.$queryRawUnsafe<SchemaObject[]>(schemaQuery);
 const rows=new Map<string,unknown>();
 for(const t of schema.filter(s=>s.type==='table')){expect(t.name).toMatch(/^[a-z_]+$/);rows.set(t.name,await db.client.$queryRawUnsafe(`SELECT * FROM "${t.name}" ORDER BY rowid`));}
 expect(db.migration('migrate')).toBe(0);
 expect(await db.client.$queryRawUnsafe(schemaQuery)).toEqual(schema);
 for(const [table,before] of rows)expect(await db.client.$queryRawUnsafe(`SELECT * FROM "${table}" ORDER BY rowid`),table).toEqual(before);
}
export function ledgerStructure(file:string){
 const db=new DatabaseSync(file,{readOnly:true});
 try{return {columns:db.prepare('PRAGMA table_info(ledger_transaction)').all(),foreignKeys:db.prepare('PRAGMA foreign_key_list(ledger_transaction)').all(),indexes:db.prepare("SELECT name,sql FROM sqlite_master WHERE type='index' AND tbl_name='ledger_transaction' ORDER BY name").all()};}finally{db.close();}
}
/** Execute forbidden writes on an upgraded populated database, then roll back the probe. */
export function assertLedgerGuards(file:string){
 const db=new DatabaseSync(file);
 try{
  db.exec('PRAGMA foreign_keys=ON; PRAGMA recursive_triggers=ON; BEGIN');
  expect(db.prepare('PRAGMA foreign_keys').get()).toMatchObject({foreign_keys:1});
  expect(db.prepare("SELECT count(*) AS n FROM ledger_transaction WHERE status='POSTED'").get()?.n).toBeGreaterThan(0);
  expect(()=>db.exec("UPDATE ledger_transaction SET source=source WHERE status='POSTED'")).toThrow('immutable posted transaction');
  expect(()=>db.exec("DELETE FROM ledger_transaction WHERE status='POSTED'")).toThrow('immutable posted transaction');
  expect(()=>db.exec('INSERT OR REPLACE INTO ledger_transaction SELECT * FROM ledger_transaction LIMIT 1')).toThrow();
  expect(()=>db.exec('UPDATE ledger_leg SET amount=amount')).toThrow('immutable posted leg');
  expect(()=>db.exec('DELETE FROM ledger_leg')).toThrow('immutable posted leg');
  expect(()=>db.exec("INSERT INTO ledger_leg SELECT id||'-probe',transaction_id,sequence+1000,type,effective_at,security_id,quantity,amount,settlement_reference FROM ledger_leg LIMIT 1")).toThrow('closed posted leg set');
  const insert=(id:string,type:string,portfolio:string)=>db.prepare("INSERT INTO ledger_transaction (id,portfolio_id,type,status,event_at,created_at,source,source_reference,idempotency_key,methodology_id,revision,facts,leg_count) SELECT ?,?,?, 'PENDING',event_at,created_at,'MIGRATION_PROBE',?,?,methodology_id,revision,facts,1 FROM ledger_transaction LIMIT 1").run(id,portfolio,type,id,id);
  const portfolio=db.prepare('SELECT id FROM portfolio LIMIT 1').get()!.id as string;
  insert('pending-probe','CASH_DEPOSIT',portfolio);
  expect(()=>db.exec("UPDATE ledger_transaction SET status='POSTED' WHERE id='pending-probe'")).toThrow('incomplete aggregate');
  expect(()=>insert('invalid-type','UNKNOWN_TRANSACTION',portfolio)).toThrow('CHECK constraint failed');
  expect(()=>insert('invalid-fk','CASH_DEPOSIT','missing-portfolio')).toThrow('FOREIGN KEY constraint failed');
  // The new CHECK permits the newly supported type without weakening unrelated constraints.
  insert('new-type-probe','DIVIDEND_RECEIVABLE_SETTLEMENT',portfolio);
  const original=db.prepare("SELECT id FROM ledger_transaction WHERE status='POSTED' LIMIT 1").get()!.id as string;
  db.prepare('INSERT INTO dividend_settlement_audit VALUES (?,?,?)').run(original,'{"synthetic":true}','0'.repeat(64));
  db.prepare('INSERT INTO dividend_receipt_owner VALUES (?,?,?,?)').run(portfolio,'MIGRATION_PROBE','receipt',original);
  db.prepare('INSERT INTO forward_intake_event VALUES (?,?,?,?,?,?,?,?)').run(portfolio,'MIGRATION_PROBE','event','cash','1',original,'{"synthetic":true}','0'.repeat(64));
  for(const table of ['dividend_settlement_audit','dividend_receipt_owner','forward_intake_event']){
   expect(()=>db.exec(`UPDATE ${table} SET transaction_id=transaction_id`)).toThrow('immutable');
   expect(()=>db.exec(`DELETE FROM ${table}`)).toThrow('immutable');
   expect(()=>db.exec(`INSERT OR REPLACE INTO ${table} SELECT * FROM ${table}`)).toThrow('immutable');
  }
  expect(()=>db.prepare('INSERT INTO dividend_settlement_audit VALUES (?,?,?)').run('missing-transaction','{}','0'.repeat(64))).toThrow('FOREIGN KEY constraint failed');
  expect(db.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
 }finally{if(db.isTransaction)db.exec('ROLLBACK');db.close();}
}
