// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, writeFile, appendFile, rm, symlink } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { reviewedAiInput } from "../fixtures/personal-ai-scoring";
import { fixture } from "../fixtures/scoring";
import { PinnedAiReviewVerifier, pinnedAiBytes, type AiReviewTrustBinding } from "@/infrastructure/personal-ai/pinned-review";
import { snapshotHash, manifestDigest } from "@/infrastructure/fundamentals/snapshot-hash";
import { canonicalJson } from "@/domain/fundamentals/snapshot";
const owned:string[]=[];
afterEach(async()=>{for(const path of owned.splice(0))await rm(path,{recursive:true,force:true});});
async function setup(){
 const root=await mkdtemp(join(tmpdir(),"vn30-ai-proof-"));owned.push(root);
 const f=reviewedAiInput(fixture()),toolBytes=canonicalJson({scope:"SYNTHETIC_TOOL_EVIDENCE_NOT_A_REAL_SESSION"});
 for(const [i,a] of f.artifacts.entries())await writeFile(join(root,`pass-${i}.json`),canonicalJson(a));
 await writeFile(join(root,"tool.json"),toolBytes);
 const trust:AiReviewTrustBinding={reviewHash:snapshotHash(f.input.review),ownerAuthorizationReference:f.input.review.ownerAuthorizationReference,
  passArtifacts:f.input.review.passes.map((p,i)=>({reference:p.artifactReference,path:`pass-${i}.json`,sha256:p.artifactHash})) as unknown as AiReviewTrustBinding['passArtifacts'],
  toolArtifacts:[{reference:f.input.review.passes[0].toolReferences[0],path:"tool.json",sha256:manifestDigest(toolBytes)}]};
 return{...f,root,trust};
}
describe("pinned AI session and tool provenance boundary",()=>{
 it("requires separately pinned tool/check evidence even with matching review/pass hashes",async()=>{
  const f=await setup();await new PinnedAiReviewVerifier(f.root,[f.trust]).verify(f.input);
  await expect(new PinnedAiReviewVerifier(f.root,[{...f.trust,toolArtifacts:[]}]).verify(f.input)).rejects.toMatchObject({issues:[{reason:"TRUSTED_AI_TOOL_EVIDENCE_REQUIRED"}]});
 });
 it("rejects mutated tool evidence bytes and a different owner authorization scope",async()=>{
  const f=await setup();await appendFile(join(f.root,"tool.json")," ");
  await expect(new PinnedAiReviewVerifier(f.root,[f.trust]).verify(f.input)).rejects.toMatchObject({issues:[{reason:"AI_PIN_BYTES_MISMATCH"}]});
  await expect(new PinnedAiReviewVerifier(f.root,[{...f.trust,ownerAuthorizationReference:"foreign-authorization"}]).verify(f.input)).rejects.toMatchObject({issues:[{reason:"TRUSTED_AI_REVIEW_BINDING_REQUIRED"}]});
 });
 it("rejects a session/model mismatch even if the altered artifact checksum is pinned",async()=>{
  const f=await setup(),bytes=canonicalJson({...f.artifacts[1],model:"not-the-reviewed-model"});await writeFile(join(f.root,"pass-1.json"),bytes);
  const review={...f.input.review,passes:[f.input.review.passes[0],{...f.input.review.passes[1],artifactHash:manifestDigest(bytes)}] as typeof f.input.review.passes};
  const trust={...f.trust,reviewHash:snapshotHash(review),passArtifacts:[f.trust.passArtifacts[0],{...f.trust.passArtifacts[1],sha256:manifestDigest(bytes)}] as typeof f.trust.passArtifacts};
  await expect(new PinnedAiReviewVerifier(f.root,[trust]).verify({...f.input,review})).rejects.toMatchObject({issues:[{reason:"AI_SESSION_ARTIFACT_MISMATCH"}]});
 });
 it("rejects path traversal and symbolic-link evidence",async()=>{
  const f=await setup(),pin=f.trust.toolArtifacts[0];
  await expect(pinnedAiBytes(f.root,{...pin,path:"../escape.json"})).rejects.toMatchObject({issues:[{reason:"AI_PIN_PATH_ESCAPE"}]});
  await symlink(join(f.root,"tool.json"),join(f.root,"linked.json"));
  await expect(pinnedAiBytes(f.root,{...pin,path:"linked.json"})).rejects.toMatchObject({issues:[{reason:"AI_PIN_FILE_REQUIRED"}]});
 });
});
