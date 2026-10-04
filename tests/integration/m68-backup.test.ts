// @vitest-environment node
import { it,expect } from "vitest";
import { spawnSync } from "node:child_process";
import { readFileSync,writeFileSync,existsSync,lstatSync,symlinkSync } from "node:fs";
import path from "node:path";
import { m68System,NOW } from "../fixtures/m68";
import { openDatabase } from "@/infrastructure/db/client";
import { loadDatabaseConfig } from "@/infrastructure/config/database";
import { PrismaPortfolioLedger } from "@/infrastructure/repositories/portfolio-ledger";
import { PrismaAnalyticalArtifacts } from "@/infrastructure/repositories/analytical-artifacts";
import { PrismaDecisionArtifacts } from "@/infrastructure/repositories/decision-artifacts";
import { PrismaWorkflowArtifacts } from "@/infrastructure/repositories/workflow-artifacts";
import { PortfolioEngine } from "@/application/portfolio/engine";
import { P } from "../fixtures/portfolio/history";
function run(source:string,mode:"backup"|"restore",args:string[]){
 return spawnSync(process.execPath,["scripts/backup.mjs",mode,...args],{encoding:"utf8",env:{...process.env,DATABASE_URL:`file:${source}`}});
}
it("backup → disposable restore → integrity, complete historical rows, accounting and artifact replay",async()=>{
 const x=await m68System();try{
  const response=await x.initiation.create(P,{type:"MONTHLY_DCA",requestedDate:"2026-10-04",contributionReference:"m68-contribution",eventReference:null});
  const before={state:await x.accounting.reconstruct(P,NOW),decision:await x.decisions.find(x.bases[0].id),review:await x.reviews.find(response.artifactId!)};
  const source=x.db.config.filePath,backup=path.join(x.db.directory,"backup.sqlite"),restored=path.join(x.db.directory,"restored.sqlite");
  const result=run(source,"backup",[backup]);expect(result.stderr+result.stdout).not.toContain(source);expect(result.status,result.stderr).toBe(0);expect(JSON.parse(result.stdout).status).toBe("BACKUP_VALIDATED");
  expect(lstatSync(backup).mode&0o077).toBe(0);expect(lstatSync(backup+".manifest.json").mode&0o077).toBe(0);
  expect(run(source,"restore",[backup,restored]).status).toBe(0);
  const client=await openDatabase(loadDatabaseConfig({DATABASE_URL:`file:${restored}`},process.cwd()));try{
   const ledger=new PrismaPortfolioLedger(client),cards=new PrismaAnalyticalArtifacts(client),decisions=new PrismaDecisionArtifacts(client),reviews=new PrismaWorkflowArtifacts(client);
   expect(await new PortfolioEngine(ledger,x.clock).reconstruct(P,NOW)).toEqual(before.state);expect(await decisions.find(x.bases[0].id)).toEqual(before.decision);expect(await reviews.find(response.artifactId!)).toEqual(before.review);
   expect(await cards.find(x.ranking.id)).toEqual(x.ranking);
   for(const table of ["ledger_transaction","ledger_leg","analytical_artifact","decision_artifact","workflow_review","workflow_proposal","methodology_record"] as const)expect(await client.$queryRawUnsafe(`SELECT * FROM ${table} ORDER BY 1`)).toEqual(await x.db.client.$queryRawUnsafe(`SELECT * FROM ${table} ORDER BY 1`));
   await expect(client.ledgerTransaction.delete({where:{id:"m68-contribution"}})).rejects.toThrow();await expect(client.decisionArtifact.update({where:{id:x.bases[0].id},data:{bodyHash:"tamper"}})).rejects.toThrow();
  }finally{await client.$disconnect();}
  expect(await x.accounting.reconstruct(P,NOW)).toEqual(before.state);
 }finally{await x.db.close();}
});
it("backup/restore refuses overwrite, same path, public output, symlinks, missing checksums and altered backup bytes",async()=>{
 const x=await m68System(false);try{
  const source=x.db.config.filePath,backup=path.join(x.db.directory,"backup.sqlite"),target=path.join(x.db.directory,"candidate.sqlite");
  expect(run(source,"backup",[source]).status).toBe(1);expect(run(source,"backup",[backup]).status).toBe(0);
  const bytes=readFileSync(backup);expect(run(source,"backup",[backup]).status).toBe(1);expect(readFileSync(backup)).toEqual(bytes);
  expect(run(source,"backup",[path.resolve("public","m68-forbidden.sqlite")]).status).toBe(1);
  const alias=path.join(x.db.directory,"alias.sqlite");symlinkSync(source,alias);expect(run(alias,"backup",[target]).status).toBe(1);expect(existsSync(target)).toBe(false);
  const changed=Buffer.from(bytes);changed[changed.length-1]^=1;writeFileSync(backup,changed);expect(run(source,"restore",[backup,target]).status).toBe(1);expect(existsSync(target)).toBe(false);writeFileSync(backup,bytes);
  expect(run(source,"restore",[source,target]).status).toBe(1);expect(existsSync(target)).toBe(false);
  expect(run(source,"restore",[backup,target]).status).toBe(0);expect(run(source,"restore",[backup,target]).status).toBe(1);
  const changedManifest=JSON.parse(readFileSync(backup+".manifest.json","utf8"));changedManifest.tables[0].count++;writeFileSync(backup+".manifest.json",JSON.stringify(changedManifest));
  expect(run(source,"restore",[backup,path.join(x.db.directory,"forged.sqlite")]).status).toBe(1);expect(existsSync(path.join(x.db.directory,"forged.sqlite"))).toBe(false);
 }finally{await x.db.close();}
});
it("corrupt authoritative artifact cannot be published as a validated backup",async()=>{
 const x=await m68System();try{
  await x.db.client.$executeRawUnsafe("DROP TRIGGER decision_no_update");await x.db.client.decisionArtifact.update({where:{id:x.bases[0].id},data:{bodyHash:"corrupt"}});
  const backup=path.join(x.db.directory,"invalid.sqlite");const result=run(x.db.config.filePath,"backup",[backup]);expect(result.status).toBe(1);expect(existsSync(backup)).toBe(false);expect(existsSync(backup+".manifest.json")).toBe(false);expect(result.stderr).not.toContain(x.db.directory);
 }finally{await x.db.close();}
});
