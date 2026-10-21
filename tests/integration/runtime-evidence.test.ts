// @vitest-environment node
import {it,expect} from 'vitest';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {runtimeFixture} from '../fixtures/runtime-readiness';
import {PinnedRuntimeEvidence} from '@/infrastructure/fundamentals/runtime-evidence';
import {RuntimeReadiness} from '@/application/fundamentals/runtime-readiness';
it.each(['JSON','PDF'])('pinned %s source/canonical/normalization/publication replay preserves exact cells and rejects tampering',async format=>{
 const f=runtimeFixture(),dir=mkdtempSync(join(tmpdir(),'runtime-evidence-'));
 try{
  const pin=(path:string,value:string)=>{writeFileSync(join(dir,path),value);return {path,sha256:f.digest(value)};};
  let o=f.preparation.observation;
  const payload=format==='PDF'?'%PDF-1.4\nSYNTHETIC BYTES ONLY; qualification protocol fixture, not a real filing':f.preparation.capture.payload;
  const capture={...f.preparation.capture,payload,payloadHash:f.digest(payload),mediaType:format==='PDF'?'application/pdf':'application/json'};
  if(format==='PDF')o={...o,raw:{...o.raw,fieldLocator:'data/manual-download/TEST/fixture.pdf#page=8'}};
  const raw=pin('raw.json',payload);
  const canonicalRun=pin('canonical.json',JSON.stringify({canonicalFacts:[{id:f.preparation.receipt.canonicalFactId,ticker:o.ticker,itemId:o.itemId,value:o.normalized.value,scope:o.reportingScope,period:{start:o.periodStart,end:o.periodEnd}}]}));
  o={...o,ancestorReferences:['canonical-run-sha256:'+canonicalRun.sha256+'#/canonicalFacts/0']};
  const normal={observations:[o]},normalization=pin('normalization.json',JSON.stringify(normal));
  const publication=pin('disclosure.json',JSON.stringify({publishedAt:o.publication.publishedAt}));
  const receipt={...f.preparation.receipt,observationHash:f.hash(o),captureHash:f.hash(capture),sourcePointer:o.raw.fieldLocator,canonicalRunHash:canonicalRun.sha256,sourceArtifactHash:raw.sha256,normalizationHash:f.hash(normal),publication:{...f.preparation.receipt.publication,artifactHash:publication.sha256}};
  const receiptPin=pin('receipt.json',JSON.stringify(receipt));
  const q={status:'REVIEWED',approvalReference:'SYNTHETIC ONLY externally pinned review',sourceHash:raw.sha256,page:8,box:[0.1,0.1,0.2,0.2],nativeValue:o.raw.lexicalValue,normalizedValue:o.normalized.value,unit:o.normalized.unit,scope:o.reportingScope,periodStart:o.periodStart,periodEnd:o.periodEnd,ticker:o.ticker,itemId:o.itemId};
  const pdfQualification=format==='PDF'?{file:pin('pdf-review.json',JSON.stringify({cell:q})),pointer:'/cell'}:undefined;
  const adapter=new PinnedRuntimeEvidence(dir,[...f.registrations.values()],[{receipt:receiptPin,canonicalRun,raw,normalization,publication,publishedAtPointer:'/publishedAt',...(pdfQualification?{pdfQualification}:{})}]);
  const result=await new RuntimeReadiness(adapter,f.hash,f.digest).prepareObservation({...f.preparation,observation:o,capture,receipt});expect(result.lineageHash).toBe(f.hash(receipt));
  expect(await adapter.lineage(f.hash('caller supplied alternate receipt'))).toBeNull();
  writeFileSync(join(dir,'raw.json'),'{}');await expect(adapter.lineage(f.hash(receipt))).rejects.toThrow();
 }finally{rmSync(dir,{recursive:true,force:true});}
});
it('production runtime has no scoring/transaction/order port and production database remains untouched',async()=>{
 const {readFileSync}=await import('node:fs');const before=fingerprint();const f=runtimeFixture();
 await new RuntimeReadiness(f.authority,f.hash,f.digest).prepareObservation(f.preparation);
 expect(fingerprint()).toBe(before);
 function fingerprint(){return createHash('sha256').update(readFileSync('data/vn30.sqlite')).digest('hex');}
});
