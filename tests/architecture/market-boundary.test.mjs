import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
it('production FORMAL routes have no unaccepted market publication bypass',()=>{
 for(const path of ['review-actions','workflow','marginal','policy-b-services']){
  const source=readFileSync(`app/server/${path}.ts`,'utf8');expect(source).toContain('requireAcceptedMarketBoundary();');
 }
 const guard=readFileSync('app/server/market-boundary.ts','utf8');expect(guard).toContain("throw new Error('MARKET_BOUNDARY_NOT_INDEPENDENTLY_ACCEPTED')");
 const current=readFileSync('app/server/current.ts','utf8');expect(current).toContain('marketBoundaryStatus().marketCurrent ?');
});
it('vNext capability/analysis/decision boundaries remain explicit and do not fetch or change old readers',()=>{
 const lifecycle=readFileSync('src/application/market-boundary/lifecycle.ts','utf8');expect(lifecycle).toContain('await this.store.sealDecision(accepted,expected);return accepted;');expect(lifecycle).not.toMatch(/fetch\(|setInterval\(/);
 const source=readFileSync('src/domain/market-boundary/contracts.ts','utf8');for(const v of ['initialization-manifest-v1','market-data-capability-v1','market-snapshot-v1','analysis-snapshot-v1','portfolio-snapshot-binding-v1','decision-snapshot-v1'])expect(source).toContain(v);
});
