import {it,expect} from 'vitest';
import {render,screen,within} from '@testing-library/react';
import {DataFreshnessView} from '@/ui/data-freshness';
import {DashboardScreen} from '@/ui/dashboard';
import {emptyDashboard} from '@/application/dashboard/model';
import {emptyDataFreshness,buildDataFreshness} from '@/domain/fundamentals/freshness';
import {publicFreshnessFixture} from '../fixtures/data-freshness';
it('shows exact coverage denominator, historical readiness and current diagnostic staleness without trade controls',()=>{
 const f=publicFreshnessFixture();render(<DataFreshnessView model={f.model}/>);expect(screen.getByText('30 / 30 securities have every required fact selected at the snapshot cutoff.')).toBeVisible();expect(screen.getByText(/Historical snapshot · READ ONLY/)).toBeVisible();expect(screen.getAllByText('EXCEEDS_PINNED_THRESHOLD').length).toBe(30);expect(screen.getByText('Data-ready at snapshot cutoff').nextElementSibling).toHaveTextContent('1');expect(screen.queryByRole('button')).not.toBeInTheDocument();expect(screen.getByRole('link',{name:f.request.runId})).toHaveAttribute('href','/data/'+f.request.runId);
});
it('DATE_ONLY detail retains null issuer timestamp, date and distinct receipt/local clocks with safe public document links',()=>{
 const f=publicFreshnessFixture();render(<DataFreshnessView model={f.model}/>);const detail=screen.getByText(/NET_INCOME.*DATE_ONLY/).closest('details')!;
 expect(within(detail).getByText('Exact issuer publishedAt').nextElementSibling).toHaveTextContent('UNKNOWN / Unavailable');expect(within(detail).getByText('Publication date (date-only)').nextElementSibling).toHaveTextContent('2026-07-25');expect(within(detail).getByText('Local ingestedAt').nextElementSibling).toHaveTextContent(f.observations[0].ingestedAt);expect(within(detail).getByRole('link',{name:'Open source document',hidden:true})).toHaveAttribute('href','https://issuer.example/report.pdf');
});
it('empty, integrity-blocked and absent review states never invent 0/30 or readiness',()=>{
 const view='2026-10-09T00:00:00.000Z';const {rerender}=render(<DataFreshnessView model={emptyDataFreshness(view)}/>);expect(screen.getByText(/Universe size and readiness are unknown/)).toBeVisible();expect(screen.queryByText(/0 \/ 30/)).not.toBeInTheDocument();rerender(<DataFreshnessView model={emptyDataFreshness(view,'BLOCKED')}/>);expect(screen.getByRole('alert')).toHaveTextContent('could not be verified');
 const f=publicFreshnessFixture(),m=buildDataFreshness(f.snapshot,f.model.facts,[],view,{status:'UNAVAILABLE',acceptanceId:null,acceptedAt:null,algorithm:null},null);rerender(<DataFreshnessView model={m}/>);expect(screen.getByText('Data-ready at snapshot cutoff').nextElementSibling).toHaveTextContent('UNKNOWN');expect(screen.getByText(/Stored PASS declarations alone/)).toBeVisible();
});
it('AS_REVISED, synthetic scope and legacy readiness are explicitly diagnostic/historical',()=>{
 const f=publicFreshnessFixture();render(<DataFreshnessView model={{...f.model,snapshot:{...f.model.snapshot!,scope:'SYNTHETIC_TEST',mode:'AS_REVISED'},review:{...f.model.review,algorithm:'strict-canonical-m3-readiness-v1'},counts:{...f.model.counts,dataReady:null}}}/>);expect(screen.getByText(/AS_REVISED · diagnostic only/)).toBeVisible();expect(screen.getByText(/SYNTHETIC TEST ONLY — not production/)).toBeVisible();expect(screen.getByText(/Legacy v1 historical replay/)).toBeVisible();
});
it('data screen does not render broker account/capture or historical scorecard inputs',()=>{
 const f=publicFreshnessFixture();render(<DashboardScreen screen="data" model={{...emptyDashboard(),dataFreshness:f.model,brokerApiData:{accounts:[{number:'PRIVATE-ACCOUNT-CANARY'}]} as never,brokerSnapshot:{accountId:'PRIVATE-CAPTURE-CANARY'} as never,cards:[]}}/>);expect(screen.getByRole('heading',{name:'Financial data coverage'})).toBeVisible();expect(screen.queryByText(/PRIVATE-/)).not.toBeInTheDocument();expect(screen.getByText('SEALED FINANCIAL SNAPSHOT · READ ONLY')).toBeVisible();
});
it('derived lineage links every canonical operand to its disclosure detail',()=>{
 const f=publicFreshnessFixture(),id=f.observations[0].id;render(<DataFreshnessView model={{...f.model,derived:[{id:'derived-fcf',securityId:f.input.securityId,metric:'FCF',selected:true,status:'CALCULATED',value:'26',unit:'CURRENCY',confidence:'HIGH',crosswalkVersion:'reviewed-v1',operands:[{role:'CFO',operation:'QUARTER_FROM_YTD',value:'30',observationIds:[id],reviewKnownAt:null}]}]}}/>);expect(screen.getByRole('heading',{name:'Derived metric lineage'})).toBeVisible();const section=screen.getByRole('region',{name:'Derived metric lineage'});expect(within(section).getByRole('link',{name:id,hidden:true})).toHaveAttribute('href','#fact-'+id);
});
