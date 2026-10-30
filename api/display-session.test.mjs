import {test} from 'node:test';
import assert from 'node:assert/strict';
import {localSession,previousSession} from '../src/shared/market-display-session.mjs';
for(const [time,state,inSession,close] of [
 ['01:59:59','PRE_OPEN',false,'2026-10-28'],['02:00:00','OPENING_AUCTION',true,'2026-10-28'],['02:15:00','MORNING',true,'2026-10-28'],['04:29:59','MORNING',true,'2026-10-28'],['04:30:00','LUNCH_BREAK',false,'2026-10-28'],['05:59:59','LUNCH_BREAK',false,'2026-10-28'],['06:00:00','AFTERNOON',true,'2026-10-28'],['07:30:00','CLOSING_AUCTION',true,'2026-10-28'],['07:45:00','AFTER_CLOSE',false,'2026-10-29'],
])test('Vietnam session boundary '+time,()=>{const s=localSession('2026-10-29T'+time+'.000Z');assert.equal(s.state,state);assert.equal(s.inSession,inSession);assert.equal(s.expectedCloseDate,close);});
test('weekends, holidays and previous trading day are calendar based',()=>{
 assert.equal(localSession('2026-10-31T03:00:00.000Z').state,'NON_TRADING_DAY');assert.equal(previousSession('2026-11-02'),'2026-10-30');assert.equal(localSession('2026-04-30T03:00:00.000Z').state,'NON_TRADING_DAY');assert.throws(()=>localSession('2027-02-01T03:00:00.000Z'),/OUTSIDE_SUPPORTED/);
});
