import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAccountDetail } from "@/lib/dashboard";
import { requireFeature } from "@/lib/features";
import { ReportesView } from "./view";
import type { ReportData } from "./report-document";

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string; y?: string; account?: string }>;
}) {
  requireFeature("spend");
  await requireAuth();

  const sp = await searchParams;
  const now = new Date();
  const month = sp.m ? parseInt(sp.m, 10) : now.getMonth() + 1;
  const year = sp.y ? parseInt(sp.y, 10) : now.getFullYear();
  const selectedAccountId = sp.account || null;

  const accounts = await prisma.account.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, currency: true, color: true },
  });

  const syncLogs = await prisma.syncLog.findMany({
    where: {
      startedAt: {
        gte: new Date(year, month - 1, 1),
        lt: new Date(year, month, 1),
      },
    },
    orderBy: { startedAt: "desc" },
    take: 20,
    include: {
      platformConnection: {
        select: {
          platform: true,
          account: { select: { name: true } },
        },
      },
    },
  });

  const serializedLogs = syncLogs.map((l) => ({
    id: l.id,
    accountName: l.platformConnection.account.name,
    platform: l.platformConnection.platform,
    syncType: l.syncType,
    status: l.status,
    recordsSynced: l.recordsSynced,
    errorMessage: l.errorMessage,
    startedAt: l.startedAt.toISOString(),
    completedAt: l.completedAt?.toISOString() || null,
  }));

  let reportData: ReportData | null = null;

  if (selectedAccountId) {
    const detail = await getAccountDetail(selectedAccountId, month, year);
    if (detail) {
      const alerts = await prisma.alert.findMany({
        where: {
          accountId: selectedAccountId,
          createdAt: {
            gte: new Date(year, month - 1, 1),
            lt: new Date(year, month, 1),
          },
          isDismissed: false,
        },
        orderBy: { createdAt: "desc" },
      });

      reportData = {
        account: detail.account,
        channels: detail.channels.map((ch) => ({
          platform: ch.platform,
          planned: ch.planned,
          spent: ch.spent,
          ratio: ch.ratio,
          status: ch.status,
          paceRatio: ch.paceRatio,
          paceLabel: ch.paceLabel,
        })),
        totalPlanned: detail.totalPlanned,
        totalSpent: detail.totalSpent,
        ratio: detail.ratio,
        remaining: detail.remaining,
        todayDay: detail.todayDay,
        daysInMonth: detail.daysInMonth,
        paceRatio: detail.paceRatio,
        dailyAvg: detail.dailyAvg,
        alerts: alerts.map((a) => ({
          id: a.id,
          alertType: a.alertType,
          severity: a.severity,
          message: a.message,
          platform: a.platform,
          createdAt: a.createdAt.toISOString(),
        })),
      };
    }
  }

  return (
    <ReportesView
      accounts={accounts}
      syncLogs={serializedLogs}
      month={month}
      year={year}
      selectedAccountId={selectedAccountId}
      reportData={reportData}
    />
  );
}
