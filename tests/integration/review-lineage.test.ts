// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest';
import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { snapshotHash } from '@/infrastructure/fundamentals/snapshot-hash';
import { lineageSemantic } from '@/domain/personal-ai/review-lineage';
import { jsonPointer, verifyLineageAcceptanceSnapshot } from '@/infrastructure/personal-ai/review-lineage';
const root=process.cwd(),base='docs/fundamental-data-engine/scoring-dataset-acceptance/2026-11-02/vn30-lineage-v1';
const owned:string[]=[];
afterEach(async()=>{for(const d of owned.splice(0))await rm(d,{recursive:true,force:true});});
const sha=(b:string|Buffer)=>createHash('sha256').update(b).digest('hex');
async function actual(){const path=base+'/acceptance-snapshot.json',bytes=await readFile(path);return {path,bytes,s:JSON.parse(bytes.toString())};}
async function fixture(){await mkdir(join(root,'tmp'),{recursive:true});const dir=await mkdtemp(join(root,'tmp/lineage-check-'));owned.push(dir);const {s}=await actual();return {dir,s};}
async function pinSnapshot(f:Awaited<ReturnType<typeof fixture>>){
  f.s.contentHash=snapshotHash(lineageSemantic(f.s));const path=relative(root,join(f.dir,'snapshot.json')),bytes=JSON.stringify(f.s);await writeFile(path,bytes);
  return {reference:'DISPOSABLE_REVIEW_TEST_ONLY',path,sha256:sha(bytes)};
}
async function patchFirstGraph(f:Awaited<ReturnType<typeof fixture>>,mutate:(g:ReturnType<typeof JSON.parse>)=>void){
  const member=f.s.members[0],g=JSON.parse(await readFile(member.path,'utf8'));mutate(g);
  for(const n of g.nodes){const {hash,...rest}=n;void hash;n.hash=snapshotHash(rest);}g.contentHash=snapshotHash(lineageSemantic(g));
  const bytes=JSON.stringify(g),path=relative(root,join(f.dir,'graph.json'));await writeFile(path,bytes);Object.assign(member,{path,sha256:sha(bytes),contentHash:g.contentHash});
}
describe('pinned source → normalization → metric → rubric → acceptance review workflow',()=>{
  it('verifies the real all-30 snapshot with all immutable source bytes and no acceptance authority',async()=>{
    const {path,bytes}=await actual(),result=await verifyLineageAcceptanceSnapshot(root,{reference:'ACTUAL_RETAINED_VN30_REVIEW',path,sha256:sha(bytes)});
    expect(result.technicalMappingAccepted).toBe(true);expect(result.issuers).toBe(30);expect(result.rubricMappings).toBe(690);
    expect(result.financialAcceptance).toBe('BLOCKED');expect(result.personalAiAcceptanceEligible).toBe(false);expect(result.tradingAuthorized).toBe(false);
  },20000);
  it('rejects changed source bytes before loading graph claims',async()=>{
    const f=await fixture(),path=relative(root,join(f.dir,'source.json'));await writeFile(path,'{}');f.s.sourcePins[path]=sha('{}');await writeFile(path,'{"altered":true}');
    await expect(verifyLineageAcceptanceSnapshot(root,await pinSnapshot(f))).rejects.toMatchObject({issues:[{reason:'LINEAGE_SOURCE_BYTES_MISMATCH'}]});
  },20000);
  it('rejects a mismatched JSON pointer even after graph and snapshot are resealed',async()=>{
    const f=await fixture();await patchFirstGraph(f,g=>{g.nodes[0].source.pointer='/ticker';});
    await expect(verifyLineageAcceptanceSnapshot(root,await pinSnapshot(f))).rejects.toMatchObject({issues:[{reason:'LINEAGE_SOURCE_POINTER_VALUE_MISMATCH'}]});
  },20000);
  it('rejects an otherwise hash-correct source from another issuer',async()=>{
    const f=await fixture();await patchFirstGraph(f,g=>{
      const n=g.nodes[0];n.source.path='docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-30/b6-comparability-r2/native-inputs/GVR.json';n.source.sha256=f.s.sourcePins[n.source.path];
    });
    await expect(verifyLineageAcceptanceSnapshot(root,await pinSnapshot(f))).rejects.toMatchObject({issues:[{reason:'LINEAGE_SOURCE_ISSUER_MISMATCH'}]});
  },20000);
  it('rejects relabeling a retained rubric assessment even if all its new hashes agree',async()=>{
    const f=await fixture();await patchFirstGraph(f,g=>{const n=g.nodes.find((n:{id:string})=>n.id==='rubric:RG-UNC');n.details.retainedAssessment.points=1;n.details.retainedAssessmentHash=snapshotHash(n.details.retainedAssessment);n.value='1';});
    await expect(verifyLineageAcceptanceSnapshot(root,await pinSnapshot(f))).rejects.toMatchObject({issues:[{reason:'LINEAGE_ORIGINAL_ASSESSMENT_CHANGED'}]});
  },20000);
  it('rejects path traversal in a resealed source catalog',async()=>{
    const f=await fixture();f.s.sourcePins['../escape.json']='0'.repeat(64);
    await expect(verifyLineageAcceptanceSnapshot(root,await pinSnapshot(f))).rejects.toMatchObject({issues:[{reason:'LINEAGE_SOURCE_PATH_ESCAPE'}]});
  },20000);
  it('rejects an altered universe even if its caller-supplied universe hash matches',async()=>{
    const f=await fixture();f.s.members[0].ticker='FAKE';f.s.universeHash=snapshotHash(f.s.members.map((m:{ticker:string;securityId:string})=>({ticker:m.ticker,securityId:m.securityId})));
    await expect(verifyLineageAcceptanceSnapshot(root,await pinSnapshot(f))).rejects.toMatchObject({issues:[{reason:'LINEAGE_RETAINED_UNIVERSE_BINDING'}]});
  });
  it('does not accept an added authority field',async()=>{
    const f=await fixture();f.s.tradingPermission=true;
    await expect(verifyLineageAcceptanceSnapshot(root,await pinSnapshot(f))).rejects.toMatchObject({issues:[{reason:'LINEAGE_SNAPSHOT_EXACT_FIELDS'}]});
  });
  it('rejects relabeling original observation dimensions',async()=>{
    const f=await fixture();await patchFirstGraph(f,g=>{g.nodes[0].reportingScope='SEPARATE_STANDALONE';});
    await expect(verifyLineageAcceptanceSnapshot(root,await pinSnapshot(f))).rejects.toMatchObject({issues:[{reason:'LINEAGE_ORIGINAL_OBSERVATION_DIMENSIONS'}]});
  },20000);
  it('rejects hiding expired prior bridge bindings',async()=>{
    const f=await fixture();await patchFirstGraph(f,g=>{g.stalePriorFactBindings=[];});
    await expect(verifyLineageAcceptanceSnapshot(root,await pinSnapshot(f))).rejects.toMatchObject({issues:[{reason:'LINEAGE_STALE_BINDINGS_RELABELED'}]});
  },20000);
  it('rejects inflating snapshot rubric counts after resealing',async()=>{
    const f=await fixture();f.s.counts.rubric=999;
    await expect(verifyLineageAcceptanceSnapshot(root,await pinSnapshot(f))).rejects.toMatchObject({issues:[{reason:'LINEAGE_SNAPSHOT_COUNTS_MISMATCH'}]});
  },20000);
  it('implements exact JSON Pointer escapes and rejects missing/null targets',()=>{
    expect(jsonPointer({'a/b':{'~':'12'}},'/a~1b/~0')).toBe('12');
    expect(()=>jsonPointer({a:null},'/a/b')).toThrow();expect(()=>jsonPointer({},'/bad~2escape')).toThrow();expect(()=>jsonPointer({},'/toString')).toThrow();
  });
});
