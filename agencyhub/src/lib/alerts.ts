import "server-only";

import { prisma } from "@/lib/prisma";
import { PLATFORM_LABELS } from "@/types";
import type { Platform } from "@/types";

interface AlertCandidate {
  accountId: string;
  platform: Platform | null;
  alertType: "overspend" | "low_budget" | "abnormal_pace" | "connection_error";
  severity: "warning" | "critical";
  message: string;
  thresholdValue: number;
  currentValue: number;
}

function platformName(p: string): string {
  return PLATFORM_LABELS[p as Platform]?.name ?? p;
}

export async function evaluateAlerts(month: number, year: number): Promise<number> {
  const now = new Date();
  const daysInMonth = new Date(year, month, 0).getDate();
  const todayDay =
    now.getMonth() + 1 === month && now.getFullYear() === year
      ? now.getDate()
      : month < now.getMonth() + 1 || year < now.getFullYear()
        ? daysInMonth
        : 0;

  if (todayDay === 0) return 0;
  const dayRatio = todayDay / daysInMonth;
  if (dayRatio < 0.1) return 0;

  const accounts = await prisma.account.findMany({
    where: { isActive: true },
    include: {
      budgetPlans: { where: { month, year } },
      spendRecords: {
        where: {
          date: {
            gte: new Date(year, month - 1, 1),
            lt: new Date(year, month, 1),
          },
        },
      },
      platformConnections: {
        where: { isActive: true },
        select: {
          id: true,
          platform: true,
          lastSyncStatus: true,
          lastSyncError: true,
          syncLogs: {
            orderBy: { startedAt: "desc" },
            take: 3,
            select: { status: true },
          },
        },
      },
    },
  });

  const candidates: AlertCandidate[] = [];

  for (const acc of accounts) {
    const channelMap = new Map<string, { planned: number; spent: number }>();

    for (const bp of acc.budgetPlans) {
      const cur = channelMap.get(bp.platform) || { planned: 0, spent: 0 };
      cur.planned += Number(bp.plannedAmount);
      channelMap.set(bp.platform, cur);
    }
    for (const sr of acc.spendRecords) {
      const cur = channelMap.get(sr.platform) || { planned: 0, spent: 0 };
      cur.spent += Number(sr.amountSpent);
      channelMap.set(sr.platform, cur);
    }

    for (const [platform, data] of channelMap) {
      if (data.planned <= 0) continue;
      const ratio = data.spent / data.planned;
      const pace = dayRatio > 0 ? ratio / dayRatio : 0;
      const pName = platformName(platform);
      const daysLeft = daysInMonth - todayDay;

      // --- OVERSPEND: warn 90%, critical 100% ---
      if (ratio >= 1.0) {
        candidates.push({
          accountId: acc.id,
          platform: platform as Platform,
          alertType: "overspend",
          severity: "critical",
          message: `${acc.name} · ${pName}: gasto supera presupuesto (${(ratio * 100).toFixed(1)}%)`,
          thresholdValue: 1.0,
          currentValue: ratio,
        });
      } else if (ratio >= 0.9) {
        candidates.push({
          accountId: acc.id,
          platform: platform as Platform,
          alertType: "overspend",
          severity: "warning",
          message: `${acc.name} · ${pName}: gasto alcanza ${(ratio * 100).toFixed(1)}% del presupuesto`,
          thresholdValue: 0.9,
          currentValue: ratio,
        });
      }

      // --- ABNORMAL_PACE: warn >1.30x, critical >1.50x ---
      if (ratio < 1.0) {
        if (pace > 1.5) {
          candidates.push({
            accountId: acc.id,
            platform: platform as Platform,
            alertType: "abnormal_pace",
            severity: "critical",
            message: `${acc.name} · ${pName}: ritmo critico ${pace.toFixed(2)}x (${(ratio * 100).toFixed(1)}% ejecutado al ${(dayRatio * 100).toFixed(0)}% del mes)`,
            thresholdValue: 1.5,
            currentValue: pace,
          });
        } else if (pace > 1.3) {
          candidates.push({
            accountId: acc.id,
            platform: platform as Platform,
            alertType: "abnormal_pace",
            severity: "warning",
            message: `${acc.name} · ${pName}: ritmo acelerado ${pace.toFixed(2)}x (${(ratio * 100).toFixed(1)}% ejecutado al ${(dayRatio * 100).toFixed(0)}% del mes)`,
            thresholdValue: 1.3,
            currentValue: pace,
          });
        }
      }

      // --- LOW_BUDGET: warn <=5 days, critical <=2 days ---
      if (todayDay >= 3 && data.spent > 0) {
        const dailyBurn = data.spent / todayDay;
        const remaining = data.planned - data.spent;
        const daysOfBudget = remaining > 0 ? remaining / dailyBurn : 0;

        if (daysOfBudget <= 2 && daysLeft > 2) {
          candidates.push({
            accountId: acc.id,
            platform: platform as Platform,
            alertType: "low_budget",
            severity: "critical",
            message: `${acc.name} · ${pName}: presupuesto se agota en ~${Math.max(0, Math.round(daysOfBudget))} dias al ritmo actual`,
            thresholdValue: 2,
            currentValue: daysOfBudget,
          });
        } else if (daysOfBudget <= 5 && daysLeft > 5) {
          candidates.push({
            accountId: acc.id,
            platform: platform as Platform,
            alertType: "low_budget",
            severity: "warning",
            message: `${acc.name} · ${pName}: presupuesto restante alcanza para ~${Math.round(daysOfBudget)} dias al ritmo actual`,
            thresholdValue: 5,
            currentValue: daysOfBudget,
          });
        }
      }
    }

    // --- CONNECTION_ERROR: critical when 3+ consecutive failures ---
    for (const conn of acc.platformConnections) {
      const logs = conn.syncLogs;
      const consecutiveErrors = logs.length >= 3 && logs.every((l) => l.status === "error");

      if (consecutiveErrors) {
        candidates.push({
          accountId: acc.id,
          platform: conn.platform as Platform,
          alertType: "connection_error",
          severity: "critical",
          message: `${acc.name} · ${platformName(conn.platform)}: 3+ fallos consecutivos de sincronizacion — ${conn.lastSyncError || "error desconocido"}`,
          thresholdValue: 3,
          currentValue: logs.length,
        });
      }
    }
  }

  let created = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const c of candidates) {
    const existing = await prisma.alert.findFirst({
      where: {
        accountId: c.accountId,
        platform: c.platform,
        alertType: c.alertType,
        severity: c.severity,
        isDismissed: false,
        createdAt: { gte: today },
      },
    });

    if (existing) {
      await prisma.alert.update({
        where: { id: existing.id },
        data: {
          currentValue: c.currentValue,
          message: c.message,
        },
      });
    } else {
      await prisma.alert.create({
        data: {
          accountId: c.accountId,
          platform: c.platform,
          alertType: c.alertType,
          severity: c.severity,
          message: c.message,
          thresholdValue: c.thresholdValue,
          currentValue: c.currentValue,
        },
      });
      created++;
    }
  }

  return created;
}

export async function getAlertCount(): Promise<number> {
  return prisma.alert.count({
    where: { isRead: false, isDismissed: false },
  });
}
