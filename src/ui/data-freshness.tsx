import type { DataFreshnessModel } from "@/domain/fundamentals/freshness";
import { FreshnessView } from "./freshness-view";

export function DataFreshnessView({ model }: { model: DataFreshnessModel }) {
  return <FreshnessView model={model} />;
}
