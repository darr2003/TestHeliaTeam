import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireFeature } from "@/lib/features";
import { AlarmasView } from "./view";

export default async function AlarmasPage() {
  requireFeature("spend");
  await requireAuth();

  const alerts = await prisma.alert.findMany({
    where: { isDismissed: false },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      account: { select: { id: true, name: true, color: true } },
    },
  });

  const serialized = alerts.map((a) => ({
    id: a.id,
    accountId: a.accountId,
    accountName: a.account.name,
    accountColor: a.account.color,
    platform: a.platform,
    alertType: a.alertType,
    severity: a.severity,
    message: a.message,
    thresholdValue: Number(a.thresholdValue),
    currentValue: Number(a.currentValue),
    isRead: a.isRead,
    createdAt: a.createdAt.toISOString(),
  }));

  const unreadCount = alerts.filter((a) => !a.isRead).length;

  return <AlarmasView alerts={serialized} unreadCount={unreadCount} />;
}
