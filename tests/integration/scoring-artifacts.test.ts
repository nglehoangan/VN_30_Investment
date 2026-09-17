// @vitest-environment node
import {describe,it,expect} from "vitest";
import {testDatabase} from "../fixtures/database";
import {fixture,award,rankingFixture} from "../fixtures/scoring";
import {PrismaAnalyticalArtifacts} from "@/infrastructure/repositories/analytical-artifacts";
import {ScoringEngine} from "@/application/scoring/engine";
import {calculateScorecard} from "@/domain/scoring/scorecard";
import {openDatabase} from "@/infrastructure/db/client";
import {PrismaPortfolioLedger} from "@/infrastructure/repositories/portfolio-ledger";
import {PortfolioEngine} from "@/application/portfolio/engine";
import {methodologyFixture} from "../fixtures/methodology";
import {P,NOW,at,method,W0,deposit} from "../fixtures/portfolio/history";
import {ACCOUNTING_METHOD} from "@/domain/portfolio/values";
import {ConflictError} from "@/shared/errors";
describe("immutable scoring artifacts, actual SQLite",()=>{
  it("fresh migration, immutable roundtrip, correction and registered methodology only",async()=>{
    const db=await testDatabase();try{
      const repo=new PrismaAnalyticalArtifacts(db.client),engine=new ScoringEngine(db.registry,repo),f=fixture();
      await expect(engine.score(f)).rejects.toThrow();await db.registry.append(f.methodology);
      const a=await engine.score(f);expect(await repo.find(a.id)).toEqual(a);
      await expect(repo.append(a)).rejects.toBeInstanceOf(ConflictError);
      const revised=await engine.score({...award(f,"BQ-EQ",7),id:"revision",priorScorecardId:a.id,revisionReason:"Synthetic evidence revision"});
      expect(revised.totalScore).toBe("83");expect((await repo.find(a.id))).toEqual(a);
      for(const query of ["UPDATE analytical_artifact SET body='{}'","DELETE FROM analytical_artifact","INSERT OR REPLACE INTO analytical_artifact SELECT * FROM analytical_artifact"])await expect(db.client.$executeRawUnsafe(query)).rejects.toThrow();
      expect(await db.client.ledgerTransaction.count()).toBe(0);
      await expect(repo.append({...a,id:"forged",totalScore:"100"})).rejects.toThrow();
      await db.client.$disconnect();const reopened=await openDatabase(db.config);try{expect(await new PrismaAnalyticalArtifacts(reopened).find(a.id)).toEqual(a);}finally{await reopened.$disconnect();}
    }finally{await db.close();}
  });
  it("populated M6.3 upgrade and repeat deploy preserve existing data",async()=>{
    const db=await testDatabase({portfolioOnly:true});try{
      const f=fixture();await db.registry.append(f.methodology);
      await db.client.portfolio.create({data:{id:P,name:"Synthetic existing M6.3 portfolio",currency:"VND",inceptionAt:at(1),createdAt:NOW,revision:"0"}});
      await db.registry.append({...methodologyFixture(method),implementationIdentity:ACCOUNTING_METHOD});
      const portfolio=new PortfolioEngine(new PrismaPortfolioLedger(db.client),{now:()=>NOW});
      await portfolio.post([deposit()],W0);const ledgerBefore=await db.client.ledgerTransaction.findMany();
      const before=await db.client.portfolio.findMany();expect(db.migration("migrate")).toBe(0);expect(db.migration("migrate")).toBe(0);
      expect(await db.client.portfolio.findMany()).toEqual(before);expect(await db.client.ledgerTransaction.findMany()).toEqual(ledgerBefore);expect((await portfolio.reconstruct(P,NOW)).cash).toBe("10000");expect(await db.registry.findById(f.methodology.methodologyId)).toEqual(f.methodology);
      const repo=new PrismaAnalyticalArtifacts(db.client);await repo.append(calculateScorecard(f));expect(await repo.find(f.id)).not.toBeNull();
    }finally{await db.close();}
  });
  it("ranking persists only from formal scorecards and replays after method/evidence revisions",async()=>{
    const db=await testDatabase();try{
      const repo=new PrismaAnalyticalArtifacts(db.client),engine=new ScoringEngine(db.registry,repo),r=rankingFixture([84,82,80]);await db.registry.append(r.cards[0].methodology);
      await expect(engine.rank(r)).rejects.toThrow();for(const c of r.cards)await engine.score(c.input);
      const rank=await engine.rank(r);expect(await repo.find(rank.id)).toEqual(rank);
      const f={...r.cards[0].input,id:"new-identity",priorScorecardId:r.cards[0].id,revisionReason:"Synthetic new methodology",methodology:{...r.cards[0].methodology,methodologyId:"m64-new-method" as never}};
      await db.registry.append(f.methodology);await engine.score(f);expect(await repo.find(rank.id)).toEqual(rank);
    }finally{await db.close();}
  });
});
