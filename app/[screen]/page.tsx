import { notFound } from "next/navigation";
import { DashboardScreen, navigation } from "@/ui/dashboard";
import { loadDashboard } from "../server/dashboard";
export const dynamic = "force-dynamic";
export default async function Page({ params }: { params: Promise<{ screen: string }> }) {
  const { screen } = await params;
  if (!navigation.some(g => g.items.some(([key]) => key === screen)) && screen !== "scoring") notFound();
  return <DashboardScreen model={await loadDashboard(screen)} screen={screen} />;
}
