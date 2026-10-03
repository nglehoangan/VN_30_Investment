import "server-only";
import { MarginalDecisionEngine } from "@/application/decision/marginal";
import { PrismaMarginalArtifacts } from "@/infrastructure/repositories/marginal-artifacts";
import { PrismaDecisionArtifacts } from "@/infrastructure/repositories/decision-artifacts";
import { PrismaAnalyticalArtifacts } from "@/infrastructure/repositories/analytical-artifacts";
import { PrismaMethodologyRegistry } from "@/infrastructure/repositories/methodology-registry";
import type { PrismaClient } from "@/infrastructure/db/generated/client";
import type { DecisionPortfolioRead } from "@/ports/decision";
import type { Clock } from "@/ports/runtime";
/** Server analyst composition. No public action or ledger writer. */
export function marginalDecisionCommands(client: PrismaClient, portfolio: DecisionPortfolioRead, clock: Clock) {
  return new MarginalDecisionEngine(new PrismaMarginalArtifacts(client), new PrismaDecisionArtifacts(client), new PrismaAnalyticalArtifacts(client), new PrismaMethodologyRegistry(client), portfolio, clock);
}
