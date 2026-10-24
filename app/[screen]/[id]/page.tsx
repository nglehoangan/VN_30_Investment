import { notFound } from "next/navigation";
import { DashboardScreen } from "@/ui/dashboard";
import { supportsDashboardDetail } from "@/ui/navigation";
import { loadDashboard } from "../../server/dashboard";
export const dynamic = "force-dynamic";
export default async function Page({ params,searchParams }: { params: Promise<{ screen: string; id: string }> ; searchParams: Promise<{acceptance?:string|string[];variant?:string|string[];page?:string|string[]}> }) {
  const { screen, id } = await params;
  if (!supportsDashboardDetail(screen)) notFound();
  const query=["data","vn30"].includes(screen)?await searchParams:{};
  if(Array.isArray(query.acceptance)||Array.isArray(query.variant)||Array.isArray(query.page))notFound();
  return <DashboardScreen model={await loadDashboard(screen, id,query.acceptance,{variant:query.variant,page:query.page})} screen={screen} id={id} />;
}
