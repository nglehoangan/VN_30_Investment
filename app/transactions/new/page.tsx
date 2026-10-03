import { DashboardScreen } from "@/ui/dashboard";
import { TransactionForm } from "@/ui/transaction-form";
import { loadDashboard } from "../../server/dashboard";
import { recordTransaction } from "../../server/transaction-actions";
export const dynamic = "force-dynamic";
export default async function Page() {
  const model = await loadDashboard("transactions");
  return <DashboardScreen model={model} screen="transactions" id="new">{model.portfolio && model.status !== "BLOCKED" ? <TransactionForm action={recordTransaction} /> : <p>Transaction entry unavailable — an initialized, verified local portfolio is required.</p>}</DashboardScreen>;
}
