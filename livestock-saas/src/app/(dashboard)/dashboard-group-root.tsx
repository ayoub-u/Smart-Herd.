import { redirect } from "next/navigation";
import { ROUTES } from "@/constants";

// The (dashboard) group root → always redirect to /dashboard
export default function DashboardGroupRoot() {
  redirect(ROUTES.DASHBOARD);
}
