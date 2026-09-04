import "server-only";

import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";
import { fetchMetaDailySpend } from "@/lib/platforms/meta";
import { fetchGoogleDailySpend } from "@/lib/platforms/google";
import type { SyncType, SyncPlatform } from "@prisma/client";

export interface SyncResult {
  connectionId: string;
  accountName: string;
  platform: SyncPlatform;
  status: "success" | "error";
  recordsSynced: number;
  error?: string;
}

export async function syncAllConnections(
  syncType: SyncType = "scheduled"
): Promise<SyncResult[]> {
  const connections = await prisma.platformConnection.findMany({
    where: { isActive: true },
    include: { account: { select: { name: true, currency: true } } },
  });

  const results: SyncResult[] = [];

  for (const conn of connections) {
    const result = await syncConnection(conn, syncType);
    results.push(result);
  }

  return results;
}

export async function syncAllConnectionsForMonth(
  syncType: SyncType,
  year: number,
  month: number,
): Promise<SyncResult[]> {
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = `${year}-${String(month).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

  const connections = await prisma.platformConnection.findMany({
    where: { isActive: true },
    include: { account: { select: { name: true, currency: true } } },
  });

  const results: SyncResult[] = [];
  for (const conn of connections) {
    const result = await syncConnectionForRange(conn, syncType, firstDay, lastDay);
    results.push(result);
  }
  return results;
}

interface SyncableConnection {
  id: string;
  platform: SyncPlatform;
  externalAccountId: string;
  accessToken: string;
  refreshToken: string | null;
  accountId: string;
  account: { name: string; currency: string };
}

async function syncConnectionForRange(
  conn: SyncableConnection,
  syncType: SyncType,
  fromDate: string,
  toDate: string,
): Promise<SyncResult> {
  const log = await prisma.syncLog.create({
    data: {
      platformConnectionId: conn.id,
      syncType,
      status: "started",
    },
  });

  try {
    let rows: { date: string; spend: number; impressions: number; clicks: number; conversions?: number; currency: string }[];

    const token = decrypt(conn.accessToken);
    const refresh = conn.refreshToken ? decrypt(conn.refreshToken) : null;

    if (conn.platform === "meta_ads") {
      rows = await fetchMetaDailySpend(token, conn.externalAccountId, fromDate, toDate);
    } else {
      rows = await fetchGoogleDailySpend(token, conn.externalAccountId, refresh, fromDate, toDate);
    }

    let synced = 0;
    for (const row of rows) {
      const dateObj = new Date(row.date + "T00:00:00Z");

      await prisma.spendRecord.upsert({
        where: {
          accountId_platform_date_source: {
            accountId: conn.accountId,
            platform: conn.platform,
            date: dateObj,
            source: "api_sync",
          },
        },
        create: {
          accountId: conn.accountId,
          platform: conn.platform,
          date: dateObj,
          amountSpent: row.spend,
          currency: row.currency,
          impressions: row.impressions,
          clicks: row.clicks,
          conversions: "conversions" in row ? row.conversions ?? null : null,
          source: "api_sync",
          syncBatchId: log.id,
        },
        update: {
          amountSpent: row.spend,
          currency: row.currency,
          impressions: row.impressions,
          clicks: row.clicks,
          conversions: "conversions" in row ? row.conversions ?? null : null,
          syncBatchId: log.id,
        },
      });
      synced++;
    }

    await prisma.syncLog.update({
      where: { id: log.id },
      data: { status: "success", recordsSynced: synced, completedAt: new Date() },
    });

    await prisma.platformConnection.update({
      where: { id: conn.id },
      data: { lastSyncAt: new Date(), lastSyncStatus: "success", lastSyncError: null },
    });

    return {
      connectionId: conn.id,
      accountName: conn.account.name,
      platform: conn.platform,
      status: "success",
      recordsSynced: synced,
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";

    await prisma.syncLog.update({
      where: { id: log.id },
      data: { status: "error", errorMessage: msg, completedAt: new Date() },
    });

    await prisma.platformConnection.update({
      where: { id: conn.id },
      data: { lastSyncAt: new Date(), lastSyncStatus: "error", lastSyncError: msg },
    });

    return {
      connectionId: conn.id,
      accountName: conn.account.name,
      platform: conn.platform,
      status: "error",
      recordsSynced: 0,
      error: msg,
    };
  }
}

export async function syncConnection(
  conn: SyncableConnection,
  syncType: SyncType
): Promise<SyncResult> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const firstDay = `${year}-${String(month).padStart(2, "0")}-01`;
  const today = `${year}-${String(month).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  return syncConnectionForRange(conn, syncType, firstDay, today);
}

export async function syncSingleConnection(
  connectionId: string,
  syncType: SyncType = "manual"
): Promise<SyncResult> {
  const conn = await prisma.platformConnection.findUnique({
    where: { id: connectionId },
    include: { account: { select: { name: true, currency: true } } },
  });

  if (!conn) {
    return {
      connectionId,
      accountName: "?",
      platform: "meta_ads",
      status: "error",
      recordsSynced: 0,
      error: "Conexión no encontrada",
    };
  }

  return syncConnection(conn, syncType);
}
