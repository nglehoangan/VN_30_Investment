import 'server-only';
import { boundaryCandidateReadiness, marketBlockerChildren } from '@/application/market-boundary/readiness';
/** No production acceptance/source/session approvals have been issued. Explicitly fail closed until independently activated. */
export function marketBoundaryStatus() {
  return {...boundaryCandidateReadiness(false),amendment:'di-market-boundary-v1',reasons:marketBlockerChildren.children.map(c=>c.id)};
}
export function requireAcceptedMarketBoundary(): void {
  throw new Error('MARKET_BOUNDARY_NOT_INDEPENDENTLY_ACCEPTED');
}
