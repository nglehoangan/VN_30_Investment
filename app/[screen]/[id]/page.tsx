import { notFound } from "next/navigation";
import { DashboardScreen } from "@/ui/dashboard";
import { loadDashboard } from "../../server/dashboard";
export const dynamic = "force-dynamic";
export default async function Page({ params }: { params: Promise<{ screen: string; id: string }> }) {
  const { screen, id } = await params;
  if (!["holdings", "scoring", "ranking", "decisions", "dca", "reviews", "journal", "transactions", "audit"].includes(screen)) notFound();
  return <DashboardScreen model={await loadDashboard(screen, id)} screen={screen} id={id} />;
}
