"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function markAlertRead(alertId: string) {
  await requireAuth();
  await prisma.alert.update({
    where: { id: alertId },
    data: { isRead: true },
  });
  revalidatePath("/alarmas");
}

export async function dismissAlert(alertId: string) {
  await requireAuth();
  await prisma.alert.update({
    where: { id: alertId },
    data: { isDismissed: true, isRead: true },
  });
  revalidatePath("/alarmas");
}

export async function markAllRead() {
  await requireAuth();
  await prisma.alert.updateMany({
    where: { isRead: false },
    data: { isRead: true },
  });
  revalidatePath("/alarmas");
}

export async function dismissAllRead() {
  await requireAuth();
  await prisma.alert.updateMany({
    where: { isRead: true, isDismissed: false },
    data: { isDismissed: true },
  });
  revalidatePath("/alarmas");
}
