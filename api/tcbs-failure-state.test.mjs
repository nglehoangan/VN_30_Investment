import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync,chmodSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {main} from './tcbs.mjs';
test('expired/missing cached token remains explicit when no display price can be published',async()=>{
 const root=mkdtempSync(path.join(tmpdir(),'tcbs-expired-')),oldKey=process.env.TCBS_API_KEY,oldCustody=process.env.TCBS_CUSTODY_CODE;
 try{
  mkdirSync(path.join(root,'data'));mkdirSync(path.join(root,'api'));
  const release='docs/fundamental-data-engine/evidence/2026-10-19-level1-promotion-partition-closure/RELEASE.json';mkdirSync(path.dirname(path.join(root,release)),{recursive:true});
  writeFileSync(path.join(root,release),JSON.stringify({partition:{members:Array.from({length:30},(_,i)=>({ticker:'T'+i,securityId:'id-'+i}))}}));
  writeFileSync(path.join(root,'api/.env.local'),'TCBS_API_KEY=test-key\nTCBS_CUSTODY_CODE=TEST\n',{mode:0o600});
  const file=path.join(root,'data/vn30.sqlite'),db=new DatabaseSync(file);db.exec(readFileSync(new URL('../prisma/migrations/202610080001_broker_observations/migration.sql',import.meta.url),'utf8'));db.close();chmodSync(file,0o600);
  let calls=0;const report=await main(['--cached-token-only','--market-only','--seconds=1','--history-bars=5'],{root,databaseFile:file,fetch:async()=>{calls++;throw Error('NETWORK_MUST_NOT_BE_CALLED');}});
  assert.equal(report.failureReason,'TOKEN_CACHE_UNAVAILABLE_OR_EXPIRED');assert.equal(report.state,report.failureReason);assert.equal(report.requests.length,0);assert.equal(report.displayPrices.published,0);assert.equal(calls,0);
  assert.equal(report.accountCapture.state,'NOT_REQUESTED');
 }finally{process.exitCode=0;if(oldKey===undefined)delete process.env.TCBS_API_KEY;else process.env.TCBS_API_KEY=oldKey;if(oldCustody===undefined)delete process.env.TCBS_CUSTODY_CODE;else process.env.TCBS_CUSTODY_CODE=oldCustody;rmSync(root,{recursive:true,force:true});}
});
