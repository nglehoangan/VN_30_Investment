// @vitest-environment node
import {it,expect} from 'vitest';
import {mkdtempSync,writeFileSync,rmSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {d2Fixture} from '../fixtures/d2-availability';
import {PinnedD2Availability,type D2EvidenceConfiguration,type D2FilingPin} from '@/infrastructure/fundamentals/d2-source-evidence';
function setup(){
 const f=d2Fixture(),root=mkdtempSync(join(tmpdir(),'d2-evidence-'));
 const observationText=JSON.stringify(f.observation),knowledgeText=JSON.stringify(f.evidence.knowledge);
 writeFileSync(join(root,'observation.json'),observationText);writeFileSync(join(root,'metadata.json'),f.metadataText);writeFileSync(join(root,'knowledge.json'),knowledgeText);writeFileSync(join(root,'source.pdf'),f.body);
 const c=f.evidence.publicationCaptures[0];
 const pin:D2FilingPin={observationHash:f.hash(f.observation),observationPath:'observation.json',observationSha256:f.digest(observationText),documentPath:'source.pdf',documentRetrievedAt:f.evidence.documentRetrievedAt,documentVerifiedAt:f.evidence.documentVerifiedAt,identityBinding:f.identityBinding,identityMethod:f.identityMethod,publicationCaptures:[{path:'metadata.json',sha256:c.artifactHash,sourceVersionId:c.sourceVersionId,sourceHash:c.sourceHash,retrievedAt:c.retrievedAt,verifiedAt:c.verifiedAt,reference:c.reference}],knowledgePath:'knowledge.json',knowledgeSha256:f.digest(knowledgeText),requiredOtherBoundaryIds:f.evidence.requiredOtherBoundaryIds};
 const config:D2EvidenceConfiguration={source:f.source,registry:f.registry,sourceContract:f.sourceContract,sourceMethod:f.sourceMethod,filings:[pin]};
 return {...f,root,pin,config,read:(cfg=config,at=f.cutoff)=>new PinnedD2Availability(root,cfg).assess(f.hash(f.observation),at),clean:()=>rmSync(root,{recursive:true,force:true})};
}
it('read-only pinned composition verifies actual metadata/document/observation/knowledge bytes and returns only a D2 candidate',()=>{
 const f=setup();try{const r=f.read();expect(r.status).toBe('QUALIFIED_CANDIDATE');expect(r.immutableEvidenceHash).toBe(f.hash(f.pin));expect(r.admissionAuthorized).toBe(false);expect(r.publication.publishedAt).toBeNull();}finally{f.clean();}
});
it.each(['source.pdf','metadata.json','knowledge.json','observation.json'])('replacing %s invalidates the immutable source binding',file=>{
 const f=setup();try{writeFileSync(join(f.root,file),'REPLACEMENT');expect(()=>f.read()).toThrow();}finally{f.clean();}
});
it('unverifiable/missing documents, caller-substituted hashes and duplicated configured filings fail closed',()=>{
 const f=setup();try{
  expect(()=>f.read({...f.config,filings:[{...f.pin,documentPath:'missing.pdf'}]})).toThrow();
  expect(()=>new PinnedD2Availability(f.root,f.config).assess(f.hash('another observation'),f.cutoff)).toThrow();
  expect(()=>f.read({...f.config,filings:[f.pin,f.pin]})).toThrow();
 }finally{f.clean();}
});
it('missing or unapproved identity verification cannot be made authoritative by a valid PDF hash',()=>{
 const f=setup();try{expect(f.read({...f.config,filings:[{...f.pin,identityMethod:null}]}).status).toBe('BLOCKED');expect(f.read({...f.config,sourceMethod:null}).status).toBe('BLOCKED');}finally{f.clean();}
});
it('source version replacement and undisclosed capture-set substitution cannot inherit the approved identity',()=>{
 const f=setup();try{
  expect(()=>f.read({...f.config,source:{...f.config.source,provider:'replacement-provider'}})).toThrow();
  const extra={...f.pin.publicationCaptures[0],sha256:f.hash('unapproved-metadata')};expect(()=>f.read({...f.config,filings:[{...f.pin,publicationCaptures:[extra]}]})).toThrow();
 }finally{f.clean();}
});
it('an immutable late mapping proof still blocks historical AS_KNOWN admission rather than backdating availability',()=>{
 const f=setup();try{
  const late=JSON.stringify({...f.evidence.knowledge,mappingKnownAt:'2027-01-02T01:00:00.000Z'});writeFileSync(join(f.root,'knowledge.json'),late);
  const r=f.read({...f.config,filings:[{...f.pin,knowledgeSha256:f.digest(late)}]});expect(r.status).toBe('BLOCKED');expect(r.effectiveKnownAt).toBe('2027-01-02T01:00:00.000Z');expect(r.finding).toBe('D2_AS_KNOWN_LOOKAHEAD');
 }finally{f.clean();}
});
it('symlink and relative path escapes never supply source evidence',()=>{
 const f=setup(),outside=mkdtempSync(join(tmpdir(),'d2-outside-'));try{writeFileSync(join(outside,'source.pdf'),f.body);symlinkSync(join(outside,'source.pdf'),join(f.root,'escape.pdf'));expect(()=>f.read({...f.config,filings:[{...f.pin,documentPath:'escape.pdf'}]})).toThrow();}finally{f.clean();rmSync(outside,{recursive:true,force:true});}
});
it('two exact pinned authoritative captures with conflicting dates block without latest-wins replacement',()=>{
 const f=setup();try{
  const payload=JSON.stringify({released:'2026-12-31',ticker:f.observation.ticker,url:f.identityBinding.documentUrl}),sha256=f.digest(payload);writeFileSync(join(f.root,'conflicting.json'),payload);
  const identityBinding={...f.identityBinding,publicationCaptures:[...f.identityBinding.publicationCaptures,{sha256,pageUrl:'https://issuer.example/conflicting-disclosure'}]},identityMethod={...f.identityMethod,configurationReference:'d2-source-identity-sha256:'+f.hash(identityBinding)};
  const pin={...f.pin,identityBinding,identityMethod,publicationCaptures:[...f.pin.publicationCaptures,{...f.pin.publicationCaptures[0],path:'conflicting.json',sha256,reference:'synthetic-second-publication'}]};
  const r=f.read({...f.config,filings:[pin]});expect(r.status).toBe('BLOCKED');expect(r.finding).toBe('D2_CONFLICTING_PUBLICATION_EVIDENCE');
 }finally{f.clean();}
});
