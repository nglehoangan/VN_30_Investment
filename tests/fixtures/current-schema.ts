import {readFileSync} from 'node:fs';
import type {PrismaClient} from '@/infrastructure/db/generated/client';
/** Support both historical proposal fixtures and migrated databases, verifying exact DDL. */
export async function ensureCurrentSchema(db:PrismaClient,path:string){
 const statements=readFileSync(path,'utf8').match(/CREATE TRIGGER[\s\S]*?END;|CREATE TABLE[\s\S]*?;/g)??[];
 const normalize=(s:string)=>s.replace(/;$/,'').replace(/\s+/g,' ').trim();
 for(const sql of statements){
  const name=/^CREATE (?:TABLE|TRIGGER) (\w+)/.exec(sql)![1];
  const rows=await db.$queryRawUnsafe<{sql:string}[]>('SELECT sql FROM sqlite_master WHERE name=?',name);
  if(rows.length){if(rows.length!==1||normalize(rows[0].sql)!==normalize(sql))throw Error('CURRENT_FIXTURE_SCHEMA_MISMATCH:'+name);}
  else await db.$executeRawUnsafe(sql);
 }
}
