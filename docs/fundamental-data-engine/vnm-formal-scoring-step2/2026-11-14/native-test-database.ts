/** Step2 test bootstrap only. Applies the exact retained migration SQL to a new
 * disposable database; no Prisma CLI download/startup or fake repository. */
import {mkdtempSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {loadDatabaseConfig} from '@/infrastructure/config/database';
import {prepareDatabaseFile} from '@/infrastructure/db/files';
import {openDatabase} from '@/infrastructure/db/client';
import {PrismaMethodologyRegistry} from '@/infrastructure/repositories/methodology-registry';
export async function testDatabase(options:Record<string,unknown>={}){
 if(Object.keys(options).length)throw Error('STEP2_NATIVE_FIXTURE_ONLY_FULL_SCHEMA');
 const directory=mkdtempSync(join(tmpdir(),'vnm-step2-regression-')),file=join(directory,'fixture.sqlite');
 const config=loadDatabaseConfig({DATABASE_URL:'file:'+file},process.cwd());
 try{
  prepareDatabaseFile(config);
  const result=spawnSync('python3',['-c',`import sqlite3,sys,pathlib
p=pathlib.Path(sys.argv[1]); root=pathlib.Path(sys.argv[2]); c=sqlite3.connect(p)
for migration in sorted(root.glob('*/migration.sql')): c.executescript(migration.read_text())
c.close()
`,file,join(process.cwd(),'prisma/migrations')],{encoding:'utf8',timeout:20000});
  if(result.status!==0)throw Error('STEP2_NATIVE_MIGRATION_FAILED:'+result.stderr);
  const client=await openDatabase(config);
  return {directory,config,client,registry:new PrismaMethodologyRegistry(client),migration(){throw Error('NOT_A_PRISMA_CLI_TEST');},async close(){try{await client.$disconnect();}finally{rmSync(directory,{recursive:true,force:true});}}};
 }catch(e){rmSync(directory,{recursive:true,force:true});throw e;}
}
