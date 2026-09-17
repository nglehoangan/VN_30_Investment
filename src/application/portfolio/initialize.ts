import type { PortfolioSetup, PortfolioDefinition, SecurityDefinition } from "@/ports/portfolio";
import { portfolioId, securityId, requireRule } from "@/domain/portfolio/values";
import { instant } from "@/shared/time";
/** Identity-only initialization. No balance/cost/NAV input is accepted. */
export async function initializePortfolio(setup: PortfolioSetup, portfolio: PortfolioDefinition, securities: readonly SecurityDefinition[]) {
  portfolioId(portfolio.id); instant(portfolio.inceptionAt); instant(portfolio.createdAt);
  requireRule(portfolio.currency === "VND" && portfolio.name.trim() && portfolio.inceptionAt <= portfolio.createdAt, "INVALID_PORTFOLIO_DEFINITION");
  for (const s of securities) { securityId(s.id); requireRule(s.name.trim(), "SECURITY_NAME_REQUIRED"); }
  requireRule(new Set(securities.map(s => s.id)).size === securities.length, "DUPLICATE_SECURITY_IDENTITY");
  await setup.initialize(Object.freeze({ ...portfolio }), securities.map(s => Object.freeze({ ...s })));
}
