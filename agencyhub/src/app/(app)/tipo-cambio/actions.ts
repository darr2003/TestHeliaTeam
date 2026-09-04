"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function upsertExchangeRate(
  _prev: { error?: string; success?: boolean } | undefined,
  formData: FormData
) {
  const user = await requireAdmin();

  const month = parseInt(formData.get("month") as string, 10);
  const year = parseInt(formData.get("year") as string, 10);
  const rate = parseFloat(formData.get("rate") as string);

  if (!month || !year || isNaN(rate) || rate <= 0) {
    return { error: "Completa todos los campos con valores válidos." };
  }

  await prisma.exchangeRate.upsert({
    where: {
      fromCurrency_toCurrency_month_year: {
        fromCurrency: "USD",
        toCurrency: "CLP",
        month,
        year,
      },
    },
    update: { rate, createdBy: user.id },
    create: {
      fromCurrency: "USD",
      toCurrency: "CLP",
      month,
      year,
      rate,
      createdBy: user.id,
    },
  });

  revalidatePath("/tipo-cambio");
  return { success: true };
}
