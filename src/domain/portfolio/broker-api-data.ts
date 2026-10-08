/** Selected broker observations for display; raw private responses stay on the server. */
export interface BrokerApiData {
  sources: readonly { apiId: string; receivedAt: string; httpStatus: number }[];
  accounts: readonly { type: string; number: string; active: boolean }[];
  tradingDate?: string;
  quotes: readonly { symbol: string; price: number; reference: number; changePercent: number | null; volume: number }[];
  orderCount?: number;
}
