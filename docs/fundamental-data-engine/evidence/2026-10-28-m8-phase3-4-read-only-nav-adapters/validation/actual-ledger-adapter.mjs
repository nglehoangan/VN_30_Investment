import {DatabaseSync} from 'node:sqlite';
import {writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {PortfolioNavLedgerReader} from '../../../../../src/application/current-nav/ledger-read-adapter.ts';
import {snapshotHash} from '../../../../../src/infrastructure/fundamentals/snapshot-hash.ts';
const db=new DatabaseSync(process.cwd()+'/data/vn30.sqlite',{readOnly:true});
try {
 const p=db.prepare('SELECT * FROM portfolio').get(), now=new Date().toISOString();
 const source={async read(){return {watermark:p.revision,inceptionAt:p.inception_at,transactions:db.prepare("SELECT facts FROM ledger_transaction WHERE status='POSTED'").all().map(r=>JSON.parse(r.facts))};}};
 const reader=new PortfolioNavLedgerReader(source,snapshotHash);
 const request={version:'current-nav-request-v1',portfolioId:p.id,purpose:'PORTFOLIO_NAV',valuationMode:'LATEST_COMPLETED_EOD',knowledgeMode:'RETROSPECTIVE',requestedAt:now,knowledgeCutoff:now,resultScope:'QUALIFIED_ONLY',allowIndicative:false,includeSecuritiesSubtotal:true,ledgerRevision:p.revision};
 const snapshot=await reader.snapshot(request,p.inception_at);
 assert.equal(snapshot.ledger.transactions.length,12);assert.equal(snapshot.state.positions.length,11);assert.equal(snapshot.state.cash,'232420');assert.equal(snapshot.state.receivables,'570000');assert.equal(snapshot.financiallyComplete,false);
 const {ledger:read,...snapshotSummary}=snapshot;
 writeFileSync(new URL('./actual-ledger-adapter.json',import.meta.url),JSON.stringify({status:'PASS',classification:'ACTUAL_RETAINED_LEDGER_READ_ONLY_OPENING_SCOPE_NOT_CURRENT_NAV',knowledgeCutoff:now,snapshotSummary,transactionCount:read.transactions.length,mutations:0},null,2));
 console.log('PASS actual ledger adapter:12transactions/11holdings/cash232420/receivables570000; no current completeness or authority inferred');
} finally {db.close();}
