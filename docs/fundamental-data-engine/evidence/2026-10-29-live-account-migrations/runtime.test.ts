import {it,expect,vi} from 'vitest';
import {writeFileSync} from 'node:fs';
import path from 'node:path';
vi.mock('server-only',()=>({}));
it('upgraded live database remains readable by current dashboard without changing owner observations',async()=>{
 vi.stubEnv('DATABASE_URL','file:'+path.resolve('data/vn30.sqlite'));
 const {loadDashboard}=await import('../../../../app/server/dashboard');const m=await loadDashboard('holdings');
 expect(m.status).toBe('SUCCESS');expect(m.personalAccountIssue).toBeUndefined();expect(m.personalAccount?.positions).toHaveLength(11);
 expect(m.personalAccount).toMatchObject({cash:'327420',pendingDividends:'475000',custodyFee:'420'});
 expect(m.personalAccount?.positions.find(p=>p.ticker==='FPT')).toMatchObject({quantity:'220',tradableQuantity:'200',pendingQuantity:'20',importedCost:'16065060'});
 writeFileSync('docs/fundamental-data-engine/evidence/2026-10-29-live-account-migrations/RUNTIME_RESULT.json',JSON.stringify({status:'PASS',holdings:m.personalAccount?.positions.length,priceDay:m.personalAccount?.valuationAsOf,accountObservationsPreserved:true,currentActionability:m.current?.actionability,currentReasons:m.current?.reasons},null,2)+'\n');
});
