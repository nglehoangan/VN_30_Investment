// @vitest-environment node
import {it,expect} from 'vitest';
import {assessSourcePublication,type SourcePublicationContract} from '@/domain/fundamentals/source-publication';
import {runtimeFixture} from '../fixtures/runtime-readiness';
import {PinnedSourcePublication} from '@/infrastructure/fundamentals/source-publication';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
function setup(){
 const f=runtimeFixture(),document={ticker:'TEST',documentHash:f.hash('issuer PDF bytes'),documentUrl:'https://issuer.example/financial-report.pdf'};
 const contract:SourcePublicationContract={version:'synthetic-publication-contract-v1',sourceVersionId:f.source.id,sourceHash:f.hash(f.source),governanceStatus:'APPROVED',approvalReference:'SYNTHETIC ONLY source-publication approval',semantics:'PUBLIC_DISCLOSURE_EVENT',sourceKind:'ISSUER_DISCLOSURE',precision:'TIMESTAMP',timezone:'UTC',fields:{publication:'/releasedAt',ticker:'/ticker',documentUrl:'/documentUrl'},recordedAt:'2026-01-01T00:00:00.000Z',effectiveFrom:'2026-01-01T00:00:00.000Z',effectiveThrough:null};
 const payload={releasedAt:'2026-07-25T09:00:00.000Z',ticker:document.ticker,documentUrl:document.documentUrl};
 const capture={sourceVersionId:f.source.id,sourceHash:f.hash(f.source),artifactHash:f.digest(JSON.stringify(payload)),payload,retrievedAt:'2026-07-26T09:00:00.000Z',verifiedAt:'2026-07-26T10:00:00.000Z',reference:'synthetic-exact-metadata-reference'};
 const method={...f.input.methodology,approvalReference:contract.approvalReference!,configurationReference:'source-publication-authority-sha256:'+f.hash(contract)},at=f.request.systemKnownAt;
 return {...f,document,contract,capture,method,at};
}
it('approved exact source/document metadata proves publication but grants no historical admission',()=>{
 const f=setup(),r=assessSourcePublication(f.contract,f.method,f.capture,f.document,f.at,f.hash);
 expect(r.status).toBe('PROVEN');expect(r.publication?.publishedAt).toBe(f.capture.payload.releasedAt);expect(r.knownAt).toBe(f.capture.verifiedAt);expect(r.historicalAdmissionGranted).toBe(false);
});
it('date-only proof stays date-only and leaves conservative boundary selection to existing availability policy',()=>{
 const f=setup(),contract={...f.contract,precision:'DATE_ONLY' as const,timezone:'Asia/Ho_Chi_Minh' as const},method={...f.method,configurationReference:'source-publication-authority-sha256:'+f.hash(contract)};
 const r=assessSourcePublication(contract,method,{...f.capture,payload:{...f.capture.payload,releasedAt:'2026-07-25'}},f.document,f.at,f.hash);
 expect(r.publication).toMatchObject({publicationDate:'2026-07-25',publishedAt:null,publicationPrecision:'DATE_ONLY'});
});
it.each(['reportDate','periodEnd','retrievedAt','ingestedAt','creationDate','modifiedAt','signedAt'])('%s never masquerades as publication',field=>{
 const f=setup(),contract={...f.contract,fields:{...f.contract.fields,publication:'/'+field}},method={...f.method,configurationReference:'source-publication-authority-sha256:'+f.hash(contract)};
 const r=assessSourcePublication(contract,method,{...f.capture,payload:{...f.capture.payload,[field]:f.capture.payload.releasedAt}},f.document,f.at,f.hash);
 expect(r.status).toBe('UNPROVEN');expect(r.reason).toBe('NON_PUBLICATION_CLOCK_FIELD');
});
it('proposed, missing or wrong method authority cannot certify a metadata candidate',()=>{
 const f=setup();for(const method of [null,{...f.method,governanceStatus:'PROPOSED' as const},{...f.method,configurationReference:'different'}])expect(assessSourcePublication(f.contract,method,f.capture,f.document,f.at,f.hash).status).toBe('UNPROVEN');
 expect(assessSourcePublication({...f.contract,governanceStatus:'PROPOSED'},f.method,f.capture,f.document,f.at,f.hash).status).toBe('UNPROVEN');
});
it('different issuer/document/source and future timestamps remain conflicted',()=>{
 const f=setup();for(const capture of [{...f.capture,payload:{...f.capture.payload,ticker:'OTHER'}},{...f.capture,payload:{...f.capture.payload,documentUrl:'https://issuer.example/revised.pdf'}},{...f.capture,sourceHash:f.hash('wrong source')},{...f.capture,payload:{...f.capture.payload,releasedAt:'2026-08-01T00:00:00.000Z'}}])expect(assessSourcePublication(f.contract,f.method,capture,f.document,f.at,f.hash).status).toBe('CONFLICTED');
});
it('expired/future authority is rejected, even with matching metadata',()=>{
 const f=setup();for(const effectiveThrough of ['2026-07-01T00:00:00.000Z']){const c={...f.contract,effectiveThrough},m={...f.method,configurationReference:'source-publication-authority-sha256:'+f.hash(c)};expect(assessSourcePublication(c,m,f.capture,f.document,f.at,f.hash).status).toBe('UNPROVEN');}
 expect(assessSourcePublication(f.contract,{...f.method,recordedAt:'2027-01-01T00:00:00.000Z' as never},f.capture,f.document,f.at,f.hash).status).toBe('UNPROVEN');
});
it('pinned adapter binds exact metadata hash and externally configured document mapping; no caller-authored hash substitution',()=>{
 const f=setup(),dir=mkdtempSync(join(tmpdir(),'source-publication-'));try{
  writeFileSync(join(dir,'metadata.json'),JSON.stringify(f.capture.payload));
  const pin={path:'metadata.json',sha256:f.capture.artifactHash,sourceVersionId:f.capture.sourceVersionId,sourceHash:f.capture.sourceHash,retrievedAt:f.capture.retrievedAt,verifiedAt:f.capture.verifiedAt,reference:f.capture.reference};
  const adapter=new PinnedSourcePublication(dir,f.contract,f.method,[{...f.document,publicationCaptureHash:f.capture.artifactHash}],[pin]);
  expect(adapter.assess(pin.sha256,f.document.documentHash,f.at).status).toBe('PROVEN');
  expect(()=>adapter.assess(f.hash('caller fabricated capture'),f.document.documentHash,f.at)).toThrow();
  expect(()=>adapter.assess(pin.sha256,f.hash('another PDF at same URL'),f.at)).toThrow();
  writeFileSync(join(dir,'metadata.json'),'{}');expect(()=>adapter.assess(pin.sha256,f.document.documentHash,f.at)).toThrow();
 }finally{rmSync(dir,{recursive:true,force:true});}
});
