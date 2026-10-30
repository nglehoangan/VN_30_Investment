import {expect,it,vi} from 'vitest';
import {writeFileSync,readFileSync} from 'node:fs';
import path from 'node:path';
vi.mock('server-only',()=>({}));
it('live dashboard consumes v2 display prices and preserves imported-basis accounting',async()=>{
 vi.stubEnv('DATABASE_URL','file:'+path.resolve('data/vn30.sqlite'));
 const {loadDashboard}=await import('../../../../app/server/dashboard');const m=await loadDashboard('holdings');
 expect(m.status).toBe('SUCCESS');expect(m.personalAccountIssue).toBeUndefined();expect(m.personalAccount?.positions).toHaveLength(11);
 expect(m.personalAccount).toMatchObject({cash:'327420',pendingDividends:'475000',custodyFee:'420',valuationAsOf:'2026-10-29'});
 const fpt=m.personalAccount?.positions.find(p=>p.ticker==='FPT');expect(fpt).toMatchObject({price:'52500',quantity:'220',importedCost:'16065060',unrealizedPnl:'-4515060'});
 expect(m.brokerApiData?.quotes).toHaveLength(30);
 const expected=JSON.parse(readFileSync('docs/fundamental-data-engine/evidence/2026-10-29-owner-price-selection/DATABASE_UPDATE.json','utf8')) as {fpt:{sourceObservationId:string;sourcePointer:string}};
 expect(fpt?.priceSource).toBe(expected.fpt.sourceObservationId+'#'+expected.fpt.sourcePointer);
 writeFileSync('docs/fundamental-data-engine/evidence/2026-10-29-owner-price-selection/RUNTIME_RESULT.json',JSON.stringify({status:'PASS',holdings:11,marketQuotes:30,priceDay:m.personalAccount?.valuationAsOf,fptPrice:fpt?.price,fptPnl:fpt?.unrealizedPnl,accountingBasis:'OWNER_IMPORTED_COST',priceSource:fpt?.priceSource,capitalActionability:m.current?.actionability},null,2)+'\n');
});
