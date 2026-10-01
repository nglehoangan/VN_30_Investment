import "server-only";
import { WorkflowEngine } from "@/application/workflow/engine";
import { PrismaWorkflowArtifacts } from "@/infrastructure/repositories/workflow-artifacts";
import { PrismaDecisionArtifacts } from "@/infrastructure/repositories/decision-artifacts";
import { PrismaAnalyticalArtifacts } from "@/infrastructure/repositories/analytical-artifacts";
import { PrismaMethodologyRegistry } from "@/infrastructure/repositories/methodology-registry";
import type { PrismaClient } from "@/infrastructure/db/generated/client";
import type { WorkflowPortfolioRead } from "@/ports/workflow";
import type { Clock } from "@/ports/runtime";
/** Local server composition only. No HTTP action, scheduler, broker or ledger write capability. */
export function workflowCommands(client: PrismaClient, portfolio: WorkflowPortfolioRead, clock: Clock) {
  return new WorkflowEngine(new PrismaWorkflowArtifacts(client), portfolio, new PrismaDecisionArtifacts(client),
    new PrismaAnalyticalArtifacts(client), new PrismaMethodologyRegistry(client), clock);
}
