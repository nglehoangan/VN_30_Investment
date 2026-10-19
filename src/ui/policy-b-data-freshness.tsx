import type { DataFreshnessModel } from "@/domain/fundamentals/freshness-policy-b";
import { FreshnessView } from "./freshness-view";

export function PolicyBDataFreshnessView({ model }: { model: DataFreshnessModel }) {
  return <FreshnessView model={model} showAdmissionCounts />;
}
