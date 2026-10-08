import type { PortfolioState } from "@/domain/portfolio/reconstruct";
import type { Transaction } from "@/domain/portfolio/transaction";
import type { Scorecard } from "@/domain/scoring/scorecard";
import type { Ranking } from "@/domain/ranking/rank";
import type { Decision } from "@/domain/decision/engine";
import type { ReviewArtifact, ExecutionLink, FollowUpArtifact } from "@/domain/workflow/contracts";
import type { MethodologyRecord } from "@/domain/methodology/record";
import type { CurrentModel } from "@/application/current/read-model";
import type { BrokerSnapshot } from "@/domain/portfolio/broker-snapshot";
import type { BrokerApiData } from "@/domain/portfolio/broker-api-data";
export interface DashboardModel {
  brokerApiData?: BrokerApiData;
  brokerSnapshot?: BrokerSnapshot;
  current?: CurrentModel;
  status: "SUCCESS" | "EMPTY" | "BLOCKED"; message: string | null;
  portfolio: { id: string; name: string } | null; state: PortfolioState | null;
  transactions: readonly Transaction[]; cards: readonly Scorecard[]; rankings: readonly Ranking[];
  decisions: readonly Decision[]; reviews: readonly ReviewArtifact[];
  executions: readonly ExecutionLink[]; followUps: readonly FollowUpArtifact[];
  methods: readonly MethodologyRecord[]; truncated: boolean;
}
export const emptyDashboard = (): DashboardModel => ({ status: "EMPTY", message: null, portfolio: null, state: null, transactions: [], cards: [], rankings: [], decisions: [], reviews: [], executions: [], followUps: [], methods: [], truncated: false });
