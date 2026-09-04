"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/encryption";
import { syncAllConnections, syncSingleConnection } from "@/lib/sync";
import { evaluateAlerts } from "@/lib/alerts";
import type { SyncPlatform } from "@prisma/client";

export async function createConnection(
  _prev: { error?: string } | undefined,
  formData: FormData
) {
  await requireAdmin();

  const accountId = formData.get("accountId") as string;
  const platform = formData.get("platform") as SyncPlatform;
  const externalAccountId = (formData.get("externalAccountId") as string)?.trim();
  const accessToken = (formData.get("accessToken") as string)?.trim();
  const refreshToken = (formData.get("refreshToken") as string)?.trim() || null;

  if (!accountId || !platform || !externalAccountId || !accessToken) {
    return { error: "Completa todos los campos obligatorios." };
  }

  if (platform !== "meta_ads" && platform !== "google_ads") {
    return { error: "Plataforma no soportada." };
  }

  const existing = await prisma.platformConnection.findFirst({
    where: { accountId, platform, externalAccountId },
  });

  if (existing) {
    return { error: "Ya existe una conexión para esa cuenta y plataforma con ese ID externo." };
  }

  await prisma.platformConnection.create({
    data: {
      accountId,
      platform,
      externalAccountId,
      accessToken: encrypt(accessToken),
      refreshToken: refreshToken ? encrypt(refreshToken) : null,
    },
  });

  revalidatePath("/conexiones");
  redirect("/conexiones");
}

export async function updateConnection(
  connectionId: string,
  data: {
    externalAccountId?: string;
    accessToken?: string;
    refreshToken?: string | null;
  }
) {
  await requireAdmin();

  const encrypted: Record<string, string | null | undefined> = {};
  if (data.externalAccountId !== undefined) encrypted.externalAccountId = data.externalAccountId;
  if (data.accessToken !== undefined) encrypted.accessToken = encrypt(data.accessToken);
  if (data.refreshToken !== undefined) encrypted.refreshToken = data.refreshToken ? encrypt(data.refreshToken) : null;

  await prisma.platformConnection.update({
    where: { id: connectionId },
    data: encrypted,
  });

  revalidatePath("/conexiones");
}

export async function toggleConnection(connectionId: string) {
  await requireAdmin();

  const conn = await prisma.platformConnection.findUnique({
    where: { id: connectionId },
    select: { isActive: true },
  });

  if (!conn) return;

  await prisma.platformConnection.update({
    where: { id: connectionId },
    data: { isActive: !conn.isActive },
  });

  revalidatePath("/conexiones");
}

export async function deleteConnection(connectionId: string) {
  await requireAdmin();

  await prisma.syncLog.deleteMany({
    where: { platformConnectionId: connectionId },
  });

  await prisma.platformConnection.delete({
    where: { id: connectionId },
  });

  revalidatePath("/conexiones");
}

export async function testConnection(connectionId: string): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();

  const conn = await prisma.platformConnection.findUnique({
    where: { id: connectionId },
    select: { platform: true, accessToken: true, refreshToken: true, externalAccountId: true },
  });

  if (!conn) return { ok: false, message: "Conexión no encontrada." };

  try {
    const token = decrypt(conn.accessToken);
    const refresh = conn.refreshToken ? decrypt(conn.refreshToken) : null;

    if (conn.platform === "meta_ads") {
      const { testMetaConnection } = await import("@/lib/platforms/meta");
      return await testMetaConnection(token, conn.externalAccountId);
    } else {
      const { testGoogleConnection } = await import("@/lib/platforms/google");
      return await testGoogleConnection(token, conn.externalAccountId, refresh);
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return { ok: false, message: msg };
  }
}

export async function runSyncAll(): Promise<{
  ok: boolean;
  message: string;
  results: { status: string }[];
}> {
  await requireAdmin();

  try {
    const results = await syncAllConnections("manual");

    const now = new Date();
    await evaluateAlerts(now.getMonth() + 1, now.getFullYear());

    const ok = results.filter((r) => r.status === "success").length;
    const err = results.filter((r) => r.status === "error").length;
    return {
      ok: err === 0,
      message: `${ok} exitosa${ok !== 1 ? "s" : ""}${err > 0 ? `, ${err} con error` : ""}`,
      results,
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error de sync";
    return { ok: false, message: msg, results: [] };
  }
}

export async function runSyncSingle(connectionId: string): Promise<{
  ok: boolean;
  message: string;
}> {
  await requireAdmin();

  try {
    const result = await syncSingleConnection(connectionId, "manual");
    return {
      ok: result.status === "success",
      message: result.status === "success"
        ? `${result.recordsSynced} registros sincronizados`
        : result.error || "Error de sync",
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error de sync";
    return { ok: false, message: msg };
  }
}
