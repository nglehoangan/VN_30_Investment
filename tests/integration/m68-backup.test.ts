// @vitest-environment node
import { it,expect,describe,beforeAll,afterAll } from "vitest";
import {createHash} from "node:crypto";
import { spawnSync } from "node:child_process";
import { readFileSync,writeFileSync,existsSync,lstatSync,symlinkSync,copyFileSync } from "node:fs";
import path from "node:path";
import { m68System,NOW } from "../fixtures/m68";
import { openDatabase } from "@/infrastructure/db/client";
import { loadDatabaseConfig } from "@/infrastructure/config/database";
import { PrismaPortfolioLedger } from "@/infrastructure/repositories/portfolio-ledger";
import { PrismaAnalyticalArtifacts } from "@/infrastructure/repositories/analytical-artifacts";
import { PrismaDecisionArtifacts } from "@/infrastructure/repositories/decision-artifacts";
import { PrismaWorkflowArtifacts } from "@/infrastructure/repositories/workflow-artifacts";
import { PortfolioEngine } from "@/application/portfolio/engine";
import {fixture as boundaryFixture} from "../fixtures/market-boundary";
import {PrismaBoundaryStore} from "@/infrastructure/repositories/market-boundary";
import { P } from "../fixtures/portfolio/history";
function run(source:string,mode:"backup"|"restore",args:string[]){
 const start=performance.now();
 const result=spawnSync(process.execPath,["scripts/backup.mjs",mode,...args],{encoding:"utf8",timeout:5000,killSignal:"SIGKILL",env:{...process.env,DATABASE_URL:`file:${source}`}});
 console.info(JSON.stringify({probe:"backup-subprocess",mode,durationMs:Math.round(performance.now()-start),status:result.status,timedOut:Boolean(result.error && "code" in result.error && result.error.code==="ETIMEDOUT")}));
 expect(result.error,"backup subprocess must finish within its own 5s deadline").toBeUndefined();
 return result;
}
it("backup → disposable restore → integrity, complete historical rows, accounting and artifact replay",async()=>{
 const x=await m68System();try{
  const response=await x.initiation.create(P,{type:"MONTHLY_DCA",requestedDate:"2026-10-04",contributionReference:"m68-contribution",eventReference:null});
  const before={state:await x.accounting.reconstruct(P,NOW),decision:await x.decisions.find(x.bases[0].id),review:await x.reviews.find(response.artifactId!)};
  await new PrismaBoundaryStore(x.db.client).append(boundaryFixture().cap);
  const raw=JSON.stringify({apiId:"SYNTHETIC",raw:"{\"testOnly\":true}"});
  await x.db.client.brokerObservation.create({data:{id:"synthetic-external-storage-id",kind:"TEST_ONLY",receivedAt:NOW,body:raw,bodyHash:createHash("sha256").update(raw).digest("hex")}});
  const source=x.db.config.filePath,backup=path.join(x.db.directory,"backup.sqlite"),restored=path.join(x.db.directory,"restored.sqlite");
  const result=run(source,"backup",[backup]);expect(result.stderr+result.stdout).not.toContain(source);expect(result.status,result.stderr).toBe(0);expect(JSON.parse(result.stdout).status).toBe("BACKUP_VALIDATED");
  expect(lstatSync(backup).mode&0o077).toBe(0);expect(lstatSync(backup+".manifest.json").mode&0o077).toBe(0);
  expect(run(source,"restore",[backup,restored]).status).toBe(0);
  const client=await openDatabase(loadDatabaseConfig({DATABASE_URL:`file:${restored}`},process.cwd()));try{
   const ledger=new PrismaPortfolioLedger(client),cards=new PrismaAnalyticalArtifacts(client),decisions=new PrismaDecisionArtifacts(client),reviews=new PrismaWorkflowArtifacts(client);
   expect(await new PortfolioEngine(ledger,x.clock).reconstruct(P,NOW)).toEqual(before.state);expect(await decisions.find(x.bases[0].id)).toEqual(before.decision);expect(await reviews.find(response.artifactId!)).toEqual(before.review);
   expect(await cards.find(x.ranking.id)).toEqual(x.ranking);
   for(const table of ["ledger_transaction","ledger_leg","analytical_artifact","decision_artifact","workflow_review","workflow_proposal","methodology_record","broker_observation"] as const)expect(await client.$queryRawUnsafe(`SELECT * FROM ${table} ORDER BY 1`)).toEqual(await x.db.client.$queryRawUnsafe(`SELECT * FROM ${table} ORDER BY 1`));
   await expect(client.ledgerTransaction.delete({where:{id:"m68-contribution"}})).rejects.toThrow();await expect(client.decisionArtifact.update({where:{id:x.bases[0].id},data:{bodyHash:"tamper"}})).rejects.toThrow();
  }finally{await client.$disconnect();}
  expect(await x.accounting.reconstruct(P,NOW)).toEqual(before.state);
 }finally{await x.db.close();}
});
describe("bounded independent backup/restore safety cases",()=>{
 let x:Awaited<ReturnType<typeof m68System>>,source:string,baseline:string;
 beforeAll(async()=>{x=await m68System(false);source=x.db.config.filePath;baseline=path.join(x.db.directory,"baseline.sqlite");expect(run(source,"backup",[baseline]).status).toBe(0);});
 afterAll(async()=>{await x?.db.close();});
 const cases:[string,(backup:string,target:string)=>void][]=[
  ["same source path",()=>expect(run(source,"backup",[source]).status).toBe(1)],
  ["existing backup is never overwritten",backup=>{const bytes=readFileSync(backup);expect(run(source,"backup",[backup]).status).toBe(1);expect(readFileSync(backup).equals(bytes)).toBe(true);}],
  ["public output is refused",()=>expect(run(source,"backup",[path.resolve("public","m68-forbidden.sqlite")]).status).toBe(1)],
  ["symlink source is refused",(_backup,target)=>{const alias=target+".alias";symlinkSync(source,alias);expect(run(alias,"backup",[target]).status).toBe(1);expect(existsSync(target)).toBe(false);}],
  ["altered backup bytes are refused",(backup,target)=>{const bytes=readFileSync(backup);bytes[bytes.length-1]^=1;writeFileSync(backup,bytes);expect(run(source,"restore",[backup,target]).status).toBe(1);expect(existsSync(target)).toBe(false);}],
  ["missing manifest is refused",(_backup,target)=>{expect(run(source,"restore",[source,target]).status).toBe(1);expect(existsSync(target)).toBe(false);}],
  ["existing restore is never overwritten",(backup,target)=>{expect(run(source,"restore",[backup,target]).status).toBe(0);const bytes=readFileSync(target);expect(run(source,"restore",[backup,target]).status).toBe(1);expect(readFileSync(target).equals(bytes)).toBe(true);}],
  ["forged manifest counts are refused",(backup,target)=>{const m=JSON.parse(readFileSync(backup+".manifest.json","utf8"));m.tables[0].count++;writeFileSync(backup+".manifest.json",JSON.stringify(m));expect(run(source,"restore",[backup,target]).status).toBe(1);expect(existsSync(target)).toBe(false);}],
 ];
 it.each(cases)("%s",(name,check)=>{const backup=path.join(x.db.directory,"case-"+cases.findIndex(c=>c[0]===name)+".sqlite"),target=backup+".restore.sqlite";copyFileSync(baseline,backup);copyFileSync(baseline+".manifest.json",backup+".manifest.json");check(backup,target);});
});
it("corrupt authoritative artifact cannot be published as a validated backup",async()=>{
 const x=await m68System();try{
  await x.db.client.$executeRawUnsafe("DROP TRIGGER decision_no_update");await x.db.client.decisionArtifact.update({where:{id:x.bases[0].id},data:{bodyHash:"corrupt"}});
  const backup=path.join(x.db.directory,"invalid.sqlite");const result=run(x.db.config.filePath,"backup",[backup]);expect(result.status).toBe(1);expect(existsSync(backup)).toBe(false);expect(existsSync(backup+".manifest.json")).toBe(false);expect(result.stderr).not.toContain(x.db.directory);
 }finally{await x.db.close();}
});

it("backup refuses raw body hashes substituted for canonical sealed-envelope hashes",async()=>{
 const x=await m68System(false);try{
  const cap=boundaryFixture().cap;await new PrismaBoundaryStore(x.db.client).append(cap);
  await x.db.client.$executeRawUnsafe('DROP TRIGGER market_boundary_record_no_update');
  const body=JSON.stringify({...cap,body:{...cap.body,sourceSchema:"tampered"}});
  await x.db.client.marketBoundaryRecord.update({where:{id:cap.id},data:{body,bodyHash:createHash("sha256").update(body).digest("hex")}});
  const output=path.join(x.db.directory,"wrong-scheme.sqlite");expect(run(x.db.config.filePath,"backup",[output]).status).toBe(1);expect(existsSync(output)).toBe(false);
 }finally{await x.db.close();}
});
