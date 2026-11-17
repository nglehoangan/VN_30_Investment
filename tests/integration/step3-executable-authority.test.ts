import {it,expect} from 'vitest';
import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {verifyProductionAuthorityBundle} from '@/infrastructure/dependencies/production-authority';
import {approvedExecutableFixture} from '../fixtures/step3-approved-executable';
it('actual current verifier blocks unapproved bytes; an approved-byte control passes with the same authority',()=>{
 const f=approvedExecutableFixture();try{
  expect(()=>verifyProductionAuthorityBundle(process.cwd(),f.config.authorityBundle)).toThrow('SCORING_EXECUTABLE_HASH_MISMATCH:src/application/scoring/engine.ts');
  expect(verifyProductionAuthorityBundle(f.root,f.config.authorityBundle).manifest.contentHash).toBe('8c0880249dc54e2baea0235cc10094f818220db86331442ece3da05085261cc1');
 }finally{f.close();}
});
for(const path of ['src/application/scoring/engine.ts','src/domain/market-boundary/validation.ts','src/domain/scoring/evidence.ts','src/domain/scoring/metrics.ts','src/domain/scoring/scorecard.ts'])it('independently rejects current unapproved bytes: '+path,()=>{
 const f=approvedExecutableFixture();try{
  verifyProductionAuthorityBundle(f.root,f.config.authorityBundle);
  writeFileSync(join(f.root,path),readFileSync(path));
  expect(()=>verifyProductionAuthorityBundle(f.root,f.config.authorityBundle)).toThrow('SCORING_EXECUTABLE_HASH_MISMATCH:'+path);
 }finally{f.close();}
});
it('even formatting-only changes cannot borrow the approved byte identity',()=>{
 const f=approvedExecutableFixture();try{
  const p=join(f.root,'src/domain/scoring/metrics.ts');writeFileSync(p,readFileSync(p,'utf8')+'\n');
  expect(()=>verifyProductionAuthorityBundle(f.root,f.config.authorityBundle)).toThrow('SCORING_EXECUTABLE_HASH_MISMATCH:src/domain/scoring/metrics.ts');
 }finally{f.close();}
});
