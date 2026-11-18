import {readFileSync,mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {it,expect} from 'vitest';
import {acceptedBootstrapBinding,retainedDependencyBootstrap} from '@/infrastructure/dependency-catalog';
import {verifyRetainedBootstrap} from '@/infrastructure/dependencies/retained-bootstrap';
import {replayTcbsPipeline} from '@/infrastructure/market-boundary/tcbs-pipeline';
it('uses accepted successor data without disabling original historical executable hash checks',()=>{
 const binding=acceptedBootstrapBinding(process.cwd()),candidate=JSON.parse(readFileSync(binding.path,'utf8'));
 expect(()=>replayTcbsPipeline(process.cwd(),candidate)).toThrow('SOURCE_HASH_MISMATCH:src/domain/market-boundary/validation.ts');
 expect(retainedDependencyBootstrap(process.cwd()).bootstrapRoute.route).toBe('ACCEPTED_STATIC_DATA_SUCCESSOR');
});
it('rejects a changed successor receipt before opening a database',()=>{
 const root=mkdtempSync(join(tmpdir(),'bootstrap-forgery-test-'));
 try{const directory=join(root,'docs/fundamental-data-engine/vnm-step3-authority-closure/2026-11-17');mkdirSync(directory,{recursive:true});writeFileSync(join(directory,'RETAINED_STATIC_HEAD_BINDING.json'),'{}');expect(()=>verifyRetainedBootstrap(root,{} as never)).toThrow('RETAINED_BOOTSTRAP_RECEIPT_HASH');}finally{rmSync(root,{recursive:true,force:true});}
});
