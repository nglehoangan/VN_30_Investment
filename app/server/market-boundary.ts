import 'server-only';
import {readTcbsCandidateStatus} from '@/infrastructure/market-boundary/status';
import {runtime} from './runtime';
/** Technical TCBS capability is replayed separately. Production acceptance remains fail-closed until independent approval. */
export function marketBoundaryStatus() {
  return {...readTcbsCandidateStatus(process.cwd(),runtime.clock.now(),process.env.VN30_MARKET_CANDIDATE_ENABLED==='0'?null:undefined),amendment:'di-market-boundary-v1'};
}
export function requireAcceptedMarketBoundary(): void {
  throw new Error('MARKET_BOUNDARY_NOT_INDEPENDENTLY_ACCEPTED');
}
