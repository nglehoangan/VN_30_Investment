/** Native retained-SQL rehearsal, explicitly not a Prisma CLI/deploy acceptance.
 * Supports the existing populated-portfolio upgrade assertion without changing it. */
import {mkdtempSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {loadDatabaseConfig} from '@/infrastructure/config/database';
import {prepareDatabaseFile} from '@/infrastructure/db/files';
import {openDatabase} from '@/infrastructure/db/client';
import {PrismaMethodologyRegistry} from '@/infrastructure/repositories/methodology-registry';
export async function testDatabase(options:{portfolioOnly?:boolean}={}){
 if(Object.keys(options).some(k=>k!=='portfolioOnly'))throw Error('UNSUPPORTED_STEP2_NATIVE_BASELINE');
 const directory=mkdtempSync(join(tmpdir(),'step2-final-native-')),file=join(directory,'fixture.sqlite');
 const config=loadDatabaseConfig({DATABASE_URL:'file:'+file},process.cwd());
 function migration(command:'migrate'|'status',baseline=false){
  const result=spawnSync('python3',['-c',`import sqlite3,sys,pathlib,hashlib
c=sqlite3.connect(sys.argv[1]); c.execute('PRAGMA foreign_keys=ON')
c.execute('CREATE TABLE IF NOT EXISTS _step2_retained_sql(name TEXT PRIMARY KEY, hash TEXT NOT NULL)'); c.commit()
files=sorted(pathlib.Path(sys.argv[2]).glob('*/migration.sql'))
base={'202609100001_methodology_registry','202609160001_portfolio_ledger','202609200001_methodology_governance'}
for p in files:
 if sys.argv[4]=='baseline' and p.parent.name not in base: continue
 h=hashlib.sha256(p.read_bytes()).hexdigest(); old=c.execute('SELECT hash FROM _step2_retained_sql WHERE name=?',(p.parent.name,)).fetchone()
 if old:
  if old[0]!=h: raise RuntimeError('MIGRATION_SOURCE_CHANGED:'+p.parent.name)
  continue
 if sys.argv[3]=='status': raise RuntimeError('PENDING_RETAINED_MIGRATION:'+p.parent.name)
 c.executescript(p.read_text()); c.execute('INSERT INTO _step2_retained_sql VALUES(?,?)',(p.parent.name,h)); c.commit()
c.close()
`,file,join(process.cwd(),'prisma/migrations'),command,baseline?'baseline':'all'],{encoding:'utf8',timeout:60000});
  if(result.status!==0)throw Error('STEP2_NATIVE_SQL_REHEARSAL_FAILED:'+String(result.error??result.stderr));
  return 0;
 }
 try{
  prepareDatabaseFile(config);migration('migrate',!!options.portfolioOnly);
  const client=await openDatabase(config);
  return {directory,config,client,registry:new PrismaMethodologyRegistry(client),migration,
   async close(){try{await client.$disconnect();}finally{rmSync(directory,{recursive:true,force:true});}}};
 }catch(e){rmSync(directory,{recursive:true,force:true});throw e;}
}
