import { DashboardScreen } from "@/ui/dashboard";
import { loadDashboard } from "./server/dashboard";
export const dynamic = "force-dynamic";
export default async function Home() { return <DashboardScreen model={await loadDashboard()} />; }
