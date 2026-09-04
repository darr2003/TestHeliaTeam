"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Platform, Currency } from "@prisma/client";

export async function createBudget(
  _prev: { error?: string } | undefined,
  formData: FormData
) {
  const user = await requireAuth();

  const accountId = formData.get("accountId") as string;
  const platform = formData.get("platform") as Platform;
  const month = parseInt(formData.get("month") as string, 10);
  const year = parseInt(formData.get("year") as string, 10);
  const plannedAmount = parseFloat(formData.get("plannedAmount") as string);
  const currency = formData.get("currency") as Currency;
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!accountId || !platform || !month || !year || isNaN(plannedAmount)) {
    return { error: "Completa todos los campos obligatorios." };
  }

  if (plannedAmount <= 0) {
    return { error: "El monto debe ser mayor a 0." };
  }

  const existing = await prisma.budgetPlan.findUnique({
    where: {
      accountId_platform_month_year: {
        accountId,
        platform,
        month,
        year,
      },
    },
  });

  if (existing) {
    return {
      error: "Ya existe un presupuesto para esa cuenta, plataforma y periodo.",
    };
  }

  await prisma.budgetPlan.create({
    data: {
      accountId,
      platform,
      month,
      year,
      plannedAmount,
      currency,
      notes,
      createdBy: user.id,
    },
  });

  revalidatePath("/presupuestos");
  revalidatePath("/dashboard");
  redirect("/presupuestos");
}

export async function deleteBudget(budgetId: string) {
  await requireAuth();

  await prisma.budgetPlan.delete({ where: { id: budgetId } });

  revalidatePath("/presupuestos");
  revalidatePath("/dashboard");
}

export async function updateBudget(
  budgetId: string,
  plannedAmount: number,
  notes: string | null
) {
  await requireAuth();

  await prisma.budgetPlan.update({
    where: { id: budgetId },
    data: { plannedAmount, notes },
  });

  revalidatePath("/presupuestos");
  revalidatePath("/dashboard");
}
