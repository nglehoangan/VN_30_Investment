// @vitest-environment node
import { describe, expect, it } from "vitest";
import { mkdir, writeFile, appendFile, readFile } from "node:fs/promises";
import { join } from "node:path";
import { testDatabase } from "../fixtures/database";
import { setupScoringReadiness } from "../fixtures/scoring-readiness-db";
import { personalAiDatasetFixture, signAiInput } from "../fixtures/personal-ai-scoring";
import { canonicalJson } from "@/domain/fundamentals/snapshot";
import { snapshotHash, manifestDigest } from "@/infrastructure/fundamentals/snapshot-hash";
import { PinnedAiAcceptanceReader, PinnedAiReviewVerifier, type AiReviewTrustBinding } from "@/infrastructure/personal-ai/pinned-review";
import { FileAiScoreArtifactStore } from "@/infrastructure/personal-ai/artifact-store";
import { PersonalAiScoringDatasets } from "@/infrastructure/personal-ai/scoring-datasets";
import { PersonalAiScoringEngine } from "@/application/personal-ai/scoring-engine";
import type { ScoreInput } from "@/domain/personal-ai/scorecard";
import type { AiReviewVerifier } from "@/ports/personal-ai-scoring";
async function setup(mutate?: (input:ScoreInput)=>ScoreInput) {
  const db=await testDatabase();
  try {
    const native=await setupScoringReadiness(db,false), f=personalAiDatasetFixture(), ai=signAiInput(mutate?mutate(f.input):f.input);
    const a={ ...f.acceptance,tickers:f.acceptance.tickers.map(t=>t.input?{...t,input:ai.input}:t) };
    const root=join(db.directory,"ai-evidence"), output=join(db.directory,"ai-derived-artifacts"); await mkdir(root);
    for(const [index,artifact] of ai.artifacts.entries()) await writeFile(join(root,`pass-${index}.json`),canonicalJson(artifact));
    await writeFile(join(root,"acceptance.json"),canonicalJson(a));
    const toolBytes=canonicalJson({scope:"SYNTHETIC_ONLY_NOT_REAL_TOOL_LOG",sessionReference:ai.input.review.passes[0].sessionReference,inputHash:ai.input.review.inputHash});
    await writeFile(join(root,"tool-log.json"),toolBytes);
    await db.client.methodologyRecord.create({data:ai.input.methodology});
    const original=await db.client.methodologyRecord.findUniqueOrThrow({where:{methodologyId:native.acceptance.methodologyId}});
    await db.client.methodologyRecord.create({data:{...original,methodologyId:a.methodologyId,configurationReference:"personal-ai-di-acceptance-sha256:"+snapshotHash(a)}});
    const binding:AiReviewTrustBinding={reviewHash:snapshotHash(ai.input.review),ownerAuthorizationReference:ai.input.review.ownerAuthorizationReference,
      passArtifacts:ai.input.review.passes.map((p,index)=>({reference:p.artifactReference,path:`pass-${index}.json`,sha256:p.artifactHash})) as unknown as AiReviewTrustBinding['passArtifacts'],toolArtifacts:[{reference:'SYNTHETIC_TOOL_LOG_NOT_REAL_PROVENANCE',path:'tool-log.json',sha256:manifestDigest(toolBytes)}]};
    const acceptances=new PinnedAiAcceptanceReader(root,[{id:a.id,reference:a.reviewArtifactReference,path:"acceptance.json",sha256:manifestDigest(canonicalJson(a))}]);
    const verifier=new PinnedAiReviewVerifier(root,[binding]), store=new FileAiScoreArtifactStore(output,process.cwd());
    const datasets=(reviews:AiReviewVerifier=verifier)=>new PersonalAiScoringDatasets(db.client,native.snapshots,native.facts,native.derivations,native.registry,acceptances,reviews,store);
    const selection={snapshotRunId:a.snapshotRunId,acceptanceId:a.id}, repository=datasets();
    return {db,native,a,input:ai.input,root,output,store,verifier,binding,selection,datasets,repository,engine:new PersonalAiScoringEngine(db.registry,repository,snapshotHash)};
  }catch(error){await db.close();throw error;}
}
describe("personal AI acceptance -> native financial bridge -> scoring -> immutable isolated artifact",()=>{
  it("accepts a complete synthetic case, replays on reopen, and leaves legacy DB artifacts unchanged",async()=>{
    const f=await setup();try{
      const card=await f.engine.score(f.input,f.selection);
      expect(card.totalScore).toBe("82"); expect(card.input.assessments.every(a=>a.source==="AI")).toBe(true);
      expect(card).toMatchObject({independentHumanReviewClaimed:false,operationalAuthorizationGranted:false});
      expect((await f.engine.find(card.id))?.card).toEqual(card);
      const reopened=f.datasets();expect((await reopened.find(card.id))?.binding.readiness.filter(r=>r.readyForScoring)).toHaveLength(1);
      await expect(f.engine.score(f.input,f.selection)).rejects.toThrow();
      const second=await f.engine.score({...f.input,id:"second-ai-score",calculatedAt:"2026-07-29T00:00:00.000Z"},f.selection);expect(second.totalScore).toBe(card.totalScore);
      expect(await f.db.client.analyticalArtifact.count()).toBe(0);expect(await f.db.client.scoringDatasetBinding.count()).toBe(0);expect(await f.db.client.dataInitializationAcceptance.count()).toBe(0);
      await expect(f.native.datasets.appendAcceptance(f.a as never)).rejects.toThrow();
    }finally{await f.db.close();}
  },30000);
  it("rejects an unconfigured or revoked AI review despite well-formed caller provenance",async()=>{
    const f=await setup();try{
      const untrusted=f.datasets(new PinnedAiReviewVerifier(f.root));await expect(untrusted.authorize(f.input,f.selection)).rejects.toThrow();
      expect(await f.store.find(f.input.id)).toBeNull();
      await f.engine.score(f.input,f.selection);await expect(untrusted.find(f.input.id)).rejects.toThrow();
      await expect(new PinnedAiAcceptanceReader(f.root).read(f.a.id)).rejects.toThrow();
    }finally{await f.db.close();}
  },30000);
  it("rejects mutated session artifacts, mismatched input, forged binding and changed persisted output",async()=>{
    const f=await setup();try{
      await expect(f.engine.score({...f.input,companyName:"different issuer"},f.selection)).rejects.toThrow();
      const auth=await f.repository.authorize(f.input,f.selection),card=await f.engine.score(f.input,f.selection);
      await expect(f.repository.append(card,{...auth,inputHash:"f".repeat(64)})).rejects.toThrow();
      await appendFile(join(f.root,"pass-1.json")," ");await expect(f.repository.authorize(f.input,f.selection)).rejects.toThrow();
      const path=join(f.output,`${card.id}.json`);await writeFile(path,(await readFile(path,"utf8")).replace('"totalScore":"82"','"totalScore":"99"'));
      await expect(f.store.find(card.id)).rejects.toThrow();
    }finally{await f.db.close();}
  },30000);
  it("does not let trusted AI provenance or DI PASS flags replace missing valuation evidence",async()=>{
    const f=await setup(i=>({...i,evidence:i.evidence.filter(e=>e.observation!=="conservative_value")}));try{
      await expect(f.engine.score(f.input,f.selection)).rejects.toThrow();expect(await f.store.find(f.input.id)).toBeNull();
      expect((await f.repository.readiness(f.a.id)).find(r=>r.securityId===f.input.securityId)?.readyForScoring).toBe(false);
    }finally{await f.db.close();}
  },30000);
  it("rejects policy/snapshot substitution and does not write when score methodology is unregistered",async()=>{
    const f=await setup();try{
      await expect(f.engine.score(f.input,{...f.selection,snapshotRunId:"another-sealed-run"})).rejects.toThrow();
      await expect(f.engine.score({...f.input,methodology:{...f.input.methodology,methodologyId:"unregistered-ai" as never}},f.selection)).rejects.toThrow();
      expect(await f.store.find(f.input.id)).toBeNull();
      await appendFile(join(f.root,"acceptance.json")," ");await expect(f.repository.authorize(f.input,f.selection)).rejects.toThrow();
    }finally{await f.db.close();}
  },30000);
});
