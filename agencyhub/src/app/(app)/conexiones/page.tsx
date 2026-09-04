import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireFeature } from "@/lib/features";
import { ConexionesView } from "./view";

export default async function ConexionesPage() {
  requireFeature("spend");
  await requireAdmin();

  const connections = await prisma.platformConnection.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      account: { select: { id: true, name: true, color: true, currency: true } },
      syncLogs: {
        orderBy: { startedAt: "desc" },
        take: 5,
        select: {
          id: true,
          syncType: true,
          status: true,
          recordsSynced: true,
          errorMessage: true,
          startedAt: true,
          completedAt: true,
        },
      },
    },
  });

  const accounts = await prisma.account.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, currency: true },
  });

  const serialized = connections.map((c) => ({
    id: c.id,
    accountId: c.accountId,
    accountName: c.account.name,
    accountColor: c.account.color,
    platform: c.platform,
    externalAccountId: c.externalAccountId,
    isActive: c.isActive,
    lastSyncAt: c.lastSyncAt?.toISOString() || null,
    lastSyncStatus: c.lastSyncStatus,
    lastSyncError: c.lastSyncError,
    createdAt: c.createdAt.toISOString(),
    syncLogs: c.syncLogs.map((l) => ({
      id: l.id,
      syncType: l.syncType,
      status: l.status,
      recordsSynced: l.recordsSynced,
      errorMessage: l.errorMessage,
      startedAt: l.startedAt.toISOString(),
      completedAt: l.completedAt?.toISOString() || null,
    })),
  }));

  return (
    <ConexionesView
      connections={serialized}
      accounts={accounts}
    />
  );
}
