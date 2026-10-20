// @vitest-environment node
import {it,expect} from 'vitest';
import {readFileSync,mkdtempSync,copyFileSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {buildTcbsPipeline,replayTcbsPipeline,hashBytes,type TcbsPipelineCandidate} from '@/infrastructure/market-boundary/tcbs-pipeline';
import {snapshotHash} from '@/infrastructure/fundamentals/snapshot-hash';
import {reference} from '@/domain/market-boundary/validation';
import {normalizeTcbsEod} from '@/domain/market-boundary/tcbs-eod';
import {exactJson} from '@/infrastructure/market-boundary/exact-json';
import {harness,setup,decision} from '../fixtures/market-boundary';
const binding=JSON.parse(readFileSync('data/market-boundary/active-candidate.json','utf8')) as {path:string;sha256:string};
const candidate=JSON.parse(readFileSync(binding.path,'utf8')) as TcbsPipelineCandidate;
it('retained acceptance digest is exact, not manufactured or approved, and expiry does not change initialization',()=>{
 const reviewed=JSON.parse(readFileSync('docs/fundamental-data-engine/evidence/2026-10-20-tcbs-market-pipeline/PIPELINE_RESULT.json','utf8'));
 expect(snapshotHash(candidate)).toBe(binding.sha256);expect(replayTcbsPipeline(process.cwd(),candidate)).toEqual(candidate);
 expect(snapshotHash({capability:reference(candidate.capability),initialization:reference(candidate.initialization),policy:candidate.policy})).toBe(reviewed.independentAcceptanceCandidateHash);
 expect(candidate.initialization.body).not.toHaveProperty('market');expect(candidate.readyForScoring).toBe(false);
});
it.each(['missing','added','replaced'] as const)('provider universe %s cannot redefine certified30 (temporary synthetic mutation)',mode=>{
 const root=mkdtempSync(join(tmpdir(),'di14-universe-'));
 try{
  for(const pin of candidate.sourcePins){const target=join(root,pin.path);mkdirSync(dirname(target),{recursive:true});copyFileSync(pin.path,target);}
  const manifestPath=join(root,candidate.input.boardFolder,'manifest.json'),manifest=JSON.parse(readFileSync(manifestPath,'utf8'));
  const request=manifest.requests.find((r:{apiId:string})=>r.apiId==='5.3'),rawPath=join(root,candidate.input.boardFolder,request.rawPath),raw=JSON.parse(readFileSync(rawPath,'utf8'));
  if(mode==='missing')raw.data.pop();else if(mode==='added')raw.data.push({...raw.data[0],symbol:'OUTSIDE'});else raw.data[0].symbol='OUTSIDE';
  const bytes=JSON.stringify(raw);writeFileSync(rawPath,bytes);request.sha256=hashBytes(bytes);writeFileSync(manifestPath,JSON.stringify(manifest));
  expect(()=>buildTcbsPipeline(root,candidate.input)).toThrow('BOARD_CERTIFIED_FULL30');
 }finally{rmSync(root,{recursive:true,force:true});}
});
it('missing close never becomes zero; retrieval date cannot replace original bar trading date',()=>{
 const source=candidate.market.body.sources[0],raw=JSON.parse(readFileSync(source.rawPath,'utf8'));
 const index=raw.data.findIndex((b:{tradingDate:string})=>b.tradingDate.startsWith(candidate.profile.tradingDate));
 const missing=structuredClone(raw);delete missing.data[index].close;
 expect(()=>normalizeTcbsEod(exactJson(JSON.stringify(missing)),source,candidate.profile)).toThrow('LOSSLESS_DECIMAL_LEXEME');
 const substituted=structuredClone(raw);substituted.data[index].tradingDate=source.retrievedAt.slice(0,10)+'T00:00:00.000Z';
 expect(()=>normalizeTcbsEod(exactJson(JSON.stringify(substituted)),source,candidate.profile)).toThrow('MISSING_OR_DUPLICATE_DAILY_BAR');
});
it('dependency change between authorization and publication rejects synthetic decision without exposing a record',async()=>{
 const h=harness();await setup(h);let reads=0;
 h.authority.currentDependencies=async()=>++reads===1?h.dependency:{...h.dependency,hash:snapshotHash('changed-during-publication')};
 const d=decision(h);await expect(h.lifecycle.publish(d,h.request)).rejects.toThrow('DEPENDENCIES_CHANGED_BEFORE_SEAL');
 expect(h.records.has(d.id)).toBe(false);expect(reads).toBe(2);
});
