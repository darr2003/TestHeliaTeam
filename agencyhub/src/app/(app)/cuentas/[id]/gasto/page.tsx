import { notFound } from "next/navigation";
import { getAccountDetail } from "@/lib/dashboard";
import { requireFeature } from "@/lib/features";
import { AccountDetailView } from "./view";

export default async function AccountDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ m?: string; y?: string }>;
}) {
  requireFeature("spend");

  const { id } = await params;
  const sp = await searchParams;
  const now = new Date();
  const month = sp.m ? parseInt(sp.m, 10) : now.getMonth() + 1;
  const year = sp.y ? parseInt(sp.y, 10) : now.getFullYear();

  const data = await getAccountDetail(id, month, year);
  if (!data) notFound();

  return <AccountDetailView data={data} month={month} year={year} />;
}
