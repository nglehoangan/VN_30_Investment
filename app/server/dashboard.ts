import "server-only";
import { existingDatabase } from "@/infrastructure/dashboard-support";
import { loadDatabaseConfig } from "@/infrastructure/config/database";
import { openDatabase } from "@/infrastructure/db/client";
import { PrismaPortfolioLedger } from "@/infrastructure/repositories/portfolio-ledger";
import { PrismaAnalyticalArtifacts } from "@/infrastructure/repositories/analytical-artifacts";
import { PrismaDecisionArtifacts } from "@/infrastructure/repositories/decision-artifacts";
import { PrismaWorkflowArtifacts } from "@/infrastructure/repositories/workflow-artifacts";
import { PrismaMethodologyRegistry } from "@/infrastructure/repositories/methodology-registry";
import { PortfolioEngine } from "@/application/portfolio/engine";
import { portfolioId } from "@/domain/portfolio/values";
import { methodologyId } from "@/shared/ids";
import { toPublicError } from "@/shared/errors";
import { runtime } from "./runtime";
import { emptyDashboard } from "@/application/dashboard/model";
import type { DashboardModel } from "@/application/dashboard/model";
import type { PrismaClient } from "@/infrastructure/db/generated/client";
/** Bounded catalog queries select IDs only. Existing adapters remain decoding/integrity authority. */
export async function readDashboard(client: PrismaClient, screen = "audit", reference?: string): Promise<DashboardModel> {
  const result = emptyDashboard();
  const portfolios = await client.portfolio.findMany({ take: 2, orderBy: { id: "asc" }, select: { id: true, name: true } });
  if (portfolios.length > 1) return { ...result, status: "BLOCKED", message: "Multiple portfolios require an explicit portfolio-selection contract. Capital actions are unavailable." };
  result.portfolio = portfolios[0] ?? null;
  if (result.portfolio) {
    const ledger = new PrismaPortfolioLedger(client);
    const read = await ledger.read(portfolioId(result.portfolio.id));
    result.state = await new PortfolioEngine(ledger, runtime.clock).reconstruct(portfolioId(result.portfolio.id), runtime.clock.now());
    result.transactions = [...read.transactions].sort((a, b) => b.facts.eventAt.localeCompare(a.facts.eventAt)).filter(t => screen !== "transactions" || !reference || t.facts.id === reference).slice(0, 100);
    result.truncated = read.transactions.length > 100;
  }
  const needAnalytics = ["audit", "dashboard", "holdings", "vn30", "ranking", "scoring", "data", "settings", "imports"].includes(screen);
  const needDecisions = ["audit", "dashboard", "holdings", "decisions", "risk"].includes(screen);
  const needReviews = ["audit", "dashboard", "reviews", "dca", "journal"].includes(screen);
  const needMethods = screen === "audit";
  const needExecutions = ["audit", "dca", "journal"].includes(screen);
  const analytics = needAnalytics ? await client.analyticalArtifact.findMany({ take: 101,
    where: screen === "scoring" && reference ? { id: reference } : screen === "ranking" && reference ? { id: reference } : undefined,
    orderBy: [{ asOf: "desc" }, { id: "asc" }], select: { id: true, kind: true } }) : [];
  const filteredAnalytics = ["dashboard", "data", "settings", "imports"].includes(screen)
    ? [analytics.find(a => a.kind === "SCORECARD"), analytics.find(a => a.kind === "RANKING")].filter(a => a !== undefined) : analytics;
  const [decisions, reviews, methods, executions, audits] = await Promise.all([
    needDecisions ? client.decisionArtifact.findMany({ take: screen === "dashboard" ? 5 : 101, where: screen === "decisions" && reference ? { id: reference } : undefined, orderBy: [{ asOf: "desc" }, { id: "asc" }], select: { id: true } }) : [],
    needReviews ? client.workflowReview.findMany({ take: screen === "dashboard" ? 5 : 101, where: reference && ["reviews", "journal", "dca"].includes(screen) ? { OR: [{ id: reference }, { proposals: { some: { id: reference } } }] } : undefined, orderBy: [{ recordedAt: "desc" }, { id: "asc" }], select: { id: true } }) : [],
    needMethods ? client.methodologyRecord.findMany({ take: 101, orderBy: { effectiveDate: "desc" }, select: { methodologyId: true } }) : [],
    needExecutions ? client.workflowExecution.findMany({ take: 101, orderBy: { id: "asc" }, select: { id: true } }) : [],
    needExecutions ? client.workflowAudit.findMany({ take: 101, orderBy: { id: "asc" }, select: { id: true } }) : [],
  ]);
  const analytical = new PrismaAnalyticalArtifacts(client), decision = new PrismaDecisionArtifacts(client), workflow = new PrismaWorkflowArtifacts(client), registry = new PrismaMethodologyRegistry(client);
  for (const row of filteredAnalytics.slice(0, 100)) {
    const a = await analytical.find(row.id);
    if (a && "totalScore" in a) result.cards = [...result.cards, a];
    else if (a) result.rankings = [...result.rankings, a];
  }
  for (const row of decisions.slice(0, 100)) { const a = await decision.find(row.id); if (a && (!result.portfolio || a.input.portfolio.integrity.portfolioId === result.portfolio.id)) result.decisions = [...result.decisions, a]; }
  for (const row of reviews.slice(0, 100)) { const a = await workflow.find(row.id); if (a && (!result.portfolio || a.command.portfolioId === result.portfolio.id)) result.reviews = [...result.reviews, a]; }
  for (const row of methods.slice(0, 100)) { const a = await registry.findById(methodologyId(row.methodologyId)); if (a) result.methods = [...result.methods, a]; }
  for (const row of executions.slice(0, 100)) { const a = await workflow.findExecution(row.id); if (a) result.executions = [...result.executions, a]; }
  for (const row of audits.slice(0, 100)) { const a = await workflow.findFollowUp(row.id); if (a) result.followUps = [...result.followUps, a]; }
  result.truncated ||= [analytics, decisions, reviews, methods, executions, audits].some(rows => rows.length > 100);
  result.status = result.portfolio || result.cards.length || result.reviews.length || result.decisions.length ? "SUCCESS" : "EMPTY";
  return result;
}
export async function loadDashboard(screen = "dashboard", reference?: string): Promise<DashboardModel> {
  let client: PrismaClient | undefined;
  try {
    const config = loadDatabaseConfig(process.env, process.cwd());
    if (!existingDatabase(config.filePath)) return emptyDashboard();
    client = await openDatabase(config);
    return await readDashboard(client, screen, reference);
  } catch (error) { return { ...emptyDashboard(), status: "BLOCKED", message: toPublicError(error).message }; }
  finally { await client?.$disconnect(); }
}
