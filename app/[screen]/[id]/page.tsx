import { notFound } from "next/navigation";
import { DashboardScreen } from "@/ui/dashboard";
import { loadDashboard } from "../../server/dashboard";
export const dynamic = "force-dynamic";
export default async function Page({ params,searchParams }: { params: Promise<{ screen: string; id: string }> ; searchParams: Promise<{acceptance?:string|string[]}> }) {
  const { screen, id } = await params;
  if (!["holdings", "scoring", "ranking", "decisions", "dca", "reviews", "journal", "transactions", "audit", "data"].includes(screen)) notFound();
  const query=screen==="data"?await searchParams:{};
  if(Array.isArray(query.acceptance))notFound();
  return <DashboardScreen model={await loadDashboard(screen, id,query.acceptance)} screen={screen} id={id} />;
}
