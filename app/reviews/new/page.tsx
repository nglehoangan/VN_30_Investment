import { loadDashboard } from "../../server/dashboard";
import { DashboardScreen } from "@/ui/dashboard";
import { ReviewForm } from "@/ui/review-form";
import { initiateReview } from "../../server/review-actions";
export const dynamic = "force-dynamic";
export default async function Page(){return <DashboardScreen model={await loadDashboard("reviews")} screen="reviews" id="new"><ReviewForm action={initiateReview} /></DashboardScreen>;}
