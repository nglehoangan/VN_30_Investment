import {it,expect} from 'vitest';
import {render,screen} from '@testing-library/react';
import {PolicyBDataFreshnessView} from '@/ui/policy-b-data-freshness';
import {buildDataFreshness} from '@/domain/fundamentals/freshness-policy-b';
import {evaluateScoringReadiness} from '@/domain/fundamentals/scoring-readiness-policy-b';
import {snapshotHash} from '@/infrastructure/fundamentals/snapshot-hash';
import {policyBFixture} from '../fixtures/policy-b';
import {publicFreshnessFixture} from '../fixtures/data-freshness';
it('PolicyB report preserves full denominator, deferred visibility, real Major severity and reopen conditions',()=>{
 const f=policyBFixture(),old=publicFreshnessFixture();
 const model=buildDataFreshness(f.snapshot,old.model.facts,[],'2026-10-17T12:00:00.000Z',{status:'VERIFIED',acceptanceId:f.acceptance.id,acceptedAt:f.acceptance.acceptedAt,algorithm:f.requirements.algorithm},evaluateScoringReadiness(f.acceptance,f.snapshot,f.sources,snapshotHash));
 expect(model.counts).toMatchObject({FULL_UNIVERSE_COUNT:30,SCORABLE_UNIVERSE_COUNT:25,DEFERRED_UNIVERSE_COUNT:5});
 render(<PolicyBDataFreshnessView model={model}/>);
 expect(screen.getByText('FULL_UNIVERSE_COUNT').nextElementSibling).toHaveTextContent('30');expect(screen.getByText('SCORABLE_UNIVERSE_COUNT').nextElementSibling).toHaveTextContent('25');expect(screen.getByText('DEFERRED_UNIVERSE_COUNT').nextElementSibling).toHaveTextContent('5');
 expect(screen.getAllByText(/INSUFFICIENT \/ NOT_SCORABLE/)).toHaveLength(5);expect(screen.getAllByText(/MAJOR · SOURCE_UNAVAILABLE/)).toHaveLength(5);expect(screen.getAllByText(/Reopen only on AUTHORITATIVE_ISSUER_FILING/)).toHaveLength(5);expect(screen.queryByText('Top 10 VN30')).not.toBeInTheDocument();expect(screen.queryByRole('button')).not.toBeInTheDocument();
});
