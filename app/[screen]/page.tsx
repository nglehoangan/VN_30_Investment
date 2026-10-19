import { notFound } from "next/navigation";
import { DashboardScreen } from "@/ui/dashboard";
import { isDashboardScreen } from "@/ui/navigation";
import { loadDashboard } from "../server/dashboard";
export const dynamic = "force-dynamic";
export default async function Page({ params }: { params: Promise<{ screen: string }> }) {
  const { screen } = await params;
  if (!isDashboardScreen(screen)) notFound();
  return <DashboardScreen model={await loadDashboard(screen)} screen={screen} />;
}
