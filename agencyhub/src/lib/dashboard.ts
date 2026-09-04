import "server-only";
import { prisma } from "@/lib/prisma";
import type { Platform } from "@/types";

export interface ChannelData {
  platform: Platform;
  planned: number;
  spent: number;
  ratio: number;
  status: "ok" | "warn" | "crit" | "low";
}

export interface AccountRow {
  id: string;
  name: string;
  color: string;
  currency: string;
  channels: ChannelData[];
  totalPlanned: number;
  totalSpent: number;
  ratio: number;
  status: "ok" | "warn" | "crit" | "low";
}

export interface DashboardData {
  accounts: AccountRow[];
  totalPlannedCLP: number;
  totalSpentCLP: number;
  globalRatio: number;
  paceRatio: number;
  todayDay: number;
  daysInMonth: number;
  activeCount: number;
  exchangeRate: number;
}

function channelStatus(
  ratio: number,
  dayRatio: number
): "ok" | "warn" | "crit" | "low" {
  const pace = dayRatio > 0 ? ratio / dayRatio : 0;
  if (ratio >= 1.0) return "crit";
  if (pace > 1.5) return "crit";
  if (ratio >= 0.9 || pace > 1.3) return "warn";
  if (pace < 0.7 && dayRatio > 0.3) return "low";
  return "ok";
}

function accountStatus(channels: ChannelData[]): "ok" | "warn" | "crit" | "low" {
  if (channels.some((c) => c.status === "crit")) return "crit";
  if (channels.some((c) => c.status === "warn")) return "warn";
  if (channels.some((c) => c.status === "low")) return "low";
  return "ok";
}

export async function getDashboardData(
  month: number,
  year: number
): Promise<DashboardData> {
  const now = new Date();
  const daysInMonth = new Date(year, month, 0).getDate();
  const todayDay =
    now.getMonth() + 1 === month && now.getFullYear() === year
      ? now.getDate()
      : month < now.getMonth() + 1 || year < now.getFullYear()
        ? daysInMonth
        : 0;
  const dayRatio = todayDay / daysInMonth;

  const exchangeRateRecord = await prisma.exchangeRate.findUnique({
    where: {
      fromCurrency_toCurrency_month_year: {
        fromCurrency: "USD",
        toCurrency: "CLP",
        month,
        year,
      },
    },
  });
  const exchangeRate = exchangeRateRecord
    ? Number(exchangeRateRecord.rate)
    : 920;

  const accounts = await prisma.account.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    include: {
      budgetPlans: {
        where: { month, year },
      },
      spendRecords: {
        where: {
          date: {
            gte: new Date(year, month - 1, 1),
            lt: new Date(year, month, 1),
          },
        },
      },
    },
  });

  let totalPlannedCLP = 0;
  let totalSpentCLP = 0;

  const rows: AccountRow[] = accounts.map((acc) => {
    const channelMap = new Map<string, { planned: number; spent: number }>();

    for (const bp of acc.budgetPlans) {
      const key = bp.platform;
      const current = channelMap.get(key) || { planned: 0, spent: 0 };
      current.planned += Number(bp.plannedAmount);
      channelMap.set(key, current);
    }

    for (const sr of acc.spendRecords) {
      const key = sr.platform;
      const current = channelMap.get(key) || { planned: 0, spent: 0 };
      current.spent += Number(sr.amountSpent);
      channelMap.set(key, current);
    }

    const channels: ChannelData[] = Array.from(channelMap.entries()).map(
      ([platform, data]) => {
        const ratio = data.planned > 0 ? data.spent / data.planned : 0;
        return {
          platform: platform as Platform,
          planned: data.planned,
          spent: data.spent,
          ratio,
          status: channelStatus(ratio, dayRatio),
        };
      }
    );

    const totalPlanned = channels.reduce((s, c) => s + c.planned, 0);
    const totalSpent = channels.reduce((s, c) => s + c.spent, 0);
    const ratio = totalPlanned > 0 ? totalSpent / totalPlanned : 0;

    const toCLP =
      acc.currency === "USD" ? exchangeRate : 1;
    totalPlannedCLP += totalPlanned * toCLP;
    totalSpentCLP += totalSpent * toCLP;

    return {
      id: acc.id,
      name: acc.name,
      color: acc.color,
      currency: acc.currency,
      channels,
      totalPlanned,
      totalSpent,
      ratio,
      status: channels.length > 0 ? accountStatus(channels) : "ok",
    };
  });

  // Sort: crit first, then warn, low, ok
  const order = { crit: 0, warn: 1, low: 2, ok: 3 };
  rows.sort((a, b) => order[a.status] - order[b.status]);

  const globalRatio =
    totalPlannedCLP > 0 ? totalSpentCLP / totalPlannedCLP : 0;
  const expectedCLP = totalPlannedCLP * dayRatio;
  const paceRatio = expectedCLP > 0 ? totalSpentCLP / expectedCLP : 0;

  return {
    accounts: rows,
    totalPlannedCLP,
    totalSpentCLP,
    globalRatio,
    paceRatio,
    todayDay,
    daysInMonth,
    activeCount: rows.length,
    exchangeRate,
  };
}

export interface AccountDetailData {
  account: {
    id: string;
    name: string;
    color: string;
    currency: string;
  };
  channels: (ChannelData & {
    paceRatio: number;
    paceLabel: string;
    paceKind: "ok" | "warn" | "crit" | "low";
  })[];
  totalPlanned: number;
  totalSpent: number;
  ratio: number;
  remaining: number;
  todayDay: number;
  daysInMonth: number;
  paceRatio: number;
  dailyAvg: number;
  dailySpend: {
    date: string;
    day: number;
    byPlatform: Record<string, number>;
    total: number;
    cumulative: number;
  }[];
}

export async function getAccountDetail(
  accountId: string,
  month: number,
  year: number
): Promise<AccountDetailData | null> {
  const now = new Date();
  const daysInMonth = new Date(year, month, 0).getDate();
  const todayDay =
    now.getMonth() + 1 === month && now.getFullYear() === year
      ? now.getDate()
      : month < now.getMonth() + 1 || year < now.getFullYear()
        ? daysInMonth
        : 0;
  const dayRatio = todayDay / daysInMonth;

  const account = await prisma.account.findUnique({
    where: { id: accountId },
    include: {
      budgetPlans: { where: { month, year } },
      spendRecords: {
        where: {
          date: {
            gte: new Date(year, month - 1, 1),
            lt: new Date(year, month, 1),
          },
        },
        orderBy: { date: "asc" },
      },
    },
  });

  if (!account) return null;

  const channelMap = new Map<
    string,
    { planned: number; spent: number }
  >();

  for (const bp of account.budgetPlans) {
    const key = bp.platform;
    const current = channelMap.get(key) || { planned: 0, spent: 0 };
    current.planned += Number(bp.plannedAmount);
    channelMap.set(key, current);
  }

  for (const sr of account.spendRecords) {
    const key = sr.platform;
    const current = channelMap.get(key) || { planned: 0, spent: 0 };
    current.spent += Number(sr.amountSpent);
    channelMap.set(key, current);
  }

  const channels = Array.from(channelMap.entries()).map(
    ([platform, data]) => {
      const ratio = data.planned > 0 ? data.spent / data.planned : 0;
      const expCh = data.planned * dayRatio;
      const paceCh = expCh > 0 ? data.spent / expCh : 0;
      let paceLabel = "Normal",
        paceKind: "ok" | "warn" | "crit" | "low" = "ok";
      if (paceCh > 1.5) {
        paceLabel = "Crítico";
        paceKind = "crit";
      } else if (paceCh > 1.3) {
        paceLabel = "Acelerado";
        paceKind = "warn";
      } else if (paceCh < 0.7 && dayRatio > 0.3) {
        paceLabel = "Bajo";
        paceKind = "low";
      }

      return {
        platform: platform as Platform,
        planned: data.planned,
        spent: data.spent,
        ratio,
        status: channelStatus(ratio, dayRatio),
        paceRatio: paceCh,
        paceLabel,
        paceKind,
      };
    }
  );

  const totalPlanned = channels.reduce((s, c) => s + c.planned, 0);
  const totalSpent = channels.reduce((s, c) => s + c.spent, 0);
  const ratio = totalPlanned > 0 ? totalSpent / totalPlanned : 0;
  const remaining = totalPlanned - totalSpent;
  const dailyAvg = todayDay > 0 ? totalSpent / todayDay : 0;
  const expected = totalPlanned * dayRatio;
  const paceRatio = expected > 0 ? totalSpent / expected : 0;

  // Build daily spend series (include zero-spend days up to todayDay)
  const dailyMap = new Map<
    number,
    { byPlatform: Record<string, number>; total: number }
  >();
  for (const sr of account.spendRecords) {
    const d = new Date(sr.date).getDate();
    const entry = dailyMap.get(d) || { byPlatform: {}, total: 0 };
    const amount = Number(sr.amountSpent);
    entry.byPlatform[sr.platform] =
      (entry.byPlatform[sr.platform] || 0) + amount;
    entry.total += amount;
    dailyMap.set(d, entry);
  }

  const monthShort = new Date(year, month - 1).toLocaleString("es-CL", { month: "short" });
  let cumulative = 0;
  const lastDay = todayDay > 0 ? todayDay : daysInMonth;
  const dailySpend: {
    date: string;
    day: number;
    byPlatform: Record<string, number>;
    total: number;
    cumulative: number;
  }[] = [];

  for (let d = 1; d <= lastDay; d++) {
    const entry = dailyMap.get(d) || { byPlatform: {}, total: 0 };
    cumulative += entry.total;
    dailySpend.push({
      date: `${d} ${monthShort}`,
      day: d,
      byPlatform: entry.byPlatform,
      total: entry.total,
      cumulative,
    });
  }

  return {
    account: {
      id: account.id,
      name: account.name,
      color: account.color,
      currency: account.currency,
    },
    channels,
    totalPlanned,
    totalSpent,
    ratio,
    remaining,
    todayDay,
    daysInMonth,
    paceRatio,
    dailyAvg,
    dailySpend,
  };
}
