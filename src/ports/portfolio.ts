import type { Instant } from "@/shared/time";
import type { PortfolioId, LedgerWatermark } from "@/domain/portfolio/values";
import type { Transaction } from "@/domain/portfolio/transaction";
import type { PortfolioState } from "@/domain/portfolio/reconstruct";
export interface LedgerRead { readonly inceptionAt: Instant; readonly watermark: LedgerWatermark; readonly transactions: readonly Transaction[] }
export interface PortfolioLedger {
  read(portfolioId: PortfolioId, through?: LedgerWatermark): Promise<LedgerRead>;
  commit(portfolioId: PortfolioId, expected: LedgerWatermark, prepare: (history: readonly Transaction[]) => readonly Transaction[]): Promise<LedgerRead>;
}
export interface PortfolioProjection {
  rebuild(state: PortfolioState, calculatedAt: Instant): Promise<void>;
}
export interface PortfolioDefinition { readonly id: PortfolioId; readonly name: string; readonly currency: "VND"; readonly inceptionAt: Instant; readonly createdAt: Instant }
export interface SecurityDefinition { readonly id: string; readonly name: string }
export interface PortfolioSetup {
  initialize(portfolio: PortfolioDefinition, securities: readonly SecurityDefinition[]): Promise<void>;
}
