"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ACCOUNT_COLORS = [
  "#E53935", "#D81B60", "#8E24AA", "#5E35B1",
  "#3949AB", "#1E88E5", "#039BE5", "#00897B",
  "#43A047", "#7CB342", "#F4511E", "#6D4C41",
];

export async function createAccount(
  _prev: { error?: string } | undefined,
  formData: FormData
) {
  const user = await requireAuth();

  const name = (formData.get("name") as string)?.trim();
  const currency = formData.get("currency") as string;
  const color =
    (formData.get("color") as string) ||
    ACCOUNT_COLORS[Math.floor(Math.random() * ACCOUNT_COLORS.length)];

  if (!name) {
    return { error: "El nombre de la cuenta es obligatorio." };
  }

  if (currency !== "CLP" && currency !== "USD") {
    return { error: "Moneda inválida." };
  }

  await prisma.account.create({
    data: {
      name,
      color,
      currency,
      createdBy: user.id,
    },
  });

  revalidatePath("/cuentas");
  revalidatePath("/dashboard");
  redirect("/cuentas");
}

export async function toggleAccountActive(accountId: string) {
  await requireAuth();

  const account = await prisma.account.findUnique({
    where: { id: accountId },
    select: { isActive: true },
  });

  if (!account) return;

  await prisma.account.update({
    where: { id: accountId },
    data: { isActive: !account.isActive },
  });

  revalidatePath("/cuentas");
  revalidatePath("/dashboard");
}

// --- Ficha de cliente ---

function optional(formData: FormData, key: string): string | null {
  const v = (formData.get(key) as string | null)?.trim();
  return v ? v : null;
}

export async function updateAccountFicha(
  _prev: { error?: string; ok?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; ok?: boolean }> {
  await requireAuth();

  const accountId = formData.get("accountId") as string;
  if (!accountId) return { error: "Falta el identificador de la cuenta." };

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "El nombre del cliente es obligatorio." };

  const currency = formData.get("currency") as string;
  if (currency !== "CLP" && currency !== "USD") {
    return { error: "Moneda inválida." };
  }

  const contactEmail = optional(formData, "contactEmail");
  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    return { error: "El email de contacto no tiene un formato válido." };
  }

  const relationStartRaw = optional(formData, "relationStart");
  let relationStart: Date | null = null;
  if (relationStartRaw) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(relationStartRaw)) {
      return { error: "La fecha de inicio debe tener formato AAAA-MM-DD." };
    }
    relationStart = new Date(`${relationStartRaw}T00:00:00Z`);
    if (Number.isNaN(relationStart.getTime())) {
      return { error: "La fecha de inicio no es válida." };
    }
  }

  try {
    await prisma.account.update({
      where: { id: accountId },
      data: {
        name,
        currency,
        color: (formData.get("color") as string) || undefined,
        legalName: optional(formData, "legalName"),
        industry: optional(formData, "industry"),
        website: optional(formData, "website"),
        contactName: optional(formData, "contactName"),
        contactEmail,
        contactPhone: optional(formData, "contactPhone"),
        relationStart,
        notes: optional(formData, "notes"),
      },
    });
  } catch {
    return { error: "No se pudo guardar. ¿Ya existe otro cliente con ese nombre?" };
  }

  revalidatePath(`/cuentas/${accountId}`);
  revalidatePath("/cuentas");
  revalidatePath("/competencia");
  return { ok: true };
}

export async function addCompetitor(
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string; ok?: boolean }> {
  await requireAuth();

  const accountId = formData.get("accountId") as string;
  const name = (formData.get("name") as string)?.trim();

  if (!accountId) return { error: "Falta el identificador de la cuenta." };
  if (!name) return { error: "El nombre del competidor es obligatorio." };

  try {
    await prisma.competitor.create({
      data: {
        accountId,
        name,
        website: optional(formData, "website"),
        notes: optional(formData, "notes"),
      },
    });
  } catch {
    return { error: `"${name}" ya está en la lista de competidores.` };
  }

  revalidatePath(`/cuentas/${accountId}`);
  return { ok: true };
}

export async function deleteCompetitor(competitorId: string) {
  await requireAuth();

  const competitor = await prisma.competitor.findUnique({
    where: { id: competitorId },
    select: { accountId: true },
  });
  if (!competitor) return;

  await prisma.competitor.delete({ where: { id: competitorId } });
  revalidatePath(`/cuentas/${competitor.accountId}`);
}
