import { marketBoundaryStatus } from '../../server/market-boundary';
export function GET() { return Response.json(marketBoundaryStatus(), {headers:{'Cache-Control':'no-store'}}); }
