import {readFileSync} from 'node:fs';
import {it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {DashboardScreen} from '@/ui/dashboard';
import {emptyDashboard} from '@/application/dashboard/model';
it('shows real current-purpose score dates, LOW/non-actionable and no trade control',()=>{
 const c=JSON.parse(readFileSync('docs/fundamental-data-engine/vnm-step4-assessment-conversion/2026-11-18/final-reviewed-run/ISOLATED_SCORECARD.json','utf8'));
 const html=renderToStaticMarkup(<DashboardScreen model={{...emptyDashboard(),cards:[c]}} screen="scoring" id={c.id}/>);
 for(const value of ['LOW','VALID — NON-ACTIONABLE','CURRENT_FORMAL_VALUATION','NOT HISTORICAL PIT','No trading authorization',c.asOf,c.input.knownAt,c.calculatedAt])expect(html).toContain(value);
 expect(html).not.toContain('<form');expect(html).not.toContain('<button');
});
