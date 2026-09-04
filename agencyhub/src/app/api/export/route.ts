import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isEnabled } from "@/lib/features";

const BOM = "﻿";

function csvRow(cells: (string | number)[]): string {
  return cells
    .map((c) => {
      const s = String(c);
      return s.includes(",") || s.includes('"') || s.includes("\n")
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    })
    .join(",");
}

export async function GET(request: NextRequest) {
  if (!isEnabled("spend")) {
    return new NextResponse(null, { status: 404 });
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type") || "dashboard";
  const month = parseInt(searchParams.get("m") || String(new Date().getMonth() + 1), 10);
  const year = parseInt(searchParams.get("y") || String(new Date().getFullYear()), 10);

  const daysInMonth = new Date(year, month, 0).getDate();
  const now = new Date();
  const todayDay =
    now.getMonth() + 1 === month && now.getFullYear() === year
      ? now.getDate()
      : month < now.getMonth() + 1 || year < now.getFullYear()
        ? daysInMonth
        : 0;
  const dayRatio = todayDay / daysInMonth;

  if (type === "dashboard") {
    const accounts = await prisma.account.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      include: {
        budgetPlans: { where: { month, year } },
        spendRecords: {
          where: {
            date: { gte: new Date(year, month - 1, 1), lt: new Date(year, month, 1) },
          },
        },
      },
    });

    const lines = [
      csvRow(["Cuenta", "Moneda", "Canal", "Planificado", "Gastado", "Disponible", "% Ejecución", "Ritmo", "Estado"]),
    ];

    for (const acc of accounts) {
      const channelMap = new Map<string, { planned: number; spent: number }>();
      for (const bp of acc.budgetPlans) {
        const c = channelMap.get(bp.platform) || { planned: 0, spent: 0 };
        c.planned += Number(bp.plannedAmount);
        channelMap.set(bp.platform, c);
      }
      for (const sr of acc.spendRecords) {
        const c = channelMap.get(sr.platform) || { planned: 0, spent: 0 };
        c.spent += Number(sr.amountSpent);
        channelMap.set(sr.platform, c);
      }

      for (const [platform, data] of channelMap) {
        const ratio = data.planned > 0 ? data.spent / data.planned : 0;
        const pace = dayRatio > 0 ? ratio / dayRatio : 0;
        let status = "Normal";
        if (ratio >= 1.0 || pace > 1.5) status = "Crítico";
        else if (ratio >= 0.9 || pace > 1.3) status = "Acelerado";
        else if (pace < 0.7 && dayRatio > 0.3) status = "Subgasto";

        lines.push(
          csvRow([
            acc.name,
            acc.currency,
            platform === "meta_ads" ? "Meta Ads" : "Google Ads",
            data.planned,
            Math.round(data.spent * 100) / 100,
            Math.round((data.planned - data.spent) * 100) / 100,
            `${(ratio * 100).toFixed(1)}%`,
            `${pace.toFixed(2)}x`,
            status,
          ])
        );
      }
    }

    return new NextResponse(BOM + lines.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="resumen_${month}_${year}.csv"`,
      },
    });
  }

  if (type === "daily") {
    const records = await prisma.spendRecord.findMany({
      where: {
        date: { gte: new Date(year, month - 1, 1), lt: new Date(year, month, 1) },
      },
      orderBy: [{ date: "asc" }],
      include: {
        account: { select: { name: true, currency: true } },
      },
    });

    const lines = [
      csvRow(["Fecha", "Cuenta", "Moneda", "Canal", "Gasto", "Impresiones", "Clicks", "Conversiones"]),
    ];

    for (const r of records) {
      lines.push(
        csvRow([
          new Date(r.date).toISOString().split("T")[0],
          r.account.name,
          r.account.currency,
          r.platform === "meta_ads" ? "Meta Ads" : "Google Ads",
          Number(r.amountSpent),
          r.impressions !== null ? Number(r.impressions) : "",
          r.clicks ?? "",
          r.conversions ?? "",
        ])
      );
    }

    return new NextResponse(BOM + lines.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="gasto_diario_${month}_${year}.csv"`,
      },
    });
  }

  if (type === "alerts") {
    const alerts = await prisma.alert.findMany({
      where: {
        createdAt: { gte: new Date(year, month - 1, 1), lt: new Date(year, month, 1) },
      },
      orderBy: { createdAt: "desc" },
      include: {
        account: { select: { name: true } },
      },
    });

    const lines = [
      csvRow(["Fecha", "Cuenta", "Canal", "Tipo", "Severidad", "Mensaje", "Valor umbral", "Valor actual", "Leída", "Descartada"]),
    ];

    for (const a of alerts) {
      lines.push(
        csvRow([
          a.createdAt.toISOString(),
          a.account.name,
          a.platform || "—",
          a.alertType,
          a.severity,
          a.message,
          Number(a.thresholdValue),
          Number(a.currentValue),
          a.isRead ? "Sí" : "No",
          a.isDismissed ? "Sí" : "No",
        ])
      );
    }

    return new NextResponse(BOM + lines.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="alertas_${month}_${year}.csv"`,
      },
    });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
