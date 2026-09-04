import { getDashboardData } from "@/lib/dashboard";
import { requireFeature } from "@/lib/features";
import { DashboardView } from "./view";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string; y?: string }>;
}) {
  requireFeature("spend");

  const params = await searchParams;
  const now = new Date();
  const month = params.m ? parseInt(params.m, 10) : now.getMonth() + 1;
  const year = params.y ? parseInt(params.y, 10) : now.getFullYear();

  const data = await getDashboardData(month, year);

  return <DashboardView data={data} month={month} year={year} />;
}
