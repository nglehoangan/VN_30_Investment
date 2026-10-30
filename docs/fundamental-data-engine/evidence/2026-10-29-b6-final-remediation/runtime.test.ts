import {it,expect,vi} from 'vitest';
import {readFileSync,writeFileSync} from 'node:fs';
import {decimal} from '@/domain/portfolio/values';
vi.mock('server-only',()=>({}));
const output='docs/fundamental-data-engine/evidence/2026-10-29-b6-final-remediation/';
it('current composition retains owner observations and directly stored API prices on an isolated snapshot',async()=>{
 const snapshot=JSON.parse(readFileSync(output+'RUNTIME_DATABASE.json','utf8')) as {snapshotPath:string};
 vi.stubEnv('DATABASE_URL','file:'+snapshot.snapshotPath);
 const {loadDashboard}=await import('../../../../app/server/dashboard');
 const m=await loadDashboard('holdings');
 expect(m.status).toBe('SUCCESS');expect(m.personalAccountIssue).toBeUndefined();
 const a=m.personalAccount!;expect(a).toBeDefined();expect(a.positions).toHaveLength(11);
 expect(a).toMatchObject({cash:'327420',pendingDividends:'475000',custodyFee:'420',asOfDate:'2026-10-28'});
 expect(a.positions.find(p=>p.ticker==='FPT')).toMatchObject({quantity:'220',tradableQuantity:'200',pendingQuantity:'20',importedCost:'16065060'});
 for(const p of a.positions){expect(p.price).not.toBeNull();expect(p.priceAsOf! >= '2026-10-28').toBe(true);expect(p.priceSource).toContain('TCBS_API_RESPONSE:');expect(p.unrealizedPnl).toBe(decimal(p.price!).mul(decimal(p.quantity)).sub(decimal(p.importedCost)).toString());}
 expect(m.brokerApiData?.quotes).toHaveLength(30);
 writeFileSync(output+'RUNTIME_RESULT.json',JSON.stringify({status:'PASS',personalAsOfDate:a.asOfDate,valuationAsOf:a.valuationAsOf,holdings:a.positions.length,cash:a.cash,pendingDividends:a.pendingDividends,priceDays:[...new Set(a.positions.map(p=>p.priceAsOf))],marketQuotes:m.brokerApiData?.quotes.length,ledgerCash:m.state?.cash,currentActionability:m.current?.actionability,currentReasons:m.current?.reasons,scope:'snapshot only; imported-basis display P/L; no ledger writes'},null,2)+'\n');
});
