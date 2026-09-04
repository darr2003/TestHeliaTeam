import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAccountDetail } from "@/lib/dashboard";
import { ReportPDF } from "@/lib/report-pdf";
import { isEnabled } from "@/lib/features";
import type { ReportData } from "@/app/(app)/reportes/report-document";

export async function GET(request: NextRequest) {
  if (!isEnabled("spend")) {
    return new NextResponse(null, { status: 404 });
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const accountId = searchParams.get("account_id");
  const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1), 10);
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()), 10);

  if (!accountId) {
    return NextResponse.json({ error: "account_id is required" }, { status: 400 });
  }

  const detail = await getAccountDetail(accountId, month, year);
  if (!detail) {
    return NextResponse.json({ error: "Account not found or no data" }, { status: 404 });
  }

  const alerts = await prisma.alert.findMany({
    where: {
      accountId,
      createdAt: {
        gte: new Date(year, month - 1, 1),
        lt: new Date(year, month, 1),
      },
      isDismissed: false,
    },
    orderBy: { createdAt: "desc" },
  });

  const reportData: ReportData = {
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

  const MONTH_SHORT = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
  const filename = `reporte_${detail.account.name}_${MONTH_SHORT[month - 1]}_${year}.pdf`;

  const buffer = await renderToBuffer(
    <ReportPDF data={reportData} month={month} year={year} />
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
