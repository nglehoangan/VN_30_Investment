import {DatabaseSync} from 'node:sqlite';
import {writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {CurrentNavReadService} from '../../../../../src/application/current-nav/read-service.ts';
import {snapshotHash} from '../../../../../src/infrastructure/fundamentals/snapshot-hash.ts';
const db=new DatabaseSync(process.cwd()+'/data/vn30.sqlite',{readOnly:true});
try {
 const p=db.prepare('SELECT * FROM portfolio').get();
 const ledger={async read(){return {watermark:p.revision,inceptionAt:p.inception_at,transactions:db.prepare("SELECT facts FROM ledger_transaction WHERE status='POSTED'").all().map(r=>JSON.parse(r.facts))};}};
 const now=new Date().toISOString();
 const service=new CurrentNavReadService(ledger,{async load(){return null;},async isCurrent(){return false;}},{now:()=>now},snapshotHash);
 const result=await service.read({version:'current-nav-request-v1',portfolioId:p.id,purpose:'PORTFOLIO_NAV',valuationMode:'LATEST_COMPLETED_EOD',knowledgeMode:'RETROSPECTIVE',requestedAt:now,knowledgeCutoff:now,resultScope:'QUALIFIED_ONLY',allowIndicative:false,includeSecuritiesSubtotal:true,ledgerRevision:p.revision});
 assert.equal(result.navState,'NAV_BLOCKED');assert.equal(result.totalNav,null);assert.equal(result.indicativeValue,null);assert.equal(result.productionAuthorized,false);
 writeFileSync(new URL('./actual-nav-blocked.json',import.meta.url),JSON.stringify({classification:'ACTUAL_LEDGER_READ_ONLY_DEFAULT_SERVICE_NO_OPERATIONAL_INPUT_PROVIDER',result,mutations:0},null,2));
 console.log('PASS actual ledger read, absent operational provider/authority => NAV_BLOCKED; no market acceptance inferred');
} finally {db.close();}
