import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireFeature } from "@/lib/features";
import { BudgetForm } from "./form";

export default async function NuevoPresupuestoPage() {
  requireFeature("spend");
  await requireAuth();

  const accounts = await prisma.account.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, currency: true },
  });

  return <BudgetForm accounts={accounts} />;
}
