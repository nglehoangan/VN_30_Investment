import "server-only";
import { PortfolioEngine } from "@/application/portfolio/engine";
import { parsePortfolioCommands } from "@/infrastructure/repositories/portfolio-command-schema";
import { watermark } from "@/domain/portfolio/values";
import type { PortfolioLedger, PortfolioProjection } from "@/ports/portfolio";
import type { Clock } from "@/ports/runtime";
/** Developer/server composition boundary, not an exported Server Action or HTTP route. */
export function portfolioCommands(ledger: PortfolioLedger, clock: Clock, projection?: PortfolioProjection) {
  const engine = new PortfolioEngine(ledger, clock, projection);
  return { engine, post: (payload: unknown, expectedWatermark: string) => engine.post(parsePortfolioCommands(payload), watermark(expectedWatermark)) };
}
