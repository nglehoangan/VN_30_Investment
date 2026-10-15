import { deepFreeze } from "@/domain/portfolio/transaction";
import { PrismaDecisionArtifacts } from "@/infrastructure/repositories/decision-artifacts";
import { PrismaAnalyticalArtifacts } from "@/infrastructure/repositories/analytical-artifacts";
import { PrismaMarginalArtifacts } from "@/infrastructure/repositories/marginal-artifacts";
import { PrismaWorkflowArtifacts } from "@/infrastructure/repositories/workflow-artifacts";
import { MarginalDecisionEngine } from "@/application/decision/marginal";
import { WorkflowEngine } from "@/application/workflow/engine";
import { instant } from "@/shared/time";
import { workflowFixture, NOW } from "./workflow";
import type { testDatabase } from "./database";
export async function marginalDatabase(db: Awaited<ReturnType<typeof testDatabase>>, p = workflowFixture(1, i => { i.assessment.sizing.fees = "0"; i.assessment.sizing.economicTargetUpper = "0.04"; })) {
  const decisions = new PrismaDecisionArtifacts(db.client), analytical = new PrismaAnalyticalArtifacts(db.client), artifacts = new PrismaMarginalArtifacts(db.client), reviews = new PrismaWorkflowArtifacts(db.client);
  for (const d of p.decisions) for (const m of Object.values(d.input.methods)) if (!(await db.registry.findById(m.methodologyId))) await db.registry.append(m);
  for (const card of p.ranking!.input.cards) {
    if (!(await db.registry.findById(card.methodology.methodologyId))) await db.registry.append(card.methodology);
    await analytical.append(deepFreeze(structuredClone(card)));
  }
  await analytical.append(deepFreeze(structuredClone(p.ranking!)));
  for (const d of p.decisions) await decisions.append(d);
  let current = true;
  const clock = { now: () => instant(NOW) }, read = { read: async () => p.portfolio.decisionContext, isCurrent: async () => current };
  const workflowRead = { read: async () => p.portfolio, isCurrent: async () => current, transaction: async () => null };
  const engine = new MarginalDecisionEngine(artifacts, decisions, analytical, db.registry, read, clock, "SYNTHETIC_TEST");
  const workflow = new WorkflowEngine(reviews, workflowRead, decisions, analytical, db.registry, clock, "SYNTHETIC_TEST", artifacts);
  return { p, engine, workflow, artifacts, reviews, decisions, analytical, read, workflowRead, clock, setCurrent: (value: boolean) => { current = value; } };
}
